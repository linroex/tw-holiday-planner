import { describe, expect, it } from 'vitest';
import type { UserPlan } from '../../data/types';
import { detectBreaks } from '../breaks';
import { buildICS } from '../calendar';

const plan: UserPlan = {
  version: 1,
  year: 2027,
  annualLeaveQuota: 10,
  leaveDays: ['2027-04-07', '2027-04-08', '2027-04-09'],
  annotations: [
    { anchorDate: '2027-04-04', name: '澳洲', note: '直飛布里斯本\n預算 6 萬' },
  ],
};

describe('buildICS', () => {
  const segments = detectBreaks(plan.year, plan.leaveDays);
  const ics = buildICS([plan], segments);

  it('只匯出有命名或有請假的段（清明澳洲段一筆）', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('SUMMARY:澳洲');
  });

  it('全天事件：DTEND 為結束日次日（exclusive）', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20270403');
    expect(ics).toContain('DTEND;VALUE=DATE:20270412'); // 4/11 的次日
  });

  it('備註換行與特殊字元正確跳脫（先展開 RFC 5545 折行）', () => {
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('直飛布里斯本\\n預算 6 萬');
  });

  it('結構完整', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });
});
