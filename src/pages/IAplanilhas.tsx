import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, FileSpreadsheet, Brain, AlertTriangle, Target, TrendingUp,
  CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp, Filter,
  BarChart3, Users, Activity, ShieldAlert, Clock, Search
} from 'lucide-react';
import { StatusChip } from '@/components/shared/StatusChip';
import { ClinicalExtractionStep } from '@/components/shared/ClinicalExtractionStep';
import {
  mapColumns, validateData, analyzePatient, analyzeCohort,
  type ColumnMapping, type ValidationResult, type PatientInsight, type CohortInsight
} from '@/lib/clinical-analysis';
import * as XLSX from 'xlsx';

const STEPS = ['Upload', 'Mapeamento', 'Validação', 'Insights', 'Extração IA'] as const;
const MAPPED_FIELD_OPTIONS = [
  'nome', 'cpf', 'data_nascimento', 'hba1c', 'glicemia', 'pas', 'pad', 'imc', 'peso', 'altura',
  'ldl', 'hdl', 'colesterol_total', 'triglicerides', 'creatinina', 'phq9', 'gad7', 'act',
  'ultima_consulta', 'proxima_consulta', 'linha_cuidado', 'telefone', 'email', 'sexo',
  'medicamentos', 'faltas', 'albuminuria',
  // Campos texto livre — habilitam etapa de extração via IA
  'anotacoes', 'evolucao', 'observacoes', 'resumo_consulta', 'resultado_exame',
];

