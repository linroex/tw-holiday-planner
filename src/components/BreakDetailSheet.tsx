import { useState } from 'react';
import type { BreakAnnotation } from '../data/types';
import { anchorForSegment, annotationsForSegment, type BreakSegment } from '../lib/breaks';
import { formatRange } from './BreakList';

interface Props {
  year: number;
  segment: BreakSegment;
  annotations: readonly BreakAnnotation[];
  onSave: (annotation: BreakAnnotation) => void;
  onClose: () => void;
}

/** 連假命名與備註編輯：輸入即存（dispatch save-annotation），關閉不需確認 */
export function BreakDetailSheet({ year, segment, annotations, onSave, onClose }: Props) {
  const claimed = annotationsForSegment(segment, annotations);
  const anchorDate = anchorForSegment(segment, annotations);
  const editing = claimed.find((a) => a.anchorDate === anchorDate);
  const others = claimed.filter((a) => a !== editing);

  const [name, setName] = useState(editing?.name ?? '');
  const [note, setNote] = useState(editing?.note ?? '');

  const save = (nextName: string, nextNote: string) => {
    onSave({ anchorDate, name: nextName, note: nextNote });
  };

  const inYearLeave = segment.leaveDays.filter((d) => d.startsWith(`${year}-`)).length;
  const outYearLeave = segment.leaveDays.length - inYearLeave;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">{name.trim() || segment.defaultName}</h3>
            <p className="sheet-subtitle">
              {formatRange(segment)} · {segment.totalDays} 天
              {inYearLeave > 0 && ` · 請 ${inYearLeave} 天假`}
              {outYearLeave > 0 && ` · 跨年 ${outYearLeave} 天（不佔預算）`}
            </p>
          </div>
          <button type="button" className="btn-text" onClick={onClose}>
            完成
          </button>
        </div>
        <label className="field">
          <span className="field-label">連假名稱</span>
          <input
            type="text"
            value={name}
            placeholder={segment.defaultName}
            maxLength={30}
            onChange={(e) => {
              setName(e.target.value);
              save(e.target.value, note);
            }}
          />
        </label>
        <label className="field">
          <span className="field-label">備註（機票、住宿、預算…）</span>
          <textarea
            value={note}
            rows={5}
            placeholder="例如：長榮直飛，1月開賣先訂票"
            onChange={(e) => {
              setNote(e.target.value);
              save(name, e.target.value);
            }}
          />
        </label>
        {segment.holidayNames.length > 0 && (
          <p className="detail-holidays">包含假日：{segment.holidayNames.join('、')}</p>
        )}
        {others.length > 0 && (
          <div className="detail-others">
            <p className="field-label">合併前的其他備註</p>
            {others.map((a) => (
              <p key={a.anchorDate} className="detail-other-item">
                <b>{a.name || '（未命名）'}</b>
                {a.note && ` — ${a.note}`}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
