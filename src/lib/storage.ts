import type { UserPlan } from '../data/types';

const planKey = (year: number) => `thp.plan.${year}`;

export const DEFAULT_QUOTA = 7; // 勞基法年資滿三年的特休天數，首次開啟時引導使用者調整

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
}

const SETTINGS_KEY = 'thp.settings';

export function loadSettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s: unknown = JSON.parse(raw);
      if (typeof s === 'object' && s !== null) {
        const ws = (s as { weekStart?: unknown }).weekStart;
        if (ws === 0 || ws === 1) return { weekStart: ws };
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
