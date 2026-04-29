import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTask } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: string;
  patientName: string;
  careLineId?: string | null;
  journeyStepId?: string | null;
};

export function TaskFormDialog({ open, onOpenChange, patientId, patientName, careLineId, journeyStepId }: Props) {
  const create = useCreateTask();
  const { user } = useAuth();
  const profName = (user?.user_metadata as any)?.full_name || user?.email || 'Profissional';

  const [tipo, setTipo] = useState('Acompanhamento');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState(profName);
  const [prazo, setPrazo] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [prioridade, setPrioridade] = useState('media');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!descricao.trim()) return toast.error('Descreva a tarefa');
    setSaving(true);
    try {
      await create.mutateAsync({
        patient_id: patientId, patient_name: patientName,
        tipo, descricao: descricao.trim(),
        responsavel, prazo, prioridade,
        status: 'pendente',
        care_line_id: careLineId || null,
        journey_step_id: journeyStepId || null,
      });
      toast.success('Tarefa criada');
      onOpenChange(false);
      setDescricao('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>{patientName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
                <SelectItem value="Busca ativa">Busca ativa</SelectItem>
                <SelectItem value="Educação em saúde">Educação em saúde</SelectItem>
                <SelectItem value="Reagendamento">Reagendamento</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Prazo</Label>
              <Input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Criar tarefa'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
