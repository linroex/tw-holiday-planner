import { useMemo, useState } from 'react';
import type { UserPlan } from '../data/types';
import { detectBreaks, type BreakSegment } from '../lib/breaks';
import { loadPlan, loadSettings, savePlan } from '../lib/storage';
import { BreakList } from './BreakList';
import { YearCalendar } from './YearCalendar';

/** 開啟別人的分享連結：唯讀檢視 + 可匯入成自己的規劃 */
export function ShareView({ plan }: { plan: UserPlan }) {
  const segments = useMemo(
    () => detectBreaks(plan.year, plan.leaveDays),
    [plan.year, plan.leaveDays],
  );
  const [selected, setSelected] = useState<BreakSegment | null>(null);

  const handleImport = () => {
    const existing = loadPlan(plan.year);
    if (
      existing &&
      (existing.leaveDays.length > 0 || existing.annotations.length > 0) &&
      !confirm(`你本機已有 ${plan.year} 年的規劃，匯入會覆蓋它。確定要覆蓋嗎？`)
    ) {
      return;
    }
    savePlan(plan);
    location.replace(location.pathname); // 清除 hash 並以一般模式重新載入
  };

  return (
    <div className="app share-view">
      <header className="header">
        <h1 className="header-title">{plan.year} 連假規劃</h1>
        <span className="readonly-badge">唯讀</span>
      </header>
      <main className="calendar-scroll">
        <p className="usage-hint">
          這是朋友分享的規劃（特休 {plan.leaveDays.length} / {plan.annualLeaveQuota} 天）
        </p>
        <YearCalendar
          years={[plan.year]}
          leaveDays={plan.leaveDays}
          annotations={plan.annotations}
          segments={segments}
          selectedSegment={selected}
          weekStart={loadSettings().weekStart}
          onDayTap={() => {}}
        />
        <div className="share-breaks">
          <h3 className="sheet-title">連假清單</h3>
          <BreakList
            segments={segments}
            annotations={plan.annotations}
            onSelect={(seg) => setSelected(seg === selected ? null : seg)}
          />
        </div>
      </main>
      <div className="quota-bar">
        <div className="quota-info">
          <span className="quota-line">
            特休 <b>{plan.leaveDays.length}</b> / {plan.annualLeaveQuota}
          </span>
          <span className="quota-sub">朋友的規劃</span>
        </div>
        <button type="button" className="btn-primary" onClick={handleImport}>
          匯入到我的規劃
        </button>
      </div>
    </div>
  );
}
