import { AlertState, JourneyState, TaskState, TransitionMap } from "./contracts";

export const JOURNEY_TRANSITIONS: TransitionMap<JourneyState> = {
  nao_iniciado: ["em_andamento", "suspenso"],
  em_andamento: ["em_reavaliacao", "suspenso", "concluido"],
  em_reavaliacao: ["em_andamento", "concluido", "suspenso"],
  concluido: [],
  suspenso: ["em_andamento"],
};

export const TASK_TRANSITIONS: TransitionMap<TaskState> = {
  pendente: ["em_andamento", "cancelada", "atrasada"],
  em_andamento: ["concluida", "atrasada", "cancelada"],
  concluida: [],
  cancelada: [],
  atrasada: ["em_andamento", "concluida", "cancelada"],
};

export const ALERT_TRANSITIONS: TransitionMap<AlertState> = {
  novo: ["triagem", "silenciado"],
  triagem: ["em_intervencao", "resolvido"],
  em_intervencao: ["resolvido"],
  resolvido: [],
  silenciado: [],
};

export function canTransition<T extends string>(
  transitions: TransitionMap<T>,
  from: T,
  to: T,
): boolean {
  return (transitions[from] ?? []).includes(to);
}
