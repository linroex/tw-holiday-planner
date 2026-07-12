import type { HolidayEntry, HolidayYearData } from './types';
import type { ISODate } from '../lib/date';
import { holidays2027 } from './holidays-2027';

/** 新增年份時：加一個 holidays-XXXX.ts 檔，在這裡註冊一行即可 */
export const holidayRegistry: Record<number, HolidayYearData> = {
  2027: holidays2027,
};

export const SUPPORTED_YEARS = Object.keys(holidayRegistry)
  .map(Number)
  .sort((a, b) => a - b);

let cachedMap: Map<ISODate, HolidayEntry> | null = null;

/** 所有已註冊年份的假日條目，以日期為 key */
export function getHolidayMap(): Map<ISODate, HolidayEntry> {
  if (!cachedMap) {
    cachedMap = new Map();
    for (const data of Object.values(holidayRegistry)) {
      for (const entry of data.entries) cachedMap.set(entry.date, entry);
    }
  }
  return cachedMap;
}
