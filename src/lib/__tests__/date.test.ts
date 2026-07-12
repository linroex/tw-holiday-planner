import { describe, expect, it } from 'vitest';
import {
  daysInMonth,
  epochDayToISO,
  fromEpochDay,
  isoToEpochDay,
  toEpochDay,
  weekdayOf,
} from '../date';

describe('epoch day 轉換', () => {
  it('1970-01-01 為 epoch day 0、星期四', () => {
    expect(toEpochDay(1970, 1, 1)).toBe(0);
    expect(weekdayOf(0)).toBe(4);
  });

  it('roundtrip：2026-12-01 到 2028-01-31 每一天', () => {
    for (let d = toEpochDay(2026, 12, 1); d <= toEpochDay(2028, 1, 31); d++) {
      expect(isoToEpochDay(epochDayToISO(d))).toBe(d);
    }
  });

  it('2027 關鍵日期的星期正確（對照官方日曆）', () => {
    const wd = (iso: string) => weekdayOf(isoToEpochDay(iso));
    expect(wd('2027-01-01')).toBe(5); // 五
    expect(wd('2027-02-04')).toBe(4); // 小年夜 四
    expect(wd('2027-02-28')).toBe(0); // 日
    expect(wd('2027-06-09')).toBe(3); // 端午 三
    expect(wd('2027-09-28')).toBe(2); // 教師節 二
    expect(wd('2027-12-31')).toBe(5); // 五
    expect(wd('2028-01-01')).toBe(6); // 六
  });

  it('月份天數（含閏年）', () => {
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 12)).toBe(31);
  });

  it('fromEpochDay 與 toEpochDay 互逆', () => {
    const { y, m, d } = fromEpochDay(toEpochDay(2027, 10, 10));
    expect([y, m, d]).toEqual([2027, 10, 10]);
  });
});
