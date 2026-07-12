import { useEffect, useMemo, useRef, useState } from 'react';
import { detectBreaks, type BreakSegment } from '../lib/breaks';
import { isoToEpochDay, fromEpochDay, type ISODate } from '../lib/date';
import { isMarkable, type DayStatus } from '../lib/dayStatus';
import { clearAllData, loadSettings, saveSettings, type DisplaySettings } from '../lib/storage';
import { getHolidayMap } from '../data';
import { usePlan } from '../state/PlanContext';
import { BreakDetailSheet } from './BreakDetailSheet';
import { BreakList } from './BreakList';
import { QuotaBar } from './QuotaBar';
import { SettingsSheet } from './SettingsSheet';
import { ShareSheet } from './ShareSheet';
import { monthElementId, YearCalendar } from './YearCalendar';

export function Planner({ onChangeYear }: { onChangeYear: (year: number) => void }) {
  const { plan, dispatch, firstRun } = usePlan();
  const [listOpen, setListOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(firstRun);
  const [onboarded, setOnboarded] = useState(!firstRun);
  const [shareOpen, setShareOpen] = useState(false);
  const [settings, setSettings] = useState<DisplaySettings>(loadSettings);

  const updateSettings = (next: DisplaySettings) => {
    setSettings(next);
    saveSettings(next);
  };
  const [selectedSegment, setSelectedSegment] = useState<BreakSegment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const segments = useMemo(
    () => detectBreaks(plan.year, plan.leaveDays),
    [plan.year, plan.leaveDays],
  );

  // 從清單點入的區段，在請假日變動後對回最新的區段物件
  const activeSegment = useMemo(() => {
    if (!selectedSegment) return null;
    return (
      segments.find(
        (s) => s.start <= selectedSegment.end && s.end >= selectedSegment.start,
      ) ?? null
    );
  }, [segments, selectedSegment]);

  // 初載：今天在規劃年份內捲到當月，否則捲到 1 月（最上方是前一年 12 月邊界月）
  useEffect(() => {
    const now = new Date();
    const month = now.getFullYear() === plan.year ? now.getMonth() + 1 : 1;
    document
      .getElementById(monthElementId(plan.year, month))
      ?.scrollIntoView({ block: 'start' });
  }, [plan.year]);

  // 特休額度只計年內請假日；跨年（隔年 1 月）請假不扣
  const inYearLeave = plan.leaveDays.filter((d) => d.startsWith(`${plan.year}-`)).length;

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const handleDayTap = (iso: ISODate, status: DayStatus) => {
    if (isMarkable(status)) {
      dispatch({ type: 'toggle-leave', date: iso });
      return;
    }
    const entry = getHolidayMap().get(iso);
    if (entry) {
      showToast(`${entry.name}${entry.kind === 'makeup-holiday' ? '（補假）' : ''}`);
    }
  };

  const handleSelectSegment = (seg: BreakSegment) => {
    setSelectedSegment(seg);
    setListOpen(false);
    const { m } = fromEpochDay(isoToEpochDay(seg.start));
    document
      .getElementById(monthElementId(plan.year, m))
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };


  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">{plan.year} 連假規劃</h1>
        <button
          type="button"
          className="btn-icon"
          aria-label="設定"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
      </header>

      <main className="calendar-scroll">
        <p className="usage-hint">點上班日標記請假，自動幫你算連假長度</p>
        <YearCalendar
          plan={plan}
          segments={segments}
          selectedSegment={activeSegment}
          weekStart={settings.weekStart}
          onDayTap={handleDayTap}
        />
      </main>

      {listOpen && (
        <div className="break-panel">
          <div className="break-panel-header">
            <h3 className="sheet-title">連假清單</h3>
            <span className="break-panel-count">{segments.length} 個</span>
          </div>
          <BreakList
            year={plan.year}
            segments={segments}
            annotations={plan.annotations}
            onSelect={handleSelectSegment}
          />
        </div>
      )}

      <QuotaBar
        used={inYearLeave}
        quota={plan.annualLeaveQuota}
        breakCount={segments.length}
        sheetOpen={listOpen}
        onToggleSheet={() => setListOpen((v) => !v)}
        onShare={() => setShareOpen(true)}
      />

      {shareOpen && (
        <ShareSheet plan={plan} segments={segments} onClose={() => setShareOpen(false)} />
      )}

      {activeSegment && (
        <BreakDetailSheet
          key={`${activeSegment.start}:${activeSegment.end}`}
          year={plan.year}
          segment={activeSegment}
          annotations={plan.annotations}
          onSave={(annotation) => dispatch({ type: 'save-annotation', annotation })}
          onClose={() => {
            setSelectedSegment(null);
            setListOpen(true); // 詳情是從清單點進來的，完成後回到清單
          }}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          quota={plan.annualLeaveQuota}
          firstRun={!onboarded}
          year={plan.year}
          onSetYear={onChangeYear}
          weekStart={settings.weekStart}
          onSetWeekStart={(weekStart) => updateSettings({ ...settings, weekStart })}
          onSetQuota={(quota) => dispatch({ type: 'set-quota', quota })}
          onReset={() => {
            // 完整重置：所有年份的規劃＋顯示偏好一併清除，重載後回到首次使用引導
            clearAllData();
            location.reload();
          }}
          onClose={() => {
            setSettingsOpen(false);
            setOnboarded(true);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
