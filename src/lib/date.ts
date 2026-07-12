/**
 * 日期一律以「epoch day 整數」（自 1970-01-01 起的天數）運算，
 * 'YYYY-MM-DD' 字串僅作為 key 與顯示，全程不經過 Date 物件，避免時區陷阱。
 * 演算法為標準 civil-date 轉換（Howard Hinnant, days_from_civil / civil_from_days）。
 */

export type ISODate = string; // 'YYYY-MM-DD'

export function toEpochDay(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor((yy >= 0 ? yy : yy - 399) / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromEpochDay(n: number): { y: number; m: number; d: number } {
  const z = n + 719468;
  const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const yy = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: m <= 2 ? yy + 1 : yy, m, d };
}

export function isoToEpochDay(iso: ISODate): number {
  return toEpochDay(+iso.slice(0, 4), +iso.slice(5, 7), +iso.slice(8, 10));
}

export function epochDayToISO(n: number): ISODate {
  const { y, m, d } = fromEpochDay(n);
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 0=日、1=一 … 6=六（1970-01-01 為星期四） */
export function weekdayOf(epochDay: number): number {
  return ((epochDay % 7) + 7 + 4) % 7;
}

export function daysInMonth(y: number, m: number): number {
  const next = m === 12 ? toEpochDay(y + 1, 1, 1) : toEpochDay(y, m + 1, 1);
  return next - toEpochDay(y, m, 1);
}

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

/** '2027-04-03' → '4/3（六）' */
export function formatShort(iso: ISODate): string {
  const n = isoToEpochDay(iso);
  const { m, d } = fromEpochDay(n);
  return `${m}/${d}（${WEEKDAY_LABELS[weekdayOf(n)]}）`;
}
