import { useState } from 'react';
import { mockQuestionnaireResponses } from '@/data/mock-data';
import { careLines } from '@/data/care-lines';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function getScoreColor(pct: number) {
  if (pct >= 70) return 'bg-[hsl(var(--success))]';
  if (pct >= 40) return 'bg-[hsl(var(--warning))]';
  return 'bg-[hsl(var(--destructive))]';
}

export default function Questionarios() {
  const [filterLine, setFilterLine] = useState('all');

  const respondidos = mockQuestionnaireResponses.filter(q => q.status === 'respondido');
  const pendentes = mockQuestionnaireResponses.filter(q => q.status === 'pendente' || q.status === 'atrasado');

  const filteredAll = filterLine === 'all' ? mockQuestionnaireResponses : mockQuestionnaireResponses.filter(q => q.careLineId === filterLine);
  const filteredPending = filteredAll.filter(q => q.status === 'pendente' || q.status === 'atrasado');
  const filteredAnswered = filteredAll.filter(q => q.status === 'respondido');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">PROMs & PREMs</h1>
        <p className="text-xs text-muted-foreground">Questionários de desfechos e experiência do paciente</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KPICard title="Total" value={mockQuestionnaireResponses.length} icon={ClipboardList} accentColor="info" />
        <KPICard title="Respondidos" value={respondidos.length} icon={CheckCircle} accentColor="success" />
        <KPICard title="Pendentes" value={pendentes.length} icon={Clock} accentColor="warning" />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterLine} onValueChange={setFilterLine}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Linha de cuidado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as linhas</SelectItem>
            {careLines.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="answered">Respondidos</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <QuestionnaireTable data={filteredAll} />
        </TabsContent>
        <TabsContent value="pending">
          <QuestionnaireTable data={filteredPending} />
        </TabsContent>
        <TabsContent value="answered">
          <QuestionnaireTable data={filteredAnswered} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionnaireTable({ data }: { data: typeof mockQuestionnaireResponses }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden mt-4">
      <Table className="table-premium">
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Linha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="hidden sm:table-cell">Score</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(q => {
            const line = careLines.find(l => l.id === q.careLineId);
            const isProm = line?.proms.some(() => true);
            const pct = q.maxScore > 0 ? (q.score / q.maxScore) * 100 : 0;

            return (
              <TableRow key={q.id}>
                <TableCell className="text-sm font-medium">{q.patientName}</TableCell>
                <TableCell>
                  <span className="status-chip text-[10px]" style={{ background: line ? line.color + '22' : undefined, color: line?.color }}>
                    {line?.name.split(' ')[0] || q.careLineId}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={isProm ? 'default' : 'secondary'} className="text-[9px]">
                    {isProm ? 'PROM' : 'PREM'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {q.status === 'respondido' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreColor(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono">{q.score}/{q.maxScore}</span>
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
