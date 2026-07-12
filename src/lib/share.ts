import LZString from 'lz-string';
import type { UserPlan } from '../data/types';
import { epochDayToISO, isoToEpochDay, todayISO, toEpochDay } from './date';

/**
 * 分享連結：plan 精簡化（日期轉「距 1/1 天數」整數、欄位縮寫）
 * → JSON → lz-string base64url → 放在 hash fragment（不上伺服器、不干擾快取）。
 * 備註預設不進分享連結（常含預算等私人資訊）；
 * includeNotes=true 用於把行程轉移到自己的其他裝置。
 */

const HASH_PREFIX = '#share=';

interface PlanPayloadV1 {
  y: number;
  q: number;
  l: number[];
  /** [錨定日 offset, 連假名稱, 備註?]；備註只在 includeNotes 時存在 */
  a: [number, string, string?][];
}

interface SharePayloadV1 extends PlanPayloadV1 {
  v: 1;
  /** 1 = 備份連結（舊版單年備份的相容欄位） */
  b?: 1;
}

/** v2：多年份連結；b=1 為備份（含備註、含過去），未帶為分享（不含備註、剝除過去） */
interface PayloadV2 {
  v: 2;
  b?: 1;
  p: PlanPayloadV1[];
}

export interface DecodedShare {
  /** 分享連結恰一個年份；備份連結為所有年份 */
  plans: UserPlan[];
  /** 這條連結是「匯出備份」還是「分享給朋友」——開啟時分流顯示 */
  isBackup: boolean;
}

/**
 * @param fromDate 只納入這一天（含）以後的請假與命名——分享連結用，
 *                 避免「已過去的請假」洩漏行蹤；備份不設此參數（全部保留）
 */
function planToPayload(
  plan: UserPlan,
  includeNotes: boolean,
  fromDate?: string,
): PlanPayloadV1 {
  const jan1 = toEpochDay(plan.year, 1, 1);
  return {
    y: plan.year,
    q: plan.annualLeaveQuota,
    l: plan.leaveDays
      .filter((d) => !fromDate || d >= fromDate)
      .map((d) => isoToEpochDay(d) - jan1),
    a: plan.annotations
      .filter((a) => !fromDate || a.anchorDate >= fromDate)
      .filter((a) => a.name.trim() || (includeNotes && a.note.trim()))
      .map((a) =>
        includeNotes
          ? [isoToEpochDay(a.anchorDate) - jan1, a.name, a.note]
          : [isoToEpochDay(a.anchorDate) - jan1, a.name],
      ),
  };
}

/** 舊版單年分享編碼（保留給既有測試與相容驗證用） */
export function encodePlanToHash(plan: UserPlan, includeNotes = false): string {
  const payload: SharePayloadV1 = { v: 1, ...planToPayload(plan, includeNotes) };
  return HASH_PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

/** 分享給朋友：所有年份、不含備註、剝除今天以前的請假與命名（隱私） */
export function encodeShareHash(plans: UserPlan[]): string {
  const today = todayISO();
  const payload: PayloadV2 = {
    v: 2,
    p: plans.map((plan) => planToPayload(plan, false, today)),
  };
  return HASH_PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

/** 備份：所有年份、含備註、含過去（給自己的完整快照） */
export function encodeBackupHash(plans: UserPlan[]): string {
  const payload: PayloadV2 = {
    v: 2,
    b: 1,
    p: plans.map((plan) => planToPayload(plan, true)),
  };
  return HASH_PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

function payloadToPlan(p: Partial<PlanPayloadV1>): UserPlan | null {
  const { y, q, l, a } = p;
  if (typeof y !== 'number' || typeof q !== 'number') return null;
  if (!Array.isArray(l) || !Array.isArray(a)) return null;
  const jan1 = toEpochDay(y, 1, 1);
  return {
    version: 1,
    year: y,
    annualLeaveQuota: q,
    leaveDays: l
      .filter((n): n is number => typeof n === 'number')
      .map((n) => epochDayToISO(jan1 + n))
      .sort(),
    annotations: a
      .filter(
        (t): t is [number, string, string?] =>
          Array.isArray(t) && typeof t[0] === 'number' && typeof t[1] === 'string',
      )
      .map(([n, name, note]) => ({
        anchorDate: epochDayToISO(jan1 + n),
        name,
        note: typeof note === 'string' ? note : '',
      })),
  };
}

/** 解析 #share= hash（v1 分享／舊備份、v2 全年份備份）；損毀時回傳 null，不 throw */
export function decodeShareHash(hash: string): DecodedShare | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash.slice(HASH_PREFIX.length));
    if (!json) return null;
    const raw: unknown = JSON.parse(json);
    if (typeof raw !== 'object' || raw === null) return null;
    const v = (raw as { v?: unknown }).v;

    if (v === 2) {
      const { b, p } = raw as Partial<PayloadV2>;
      if (!Array.isArray(p)) return null;
      const plans = p
        .map((x) => (typeof x === 'object' && x !== null ? payloadToPlan(x) : null))
        .filter((x): x is UserPlan => x !== null);
      return plans.length > 0 ? { isBackup: b === 1, plans } : null;
    }

    if (v === 1) {
      const payload = raw as Partial<SharePayloadV1>;
      const plan = payloadToPlan(payload);
      return plan ? { isBackup: payload.b === 1, plans: [plan] } : null;
    }

    return null;
  } catch {
    return null;
  }
}
