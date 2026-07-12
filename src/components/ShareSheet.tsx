import { useRef, useState } from 'react';
import type { UserPlan } from '../data/types';
import { copyText } from '../lib/clipboard';
import { encodeShareHash } from '../lib/share';
import { SocialLinks } from './AppFooter';

interface Props {
  /** 所有年份——分享同樣不分年份（已過去的請假在編碼時剝除） */
  plans: UserPlan[];
  onClose: () => void;
}

/**
 * 分享面板：給別人的兩件事——推薦工具、把行程給朋友看（不含備註、不含過去）。
 * 給自己的備份／行事曆在「匯出」面板。
 */
export function ShareSheet({ plans, onClose }: Props) {
  const planUrlRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState<'tool' | 'plan' | null>(null);

  const utm = (campaign: string) =>
    `?utm_source=share&utm_medium=app&utm_campaign=${campaign}`;
  const base = `${location.origin}${location.pathname}`;
  const toolUrl = `${base}${utm('tool_link')}`;
  const planUrl = `${base}${utm('plan_link')}${encodeShareHash(plans)}`;
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

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3 className="sheet-title">分享</h3>
          <button type="button" className="btn-text" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="share-section">
          <span className="field-label">分享行程給朋友</span>
          <p className="share-hint">朋友打開是唯讀，看不到你的備註。</p>
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
                onClick={() => nativeShare('我的連假規劃', planUrl)}
              >
                ⤴ 系統分享
              </button>
            )}
          </div>
        </div>

        <div className="share-section">
          <span className="field-label">推薦這個工具</span>
          <p className="share-hint">只有工具本身，不含你的規劃資料。</p>
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
          <span className="field-label">喜歡這個工具嗎？</span>
          <p className="share-hint">給顆星星或追蹤作者，看新功能上線 🙌</p>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
