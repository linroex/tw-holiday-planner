import type { ISODate } from '../lib/date';

export type HolidayKind =
  | 'holiday' // 國定假日當天
  | 'makeup-holiday' // 補假日
  | 'makeup-workday'; // 補班日（2027 沒有，schema 保留給其他年份）

export interface HolidayEntry {
  date: ISODate;
  /** 假日本名，補假日也存本名（顯示時依 kind 加註「補假」） */
  name: string;
  kind: HolidayKind;
  /** 同一波連假的統稱，用於產生預設連假名稱（如「春節」） */
  group?: string;
  /** 落在週末、且不想特別標示的假日（如勞動節逢週六）：月曆上當一般週末顯示 */
  muted?: boolean;
}

export interface HolidayYearData {
  year: number;
  /** 官方核定全年放假日數，供單元測試自我驗證 */
  totalDaysOff: number;
  entries: HolidayEntry[];
}

export interface BreakAnnotation {
  /** 錨定日：建立當下區段內第一個國定假日（無則取區段起始日），區段伸縮時備註不斷鏈 */
  anchorDate: ISODate;
  name: string;
  note: string;
}

export interface UserPlan {
  version: 1;
  year: number;
  /** 年度請假預算（特休、補休等都算，規劃參考用） */
  annualLeaveQuota: number;
  /** 請假日，排序後儲存 */
  leaveDays: ISODate[];
  annotations: BreakAnnotation[];
}
