import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInviteUser } from '@/hooks/useTeamMembers';
import { toast } from 'sonner';
import { Loader2, Copy } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function InviteUserDialog({ open, onOpenChange }: Props) {
  const invite = useInviteUser();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'professional' | 'patient'>('professional');
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  const reset = () => { setEmail(''); setFullName(''); setRole('professional'); setTempPwd(null); };

  const submit = async () => {
    if (!email.trim() || !fullName.trim()) { toast.error('Preencha nome e email'); return; }
    try {
      const res: any = await invite.mutateAsync({ email: email.trim(), full_name: fullName.trim(), role });
      if (res?.temp_password) {
        setTempPwd(res.temp_password);
        toast.success('Usuário criado. Compartilhe a senha temporária.');
      } else {
        toast.success('Usuário criado');
        reset();
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao convidar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>Cria um novo usuário com papel definido. Apenas administradores.</DialogDescription>
        </DialogHeader>
        {tempPwd ? (
          <div className="space-y-3 py-2">
            <p className="text-sm">Usuário criado. Senha temporária:</p>
            <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted font-mono text-sm">
              <span className="flex-1">{tempPwd}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(tempPwd); toast.success('Copiado'); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">O usuário deverá alterar a senha após o primeiro login.</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Papel</Label>
              <Select value={role} onValueChange={v => setRole(v as any)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="patient">Paciente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          {tempPwd ? (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Concluir</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={invite.isPending}>
                {invite.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Convidar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
