import LZString from 'lz-string';
import type { UserPlan } from '../data/types';
import { epochDayToISO, isoToEpochDay, toEpochDay } from './date';

/**
 * 分享連結：plan 精簡化（日期轉「距 1/1 天數」整數、欄位縮寫）
 * → JSON → lz-string base64url → 放在 hash fragment（不上伺服器、不干擾快取）。
 * 備註預設不進分享連結（常含預算等私人資訊）；
 * includeNotes=true 用於把行程轉移到自己的其他裝置。
 */

const HASH_PREFIX = '#share=';

interface SharePayloadV1 {
  v: 1;
  y: number;
  q: number;
  l: number[];
  /** [錨定日 offset, 連假名稱, 備註?]；備註只在 includeNotes 時存在 */
  a: [number, string, string?][];
}

export function encodePlanToHash(plan: UserPlan, includeNotes = false): string {
  const jan1 = toEpochDay(plan.year, 1, 1);
  const payload: SharePayloadV1 = {
    v: 1,
    y: plan.year,
    q: plan.annualLeaveQuota,
    l: plan.leaveDays.map((d) => isoToEpochDay(d) - jan1),
    a: plan.annotations
      .filter((a) => a.name.trim() || (includeNotes && a.note.trim()))
      .map((a) =>
        includeNotes
          ? [isoToEpochDay(a.anchorDate) - jan1, a.name, a.note]
          : [isoToEpochDay(a.anchorDate) - jan1, a.name],
      ),
  };
  return HASH_PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

/** 解析 #share= hash；格式不符或資料損毀時回傳 null，不 throw */
export function decodeShareHash(hash: string): UserPlan | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash.slice(HASH_PREFIX.length));
    if (!json) return null;
    const p: unknown = JSON.parse(json);
    if (typeof p !== 'object' || p === null) return null;
    const { v, y, q, l, a } = p as Partial<SharePayloadV1>;
    if (v !== 1 || typeof y !== 'number' || typeof q !== 'number') return null;
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
  } catch {
    return null;
  }
}
