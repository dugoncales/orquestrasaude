import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateExamStatus } from '@/hooks/useExams';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  examId: string;
  currentStatus: string;
};

export function ExamResultDialog({ open, onOpenChange, examId, currentStatus }: Props) {
  const update = useUpdateExamStatus();
  const [status, setStatus] = useState(currentStatus === 'solicitado' ? 'coletado' : 'resultado_disponivel');
  const [resultado, setResultado] = useState('');
  const [dataResultado, setDataResultado] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

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
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
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
  );
}
