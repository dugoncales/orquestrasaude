import { Appointment, Exam, Task, Alert, Journey, QuestionnaireResponse, ParameterRecord } from './types';

const defaultSteps = [
  'Elegibilidade', 'Inclusão na Linha', 'Avaliação Inicial', 'Estratificação de Risco',
  'Plano Terapêutico', 'Seguimento Multiprofissional', 'Coleta PROMs/PREMs',
  'Reavaliação', 'Manutenção ou Intensificação', 'Alta ou Monitoramento'
];

const professionals = ['Dra. Ana Beatriz', 'Enf. Carla', 'Nut. Juliana', 'Psic. Mariana'];

const makeSteps = (journeyId: string, currentIndex: number, pendenciasMap: Record<number, string[]> = {}, statuses: string[] = []) =>
  defaultSteps.map((name, i) => ({
    id: `${journeyId}-s${i}`,
    name,
    order: i,
    status: statuses[i] || (i < currentIndex ? 'concluido' : i === currentIndex ? 'em_andamento' : 'nao_iniciado') as any,
    responsavel: professionals[i % 4],
    prazo: `2025-0${Math.min(i + 1, 9)}-15`,
    pendencias: pendenciasMap[i] || (i === currentIndex ? ['Aguardando resultado de exame'] : []),
    consultasVinculadas: [] as string[],
    examesVinculados: [] as string[],
    tarefasVinculadas: [] as string[],
  }));

// Build journeys with rich step-level pendencies
const j1Steps = makeSteps('j1', 5, {
  5: ['Aguardando resultado de HbA1c', 'Retorno de nutrição pendente'],
  6: ['Questionário de qualidade de vida não respondido'],
});
j1Steps[5].consultasVinculadas = ['a1'];
j1Steps[5].examesVinculados = ['e1'];
j1Steps[5].tarefasVinculadas = ['t1'];

const j2Steps = makeSteps('j2', 4, {
  4: ['Definir meta pressórica personalizada', 'Solicitar MAPA 24h'],
});
j2Steps[4].tarefasVinculadas = ['t6'];

const j3Steps = makeSteps('j3', 3, {
  3: ['Calcular risco cardiovascular global', 'Avaliar composição corporal'],
});
j3Steps[3].consultasVinculadas = ['a2'];

const j4Steps = makeSteps('j4', 6, {
  6: ['PROM de satisfação com monitoramento pendente'],
});
j4Steps[6].examesVinculados = ['e3'];

const j5Steps = makeSteps('j5', 4, {
  3: ['Escala PHQ-9 com piora — reclassificar risco'],
  4: ['Avaliar troca de ISRS', 'Intensificar psicoterapia', 'Monitorar risco de crise'],
}, ['concluido','concluido','concluido','atrasado','em_andamento','nao_iniciado','nao_iniciado','nao_iniciado','nao_iniciado','nao_iniciado']);
j5Steps[4].tarefasVinculadas = ['t2'];
j5Steps[4].consultasVinculadas = ['a4'];

const j6Steps = makeSteps('j6', 7, {
  7: ['Reavaliar esquema insulínico', 'Albuminúria 320mg/g — avaliar progressão DRC'],
});
j6Steps[7].tarefasVinculadas = ['t3'];
j6Steps[7].examesVinculados = ['e4'];

const j7Steps = makeSteps('j7', 5, {
  5: ['Espirometria pendente', 'Verificar técnica inalatória'],
});
j7Steps[5].examesVinculados = ['e5'];
j7Steps[5].tarefasVinculadas = ['t4'];

const j8Steps = makeSteps('j8', 3, {
  3: ['IMC > 40 — avaliar indicação bariátrica', 'Verificar adesão à Semaglutida'],
});
j8Steps[3].tarefasVinculadas = ['t5'];

