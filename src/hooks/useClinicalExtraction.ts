import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ColumnMapping, ClinicalExtraction } from '@/lib/clinical-analysis';

export type ExtractionStatus = 'idle' | 'running' | 'paused' | 'done' | 'error' | 'cancelled';

export interface ExtractionProgress {
  status: ExtractionStatus;
  done: number;
  total: number;
  errors: number;
  message?: string;
}

export interface ExtractionResultEntry {
  patientName: string;
  rowIndex: number;
  data?: ClinicalExtraction;
  error?: string;
}

interface RunOptions {
  rows: Record<string, unknown>[];
  mapping: ColumnMapping[];
  textColumns: string[]; // colunas ORIGINAIS (não os campos mapeados) a incluir
  structuredFields?: string[]; // campos mapeados para passar como structuredData
  model?: string;
  concurrency?: number;
  maxRows?: number;
}

export function useClinicalExtraction() {
  const [progress, setProgress] = useState<ExtractionProgress>({
    status: 'idle',
    done: 0,
    total: 0,
    errors: 0,
  });
  const [results, setResults] = useState<Map<number, ExtractionResultEntry>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', done: 0, total: 0, errors: 0 });
    setResults(new Map());
    cancelledRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setProgress((p) => ({ ...p, status: 'cancelled' }));
  }, []);

  const run = useCallback(async (opts: RunOptions) => {
    const {
      rows,
      mapping,
      textColumns,
      structuredFields = [],
      model = 'google/gemini-3-flash-preview',
      concurrency = 3,
      maxRows,
    } = opts;

    cancelledRef.current = false;
    abortRef.current = new AbortController();

    const reverseMap: Record<string, string> = {};
    mapping.forEach((m) => {
      if (m.mapped) reverseMap[m.mapped] = m.original;
    });

    const nameCol = reverseMap['nome'];
    const targetRows = maxRows ? rows.slice(0, maxRows) : rows;
    const total = targetRows.length;
    setResults(new Map());
    setProgress({ status: 'running', done: 0, total, errors: 0 });

    let done = 0;
    let errors = 0;

    const processOne = async (row: Record<string, unknown>, rowIndex: number) => {
      if (cancelledRef.current) return;
      const patientName = nameCol ? String(row[nameCol] ?? '').trim() || `Linha ${rowIndex + 2}` : `Linha ${rowIndex + 2}`;
      const fields: Record<string, string> = {};
      for (const col of textColumns) {
        const v = row[col];
        if (v != null && String(v).trim() !== '') fields[col] = String(v);
      }
      const structuredData: Record<string, unknown> = {};
      for (const f of structuredFields) {
        const col = reverseMap[f];
        if (col && row[col] != null && String(row[col]).trim() !== '') {
          structuredData[f] = row[col];
        }
      }

      try {
        if (Object.keys(fields).length === 0) {
          throw new Error('Sem texto para analisar');
        }
        const { data, error } = await supabase.functions.invoke('clinical-extract', {
          body: { patientName, fields, structuredData, model },
        });
        if (error) throw new Error(error.message ?? 'Erro na chamada');
        if (data?.error) throw new Error(data.error);
        setResults((prev) => {
          const next = new Map(prev);
          next.set(rowIndex, { patientName, rowIndex, data: data as ClinicalExtraction });
          return next;
        });
      } catch (e) {
        errors++;
        setResults((prev) => {
          const next = new Map(prev);
          next.set(rowIndex, {
            patientName,
            rowIndex,
            error: e instanceof Error ? e.message : 'Erro desconhecido',
          });
          return next;
        });
      } finally {
        done++;
        setProgress((p) => ({ ...p, done, errors }));
      }
    };

    // Pool simples de concurrency
    const queue = targetRows.map((row, i) => ({ row, i }));
    const workers: Promise<void>[] = [];
    for (let w = 0; w < Math.max(1, concurrency); w++) {
      workers.push(
        (async () => {
          while (queue.length > 0 && !cancelledRef.current) {
            const item = queue.shift();
            if (!item) break;
            await processOne(item.row, item.i);
          }
        })(),
      );
    }
    await Promise.all(workers);

    setProgress((p) => ({
      ...p,
      status: cancelledRef.current ? 'cancelled' : errors === total && total > 0 ? 'error' : 'done',
    }));
  }, []);

  const retryFailed = useCallback(
    async (opts: RunOptions) => {
      const failedIndexes = Array.from(results.values())
        .filter((r) => r.error)
        .map((r) => r.rowIndex);
      if (failedIndexes.length === 0) return;
      const subset = failedIndexes.map((i) => opts.rows[i]);
      // Limpa erros antes
      setResults((prev) => {
        const next = new Map(prev);
        failedIndexes.forEach((i) => next.delete(i));
        return next;
      });
      await run({ ...opts, rows: subset });
    },
    [results, run],
  );

  return { run, cancel, reset, progress, results, retryFailed };
}
