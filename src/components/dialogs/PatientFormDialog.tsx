import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePatient, useUpdatePatient } from '@/hooks/usePatients';
import { useCareLines } from '@/hooks/useCareLines';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type PatientRow = Database['public']['Tables']['patients']['Row'];

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patient?: PatientRow | null;
  onSaved?: (id: string) => void;
};

const empty = {
  nome: '', cpf: '', sexo: 'M' as 'M'|'F'|'O', data_nascimento: '',
  telefone: '', email: '', convenio: '', unidade: '',
  diagnosticos_ativos: '', alergias: '', medicacoes: '', fatores_risco: '',
  linhas_ativas: [] as string[],
};

const splitCsv = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);
const joinCsv = (a: string[] | null) => (a || []).join(', ');
const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function PatientFormDialog({ open, onOpenChange, patient, onSaved }: Props) {
  const isEdit = !!patient;
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const { data: careLines } = useCareLines();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

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
      });
    } else {
      setForm(empty);
    }
  }, [patient, open]);

  async function handleSubmit() {
    if (!form.nome.trim()) return toast.error('Nome obrigatório');
    if (onlyDigits(form.cpf).length !== 11) return toast.error('CPF deve ter 11 dígitos');
    if (!form.data_nascimento) return toast.error('Data de nascimento obrigatória');
    setSaving(true);
    try {
      const payload = {
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
      };
      let id = patient?.id;
      if (isEdit && patient) {
        await update.mutateAsync({ id: patient.id, ...payload });
        toast.success('Paciente atualizado');
      } else {
        const created = await create.mutateAsync({ ...payload, status_cadastral: 'ativo', data_entrada: new Date().toISOString().slice(0,10) } as any);
        id = created.id;
        toast.success('Paciente criado');
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
          <DialogDescription>Dados cadastrais e clínicos básicos.</DialogDescription>
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
          <div className="sm:col-span-2">
            <Label className="text-xs">Unidade</Label>
            <Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} />
          </div>

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
              {(careLines || []).map(cl => (
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : (isEdit ? 'Salvar' : 'Criar')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