export const mockJourneys: Journey[] = [
  { id: 'j1', patientId: 'p1', careLineId: 'diabetes', steps: j1Steps, currentStepIndex: 5, startDate: '2024-01-20', status: 'ativa' },
  { id: 'j2', patientId: 'p1', careLineId: 'hipertensao', steps: j2Steps, currentStepIndex: 4, startDate: '2024-01-20', status: 'ativa' },
  { id: 'j3', patientId: 'p1', careLineId: 'obesidade', steps: j3Steps, currentStepIndex: 3, startDate: '2024-02-01', status: 'ativa' },
  { id: 'j4', patientId: 'p2', careLineId: 'hipertensao', steps: j4Steps, currentStepIndex: 6, startDate: '2024-02-15', status: 'ativa' },
  { id: 'j5', patientId: 'p3', careLineId: 'saude_mental', steps: j5Steps, currentStepIndex: 4, startDate: '2024-03-05', status: 'ativa' },
  { id: 'j6', patientId: 'p4', careLineId: 'diabetes', steps: j6Steps, currentStepIndex: 7, startDate: '2023-12-01', status: 'ativa' },
  { id: 'j7', patientId: 'p5', careLineId: 'asma', steps: j7Steps, currentStepIndex: 5, startDate: '2024-04-10', status: 'ativa' },
  { id: 'j8', patientId: 'p6', careLineId: 'obesidade', steps: j8Steps, currentStepIndex: 3, startDate: '2024-05-15', status: 'ativa' },
];

export const mockAppointments: Appointment[] = [
  { id: 'a1', patientId: 'p1', patientName: 'Maria da Silva Santos', profissional: 'Dra. Ana Beatriz', tipo: 'Consulta Médica', data: '2025-04-15', hora: '08:30', status: 'agendada', careLineId: 'diabetes', journeyStepId: 'j1-s5' },
  { id: 'a2', patientId: 'p1', patientName: 'Maria da Silva Santos', profissional: 'Nut. Juliana', tipo: 'Consulta Nutrição', data: '2025-04-16', hora: '10:00', status: 'agendada', careLineId: 'obesidade', journeyStepId: 'j3-s3' },
  { id: 'a3', patientId: 'p2', patientName: 'José Carlos Oliveira', profissional: 'Dr. Ricardo Mendes', tipo: 'Consulta Médica', data: '2025-04-15', hora: '09:30', status: 'agendada', careLineId: 'hipertensao', journeyStepId: 'j4-s6' },
  { id: 'a4', patientId: 'p3', patientName: 'Ana Paula Ferreira', profissional: 'Psic. Mariana', tipo: 'Consulta Psicologia', data: '2025-04-15', hora: '14:00', status: 'agendada', careLineId: 'saude_mental', journeyStepId: 'j5-s4' },
  { id: 'a5', patientId: 'p4', patientName: 'Roberto Almeida Lima', profissional: 'Dra. Ana Beatriz', tipo: 'Consulta Médica', data: '2025-04-14', hora: '11:00', status: 'realizada', careLineId: 'diabetes', journeyStepId: 'j6-s7' },
  { id: 'a6', patientId: 'p5', patientName: 'Fernanda Costa Ribeiro', profissional: 'Dr. Marcos Vieira', tipo: 'Consulta Médica', data: '2025-04-10', hora: '15:00', status: 'faltou', careLineId: 'asma', journeyStepId: 'j7-s5' },
  { id: 'a7', patientId: 'p6', patientName: 'Carlos Eduardo Pinto', profissional: 'Nut. Juliana', tipo: 'Consulta Nutrição', data: '2025-04-17', hora: '09:00', status: 'agendada', careLineId: 'obesidade', journeyStepId: 'j8-s3' },
  { id: 'a8', patientId: 'p8', patientName: 'Pedro Henrique Souza', profissional: 'Dra. Ana Beatriz', tipo: 'Consulta Médica', data: '2025-04-18', hora: '10:30', status: 'agendada', careLineId: 'diabetes' },
];

export const mockExams: Exam[] = [
  { id: 'e1', patientId: 'p1', patientName: 'Maria da Silva Santos', tipo: 'HbA1c', dataSolicitacao: '2025-04-01', status: 'solicitado', careLineId: 'diabetes', journeyStepId: 'j1-s5' },
  { id: 'e2', patientId: 'p1', patientName: 'Maria da Silva Santos', tipo: 'Perfil Lipídico', dataSolicitacao: '2025-04-01', dataResultado: '2025-04-08', status: 'resultado_disponivel', resultado: 'LDL: 145mg/dL', careLineId: 'diabetes', journeyStepId: 'j1-s5' },
  { id: 'e3', patientId: 'p2', patientName: 'José Carlos Oliveira', tipo: 'Creatinina + Potássio', dataSolicitacao: '2025-03-28', status: 'atrasado', careLineId: 'hipertensao', journeyStepId: 'j4-s6' },
  { id: 'e4', patientId: 'p4', patientName: 'Roberto Almeida Lima', tipo: 'Albuminúria', dataSolicitacao: '2025-04-05', dataResultado: '2025-04-12', status: 'resultado_disponivel', resultado: '320 mg/g', careLineId: 'diabetes', journeyStepId: 'j6-s7' },
  { id: 'e5', patientId: 'p5', patientName: 'Fernanda Costa Ribeiro', tipo: 'Espirometria', dataSolicitacao: '2025-04-08', status: 'solicitado', careLineId: 'asma', journeyStepId: 'j7-s5' },
  { id: 'e6', patientId: 'p8', patientName: 'Pedro Henrique Souza', tipo: 'Ecocardiograma', dataSolicitacao: '2025-03-20', status: 'atrasado', careLineId: 'hipertensao' },
];

