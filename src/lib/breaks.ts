import type { BreakAnnotation, HolidayEntry } from '../data/types';
import { getHolidayMap } from '../data';
import { epochDayToISO, isoToEpochDay, toEpochDay, type ISODate } from './date';
import { getDayStatus, isDayOff } from './dayStatus';

export interface BreakSegment {
  start: ISODate;
  end: ISODate;
  totalDays: number;
  /** 區段內的請假日 */
  leaveDays: ISODate[];
  /** 區段內假日名稱（去重，含補假的本名） */
  holidayNames: string[];
  /** 備註錨定日：區段內第一個假日條目的日期，無則取區段起始日 */
  anchorDate: ISODate;
  /** 預設名稱，如「春節連假」；純請假湊出的段為「請假連休」 */
  defaultName: string;
}

/**
 * 偵測 year（至 endYear，含）年間的連續休假區段。
 * 以 epoch day 從前一年 12/1 線性掃到次年 1/31，跨月、跨年邊界對演算法透明；
 * registry 查無的年份只靠週末判斷（例如 2028/1/1、1/2 恰為週末，跨年段仍正確）。
 * 收錄條件：段落結束不早於年份區間開始，且（長度 ≥ 3、含請假日、或含國定假日）——
 * 純兩日週末不列入；完全落在次年 1 月的請假段也會成立（年底提早規劃跨年用）。
 */
export function detectBreaks(
  year: number,
  leaveDays: readonly ISODate[],
  holidayMap: Map<ISODate, HolidayEntry> = getHolidayMap(),
  endYear: number = year,
): BreakSegment[] {
  const leaveSet = new Set(leaveDays);
  const scanStart = toEpochDay(year - 1, 12, 1);
  const scanEnd = toEpochDay(endYear + 1, 1, 31);
  const yearStart = toEpochDay(year, 1, 1);

  const segments: BreakSegment[] = [];
  let runStart: number | null = null;

  // 掃到 scanEnd+1（視為上班日）以強制結算最後一段
  for (let d = scanStart; d <= scanEnd + 1; d++) {
    const off = d <= scanEnd && isDayOff(getDayStatus(d, holidayMap, leaveSet));
    if (off) {
      runStart ??= d;
      continue;
    }
    if (runStart === null) continue;

    const runEnd = d - 1;
    // 只排除「整段在年份區間開始前」的段（頭端補墊月的假期）；
    // 尾端延伸到次年 1/31 的段要保留——年底會提早規劃隔年初的跨年假
    if (runEnd >= yearStart) {
      const seg = buildSegment(runStart, runEnd, holidayMap, leaveSet);
      if (seg.totalDays >= 3 || seg.leaveDays.length > 0 || seg.holidayNames.length > 0) {
        segments.push(seg);
      }
    }
    runStart = null;
  }
  return segments;
}

function buildSegment(
  runStart: number,
  runEnd: number,
  holidayMap: Map<ISODate, HolidayEntry>,
  leaveSet: ReadonlySet<ISODate>,
): BreakSegment {
  const leave: ISODate[] = [];
  const names: string[] = [];
  let anchor: ISODate | null = null;
  let group: string | null = null;

  for (let x = runStart; x <= runEnd; x++) {
    const iso = epochDayToISO(x);
    const entry = holidayMap.get(iso);
    if (entry && entry.kind !== 'makeup-workday' && !entry.muted) {
      if (!names.includes(entry.name)) names.push(entry.name);
      anchor ??= iso;
      group ??= entry.group ?? entry.name;
    } else if (leaveSet.has(iso)) {
      leave.push(iso);
    }
  }

  const totalDays = runEnd - runStart + 1;
  return {
    start: epochDayToISO(runStart),
    end: epochDayToISO(runEnd),
    totalDays,
    leaveDays: leave,
    holidayNames: names,
    anchorDate: anchor ?? epochDayToISO(runStart),
    // 不足三天的孤立假日直接用假日本名（如「端午節」），成段的才叫「◯◯連假」
    defaultName: group ? (totalDays >= 3 ? `${group}連假` : names[0]!) : '請假連休',
  };
}

/** 區段認領錨定日落在其範圍內的備註（區段伸縮、合併後備註仍不斷鏈） */
export function annotationsForSegment(
  segment: BreakSegment,
  annotations: readonly BreakAnnotation[],
): BreakAnnotation[] {
  const s = isoToEpochDay(segment.start);
  const e = isoToEpochDay(segment.end);
  return annotations.filter((a) => {
    const n = isoToEpochDay(a.anchorDate);
    return n >= s && n <= e;
  });
}

/** 為區段選定備註錨點：優先沿用已認領備註的錨點，否則用區段的 anchorDate */
export function anchorForSegment(
  segment: BreakSegment,
  annotations: readonly BreakAnnotation[],
): ISODate {
  const existing = annotationsForSegment(segment, annotations);
  return existing[0]?.anchorDate ?? segment.anchorDate;
}
