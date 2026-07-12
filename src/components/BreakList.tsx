import { Fragment } from 'react';
import type { BreakAnnotation } from '../data/types';
import { annotationsForSegment, type BreakSegment } from '../lib/breaks';
import { formatShort } from '../lib/date';
import { ownerYearOf } from '../state/PlanContext';

interface Props {
  segments: BreakSegment[];
  annotations: readonly BreakAnnotation[];
  onSelect: (seg: BreakSegment) => void;
}

export function formatRange(seg: BreakSegment): string {
  return seg.start === seg.end
    ? formatShort(seg.start)
    : `${formatShort(seg.start)} – ${formatShort(seg.end)}`;
}

export function BreakList({ segments, annotations, onSelect }: Props) {
  if (segments.length === 0) {
    return <p className="empty-hint">還沒有連假，點月曆上的上班日開始規劃吧！</p>;
  }
  let lastYear: number | null = null;
  return (
    <ul className="break-list">
      {segments.map((seg) => {
        const year = ownerYearOf(seg.start);
        const showYearHeader = year !== lastYear;
        lastYear = year;
        const anns = annotationsForSegment(seg, annotations);
        const name = anns.find((a) => a.name.trim())?.name ?? seg.defaultName;
        const hasNote = anns.some((a) => a.note.trim());
        const prefix = `${year}-`;
        const inYearLeave = seg.leaveDays.filter((d) => d.startsWith(prefix)).length;
        const outYearLeave = seg.leaveDays.length - inYearLeave;
        return (
          <Fragment key={seg.start}>
            {showYearHeader && <li className="break-year-header">{year}</li>}
            <li>
              <button type="button" className="break-item" onClick={() => onSelect(seg)}>
                <span className="break-name">
                  {name}
                  {hasNote && <span className="break-note-dot" title="有備註">📝</span>}
                </span>
                <span className="break-range">{formatRange(seg)}</span>
                <span className="break-badges">
                  <span className="badge badge-days">{seg.totalDays} 天</span>
                  {inYearLeave > 0 && (
                    <span className="badge badge-leave">請 {inYearLeave} 天</span>
                  )}
                  {outYearLeave > 0 && (
                    <span className="badge badge-nextyear">跨年 {outYearLeave} 天</span>
                  )}
                </span>
              </button>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
