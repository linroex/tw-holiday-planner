import { SUPPORTED_YEARS } from '../data';

interface Props {
  quota: number;
  firstRun: boolean;
  year: number;
  onSetYear: (year: number) => void;
  weekStart: 0 | 1;
  onSetWeekStart: (weekStart: 0 | 1) => void;
  onSetQuota: (quota: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsSheet({
  quota,
  firstRun,
  year,
  onSetYear,
  weekStart,
  onSetWeekStart,
  onSetQuota,
  onReset,
  onClose,
}: Props) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3 className="sheet-title">{firstRun ? '開始規劃前' : '設定'}</h3>
          <button type="button" className="btn-text" onClick={onClose}>
            完成
          </button>
        </div>
        {firstRun && (
          <p className="settings-intro">
            設定你的年度特休天數，之後點月曆上的上班日就能標記請假、湊出連假。
          </p>
        )}
        <div className="field">
          <span className="field-label">年度特休天數</span>
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label="減少"
              onClick={() => onSetQuota(quota - 1)}
              disabled={quota <= 0}
            >
              −
            </button>
            <span className="stepper-value">{quota} 天</span>
            <button
              type="button"
              className="stepper-btn"
              aria-label="增加"
              onClick={() => onSetQuota(quota + 1)}
            >
              ＋
            </button>
          </div>
        </div>
        <div className="field">
          <span className="field-label">規劃年份（各年份的規劃分開儲存）</span>
          <div className="segmented">
            {SUPPORTED_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                className={y === year ? 'segmented-on' : ''}
                onClick={() => onSetYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
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
        {!firstRun && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm('確定要清除所有請假與備註？此動作無法復原。')) {
                onReset();
                onClose();
              }
            }}
          >
            清除所有規劃
          </button>
        )}
        <p className="settings-footnote">
          假日資料：行政院人事行政總處核定之政府行政機關辦公日曆表
          （2026 全年放假 120 日、2027 全年 121 日，均無補班日）。
        </p>
      </div>
    </div>
  );
}
