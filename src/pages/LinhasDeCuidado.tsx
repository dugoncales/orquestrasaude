import { useState, useMemo } from 'react';
import { careLines } from '@/data/care-lines';
import { mockPatients } from '@/data/mock-patients';
import { parameterDictionary } from '@/data/parameters';
import { CareLine } from '@/data/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import {
  Plus, ArrowLeft, Users, TrendingUp, Target, ClipboardList,
  FlaskConical, FileText, Zap, AlertTriangle, LogIn, LogOut,
  Activity, Heart, Scale, Droplets, Brain, Wind, Eye, Share2,
  Download, Filter, Calendar, ChevronDown
} from 'lucide-react';

const iconMap: Record<string, any> = { Activity, Heart, Scale, Droplets, Brain, Wind };

const PERIOD_OPTIONS = [
  { value: '1', label: 'Último mês' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
];

function exportCSV(lines: CareLine[]) {
  const headers = ['Linha', 'Pacientes', 'Adesão (%)', 'Metas', 'Tarefas', 'Exames', 'Automações Ativas', 'Alertas'];
  const rows = lines.map(l => [
    l.name, l.patientCount, l.avgAdherence, l.metas.length,
    l.tarefasPadrao.length, l.examesPadrao.length,
    l.automacoes.filter(a => a.ativa).length, l.alertas.length
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'linhas_de_cuidado.csv'; a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exportado com sucesso');
}

export default function LinhasDeCuidado() {
  const [selectedLine, setSelectedLine] = useState<CareLine | null>(null);
  const [viewMode, setViewMode] = useState<'lines' | 'integrated'>('lines');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedLineFilters, setSelectedLineFilters] = useState<string[]>([]);
  const [period, setPeriod] = useState('12');

  const multiLinePatients = mockPatients.filter(p => p.linhasAtivas.length > 1);
  const selectedPatient = mockPatients.find(p => p.id === selectedPatientId);

  const filteredLines = useMemo(() => {
    if (selectedLineFilters.length === 0) return careLines;
    return careLines.filter(l => selectedLineFilters.includes(l.id));
  }, [selectedLineFilters]);

  const priorityPatients = useMemo(() => {
    let patients = [...mockPatients].filter(p => p.statusCadastral === 'ativo');
    if (selectedLineFilters.length > 0) {
      patients = patients.filter(p => p.linhasAtivas.some(la => selectedLineFilters.includes(la)));
    }
    return patients.sort((a, b) => b.scoreRisco - a.scoreRisco).slice(0, 10);
  }, [selectedLineFilters]);

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || '12 meses';

  const toggleLineFilter = (id: string) => {
    setSelectedLineFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (selectedLine) {
    return <CareLineDetail line={selectedLine} onBack={() => setSelectedLine(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Linhas de Cuidado</h1>
          <p className="text-xs text-muted-foreground">{careLines.length} linhas configuradas · {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button variant={viewMode === 'lines' ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setViewMode('lines')}>
              <Eye className="h-3 w-3 mr-1" /> Por Linha
            </Button>
            <Button variant={viewMode === 'integrated' ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setViewMode('integrated')}>
              <Share2 className="h-3 w-3 mr-1" /> Integrada
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => exportCSV(filteredLines)}>
            <Download className="h-3 w-3" /> Exportar
          </Button>
          <Button size="sm" className="gap-1" onClick={() => toast.success('Nova linha de cuidado (em breve)')}>
            <Plus className="h-4 w-4" /> Nova Linha
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
              <Filter className="h-3 w-3" />
              Linhas {selectedLineFilters.length > 0 && <Badge className="h-4 px-1.5 text-[10px]">{selectedLineFilters.length}</Badge>}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {careLines.map(l => (
                <label key={l.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 cursor-pointer text-xs">
                  <Checkbox
                    checked={selectedLineFilters.includes(l.id)}
                    onCheckedChange={() => toggleLineFilter(l.id)}
                  />
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: l.color }} />
                  {l.name}
                </label>
              ))}
              {selectedLineFilters.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => setSelectedLineFilters([])}>
                  Limpar filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <Calendar className="h-3 w-3 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'lines' ? (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLines.map(line => {
              const Icon = iconMap[line.icon] || Activity;
              return (
                <Card
                  key={line.id}
                  className="border-t-2 hover:border-primary/50 transition-colors cursor-pointer group"
                  style={{ borderTopColor: line.color }}
                  onClick={() => setSelectedLine(line)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: line.color + '22' }}>
                        <Icon className="h-5 w-5" style={{ color: line.color }} />
                      </div>
                      <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Ver detalhes →</Badge>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">{line.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{line.patientCount}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{line.avgAdherence}% adesão</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{line.metas.length} metas</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{line.tarefasPadrao.length} tarefas</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{line.automacoes.length} automações</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{line.alertas.length} alertas</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Priority Patients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Pacientes Prioritários
                <Badge variant="secondary" className="text-[10px]">Top 10</Badge>
              </h2>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {priorityPatients.map(patient => {
                const offTarget = patient.goals.filter(g => {
                  if (g.operator === '<') return g.currentValue >= g.target;
                  if (g.operator === '>') return g.currentValue <= g.target;
                  return g.currentValue !== g.target;
                });
                const patientCareLines = careLines.filter(l => patient.linhasAtivas.includes(l.id));
                return (
                  <Card key={patient.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{patient.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <RiskSemaphore level={patient.riskLevel} score={patient.scoreRisco} />
                            <span className="text-[10px] text-muted-foreground capitalize">{patient.riskLevel}</span>
                          </div>
                        </div>
                        {patient.diasSemRetorno !== undefined && (
                          <Badge variant={patient.diasSemRetorno > 30 ? 'destructive' : 'outline'} className="text-[10px]">
                            {patient.diasSemRetorno}d sem retorno
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-1 flex-wrap mb-2">
                        {patientCareLines.map(l => (
                          <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: l.color + '22', color: l.color }}>
                            {l.name}
                          </span>
                        ))}
                      </div>

                      {offTarget.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-semibold">Fora da meta:</p>
                          {offTarget.slice(0, 3).map((g, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">{g.label}</span>
                              <span className="text-destructive font-mono">{g.currentValue} {g.unit} (meta {g.operator} {g.target})</span>
                            </div>
                          ))}
                          {offTarget.length > 3 && <p className="text-[10px] text-muted-foreground">+{offTarget.length - 3} mais</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <IntegratedView
          patients={multiLinePatients}
          selectedPatientId={selectedPatientId}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatientId}
        />
      )}
    </div>
  );
}

/* ─── Detail View ─── */
function CareLineDetail({ line, onBack }: { line: CareLine; onBack: () => void }) {
  const Icon = iconMap[line.icon] || Activity;
  const paramLabels = (fields: string[]) => fields.map(f => parameterDictionary.find(p => p.field === f)?.label || f);
  const linePatients = mockPatients.filter(p => p.linhasAtivas.includes(line.id)).sort((a, b) => b.scoreRisco - a.scoreRisco);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: line.color + '22' }}>
          <Icon className="h-5 w-5" style={{ color: line.color }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{line.name}</h1>
          <p className="text-xs text-muted-foreground">{line.patientCount} pacientes · {line.avgAdherence}% adesão média</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pacientes', value: line.patientCount, icon: Users },
          { label: 'Adesão', value: `${line.avgAdherence}%`, icon: TrendingUp },
          { label: 'Metas', value: line.metas.length, icon: Target },
          { label: 'Automações', value: line.automacoes.filter(a => a.ativa).length, icon: Zap },
        ].map(kpi => (
          <Card key={kpi.label}><CardContent className="p-4 flex items-center gap-3">
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
            <div><p className="text-lg font-bold text-foreground">{kpi.value}</p><p className="text-[10px] text-muted-foreground">{kpi.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="criterios" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="criterios" className="text-xs">Critérios</TabsTrigger>
          <TabsTrigger value="metas" className="text-xs">Parâmetros & Metas</TabsTrigger>
          <TabsTrigger value="tarefas" className="text-xs">Tarefas</TabsTrigger>
          <TabsTrigger value="exames" className="text-xs">Exames</TabsTrigger>
          <TabsTrigger value="proms" className="text-xs">PROMs/PREMs</TabsTrigger>
          <TabsTrigger value="automacoes" className="text-xs">Automações</TabsTrigger>
          <TabsTrigger value="alertas" className="text-xs">Alertas</TabsTrigger>
          <TabsTrigger value="pacientes" className="text-xs">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="criterios">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3"><LogIn className="h-4 w-4 text-green-500" /> Critérios de Inclusão</h3>
              <ul className="space-y-2">{line.criteriosInclusao.map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />{c}
                </li>
              ))}</ul>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3"><LogOut className="h-4 w-4 text-orange-500" /> Critérios de Saída</h3>
              <ul className="space-y-2">{line.criteriosSaida.map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />{c}
                </li>
              ))}</ul>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="metas">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Parâmetro</TableHead>
                <TableHead className="text-xs">Operador</TableHead>
                <TableHead className="text-xs">Meta</TableHead>
                <TableHead className="text-xs">Unidade</TableHead>
              </TableRow></TableHeader>
              <TableBody>{line.metas.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{m.parametro}</TableCell>
                  <TableCell className="text-xs">{m.operador}</TableCell>
                  <TableCell className="text-xs font-bold">{m.valor}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.unidade}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
            <div className="p-4 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Parâmetros Clínicos Monitorados</h4>
              <div className="flex flex-wrap gap-1">
                {paramLabels(line.clinicalParameters).map((label, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{label}</Badge>
                ))}
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tarefas">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Tarefa</TableHead>
                <TableHead className="text-xs">Responsável</TableHead>
                <TableHead className="text-xs">Etapa</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
              </TableRow></TableHeader>
              <TableBody>{line.tarefasPadrao.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{t.nome}</TableCell>
                  <TableCell className="text-xs">{t.responsavel}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.etapa}</TableCell>
                  <TableCell>
                    {t.compartilhada
                      ? <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Compartilhada</Badge>
                      : <Badge variant="secondary" className="text-[10px]">Exclusiva</Badge>}
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="exames">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Exame</TableHead>
                <TableHead className="text-xs">Frequência</TableHead>
                <TableHead className="text-xs">Etapa</TableHead>
              </TableRow></TableHeader>
              <TableBody>{line.examesPadrao.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{e.nome}</TableCell>
                  <TableCell className="text-xs">{e.frequencia}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.etapa}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="proms">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card><CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">PROMs <Badge variant="secondary" className="text-[10px] ml-1">{line.proms.length}</Badge></h3>
              <div className="space-y-2">{line.proms.map((p, i) => (
                <div key={i} className="text-xs bg-secondary/50 rounded px-3 py-2 text-foreground capitalize">{p.replace(/_/g, ' ')}</div>
              ))}</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">PREMs <Badge variant="secondary" className="text-[10px] ml-1">{line.prems.length}</Badge></h3>
              <div className="space-y-2">{line.prems.map((p, i) => (
                <div key={i} className="text-xs bg-secondary/50 rounded px-3 py-2 text-foreground capitalize">{p.replace(/_/g, ' ')}</div>
              ))}</div>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="automacoes">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Condição</TableHead>
                <TableHead className="text-xs">Ação</TableHead>
                <TableHead className="text-xs w-20">Ativa</TableHead>
              </TableRow></TableHeader>
              <TableBody>{line.automacoes.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{a.condicao}</TableCell>
                  <TableCell className="text-xs">{a.acao}</TableCell>
                  <TableCell><Switch checked={a.ativa} onCheckedChange={() => toast.info('Automação atualizada (mock)')} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="alertas">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Condição</TableHead>
                <TableHead className="text-xs">Severidade</TableHead>
                <TableHead className="text-xs">Mensagem</TableHead>
              </TableRow></TableHeader>
              <TableBody>{line.alertas.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{a.condicao}</TableCell>
                  <TableCell>
                    <Badge variant={a.severidade === 'critical' ? 'destructive' : 'outline'}
                      className={`text-[10px] ${a.severidade === 'warning' ? 'border-yellow-500/30 text-yellow-400' : ''}`}>
                      {a.severidade === 'critical' ? 'Crítico' : 'Atenção'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{a.mensagem}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* New Patients tab */}
        <TabsContent value="pacientes">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Paciente</TableHead>
                <TableHead className="text-xs">Risco</TableHead>
                <TableHead className="text-xs">Linhas Ativas</TableHead>
                <TableHead className="text-xs">Metas Fora</TableHead>
                <TableHead className="text-xs">Sem Retorno</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {linePatients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-xs text-center text-muted-foreground py-8">Nenhum paciente nesta linha</TableCell></TableRow>
                ) : linePatients.map(p => {
                  const offTarget = p.goals.filter(g => {
                    if (g.operator === '<') return g.currentValue >= g.target;
                    if (g.operator === '>') return g.currentValue <= g.target;
                    return g.currentValue !== g.target;
                  });
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium">{p.nome}</TableCell>
                      <TableCell><RiskSemaphore level={p.riskLevel} score={p.scoreRisco} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {p.linhasAtivas.map(la => {
                            const cl = careLines.find(c => c.id === la);
                            return cl ? (
                              <span key={la} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cl.color + '22', color: cl.color }}>
                                {cl.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {offTarget.length > 0 ? (
                          <div className="space-y-0.5">
                            {offTarget.slice(0, 2).map((g, i) => (
                              <p key={i} className="text-[10px] text-destructive">{g.label}: {g.currentValue} {g.unit}</p>
                            ))}
                            {offTarget.length > 2 && <p className="text-[10px] text-muted-foreground">+{offTarget.length - 2}</p>}
                          </div>
                        ) : <span className="text-[10px] text-green-400">Todas na meta</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.diasSemRetorno !== undefined ? (
                          <span className={p.diasSemRetorno > 30 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {p.diasSemRetorno}d
                          </span>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Integrated Patient View ─── */
function IntegratedView({ patients, selectedPatientId, selectedPatient, onSelectPatient }: {
  patients: typeof mockPatients;
  selectedPatientId: string;
  selectedPatient: typeof mockPatients[0] | undefined;
  onSelectPatient: (id: string) => void;
}) {
  const patientLines = selectedPatient
    ? careLines.filter(l => selectedPatient.linhasAtivas.includes(l.id))
    : [];

  const allTasks = patientLines.flatMap(l => l.tarefasPadrao.map(t => ({ ...t, lineId: l.id, lineName: l.name, lineColor: l.color })));
  const sharedTasks: typeof allTasks = [];
  const exclusiveTasks: typeof allTasks = [];
  const seenShared = new Set<string>();
  allTasks.forEach(t => {
    if (t.compartilhada) {
      if (!seenShared.has(t.nome)) {
        seenShared.add(t.nome);
        const linkedLines = patientLines.filter(l => l.tarefasPadrao.some(tt => tt.nome === t.nome));
        sharedTasks.push({ ...t, lineName: linkedLines.map(l => l.name).join(', ') });
      }
    } else {
      exclusiveTasks.push(t);
    }
  });

  const paramCount: Record<string, string[]> = {};
  patientLines.forEach(l => l.clinicalParameters.forEach(p => {
    if (!paramCount[p]) paramCount[p] = [];
    paramCount[p].push(l.name);
  }));
  const overlapping = Object.entries(paramCount).filter(([, lines]) => lines.length > 1);

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4">
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Selecionar paciente com múltiplas linhas ativas</label>
        <Select value={selectedPatientId} onValueChange={onSelectPatient}>
          <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Escolha um paciente..." /></SelectTrigger>
          <SelectContent>
            {patients.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome} ({p.linhasAtivas.length} linhas)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent></Card>

      {selectedPatient && (
        <>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {patientLines.map(line => {
              const Icon = iconMap[line.icon] || Activity;
              const patientGoals = selectedPatient.goals.filter(g => g.careLineId === line.id);
              return (
                <Card key={line.id} className="border-t-2" style={{ borderTopColor: line.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded flex items-center justify-center" style={{ background: line.color + '22' }}>
                        <Icon className="h-4 w-4" style={{ color: line.color }} />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{line.name}</h3>
                    </div>
                    <div className="space-y-2">
                      {patientGoals.map((g, i) => {
                        const onTarget = g.operator === '<' ? g.currentValue < g.target : g.currentValue > g.target;
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{g.label}</span>
                            <span className={onTarget ? 'text-green-400 font-medium' : 'text-destructive font-medium'}>
                              {g.currentValue} {g.unit} {onTarget ? '✓' : `(meta ${g.operator} ${g.target})`}
                            </span>
                          </div>
                        );
                      })}
                      {patientGoals.length === 0 && <p className="text-[10px] text-muted-foreground">Sem metas individuais definidas</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {sharedTasks.length > 0 && (
            <Card><CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-400" /> Tarefas Compartilhadas
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">{sharedTasks.length} tarefas deduplicadas</Badge>
              </h3>
              <div className="space-y-2">
                {sharedTasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary/30 rounded px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{t.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{t.responsavel} · {t.etapa}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t.lineName}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}

          {overlapping.length > 0 && (
            <Card><CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-purple-400" /> Parâmetros Compartilhados Entre Linhas
              </h3>
              <div className="space-y-2">
                {overlapping.map(([param, lines]) => {
                  const label = parameterDictionary.find(p => p.field === param)?.label || param;
                  return (
                    <div key={param} className="flex items-center justify-between bg-secondary/30 rounded px-3 py-2">
                      <span className="text-xs font-medium text-foreground">{label}</span>
                      <div className="flex gap-1">{lines.map((l, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{l}</Badge>
                      ))}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" /> Metas Consolidadas
            </h3>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Parâmetro</TableHead>
                <TableHead className="text-xs">Valor Atual</TableHead>
                <TableHead className="text-xs">Meta</TableHead>
                <TableHead className="text-xs">Linha</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{selectedPatient.goals.map((g, i) => {
                const onTarget = g.operator === '<' ? g.currentValue < g.target : g.operator === '>' ? g.currentValue > g.target : g.currentValue === g.target;
                const lineName = careLines.find(l => l.id === g.careLineId)?.name || g.careLineId;
                return (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{g.label}</TableCell>
                    <TableCell className="text-xs">{g.currentValue} {g.unit}</TableCell>
                    <TableCell className="text-xs">{g.operator} {g.target} {g.unit}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{lineName}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={onTarget ? 'outline' : 'destructive'} className={`text-[10px] ${onTarget ? 'border-green-500/30 text-green-400' : ''}`}>
                        {onTarget ? 'Na meta' : 'Fora da meta'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
