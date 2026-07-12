import type { HolidayYearData } from './types';

/**
 * 民國115年（2026）政府行政機關辦公日曆表
 * 依行政院人事行政總處核定：全年放假 120 日，無補班日。
 * 9 個 3 日以上連假；中秋（9/25 五）＋教師節（9/28 一）夾週末成 4 天連假。
 */
export const holidays2026: HolidayYearData = {
  year: 2026,
  totalDaysOff: 120,
  entries: [
    { date: '2026-01-01', name: '開國紀念日', kind: 'holiday', group: '元旦' },

    // 春節 2/14（六）–2/22（日）九天；小年夜 2/15 適逢週日，於初四 2/20（五）補假
    { date: '2026-02-15', name: '小年夜', kind: 'holiday', group: '春節' },
    { date: '2026-02-16', name: '除夕', kind: 'holiday', group: '春節' },
    { date: '2026-02-17', name: '春節初一', kind: 'holiday', group: '春節' },
    { date: '2026-02-18', name: '春節初二', kind: 'holiday', group: '春節' },
    { date: '2026-02-19', name: '春節初三', kind: 'holiday', group: '春節' },
    { date: '2026-02-20', name: '小年夜', kind: 'makeup-holiday', group: '春節' },

    { date: '2026-02-27', name: '和平紀念日', kind: 'makeup-holiday', group: '228' },
    { date: '2026-02-28', name: '和平紀念日', kind: 'holiday', group: '228' },

    { date: '2026-04-03', name: '兒童節', kind: 'makeup-holiday', group: '清明' },
    { date: '2026-04-04', name: '兒童節', kind: 'holiday', group: '清明' },
    { date: '2026-04-05', name: '民族掃墓節', kind: 'holiday', group: '清明' },
    { date: '2026-04-06', name: '民族掃墓節', kind: 'makeup-holiday', group: '清明' },

    { date: '2026-05-01', name: '勞動節', kind: 'holiday', group: '勞動節' },

    { date: '2026-06-19', name: '端午節', kind: 'holiday', group: '端午' },

    // 中秋（五）＋週末＋教師節（一）自然連成四天
    { date: '2026-09-25', name: '中秋節', kind: 'holiday', group: '中秋教師節' },
    { date: '2026-09-28', name: '教師節', kind: 'holiday', group: '中秋教師節' },

    { date: '2026-10-09', name: '國慶日', kind: 'makeup-holiday', group: '國慶' },
    { date: '2026-10-10', name: '國慶日', kind: 'holiday', group: '國慶' },

    { date: '2026-10-25', name: '光復節', kind: 'holiday', group: '光復節' },
    { date: '2026-10-26', name: '光復節', kind: 'makeup-holiday', group: '光復節' },

    { date: '2026-12-25', name: '行憲紀念日', kind: 'holiday', group: '行憲紀念日' },
  ],
};
