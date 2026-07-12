import { useMemo, useState } from 'react';
import type { UserPlan } from '../data/types';
import { detectBreaks, type BreakSegment } from '../lib/breaks';
import { todayISO } from '../lib/date';
import { loadPlan, loadSettings, savePlan } from '../lib/storage';
import { BreakList } from './BreakList';
import { CalendarView } from './CalendarView';

interface Props {
  /** 朋友分享的規劃（所有年份、不含備註、不含過去） */
  plans: UserPlan[];
}

/** 開啟朋友的分享連結：唯讀檢視（先預覽內容）＋ 匯入 */
export function ShareView({ plans }: Props) {
  const years = useMemo(() => plans.map((p) => p.year).sort((a, b) => a - b), [plans]);
  const leaveDays = useMemo(() => plans.flatMap((p) => p.leaveDays).sort(), [plans]);
  const annotations = useMemo(() => plans.flatMap((p) => p.annotations), [plans]);
  const totalLeave = leaveDays.length;

  const segments = useMemo(() => {
    const today = todayISO();
    return detectBreaks(years[0]!, leaveDays, undefined, years[years.length - 1]!).filter(
      (s) => s.end >= today,
    );
  }, [years, leaveDays]);
  const [selected, setSelected] = useState<BreakSegment | null>(null);

  const handleImport = () => {
    const conflicts = plans
      .map((incoming) => ({ incoming, local: loadPlan(incoming.year) }))
      .filter(
        ({ local }) =>
          local && (local.leaveDays.length > 0 || local.annotations.length > 0),
      );
    if (conflicts.length > 0) {
      const lines = conflicts.map(
        ({ incoming, local }) =>
          `${incoming.year} 年：目前請假 ${local!.leaveDays.length} 天、備註 ${local!.annotations.length} 則` +
          ` → 將變成請假 ${incoming.leaveDays.length} 天、備註 ${incoming.annotations.length} 則`,
      );
      if (!confirm(`以下年份將被覆蓋：\n\n${lines.join('\n')}\n\n確定嗎？`)) return;
    }
    for (const plan of plans) savePlan(plan);
    location.replace(location.pathname); // 清除 hash 並以一般模式重新載入
  };

  return (
    <div className="app share-view">
      <header className="header">
        <h1 className="header-title">朋友的連假規劃</h1>
        <span className="readonly-badge">唯讀</span>
      </header>
      <main className="calendar-scroll">
        <p className="usage-hint">朋友分享的規劃，點「匯入」可以接手編輯</p>
        <CalendarView
          years={years}
          leaveDays={leaveDays}
          annotations={annotations}
          segments={segments}
          selectedSegment={selected}
          weekStart={loadSettings().weekStart}
          onDayTap={() => {}}
        />
        <div className="share-breaks">
          <h3 className="sheet-title">連假清單</h3>
          <BreakList
            segments={segments}
            annotations={annotations}
            onSelect={(seg) => setSelected(seg === selected ? null : seg)}
          />
        </div>
      </main>
      <div className="quota-bar">
        <div className="quota-info">
          <span className="quota-line">
            請假 <b>{totalLeave}</b> 天
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