export default function IAplanilhas() {
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [insights, setInsights] = useState<PatientInsight[]>([]);
  const [cohort, setCohort] = useState<CohortInsight | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setFileSize(file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      if (json.length > 0) {
        const h = Object.keys(json[0]);
        setHeaders(h);
        setRows(json);
        setMapping(mapColumns(h));
        setStep(1);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateMapping = useCallback((idx: number, value: string) => {
    setMapping((prev) => prev.map((m, i) => i === idx ? { ...m, mapped: value === '_none' ? null : value, confidence: 'auto' as const } : m));
  }, []);

  const runValidation = useCallback(() => {
    const result = validateData(rows, mapping);
    setValidation(result);
    setStep(2);
  }, [rows, mapping]);

  const runAnalysis = useCallback(() => {
    const patientInsights = rows.map((row) => analyzePatient(row, mapping));
    patientInsights.sort((a, b) => b.priorityScore - a.priorityScore);
    setInsights(patientInsights);
    setCohort(analyzeCohort(patientInsights));
    setStep(3);
  }, [rows, mapping]);

  const filteredInsights = useMemo(() => {
    if (priorityFilter === 'all') return insights;
    return insights.filter((i) => i.priority === priorityFilter);
  }, [insights, priorityFilter]);

  const mappedCount = mapping.filter((m) => m.mapped).length;
  const autoCount = mapping.filter((m) => m.confidence === 'auto' && m.mapped).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Clinical Insight AI
          </h1>
          <p className="text-xs text-muted-foreground">Análise inteligente de planilhas clínicas e operacionais</p>
        </div>
        {step > 0 && (
          <Badge variant="outline" className="text-xs">
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            {fileName} · {rows.length} registros
          </Badge>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-primary/15 text-primary cursor-pointer hover:bg-primary/25' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-4 w-4 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <Card
          className={`border-2 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-border'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <CardContent className="p-16 flex flex-col items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">Arraste sua planilha aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .csv · Tamanho máximo: 20MB</p>
            </div>
            <label>
              <input type="file" accept=".xlsx,.csv" onChange={handleInputChange} className="hidden" />
              <Button asChild className="gap-2 cursor-pointer">
                <span><FileSpreadsheet className="h-4 w-4" /> Selecionar Arquivo</span>
              </Button>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Preview & Mapping */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preview dos Dados</CardTitle>
              <CardDescription>Primeiras 10 linhas · {headers.length} colunas · {rows.length} registros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-auto max-h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.slice(0, 12).map((h) => (
                        <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                      ))}
                      {headers.length > 12 && <TableHead className="text-xs">+{headers.length - 12}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {headers.slice(0, 12).map((h) => (
                          <TableCell key={h} className="text-xs whitespace-nowrap max-w-[150px] truncate">{String(row[h] ?? '')}</TableCell>
                        ))}
                        {headers.length > 12 && <TableCell className="text-xs text-muted-foreground">…</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Mapeamento de Colunas</CardTitle>
                  <CardDescription>{mappedCount}/{headers.length} colunas mapeadas · {autoCount} automáticos</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-0 text-[10px]">Auto</Badge>
                  <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-0 text-[10px]">Sugerido</Badge>
                  <Badge variant="outline" className="text-[10px]">Não mapeado</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {mapping.map((m, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${
                    m.confidence === 'auto' && m.mapped ? 'border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5' :
                    m.confidence === 'suggested' ? 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5' :
                    'border-border'
                  }`}>
                    <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{m.original}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <Select value={m.mapped || '_none'} onValueChange={(v) => updateMapping(i, v)}>
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">— Ignorar —</SelectItem>
                        {MAPPED_FIELD_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={runValidation} className="gap-2">
              Validar Dados <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 2 && validation && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Score de Qualidade</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{validation.qualityScore}</p>
              <Progress value={validation.qualityScore} className="h-1.5 mt-2" />
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Registros Válidos</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{validation.validRows}<span className="text-sm text-muted-foreground font-normal">/{validation.totalRows}</span></p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                <span className="text-xs text-muted-foreground">Problemas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{validation.issues.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                <span className="text-xs text-muted-foreground">Duplicatas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{validation.duplicates}</p>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Completude por Coluna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {validation.columnCompleteness.map((c) => (
                  <div key={c.column} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 truncate">{c.column}</span>
                    <Progress value={c.percent} className="h-2 flex-1" />
                    <span className={`text-xs font-mono w-10 text-right ${c.percent < 50 ? 'text-[hsl(var(--destructive))]' : c.percent < 80 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]'}`}>{c.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {validation.issues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Problemas Encontrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[200px] overflow-auto">
                  {validation.issues.slice(0, 30).map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
                      {issue.severity === 'critical' ? <XCircle className="h-3 w-3 text-[hsl(var(--destructive))] mt-0.5 flex-shrink-0" /> :
                       <AlertTriangle className="h-3 w-3 text-[hsl(var(--warning))] mt-0.5 flex-shrink-0" />}
                      <span className="text-muted-foreground">{issue.message}</span>
                    </div>
                  ))}
                  {validation.issues.length > 30 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+{validation.issues.length - 30} problemas adicionais</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={runAnalysis} className="gap-2">
              Gerar Insights com {validation.validRows} registros <Brain className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Insights */}
      {step === 3 && cohort && (
        <div className="space-y-4">
          {/* Banner: aprofundar com IA */}
          {(() => {
            const hasTextCols = mapping.some((m) => m.mapped && ['anotacoes','evolucao','observacoes','resumo_consulta','resultado_exame'].includes(m.mapped));
            const hasLongCols = headers.some((h) => {
              const sample = rows.slice(0, 30);
              const lens = sample.map((r) => r[h] != null ? String(r[h]).length : 0).filter((l) => l > 0);
              if (!lens.length) return false;
              return lens.reduce((a,b)=>a+b,0) / lens.length >= 120;
            });
            if (!hasTextCols && !hasLongCols) return null;
            return (
              <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Aprofundar análise com IA</p>
                      <p className="text-xs text-muted-foreground">
                        Detectamos colunas com texto clínico livre. Extraia parâmetros, highlights e red flags automaticamente.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setStep(4)} className="gap-2">
                    Extrair com IA <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })()}

          <Tabs defaultValue="paciente">
            <TabsList>
              <TabsTrigger value="paciente" className="gap-1.5"><Users className="h-3 w-3" /> Por Paciente</TabsTrigger>
              <TabsTrigger value="coorte" className="gap-1.5"><BarChart3 className="h-3 w-3" /> Por Coorte</TabsTrigger>
              <TabsTrigger value="qualidade" className="gap-1.5"><ShieldAlert className="h-3 w-3" /> Qualidade</TabsTrigger>
            </TabsList>

          {/* Patient insights */}
          <TabsContent value="paciente" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{filteredInsights.length} pacientes</p>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="critico">Crítico</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredInsights.map((insight, i) => {
              const isExpanded = expandedPatient === i;
              return (
                <Card key={i} className={`transition-all ${insight.priority === 'critico' ? 'border-[hsl(var(--destructive))]/30' : insight.priority === 'alto' ? 'border-[hsl(var(--warning))]/30' : ''}`}>
                  <CardContent className="p-4">
                    <button className="w-full text-left" onClick={() => setExpandedPatient(isExpanded ? null : i)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                            insight.priority === 'critico' ? 'bg-[hsl(var(--destructive))]' :
                            insight.priority === 'alto' ? 'bg-[hsl(var(--warning))]' :
                            insight.priority === 'moderado' ? 'bg-primary' : 'bg-[hsl(var(--success))]'
                          }`}>
                            {insight.priorityScore}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{insight.nome}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StatusChip status={insight.priority} />
                              {insight.careLines.map((cl) => (
                                <Badge key={cl} variant="outline" className="text-[10px] px-1.5 py-0">{cl}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {insight.outOfTarget.length > 0 && (
                            <Badge variant="outline" className="text-[10px] border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))]">
                              {insight.outOfTarget.length} fora da meta
                            </Badge>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {/* Rationale */}
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                          <div className="flex items-start gap-2">
                            <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-1">Racional</p>
                              <p className="text-xs text-muted-foreground">{insight.rationale}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Out of target */}
                          {insight.outOfTarget.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Target className="h-3 w-3 text-[hsl(var(--destructive))]" /> Parâmetros Fora da Meta
                              </p>
                              {insight.outOfTarget.map((o, j) => (
                                <div key={j} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                                  <span className="text-muted-foreground capitalize">{o.param}</span>
                                  <span>
                                    <span className="font-mono font-bold text-[hsl(var(--destructive))]">{o.atual}</span>
                                    <span className="text-muted-foreground mx-1">meta:</span>
                                    <span className="font-mono text-foreground">{o.meta} {o.unidade}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Clinical risk */}
                          {insight.clinicalRisk.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <ShieldAlert className="h-3 w-3 text-[hsl(var(--warning))]" /> Risco Clínico
                              </p>
                              {insight.clinicalRisk.map((r, j) => (
                                <div key={j} className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs">
                                  <Badge className={`text-[10px] px-1.5 py-0 ${r.level === 'critical' ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--warning))]'}`}>
                                    {r.level === 'critical' ? 'Crítico' : 'Alerta'}
                                  </Badge>
                                  <span className="text-muted-foreground">{r.description}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Operational risk */}
                          {insight.operationalRisk.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-[hsl(var(--warning))]" /> Risco Operacional
                              </p>
                              {insight.operationalRisk.map((r, j) => (
                                <div key={j} className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">{r.detail}</div>
                              ))}
                            </div>
                          )}

                          {/* Non-adherence */}
                          {insight.nonAdherence.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3 text-[hsl(var(--destructive))]" /> Sinais de Não Adesão
                              </p>
                              {insight.nonAdherence.map((n, j) => (
                                <div key={j} className="p-2 rounded bg-[hsl(var(--destructive))]/5 text-xs text-muted-foreground">{n}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Next steps */}
                        <div className="p-3 rounded-lg bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/15">
                          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-[hsl(var(--success))]" /> Próximos Passos Sugeridos
                          </p>
                          <div className="space-y-1">
                            {insight.nextSteps.map((ns, j) => (
                              <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <ArrowRight className="h-3 w-3 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                                <span>{ns}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Cohort insights */}
          <TabsContent value="coorte" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Total Pacientes</p>
                <p className="text-2xl font-bold text-foreground">{cohort.totalPatients}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Fora da Meta</p>
                <p className="text-2xl font-bold text-[hsl(var(--destructive))]">{cohort.outOfTargetPercent}%</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Sem Retorno</p>
                <p className="text-2xl font-bold text-[hsl(var(--warning))]">{cohort.noReturnPercent}%</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Adesão Média</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{cohort.avgAdherence}%</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Distribuição de Risco</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cohort.riskDistribution.map((r) => (
                    <div key={r.level} className="flex items-center gap-3">
                      <span className="text-xs w-16 text-muted-foreground">{r.level}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          r.level === 'Crítico' ? 'bg-[hsl(var(--destructive))]' :
                          r.level === 'Alto' ? 'bg-[hsl(var(--warning))]' :
                          r.level === 'Moderado' ? 'bg-primary' : 'bg-[hsl(var(--success))]'
                        }`} style={{ width: `${r.percent}%` }} />
                      </div>
                      <span className="text-xs font-mono w-16 text-right text-foreground">{r.count} ({r.percent}%)</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top Problemas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cohort.topProblems.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground capitalize">{p.problem}</span>
                      <Badge variant="outline" className="text-[10px]">{p.count} ({p.percent}%)</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {cohort.byCareLine.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Indicadores por Linha de Cuidado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Linha</TableHead>
                          <TableHead className="text-xs text-right">Pacientes</TableHead>
                          <TableHead className="text-xs text-right">Fora da Meta</TableHead>
                          <TableHead className="text-xs text-right">Adesão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cohort.byCareLine.map((cl) => (
                          <TableRow key={cl.line}>
                            <TableCell className="text-xs font-medium">{cl.line}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{cl.patients}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-[hsl(var(--destructive))]">{cl.outOfTarget}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{cl.adherence}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Data quality tab */}
          <TabsContent value="qualidade" className="space-y-4 mt-4">
            {validation && (
              <>
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white ${
                      validation.qualityScore >= 80 ? 'bg-[hsl(var(--success))]' :
                      validation.qualityScore >= 50 ? 'bg-[hsl(var(--warning))]' : 'bg-[hsl(var(--destructive))]'
                    }`}>
                      {validation.qualityScore}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Score de Qualidade dos Dados</p>
                      <p className="text-xs text-muted-foreground">{validation.validRows} de {validation.totalRows} registros válidos · {validation.issues.length} problemas · {validation.duplicates} duplicatas</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Completude por Campo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {validation.columnCompleteness.map((c) => (
                        <div key={c.column} className="flex items-center gap-3 p-2 rounded bg-muted/30">
                          <span className="text-xs text-muted-foreground w-28 truncate capitalize">{c.column}</span>
                          <Progress value={c.percent} className="h-1.5 flex-1" />
                          <span className={`text-[10px] font-mono w-8 text-right ${c.percent < 50 ? 'text-[hsl(var(--destructive))]' : c.percent < 80 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]'}`}>{c.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {validation.issues.filter((i) => i.severity === 'critical').length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-[hsl(var(--destructive))]">Problemas Críticos</CardTitle>
                      <CardDescription>Estes registros precisam de correção para análise confiável</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-[200px] overflow-auto">
                        {validation.issues.filter((i) => i.severity === 'critical').slice(0, 20).map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-[hsl(var(--destructive))]/5">
                            <XCircle className="h-3 w-3 text-[hsl(var(--destructive))] mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>
      )}

      {/* Step 4: Extração via IA */}
      {step === 4 && (
        <ClinicalExtractionStep rows={rows} mapping={mapping} headers={headers} />
      )}
    </div>
  );
}
