import { CareLineSeed, JourneyTemplateSeed } from "./contracts";

export const PHASE1_CARE_LINE_SEEDS: CareLineSeed[] = [
  {
    id: "diabetes",
    name: "Diabetes Mellitus",
    clinicalParameters: ["hba1c", "glicemia_jejum", "imc", "pressao_arterial", "ldl"],
    defaultProms: ["qualidade_de_vida", "adesao_tratamento"],
    defaultPrems: ["clareza_das_orientacoes", "tempo_de_resposta"],
  },
  {
    id: "hipertensao",
    name: "Hipertensao Arterial",
    clinicalParameters: ["pas", "pad", "fc", "imc", "creatinina"],
    defaultProms: ["bem_estar", "adesao"],
    defaultPrems: ["clareza_do_plano", "facilidade_de_monitoramento"],
  },
];

export const PHASE1_JOURNEY_TEMPLATES: JourneyTemplateSeed[] = [
  {
    id: "journey-template-diabetes-v1",
    careLineId: "diabetes",
    steps: [
      "elegibilidade",
      "inclusao_na_linha",
      "avaliacao_inicial",
      "estratificacao_de_risco",
      "plano_terapeutico",
      "seguimento_multiprofissional",
      "reavaliacao",
    ],
  },
  {
    id: "journey-template-hipertensao-v1",
    careLineId: "hipertensao",
    steps: [
      "elegibilidade",
      "inclusao_na_linha",
      "avaliacao_inicial",
      "estratificacao_de_risco",
      "plano_terapeutico",
      "seguimento_multiprofissional",
      "reavaliacao",
    ],
  },
];
