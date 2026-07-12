interface Props {
  years: number[];
  /** 各年份的請假預算（每年可不同） */
  quotas: Record<number, number>;
  weekStart: 0 | 1;
  onSetWeekStart: (weekStart: 0 | 1) => void;
  onSetQuota: (year: number, quota: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsSheet({
  years,
  quotas,
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
          <h3 className="sheet-title">設定</h3>
          <button type="button" className="btn-text" onClick={onClose}>
            完成
          </button>
        </div>
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
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            if (
              confirm('確定要清除所有規劃與設定？此動作無法復原。')
            ) {
              onReset();
            }
          }}
        >
          清除所有規劃與設定
        </button>
      </div>
    </div>
  );
}
