import type { HolidayEntry } from '../data/types';
import type { ISODate } from '../lib/date';
import type { DayStatus } from '../lib/dayStatus';
import type { DayTapHandler, SegCellInfo } from './WeekStream';

interface Props {
  iso: ISODate;
  day: number;
  weekday: number;
  status: DayStatus;
  entry: HolidayEntry | undefined;
  segInfo: SegCellInfo | undefined;
  /** 鄰月補位格（照常顯示，月界以 day-month-edge 虛線分隔） */
  outside: boolean;
  /** 區段在本列自此格起延續的格數（貼紙在該列置中用） */
  rowSpan: number;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  weekStart: 0 | 1;
  onTap: DayTapHandler;
}

function cellLabel(status: DayStatus, entry: HolidayEntry | undefined): string | null {
  if (status === 'leave') return '請假';
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
  outside,
  rowSpan,
  isToday,
  isPast,
  isSelected,
  weekStart,
  onTap,
}: Props) {
  const classes = ['day', `day-${status}`];
  if (outside) classes.push('day-outside');
  // 月份在列中間交接時，1 號左側畫虛線分隔（取代淡化上月尾）
  if (day === 1 && weekday !== weekStart) classes.push('day-month-edge');
  if (isPast) classes.push('day-past');
  if (segInfo) {
    classes.push('seg');
    // 週界斷行時色帶各自封口（列必為完整一週，不再有跨月中斷）
    if (segInfo.isStart || weekday === weekStart) classes.push('seg-start');
    if (segInfo.isEnd || weekday === (weekStart + 6) % 7) classes.push('seg-end');
  }
  if (isToday) classes.push('day-today');
  if (isSelected) classes.push('seg-selected');

  // 區段已命名 → 貼紙標籤代表整段，段內各日的假名／請假字樣一律隱藏以免雜亂
  const label = segInfo?.name ? null : cellLabel(status, entry);

  // 貼紙在區段起點與每週列的第一格出現，並在該列的區段範圍內置中
  const showName = !!segInfo?.name && (segInfo.isStart || weekday === weekStart);
  // 掛事件條的格子整格提升層級，避免被同列較後的（有 transform 的）請假格蓋住
  if (showName) classes.push('day-hosts-name');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      data-date={iso}
      onClick={() => onTap(iso, status)}
    >
      <span className="day-num">{day}</span>
      {label && <span className="day-label">{label}</span>}
      {showName && (
        <span
          className="seg-name-row"
          style={{ width: `calc(${rowSpan * 100}% + ${(rowSpan - 1) * 4}px)` }}
        >
          <span className="seg-name">{segInfo.name}</span>
        </span>
      )}
    </button>
  );
}
