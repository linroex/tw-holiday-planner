import { useMemo, useState } from 'react';
import type { UserPlan } from '../data/types';
import { detectBreaks, type BreakSegment } from '../lib/breaks';
import { todayISO } from '../lib/date';
import { loadPlan, loadSettings, savePlan } from '../lib/storage';
import { BreakList } from './BreakList';
import { YearCalendar } from './YearCalendar';

interface Props {
  plan: UserPlan;
  /** true = 自己匯出的備份連結；false = 朋友分享的行程 */
  isBackup: boolean;
}

/** 開啟分享／備份連結：唯讀檢視（先預覽內容）＋ 匯入或還原 */
export function ShareView({ plan, isBackup }: Props) {
  const segments = useMemo(() => {
    const today = todayISO();
    return detectBreaks(plan.year, plan.leaveDays).filter((s) => s.end >= today);
  }, [plan.year, plan.leaveDays]);
  const [selected, setSelected] = useState<BreakSegment | null>(null);

  const handleImport = () => {
    const existing = loadPlan(plan.year);
    if (existing && (existing.leaveDays.length > 0 || existing.annotations.length > 0)) {
      const ok = confirm(
        `這裡目前已有 ${plan.year} 年的規劃：請假 ${existing.leaveDays.length} 天、` +
          `備註 ${existing.annotations.length} 則。\n\n` +
          `${isBackup ? '還原' : '匯入'}後將被覆蓋為：請假 ${plan.leaveDays.length} 天、` +
          `備註 ${plan.annotations.length} 則。\n\n確定要覆蓋嗎？`,
      );
      if (!ok) return;
    }
    savePlan(plan);
    location.replace(location.pathname); // 清除 hash 並以一般模式重新載入
  };

  return (
    <div className="app share-view">
      <header className="header">
        <h1 className="header-title">
          {plan.year} {isBackup ? '備份' : '連假規劃'}
        </h1>
        <span className="readonly-badge">{isBackup ? '備份' : '唯讀'}</span>
      </header>
      <main className="calendar-scroll">
        <p className="usage-hint">
          {isBackup
            ? '這是匯出的備份（含備註）。確認內容沒問題後，按下方還原。'
            : `這是朋友分享的規劃（請假 ${plan.leaveDays.length} / ${plan.annualLeaveQuota} 天）`}
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
            請假 <b>{plan.leaveDays.length}</b> / {plan.annualLeaveQuota}
          </span>
          <span className="quota-sub">{isBackup ? '你的備份' : '朋友的規劃'}</span>
        </div>
        <button type="button" className="btn-primary" onClick={handleImport}>
          {isBackup ? '還原這份備份' : '匯入到我的規劃'}
        </button>
      </div>
    </div>
  );
}
