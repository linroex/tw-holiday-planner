interface Props {
  year: number;
  used: number;
  quota: number;
  breakCount: number;
  sheetOpen: boolean;
  onQuotaTap: () => void;
  onToggleSheet: () => void;
  onShare: () => void;
}

export function QuotaBar({
  year,
  used,
  quota,
  breakCount,
  sheetOpen,
  onQuotaTap,
  onToggleSheet,
  onShare,
}: Props) {
  const remaining = quota - used;
  const over = remaining < 0;
  return (
    <div className="quota-bar">
      <button
        type="button"
        className={`quota-info${over ? ' quota-over' : ''}`}
        aria-label="調整特休天數"
        onClick={onQuotaTap}
      >
        <span className="quota-line">
          特休 <b>{used}</b> / {quota} <span className="quota-edit">✎</span>
        </span>
        <span className="quota-sub">
          {year} · {over ? `超額 ${-remaining} 天` : `剩 ${remaining} 天`}
        </span>
      </button>
      <button type="button" className="btn-secondary" onClick={onToggleSheet}>
        {sheetOpen ? '收合' : `連假 ${breakCount}`}
      </button>
      <button type="button" className="btn-primary" onClick={onShare}>
        分享
      </button>
    </div>
  );
}
