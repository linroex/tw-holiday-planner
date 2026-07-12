import { describe, expect, it } from 'vitest';
import { getHolidayMap } from '../../data';
import { holidays2027 } from '../../data/holidays-2027';
import { toEpochDay } from '../date';
import { getDayStatus, isDayOff } from '../dayStatus';
import { annotationsForSegment, detectBreaks, type BreakSegment } from '../breaks';

const EMPTY = new Set<string>();

function findSeg(segs: BreakSegment[], start: string): BreakSegment | undefined {
  return segs.find((s) => s.start === start);
}

describe('2027 假日資料自我驗證', () => {
  it('全年放假日數等於官方核定的 121 日', () => {
    const map = getHolidayMap();
    let count = 0;
    for (let d = toEpochDay(2027, 1, 1); d <= toEpochDay(2027, 12, 31); d++) {
      if (isDayOff(getDayStatus(d, map, EMPTY))) count++;
    }
    expect(count).toBe(holidays2027.totalDaysOff);
  });
});

describe('detectBreaks — 空 plan 基準段', () => {
  const segs = detectBreaks(2027, []);

  it('產出官方公告的九個 3 日以上連假＋三個週間單日假', () => {
    const expected: [string, string, number][] = [
      ['2027-01-01', '2027-01-03', 3], // 元旦
      ['2027-02-04', '2027-02-10', 7], // 春節
      ['2027-02-27', '2027-03-01', 3], // 228
      ['2027-04-03', '2027-04-06', 4], // 清明兒童節
      ['2027-04-30', '2027-05-02', 3], // 勞動節
      ['2027-06-09', '2027-06-09', 1], // 端午（週三，單日）
      ['2027-09-15', '2027-09-15', 1], // 中秋（週三，單日）
      ['2027-09-28', '2027-09-28', 1], // 教師節（週二，單日）
      ['2027-10-09', '2027-10-11', 3], // 國慶
      ['2027-10-23', '2027-10-25', 3], // 光復節
      ['2027-12-24', '2027-12-26', 3], // 行憲紀念日
      ['2027-12-31', '2028-01-02', 3], // 跨年（跨年份邊界）
    ];
    for (const [start, end, days] of expected) {
      const seg = findSeg(segs, start);
      expect(seg, `應存在起於 ${start} 的連假段`).toBeDefined();
      expect(seg!.end).toBe(end);
      expect(seg!.totalDays).toBe(days);
    }
    expect(segs).toHaveLength(expected.length);
  });

  it('預設名稱：成段用「◯◯連假」，週間單日假用假日本名', () => {
    expect(findSeg(segs, '2027-02-04')!.defaultName).toBe('春節連假');
    expect(findSeg(segs, '2027-01-01')!.defaultName).toBe('元旦連假');
    expect(findSeg(segs, '2027-12-31')!.defaultName).toBe('跨年連假');
    expect(findSeg(segs, '2027-06-09')!.defaultName).toBe('端午節');
    expect(findSeg(segs, '2027-09-28')!.defaultName).toBe('教師節');
  });
});

describe('detectBreaks — 請假橋接', () => {
  it('端午（週三）前請一、二 → 6/5–6/9 五天', () => {
    const segs = detectBreaks(2027, ['2027-06-07', '2027-06-08']);
    const seg = findSeg(segs, '2027-06-05')!;
    expect(seg.end).toBe('2027-06-09');
    expect(seg.totalDays).toBe(5);
    expect(seg.leaveDays).toEqual(['2027-06-07', '2027-06-08']);
  });

  it('清明連假後請三、四、五 → 4/3–4/11 九天', () => {
    const segs = detectBreaks(2027, ['2027-04-07', '2027-04-08', '2027-04-09']);
    const seg = findSeg(segs, '2027-04-03')!;
    expect(seg.end).toBe('2027-04-11');
    expect(seg.totalDays).toBe(9);
  });

  it('春節後請四、五 → 2/4–2/14 十一天', () => {
    const segs = detectBreaks(2027, ['2027-02-11', '2027-02-12']);
    const seg = findSeg(segs, '2027-02-04')!;
    expect(seg.end).toBe('2027-02-14');
    expect(seg.totalDays).toBe(11);
  });

  it('請 12/27–12/30 → 行憲與跨年合併為 12/24–2028/1/2 十天', () => {
    const segs = detectBreaks(2027, [
      '2027-12-27',
      '2027-12-28',
      '2027-12-29',
      '2027-12-30',
    ]);
    const seg = findSeg(segs, '2027-12-24')!;
    expect(seg.end).toBe('2028-01-02');
    expect(seg.totalDays).toBe(10);
    expect(seg.leaveDays).toHaveLength(4);
  });

  it('平常週五請假（前後無假日）→ 週五–週日三天，名稱為請假連休', () => {
    const segs = detectBreaks(2027, ['2027-07-16']);
    const seg = findSeg(segs, '2027-07-16')!;
    expect(seg.end).toBe('2027-07-18');
    expect(seg.totalDays).toBe(3);
    expect(seg.defaultName).toBe('請假連休');
  });

  it('取消請假後區段分裂回原狀', () => {
    const before = detectBreaks(2027, ['2027-12-27', '2027-12-28', '2027-12-29', '2027-12-30']);
    expect(findSeg(before, '2027-12-24')!.totalDays).toBe(10);
    const after = detectBreaks(2027, []);
    expect(findSeg(after, '2027-12-24')!.totalDays).toBe(3);
    expect(findSeg(after, '2027-12-31')!.totalDays).toBe(3);
  });
});

describe('備註錨定', () => {
  it('區段延伸後備註仍被認領', () => {
    const ann = [{ anchorDate: '2027-04-04', name: '澳洲', note: '機票已看好' }];
    // 原始 4/3–4/6
    const seg1 = findSeg(detectBreaks(2027, []), '2027-04-03')!;
    expect(annotationsForSegment(seg1, ann)).toHaveLength(1);
    // 延伸為 4/3–4/11
    const seg2 = findSeg(
      detectBreaks(2027, ['2027-04-07', '2027-04-08', '2027-04-09']),
      '2027-04-03',
    )!;
    expect(annotationsForSegment(seg2, ann)).toHaveLength(1);
  });

  it('合併後兩段的備註都被同一段認領', () => {
    const ann = [
      { anchorDate: '2027-12-25', name: '聖誕', note: '' },
      { anchorDate: '2027-12-31', name: '徒步', note: '' },
    ];
    const merged = findSeg(
      detectBreaks(2027, ['2027-12-27', '2027-12-28', '2027-12-29', '2027-12-30']),
      '2027-12-24',
    )!;
    expect(annotationsForSegment(merged, ann)).toHaveLength(2);
  });
});
