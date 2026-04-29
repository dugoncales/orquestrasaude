import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateOrientacao } from '@/hooks/useOrientacoes';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Props = { open: boolean; onOpenChange: (o: boolean) => void; patientId: string };

export function AddOrientacaoDialog({ open, onOpenChange, patientId }: Props) {
  const create = useCreateOrientacao();
  const { user } = useAuth();
  const profName = (user?.user_metadata as any)?.full_name || user?.email || 'Profissional';
  const [texto, setTexto] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!texto.trim()) return toast.error('Descreva a orientação');
    setSaving(true);
    try {
      await create.mutateAsync({
        patient_id: patientId,
        texto: texto.trim(),
        profissional: profName,
        data,
      });
      toast.success('Orientação registrada');
      onOpenChange(false);
      setTexto('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Orientação</DialogTitle>
          <DialogDescription>Registra uma orientação clínica para o paciente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Orientação</Label>
            <Textarea rows={4} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ex: Aumentar atividade física para 150min/sem..." autoFocus />
          </div>
          <div>
            <Label className="text-xs">Data</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
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
