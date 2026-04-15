export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          data: string
          id: string
          lido: boolean | null
          mensagem: string
          patient_id: string | null
          patient_name: string | null
          severidade: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          lido?: boolean | null
          mensagem: string
          patient_id?: string | null
          patient_name?: string | null
          severidade: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          lido?: boolean | null
          mensagem?: string
          patient_id?: string | null
          patient_name?: string | null
          severidade?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          care_line_id: string | null
          created_at: string
          data: string
          hora: string
          id: string
          journey_step_id: string | null
          observacoes: string | null
          patient_id: string
          patient_name: string
          profissional: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          care_line_id?: string | null
          created_at?: string
          data: string
          hora: string
          id?: string
          journey_step_id?: string | null
          observacoes?: string | null
          patient_id: string
          patient_name: string
          profissional: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          care_line_id?: string | null
          created_at?: string
          data?: string
          hora?: string
          id?: string
          journey_step_id?: string | null
          observacoes?: string | null
          patient_id?: string
          patient_name?: string
          profissional?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: string[] | null
          active: boolean | null
          care_line_id: string | null
          condition: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          actions?: string[] | null
          active?: boolean | null
          care_line_id?: string | null
          condition: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          actions?: string[] | null
          active?: boolean | null
          care_line_id?: string | null
          condition?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      care_lines: {
        Row: {
          alertas: Json | null
          automacoes: Json | null
          avg_adherence: number | null
          clinical_parameters: string[] | null
          color: string | null
          created_at: string
          criterios_inclusao: string[] | null
          criterios_saida: string[] | null
          exames_padrao: Json | null
          icon: string | null
          id: string
          indicadores_bi: Json | null
          metas: Json | null
          name: string
          patient_count: number | null
          prems: string[] | null
          proms: string[] | null
          slug: string
          tarefas_padrao: Json | null
          updated_at: string
        }
        Insert: {
          alertas?: Json | null
          automacoes?: Json | null
          avg_adherence?: number | null
          clinical_parameters?: string[] | null
          color?: string | null
          created_at?: string
          criterios_inclusao?: string[] | null
          criterios_saida?: string[] | null
          exames_padrao?: Json | null
          icon?: string | null
          id?: string
          indicadores_bi?: Json | null
          metas?: Json | null
          name: string
          patient_count?: number | null
          prems?: string[] | null
          proms?: string[] | null
          slug: string
          tarefas_padrao?: Json | null
          updated_at?: string
        }
        Update: {
          alertas?: Json | null
          automacoes?: Json | null
          avg_adherence?: number | null
          clinical_parameters?: string[] | null
          color?: string | null
          created_at?: string
          criterios_inclusao?: string[] | null
          criterios_saida?: string[] | null
          exames_padrao?: Json | null
          icon?: string | null
          id?: string
          indicadores_bi?: Json | null
          metas?: Json | null
          name?: string
          patient_count?: number | null
          prems?: string[] | null
          proms?: string[] | null
          slug?: string
          tarefas_padrao?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          care_line_id: string | null
          created_at: string
          data_resultado: string | null
          data_solicitacao: string
          id: string
          journey_step_id: string | null
          patient_id: string
          patient_name: string
          resultado: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          care_line_id?: string | null
          created_at?: string
          data_resultado?: string | null
          data_solicitacao: string
          id?: string
          journey_step_id?: string | null
          patient_id: string
          patient_name: string
          resultado?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          care_line_id?: string | null
          created_at?: string
          data_resultado?: string | null
          data_solicitacao?: string
          id?: string
          journey_step_id?: string | null
          patient_id?: string
          patient_name?: string
          resultado?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          consultas_vinculadas: string[] | null
          created_at: string
          data_conclusao: string | null
          exames_vinculados: string[] | null
          id: string
          journey_id: string
          name: string
          pendencias: string[] | null
          prazo: string | null
          questionarios_vinculados: string[] | null
          responsavel: string | null
          status: string
          step_order: number
          tarefas_vinculadas: string[] | null
          updated_at: string
        }
        Insert: {
          consultas_vinculadas?: string[] | null
          created_at?: string
          data_conclusao?: string | null
          exames_vinculados?: string[] | null
          id?: string
          journey_id: string
          name: string
          pendencias?: string[] | null
          prazo?: string | null
          questionarios_vinculados?: string[] | null
          responsavel?: string | null
          status?: string
          step_order: number
          tarefas_vinculadas?: string[] | null
          updated_at?: string
        }
        Update: {
          consultas_vinculadas?: string[] | null
          created_at?: string
          data_conclusao?: string | null
          exames_vinculados?: string[] | null
          id?: string
          journey_id?: string
          name?: string
          pendencias?: string[] | null
          prazo?: string | null
          questionarios_vinculados?: string[] | null
          responsavel?: string | null
          status?: string
          step_order?: number
          tarefas_vinculadas?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          care_line_id: string
          created_at: string
          current_step_index: number | null
          id: string
          patient_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          care_line_id: string
          created_at?: string
          current_step_index?: number | null
          id?: string
          patient_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          care_line_id?: string
          created_at?: string
          current_step_index?: number | null
          id?: string
          patient_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journeys_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      orientacoes: {
        Row: {
          created_at: string
          data: string
          id: string
          patient_id: string
          profissional: string
          texto: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          patient_id: string
          profissional: string
          texto: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          patient_id?: string
          profissional?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "orientacoes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      parameter_records: {
        Row: {
          care_line_id: string | null
          created_at: string
          date: string
          field: string
          id: string
          patient_id: string
          value: number
        }
        Insert: {
          care_line_id?: string | null
          created_at?: string
          date: string
          field: string
          id?: string
          patient_id: string
          value: number
        }
        Update: {
          care_line_id?: string | null
          created_at?: string
          date?: string
          field?: string
          id?: string
          patient_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "parameter_records_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameter_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          alergias: string[] | null
          atividade_fisica: string | null
          avatar: string | null
          cidade: string | null
          condicoes_associadas: string[] | null
          convenio: string | null
          cpf: string
          created_at: string
          data_entrada: string | null
          data_nascimento: string
          diagnosticos_ativos: string[] | null
          dias_sem_retorno: number | null
          email: string | null
          endereco: string | null
          estado: string | null
          etilismo: boolean | null
          fatores_risco: string[] | null
          goals: Json | null
          historico_familiar: string[] | null
          id: string
          linhas_ativas: string[] | null
          medicacoes: string[] | null
          nome: string
          nome_social: string | null
          profissional_referencia: string | null
          risk_level: string | null
          score_risco: number | null
          sexo: string
          status_cadastral: string
          tabagismo: boolean | null
          telefone: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          alergias?: string[] | null
          atividade_fisica?: string | null
          avatar?: string | null
          cidade?: string | null
          condicoes_associadas?: string[] | null
          convenio?: string | null
          cpf: string
          created_at?: string
          data_entrada?: string | null
          data_nascimento: string
          diagnosticos_ativos?: string[] | null
          dias_sem_retorno?: number | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          etilismo?: boolean | null
          fatores_risco?: string[] | null
          goals?: Json | null
          historico_familiar?: string[] | null
          id?: string
          linhas_ativas?: string[] | null
          medicacoes?: string[] | null
          nome: string
          nome_social?: string | null
          profissional_referencia?: string | null
          risk_level?: string | null
          score_risco?: number | null
          sexo: string
          status_cadastral?: string
          tabagismo?: boolean | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          alergias?: string[] | null
          atividade_fisica?: string | null
          avatar?: string | null
          cidade?: string | null
          condicoes_associadas?: string[] | null
          convenio?: string | null
          cpf?: string
          created_at?: string
          data_entrada?: string | null
          data_nascimento?: string
          diagnosticos_ativos?: string[] | null
          dias_sem_retorno?: number | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          etilismo?: boolean | null
          fatores_risco?: string[] | null
          goals?: Json | null
          historico_familiar?: string[] | null
          id?: string
          linhas_ativas?: string[] | null
          medicacoes?: string[] | null
          nome?: string
          nome_social?: string | null
          profissional_referencia?: string | null
          risk_level?: string | null
          score_risco?: number | null
          sexo?: string
          status_cadastral?: string
          tabagismo?: boolean | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_responses: {
        Row: {
          care_line_id: string | null
          created_at: string
          data: string
          id: string
          max_score: number | null
          patient_id: string
          patient_name: string
          questionnaire_id: string
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          care_line_id?: string | null
          created_at?: string
          data: string
          id?: string
          max_score?: number | null
          patient_id: string
          patient_name: string
          questionnaire_id: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          care_line_id?: string | null
          created_at?: string
          data?: string
          id?: string
          max_score?: number | null
          patient_id?: string
          patient_name?: string
          questionnaire_id?: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_responses_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          care_line_id: string | null
          created_at: string
          id: string
          name: string
          perguntas: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          care_line_id?: string | null
          created_at?: string
          id?: string
          name: string
          perguntas?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          care_line_id?: string | null
          created_at?: string
          id?: string
          name?: string
          perguntas?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          care_line_id: string | null
          created_at: string
          descricao: string
          id: string
          journey_step_id: string | null
          patient_id: string
          patient_name: string
          prazo: string
          prioridade: string
          responsavel: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          care_line_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          journey_step_id?: string | null
          patient_id: string
          patient_name: string
          prazo: string
          prioridade?: string
          responsavel: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          care_line_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          journey_step_id?: string | null
          patient_id?: string
          patient_name?: string
          prazo?: string
          prioridade?: string
          responsavel?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_care_line_id_fkey"
            columns: ["care_line_id"]
            isOneToOne: false
            referencedRelation: "care_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
