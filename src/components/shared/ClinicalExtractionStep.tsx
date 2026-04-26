import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Brain, Sparkles, AlertTriangle, FileText, ChevronDown, ChevronUp,
  Play, X, RotateCw, Target, Activity, Zap, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClinicalExtraction } from '@/hooks/useClinicalExtraction';
import { FREE_TEXT_FIELDS, type ColumnMapping } from '@/lib/clinical-analysis';
import { cn } from '@/lib/utils';

interface Props {
  rows: Record<string, unknown>[];
  mapping: ColumnMapping[];
  headers: string[];
}

const SEVERITY_STYLES: Record<string, string> = {
  critico: 'bg-[hsl(var(--destructive))] text-white',
  alto: 'bg-[hsl(var(--warning))] text-white',
  moderado: 'bg-primary text-primary-foreground',
  baixo: 'bg-muted text-foreground',
};

const CATEGORY_LABEL: Record<string, string> = {
  exame: 'Exame',
  sintoma: 'Sintoma',
  evento_adverso: 'Evento adverso',
  medicacao: 'Medicação',
  queixa: 'Queixa',
  outro: 'Outro',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  alta: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]',
  media: 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]',
  baixa: 'bg-muted text-muted-foreground',
};

export function ClinicalExtractionStep({ rows, mapping, headers }: Props) {
  const { run, cancel, progress, results, retryFailed } = useClinicalExtraction();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    // Default: colunas ORIGINAIS cujo mapped está em FREE_TEXT_FIELDS
    return mapping
      .filter((m) => m.mapped && (FREE_TEXT_FIELDS as readonly string[]).includes(m.mapped))
      .map((m) => m.original);
  });
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const [maxRows, setMaxRows] = useState(Math.min(50, rows.length));
  const [showConfig, setShowConfig] = useState(true);

  // Auto-detecta colunas com texto longo (média >120 chars), mesmo as não mapeadas
  const candidateColumns = useMemo(() => {
    const sample = rows.slice(0, Math.min(rows.length, 50));
    return headers.filter((h) => {
      const lens = sample
        .map((r) => (r[h] != null ? String(r[h]).length : 0))
        .filter((l) => l > 0);
      if (lens.length === 0) return false;
      const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
      const mappedAsText = mapping.find(
        (m) => m.original === h && m.mapped && (FREE_TEXT_FIELDS as readonly string[]).includes(m.mapped),
      );
      return avg >= 120 || !!mappedAsText;
    });
  }, [headers, rows, mapping]);

  const structuredFields = useMemo(
    () =>
      mapping
        .filter((m) => m.mapped && !(FREE_TEXT_FIELDS as readonly string[]).includes(m.mapped))
        .map((m) => m.mapped!) ,
    [mapping],
  );

  const isRunning = progress.status === 'running';
  const canStart = selectedColumns.length > 0 && !isRunning;
  const sortedResults = useMemo(
    () => Array.from(results.values()).sort((a, b) => a.rowIndex - b.rowIndex),
    [results],
  );

  const handleStart = async () => {
    if (!canStart) return;
    setShowConfig(false);
    setExpandedRow(null);
    try {
      await run({
        rows,
        mapping,
        textColumns: selectedColumns,
        structuredFields,
        model,
        maxRows,
        concurrency: 3,
      });
      toast.success('Extração concluída');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  const failedCount = sortedResults.filter((r) => r.error).length;

  return (
    <div className="space-y-4">
      {/* Painel de configuração */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Configurar Extração com IA
              </CardTitle>
              <CardDescription>
                {selectedColumns.length} coluna(s) selecionada(s) · até {maxRows} pacientes ·{' '}
                {model.includes('flash') ? 'modo rápido' : 'modo profundo'}
              </CardDescription>
            </div>
            {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showConfig && (
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block">
                Colunas de texto a analisar ({candidateColumns.length} candidatas)
              </Label>
              {candidateColumns.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 rounded bg-muted/50">
                  Nenhuma coluna de texto longo detectada. Volte ao mapeamento e marque colunas como
                  "anotacoes", "evolucao", "observacoes", "resumo_consulta" ou "resultado_exame".
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {candidateColumns.map((col) => {
                    const checked = selectedColumns.includes(col);
                    const sample = rows.find((r) => r[col] != null && String(r[col]).trim() !== '');
                    return (
                      <label
                        key={col}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                          checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30',
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            setSelectedColumns((prev) =>
                              v ? [...prev, col] : prev.filter((c) => c !== col),
                            );
                          }}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{col}</p>
                          {sample && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                              {String(sample[col]).slice(0, 100)}…
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Modelo</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-3-flash-preview">
                      Flash — rápido e econômico (recomendado)
                    </SelectItem>
                    <SelectItem value="google/gemini-2.5-pro">
                      Pro — análise mais profunda
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Pacientes a processar (de {rows.length})
                </Label>
                <Select value={String(maxRows)} onValueChange={(v) => setMaxRows(Number(v))}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100, 250, rows.length].filter((n, i, a) => n <= rows.length && a.indexOf(n) === i).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Primeiros {n}{n === rows.length ? ' (todos)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 text-[11px] text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <p>
                Esta análise usa IA generativa e consome créditos do workspace. Os textos selecionados
                são enviados ao modelo. Não invente valores: se a IA marcar algo com confiança baixa,
                revise antes de agir.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleStart} disabled={!canStart} className="gap-2">
                <Play className="h-4 w-4" /> Iniciar Extração
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Progresso */}
      {progress.total > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className={cn('h-4 w-4', isRunning ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
                <span className="text-sm font-semibold">
                  {progress.done}/{progress.total} pacientes
                </span>
                {progress.errors > 0 && (
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))]">
                    {progress.errors} com erro
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] capitalize">
                  {progress.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                {isRunning && (
                  <Button size="sm" variant="outline" onClick={cancel} className="h-8 gap-1">
                    <X className="h-3 w-3" /> Cancelar
                  </Button>
                )}
                {!isRunning && failedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      retryFailed({
                        rows,
                        mapping,
                        textColumns: selectedColumns,
                        structuredFields,
                        model,
                        maxRows,
                      })
                    }
                    className="h-8 gap-1"
                  >
                    <RotateCw className="h-3 w-3" /> Tentar novamente ({failedCount})
                  </Button>
                )}
              </div>
            </div>
            <Progress value={(progress.done / progress.total) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {sortedResults.length > 0 && (
        <div className="space-y-2">
          {sortedResults.map((r) => {
            const isExpanded = expandedRow === r.rowIndex;
            const data = r.data;
            const hasRedFlags = !!data?.redFlags?.length;
            const criticalHighlights = data?.highlights?.filter((h) => h.severity === 'critico').length ?? 0;
            const altoHighlights = data?.highlights?.filter((h) => h.severity === 'alto').length ?? 0;
            return (
              <Card
                key={r.rowIndex}
                className={cn(
                  'transition-all',
                  hasRedFlags && 'border-[hsl(var(--destructive))]/40',
                  r.error && 'border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5',
                )}
              >
                <CardContent className="p-3">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedRow(isExpanded ? null : r.rowIndex)}
                    disabled={!data && !r.error}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            r.error
                              ? 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]'
                              : hasRedFlags
                              ? 'bg-[hsl(var(--destructive))] text-white'
                              : criticalHighlights
                              ? 'bg-[hsl(var(--warning))] text-white'
                              : 'bg-primary/15 text-primary',
                          )}
                        >
                          {r.error ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : hasRedFlags ? (
                            <Zap className="h-4 w-4" />
                          ) : (
                            <Brain className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{r.patientName}</p>
                          {r.error ? (
                            <p className="text-[11px] text-[hsl(var(--destructive))]">{r.error}</p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {data?.summary?.split('\n')[0] || 'Sem resumo'}
                            </p>
                          )}
                        </div>
                      </div>
                      {data && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {hasRedFlags && (
                            <Badge className="bg-[hsl(var(--destructive))] text-white text-[10px] px-1.5 py-0">
                              {data.redFlags.length} red flag
                            </Badge>
                          )}
                          {criticalHighlights > 0 && (
                            <Badge className="bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))] border-0 text-[10px] px-1.5 py-0">
                              {criticalHighlights} crítico
                            </Badge>
                          )}
                          {altoHighlights > 0 && (
                            <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-0 text-[10px] px-1.5 py-0">
                              {altoHighlights} alto
                            </Badge>
                          )}
                          {data.extractedParams.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {data.extractedParams.length} param
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {isExpanded && data && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {/* Resumo */}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                        <p className="text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
                          <Brain className="h-3 w-3 text-primary" /> Resumo executivo
                        </p>
                        <p className="text-xs text-foreground whitespace-pre-line">{data.summary}</p>
                      </div>

                      {/* Red flags */}
                      {data.redFlags.length > 0 && (
                        <div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/5 border border-[hsl(var(--destructive))]/30">
                          <p className="text-[11px] font-semibold text-[hsl(var(--destructive))] mb-1.5 flex items-center gap-1.5">
                            <Zap className="h-3 w-3" /> Red flags
                          </p>
                          <ul className="space-y-1">
                            {data.redFlags.map((f, i) => (
                              <li key={i} className="text-xs text-foreground flex gap-2">
                                <span className="text-[hsl(var(--destructive))]">●</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Highlights */}
                      {data.highlights.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary" /> Highlights
                          </p>
                          <div className="space-y-1.5">
                            {data.highlights.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 p-2 rounded bg-muted/40 text-xs"
                              >
                                <Badge
                                  className={cn('text-[9px] px-1.5 py-0 flex-shrink-0', SEVERITY_STYLES[h.severity])}
                                >
                                  {h.severity}
                                </Badge>
                                <span className="text-muted-foreground flex-1">{h.text}</span>
                                <Badge variant="outline" className="text-[9px] flex-shrink-0">
                                  {CATEGORY_LABEL[h.category] || h.category}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parâmetros extraídos */}
                      {data.extractedParams.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5">
                            <Activity className="h-3 w-3 text-primary" /> Parâmetros extraídos do texto
                          </p>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="grid grid-cols-12 text-[10px] font-semibold bg-muted/50 px-2 py-1.5">
                              <div className="col-span-3">Parâmetro</div>
                              <div className="col-span-2">Valor</div>
                              <div className="col-span-1">Conf.</div>
                              <div className="col-span-6">Trecho fonte</div>
                            </div>
                            {data.extractedParams.map((p, i) => (
                              <div
                                key={i}
                                className="grid grid-cols-12 text-[11px] px-2 py-1.5 border-t border-border items-center"
                              >
                                <div className="col-span-3 capitalize font-medium truncate">
                                  {p.field === 'outro' ? p.fieldOther || 'outro' : p.field}
                                </div>
                                <div className="col-span-2 font-mono">
                                  {p.value}
                                  {p.unit && <span className="text-muted-foreground ml-0.5">{p.unit}</span>}
                                </div>
                                <div className="col-span-1">
                                  <Badge
                                    className={cn('text-[9px] px-1 py-0 border-0', CONFIDENCE_STYLES[p.confidence])}
                                  >
                                    {p.confidence}
                                  </Badge>
                                </div>
                                <div className="col-span-6 text-muted-foreground italic truncate" title={p.source}>
                                  "{p.source}"
                                  {p.date && <span className="not-italic ml-1 font-mono">· {p.date}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Próximos passos */}
                      {data.suggestedNextSteps.length > 0 && (
                        <div className="p-3 rounded-lg bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/15">
                          <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-[hsl(var(--success))]" /> Próximos passos
                          </p>
                          <ul className="space-y-1">
                            {data.suggestedNextSteps.map((s, i) => (
                              <li key={i} className="text-xs text-foreground flex gap-2">
                                <span className="text-[hsl(var(--success))]">→</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notas */}
                      {data.notes.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold mb-1 flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3 w-3" /> Notas / ambiguidades
                          </p>
                          <ul className="space-y-0.5">
                            {data.notes.map((n, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground">• {n}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
