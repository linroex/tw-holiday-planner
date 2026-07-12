import { useState } from 'react';
import { decodeShareHash } from './lib/share';
import { loadPlan, savePlan } from './lib/storage';
import { PlanProvider } from './state/PlanContext';
import { Planner } from './components/Planner';
import { ShareView } from './components/ShareView';

export default function App() {
  const [decoded] = useState(() => {
    const d = decodeShareHash(location.hash);
    if (d?.isBackup) {
      // 備份連結只為了救回被 Safari 清掉的資料：
      // 本機是空的 → 自動還原；本機有資料 → 直接用本機的（要回滾請先清除資料）
      const allEmpty = d.plans.every((plan) => {
        const existing = loadPlan(plan.year);
        return (
          !existing || (existing.leaveDays.length === 0 && existing.annotations.length === 0)
        );
      });
      if (allEmpty) {
        for (const plan of d.plans) savePlan(plan);
      } else {
        sessionStorage.setItem('thp.backup-skipped', '1');
      }
      history.replaceState(null, '', location.pathname + location.search);
      return null;
    }
    return d;
  });
  const [decodeFailed] = useState(() => location.hash.startsWith('#share=') && !decoded);

  if (decoded) return <ShareView plans={decoded.plans} />;

  return (
    <PlanProvider>
      {decodeFailed && (
        <div className="decode-error">分享連結已損毀或不完整，以下是你自己的規劃。</div>
      )}
      <Planner />
    </PlanProvider>
  );
}
