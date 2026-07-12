import type { HolidayEntry } from '../data/types';
import type { BreakSegment } from '../lib/breaks';
import {
  daysInMonth,
  isoToEpochDay,
  toEpochDay,
  weekdayOf,
  WEEKDAY_LABELS,
  type ISODate,
} from '../lib/date';
import { getDayStatus } from '../lib/dayStatus';
import { DayCell } from './DayCell';
import { monthElementId, type DayTapHandler, type SegCellInfo } from './YearCalendar';

interface Props {
  year: number;
  month: number;
  /** 顯示標題（含或不含年份由呼叫端決定） */
  title: string;
  /** 邊界月份（範圍外的前一年 12 月／次年 1 月），樣式較淡 */
  boundary?: boolean;
  holidayMap: Map<ISODate, HolidayEntry>;
  leaveSet: ReadonlySet<ISODate>;
  segMap: Map<ISODate, SegCellInfo>;
  todayISO: ISODate;
  selectedSegment: BreakSegment | null;
  weekStart: 0 | 1;
  onDayTap: DayTapHandler;
}

export function MonthGrid({
  year,
  month,
  title,
  boundary,
  holidayMap,
  leaveSet,
  segMap,
  todayISO,
  selectedSegment,
  weekStart,
  onDayTap,
}: Props) {
  const firstDay = toEpochDay(year, month, 1);
  const numDays = daysInMonth(year, month);
  const leadingBlanks = (weekdayOf(firstDay) - weekStart + 7) % 7;

  return (
    <section
      className={`month${boundary ? ' month-boundary' : ''}`}
      id={monthElementId(year, month)}
    >
      <h2 className="month-title">{title}</h2>
      <div className="month-grid weekday-row" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => {
          const wd = (i + weekStart) % 7;
          return (
            <div key={wd} className={`weekday${wd === 0 || wd === 6 ? ' weekday-off' : ''}`}>
              {WEEKDAY_LABELS[wd]}
            </div>
          );
        })}
      </div>
      <div className="month-grid">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: numDays }, (_, i) => {
          const epochDay = firstDay + i;
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
          const status = getDayStatus(epochDay, holidayMap, leaveSet);
          const segInfo = segMap.get(iso);
          const entry = holidayMap.get(iso);
          const wd = weekdayOf(epochDay);
          // 此格起算，區段在本列還延續幾格（受區段結尾／週界／月界限制）——貼紙置中用
          const rowSpan = segInfo
            ? Math.min(
                isoToEpochDay(segInfo.seg.end) - epochDay,
                (weekStart + 6 - wd + 7) % 7,
                numDays - 1 - i,
              ) + 1
            : 1;
          return (
            <DayCell
              key={iso}
              iso={iso}
              day={i + 1}
              weekday={wd}
              rowSpan={rowSpan}
              status={status}
              entry={entry?.muted ? undefined : entry}
              segInfo={segInfo}
              isMonthStart={i === 0}
              isMonthEnd={i === numDays - 1}
              isToday={iso === todayISO}
              isPast={iso < todayISO}
              isSelected={segInfo?.seg === selectedSegment}
              weekStart={weekStart}
              onTap={onDayTap}
            />
          );
        })}
      </div>
    </section>
  );
}
