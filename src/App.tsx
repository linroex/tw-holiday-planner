import { useState } from 'react';
import { SUPPORTED_YEARS } from './data';
import { decodeShareHash } from './lib/share';
import { loadSettings, saveSettings } from './lib/storage';
import { PlanProvider } from './state/PlanContext';
import { Planner } from './components/Planner';
import { ShareView } from './components/ShareView';

const LATEST_YEAR = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1]!;

export default function App() {
  const [sharedPlan] = useState(() => decodeShareHash(location.hash));
  const [decodeFailed] = useState(() => location.hash.startsWith('#share=') && !sharedPlan);
  const [year, setYear] = useState(() => {
    const last = loadSettings().lastYear;
    return last !== undefined && SUPPORTED_YEARS.includes(last) ? last : LATEST_YEAR;
  });

  if (sharedPlan) return <ShareView plan={sharedPlan} />;

  const changeYear = (y: number) => {
    setYear(y);
    saveSettings({ ...loadSettings(), lastYear: y });
  };

  return (
    <PlanProvider key={year} year={year}>
      {decodeFailed && (
        <div className="decode-error">分享連結已損毀或不完整，以下是你自己的規劃。</div>
      )}
      <Planner onChangeYear={changeYear} />
    </PlanProvider>
  );
}
