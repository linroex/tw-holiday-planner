import type { HolidayYearData } from './types';

/**
 * 民國116年（2027）政府行政機關辦公日曆表
 * 依行政院人事行政總處核定：全年放假 121 日，無補班日。
 * https://www.dgpa.gov.tw/information?uid=82&pid=12983
 */
export const holidays2027: HolidayYearData = {
  year: 2027,
  totalDaysOff: 121,
  entries: [
    { date: '2027-01-01', name: '開國紀念日', kind: 'holiday', group: '元旦' },

    { date: '2027-02-04', name: '小年夜', kind: 'holiday', group: '春節' },
    { date: '2027-02-05', name: '除夕', kind: 'holiday', group: '春節' },
    { date: '2027-02-06', name: '春節初一', kind: 'holiday', group: '春節' },
    { date: '2027-02-07', name: '春節初二', kind: 'holiday', group: '春節' },
    { date: '2027-02-08', name: '春節初三', kind: 'holiday', group: '春節' },
    { date: '2027-02-09', name: '春節初一', kind: 'makeup-holiday', group: '春節' },
    { date: '2027-02-10', name: '春節初二', kind: 'makeup-holiday', group: '春節' },

    { date: '2027-02-28', name: '和平紀念日', kind: 'holiday', group: '228' },
    { date: '2027-03-01', name: '和平紀念日', kind: 'makeup-holiday', group: '228' },

    { date: '2027-04-04', name: '兒童節', kind: 'holiday', group: '清明' },
    { date: '2027-04-05', name: '民族掃墓節', kind: 'holiday', group: '清明' },
    { date: '2027-04-06', name: '兒童節', kind: 'makeup-holiday', group: '清明' },

    { date: '2027-04-30', name: '勞動節', kind: 'makeup-holiday', group: '勞動節' },
    { date: '2027-05-01', name: '勞動節', kind: 'holiday', group: '勞動節' },

    { date: '2027-06-09', name: '端午節', kind: 'holiday', group: '端午' },
    { date: '2027-09-15', name: '中秋節', kind: 'holiday', group: '中秋' },
    { date: '2027-09-28', name: '教師節', kind: 'holiday', group: '教師節' },

    { date: '2027-10-10', name: '國慶日', kind: 'holiday', group: '國慶' },
    { date: '2027-10-11', name: '國慶日', kind: 'makeup-holiday', group: '國慶' },

    { date: '2027-10-25', name: '光復節', kind: 'holiday', group: '光復節' },

    { date: '2027-12-24', name: '行憲紀念日', kind: 'makeup-holiday', group: '行憲紀念日' },
    { date: '2027-12-25', name: '行憲紀念日', kind: 'holiday', group: '行憲紀念日' },

    // 2028/1/1 開國紀念日適逢週六，於 116/12/31（五）補假
    { date: '2027-12-31', name: '開國紀念日', kind: 'makeup-holiday', group: '跨年' },
  ],
};
