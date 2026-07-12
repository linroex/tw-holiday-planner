import { useRef, useState } from 'react';
import type { UserPlan } from '../data/types';
import { copyText } from '../lib/clipboard';
import { buildICS } from '../lib/calendar';
import { encodeBackupHash } from '../lib/share';
import type { BreakSegment } from '../lib/breaks';

interface Props {
  /** 所有年份的規劃——備份一律全帶 */
  plans: UserPlan[];
  segments: BreakSegment[];
  onClose: () => void;
}

/**
 * 匯出面板：給自己用的兩件事——備份連結（全部年份、含備註，打開即還原）、下載 .ics。
 * 給朋友的在「分享」面板（單一年份、不含備註），兩者分開後不需要任何勾選。
 */
export function ExportSheet({ plans, segments, onClose }: Props) {
  const urlRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const exportUrl = `${location.origin}${location.pathname}?utm_source=share&utm_medium=app&utm_campaign=export_link${encodeBackupHash(plans)}`;

  const copy = async () => {
    try {
      await copyText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      urlRef.current?.focus();
      urlRef.current?.setSelectionRange(0, exportUrl.length);
    }
  };

  const downloadICS = () => {
    const blob = new Blob([buildICS(plans, segments)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '連假規劃.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet export-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3 className="sheet-title">匯出</h3>
          <button type="button" className="btn-text" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="share-section">
          <span className="field-label">備份連結</span>
          <p className="share-hint">
            存進記事本就是備份，<b>要還原時打開連結即可</b>。之後有修改，記得重新匯出。
          </p>
          <textarea
            ref={urlRef}
            className="share-url"
            readOnly
            rows={3}
            value={exportUrl}
            onFocus={() => urlRef.current?.setSelectionRange(0, exportUrl.length)}
          />
          <button type="button" className="btn-primary share-copy" onClick={copy}>
            {copied ? '已複製 ✓' : '複製備份連結'}
          </button>
        </div>

        <div className="share-section">
          <span className="field-label">加入行事曆</span>
          <button type="button" className="btn-secondary export-ics" onClick={downloadICS}>
            下載 .ics 檔（Google／Apple 日曆）
          </button>
          <p className="share-hint">
            手機直接開啟檔案即可加入；電腦版 Google 日曆在「設定 → 匯入與匯出」。
          </p>
        </div>
      </div>
    </div>
  );
}
