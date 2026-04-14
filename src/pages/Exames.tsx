import { mockExams } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FlaskConical, Plus, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/shared/KPICard';

export default function Exames() {
  const pending = mockExams.filter(e => e.status === 'solicitado' || e.status === 'atrasado');
  const delayed = mockExams.filter(e => e.status === 'atrasado');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Exames</h1>
          <p className="text-xs text-muted-foreground">Solicitações, resultados e pendências</p>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Solicitar Exame</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPICard title="Total" value={mockExams.length} icon={FlaskConical} />
        <KPICard title="Pendentes" value={pending.length} icon={FlaskConical} />
        <KPICard title="Atrasados" value={delayed.length} icon={AlertTriangle} />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Exame</TableHead>
              <TableHead className="hidden md:table-cell">Solicitação</TableHead>
              <TableHead className="hidden sm:table-cell">Resultado</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExams.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-sm font-medium">{e.patientName}</TableCell>
                <TableCell className="text-sm">{e.tipo}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{e.dataSolicitacao}</TableCell>
                <TableCell className="text-sm hidden sm:table-cell">{e.resultado || '—'}</TableCell>
                <TableCell><StatusChip status={e.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
