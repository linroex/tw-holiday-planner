import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { UserPlan } from '../data/types';
import { SUPPORTED_YEARS } from '../data';
import { defaultPlan, loadPlan, savePlan } from '../lib/storage';
import { planReducer, type PlanAction } from './planReducer';

/** 所有支援年份的規劃同時載入，各年份分開儲存（thp.plan.<year>） */
interface PlansContextValue {
  plans: Record<number, UserPlan>;
  dispatchFor: (year: number, action: PlanAction) => void;
  /** 本裝置第一次使用（任何年份都沒有資料）→ 引導設定特休 */
  firstRun: boolean;
}

const PlansContext = createContext<PlansContextValue | null>(null);

function multiPlanReducer(
  plans: Record<number, UserPlan>,
  { year, action }: { year: number; action: PlanAction },
): Record<number, UserPlan> {
  const plan = plans[year];
  if (!plan) return plans;
  return { ...plans, [year]: planReducer(plan, action) };
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => {
    const plans: Record<number, UserPlan> = {};
    let anyStored = false;
    for (const y of SUPPORTED_YEARS) {
      const stored = loadPlan(y);
      if (stored) anyStored = true;
      plans[y] = stored ?? defaultPlan(y);
    }
    return { plans, firstRun: !anyStored };
  }, []);

  const [plans, dispatch] = useReducer(multiPlanReducer, initial.plans);

  useEffect(() => {
    for (const plan of Object.values(plans)) savePlan(plan);
  }, [plans]);

  const dispatchFor = useCallback(
    (year: number, action: PlanAction) => dispatch({ year, action }),
    [],
  );

  const value = useMemo(
    () => ({ plans, dispatchFor, firstRun: initial.firstRun }),
    [plans, dispatchFor, initial.firstRun],
  );

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
}

export function usePlans(): PlansContextValue {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error('usePlans 必須在 PlanProvider 內使用');
  return ctx;
}

/** 日期歸屬的規劃年份：超出支援範圍的（如次年 1 月的跨年請假）歸最近的年份 */
export function ownerYearOf(iso: string): number {
  const y = +iso.slice(0, 4);
  const first = SUPPORTED_YEARS[0]!;
  const last = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1]!;
  return Math.min(Math.max(y, first), last);
}
