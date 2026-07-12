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
  it('roundtrip 深度相等', () => {
    const hash = encodePlanToHash(samplePlan);
    expect(hash.startsWith('#share=')).toBe(true);
    expect(decodeShareHash(hash)).toEqual(samplePlan);
  });

  it('中文長備註 roundtrip', () => {
    const plan: UserPlan = {
      ...samplePlan,
      annotations: [
        { anchorDate: '2027-12-25', name: '徒步環島', note: '第一天台北出發'.repeat(30) },
      ],
    };
    expect(decodeShareHash(encodePlanToHash(plan))).toEqual(plan);
  });

  it('空 plan roundtrip', () => {
    const plan: UserPlan = {
      version: 1,
      year: 2027,
      annualLeaveQuota: 7,
      leaveDays: [],
      annotations: [],
    };
    expect(decodeShareHash(encodePlanToHash(plan))).toEqual(plan);
  });

  it('壞字串回傳 null 不 throw', () => {
    expect(decodeShareHash('#share=!!!not-valid!!!')).toBeNull();
    expect(decodeShareHash('#share=')).toBeNull();
    expect(decodeShareHash('#other=abc')).toBeNull();
    expect(decodeShareHash('')).toBeNull();
    // 截斷的合法編碼
    const truncated = encodePlanToHash(samplePlan).slice(0, 20);
    expect(decodeShareHash(truncated)).toBeNull();
  });
});
