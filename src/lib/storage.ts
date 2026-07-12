import type { UserPlan } from '../data/types';

const planKey = (year: number) => `thp.plan.${year}`;

export const DEFAULT_QUOTA = 7; // 預設請假預算（參考勞基法滿三年特休），首次開啟時引導使用者調整

export function defaultPlan(year: number): UserPlan {
  return { version: 1, year, annualLeaveQuota: DEFAULT_QUOTA, leaveDays: [], annotations: [] };
}

export function loadPlan(year: number): UserPlan | null {
  try {
    const raw = localStorage.getItem(planKey(year));
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    if (typeof p !== 'object' || p === null) return null;
    const plan = p as Partial<UserPlan>;
    if (plan.version !== 1 || plan.year !== year) return null;
    return {
      version: 1,
      year,
      annualLeaveQuota:
        typeof plan.annualLeaveQuota === 'number' ? plan.annualLeaveQuota : DEFAULT_QUOTA,
      leaveDays: Array.isArray(plan.leaveDays)
        ? plan.leaveDays.filter((d): d is string => typeof d === 'string').sort()
        : [],
      annotations: Array.isArray(plan.annotations)
        ? plan.annotations.filter(
            (a): a is UserPlan['annotations'][number] =>
              typeof a === 'object' && a !== null &&
              typeof (a as { anchorDate?: unknown }).anchorDate === 'string',
          )
        : [],
    };
  } catch {
    return null;
  }
}

/** 顯示偏好（不進分享連結：這是看的人的偏好，不是規劃內容） */
export interface DisplaySettings {
  /** 每週起始日：0=週日、1=週一 */
  weekStart: 0 | 1;
  /** 上次規劃的年份，下次開啟時回到同一年 */
  lastYear?: number;
}

const SETTINGS_KEY = 'thp.settings';

export function loadSettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s: unknown = JSON.parse(raw);
      if (typeof s === 'object' && s !== null) {
        const { weekStart, lastYear } = s as { weekStart?: unknown; lastYear?: unknown };
        return {
          weekStart: weekStart === 0 || weekStart === 1 ? weekStart : 1,
          ...(typeof lastYear === 'number' ? { lastYear } : {}),
        };
      }
    }
  } catch {
    // 損毀時走預設
  }
  return { weekStart: 1 };
}

export function saveSettings(settings: DisplaySettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 靜默失敗
  }
}

export function savePlan(plan: UserPlan): void {
  try {
    localStorage.setItem(planKey(plan.year), JSON.stringify(plan));
  } catch {
    // 私密模式或空間不足時靜默失敗，App 仍可離線操作
  }
}

/**
 * 向瀏覽器申請持久儲存：防止空間壓力下的配額回收（Chrome/Firefox/Android 有效）。
 * 注意：擋不住 Safari ITP 的七天刪除——Apple 只接受「加入主畫面」這種使用者
 * 主動手勢作為豁免，不接受腳本自行申請（否則追蹤器都會呼叫它），
 * 見 https://bugs.webkit.org/show_bug.cgi?id=209563 。
 * iOS Safari 的防護是備份提示卡（提醒匯出備份連結）；手動清除也只能靠備份連結還原。
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // 不支援或被拒都靜默，App 照常運作
  }
}

/** 完整重置：清掉所有年份的規劃與顯示偏好，回到全新狀態 */
export function clearAllData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('thp.')) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // 靜默失敗
  }
}
