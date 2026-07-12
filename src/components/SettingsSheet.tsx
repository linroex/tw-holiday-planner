interface Props {
  years: number[];
  /** 各年份的特休天數（每年可不同） */
  quotas: Record<number, number>;
  firstRun: boolean;
  weekStart: 0 | 1;
  onSetWeekStart: (weekStart: 0 | 1) => void;
  onSetQuota: (year: number, quota: number) => void;
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
            設定各年度的特休天數（年資不同天數可能不同），之後點月曆上的上班日就能標記請假、湊出連假。
          </p>
        )}
        {years.map((year) => (
          <div className="field" key={year}>
            <span className="field-label">{year} 年度特休天數</span>
            <div className="stepper">
              <button
                type="button"
                className="stepper-btn"
                aria-label={`減少 ${year} 特休`}
                onClick={() => onSetQuota(year, quotas[year]! - 1)}
                disabled={quotas[year]! <= 0}
              >
                −
              </button>
              <span className="stepper-value">{quotas[year]} 天</span>
              <button
                type="button"
                className="stepper-btn"
                aria-label={`增加 ${year} 特休`}
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
        {!firstRun && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm('確定要清除所有規劃與設定（包含每個年份的請假、備註與偏好）？此動作無法復原。')) {
                onReset();
              }
            }}
          >
            清除所有規劃與設定
          </button>
        )}
        <div className="about-section">
          <span className="field-label">隱私</span>
          <p className="about-text">
            所有規劃資料<b>只儲存在你自己的裝置上</b>（瀏覽器的 localStorage）——
            沒有伺服器、不上傳、不追蹤。分享連結是把資料壓縮進網址裡，
            要不要給人、給誰，完全由你決定。
          </p>
        </div>
        <div className="about-section">
          <span className="field-label">關於</span>
          <p className="about-text">
            這是開源的小工具，覺得好用歡迎到 GitHub 給顆 ⭐️
            支持，遇到問題或想要新功能也歡迎開 issue 告訴我們！
          </p>
          <a
            className="about-link"
            href="https://github.com/linroex/tw-holiday-planner"
            target="_blank"
            rel="noreferrer"
          >
            ⭐️ GitHub：linroex/tw-holiday-planner
          </a>
        </div>
        <p className="settings-footnote">
          假日資料：行政院人事行政總處核定之政府行政機關辦公日曆表
          （2026 全年放假 120 日、2027 全年 121 日，均無補班日）。
        </p>
      </div>
    </div>
  );
}
