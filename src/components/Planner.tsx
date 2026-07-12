import { useEffect, useMemo, useRef, useState } from 'react';
import { detectBreaks, type BreakSegment } from '../lib/breaks';
import { fromEpochDay, isoToEpochDay, todayISO, type ISODate } from '../lib/date';
import { isMarkable, type DayStatus } from '../lib/dayStatus';
import {
  clearAllData,
  loadSettings,
  saveSettings,
  type DisplaySettings,
} from '../lib/storage';
import { getHolidayMap, SUPPORTED_YEARS } from '../data';
import { ownerYearOf, usePlans } from '../state/PlanContext';
import { BreakDetailSheet } from './BreakDetailSheet';
import { HelpSheet } from './HelpSheet';
import { BreakList } from './BreakList';
import { QuotaBar } from './QuotaBar';
import { QuotaSheet } from './QuotaSheet';
import { SettingsSheet } from './SettingsSheet';
import { ShareSheet } from './ShareSheet';
import { monthElementId, YearCalendar } from './YearCalendar';

const YEARS = SUPPORTED_YEARS;
const LAST_YEAR = YEARS[YEARS.length - 1]!;

export function Planner() {
  const { plans, dispatchFor, firstRun } = usePlans();
  const [listOpen, setListOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(firstRun);
  const [onboarded, setOnboarded] = useState(!firstRun);
  const [shareOpen, setShareOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settings, setSettings] = useState<DisplaySettings>(loadSettings);
  const [activeYear, setActiveYear] = useState(() => {
    const last = loadSettings().lastYear;
    return last !== undefined && YEARS.includes(last) ? last : LAST_YEAR;
  });
  const [selectedSegment, setSelectedSegment] = useState<BreakSegment | null>(null);
  const [detailFromList, setDetailFromList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  const updateSettings = (next: DisplaySettings) => {
    setSettings(next);
    saveSettings(next);
  };

  // 所有年份合併後的請假日與備註（連假偵測、月曆顯示共用）
  const leaveDays = useMemo(
    () => YEARS.flatMap((y) => plans[y]!.leaveDays).sort(),
    [plans],
  );
  const annotations = useMemo(() => YEARS.flatMap((y) => plans[y]!.annotations), [plans]);

  // 已整段結束的連假不顯示（過去的日期不用看）
  const segments = useMemo(() => {
    const today = todayISO();
    return detectBreaks(YEARS[0]!, leaveDays, undefined, LAST_YEAR).filter(
      (s) => s.end >= today,
    );
  }, [leaveDays]);

  // 從清單點入的區段，在請假日變動後對回最新的區段物件
  const activeSegment = useMemo(() => {
    if (!selectedSegment) return null;
    return (
      segments.find(
        (s) => s.start <= selectedSegment.end && s.end >= selectedSegment.start,
      ) ?? null
    );
  }, [segments, selectedSegment]);

  const scrollToYear = (y: number, smooth: boolean) => {
    const now = new Date();
    const month = now.getFullYear() === y ? now.getMonth() + 1 : 1;
    document
      .getElementById(monthElementId(y, month))
      ?.scrollIntoView({ block: 'start', ...(smooth ? { behavior: 'smooth' as const } : {}) });
  };

  // 初載捲到上次規劃的年份
  useEffect(() => {
    scrollToYear(activeYear, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 捲動時同步 header 下拉選單的年份
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const containerTop = el.getBoundingClientRect().top;
        let current: Element | null = null;
        for (const m of el.querySelectorAll('.month')) {
          if (m.getBoundingClientRect().top - containerTop <= 80) current = m;
          else break;
        }
        if (!current) return;
        const y = +current.id.split('-')[1]!;
        const clamped = Math.min(Math.max(y, YEARS[0]!), LAST_YEAR);
        setActiveYear((prev) => (prev === clamped ? prev : clamped));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const jumpToYear = (y: number) => {
    setActiveYear(y);
    updateSettings({ ...settings, lastYear: y });
    scrollToYear(y, true);
  };

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const handleDayTap = (iso: ISODate, status: DayStatus) => {
    if (isMarkable(status)) {
      if (iso < todayISO()) {
        showToast('這天已經過去啦');
        return;
      }
      dispatchFor(ownerYearOf(iso), { type: 'toggle-leave', date: iso });
      return;
    }
    // 點連假段內的假日／週末 → 直接開啟該段的編輯面板
    const seg = segments.find((s) => s.start <= iso && iso <= s.end);
    if (seg) {
      setSelectedSegment(seg);
      setDetailFromList(false);
      return;
    }
    const entry = getHolidayMap().get(iso);
    if (entry) {
      showToast(`${entry.name}${entry.kind === 'makeup-holiday' ? '（補假）' : ''}`);
    }
  };

  const handleSelectSegment = (seg: BreakSegment) => {
    setSelectedSegment(seg);
    setDetailFromList(true);
    setListOpen(false);
    const { y, m } = fromEpochDay(isoToEpochDay(seg.start));
    document
      .getElementById(monthElementId(y, m))
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const activePlan = plans[activeYear]!;
  const usedLeave = activePlan.leaveDays.filter((d) =>
    d.startsWith(`${activeYear}-`),
  ).length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <select
            className="year-select"
            value={activeYear}
            aria-label="規劃年份"
            onChange={(e) => jumpToYear(+e.target.value)}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <h1 className="header-title">連假規劃</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-icon btn-help"
            aria-label="使用說明"
            onClick={() => setHelpOpen(true)}
          >
            ?
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="設定"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙
          </button>
        </div>
      </header>

      <main className="calendar-scroll" ref={scrollRef}>
        <p className="usage-hint">點上班日標記請假，自動幫你算連假長度</p>
        <YearCalendar
          years={YEARS}
          leaveDays={leaveDays}
          annotations={annotations}
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
          <BreakList segments={segments} annotations={annotations} onSelect={handleSelectSegment} />
        </div>
      )}

      <QuotaBar
        year={activeYear}
        used={usedLeave}
        quota={activePlan.annualLeaveQuota}
        breakCount={segments.length}
        sheetOpen={listOpen}
        onQuotaTap={() => setQuotaOpen(true)}
        onToggleSheet={() => setListOpen((v) => !v)}
        onShare={() => setShareOpen(true)}
      />

      {quotaOpen && (
        <QuotaSheet
          year={activeYear}
          quota={activePlan.annualLeaveQuota}
          used={usedLeave}
          onSetQuota={(quota) => dispatchFor(activeYear, { type: 'set-quota', quota })}
          onClose={() => setQuotaOpen(false)}
        />
      )}

      {shareOpen && (
        <ShareSheet
          plan={activePlan}
          segments={segments.filter((s) => ownerYearOf(s.start) === activeYear)}
          onClose={() => setShareOpen(false)}
        />
      )}

      {activeSegment && (
        <BreakDetailSheet
          key={`${activeSegment.start}:${activeSegment.end}`}
          year={ownerYearOf(activeSegment.start)}
          segment={activeSegment}
          annotations={annotations}
          onSave={(annotation) =>
            dispatchFor(ownerYearOf(annotation.anchorDate), {
              type: 'save-annotation',
              annotation,
            })
          }
          onClose={() => {
            setSelectedSegment(null);
            if (detailFromList) setListOpen(true); // 從清單點進來的，完成後回到清單
          }}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          years={YEARS}
          quotas={Object.fromEntries(YEARS.map((y) => [y, plans[y]!.annualLeaveQuota]))}
          firstRun={!onboarded}
          weekStart={settings.weekStart}
          onSetWeekStart={(weekStart) => updateSettings({ ...settings, weekStart })}
          onSetQuota={(year, quota) => dispatchFor(year, { type: 'set-quota', quota })}
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

      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
