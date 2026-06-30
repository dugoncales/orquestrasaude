import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { useCareLines } from '@/hooks/useCareLines';
import { mapCareLine } from '@/lib/db-helpers';
import { ruleFor } from '@/lib/care-line-config';
import { NextAppointmentSuggestionDialog } from './NextAppointmentSuggestionDialog';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment: {
    id: string;
    patient_id: string;
    patient_name: string;
    tipo: string;
    data: string;
    status: string;
    care_line_id?: string | null;
  };
};

export function AppointmentUpdateDialog({ open, onOpenChange, appointment }: Props) {
  const update = useUpdateAppointmentStatus();
  const { data: careLinesRaw } = useCareLines();
  const [status, setStatus] = useState(appointment.status);
  const [saving, setSaving] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const careLine = (careLinesRaw || []).map(mapCareLine).find(c => c.id === appointment.care_line_id);
  const rule = ruleFor(careLine?.slug);

  async function handleSave() {
    setSaving(true);
    try {
      await update.mutateAsync({ id: appointment.id, status });
      toast.success('Consulta atualizada');
      onOpenChange(false);
      // se marcada realizada e linha tem regra → oferecer próximo retorno
      if (status === 'realizada' && rule) {
        setShowSuggest(true);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  const suggestedDate = (() => {
    if (!rule) return new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const days = rule.nextAppointmentDays(null, null);
    return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{appointment.tipo}</DialogTitle>
            <DialogDescription>
              {appointment.patient_name} · {appointment.data}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="faltou">Faltou</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="reagendada">Reagendada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Fechar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showSuggest && (
        <NextAppointmentSuggestionDialog
          open={showSuggest}
          onOpenChange={setShowSuggest}
          patientId={appointment.patient_id}
          patientName={appointment.patient_name}
          careLineId={appointment.care_line_id || null}
          suggestedDate={suggestedDate}
          suggestedType={rule?.followUpType || 'Retorno'}
          reason={careLine ? `Cadência sugerida para ${careLine.name}.` : undefined}
        />
      )}
    </>
  );
}
