import { useState } from 'react';
import { decodeShareHash } from './lib/share';
import { PlanProvider } from './state/PlanContext';
import { Planner } from './components/Planner';
import { ShareView } from './components/ShareView';

export default function App() {
  const [sharedPlan] = useState(() => decodeShareHash(location.hash));
  const [decodeFailed] = useState(() => location.hash.startsWith('#share=') && !sharedPlan);

  if (sharedPlan) return <ShareView plan={sharedPlan} />;

  return (
    <PlanProvider>
      {decodeFailed && (
        <div className="decode-error">分享連結已損毀或不完整，以下是你自己的規劃。</div>
      )}
      <Planner />
    </PlanProvider>
  );
}
