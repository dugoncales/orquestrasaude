import { useState, useMemo } from 'react';
import { mockExams } from '@/data/mock-data';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FlaskConical, Plus, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

export default function Exames() {
  const { currentRole, currentUser } = useAuth();
  const isPatient = currentRole === 'patient';
  const patientId = isPatient ? currentUser.patientId : null;

  const baseData = useMemo(
    () => patientId ? mockExams.filter(e => e.patientId === patientId) : mockExams,
    [patientId]
  );

  const [filterStatus, setFilterStatus] = useState('all');

  const pending = baseData.filter(e => e.status === 'solicitado' || e.status === 'atrasado');
  const delayed = baseData.filter(e => e.status === 'atrasado');

  const filtered = filterStatus === 'all' ? baseData : baseData.filter(e => e.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{isPatient ? 'Meus Exames' : 'Exames'}</h1>
          <p className="text-xs text-muted-foreground">{isPatient ? 'Seus exames e resultados' : 'Solicitações, resultados e pendências'}</p>
        </div>
        {!isPatient && <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Solicitar Exame</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPICard title="Total" value={baseData.length} icon={FlaskConical} accentColor="info" />
        <KPICard title="Pendentes" value={pending.length} icon={FlaskConical} accentColor="warning" />
        <KPICard title="Atrasados" value={delayed.length} icon={AlertTriangle} accentColor="destructive" />
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="solicitado">Solicitado</SelectItem>
            <SelectItem value="coletado">Coletado</SelectItem>
            <SelectItem value="resultado_disponivel">Resultado</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table className="table-premium">
          <TableHeader>
            <TableRow>
              {!isPatient && <TableHead>Paciente</TableHead>}
              <TableHead>Exame</TableHead>
              <TableHead className="hidden md:table-cell">Solicitação</TableHead>
              <TableHead className="hidden sm:table-cell">Resultado</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id} className={e.status === 'atrasado' ? 'border-l-2 border-l-[hsl(var(--destructive))]' : ''}>
                {!isPatient && <TableCell className="text-sm font-medium">{e.patientName}</TableCell>}
                <TableCell className="text-sm">{e.tipo}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{e.dataSolicitacao}</TableCell>
                <TableCell className="text-sm hidden sm:table-cell">
                  {e.resultado ? (
                    <Badge variant="secondary" className="text-[10px]">{e.resultado}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusChip status={e.status} />
                    {e.status === 'atrasado' && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--destructive))] animate-pulse" />}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
