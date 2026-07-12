import { useEffect, useState } from 'react';

export interface TourStep {
  selector: string;
  title: string;
  text: string;
}

interface Props {
  steps: TourStep[];
  onClose: () => void;
}

/**
 * 精靈導覽：以聚光燈框住畫面上真實的元素，一步步帶使用者操作。
 * 找不到目標元素的步驟自動略過；點背景或「下一步」前進。
 */
export function Tour({ steps, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[index];

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (!el) {
      // 找不到就跳過這一步
      if (index < steps.length - 1) setIndex(index + 1);
      else onClose();
      return;
    }
    el.scrollIntoView({ block: 'center' });
    const measure = () => setRect(el.getBoundingClientRect());
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [index, step, steps.length, onClose]);

  if (!step || !rect) return null;

  const next = () => {
    setRect(null); // 讓下一步重新定位前不殘留舊框
    if (index < steps.length - 1) setIndex(index + 1);
    else onClose();
  };

  const tooltipAbove = rect.top + rect.height / 2 > window.innerHeight / 2;

  return (
    <div className="tour" onClick={next}>
      <div
        className="tour-highlight"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
      />
      <div
        className="tour-tooltip"
        onClick={(e) => e.stopPropagation()}
        style={
          tooltipAbove
            ? { bottom: window.innerHeight - rect.top + 16 }
            : { top: rect.bottom + 16 }
        }
      >
        <p className="tour-count">
          {index + 1} / {steps.length}
        </p>
        <h4 className="tour-title">{step.title}</h4>
        <p className="tour-text">{step.text}</p>
        <div className="tour-actions">
          <button type="button" className="btn-text" onClick={onClose}>
            跳過
          </button>
          <button type="button" className="btn-primary" onClick={next}>
            {index === steps.length - 1 ? '開始使用 🎉' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
