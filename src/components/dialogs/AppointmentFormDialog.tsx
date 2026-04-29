import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useCareLines } from '@/hooks/useCareLines';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultPatientId?: string;
  careLineId?: string | null;
  journeyStepId?: string | null;
};

export function AppointmentFormDialog({ open, onOpenChange, defaultPatientId, careLineId, journeyStepId }: Props) {
  const { data: patients } = usePatients();
  const { data: careLines } = useCareLines();
  const { user } = useAuth();
  const create = useCreateAppointment();

  const [patientId, setPatientId] = useState(defaultPatientId || '');
  const [tipo, setTipo] = useState('Consulta médica');
  const [profissional, setProfissional] = useState((user?.user_metadata as any)?.full_name || user?.email || '');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('09:00');
  const [careLine, setCareLine] = useState<string>(careLineId || 'none');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const p = patients?.find(x => x.id === patientId);
    if (!p) return toast.error('Selecione o paciente');
    if (!profissional.trim()) return toast.error('Informe o profissional');
    setSaving(true);
    try {
      await create.mutateAsync({
        patient_id: p.id,
        patient_name: p.nome,
        tipo, profissional, data, hora,
        status: 'agendada',
        care_line_id: careLine === 'none' ? null : careLine,
        journey_step_id: journeyStepId || null,
        observacoes: obs || null,
      });
      toast.success('Consulta agendada');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Consulta</DialogTitle>
          <DialogDescription>Agendar consulta clínica</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {(patients || []).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Consulta médica">Consulta médica</SelectItem>
                <SelectItem value="Retorno">Retorno</SelectItem>
                <SelectItem value="Avaliação inicial">Avaliação inicial</SelectItem>
                <SelectItem value="Enfermagem">Enfermagem</SelectItem>
                <SelectItem value="Nutrição">Nutrição</SelectItem>
                <SelectItem value="Psicologia">Psicologia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Profissional</Label>
            <Input value={profissional} onChange={e => setProfissional(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Linha de cuidado</Label>
            <Select value={careLine} onValueChange={setCareLine}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
                {(careLines || []).map(cl => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Agendar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
