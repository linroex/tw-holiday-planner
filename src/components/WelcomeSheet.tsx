interface Props {
  onStartTour: () => void;
  onClose: () => void;
}

/**
 * 首次使用的歡迎卡：一句話＋一個決定，不做任何前置配置。
 * 預算、週起始都用預設值，之後在對的地方（左下角、設定）調整。
 */
export function WelcomeSheet({ onStartTour, onClose }: Props) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet welcome" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h3 className="sheet-title">開始湊連假吧 🎉</h3>
        <p className="welcome-text">
          紅字是放假日。點任何<b>上班日</b>標記請假，自動幫你算出連假有幾天。
        </p>
        <div className="first-run-actions">
          <button type="button" className="btn-primary first-run-tour" onClick={onStartTour}>
            🧭 帶我看一遍（30 秒）
          </button>
          <button type="button" className="btn-secondary self-explore" onClick={onClose}>
            直接開始
          </button>
        </div>
        <p className="settings-footnote">請假預算預設 7 天，左下角隨時可以調整。</p>
      </div>
    </div>
  );
}
