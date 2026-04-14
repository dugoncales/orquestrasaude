import { mockAppointments } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus } from 'lucide-react';

export default function Consultas() {
  const today = mockAppointments.filter(a => a.data === '2025-04-15');
  const upcoming = mockAppointments.filter(a => a.data > '2025-04-15');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Consultas</h1>
          <p className="text-xs text-muted-foreground">Agenda e acompanhamento</p>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Consulta</Button>
      </div>

      {/* Today */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Hoje — 15/04/2025</CardTitle>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma consulta hoje</p> : (
            <div className="space-y-3">
              {today.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                    <p className="text-xs text-muted-foreground">{a.hora} · {a.tipo} · {a.profissional}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={a.status} />
                    {a.status === 'agendada' && <Button variant="outline" size="sm" className="h-7 text-xs">Iniciar</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All appointments */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Profissional</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAppointments.map(a => (
              <TableRow key={a.id}>
                <TableCell className="text-sm">{a.data}</TableCell>
                <TableCell className="text-sm">{a.hora}</TableCell>
                <TableCell className="text-sm font-medium">{a.patientName}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{a.tipo}</TableCell>
                <TableCell className="text-sm hidden sm:table-cell">{a.profissional}</TableCell>
                <TableCell><StatusChip status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
