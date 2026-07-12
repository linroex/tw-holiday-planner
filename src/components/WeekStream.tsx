import { useMemo, Fragment } from 'react';
import type { BreakAnnotation } from '../data/types';
import { getHolidayMap } from '../data';
import { annotationsForSegment, type BreakSegment } from '../lib/breaks';
import {
  epochDayToISO,
  fromEpochDay,
  isoToEpochDay,
  todayISO,
  toEpochDay,
  weekdayOf,
  WEEKDAY_LABELS,
  type ISODate,
} from '../lib/date';
import { getDayStatus, type DayStatus } from '../lib/dayStatus';
import type { BreakSegment as Seg } from '../lib/breaks';
import { DayCell } from './DayCell';

export interface SegCellInfo {
  seg: Seg;
  isStart: boolean;
  isEnd: boolean;
  /** 使用者為此段取的行程名稱，顯示在區段起始格 */
  name?: string;
}

export type DayTapHandler = (iso: ISODate, status: DayStatus) => void;

export function monthElementId(year: number, month: number): string {
  return `month-${year}-${month}`;
}

interface Props {
  years: number[];
  leaveDays: readonly ISODate[];
  annotations: readonly BreakAnnotation[];
  segments: BreakSegment[];
  selectedSegment: BreakSegment | null;
  weekStart: 0 | 1;
  onDayTap: DayTapHandler;
}

/**
 * 版本 C：連續週流。沒有月份格，整份月曆是一條不間斷的週列，
 * 每一天恰好出現一次，連假只在週界換行、永不因月界斷裂。
 * 月份以分隔標題存在（帶 month-YYYY-M id，跳轉與捲動同步沿用）。
 */
export function WeekStream({
  years,
  leaveDays,
  annotations,
  segments,
  selectedSegment,
  weekStart,
  onDayTap,
}: Props) {
  const holidayMap = getHolidayMap();
  const leaveSet = useMemo(() => new Set(leaveDays), [leaveDays]);

  const segMap = useMemo(() => {
    const map = new Map<ISODate, SegCellInfo>();
    for (const seg of segments) {
      const name = annotationsForSegment(seg, annotations)
        .find((a) => a.name.trim())
        ?.name.trim();
      const s = isoToEpochDay(seg.start);
      const e = isoToEpochDay(seg.end);
      for (let d = s; d <= e; d++) {
        map.set(epochDayToISO(d), { seg, isStart: d === s, isEnd: d === e, name });
      }
    }
    return map;
  }, [segments, annotations]);

  const today = useMemo(() => todayISO(), []);
  const [ty, tm] = [+today.slice(0, 4), +today.slice(5, 7)];

  // 從「今天所在月的 1 號」那一週起，到最後年份的次年 1 月底
  const firstYear = years[0]!;
  const lastYear = years[years.length - 1]!;
  const rangeStart = Math.max(toEpochDay(ty, tm, 1), toEpochDay(firstYear, 1, 1));
  const rangeEnd = toEpochDay(lastYear + 1, 1, 31);
  const streamStart = rangeStart - ((weekdayOf(rangeStart) - weekStart + 7) % 7);

  const weeks: number[] = [];
  for (let d = streamStart; d <= rangeEnd; d += 7) weeks.push(d);

  return (
    <div className="week-stream">
      <div className="month-grid weekday-row stream-weekdays" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => {
          const wd = (i + weekStart) % 7;
          return (
            <div key={wd} className={`weekday${wd === 0 || wd === 6 ? ' weekday-off' : ''}`}>
              {WEEKDAY_LABELS[wd]}
            </div>
          );
        })}
      </div>
      {weeks.map((weekStartDay) => {
        // 這一週若含某月 1 號，於週列前插入月份標題（也是跳轉錨點）
        const firstOfMonth = Array.from({ length: 7 }, (_, i) => weekStartDay + i).find(
          (d) => fromEpochDay(d).d === 1,
        );
        const heading =
          firstOfMonth !== undefined ? fromEpochDay(firstOfMonth) : null;
        return (
          <Fragment key={weekStartDay}>
            {heading && (
              <h2
                className="month-title stream-month"
                id={monthElementId(heading.y, heading.m)}
              >
                {heading.y}年{heading.m}月
              </h2>
            )}
            <div className="month-grid stream-week">
              {Array.from({ length: 7 }, (_, i) => {
                const epochDay = weekStartDay + i;
                const iso = epochDayToISO(epochDay);
                const status = getDayStatus(epochDay, holidayMap, leaveSet);
                const segInfo = segMap.get(iso);
                const entry = holidayMap.get(iso);
                const rowSpan = segInfo
                  ? Math.min(isoToEpochDay(segInfo.seg.end) - epochDay, 6 - i) + 1
                  : 1;
                return (
                  <DayCell
                    key={iso}
                    iso={iso}
                    day={fromEpochDay(epochDay).d}
                    weekday={weekdayOf(epochDay)}
                    rowSpan={rowSpan}
                    status={status}
                    entry={entry?.muted ? undefined : entry}
                    segInfo={segInfo}
                    outside={false}
                    isToday={iso === today}
                    isPast={iso < today}
                    isSelected={segInfo?.seg === selectedSegment}
                    weekStart={weekStart}
                    onTap={onDayTap}
                  />
                );
              })}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
