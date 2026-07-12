import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { UserPlan } from '../data/types';
import { defaultPlan, loadPlan, savePlan } from '../lib/storage';
import { planReducer, type PlanAction } from './planReducer';

interface PlanContextValue {
  plan: UserPlan;
  dispatch: Dispatch<PlanAction>;
  /** 本裝置第一次使用（localStorage 沒有資料）→ 引導設定特休 */
  firstRun: boolean;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ year, children }: { year: number; children: ReactNode }) {
  const initial = useMemo(() => {
    const stored = loadPlan(year);
    return { plan: stored ?? defaultPlan(year), firstRun: stored === null };
  }, [year]);

  const [plan, dispatch] = useReducer(planReducer, initial.plan);

  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  const value = useMemo(
    () => ({ plan, dispatch, firstRun: initial.firstRun }),
    [plan, initial.firstRun],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan 必須在 PlanProvider 內使用');
  return ctx;
}