export const mockTasks: Task[] = [
  { id: 't1', patientId: 'p1', patientName: 'Maria da Silva Santos', tipo: 'Educação em Saúde', descricao: 'Orientar sobre contagem de carboidratos', responsavel: 'Nut. Juliana', prazo: '2025-04-20', status: 'pendente', careLineId: 'diabetes', prioridade: 'alta', journeyStepId: 'j1-s5' },
  { id: 't2', patientId: 'p3', patientName: 'Ana Paula Ferreira', tipo: 'Busca Ativa', descricao: 'Paciente com piora do PHQ-9 — verificar adesão', responsavel: 'Psic. Mariana', prazo: '2025-04-16', status: 'pendente', careLineId: 'saude_mental', prioridade: 'urgente', journeyStepId: 'j5-s4' },
  { id: 't3', patientId: 'p4', patientName: 'Roberto Almeida Lima', tipo: 'Revisão de Plano', descricao: 'Reavaliar esquema insulínico — HbA1c em alta', responsavel: 'Dra. Ana Beatriz', prazo: '2025-04-18', status: 'pendente', careLineId: 'diabetes', prioridade: 'alta', journeyStepId: 'j6-s7' },
  { id: 't4', patientId: 'p5', patientName: 'Fernanda Costa Ribeiro', tipo: 'Busca Ativa', descricao: 'Faltou à última consulta — reagendar', responsavel: 'Enf. Carla', prazo: '2025-04-15', status: 'atrasada', careLineId: 'asma', prioridade: 'media', journeyStepId: 'j7-s5' },
  { id: 't5', patientId: 'p6', patientName: 'Carlos Eduardo Pinto', tipo: 'Checagem Adesão', descricao: 'Verificar uso regular de Semaglutida', responsavel: 'Enf. Carla', prazo: '2025-04-22', status: 'pendente', careLineId: 'obesidade', prioridade: 'media', journeyStepId: 'j8-s3' },
  { id: 't6', patientId: 'p2', patientName: 'José Carlos Oliveira', tipo: 'Solicitação Exame', descricao: 'Solicitar MAPA 24h', responsavel: 'Dr. Ricardo Mendes', prazo: '2025-04-17', status: 'em_andamento', careLineId: 'hipertensao', prioridade: 'media', journeyStepId: 'j2-s4' },
];

export const mockAlerts: Alert[] = [
  { id: 'al1', patientId: 'p4', patientName: 'Roberto Almeida Lima', tipo: 'clinico', mensagem: 'Albuminúria 320 mg/g — acima do limiar. Avaliar progressão de DRC.', severidade: 'critical', data: '2025-04-12', lido: false },
  { id: 'al2', patientId: 'p3', patientName: 'Ana Paula Ferreira', tipo: 'clinico', mensagem: 'PHQ-9 subiu de 12 para 18 — piora progressiva.', severidade: 'critical', data: '2025-04-10', lido: false },
  { id: 'al3', patientId: 'p5', patientName: 'Fernanda Costa Ribeiro', tipo: 'operacional', mensagem: 'Faltou à consulta em 10/04. Busca ativa necessária.', severidade: 'warning', data: '2025-04-10', lido: false },
  { id: 'al4', patientId: 'p8', patientName: 'Pedro Henrique Souza', tipo: 'clinico', mensagem: 'Ecocardiograma atrasado há 25 dias.', severidade: 'warning', data: '2025-04-14', lido: false },
  { id: 'al5', tipo: 'operacional', mensagem: '12 questionários PROMs pendentes há mais de 7 dias.', severidade: 'warning', data: '2025-04-13', lido: true },
  { id: 'al6', patientId: 'p1', patientName: 'Maria da Silva Santos', tipo: 'clinico', mensagem: 'LDL 145mg/dL — acima da meta de 100mg/dL.', severidade: 'warning', data: '2025-04-08', lido: true },
];

