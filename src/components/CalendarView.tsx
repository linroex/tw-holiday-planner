import { useEffect, useState } from 'react';
import type { BreakAnnotation } from '../data/types';
import type { BreakSegment } from '../lib/breaks';
import type { ISODate } from '../lib/date';
import { WeekStream, type DayTapHandler } from './WeekStream';
import { YearCalendar } from './YearCalendar';

interface Props {
  years: number[];
  leaveDays: readonly ISODate[];
  annotations: readonly BreakAnnotation[];
  segments: BreakSegment[];
  selectedSegment: BreakSegment | null;
  weekStart: 0 | 1;
  onDayTap: DayTapHandler;
}

const DESKTOP_QUERY = '(min-width: 900px)';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

/**
 * 月曆檢視分流：手機＝連續週流（跨月零斷裂）；
 * 電腦（≥900px）＝填滿式月份格＋多欄整年總覽。
 * 兩者共用 DayCell 與 month-YYYY-M 錨點，跳轉／捲動同步通用。
 */
export function CalendarView(props: Props) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <YearCalendar {...props} /> : <WeekStream {...props} />;
}
