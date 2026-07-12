interface Props {
  onClose: () => void;
  onReplayTour: () => void;
}

const STEPS: [string, string][] = [
  ['設定請假預算', '點左下角的「請假 x / y」，抓一下今年打算請幾天假——特休、補休、婚假都算，只是規劃參考（每個年份可以不同）。'],
  [
    '點上班日標記請假',
    '想請假的日子點一下變成琥珀色「請假」，再點一次取消。週末、國定假日、請假日連在一起就自動變成一段連假，用黃色色帶標出總長度。',
  ],
  [
    '幫連假取名、寫備註',
    '直接點色帶上的假日或週末（或右下角清單點入），幫這段連假取名（如「帛琉潛水」）、記下機票住宿預算。名稱會直接顯示在月曆上。',
  ],
  [
    '總覽與跳轉',
    '右下角「連假 N」看全年清單；左上角年份下拉可快速跳到 2026／2027。隔年 1 月的請假不佔今年預算。',
  ],
  [
    '分享與匯出',
    '「分享」可以推薦工具給朋友、分享你的行程（不含備註），或下載 .ics 匯入 Google／Apple 日曆。',
  ],
];

const LEGEND: { className: string; label: string; desc: string }[] = [
  { className: 'legend-holiday', label: '1', desc: '國定假日／補假' },
  { className: 'legend-weekend', label: '2', desc: '週末' },
  { className: 'legend-leave', label: '3', desc: '你的請假日' },
  { className: 'legend-streak', label: '4', desc: '連假色帶（相連的休假）' },
];

/** 使用說明的內容本體：說明 sheet 與首次引導共用，改文字只改這裡 */
export function HelpContent() {
  return (
    <>
      <ol className="help-steps">
        {STEPS.map(([title, desc]) => (
          <li key={title}>
            <b>{title}</b>
            <p>{desc}</p>
          </li>
        ))}
      </ol>

      <div className="help-legend">
        <span className="field-label">顏色圖例</span>
        <ul>
          {LEGEND.map(({ className, label, desc }) => (
            <li key={className}>
              <span className={`legend-chip ${className}`}>{label}</span>
              <span>{desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="settings-footnote">
        🔒 隱私：所有資料只存在你的裝置上，不上傳、不追蹤（完整說明見頁面最下方）。
      </p>
      <p className="settings-footnote">
        放假日以行政院人事行政總處核定的辦公日曆表為準（2026 全年 120 日、2027 全年 121
        日，均無補班日）；勞基法適用的公司請假規定可能略有不同。 2028 年行事曆預計 2027
        年年中由政府公告，屆時會更新進來。
      </p>
    </>
  );
}

export function HelpSheet({ onClose, onReplayTour }: Props) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3 className="sheet-title">使用說明</h3>
          <button type="button" className="btn-text" onClick={onClose}>
            知道了
          </button>
        </div>

        <button type="button" className="btn-secondary tour-replay" onClick={onReplayTour}>
          🧭 播放互動導覽（直接在畫面上指給你看）
        </button>

        <HelpContent />
      </div>
    </div>
  );
}
