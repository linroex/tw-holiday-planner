import { describe, expect, it } from 'vitest';
import type { UserPlan } from '../../data/types';
import { decodeShareHash, encodePlanToHash } from '../share';

const samplePlan: UserPlan = {
  version: 1,
  year: 2027,
  annualLeaveQuota: 10,
  leaveDays: ['2027-02-11', '2027-02-12', '2027-04-07', '2027-04-08', '2027-04-09'],
  annotations: [
    { anchorDate: '2027-04-04', name: '澳洲', note: '長榮直飛布里斯本，預算 6 萬，住宿找 Airbnb' },
    { anchorDate: '2027-02-04', name: '機車旅行', note: '' },
  ],
};

describe('分享連結編解碼', () => {
  it('roundtrip：請假日與連假名稱保留，備註不進分享連結', () => {
    const hash = encodePlanToHash(samplePlan);
    expect(hash.startsWith('#share=')).toBe(true);
    const { plan: decoded, isBackup } = decodeShareHash(hash)!;
    expect(isBackup).toBe(false);
    expect(decoded.year).toBe(2027);
    expect(decoded.annualLeaveQuota).toBe(10);
    expect(decoded.leaveDays).toEqual(samplePlan.leaveDays);
    expect(decoded.annotations).toEqual([
      { anchorDate: '2027-04-04', name: '澳洲', note: '' }, // 備註被剝除
      { anchorDate: '2027-02-04', name: '機車旅行', note: '' },
    ]);
    expect(hash).not.toContain('布里斯本');
  });

  it('includeNotes=true 時備註完整保留（轉移到其他裝置用）', () => {
    const decoded = decodeShareHash(encodePlanToHash(samplePlan, true))!;
    expect(decoded.plan.annotations).toEqual(samplePlan.annotations);
  });

  it('備份連結帶 isBackup 標記；分享與舊版連結為 false', () => {
    const backup = decodeShareHash(encodePlanToHash(samplePlan, true, 'backup'))!;
    expect(backup.isBackup).toBe(true);
    expect(backup.plan.annotations).toEqual(samplePlan.annotations);
    const share = decodeShareHash(encodePlanToHash(samplePlan, false, 'share'))!;
    expect(share.isBackup).toBe(false);
  });

  it('只有備註沒有名稱的 annotation 不進分享連結', () => {
    const plan: UserPlan = {
      ...samplePlan,
      annotations: [{ anchorDate: '2027-06-09', name: '', note: '私人備忘' }],
    };
    expect(decodeShareHash(encodePlanToHash(plan))!.plan.annotations).toEqual([]);
  });

  it('舊版三元組（含備註）連結仍可解碼', async () => {
    // 手工模擬舊版 payload 格式
    const LZString = (await import('lz-string')).default;
    const legacy =
      '#share=' +
      LZString.compressToEncodedURIComponent(
        JSON.stringify({ v: 1, y: 2027, q: 7, l: [], a: [[93, '澳洲', '舊備註']] }),
      );
    const decoded = decodeShareHash(legacy)!;
    expect(decoded.isBackup).toBe(false);
    expect(decoded.plan.annotations).toEqual([
      { anchorDate: '2027-04-04', name: '澳洲', note: '舊備註' },
    ]);
  });

  it('空 plan roundtrip', () => {
    const plan: UserPlan = {
      version: 1,
      year: 2027,
      annualLeaveQuota: 7,
      leaveDays: [],
      annotations: [],
    };
    expect(decodeShareHash(encodePlanToHash(plan))!.plan).toEqual(plan);
  });

  it('壞字串回傳 null 不 throw', () => {
    expect(decodeShareHash('#share=!!!not-valid!!!')).toBeNull();
    expect(decodeShareHash('#share=')).toBeNull();
    expect(decodeShareHash('#other=abc')).toBeNull();
    expect(decodeShareHash('')).toBeNull();
    const truncated = encodePlanToHash(samplePlan).slice(0, 20);
    expect(decodeShareHash(truncated)).toBeNull();
  });
});
