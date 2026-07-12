import type { HolidayEntry } from '../data/types';
import { epochDayToISO, weekdayOf, type ISODate } from './date';

export type DayStatus =
  | 'workday'
  | 'makeup-workday' // 補班日（也是上班日，可請假）
  | 'holiday' // 國定假日或補假日
  | 'weekend'
  | 'leave'; // 使用者的請假日

/**
 * 單日分類，優先序：補班日 → 上班；假日/補假 → 放假；週末 → 放假；請假 → 放假；否則上班。
 * 補班日必須先判斷：它可能落在週六，但仍是上班日。
 */
export function getDayStatus(
  epochDay: number,
  holidayMap: Map<ISODate, HolidayEntry>,
  leaveSet: ReadonlySet<ISODate>,
): DayStatus {
  const iso = epochDayToISO(epochDay);
  const entry = holidayMap.get(iso);
  if (entry?.kind === 'makeup-workday') {
    return leaveSet.has(iso) ? 'leave' : 'makeup-workday';
  }
  // muted：落在週末的假日不特別標示，往下走會落入週末分支（仍是放假日）
  if (entry && !entry.muted) return 'holiday';
  const wd = weekdayOf(epochDay);
  if (wd === 0 || wd === 6) return 'weekend';
  if (leaveSet.has(iso)) return 'leave';
  return 'workday';
}

export function isDayOff(status: DayStatus): boolean {
  return status === 'holiday' || status === 'weekend' || status === 'leave';
}

export function isMarkable(status: DayStatus): boolean {
  return status === 'workday' || status === 'makeup-workday' || status === 'leave';
}
