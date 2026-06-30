import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePatient, useUpdatePatient } from '@/hooks/usePatients';
import { useCareLines } from '@/hooks/useCareLines';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ruleFor, metasToGoals, labelToField } from '@/lib/care-line-config';
import { parameterDictionary } from '@/data/parameters';
import { mapCareLine } from '@/lib/db-helpers';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { PatientGoal } from '@/data/types';

type PatientRow = Database['public']['Tables']['patients']['Row'];

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patient?: PatientRow | null;
  onSaved?: (id: string) => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const empty = {
  nome: '', cpf: '', sexo: 'M' as 'M'|'F'|'O', data_nascimento: '',
  telefone: '', email: '', convenio: '', unidade: '',
  diagnosticos_ativos: '', alergias: '', medicacoes: '', fatores_risco: '',
  linhas_ativas: [] as string[],
  data_entrada: todayISO(),
  primeira_consulta_data: '',
  primeira_consulta_tipo: 'Avaliação inicial',
};

const splitCsv = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);
const joinCsv = (a: string[] | null) => (a || []).join(', ');
const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function PatientFormDialog({ open, onOpenChange, patient, onSaved }: Props) {
  const isEdit = !!patient;
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const createAppointment = useCreateAppointment();
  const { data: careLinesRaw } = useCareLines();
  const { user, profile } = useAuth();
  const [form, setForm] = useState(empty);
  // valores iniciais dos indicadores: key = field
  const [indicators, setIndicators] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const careLines = useMemo(() => (careLinesRaw || []).map(mapCareLine), [careLinesRaw]);

  useEffect(() => {
    if (patient) {
      setForm({
        nome: patient.nome, cpf: patient.cpf, sexo: patient.sexo as any,
        data_nascimento: patient.data_nascimento,
        telefone: patient.telefone || '', email: patient.email || '',
        convenio: patient.convenio || '', unidade: patient.unidade || '',
        diagnosticos_ativos: joinCsv(patient.diagnosticos_ativos),
        alergias: joinCsv(patient.alergias),
        medicacoes: joinCsv(patient.medicacoes),
        fatores_risco: joinCsv(patient.fatores_risco),
        linhas_ativas: patient.linhas_ativas || [],
        data_entrada: patient.data_entrada || todayISO(),
        primeira_consulta_data: '',
        primeira_consulta_tipo: 'Avaliação inicial',
      });
    } else {
      setForm(empty);
    }
    setIndicators({});
  }, [patient, open]);

  // Linhas ativas hoje no form, com suas metas + regra
  const activeLinesDetail = useMemo(() => {
    return form.linhas_ativas
      .map(slug => {
        const cl = careLines.find(c => c.slug === slug);
        if (!cl) return null;
        const rule = ruleFor(slug);
        // mapeia cada meta para um input { field, label, unit, target, operator, isKey }
        const inputs = cl.metas.map(m => {
          const field = labelToField(m.parametro);
          if (!field) return null;
          const dict = parameterDictionary.find(p => p.field === field);
          return {
            field,
            label: m.parametro,
            unit: m.unidade || dict?.unit || '',
            target: m.valor,
            operator: m.operador,
            isKey: rule ? rule.keyIndicators.includes(field) : false,
          };
        }).filter(Boolean) as Array<{ field: string; label: string; unit: string; target: number; operator: string; isKey: boolean }>;
        return { careLine: cl, rule, inputs };
      })
      .filter(Boolean) as Array<{ careLine: ReturnType<typeof mapCareLine>; rule: ReturnType<typeof ruleFor>; inputs: any[] }>;
  }, [form.linhas_ativas, careLines]);

  function calcImc(): number | null {
    const peso = Number(indicators['peso']);
    const altCm = Number(indicators['__altura_cm']);
    if (!peso || !altCm) return null;
    const m = altCm / 100;
    return Number((peso / (m * m)).toFixed(1));
  }

  // Auto-calcula IMC quando peso/altura mudam
  useEffect(() => {
    const imc = calcImc();
    if (imc != null && indicators['imc'] !== String(imc)) {
      setIndicators(s => ({ ...s, imc: String(imc) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators['peso'], indicators['__altura_cm']]);

  function validateKeyIndicators(): string | null {
    for (const { careLine, rule } of activeLinesDetail) {
      if (!rule) continue;
      for (const f of rule.keyIndicators) {
        if (f === 'imc') {
          // aceita IMC direto OU peso+altura
          const hasDirect = indicators['imc'] && !Number.isNaN(Number(indicators['imc']));
          const hasComputed = indicators['peso'] && indicators['__altura_cm'];
          if (!hasDirect && !hasComputed) {
            return `Preencha IMC (ou peso + altura) para ${careLine.name}`;
          }
        } else if (!indicators[f] || Number.isNaN(Number(indicators[f]))) {
          return `Preencha o indicador-chave (${f.toUpperCase()}) para ${careLine.name}`;
        }
      }
    }
    return null;
  }

  function buildGoals(): PatientGoal[] {
    const numValues: Record<string, number | null> = {};
    Object.entries(indicators).forEach(([k, v]) => {
      if (k.startsWith('__')) return;
      const n = Number(v);
      numValues[k] = Number.isFinite(n) && v !== '' ? n : null;
    });
    const all: PatientGoal[] = [];
    for (const { careLine } of activeLinesDetail) {
      all.push(...metasToGoals(careLine.slug, careLine.metas, numValues));
    }
    return all;
  }

  async function persistInitialParameters(patientId: string) {
    const records = Object.entries(indicators)
      .filter(([k, v]) => !k.startsWith('__') && v !== '' && !Number.isNaN(Number(v)))
      .map(([field, v]) => ({
        patient_id: patientId,
        field,
        value: Number(v),
        date: form.data_entrada || todayISO(),
        care_line_id: null,
      }));
    if (records.length === 0) return;
    const { error } = await supabase.from('parameter_records').insert(records);
    if (error) console.warn('parameter_records insert', error);
  }

  async function handleSubmit() {
    if (!form.nome.trim()) return toast.error('Nome obrigatório');
    if (onlyDigits(form.cpf).length !== 11) return toast.error('CPF deve ter 11 dígitos');
    if (!form.data_nascimento) return toast.error('Data de nascimento obrigatória');
    const err = validateKeyIndicators();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const goals = buildGoals();
      const payload: any = {
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        sexo: form.sexo,
        data_nascimento: form.data_nascimento,
        telefone: form.telefone || null,
        email: form.email || null,
        convenio: form.convenio || null,
        unidade: form.unidade || null,
        diagnosticos_ativos: splitCsv(form.diagnosticos_ativos),
        alergias: splitCsv(form.alergias),
        medicacoes: splitCsv(form.medicacoes),
        fatores_risco: splitCsv(form.fatores_risco),
        linhas_ativas: form.linhas_ativas,
        data_entrada: form.data_entrada || todayISO(),
        goals,
      };

      let id = patient?.id;
      if (isEdit && patient) {
        await update.mutateAsync({ id: patient.id, ...payload });
        toast.success('Paciente atualizado');
      } else {
        const created = await create.mutateAsync({ ...payload, status_cadastral: 'ativo' });
        id = created.id;
        toast.success('Paciente criado');
      }

      if (id) {
        await persistInitialParameters(id);
        // recalcula risco com novos parâmetros
        await supabase.rpc('recalc_patient_risk', { _patient_id: id });

        // agenda primeira consulta se data informada
        if (form.primeira_consulta_data) {
          try {
            await createAppointment.mutateAsync({
              patient_id: id,
              patient_name: form.nome.trim(),
              tipo: form.primeira_consulta_tipo,
              profissional: profile?.full_name || user?.email || 'Profissional',
              data: form.primeira_consulta_data,
              hora: '09:00',
              status: 'agendada',
              care_line_id: null,
            });
          } catch (e) {
            console.warn('Falha ao agendar primeira consulta', e);
          }
        }
      }

      onOpenChange(false);
      if (id) onSaved?.(id);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function toggleLinha(slug: string) {
    setForm(f => ({
      ...f,
      linhas_ativas: f.linhas_ativas.includes(slug)
        ? f.linhas_ativas.filter(s => s !== slug)
        : [...f.linhas_ativas, slug],
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          <DialogDescription>Dados cadastrais, clínicos e indicadores iniciais por linha de cuidado.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Nome completo *</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">CPF *</Label>
            <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label className="text-xs">Data nascimento *</Label>
            <Input type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Sexo *</Label>
            <Select value={form.sexo} onValueChange={(v: any) => setForm(f => ({ ...f, sexo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Telefone</Label>
            <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">E-mail</Label>
            <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Convênio</Label>
            <Input value={form.convenio} onChange={e => setForm(f => ({ ...f, convenio: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Unidade</Label>
            <Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} />
          </div>

          <div>
            <Label className="text-xs">Data de entrada *</Label>
            <Input type="date" value={form.data_entrada} onChange={e => setForm(f => ({ ...f, data_entrada: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">1ª consulta (opcional)</Label>
            <Input type="date" value={form.primeira_consulta_data} onChange={e => setForm(f => ({ ...f, primeira_consulta_data: e.target.value }))} />
          </div>
          {form.primeira_consulta_data && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Tipo da 1ª consulta</Label>
              <Select value={form.primeira_consulta_tipo} onValueChange={v => setForm(f => ({ ...f, primeira_consulta_tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avaliação inicial">Avaliação inicial</SelectItem>
                  <SelectItem value="Consulta médica">Consulta médica</SelectItem>
                  <SelectItem value="Enfermagem">Enfermagem</SelectItem>
                  <SelectItem value="Nutrição">Nutrição</SelectItem>
                  <SelectItem value="Psicologia">Psicologia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="sm:col-span-2">
            <Label className="text-xs">Diagnósticos ativos (separe por vírgula)</Label>
            <Textarea rows={2} value={form.diagnosticos_ativos} onChange={e => setForm(f => ({ ...f, diagnosticos_ativos: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Alergias (separe por vírgula)</Label>
            <Input value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Medicações (separe por vírgula)</Label>
            <Textarea rows={2} value={form.medicacoes} onChange={e => setForm(f => ({ ...f, medicacoes: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Fatores de risco (separe por vírgula)</Label>
            <Input value={form.fatores_risco} onChange={e => setForm(f => ({ ...f, fatores_risco: e.target.value }))} />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Linhas de cuidado</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {careLines.map(cl => (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => toggleLinha(cl.slug)}
                  className={`status-chip text-[11px] border ${form.linhas_ativas.includes(cl.slug) ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  {cl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Indicadores iniciais por linha ativa */}
          {activeLinesDetail.map(({ careLine, inputs, rule }) => (
            <div key={careLine.id} className="sm:col-span-2 rounded-lg border border-border p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: careLine.color }}>
                  Indicadores iniciais — {careLine.name}
                </p>
                {rule && (
                  <span className="text-[10px] text-muted-foreground">
                    Chave: {rule.keyIndicators.map(f => f.toUpperCase()).join(' + ')}
                  </span>
                )}
              </div>

              {/* Para obesidade: peso + altura → IMC auto */}
              {careLine.slug === 'obesidade' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px]">Peso (kg) *</Label>
                    <Input type="number" step="0.1" value={indicators['peso'] || ''}
                      onChange={e => setIndicators(s => ({ ...s, peso: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px]">Altura (cm) *</Label>
                    <Input type="number" step="1" value={indicators['__altura_cm'] || ''}
                      onChange={e => setIndicators(s => ({ ...s, __altura_cm: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px]">IMC (auto)</Label>
                    <Input type="number" readOnly value={indicators['imc'] || ''} className="bg-muted/40" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inputs
                  .filter(i => !(careLine.slug === 'obesidade' && (i.field === 'imc' || i.field === 'peso')))
                  .map(i => (
                  <div key={i.field}>
                    <Label className="text-[10px]">
                      {i.label} {i.unit ? `(${i.unit})` : ''}
                      {i.isKey && <span className="text-[hsl(var(--destructive))] ml-0.5">*</span>}
                    </Label>
                    <Input
                      type="number" step="any"
                      value={indicators[i.field] || ''}
                      onChange={e => setIndicators(s => ({ ...s, [i.field]: e.target.value }))}
                      placeholder={`meta ${i.operator} ${i.target}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : (isEdit ? 'Salvar' : 'Criar')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
