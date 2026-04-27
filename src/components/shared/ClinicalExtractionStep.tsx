import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Brain, Sparkles, AlertTriangle, FileText, ChevronDown, ChevronUp,
  Play, X, RotateCw, Target, Activity, Zap, FlaskConical,
  Link2, Link2Off, UserCheck, Save, CheckCheck, Search, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClinicalExtraction } from '@/hooks/useClinicalExtraction';
import {
  useCreateExtractions,
  useApplyExtraction,
  useLinkExtractionToPatient,
  normalizeCpf,
} from '@/hooks/useClinicalExtractionsDb';
import { usePatients } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { FREE_TEXT_FIELDS, type ColumnMapping } from '@/lib/clinical-analysis';
import { cn } from '@/lib/utils';

interface Props {
  rows: Record<string, unknown>[];
  mapping: ColumnMapping[];
  headers: string[];
  fileName?: string;
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

interface PersistMeta {
  patientId: string | null;
  patientNameInDb: string | null;
  cpfRaw: string | null;
  extractionId: string | null;
  applied: boolean;
  appliedSummary?: { alerts: number; orientacoes: number; parameter_records: number };
  resolving: boolean;
  saving: boolean;
  applying: boolean;
}

function emptyMeta(): PersistMeta {
  return {
    patientId: null, patientNameInDb: null, cpfRaw: null, extractionId: null,
    applied: false, resolving: false, saving: false, applying: false,
  };
}

export function ClinicalExtractionStep({ rows, mapping, headers, fileName }: Props) {
  const { run, cancel, progress, results, retryFailed } = useClinicalExtraction();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    return mapping
      .filter((m) => m.mapped && (FREE_TEXT_FIELDS as readonly string[]).includes(m.mapped))
      .map((m) => m.original);
  });
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const [maxRows, setMaxRows] = useState(Math.min(50, rows.length));
  const [showConfig, setShowConfig] = useState(true);
  const [persistMeta, setPersistMeta] = useState<Map<number, PersistMeta>>(new Map());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [linkOpenFor, setLinkOpenFor] = useState<number | null>(null);
  const [linkSearch, setLinkSearch] = useState('');

  const createExtractions = useCreateExtractions();
  const applyExtraction = useApplyExtraction();
  const linkMutation = useLinkExtractionToPatient();
  const patientsQuery = usePatients();

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
        .map((m) => m.mapped!),
    [mapping],
  );

  const cpfColumn = useMemo(
    () => mapping.find((m) => m.mapped === 'cpf')?.original ?? null,
    [mapping],
  );

  const isRunning = progress.status === 'running';
  const canStart = selectedColumns.length > 0 && !isRunning;
  const sortedResults = useMemo(
    () => Array.from(results.values()).sort((a, b) => a.rowIndex - b.rowIndex),
    [results],
  );

  // Auto-resolve CPF → patient_id assim que cada extração aparece
  useEffect(() => {
    const toResolve: Array<{ rowIndex: number; cpf: string }> = [];
    const toMarkEmpty: number[] = [];
    for (const r of sortedResults) {
      if (!r.data) continue;
      if (persistMeta.has(r.rowIndex)) continue;
      const row = rows[r.rowIndex];
      const rawCpf = cpfColumn && row?.[cpfColumn] != null ? String(row[cpfColumn]) : '';
      const normalized = normalizeCpf(rawCpf);
      if (normalized) toResolve.push({ rowIndex: r.rowIndex, cpf: rawCpf });
      else toMarkEmpty.push(r.rowIndex);
    }
    if (toMarkEmpty.length > 0) {
      setPersistMeta((prev) => {
        const next = new Map(prev);
        for (const i of toMarkEmpty) next.set(i, { ...emptyMeta() });
        return next;
      });
    }
    if (toResolve.length === 0) return;

    setPersistMeta((prev) => {
      const next = new Map(prev);
      for (const t of toResolve) {
        next.set(t.rowIndex, { ...emptyMeta(), cpfRaw: t.cpf, resolving: true });
      }
      return next;
    });

    (async () => {
      for (const t of toResolve) {
        try {
          const { data } = await supabase.rpc('find_patient_by_cpf', { _cpf: t.cpf });
          let patientName: string | null = null;
          if (data) {
            const { data: p } = await supabase
              .from('patients')
              .select('nome')
              .eq('id', data)
              .maybeSingle();
            patientName = p?.nome ?? null;
          }
          setPersistMeta((prev) => {
            const next = new Map(prev);
            next.set(t.rowIndex, {
              ...(next.get(t.rowIndex) ?? emptyMeta()),
              cpfRaw: t.cpf,
              patientId: (data as string | null) ?? null,
              patientNameInDb: patientName,
              resolving: false,
            });
            return next;
          });
        } catch {
          setPersistMeta((prev) => {
            const next = new Map(prev);
            next.set(t.rowIndex, {
              ...(next.get(t.rowIndex) ?? emptyMeta()),
              cpfRaw: t.cpf,
              resolving: false,
            });
            return next;
          });
        }
      }
    })();
  }, [sortedResults, cpfColumn, rows, persistMeta]);

  const linkStats = useMemo(() => {
    let linked = 0, noCpf = 0, noMatch = 0, savedApplied = 0;
    for (const r of sortedResults) {
      if (!r.data) continue;
      const m = persistMeta.get(r.rowIndex);
      if (!m) continue;
      if (m.applied) savedApplied++;
      if (m.patientId) linked++;
      else if (!m.cpfRaw) noCpf++;
      else noMatch++;
    }
    return { linked, noCpf, noMatch, savedApplied };
  }, [sortedResults, persistMeta]);

  const saveAndApplyOne = async (rowIndex: number): Promise<boolean> => {
    const r = results.get(rowIndex);
    if (!r?.data) return false;
    const meta = persistMeta.get(rowIndex) ?? emptyMeta();
    if (meta.applied) return true;
    if (!meta.patientId) {
      toast.error('Vincule um paciente antes de salvar');
      return false;
    }
    setPersistMeta((prev) => {
      const next = new Map(prev);
      next.set(rowIndex, { ...meta, saving: true });
      return next;
    });
    try {
      let extractionId = meta.extractionId;
      if (!extractionId) {
        const params = r.data.extractedParams ?? [];
        const altaCount = params.filter((p) => p.confidence === 'alta').length;
        const overall = altaCount > params.length / 2 ? 'alta' : altaCount > 0 ? 'media' : 'baixa';
        const created = await createExtractions.mutateAsync([
          {
            patient_id: meta.patientId,
            cpf_raw: meta.cpfRaw,
            patient_name_source: r.patientName,
            source_filename: fileName ?? null,
            source_row_index: rowIndex,
            summary: r.data.summary ?? null,
            highlights: r.data.highlights ?? [],
            extracted_params: r.data.extractedParams ?? [],
            red_flags: r.data.redFlags ?? [],
            suggested_next_steps: r.data.suggestedNextSteps ?? [],
            notes: r.data.notes ?? [],
            model,
            confidence_overall: overall,
          },
        ]);
        extractionId = created[0]?.id ?? null;
        if (!extractionId) throw new Error('Falha ao salvar extração');
      }
      setPersistMeta((prev) => {
        const next = new Map(prev);
        next.set(rowIndex, {
          ...(next.get(rowIndex) ?? emptyMeta()),
          extractionId,
          saving: false,
          applying: true,
        });
        return next;
      });
      const result = await applyExtraction.mutateAsync(extractionId);
      setPersistMeta((prev) => {
        const next = new Map(prev);
        next.set(rowIndex, {
          ...(next.get(rowIndex) ?? emptyMeta()),
          extractionId,
          applied: true,
          applying: false,
          appliedSummary: result.results,
        });
        return next;
      });
      return true;
    } catch (e) {
      setPersistMeta((prev) => {
        const next = new Map(prev);
        next.set(rowIndex, {
          ...(next.get(rowIndex) ?? emptyMeta()),
          saving: false,
          applying: false,
        });
        return next;
      });
      toast.error(`Falha em ${r.patientName}: ${e instanceof Error ? e.message : 'erro'}`);
      return false;
    }
  };

  const saveAndApplyAllLinked = async () => {
    setBulkRunning(true);
    let ok = 0, fail = 0;
    for (const r of sortedResults) {
      if (!r.data) continue;
      const m = persistMeta.get(r.rowIndex);
      if (!m?.patientId || m.applied) continue;
      const success = await saveAndApplyOne(r.rowIndex);
      if (success) ok++; else fail++;
    }
    setBulkRunning(false);
    if (ok > 0) toast.success(`${ok} paciente${ok === 1 ? '' : 's'} atualizado${ok === 1 ? '' : 's'} no prontuário`);
    if (fail > 0) toast.error(`${fail} falha${fail === 1 ? '' : 's'} ao aplicar`);
  };

  const linkPatientManually = async (rowIndex: number, patientId: string, patientName: string) => {
    const meta = persistMeta.get(rowIndex) ?? emptyMeta();
    if (meta.extractionId) {
      try {
        await linkMutation.mutateAsync({ id: meta.extractionId, patientId });
      } catch (e) {
        toast.error(`Falha ao vincular: ${e instanceof Error ? e.message : 'erro'}`);
        return;
      }
    }
    setPersistMeta((prev) => {
      const next = new Map(prev);
      next.set(rowIndex, {
        ...(next.get(rowIndex) ?? emptyMeta()),
        patientId,
        patientNameInDb: patientName,
      });
      return next;
    });
    setLinkOpenFor(null);
    setLinkSearch('');
    toast.success(`Vinculado a ${patientName}`);
  };

  const handleStart = async () => {
    if (!canStart) return;
    setShowConfig(false);
    setExpandedRow(null);
    setPersistMeta(new Map());
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

  const filteredPatients = useMemo(() => {
    const term = linkSearch.trim().toLowerCase();
    const list = patientsQuery.data ?? [];
    if (!term) return list.slice(0, 20);
    return list
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(term) ||
          (p.cpf ?? '').replace(/\D/g, '').includes(term.replace(/\D/g, '')),
      )
      .slice(0, 20);
  }, [linkSearch, patientsQuery.data]);

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

      {/* Toolbar de vínculo / aplicação em massa */}
      {sortedResults.some((r) => r.data) && (
        <Card className="bg-muted/20">
          <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-0">
                <Link2 className="h-3 w-3 mr-1" /> {linkStats.linked} vinculado{linkStats.linked === 1 ? '' : 's'}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                <Link2Off className="h-3 w-3 mr-1" /> {linkStats.noMatch} sem match
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {linkStats.noCpf} sem CPF
              </Badge>
              {linkStats.savedApplied > 0 && (
                <Badge className="bg-primary/15 text-primary border-0">
                  <CheckCheck className="h-3 w-3 mr-1" /> {linkStats.savedApplied} aplicado{linkStats.savedApplied === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              onClick={saveAndApplyAllLinked}
              disabled={bulkRunning || linkStats.linked === linkStats.savedApplied}
              className="gap-2"
            >
              {bulkRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar e aplicar todos ({Math.max(0, linkStats.linked - linkStats.savedApplied)})
            </Button>
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

                  {isExpanded && data && (() => {
                    const meta = persistMeta.get(r.rowIndex) ?? emptyMeta();
                    const busy = meta.saving || meta.applying || meta.resolving;
                    return (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {/* Painel de vínculo + ação de salvar */}
                      <div className={cn(
                        'p-3 rounded-lg border flex items-center justify-between gap-3 flex-wrap',
                        meta.applied
                          ? 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/30'
                          : meta.patientId
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/30',
                      )}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {meta.resolving ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                          ) : meta.applied ? (
                            <CheckCheck className="h-4 w-4 text-[hsl(var(--success))] flex-shrink-0" />
                          ) : meta.patientId ? (
                            <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <Link2Off className="h-4 w-4 text-[hsl(var(--warning))] flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            {meta.applied && meta.appliedSummary ? (
                              <p className="text-xs font-medium">
                                Aplicado · {meta.appliedSummary.alerts} alerta(s), {meta.appliedSummary.orientacoes} orientação(ões), {meta.appliedSummary.parameter_records} parâmetro(s)
                              </p>
                            ) : meta.patientId && meta.patientNameInDb ? (
                              <p className="text-xs font-medium truncate">Vinculado a: {meta.patientNameInDb}</p>
                            ) : meta.cpfRaw ? (
                              <p className="text-xs">CPF não encontrado no cadastro</p>
                            ) : (
                              <p className="text-xs">Sem CPF na planilha</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!meta.applied && (
                            <Popover
                              open={linkOpenFor === r.rowIndex}
                              onOpenChange={(o) => { setLinkOpenFor(o ? r.rowIndex : null); if (!o) setLinkSearch(''); }}
                            >
                              <PopoverTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 gap-1">
                                  <Search className="h-3 w-3" /> {meta.patientId ? 'Trocar' : 'Vincular'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-2" align="end">
                                <Input
                                  placeholder="Buscar por nome ou CPF…"
                                  value={linkSearch}
                                  onChange={(e) => setLinkSearch(e.target.value)}
                                  className="h-8 text-xs mb-2"
                                  autoFocus
                                />
                                <div className="max-h-60 overflow-auto space-y-1">
                                  {filteredPatients.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-2">Nenhum paciente encontrado</p>
                                  ) : (
                                    filteredPatients.map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() => linkPatientManually(r.rowIndex, p.id, p.nome)}
                                        className="w-full text-left p-2 rounded hover:bg-muted text-xs"
                                      >
                                        <p className="font-medium">{p.nome}</p>
                                        <p className="text-muted-foreground text-[10px]">CPF: {p.cpf}</p>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          {!meta.applied && (
                            <Button
                              size="sm"
                              onClick={() => saveAndApplyOne(r.rowIndex)}
                              disabled={!meta.patientId || busy}
                              className="h-8 gap-1"
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Salvar no prontuário
                            </Button>
                          )}
                        </div>
                      </div>

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
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
