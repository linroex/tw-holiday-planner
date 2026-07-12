import type { BreakAnnotation, UserPlan } from '../data/types';

export type PlanAction =
  | { type: 'toggle-leave'; date: string }
  | { type: 'set-quota'; quota: number }
  | { type: 'save-annotation'; annotation: BreakAnnotation }
  | { type: 'import-plan'; plan: UserPlan };

export function planReducer(plan: UserPlan, action: PlanAction): UserPlan {
  switch (action.type) {
    case 'toggle-leave': {
      const leaveDays = plan.leaveDays.includes(action.date)
        ? plan.leaveDays.filter((d) => d !== action.date)
        : [...plan.leaveDays, action.date].sort();
      return { ...plan, leaveDays };
    }
    case 'set-quota':
      return {
        ...plan,
        annualLeaveQuota: Math.max(0, Math.min(365, Math.round(action.quota))),
      };
    case 'save-annotation': {
      const rest = plan.annotations.filter(
        (a) => a.anchorDate !== action.annotation.anchorDate,
      );
      const isEmpty = !action.annotation.name.trim() && !action.annotation.note.trim();
      return { ...plan, annotations: isEmpty ? rest : [...rest, action.annotation] };
    }
    case 'import-plan':
      return action.plan;
  }
}
