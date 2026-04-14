export type UserRole = 'patient' | 'professional' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email: string;
}

export type JourneyStepStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'atrasado' | 'bloqueado';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada' | 'atrasada';
export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico';
export type AppointmentStatus = 'agendada' | 'realizada' | 'faltou' | 'cancelada' | 'reagendada';

export interface PatientGoal {
  field: string;
  label: string;
  target: number;
  operator: '<' | '>' | '<=' | '>=' | '=';
  currentValue: number;
  unit: string;
  careLineId: string;
}

export interface Patient {
  id: string;
  nome: string;
  nomeSocial?: string;
  sexo: 'M' | 'F' | 'O';
  dataNascimento: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  convenio: string;
  unidade: string;
  profissionalReferencia: string;
  dataEntrada: string;
  statusCadastral: 'ativo' | 'inativo' | 'transferido';
  diagnosticosAtivos: string[];
  condicoesAssociadas: string[];
  alergias: string[];
  medicacoes: string[];
  fatoresRisco: string[];
  historicoFamiliar: string[];
  tabagismo: boolean;
  etilismo: boolean;
  atividadeFisica: 'sedentario' | 'leve' | 'moderado' | 'intenso';
  linhasAtivas: string[];
  riskLevel: RiskLevel;
  scoreRisco: number;
  avatar?: string;
  goals: PatientGoal[];
  diasSemRetorno?: number;
}

export interface CareLine {
  id: string;
  name: string;
  icon: string;
  color: string;
  clinicalParameters: string[];
  proms: string[];
  prems: string[];
  patientCount: number;
  avgAdherence: number;
}

export interface ClinicalParameter {
  field: string;
  label: string;
  type: 'number' | 'score' | 'compound' | 'status' | 'risk_flag';
  unit: string | null;
  group: string;
}

export interface JourneyStep {
  id: string;
  name: string;
  order: number;
  status: JourneyStepStatus;
  responsavel?: string;
  prazo?: string;
  pendencias: string[];
  dataConclusao?: string;
  consultasVinculadas?: string[];
  examesVinculados?: string[];
  tarefasVinculadas?: string[];
  questionariosVinculados?: string[];
}

export interface Journey {
  id: string;
  patientId: string;
  careLineId: string;
  steps: JourneyStep[];
  currentStepIndex: number;
  startDate: string;
  status: 'ativa' | 'concluida' | 'pausada';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  profissional: string;
  tipo: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
  careLineId?: string;
  observacoes?: string;
  journeyStepId?: string;
}

export interface Exam {
  id: string;
  patientId: string;
  patientName: string;
  tipo: string;
  dataSolicitacao: string;
  dataResultado?: string;
  status: 'solicitado' | 'coletado' | 'resultado_disponivel' | 'atrasado';
  resultado?: string;
  careLineId?: string;
  journeyStepId?: string;
}

export interface Task {
  id: string;
  patientId: string;
  patientName: string;
  tipo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: TaskStatus;
  careLineId?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  journeyStepId?: string;
}

export interface Alert {
  id: string;
  patientId?: string;
  patientName?: string;
  tipo: 'clinico' | 'operacional' | 'sistema';
  mensagem: string;
  severidade: 'info' | 'warning' | 'critical';
  data: string;
  lido: boolean;
}

export interface ParameterRecord {
  id: string;
  patientId: string;
  field: string;
  value: number;
  date: string;
  careLineId: string;
}

export interface Questionnaire {
  id: string;
  name: string;
  tipo: 'prom' | 'prem';
  careLineId: string;
  perguntas: number;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  patientId: string;
  patientName: string;
  score: number;
  maxScore: number;
  data: string;
  status: 'pendente' | 'respondido' | 'atrasado';
  careLineId: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  actions: string[];
  active: boolean;
  careLineId?: string;
}
