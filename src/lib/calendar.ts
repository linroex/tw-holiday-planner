import type { UserPlan } from '../data/types';
import { annotationsForSegment, type BreakSegment } from './breaks';
import { epochDayToISO, formatShort, isoToEpochDay, type ISODate } from './date';

/** 行事曆匯出：.ics 檔（Google/Apple 日曆匯入用） */

const icsDate = (iso: ISODate) => iso.replaceAll('-', '');
const dayAfter = (iso: ISODate) => epochDayToISO(isoToEpochDay(iso) + 1);

function escICS(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 行長 ≤75 octets：以 20 個 code point 折行（中文 3 bytes 也安全） */
function fold(line: string): string {
  const chars = Array.from(line);
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += 20) {
    out.push((i ? ' ' : '') + chars.slice(i, i + 20).join(''));
  }
  return out.join('\r\n');
}

/** 匯出有規劃（有命名或有請假）的連假段為全天事件 */
export function buildICS(plan: UserPlan, segments: BreakSegment[]): string {
  const stamp = `${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tw-holiday-planner//TW',
    'CALSCALE:GREGORIAN',
  ];
  for (const seg of segments) {
    const anns = annotationsForSegment(seg, plan.annotations);
    const named = anns.find((a) => a.name.trim());
    if (!named && seg.leaveDays.length === 0) continue;
    const title = named?.name.trim() ?? seg.defaultName;
    const desc = [
      ...anns.map((a) => a.note.trim()).filter(Boolean),
      seg.leaveDays.length ? `請假：${seg.leaveDays.map(formatShort).join('、')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:thp-${plan.year}-${icsDate(seg.start)}@tw-holiday-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(seg.start)}`,
      `DTEND;VALUE=DATE:${icsDate(dayAfter(seg.end))}`,
      fold(`SUMMARY:${escICS(title)}`),
    );
    if (desc) lines.push(fold(`DESCRIPTION:${escICS(desc)}`));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
