import { mockQuestionnaireResponses } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusChip } from '@/components/shared/StatusChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from '@/components/shared/KPICard';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Questionarios() {
  const respondidos = mockQuestionnaireResponses.filter(q => q.status === 'respondido');
  const pendentes = mockQuestionnaireResponses.filter(q => q.status === 'pendente' || q.status === 'atrasado');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">PROMs & PREMs</h1>
        <p className="text-xs text-muted-foreground">Questionários de desfechos e experiência do paciente</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KPICard title="Total" value={mockQuestionnaireResponses.length} icon={ClipboardList} />
        <KPICard title="Respondidos" value={respondidos.length} icon={CheckCircle} />
        <KPICard title="Pendentes" value={pendentes.length} icon={Clock} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="answered">Respondidos</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <QuestionnaireTable data={mockQuestionnaireResponses} />
        </TabsContent>
        <TabsContent value="pending">
          <QuestionnaireTable data={pendentes} />
        </TabsContent>
        <TabsContent value="answered">
          <QuestionnaireTable data={respondidos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionnaireTable({ data }: { data: typeof mockQuestionnaireResponses }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Linha</TableHead>
            <TableHead className="hidden sm:table-cell">Score</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(q => (
            <TableRow key={q.id}>
              <TableCell className="text-sm font-medium">{q.patientName}</TableCell>
              <TableCell className="text-sm">{q.careLineId}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {q.status === 'respondido' ? (
                  <div className="flex items-center gap-2">
                    <Progress value={(q.score / q.maxScore) * 100} className="h-2 w-16" />
                    <span className="text-xs font-mono">{q.score}/{q.maxScore}</span>
                  </div>
                ) : '—'}
              </TableCell>
              <TableCell><StatusChip status={q.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