export const mockParameterRecords: ParameterRecord[] = [
  { id: 'pr1', patientId: 'p1', field: 'hba1c', value: 8.2, date: '2024-04-01', careLineId: 'diabetes' },
  { id: 'pr2', patientId: 'p1', field: 'hba1c', value: 7.8, date: '2024-07-01', careLineId: 'diabetes' },
  { id: 'pr3', patientId: 'p1', field: 'hba1c', value: 7.5, date: '2024-10-01', careLineId: 'diabetes' },
  { id: 'pr4', patientId: 'p1', field: 'hba1c', value: 7.9, date: '2025-01-01', careLineId: 'diabetes' },
  { id: 'pr5', patientId: 'p1', field: 'peso', value: 92, date: '2024-04-01', careLineId: 'obesidade' },
  { id: 'pr6', patientId: 'p1', field: 'peso', value: 89, date: '2024-07-01', careLineId: 'obesidade' },
  { id: 'pr7', patientId: 'p1', field: 'peso', value: 87, date: '2024-10-01', careLineId: 'obesidade' },
  { id: 'pr8', patientId: 'p1', field: 'peso', value: 88, date: '2025-01-01', careLineId: 'obesidade' },
  { id: 'pr9', patientId: 'p3', field: 'phq9', value: 8, date: '2024-04-01', careLineId: 'saude_mental' },
  { id: 'pr10', patientId: 'p3', field: 'phq9', value: 12, date: '2024-07-01', careLineId: 'saude_mental' },
  { id: 'pr11', patientId: 'p3', field: 'phq9', value: 15, date: '2024-10-01', careLineId: 'saude_mental' },
  { id: 'pr12', patientId: 'p3', field: 'phq9', value: 18, date: '2025-01-01', careLineId: 'saude_mental' },
  { id: 'pr13', patientId: 'p4', field: 'hba1c', value: 9.1, date: '2024-01-01', careLineId: 'diabetes' },
  { id: 'pr14', patientId: 'p4', field: 'hba1c', value: 8.8, date: '2024-04-01', careLineId: 'diabetes' },
  { id: 'pr15', patientId: 'p4', field: 'hba1c', value: 9.3, date: '2024-07-01', careLineId: 'diabetes' },
  { id: 'pr16', patientId: 'p4', field: 'hba1c', value: 9.5, date: '2024-10-01', careLineId: 'diabetes' },
  { id: 'pr17', patientId: 'p8', field: 'pas', value: 145, date: '2024-07-01', careLineId: 'hipertensao' },
  { id: 'pr18', patientId: 'p8', field: 'pas', value: 150, date: '2024-10-01', careLineId: 'hipertensao' },
  { id: 'pr19', patientId: 'p8', field: 'pas', value: 152, date: '2025-01-01', careLineId: 'hipertensao' },
];

export const mockQuestionnaireResponses: QuestionnaireResponse[] = [
  { id: 'qr1', questionnaireId: 'q1', patientId: 'p1', patientName: 'Maria da Silva Santos', score: 62, maxScore: 100, data: '2025-03-15', status: 'respondido', careLineId: 'diabetes' },
  { id: 'qr2', questionnaireId: 'q2', patientId: 'p1', patientName: 'Maria da Silva Santos', score: 78, maxScore: 100, data: '2025-03-15', status: 'respondido', careLineId: 'diabetes' },
  { id: 'qr3', questionnaireId: 'q3', patientId: 'p3', patientName: 'Ana Paula Ferreira', score: 0, maxScore: 100, data: '2025-04-10', status: 'pendente', careLineId: 'saude_mental' },
  { id: 'qr4', questionnaireId: 'q4', patientId: 'p5', patientName: 'Fernanda Costa Ribeiro', score: 0, maxScore: 100, data: '2025-04-05', status: 'atrasado', careLineId: 'asma' },
  { id: 'qr5', questionnaireId: 'q1', patientId: 'p2', patientName: 'José Carlos Oliveira', score: 85, maxScore: 100, data: '2025-03-20', status: 'respondido', careLineId: 'hipertensao' },
  { id: 'qr6', questionnaireId: 'q2', patientId: 'p6', patientName: 'Carlos Eduardo Pinto', score: 0, maxScore: 100, data: '2025-04-12', status: 'pendente', careLineId: 'obesidade' },
];
