import { useMemo } from 'react';
import type { BreakAnnotation } from '../data/types';
import { getHolidayMap } from '../data';
import { annotationsForSegment, type BreakSegment } from '../lib/breaks';
import { epochDayToISO, isoToEpochDay, todayISO, type ISODate } from '../lib/date';
import type { DayStatus } from '../lib/dayStatus';
import { MonthGrid } from './MonthGrid';

export interface SegCellInfo {
  seg: BreakSegment;
  isStart: boolean;
  isEnd: boolean;
  /** 使用者為此段取的行程名稱，顯示在區段起始格 */
  name?: string;
}

export type DayTapHandler = (iso: ISODate, status: DayStatus) => void;

interface Props {
  /** 連續顯示的年份（如 [2026, 2027]），前後各補一個邊界月 */
  years: number[];
  leaveDays: readonly ISODate[];
  annotations: readonly BreakAnnotation[];
  segments: BreakSegment[];
  /** 高亮中的區段（從連假清單點入時） */
  selectedSegment: BreakSegment | null;
  /** 每週起始日：0=週日、1=週一 */
  weekStart: 0 | 1;
  onDayTap: DayTapHandler;
}

export function monthElementId(year: number, month: number): string {
  return `month-${year}-${month}`;
}

export function YearCalendar({
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

  const firstYear = years[0]!;
  const lastYear = years[years.length - 1]!;

  // 前後各多渲染一個邊界月份；已整月過去的月份不顯示
  const [ty, tm] = [+today.slice(0, 4), +today.slice(5, 7)];
  const months = [
    { y: firstYear - 1, m: 12, boundary: true },
    ...years.flatMap((y) =>
      Array.from({ length: 12 }, (_, i) => ({ y, m: i + 1, boundary: false })),
    ),
    { y: lastYear + 1, m: 1, boundary: true },
  ].filter(({ y, m }) => y * 100 + m >= ty * 100 + tm);

  const titleOf = (y: number, m: number, boundary: boolean, isFirst: boolean) =>
    boundary || m === 1 || isFirst ? `${y}年${m}月` : `${m}月`;

  return (
    <div className="year-calendar">
      {months.map(({ y, m, boundary }, i) => (
        <MonthGrid
          key={`${y}-${m}`}
          year={y}
          month={m}
          title={titleOf(y, m, boundary, i === 0)}
          boundary={boundary}
          holidayMap={holidayMap}
          leaveSet={leaveSet}
          segMap={segMap}
          todayISO={today}
          selectedSegment={selectedSegment}
          weekStart={weekStart}
          onDayTap={onDayTap}
        />
      ))}
    </div>
  );
}
