import type { HolidayEntry } from '../data/types';
import type { ISODate } from '../lib/date';
import type { DayStatus } from '../lib/dayStatus';
import type { DayTapHandler, SegCellInfo } from './YearCalendar';

interface Props {
  iso: ISODate;
  day: number;
  weekday: number;
  status: DayStatus;
  entry: HolidayEntry | undefined;
  segInfo: SegCellInfo | undefined;
  /** 該月第一天／最後一天：連假跨月時色帶改為漸層延續而非封口 */
  isMonthStart: boolean;
  isMonthEnd: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  weekStart: 0 | 1;
  onTap: DayTapHandler;
}

function cellLabel(status: DayStatus, entry: HolidayEntry | undefined): string | null {
  if (status === 'leave') return '特休';
  if (status === 'makeup-workday') return '補班';
  if (!entry) return null;
  return entry.kind === 'makeup-holiday' ? '補假' : entry.name;
}

export function DayCell({
  iso,
  day,
  weekday,
  status,
  entry,
  segInfo,
  isMonthStart,
  isMonthEnd,
  isToday,
  isPast,
  isSelected,
  weekStart,
  onTap,
}: Props) {
  const classes = ['day', `day-${status}`];
  if (isPast) classes.push('day-past');
  if (segInfo) {
    classes.push('seg');
    // 週界斷行時色帶各自封口
    if (segInfo.isStart || weekday === weekStart) classes.push('seg-start');
    if (segInfo.isEnd || weekday === (weekStart + 6) % 7) classes.push('seg-end');
    // 跨月延續：月界處不封口，改為漸層淡出／淡入
    if (isMonthEnd && !segInfo.isEnd) classes.push('seg-cont-right');
    if (isMonthStart && !segInfo.isStart) classes.push('seg-cont-left');
  }
  if (isToday) classes.push('day-today');
  if (isSelected) classes.push('seg-selected');

  const label = cellLabel(status, entry);

  return (
    <button type="button" className={classes.join(' ')} onClick={() => onTap(iso, status)}>
      <span className="day-num">{day}</span>
      {label && <span className="day-label">{label}</span>}
      {segInfo?.isStart && segInfo.name && <span className="seg-name">{segInfo.name}</span>}
    </button>
  );
}
