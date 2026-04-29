import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateExam } from '@/hooks/useExams';
import { usePatients } from '@/hooks/usePatients';
import { useCareLines } from '@/hooks/useCareLines';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultPatientId?: string;
  careLineId?: string | null;
  journeyStepId?: string | null;
};

const TIPOS = ['Hemograma','Glicemia jejum','HbA1c','Perfil lipídico','TSH','Creatinina','Urina I','PSA','Mamografia','ECG','Holter 24h','Eco doppler','Rx tórax','TC tórax','RM coluna','USG abdome'];

export function ExamFormDialog({ open, onOpenChange, defaultPatientId, careLineId, journeyStepId }: Props) {
  const { data: patients } = usePatients();
  const { data: careLines } = useCareLines();
  const create = useCreateExam();

  const [patientId, setPatientId] = useState(defaultPatientId || '');
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [careLine, setCareLine] = useState<string>(careLineId || 'none');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const p = patients?.find(x => x.id === patientId);
    if (!p) return toast.error('Selecione o paciente');
    setSaving(true);
    try {
      await create.mutateAsync({
        patient_id: p.id,
        patient_name: p.nome,
        tipo,
        data_solicitacao: data,
        status: 'solicitado',
        care_line_id: careLine === 'none' ? null : careLine,
        journey_step_id: journeyStepId || null,
      });
      toast.success('Exame solicitado');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Exame</DialogTitle>
          <DialogDescription>Registrar uma nova solicitação de exame.</DialogDescription>
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
            <Label className="text-xs">Tipo de exame</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Data solicitação</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Solicitar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
