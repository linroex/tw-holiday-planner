import { useRef, useState } from 'react';
import type { UserPlan } from '../data/types';
import type { BreakSegment } from '../lib/breaks';
import { buildICS } from '../lib/calendar';

interface Props {
  url: string;
  plan: UserPlan;
  segments: BreakSegment[];
  onClose: () => void;
}

/**
 * 分享面板：顯示完整連結＋複製按鈕。
 * 剪貼簿優先用 navigator.clipboard（需 HTTPS），非安全來源（如區網 IP 試玩）
 * 退回 execCommand('copy')，兩者都失敗就全選讓使用者長按複製。
 */
export function ShareSheet({ url, plan, segments, onClose }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const downloadICS = () => {
    const blob = new Blob([buildICS(plan, segments)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${plan.year}-連假規劃.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selectAll = () => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(0, url.length);
    }
  };

  const copy = async () => {
    try {
      if (window.isSecureContext && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        selectAll();
        if (!document.execCommand('copy')) throw new Error('copy-failed');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      selectAll(); // 至少幫使用者全選好，長按即可複製
    }
  };

  const canNativeShare = typeof navigator.share === 'function';

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">分享我的規劃</h3>
            <p className="sheet-subtitle">
              朋友會看到唯讀版（含連假名稱，不含你的備註），可一鍵匯入
            </p>
          </div>
          <button type="button" className="btn-text" onClick={onClose}>
            關閉
          </button>
        </div>
        <label className="field">
          <span className="field-label">分享連結（整份規劃都壓縮在網址裡）</span>
          <textarea
            ref={inputRef}
            className="share-url"
            readOnly
            rows={4}
            value={url}
            onFocus={selectAll}
          />
        </label>
        <div className="share-actions">
          <button type="button" className="btn-primary share-copy" onClick={copy}>
            {copied ? '已複製 ✓' : '複製連結'}
          </button>
          {canNativeShare && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigator.share({ title: '我的連假規劃', url }).catch(() => {})}
            >
              用其他 App 分享
            </button>
          )}
        </div>
        <p className="settings-footnote">
          提醒：複製時要包含 <code>#share=</code> 後面的整段文字，資料才帶得過去。
        </p>
        <div className="export-section">
          <span className="field-label">匯出到行事曆</span>
          <button type="button" className="btn-secondary export-ics" onClick={downloadICS}>
            下載 .ics 檔（匯入 Google／Apple 日曆）
          </button>
          <p className="settings-footnote">
            會匯出有命名或有請假的連假段為全天事件。Google 日曆：設定 → 匯入與匯出 →
            選擇這個檔案；手機上直接開啟檔案即可加入。
          </p>
        </div>
      </div>
    </div>
  );
}
