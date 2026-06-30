import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateExamStatus } from '@/hooks/useExams';
import { useCareLines } from '@/hooks/useCareLines';
import { mapCareLine } from '@/lib/db-helpers';
import { ruleFor } from '@/lib/care-line-config';
import { NextAppointmentSuggestionDialog } from './NextAppointmentSuggestionDialog';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  examId: string;
  currentStatus: string;
  patientId?: string;
  patientName?: string;
  careLineId?: string | null;
};

export function ExamResultDialog({ open, onOpenChange, examId, currentStatus, patientId, patientName, careLineId }: Props) {
  const update = useUpdateExamStatus();
  const { data: careLinesRaw } = useCareLines();
  const [status, setStatus] = useState(currentStatus === 'solicitado' ? 'coletado' : 'resultado_disponivel');
  const [resultado, setResultado] = useState('');
  const [dataResultado, setDataResultado] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const careLine = (careLinesRaw || []).map(mapCareLine).find(c => c.id === careLineId);
  const rule = ruleFor(careLine?.slug);

  async function handleSubmit() {
    setSaving(true);
    try {
      await update.mutateAsync({
        id: examId,
        status,
        resultado: status === 'resultado_disponivel' ? (resultado || undefined) : undefined,
        data_resultado: status === 'resultado_disponivel' ? dataResultado : undefined,
      });
      toast.success('Status do exame atualizado');
      onOpenChange(false);
      if (status === 'resultado_disponivel' && rule && patientId && patientName) {
        setShowSuggest(true);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  const suggestedDate = (() => {
    const days = rule ? rule.nextAppointmentDays(null, null) : 30;
    return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Exame</DialogTitle>
            <DialogDescription>Registrar coleta ou resultado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coletado">Coletado</SelectItem>
                  <SelectItem value="resultado_disponivel">Resultado disponível</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === 'resultado_disponivel' && (
              <>
                <div>
                  <Label className="text-xs">Resultado</Label>
                  <Textarea rows={3} value={resultado} onChange={e => setResultado(e.target.value)} placeholder="Ex: HbA1c 7.2%, Colesterol total 195 mg/dL..." />
                </div>
                <div>
                  <Label className="text-xs">Data resultado</Label>
                  <Input type="date" value={dataResultado} onChange={e => setDataResultado(e.target.value)} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showSuggest && patientId && patientName && (
        <NextAppointmentSuggestionDialog
          open={showSuggest}
          onOpenChange={setShowSuggest}
          patientId={patientId}
          patientName={patientName}
          careLineId={careLineId || null}
          suggestedDate={suggestedDate}
          suggestedType={rule?.followUpType || 'Retorno'}
          reason={careLine ? `Resultado disponível — cadência sugerida para ${careLine.name}.` : undefined}
        />
      )}
    </>
  );
}
