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
      // 備份連結＋本機沒有該年份資料 → 沒有覆蓋風險，直接還原進入 App
      const existing = loadPlan(d.plan.year);
      const isEmpty =
        !existing || (existing.leaveDays.length === 0 && existing.annotations.length === 0);
      if (isEmpty) {
        savePlan(d.plan);
        history.replaceState(null, '', location.pathname + location.search);
        return null;
      }
    }
    return d;
  });
  const [decodeFailed] = useState(() => location.hash.startsWith('#share=') && !decoded);

  if (decoded) return <ShareView plan={decoded.plan} isBackup={decoded.isBackup} />;

  return (
    <PlanProvider>
      {decodeFailed && (
        <div className="decode-error">分享連結已損毀或不完整，以下是你自己的規劃。</div>
      )}
      <Planner />
    </PlanProvider>
  );
}
