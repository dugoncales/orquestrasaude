import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task: { id: string; descricao: string; status: string; responsavel?: string | null; prazo: string };
};

export function TaskUpdateDialog({ open, onOpenChange, task }: Props) {
  const update = useUpdateTaskStatus();
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await update.mutateAsync({ id: task.id, status });
      toast.success('Tarefa atualizada');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tarefa</DialogTitle>
          <DialogDescription>{task.descricao}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Prazo: {task.prazo}{task.responsavel ? ` · ${task.responsavel}` : ''}
          </p>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
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
  );
}
