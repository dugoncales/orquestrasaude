import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: string;
  patientName: string;
  careLineId?: string | null;
  /** Já calculado a partir de careLineRules. */
  suggestedDate: string;
  suggestedType?: string;
  reason?: string;
};

export function NextAppointmentSuggestionDialog({
  open, onOpenChange, patientId, patientName, careLineId,
  suggestedDate, suggestedType = 'Retorno', reason,
}: Props) {
  const create = useCreateAppointment();
  const { user, profile } = useAuth();
  const [data, setData] = useState(suggestedDate);
  const [hora, setHora] = useState('09:00');
  const [tipo, setTipo] = useState(suggestedType);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try {
      await create.mutateAsync({
        patient_id: patientId,
        patient_name: patientName,
        tipo, profissional: profile?.full_name || user?.email || 'Profissional',
        data, hora,
        status: 'agendada',
        care_line_id: careLineId || null,
      });
      toast.success('Próximo retorno agendado');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar próximo retorno?</DialogTitle>
          <DialogDescription>
            {reason || 'Sugestão baseada no resultado e nas metas da linha de cuidado.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Retorno">Retorno</SelectItem>
                <SelectItem value="Consulta médica">Consulta médica</SelectItem>
                <SelectItem value="Enfermagem">Enfermagem</SelectItem>
                <SelectItem value="Nutrição">Nutrição</SelectItem>
                <SelectItem value="Psicologia">Psicologia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data sugerida</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Agora não</Button>
          <Button onClick={handleConfirm} disabled={saving}>{saving ? 'Salvando...' : 'Agendar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
