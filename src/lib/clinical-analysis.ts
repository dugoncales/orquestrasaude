// Clinical Analysis Engine — column mapping, validation, patient & cohort analysis

export interface ColumnMapping {
  original: string;
  mapped: string | null;
  confidence: 'auto' | 'suggested' | 'none';
}

export interface ValidationResult {
  qualityScore: number;
  totalRows: number;
  validRows: number;
  issues: ValidationIssue[];
  columnCompleteness: { column: string; filled: number; total: number; percent: number }[];
  duplicates: number;
}

export interface ValidationIssue {
  type: 'missing_required' | 'out_of_range' | 'duplicate' | 'empty_field';
  field: string;
  row?: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface PatientInsight {
  nome: string;
  cpf: string;
  priorityScore: number;
  priority: 'critico' | 'alto' | 'moderado' | 'baixo';
  outOfTarget: { param: string; atual: number | string; meta: string; unidade: string }[];
  clinicalRisk: { level: string; description: string }[];
  operationalRisk: { type: string; detail: string }[];
  nonAdherence: string[];
  rationale: string;
  nextSteps: string[];
  careLines: string[];
}

export interface CohortInsight {
  totalPatients: number;
  outOfTargetPercent: number;
  noReturnPercent: number;
  highRiskPercent: number;
  avgAdherence: number;
  riskDistribution: { level: string; count: number; percent: number }[];
  topProblems: { problem: string; count: number; percent: number }[];
  byCareLine: { line: string; patients: number; outOfTarget: number; adherence: number }[];
}

const KNOWN_FIELDS: Record<string, string[]> = {
  nome: ['nome', 'name', 'paciente', 'patient', 'nome_paciente', 'nome completo'],
  cpf: ['cpf', 'documento', 'doc', 'id_paciente'],
  data_nascimento: ['nascimento', 'data_nascimento', 'dn', 'birth', 'data_nasc', 'dt_nasc'],
  hba1c: ['hba1c', 'hemoglobina glicada', 'a1c', 'glicada'],
  glicemia: ['glicemia', 'glicose', 'glucose', 'glicemia_jejum'],
  pas: ['pas', 'sistolica', 'pressao_sistolica', 'pa_sistolica', 'systolic'],
  pad: ['pad', 'diastolica', 'pressao_diastolica', 'pa_diastolica', 'diastolic'],
  imc: ['imc', 'bmi', 'indice_massa'],
  peso: ['peso', 'weight'],
  altura: ['altura', 'height', 'estatura'],
  ldl: ['ldl', 'ldl_colesterol', 'ldl-c'],
  hdl: ['hdl', 'hdl_colesterol', 'hdl-c'],
  colesterol_total: ['colesterol_total', 'ct', 'colesterol', 'total_cholesterol'],
  triglicerides: ['triglicerides', 'tg', 'triglicerídeos', 'triglycerides'],
  creatinina: ['creatinina', 'creatinine', 'cr'],
  phq9: ['phq9', 'phq-9', 'phq_9', 'depressao'],
  gad7: ['gad7', 'gad-7', 'gad_7', 'ansiedade'],
  act: ['act', 'asthma_control', 'controle_asma'],
  ultima_consulta: ['ultima_consulta', 'last_visit', 'dt_ultima_consulta', 'ultimo_retorno'],
  proxima_consulta: ['proxima_consulta', 'next_visit', 'dt_proxima'],
  linha_cuidado: ['linha_cuidado', 'care_line', 'linha', 'programa'],
  telefone: ['telefone', 'phone', 'tel', 'celular'],
  email: ['email', 'e-mail', 'e_mail'],
  sexo: ['sexo', 'genero', 'gender', 'sex'],
  medicamentos: ['medicamentos', 'medications', 'meds', 'remedios'],
  faltas: ['faltas', 'absences', 'no_show', 'faltou'],
  albuminuria: ['albuminuria', 'albumina_urinaria', 'rac'],
};

const CLINICAL_RANGES: Record<string, { min: number; max: number }> = {
  hba1c: { min: 3, max: 20 },
  glicemia: { min: 30, max: 600 },
  pas: { min: 60, max: 300 },
  pad: { min: 30, max: 200 },
  imc: { min: 10, max: 80 },
  peso: { min: 20, max: 300 },
  altura: { min: 0.5, max: 2.5 },
  ldl: { min: 10, max: 500 },
  hdl: { min: 5, max: 150 },
  colesterol_total: { min: 50, max: 600 },
  triglicerides: { min: 20, max: 2000 },
  creatinina: { min: 0.1, max: 30 },
  phq9: { min: 0, max: 27 },
  gad7: { min: 0, max: 21 },
  act: { min: 5, max: 25 },
  faltas: { min: 0, max: 100 },
};

const CLINICAL_TARGETS: Record<string, { operator: string; value: number; unit: string }> = {
  hba1c: { operator: '<', value: 7, unit: '%' },
  glicemia: { operator: '<', value: 100, unit: 'mg/dL' },
  pas: { operator: '<', value: 130, unit: 'mmHg' },
  pad: { operator: '<', value: 80, unit: 'mmHg' },
  imc: { operator: '<', value: 30, unit: 'kg/m²' },
  ldl: { operator: '<', value: 100, unit: 'mg/dL' },
  hdl: { operator: '>', value: 40, unit: 'mg/dL' },
  colesterol_total: { operator: '<', value: 200, unit: 'mg/dL' },
  triglicerides: { operator: '<', value: 150, unit: 'mg/dL' },
  phq9: { operator: '<', value: 5, unit: 'pts' },
  gad7: { operator: '<', value: 5, unit: 'pts' },
  act: { operator: '≥', value: 20, unit: 'pts' },
};

export function mapColumns(headers: string[]): ColumnMapping[] {
  return headers.map((h) => {
    const normalized = h.toLowerCase().trim().replace(/[\s_-]+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [field, patterns] of Object.entries(KNOWN_FIELDS)) {
      for (const p of patterns) {
        const np = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized === np || normalized.includes(np)) {
          return { original: h, mapped: field, confidence: 'auto' as const };
        }
      }
    }
    // fuzzy: check if any pattern is a substring
    for (const [field, patterns] of Object.entries(KNOWN_FIELDS)) {
      for (const p of patterns) {
        if (normalized.includes(p.substring(0, 3)) && p.length >= 3) {
          return { original: h, mapped: field, confidence: 'suggested' as const };
        }
      }
    }
    return { original: h, mapped: null, confidence: 'none' as const };
  });
}

