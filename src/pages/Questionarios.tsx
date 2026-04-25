import { useState } from 'react';
import { useQuestionnaireResponses } from '@/hooks/useQuestionnaireResponses';
import { useQuestionnaireItemCounts } from '@/hooks/useQuestionnaireItems';
import { useCareLines } from '@/hooks/useCareLines';
import { usePatients } from '@/hooks/usePatients';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { mapCareLine } from '@/lib/db-helpers';

function getScoreColor(pct: number) {
  if (pct >= 70) return 'bg-[hsl(var(--success))]';
  if (pct >= 40) return 'bg-[hsl(var(--warning))]';
  return 'bg-[hsl(var(--destructive))]';
}

export default function Questionarios() {
  const { currentRole } = useAuth();
  const isPatient = currentRole === 'patient';
  const { data: patients } = usePatients();
  const patientId = isPatient ? (patients?.[0]?.id || undefined) : undefined;
  const { data: responses, isLoading } = useQuestionnaireResponses(patientId);
  const { data: careLinesData } = useCareLines();
  const { data: itemCounts } = useQuestionnaireItemCounts();
  const careLines = (careLinesData || []).map(mapCareLine);
  const baseData = responses || [];
  const totalItems = Object.values(itemCounts || {}).reduce((s, n) => s + n, 0);

  const [filterLine, setFilterLine] = useState('all');

  const respondidos = baseData.filter(q => q.status === 'respondido');
  const pendentes = baseData.filter(q => q.status === 'pendente' || q.status === 'atrasado');

  const filteredAll = filterLine === 'all' ? baseData : baseData.filter(q => {
    const cl = careLines.find(c => c.id === q.care_line_id);
    return cl?.slug === filterLine;
  });
  const filteredPending = filteredAll.filter(q => q.status === 'pendente' || q.status === 'atrasado');
  const filteredAnswered = filteredAll.filter(q => q.status === 'respondido');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{isPatient ? 'Meus Questionários' : 'PROMs & PREMs'}</h1>
        <p className="text-xs text-muted-foreground">{isPatient ? 'Seus questionários de saúde' : 'Questionários de desfechos e experiência do paciente'}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KPICard title="Total" value={baseData.length} icon={ClipboardList} accentColor="info" />
        <KPICard title="Respondidos" value={respondidos.length} icon={CheckCircle} accentColor="success" />
        <KPICard title="Pendentes" value={pendentes.length} icon={Clock} accentColor="warning" />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterLine} onValueChange={setFilterLine}>
          <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Linha de cuidado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as linhas</SelectItem>
            {careLines.map(l => <SelectItem key={l.id} value={l.slug}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="answered">Respondidos</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><QTable data={filteredAll} isPatient={isPatient} careLines={careLines} /></TabsContent>
        <TabsContent value="pending"><QTable data={filteredPending} isPatient={isPatient} careLines={careLines} /></TabsContent>
        <TabsContent value="answered"><QTable data={filteredAnswered} isPatient={isPatient} careLines={careLines} /></TabsContent>
      </Tabs>
    </div>
  );
}

function QTable({ data, isPatient, careLines }: { data: any[]; isPatient: boolean; careLines: any[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden mt-4">
      <Table className="table-premium">
        <TableHeader>
          <TableRow>
            {!isPatient && <TableHead>Paciente</TableHead>}
            <TableHead>Linha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="hidden sm:table-cell">Score</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(q => {
            const line = careLines.find(l => l.id === q.care_line_id);
            const pct = (q.max_score || 0) > 0 ? ((q.score || 0) / q.max_score) * 100 : 0;

            return (
              <TableRow key={q.id}>
                {!isPatient && <TableCell className="text-sm font-medium">{q.patient_name}</TableCell>}
                <TableCell>
                  <span className="status-chip text-[10px]" style={{ background: line ? line.color + '22' : undefined, color: line?.color }}>
                    {line?.name.split(' ')[0] || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="text-[9px]">PROM</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {q.status === 'respondido' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 70 ? 'bg-[hsl(var(--success))]' : pct >= 40 ? 'bg-[hsl(var(--warning))]' : 'bg-[hsl(var(--destructive))]'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono">{q.score}/{q.max_score}</span>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell><StatusChip status={q.status} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
