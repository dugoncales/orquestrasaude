import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Blocks, Plus, ChevronRight, GripVertical, Settings, AlertTriangle, BarChart3, ClipboardList, ListChecks } from 'lucide-react';

const defaultSteps = [
  'Elegibilidade', 'Inclusão na Linha', 'Avaliação Inicial', 'Estratificação de Risco',
  'Plano Terapêutico', 'Seguimento Multiprofissional', 'Coleta PROMs/PREMs',
  'Reavaliação', 'Manutenção ou Intensificação', 'Alta ou Monitoramento'
];

const blocks = [
  { icon: Blocks, label: 'Etapas', count: 10 },
  { icon: Settings, label: 'Parâmetros', count: 13 },
  { icon: ClipboardList, label: 'Questionários', count: 4 },
  { icon: AlertTriangle, label: 'Regras/Alertas', count: 5 },
  { icon: BarChart3, label: 'Indicadores', count: 8 },
  { icon: ListChecks, label: 'Tarefas', count: 6 },
];

export default function EditorNoCode() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Editor No-Code</h1>
          <p className="text-xs text-muted-foreground">Configure linhas de cuidado sem programação</p>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Linha</Button>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Blocks palette */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Blocos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blocks.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 cursor-grab hover:bg-muted/60 transition-colors">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <b.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground flex-1">{b.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{b.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Journey preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Preview — Diabetes Mellitus</CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs">Editar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {defaultSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/30 transition-colors cursor-pointer">
                    <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-sm text-foreground">{step}</span>
                  </div>
                  {i < defaultSteps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 hidden sm:block" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
