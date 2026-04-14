import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Brain, AlertTriangle, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { StatusChip } from '@/components/shared/StatusChip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mockInsights = [
  { patient: 'Roberto Almeida Lima', priority: 'critico' as const, alert: 'HbA1c 9.5% (meta <7%). Albuminúria 320mg/g. DRC em progressão.', suggestion: 'Revisão urgente do esquema insulínico. Encaminhar para nefrologia.' },
  { patient: 'Ana Paula Ferreira', priority: 'alto' as const, alert: 'PHQ-9 subiu de 12→18. Piora progressiva em 6 meses.', suggestion: 'Priorizar agenda psiquiatria. Avaliar ajuste medicamentoso.' },
  { patient: 'Maria da Silva Santos', priority: 'moderado' as const, alert: 'LDL 145mg/dL (meta <100). HbA1c 7.9% (meta <7%).', suggestion: 'Intensificar estatina. Reforçar orientação nutricional.' },
  { patient: 'Carlos Eduardo Pinto', priority: 'alto' as const, alert: 'IMC >40 + Apneia. Perda ponderal insuficiente.', suggestion: 'Avaliar cirurgia bariátrica. Reforçar acompanhamento nutricional.' },
];

const mockCohort = [
  { metric: 'Pacientes com HbA1c acima da meta', value: '42%', severity: 'warning' },
  { metric: 'Sem retorno há >90 dias', value: '18 pacientes', severity: 'critical' },
  { metric: 'PROMs pendentes >7 dias', value: '12 formulários', severity: 'warning' },
  { metric: 'Campos críticos ausentes', value: '8%', severity: 'info' },
];

export default function IAplanilhas() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Clinical Insight AI</h1>
        <p className="text-xs text-muted-foreground">Análise inteligente de planilhas clínicas e operacionais</p>
      </div>

      {!uploaded ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Faça upload da planilha</p>
              <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .xlsx, .csv</p>
            </div>
            <Button onClick={() => setUploaded(true)} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Selecionar Arquivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">dados_ambulatorio_2025.xlsx</p>
                  <p className="text-xs text-muted-foreground">847 registros · 24 colunas · Importado há 2 min</p>
                </div>
              </div>
              <StatusChip status="concluido" />
            </CardContent>
          </Card>

          <Tabs defaultValue="paciente">
            <TabsList>
              <TabsTrigger value="paciente">Por Paciente</TabsTrigger>
              <TabsTrigger value="coorte">Por Coorte</TabsTrigger>
            </TabsList>

            <TabsContent value="paciente" className="space-y-3 mt-4">
              {mockInsights.map((insight, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{insight.patient}</span>
                      </div>
                      <StatusChip status={insight.priority} />
                    </div>
                    <div className="space-y-2 ml-6">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-[hsl(var(--warning))] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{insight.alert}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Target className="h-3 w-3 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-foreground font-medium">{insight.suggestion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="coorte" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Resumo da Coorte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Indicador</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Severidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockCohort.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{c.metric}</TableCell>
                            <TableCell className="text-sm font-mono font-medium">{c.value}</TableCell>
                            <TableCell><StatusChip status={c.severity === 'critical' ? 'critico' : c.severity === 'warning' ? 'alto' : 'moderado'} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
