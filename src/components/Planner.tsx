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
import { isIOS, isStandalone } from '../lib/platform';
import { getHolidayMap, SUPPORTED_YEARS } from '../data';
import { ownerYearOf, usePlans } from '../state/PlanContext';
import { AppFooter } from './AppFooter';
import { BreakDetailSheet } from './BreakDetailSheet';
import { HelpSheet } from './HelpSheet';
import { Tour, type TourStep } from './Tour';
import { BreakList } from './BreakList';
import { QuotaBar } from './QuotaBar';
import { QuotaSheet } from './QuotaSheet';
import { SettingsSheet } from './SettingsSheet';
import { ShareSheet } from './ShareSheet';
import { WelcomeSheet } from './WelcomeSheet';
import { monthElementId, YearCalendar } from './YearCalendar';

const YEARS = SUPPORTED_YEARS;
const LAST_YEAR = YEARS[YEARS.length - 1]!;

const TOUR_STEPS: TourStep[] = [
  {
    // 鎖定最新年份 1 月的上班日，避免導覽把畫面捲到年曆最前面
    selector: `#month-${LAST_YEAR}-1 .day-workday`,
    title: '點上班日標記請假',
    text: '點一下變成琥珀色「請假」，再點一次取消。跟週末、國定假日連起來的休假，會用黃色色帶顯示成一段連假。',
  },
  {
    selector: '.quota-info',
    title: '請假預算在左下角',
    text: '已規劃幾天一目了然；點一下可調整今年的請假預算——特休、補休、婚假都算（每個年份分開計算）。',
  },
  {
    selector: '.quota-bar .btn-secondary',
    title: '連假總覽',
    text: '全年所有連假的清單。點任何一段可以幫它取名（例如「帛琉潛水」）、記下機票住宿備註。',
  },
  {
    selector: '.quota-bar .btn-primary',
    title: '分享與匯出',
    text: '推薦工具給朋友、分享你的行程（不含備註），或把規劃匯出到 Google／Apple 日曆。',
  },
  {
    selector: '.year-select',
    title: '切換年份',
    text: '在 2026／2027 之間快速跳轉；手動捲動月曆時，這裡也會自動跟著更新。',
  },
  {
    selector: '.btn-help',
    title: '隨時回來看說明',
    text: '忘記怎麼用？點這個問號查看完整說明，也可以從那裡重新播放這個導覽。',
  },
];

export function Planner() {
  const { plans, dispatchFor, firstRun } = usePlans();
  const [listOpen, setListOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(firstRun);
  const firstMarkHinted = useRef(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareForBackup, setShareForBackup] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
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
      const owner = ownerYearOf(iso);
      const isMarking = !plans[owner]!.leaveDays.includes(iso);
      dispatchFor(owner, { type: 'toggle-leave', date: iso });
      // 首次使用者第一次成功標記時，在對的時機教「預算在左下角」
      if (isMarking && firstRun && !firstMarkHinted.current) {
        firstMarkHinted.current = true;
        showToast('已標記！左下角可調整你的請假預算');
      }
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

  // iOS Safari（未加入主畫面）＋已有規劃內容 → 提醒備份（7 天儲存清除規則）
  const showBackupHint =
    isIOS() &&
    !isStandalone() &&
    !settings.backupHintDismissed &&
    (leaveDays.length >= 3 || annotations.length >= 1);

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
        <div className="future-note">
          <b>2028 年的假期呢？</b>
          <p>
            政府預計 <b>2027 年年中</b>公告，屆時自動更新 😉
          </p>
        </div>
        <AppFooter />
      </main>

      {showBackupHint && (
        <div className="backup-hint">
          <p>
            💾 規劃存在這台裝置的瀏覽器裡，Safari 久未使用可能清除。建議
            <b>加入主畫面</b>（分享 ⬆️ → 加入主畫面），或定期備份。
          </p>
          <div className="backup-hint-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShareForBackup(true);
                setShareOpen(true);
              }}
            >
              去備份
            </button>
            <button
              type="button"
              className="btn-text"
              onClick={() => updateSettings({ ...settings, backupHintDismissed: true })}
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {listOpen && (
        <div
          className="panel-backdrop"
          aria-hidden="true"
          onClick={() => setListOpen(false)}
        />
      )}
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
        onShare={() => {
          setShareForBackup(false);
          setShareOpen(true);
        }}
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
          defaultIncludeNotes={shareForBackup}
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
          weekStart={settings.weekStart}
          onSetWeekStart={(weekStart) => updateSettings({ ...settings, weekStart })}
          onSetQuota={(year, quota) => dispatchFor(year, { type: 'set-quota', quota })}
          onReset={() => {
            // 完整重置：所有年份的規劃＋顯示偏好一併清除，重載後回到首次使用引導
            clearAllData();
            location.reload();
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {welcomeOpen && (
        <WelcomeSheet
          onStartTour={() => {
            setWelcomeOpen(false);
            setTourActive(true);
          }}
          onClose={() => setWelcomeOpen(false)}
        />
      )}

      {helpOpen && (
        <HelpSheet
          onClose={() => setHelpOpen(false)}
          onReplayTour={() => {
            setHelpOpen(false);
            setTourActive(true);
          }}
        />
      )}

      {tourActive && <Tour steps={TOUR_STEPS} onClose={() => setTourActive(false)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
