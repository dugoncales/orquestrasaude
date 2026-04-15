import { useState, useMemo } from 'react';
import { mockAppointments } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

export default function Consultas() {
  const { currentRole, currentUser } = useAuth();
  const isPatient = currentRole === 'patient';
  const patientId = isPatient ? currentUser.patientId : null;

  const baseData = useMemo(
    () => patientId ? mockAppointments.filter(a => a.patientId === patientId) : mockAppointments,
    [patientId]
  );

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProf, setFilterProf] = useState('all');

  const today = baseData.filter(a => a.data === '2025-04-15');
  const professionals = [...new Set(baseData.map(a => a.profissional))];

  const filtered = baseData.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchProf = filterProf === 'all' || a.profissional === filterProf;
    return matchStatus && matchProf;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{isPatient ? 'Minhas Consultas' : 'Consultas'}</h1>
          <p className="text-xs text-muted-foreground">{isPatient ? 'Suas consultas e agenda' : 'Agenda e acompanhamento'}</p>
        </div>
        {!isPatient && <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Consulta</Button>}
      </div>

      {/* Today */}
      <Card className="border-l-2 border-l-primary bg-gradient-to-r from-primary/[0.03] to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Hoje — 15/04/2025</CardTitle>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma consulta hoje</p> : (
            <div className="space-y-3">
              {today.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    {!isPatient && <p className="text-sm font-medium text-foreground">{a.patientName}</p>}
                    <p className="text-xs text-muted-foreground">{a.hora} · {a.tipo} · {a.profissional}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={a.status} />
                    {!isPatient && a.status === 'agendada' && <Button size="sm" className="h-7 text-xs">Iniciar</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="agendada">Agendada</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
            <SelectItem value="faltou">Faltou</SelectItem>
            <SelectItem value="reagendada">Reagendada</SelectItem>
          </SelectContent>
        </Select>
        {!isPatient && (
          <Select value={filterProf} onValueChange={setFilterProf}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* All appointments */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table className="table-premium">
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              {!isPatient && <TableHead>Paciente</TableHead>}
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Profissional</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="text-sm">{a.data}</TableCell>
                <TableCell className="text-sm">{a.hora}</TableCell>
                {!isPatient && <TableCell className="text-sm font-medium">{a.patientName}</TableCell>}
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
