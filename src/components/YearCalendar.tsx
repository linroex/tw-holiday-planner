import { useMemo } from 'react';
import type { BreakAnnotation } from '../data/types';
import { getHolidayMap } from '../data';
import { annotationsForSegment, type BreakSegment } from '../lib/breaks';
import { epochDayToISO, isoToEpochDay, type ISODate } from '../lib/date';
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

  const todayISO = useMemo(() => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  }, []);

  const firstYear = years[0]!;
  const lastYear = years[years.length - 1]!;

  // 前後各多渲染一個邊界月份；跨年連假與隔年請假一目了然
  const months: { y: number; m: number; boundary: boolean }[] = [
    { y: firstYear - 1, m: 12, boundary: true },
    ...years.flatMap((y) =>
      Array.from({ length: 12 }, (_, i) => ({ y, m: i + 1, boundary: false })),
    ),
    { y: lastYear + 1, m: 1, boundary: true },
  ];

  const titleOf = (y: number, m: number, boundary: boolean) =>
    boundary || m === 1 ? `${y}年${m}月` : `${m}月`;

  return (
    <div className="year-calendar">
      {months.map(({ y, m, boundary }) => (
        <MonthGrid
          key={`${y}-${m}`}
          year={y}
          month={m}
          title={titleOf(y, m, boundary)}
          boundary={boundary}
          holidayMap={holidayMap}
          leaveSet={leaveSet}
          segMap={segMap}
          todayISO={todayISO}
          selectedSegment={selectedSegment}
          weekStart={weekStart}
          onDayTap={onDayTap}
        />
      ))}
    </div>
  );
}
