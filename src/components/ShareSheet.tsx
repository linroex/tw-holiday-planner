import { useRef, useState } from 'react';
import type { UserPlan } from '../data/types';
import { copyText } from '../lib/clipboard';
import { decodeShareHash } from '../lib/share';
import { loadPlan, savePlan } from '../lib/storage';
import { SocialLinks } from './AppFooter';
import type { BreakSegment } from '../lib/breaks';
import { buildICS } from '../lib/calendar';
import { encodePlanToHash } from '../lib/share';

interface Props {
  plan: UserPlan;
  segments: BreakSegment[];
  onClose: () => void;
}

/**
 * 分享面板，三個區塊：
 * 1. 推薦工具給朋友（純工具連結，不含任何個人資料）
 * 2. 分享我的行程（備註可開關：給朋友關、轉移到自己其他裝置開）
 * 3. 加入行事曆（.ics 匯出）
 */
export function ShareSheet({ plan, segments, onClose }: Props) {
  const planUrlRef = useRef<HTMLTextAreaElement>(null);
  // 預設含備註（匯出/備份為主用途）；勾選「不包含備註」才是給朋友的分享模式
  const [excludeNotes, setExcludeNotes] = useState(false);
  const includeNotes = !excludeNotes;
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // 貼上匯出連結還原資料：主畫面 App 與 Safari 的儲存空間是分開的，
  // 這是把資料搬進 App（或跨裝置還原）唯一不用開連結的路徑
  const doImport = () => {
    const match = importText.match(/#share=\S+/);
    const decoded = match ? decodeShareHash(match[0]) : null;
    if (!decoded) {
      alert('無法解析，請確認貼上的是完整的匯出連結');
      return;
    }
    const existing = loadPlan(decoded.year);
    if (
      existing &&
      (existing.leaveDays.length > 0 || existing.annotations.length > 0) &&
      !confirm(`將覆蓋這裡 ${decoded.year} 年的規劃，確定匯入嗎？`)
    ) {
      return;
    }
    savePlan(decoded);
    location.reload();
  };
  const [copied, setCopied] = useState<'tool' | 'plan' | null>(null);

  // UTM 讓站主能用 GA 區分流量來源；放在 query（hash 之前），不影響資料解碼
  const utm = (campaign: string) =>
    `?utm_source=share&utm_medium=app&utm_campaign=${campaign}`;
  const base = `${location.origin}${location.pathname}`;
  const toolUrl = `${base}${utm('tool_link')}`;
  const planUrl = `${base}${utm('plan_link')}${encodePlanToHash(plan, includeNotes)}`;
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
          <h3 className="sheet-title">分享與匯出</h3>
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
          <span className="field-label">② 匯出我的行程</span>
          <p className="share-hint">
            整份規劃壓縮成一條連結（匯出當下的快照）。存進記事本＝備份，也可以傳給朋友看。
          </p>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={excludeNotes}
              onChange={(e) => setExcludeNotes(e.target.checked)}
            />
            不包含備註，分享給朋友
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
              {copied === 'plan' ? '已複製 ✓' : '複製匯出連結'}
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
              ? '⚠️ 連結含你的備註，適合備份、換裝置；之後有修改，記得重新匯出一份'
              : '朋友打開是唯讀、看不到備註，可一鍵匯入'}
          </p>
          {!importOpen ? (
            <button
              type="button"
              className="btn-text import-toggle"
              onClick={() => setImportOpen(true)}
            >
              已有匯出連結？貼上匯入 →
            </button>
          ) : (
            <>
              <textarea
                className="share-url"
                rows={3}
                placeholder="貼上匯出連結…"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <button type="button" className="btn-secondary import-go" onClick={doImport}>
                匯入
              </button>
            </>
          )}
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

        <div className="share-section">
          <span className="field-label">喜歡這個工具嗎？</span>
          <p className="share-hint">給顆星星或追蹤作者，看新功能上線 🙌</p>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
