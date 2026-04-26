import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfessionals, useUpdateProfessional } from '@/hooks/useProfessionals';
import {
  usePatientAssignments,
  useCreateAssignment,
  useDeleteAssignment,
} from '@/hooks/usePatientAssignments';
import { usePatients } from '@/hooks/usePatients';
import { Users, Search, UserPlus, X, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export function TeamManagement() {
  const { data: professionals, isLoading: loadingP } = useProfessionals();
  const { data: allAssignments, isLoading: loadingA } = usePatientAssignments();
  const { data: patients, isLoading: loadingPat } = usePatients();
  const updateProf = useUpdateProfessional();
  const createAssign = useCreateAssignment();
  const deleteAssign = useDeleteAssignment();

  const [search, setSearch] = useState('');
  const [openProfId, setOpenProfId] = useState<string | null>(null);
  const [patientToAdd, setPatientToAdd] = useState('');
  const [papel, setPapel] = useState('responsavel');

  const isLoading = loadingP || loadingA || loadingPat;

  const filteredProfs = useMemo(() => {
    const list = professionals || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.especialidade || '').toLowerCase().includes(q) ||
        (p.registro || '').toLowerCase().includes(q),
    );
  }, [professionals, search]);

  const assignmentsByProf = useMemo(() => {
    const map = new Map<string, NonNullable<typeof allAssignments>>();
    (allAssignments || []).forEach((a) => {
      const arr = map.get(a.professional_id) || [];
      arr.push(a);
      map.set(a.professional_id, arr);
    });
    return map;
  }, [allAssignments]);

  const patientById = useMemo(() => {
    const m = new Map<string, string>();
    (patients || []).forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [patients]);

  const openProf = (professionals || []).find((p) => p.id === openProfId);
  const openProfAssignments = openProfId ? assignmentsByProf.get(openProfId) || [] : [];
  const openProfPatientIds = new Set(openProfAssignments.map((a) => a.patient_id));
  const availablePatients = (patients || []).filter((p) => !openProfPatientIds.has(p.id));

  const handleAdd = async () => {
    if (!openProfId || !patientToAdd) return;
    try {
      await createAssign.mutateAsync({
        professional_id: openProfId,
        patient_id: patientToAdd,
        papel,
      });
      toast.success('Vínculo criado');
      setPatientToAdd('');
    } catch (err: any) {
      toast.error(`Falha ao vincular: ${err.message ?? 'erro'}`);
    }
  };

  const handleRemove = async (assignmentId: string, patientName: string) => {
    if (!confirm(`Remover vínculo com ${patientName}?`)) return;
    try {
      await deleteAssign.mutateAsync(assignmentId);
      toast.success('Vínculo removido');
    } catch (err: any) {
      toast.error(`Falha ao remover: ${err.message ?? 'erro'}`);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await updateProf.mutateAsync({ id, ativo: !ativo });
      toast.success(ativo ? 'Profissional desativado' : 'Profissional ativado');
    } catch (err: any) {
      toast.error(`Falha: ${err.message ?? 'erro'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, especialidade, registro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredProfs.length} profissional{filteredProfs.length === 1 ? '' : 'is'}
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table className="table-premium">
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead className="hidden sm:table-cell">Especialidade</TableHead>
              <TableHead className="hidden md:table-cell">Registro</TableHead>
              <TableHead className="text-center">Pacientes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                  Nenhum profissional encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProfs.map((p) => {
                const count = assignmentsByProf.get(p.id)?.length || 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {p.nome
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{p.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {p.especialidade || '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground hidden md:table-cell">
                      {p.registro || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-[10px]">
                        {count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          p.ativo
                            ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setOpenProfId(p.id)}
                        >
                          <Link2 className="h-3 w-3" /> Vínculos
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => toggleAtivo(p.id, p.ativo)}
                        >
                          {p.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!openProfId} onOpenChange={(o) => !o && setOpenProfId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Vínculos de {openProf?.nome}
            </DialogTitle>
            <DialogDescription>
              Gerencie os pacientes atribuídos a este profissional. O profissional só vê e edita
              dados dos pacientes vinculados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Adicionar paciente
                </p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select value={patientToAdd} onValueChange={setPatientToAdd}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecione um paciente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePatients.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            Todos os pacientes já estão vinculados
                          </div>
                        ) : (
                          availablePatients.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={papel} onValueChange={setPapel}>
                    <SelectTrigger className="h-9 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="responsavel">Responsável</SelectItem>
                      <SelectItem value="apoio">Apoio</SelectItem>
                      <SelectItem value="observador">Observador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={!patientToAdd || createAssign.isPending}
                    className="gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Vincular
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Pacientes vinculados ({openProfAssignments.length})
              </p>
              {openProfAssignments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                  Nenhum paciente vinculado. Profissional não conseguirá ver pacientes até receber vínculos.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {openProfAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card"
                    >
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        {(patientById.get(a.patient_id) || '?')
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {patientById.get(a.patient_id) || a.patient_id}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {a.papel}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          handleRemove(a.id, patientById.get(a.patient_id) || 'paciente')
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenProfId(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
