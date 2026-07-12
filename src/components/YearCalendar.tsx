import { useMemo } from 'react';
import type { UserPlan } from '../data/types';
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
  plan: UserPlan;
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

export function YearCalendar({ plan, segments, selectedSegment, weekStart, onDayTap }: Props) {
  const holidayMap = getHolidayMap();
  const leaveSet = useMemo(() => new Set(plan.leaveDays), [plan.leaveDays]);

  const segMap = useMemo(() => {
    const map = new Map<ISODate, SegCellInfo>();
    for (const seg of segments) {
      const name = annotationsForSegment(seg, plan.annotations)
        .find((a) => a.name.trim())
        ?.name.trim();
      const s = isoToEpochDay(seg.start);
      const e = isoToEpochDay(seg.end);
      for (let d = s; d <= e; d++) {
        map.set(epochDayToISO(d), { seg, isStart: d === s, isEnd: d === e, name });
      }
    }
    return map;
  }, [segments, plan.annotations]);

  const todayISO = useMemo(() => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  }, []);

  // 前後各多渲染一個邊界月份，跨年連假（如 12/31–1/2）與隔年請假一目了然
  const months: { y: number; m: number; boundary: boolean }[] = [
    { y: plan.year - 1, m: 12, boundary: true },
    ...Array.from({ length: 12 }, (_, i) => ({ y: plan.year, m: i + 1, boundary: false })),
    { y: plan.year + 1, m: 1, boundary: true },
  ];

  return (
    <div className="year-calendar">
      {months.map(({ y, m, boundary }) => (
        <MonthGrid
          key={`${y}-${m}`}
          year={y}
          month={m}
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
