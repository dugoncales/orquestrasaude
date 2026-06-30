/**
 * Configuração por linha de cuidado: indicador-chave + cadência de retornos.
 * Single source of truth para regras clínicas que decidem fluxo (formulário
 * de cadastro, próximo agendamento sugerido, alertas).
 */
import { parameterDictionary } from '@/data/parameters';
import type { CareLineMeta, PatientGoal } from '@/data/types';

export type CareLineKey =
  | 'diabetes' | 'hipertensao' | 'obesidade'
  | 'dislipidemia' | 'saude_mental' | 'asma';

export interface CareLineRule {
  /** Campos que DEVEM ser preenchidos ao ativar a linha (em parameter_records). */
  keyIndicators: string[];
  /** Campo principal usado para destaque no card "Situação por Linha". */
  primaryField: string;
  /**
   * Calcula em quantos dias o próximo retorno deve ser agendado, dado o valor
   * atual do indicador-chave e a meta correspondente.
   */
  nextAppointmentDays: (value: number | null, target: number | null) => number;
  /** Sugestão de tipo de consulta no próximo retorno. */
  followUpType: string;
}

export const careLineRules: Record<CareLineKey, CareLineRule> = {
  diabetes: {
    keyIndicators: ['hba1c'],
    primaryField: 'hba1c',
    nextAppointmentDays: (v, t) => (v == null || t == null ? 90 : v >= t ? 90 : 180),
    followUpType: 'Retorno',
  },
  hipertensao: {
    keyIndicators: ['pas', 'pad'],
    primaryField: 'pas',
    nextAppointmentDays: (v, t) => (v == null || t == null ? 30 : v >= t ? 30 : 90),
    followUpType: 'Retorno',
  },
  obesidade: {
    keyIndicators: ['peso', 'imc'],
    primaryField: 'imc',
    nextAppointmentDays: () => 30,
    followUpType: 'Nutrição',
  },
  dislipidemia: {
    keyIndicators: ['ldl'],
    primaryField: 'ldl',
    nextAppointmentDays: (v, t) => (v == null || t == null ? 90 : v >= t ? 90 : 180),
    followUpType: 'Retorno',
  },
  saude_mental: {
    keyIndicators: ['phq9'],
    primaryField: 'phq9',
    nextAppointmentDays: (v) => (v == null ? 30 : v >= 10 ? 14 : v >= 5 ? 30 : 90),
    followUpType: 'Psicologia',
  },
  asma: {
    keyIndicators: ['act'],
    primaryField: 'act',
    nextAppointmentDays: (v) => (v == null ? 30 : v < 20 ? 30 : 90),
    followUpType: 'Retorno',
  },
};

export function ruleFor(slug: string | null | undefined): CareLineRule | undefined {
  if (!slug) return undefined;
  return careLineRules[slug as CareLineKey];
}

/**
 * Mapeia o `parametro` (label) das `care_lines.metas` ao `field` interno do
 * parameterDictionary. Inclui aliases conhecidos (Exacerbações/ano, Uso de
 * resgate, % Perda de Peso, etc.).
 */
const labelAliases: Record<string, string> = {
  'hba1c': 'hba1c',
  'glicemia de jejum': 'glicemia_jejum',
  'ldl': 'ldl',
  'hdl': 'hdl',
  'triglicerides': 'triglicerides',
  'triglicerídeos': 'triglicerides',
  'colesterol total': 'colesterol_total',
  'pas': 'pas',
  'pad': 'pad',
  'pressão arterial': 'pressao_arterial',
  'imc': 'imc',
  'peso': 'peso',
  'creatinina': 'creatinina',
  'potássio': 'potassio',
  '% perda de peso': 'percentual_perda_peso',
  'circunferência abdominal': 'circunferencia_abdominal',
  'phq-9': 'phq9',
  'gad-7': 'gad7',
  'who-5': 'who5',
  'act': 'act',
  'exacerbações/ano': 'exacerbacoes',
  'uso de resgate': 'uso_de_resgate',
};

export function labelToField(label: string): string | undefined {
  const key = label.trim().toLowerCase();
  if (labelAliases[key]) return labelAliases[key];
  const direct = parameterDictionary.find(p => p.label.toLowerCase() === key);
  return direct?.field;
}

/**
 * Converte as metas (CareLineMeta[]) de uma linha em PatientGoal[] preenchidos
 * a partir de valores digitados pelo usuário. Goals sem valor digitado entram
 * com currentValue = 0 (ficarão "fora da meta" até o primeiro registro real).
 */
export function metasToGoals(
  careLineSlug: string,
  metas: CareLineMeta[],
  values: Record<string, number | null>
): PatientGoal[] {
  return metas
    .map(m => {
      const field = labelToField(m.parametro);
      if (!field) return null;
      const v = values[field];
      return {
        field,
        label: m.parametro,
        target: m.valor,
        operator: m.operador as PatientGoal['operator'],
        currentValue: v ?? 0,
        unit: m.unidade,
        careLineId: careLineSlug,
      } satisfies PatientGoal;
    })
    .filter((g): g is PatientGoal => g !== null);
}
