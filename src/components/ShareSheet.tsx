import { useRef, useState } from 'react';
import type { UserPlan } from '../data/types';
import type { BreakSegment } from '../lib/breaks';
import { buildICS } from '../lib/calendar';
import { encodePlanToHash } from '../lib/share';

interface Props {
  plan: UserPlan;
  segments: BreakSegment[];
  onClose: () => void;
}

/** 非安全來源（HTTP）也能用的複製 */
async function copyText(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('copy-failed');
}

/**
 * 分享面板，三個區塊：
 * 1. 推薦工具給朋友（純工具連結，不含任何個人資料）
 * 2. 分享我的行程（備註可開關：給朋友關、轉移到自己其他裝置開）
 * 3. 加入行事曆（.ics 匯出）
 */
export function ShareSheet({ plan, segments, onClose }: Props) {
  const planUrlRef = useRef<HTMLTextAreaElement>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [copied, setCopied] = useState<'tool' | 'plan' | null>(null);

  const toolUrl = `${location.origin}${location.pathname}`;
  const planUrl = `${toolUrl}${encodePlanToHash(plan, includeNotes)}`;
  const canNativeShare = typeof navigator.share === 'function';

  const copy = async (key: 'tool' | 'plan', text: string) => {
    try {
      await copyText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      if (key === 'plan' && planUrlRef.current) {
        planUrlRef.current.focus();
        planUrlRef.current.setSelectionRange(0, planUrl.length);
      }
    }
  };

  const nativeShare = (title: string, url: string) => {
    navigator.share({ title, url }).catch(() => {});
  };

  const downloadICS = () => {
    const blob = new Blob([buildICS(plan, segments)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${plan.year}-連假規劃.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3 className="sheet-title">分享</h3>
          <button type="button" className="btn-text" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="share-section">
          <span className="field-label">① 覺得工具好用，推薦給朋友</span>
          <p className="share-hint">只分享工具本身，不含你的任何規劃資料</p>
          <div className="share-actions">
            <button
              type="button"
              className="btn-secondary share-tool-copy"
              onClick={() => copy('tool', toolUrl)}
            >
              {copied === 'tool' ? '已複製 ✓' : '複製工具連結'}
            </button>
            {canNativeShare && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => nativeShare('台灣連假規劃工具', toolUrl)}
              >
                ⤴ 系統分享
              </button>
            )}
          </div>
        </div>

        <div className="share-section">
          <span className="field-label">② 分享我的行程</span>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
            />
            包含備註（把行程轉移到電腦／其他裝置時再開）
          </label>
          <textarea
            ref={planUrlRef}
            className="share-url"
            readOnly
            rows={3}
            value={planUrl}
            onFocus={() => planUrlRef.current?.setSelectionRange(0, planUrl.length)}
          />
          <div className="share-actions">
            <button
              type="button"
              className="btn-primary share-copy"
              onClick={() => copy('plan', planUrl)}
            >
              {copied === 'plan' ? '已複製 ✓' : '複製行程連結'}
            </button>
            {canNativeShare && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => nativeShare(`我的 ${plan.year} 連假規劃`, planUrl)}
              >
                ⤴ 系統分享
              </button>
            )}
          </div>
          <p className="share-hint">
            {includeNotes
              ? '⚠️ 這個連結包含你的備註內容，建議只傳給自己的裝置'
              : '朋友打開是唯讀檢視（看得到行程名稱，看不到備註），可一鍵匯入'}
          </p>
        </div>

        <div className="share-section">
          <span className="field-label">③ 加入行事曆</span>
          <button type="button" className="btn-secondary export-ics" onClick={downloadICS}>
            下載 .ics 檔（Google／Apple 日曆）
          </button>
          <p className="share-hint">
            匯出有命名或有請假的連假為全天事件（含備註）。Google 日曆：設定 → 匯入與匯出；
            手機直接開啟檔案即可加入。
          </p>
        </div>
      </div>
    </div>
  );
}
