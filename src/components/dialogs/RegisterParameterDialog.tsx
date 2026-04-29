import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateParameterRecord } from '@/hooks/useParameterRecords';
import { parameterDictionary } from '@/data/parameters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: string;
  defaultField?: string;
  careLineId?: string | null;
};

export function RegisterParameterDialog({ open, onOpenChange, patientId, defaultField, careLineId }: Props) {
  const create = useCreateParameterRecord();
  const [field, setField] = useState(defaultField || 'hba1c');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const param = parameterDictionary.find(p => p.field === field);

  async function handleSubmit() {
    const num = Number(value);
    if (Number.isNaN(num)) return toast.error('Valor numérico inválido');
    if (!date) return toast.error('Data obrigatória');
    setSaving(true);
    try {
      await create.mutateAsync({
        patient_id: patientId,
        field,
        value: num,
        date,
        care_line_id: careLineId || null,
      });
      // Recalcula o nível de risco do paciente
      await supabase.rpc('recalc_patient_risk', { _patient_id: patientId });
      toast.success(`${param?.label || field}: ${num}${param?.unit || ''} registrado`);
      onOpenChange(false);
      setValue('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao registrar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Parâmetro Clínico</DialogTitle>
          <DialogDescription>Adiciona um novo valor ao histórico do paciente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Parâmetro</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {parameterDictionary.map(p => (
                  <SelectItem key={p.field} value={p.field}>{p.label}{p.unit ? ` (${p.unit})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valor {param?.unit ? `(${param.unit})` : ''}</Label>
              <Input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} autoFocus />
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
