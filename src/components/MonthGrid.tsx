import type { HolidayEntry } from '../data/types';
import type { BreakSegment } from '../lib/breaks';
import {
  daysInMonth,
  epochDayToISO,
  fromEpochDay,
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
  // 頭尾補上鄰月日期（淡化），每一列都是完整的一週——跨月連假不再斷裂
  const leading = (weekdayOf(firstDay) - weekStart + 7) % 7;
  const totalCells = Math.ceil((leading + numDays) / 7) * 7;
  const gridStart = firstDay - leading;

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
        {Array.from({ length: totalCells }, (_, idx) => {
          const epochDay = gridStart + idx;
          const iso = epochDayToISO(epochDay);
          const outside = epochDay < firstDay || epochDay >= firstDay + numDays;
          const status = getDayStatus(epochDay, holidayMap, leaveSet);
          const segInfo = segMap.get(iso);
          const entry = holidayMap.get(iso);
          // 此格起算，區段在本列還延續幾格（列必為完整一週，只受區段結尾與週界限制）
          const rowSpan = segInfo
            ? Math.min(isoToEpochDay(segInfo.seg.end) - epochDay, 6 - (idx % 7)) + 1
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
              outside={outside}
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
