interface Props {
  year: number;
  quota: number;
  used: number;
  onSetQuota: (quota: number) => void;
  onClose: () => void;
}

/** 從左下角請假區塊點開的快速調整面板：只做一件事——調當前年份的請假預算 */
export function QuotaSheet({ year, quota, used, onSetQuota, onClose }: Props) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet quota-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">{year} 年請假預算</h3>
            <p className="sheet-subtitle">
              已規劃 {used} 天 · 特休、補休、婚假都算，只是參考
            </p>
          </div>
          <button type="button" className="btn-text" onClick={onClose}>
            完成
          </button>
        </div>
        <div className="stepper stepper-center">
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
    </div>
  );
}