export function validateData(rows: Record<string, unknown>[], mapping: ColumnMapping[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const mappedFields = mapping.filter((m) => m.mapped);
  const reverseMap: Record<string, string> = {};
  mapping.forEach((m) => { if (m.mapped) reverseMap[m.mapped] = m.original; });

  const requiredFields = ['nome', 'cpf'];
  let validRows = 0;
  const seenCpfs = new Set<string>();
  let duplicates = 0;

  // Column completeness
  const completeness = mappedFields.map((m) => {
    const filled = rows.filter((r) => r[m.original] != null && String(r[m.original]).trim() !== '').length;
    return { column: m.mapped!, filled, total: rows.length, percent: Math.round((filled / rows.length) * 100) };
  });

  rows.forEach((row, idx) => {
    let rowValid = true;

    // Required fields
    for (const rf of requiredFields) {
      const col = reverseMap[rf];
      if (!col || !row[col] || String(row[col]).trim() === '') {
        issues.push({ type: 'missing_required', field: rf, row: idx + 1, message: `Campo obrigatório "${rf}" vazio na linha ${idx + 2}`, severity: 'critical' });
        rowValid = false;
      }
    }

    // CPF duplicates
    const cpfCol = reverseMap['cpf'];
    if (cpfCol && row[cpfCol]) {
      const cpf = String(row[cpfCol]).trim();
      if (seenCpfs.has(cpf)) {
        duplicates++;
        issues.push({ type: 'duplicate', field: 'cpf', row: idx + 1, message: `CPF duplicado "${cpf}" na linha ${idx + 2}`, severity: 'warning' });
      }
      seenCpfs.add(cpf);
    }

    // Range validation
    for (const [field, range] of Object.entries(CLINICAL_RANGES)) {
      const col = reverseMap[field];
      if (col && row[col] != null && String(row[col]).trim() !== '') {
        const val = Number(row[col]);
        if (!isNaN(val) && (val < range.min || val > range.max)) {
          issues.push({ type: 'out_of_range', field, row: idx + 1, message: `${field} = ${val} fora do range (${range.min}-${range.max}) na linha ${idx + 2}`, severity: 'warning' });
        }
      }
    }

    if (rowValid) validRows++;
  });

  const qualityScore = Math.round(
    (validRows / rows.length) * 40 +
    (1 - issues.filter((i) => i.severity === 'critical').length / Math.max(rows.length, 1)) * 30 +
    (completeness.reduce((s, c) => s + c.percent, 0) / Math.max(completeness.length, 1)) * 0.3
  );

  return { qualityScore: Math.min(100, Math.max(0, qualityScore)), totalRows: rows.length, validRows, issues, columnCompleteness: completeness, duplicates };
}

function getVal(row: Record<string, unknown>, reverseMap: Record<string, string>, field: string): number | null {
  const col = reverseMap[field];
  if (!col || row[col] == null || String(row[col]).trim() === '') return null;
  const v = Number(row[col]);
  return isNaN(v) ? null : v;
}

function getStr(row: Record<string, unknown>, reverseMap: Record<string, string>, field: string): string {
  const col = reverseMap[field];
  if (!col || row[col] == null) return '';
  return String(row[col]).trim();
}

function isOutOfTarget(field: string, value: number): boolean {
  const t = CLINICAL_TARGETS[field];
  if (!t) return false;
  if (t.operator === '<') return value >= t.value;
  if (t.operator === '>') return value <= t.value;
  if (t.operator === '≥') return value < t.value;
  return false;
}

function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function analyzePatient(row: Record<string, unknown>, mapping: ColumnMapping[]): PatientInsight {
  const reverseMap: Record<string, string> = {};
  mapping.forEach((m) => { if (m.mapped) reverseMap[m.mapped] = m.original; });

  const nome = getStr(row, reverseMap, 'nome') || 'Paciente sem nome';
  const cpf = getStr(row, reverseMap, 'cpf');
  const outOfTarget: PatientInsight['outOfTarget'] = [];
  const clinicalRisk: PatientInsight['clinicalRisk'] = [];
  const operationalRisk: PatientInsight['operationalRisk'] = [];
  const nonAdherence: string[] = [];
  const careLines: string[] = [];
  const nextSteps: string[] = [];

  // Check clinical targets
  let outOfTargetScore = 0;
  for (const [field, target] of Object.entries(CLINICAL_TARGETS)) {
    const val = getVal(row, reverseMap, field);
    if (val !== null && isOutOfTarget(field, val)) {
      outOfTarget.push({ param: field, atual: val, meta: `${target.operator} ${target.value}`, unidade: target.unit });
      outOfTargetScore += field === 'hba1c' ? 25 : field === 'pas' || field === 'pad' ? 20 : field === 'phq9' ? 20 : 10;
    }
  }
  outOfTargetScore = Math.min(100, outOfTargetScore);

  // Clinical risk
  const hba1c = getVal(row, reverseMap, 'hba1c');
  const phq9 = getVal(row, reverseMap, 'phq9');
  const imc = getVal(row, reverseMap, 'imc');
  const pas = getVal(row, reverseMap, 'pas');
  const albuminuria = getVal(row, reverseMap, 'albuminuria');

  if (hba1c && hba1c >= 9) clinicalRisk.push({ level: 'critical', description: `HbA1c ${hba1c}% — descontrole glicêmico grave` });
  if (hba1c && hba1c >= 7 && hba1c < 9) clinicalRisk.push({ level: 'warning', description: `HbA1c ${hba1c}% — acima da meta` });
  if (phq9 && phq9 >= 15) clinicalRisk.push({ level: 'critical', description: `PHQ-9 ${phq9} — depressão moderada-grave` });
  if (phq9 && phq9 >= 10 && phq9 < 15) clinicalRisk.push({ level: 'warning', description: `PHQ-9 ${phq9} — depressão moderada` });
  if (imc && imc >= 40) clinicalRisk.push({ level: 'critical', description: `IMC ${imc} — obesidade grau III` });
  if (pas && pas >= 180) clinicalRisk.push({ level: 'critical', description: `PAS ${pas} mmHg — crise hipertensiva` });
  if (albuminuria && albuminuria >= 300) clinicalRisk.push({ level: 'critical', description: `Albuminúria ${albuminuria} mg/g — nefropatia` });

  // Operational risk
  const ultimaConsulta = getStr(row, reverseMap, 'ultima_consulta');
  const dias = daysSince(ultimaConsulta);
  let opScore = 0;
  if (dias !== null && dias > 90) {
    operationalRisk.push({ type: 'sem_retorno', detail: `${dias} dias sem retorno (meta: <90 dias)` });
    opScore = Math.min(100, (dias - 90) / 2);
  }

  // Non-adherence
  const faltas = getVal(row, reverseMap, 'faltas');
  let adherenceScore = 0;
  if (faltas && faltas >= 2) {
    nonAdherence.push(`${faltas} faltas registradas`);
    adherenceScore += faltas * 15;
  }
  if (dias && dias > 120) nonAdherence.push('Sem retorno há mais de 120 dias');

  // Care lines detection
  const lc = getStr(row, reverseMap, 'linha_cuidado');
  if (lc) careLines.push(...lc.split(/[,;/]/).map((s) => s.trim()).filter(Boolean));
  else {
    if (hba1c && hba1c >= 6.5) careLines.push('Diabetes');
    if (pas && pas >= 140) careLines.push('Hipertensão');
    if (imc && imc >= 30) careLines.push('Obesidade');
    if (phq9 && phq9 >= 10) careLines.push('Saúde Mental');
  }

  // Priority score
  const priorityScore = Math.min(100, Math.round(
    outOfTargetScore * 0.4 + opScore * 0.2 + adherenceScore * 0.2 + (clinicalRisk.length > 0 ? Math.min(100, clinicalRisk.filter((r) => r.level === 'critical').length * 40 + clinicalRisk.filter((r) => r.level === 'warning').length * 15) : 0) * 0.2
  ));

  const priority: PatientInsight['priority'] = priorityScore >= 75 ? 'critico' : priorityScore >= 50 ? 'alto' : priorityScore >= 25 ? 'moderado' : 'baixo';

  // Rationale
  const rationaleParts: string[] = [];
  if (outOfTarget.length > 0) rationaleParts.push(`${outOfTarget.length} parâmetro(s) fora da meta`);
  if (clinicalRisk.filter((r) => r.level === 'critical').length > 0) rationaleParts.push(`${clinicalRisk.filter((r) => r.level === 'critical').length} risco(s) clínico(s) crítico(s)`);
  if (operationalRisk.length > 0) rationaleParts.push('risco operacional identificado');
  if (nonAdherence.length > 0) rationaleParts.push('sinais de não adesão');
  const rationale = rationaleParts.length > 0
    ? `Prioridade ${priority} (score ${priorityScore}/100): ${rationaleParts.join(', ')}.`
    : `Score ${priorityScore}/100 — sem alertas críticos identificados.`;

  // Next steps
  if (hba1c && hba1c >= 9) nextSteps.push('Revisão urgente do esquema terapêutico para controle glicêmico');
  if (hba1c && hba1c >= 7 && hba1c < 9) nextSteps.push('Intensificar orientação nutricional e avaliar ajuste medicamentoso');
  if (phq9 && phq9 >= 15) nextSteps.push('Priorizar avaliação psiquiátrica e considerar ajuste medicamentoso');
  if (pas && pas >= 180) nextSteps.push('Avaliação de urgência para controle pressórico');
  if (pas && pas >= 140 && pas < 180) nextSteps.push('Revisar esquema anti-hipertensivo e reforçar MAPA');
  if (imc && imc >= 40) nextSteps.push('Avaliar elegibilidade para cirurgia bariátrica');
  if (albuminuria && albuminuria >= 300) nextSteps.push('Encaminhar para nefrologia — DRC em progressão');
  if (dias && dias > 90) nextSteps.push(`Agendar retorno urgente (${dias} dias sem consulta)`);
  if (faltas && faltas >= 3) nextSteps.push('Acionar busca ativa — múltiplas faltas');
  if (nextSteps.length === 0) nextSteps.push('Manter acompanhamento regular conforme protocolo');

  return { nome, cpf, priorityScore, priority, outOfTarget, clinicalRisk, operationalRisk, nonAdherence, rationale, nextSteps, careLines };
}

export function analyzeCohort(insights: PatientInsight[]): CohortInsight {
  const total = insights.length;
  const withOutOfTarget = insights.filter((i) => i.outOfTarget.length > 0).length;
  const withNoReturn = insights.filter((i) => i.operationalRisk.some((r) => r.type === 'sem_retorno')).length;
  const highRisk = insights.filter((i) => i.priority === 'critico' || i.priority === 'alto').length;

  const riskCounts = { critico: 0, alto: 0, moderado: 0, baixo: 0 };
  insights.forEach((i) => riskCounts[i.priority]++);

  const riskDistribution = [
    { level: 'Crítico', count: riskCounts.critico, percent: Math.round((riskCounts.critico / total) * 100) },
    { level: 'Alto', count: riskCounts.alto, percent: Math.round((riskCounts.alto / total) * 100) },
    { level: 'Moderado', count: riskCounts.moderado, percent: Math.round((riskCounts.moderado / total) * 100) },
    { level: 'Baixo', count: riskCounts.baixo, percent: Math.round((riskCounts.baixo / total) * 100) },
  ];

  // Top problems
  const problemCounts: Record<string, number> = {};
  insights.forEach((i) => {
    i.outOfTarget.forEach((o) => {
      const key = `${o.param} fora da meta`;
      problemCounts[key] = (problemCounts[key] || 0) + 1;
    });
    i.operationalRisk.forEach((o) => {
      problemCounts[o.type === 'sem_retorno' ? 'Sem retorno recente' : o.type] = (problemCounts[o.type === 'sem_retorno' ? 'Sem retorno recente' : o.type] || 0) + 1;
    });
    i.nonAdherence.forEach(() => {
      problemCounts['Sinais de não adesão'] = (problemCounts['Sinais de não adesão'] || 0) + 1;
    });
  });
  const topProblems = Object.entries(problemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([problem, count]) => ({ problem, count, percent: Math.round((count / total) * 100) }));

  // By care line
  const lineMap: Record<string, { patients: Set<number>; outOfTarget: number; adherent: number }> = {};
  insights.forEach((ins, idx) => {
    const lines = ins.careLines.length > 0 ? ins.careLines : ['Não classificado'];
    lines.forEach((l) => {
      if (!lineMap[l]) lineMap[l] = { patients: new Set(), outOfTarget: 0, adherent: 0 };
      lineMap[l].patients.add(idx);
      if (ins.outOfTarget.length > 0) lineMap[l].outOfTarget++;
      if (ins.nonAdherence.length === 0) lineMap[l].adherent++;
    });
  });
  const byCareLine = Object.entries(lineMap).map(([line, d]) => ({
    line, patients: d.patients.size, outOfTarget: d.outOfTarget,
    adherence: Math.round((d.adherent / d.patients.size) * 100),
  }));

  const avgAdherence = total > 0 ? Math.round((insights.filter((i) => i.nonAdherence.length === 0).length / total) * 100) : 0;

  return {
    totalPatients: total,
    outOfTargetPercent: Math.round((withOutOfTarget / total) * 100),
    noReturnPercent: Math.round((withNoReturn / total) * 100),
    highRiskPercent: Math.round((highRisk / total) * 100),
    avgAdherence,
    riskDistribution,
    topProblems,
    byCareLine,
  };
}
