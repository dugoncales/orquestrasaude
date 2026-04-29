import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuestionnaireItems } from '@/hooks/useQuestionnaireItems';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  responseId: string;
  questionnaireId: string;
  questionnaireName?: string;
};

export function AnswerQuestionnaireDialog({ open, onOpenChange, responseId, questionnaireId, questionnaireName }: Props) {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuestionnaireItems(questionnaireId);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const { score, maxScore } = useMemo(() => {
    let s = 0, m = 0;
    (items || []).forEach(it => {
      const peso = Number(it.peso || 1);
      const ans = answers[it.id];
      if (it.tipo === 'escala' || it.tipo === 'numerico') {
        const n = Number(ans);
        if (!Number.isNaN(n)) s += n * peso;
        m += 10 * peso;
      } else if (it.tipo === 'sim_nao') {
        if (ans === 'sim') s += peso;
        m += peso;
      } else if (it.tipo === 'multipla' && Array.isArray(it.opcoes)) {
        const idx = (it.opcoes as any[]).findIndex((o: any) => (typeof o === 'string' ? o : o.value) === ans);
        if (idx >= 0) s += idx * peso;
        m += ((it.opcoes as any[]).length - 1) * peso;
      }
    });
    return { score: Math.round(s * 10) / 10, maxScore: m || 100 };
  }, [items, answers]);

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('questionnaire_responses')
        .update({
          status: 'respondido',
          respostas: answers,
          score,
          max_score: maxScore,
          data: new Date().toISOString().slice(0, 10),
        })
        .eq('id', responseId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questionnaire_responses'] });
      toast.success(`Questionário respondido (${score}/${maxScore})`);
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || 'Erro'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{questionnaireName || 'Responder Questionário'}</DialogTitle>
          <DialogDescription>Score parcial: {score}/{maxScore}</DialogDescription>
        </DialogHeader>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando perguntas...</p> :
         (items || []).length === 0 ? <p className="text-sm text-muted-foreground">Este questionário ainda não tem perguntas cadastradas.</p> : (
          <div className="space-y-4">
            {items!.map(it => (
              <div key={it.id} className="space-y-2 border-b border-border pb-3 last:border-0">
                <Label className="text-sm font-medium">{it.ordem}. {it.pergunta}</Label>
                {(it.tipo === 'escala' || it.tipo === 'numerico') && (
                  <Input type="number" min={0} max={10} step="any"
                    value={answers[it.id] ?? ''}
                    onChange={e => setAnswers(a => ({ ...a, [it.id]: e.target.value }))}
                    placeholder={it.tipo === 'escala' ? '0 a 10' : 'Valor numérico'} />
                )}
                {it.tipo === 'sim_nao' && (
                  <RadioGroup value={answers[it.id] || ''} onValueChange={v => setAnswers(a => ({ ...a, [it.id]: v }))} className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sim" /> Sim</label>
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nao" /> Não</label>
                  </RadioGroup>
                )}
                {it.tipo === 'multipla' && Array.isArray(it.opcoes) && (
                  <RadioGroup value={answers[it.id] || ''} onValueChange={v => setAnswers(a => ({ ...a, [it.id]: v }))} className="space-y-1">
                    {(it.opcoes as any[]).map((o, i) => {
                      const val = typeof o === 'string' ? o : o.value;
                      const label = typeof o === 'string' ? o : (o.label || o.value);
                      return <label key={i} className="flex items-center gap-2 text-sm"><RadioGroupItem value={val} /> {label}</label>;
                    })}
                  </RadioGroup>
                )}
                {it.tipo === 'texto' && (
                  <Textarea rows={2} value={answers[it.id] || ''} onChange={e => setAnswers(a => ({ ...a, [it.id]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || (items || []).length === 0}>
            {submit.isPending ? 'Salvando...' : 'Enviar respostas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
