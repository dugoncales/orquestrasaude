import type { Database } from '@/integrations/supabase/types';
import type { PatientGoal, JourneyStep, JourneyStepStatus, CareLine, CareLineMeta, CareLineTarefa, CareLineExame, CareLineAutomacao, CareLineAlerta, RiskLevel } from '@/data/types';

type CareLineRow = Database['public']['Tables']['care_lines']['Row'];
type JourneyStepRow = Database['public']['Tables']['journey_steps']['Row'];
type PatientRow = Database['public']['Tables']['patients']['Row'];

export function parseGoals(goals: unknown): PatientGoal[] {
  if (!goals || !Array.isArray(goals)) return [];
  return goals as PatientGoal[];
}

export function mapStep(s: JourneyStepRow): JourneyStep {
  return {
    id: s.id,
    name: s.name,
    order: s.step_order,
    status: s.status as JourneyStepStatus,
    responsavel: s.responsavel || undefined,
    prazo: s.prazo || undefined,
    pendencias: s.pendencias || [],
    dataConclusao: s.data_conclusao || undefined,
    consultasVinculadas: s.consultas_vinculadas || [],
    examesVinculados: s.exames_vinculados || [],
    tarefasVinculadas: s.tarefas_vinculadas || [],
    questionariosVinculados: s.questionarios_vinculados || [],
  };
}

export function mapCareLine(row: CareLineRow): CareLine {
  return {
    id: row.slug,
    name: row.name,
    icon: row.icon || 'Activity',
    color: row.color || 'hsl(200,80%,50%)',
    clinicalParameters: row.clinical_parameters || [],
    proms: row.proms || [],
    prems: row.prems || [],
    patientCount: row.patient_count || 0,
    avgAdherence: Number(row.avg_adherence) || 0,
    criteriosInclusao: row.criterios_inclusao || [],
    criteriosSaida: row.criterios_saida || [],
    metas: (row.metas as unknown as CareLineMeta[]) || [],
    tarefasPadrao: (row.tarefas_padrao as unknown as CareLineTarefa[]) || [],
    examesPadrao: (row.exames_padrao as unknown as CareLineExame[]) || [],
    automacoes: (row.automacoes as unknown as CareLineAutomacao[]) || [],
    alertas: (row.alertas as unknown as CareLineAlerta[]) || [],
    indicadoresBI: (row.indicadores_bi as unknown as { nome: string; formula: string; tipo: string }[]) || [],
  };
}

export function riskLevel(p: PatientRow): RiskLevel {
  return (p.risk_level || 'baixo') as RiskLevel;
}
