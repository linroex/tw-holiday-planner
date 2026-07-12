import { HelpContent } from './HelpSheet';

interface Props {
  years: number[];
  /** 各年份的請假預算（每年可不同） */
  quotas: Record<number, number>;
  firstRun: boolean;
  weekStart: 0 | 1;
  onSetWeekStart: (weekStart: 0 | 1) => void;
  onSetQuota: (year: number, quota: number) => void;
  /** 首次使用：選擇「帶我導覽」 */
  onStartTour: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsSheet({
  years,
  quotas,
  firstRun,
  weekStart,
  onSetWeekStart,
  onSetQuota,
  onStartTour,
  onReset,
  onClose,
}: Props) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3 className="sheet-title">{firstRun ? '開始規劃前' : '設定'}</h3>
          {!firstRun && (
            <button type="button" className="btn-text" onClick={onClose}>
              完成
            </button>
          )}
        </div>
        {firstRun && (
          <p className="settings-intro">
            先抓一下各年度「打算請幾天假」的預算（特休、補休、婚假都算，只是規劃參考），之後點月曆上的上班日就能標記請假、湊出連假。
          </p>
        )}
        {years.map((year) => (
          <div className="field" key={year}>
            <span className="field-label">{year} 年請假預算（天）</span>
            <div className="stepper">
              <button
                type="button"
                className="stepper-btn"
                aria-label={`減少 ${year} 請假預算`}
                onClick={() => onSetQuota(year, quotas[year]! - 1)}
                disabled={quotas[year]! <= 0}
              >
                −
              </button>
              <span className="stepper-value">{quotas[year]} 天</span>
              <button
                type="button"
                className="stepper-btn"
                aria-label={`增加 ${year} 請假預算`}
                onClick={() => onSetQuota(year, quotas[year]! + 1)}
              >
                ＋
              </button>
            </div>
          </div>
        ))}
        <div className="field">
          <span className="field-label">每週從哪天開始</span>
          <div className="segmented">
            <button
              type="button"
              className={weekStart === 1 ? 'segmented-on' : ''}
              onClick={() => onSetWeekStart(1)}
            >
              週一
            </button>
            <button
              type="button"
              className={weekStart === 0 ? 'segmented-on' : ''}
              onClick={() => onSetWeekStart(0)}
            >
              週日
            </button>
          </div>
        </div>
        {firstRun ? (
          <>
            <div className="about-section">
              <span className="field-label">怎麼用？</span>
              <HelpContent />
            </div>
            <div className="first-run-actions">
              <button type="button" className="btn-primary first-run-tour" onClick={onStartTour}>
                🧭 開始使用，一步步教我
              </button>
              <button type="button" className="btn-secondary self-explore" onClick={onClose}>
                我自己摸索就好
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (
                confirm(
                  '確定要清除所有規劃與設定（包含每個年份的請假、備註與偏好）？此動作無法復原。',
                )
              ) {
                onReset();
              }
            }}
          >
            清除所有規劃與設定
          </button>
        )}
      </div>
    </div>
  );
}
