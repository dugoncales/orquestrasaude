import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus, Copy, Trash2, GripVertical, ChevronRight, Settings, Activity,
  Heart, Brain, Stethoscope, Baby, Bone, PanelRightClose, PanelRightOpen,
  Target, ClipboardList, AlertTriangle, BarChart3, ListChecks, Beaker,
  Zap, FileText, ArrowUp, ArrowDown, Save
} from 'lucide-react';
import { useCareLines } from '@/hooks/useCareLines';
import { mapCareLine } from '@/lib/db-helpers';
import { CareLine, CareLineMeta, CareLineTarefa, CareLineExame, CareLineAutomacao, CareLineAlerta } from '@/data/types';

const iconMap: Record<string, React.ElementType> = { Activity, Heart, Brain, Stethoscope, Baby, Bone };
const iconOptions = ['Activity', 'Heart', 'Brain', 'Stethoscope', 'Baby', 'Bone'];
const colorOptions = [
  'hsl(355, 86%, 52%)', 'hsl(200, 80%, 50%)', 'hsl(150, 60%, 45%)',
  'hsl(280, 70%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(340, 70%, 55%)',
];

const defaultSteps = [
  'Elegibilidade', 'Inclusão na Linha', 'Avaliação Inicial', 'Estratificação de Risco',
  'Plano Terapêutico', 'Seguimento Multiprofissional', 'Coleta PROMs/PREMs',
  'Reavaliação', 'Manutenção ou Intensificação', 'Alta ou Monitoramento'
];

function createEmptyLine(): CareLine {
  const now = Date.now();
  return {
    id: `linha_${now}`, slug: `linha-${now}`, name: 'Nova Linha de Cuidado', icon: 'Activity',
    color: 'hsl(200, 80%, 50%)', clinicalParameters: [], proms: [], prems: [],
    patientCount: 0, avgAdherence: 0, criteriosInclusao: [], criteriosSaida: [],
    metas: [], tarefasPadrao: [], examesPadrao: [], automacoes: [], alertas: [], indicadoresBI: [],
  };
}

export default function EditorNoCode() {
  const { data: careLinesData, isLoading } = useCareLines();
  const initialLines = useMemo(() => (careLinesData || []).map(r => ({ ...mapCareLine(r), indicadoresBI: mapCareLine(r).indicadoresBI || [] })), [careLinesData]);
  const [lines, setLines] = useState<CareLine[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);

  if (!initialized && initialLines.length > 0) {
    setLines(initialLines);
    setSelectedId(initialLines[0]?.id || '');
    setInitialized(true);
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-60 w-full" /></div>;

  const selected = lines.find(l => l.id === selectedId);
  const updateLine = (updates: Partial<CareLine>) => {
    setLines(prev => prev.map(l => l.id === selectedId ? { ...l, ...updates } : l));
  };
  const addLine = () => {
    const nl = createEmptyLine();
    setLines(prev => [...prev, nl]);
    setSelectedId(nl.id);
    toast.success('Linha criada');
  };
  const duplicateLine = (id: string) => {
    const src = lines.find(l => l.id === id);
    if (!src) return;
    const dup = { ...src, id: `${src.id}_copy_${Date.now()}`, name: `${src.name} (cópia)` };
    setLines(prev => [...prev, dup]);
    setSelectedId(dup.id);
    toast.success('Linha duplicada');
  };
  const deleteLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(lines[0]?.id || '');
    toast.success('Linha removida');
  };

  if (!selected) return null;
  const Icon = iconMap[selected.icon] || Activity;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Editor No-Code</h1>
          <p className="text-xs text-muted-foreground">Configure linhas de cuidado sem programação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={() => toast.success('Alterações salvas')} className="gap-1">
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: showPreview ? '220px 1fr 260px' : '220px 1fr' }}>
        <Card className="h-[calc(100vh-180px)]">
          <CardHeader className="pb-2 px-3 pt-3">
            <Button size="sm" className="w-full gap-1 h-8 text-xs" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" /> Nova Linha
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="space-y-1">
                {lines.map(line => {
                  const LIcon = iconMap[line.icon] || Activity;
                  return (
                    <div key={line.id} onClick={() => setSelectedId(line.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs group ${
                        line.id === selectedId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/40 border border-transparent'
                      }`}>
                      <LIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: line.color }} />
                      <span className="flex-1 truncate text-foreground">{line.name}</span>
                      <div className="hidden group-hover:flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); duplicateLine(line.id); }}><Copy className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={e => { e.stopPropagation(); deleteLine(line.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-180px)] overflow-hidden">
          <Tabs defaultValue="geral" className="h-full flex flex-col">
            <div className="px-3 pt-3 pb-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5" style={{ color: selected.color }} />
                <span className="text-sm font-semibold text-foreground">{selected.name}</span>
              </div>
              <ScrollArea className="w-full">
                <TabsList className="h-8 w-max">
                  <TabsTrigger value="geral" className="text-[11px] px-2 h-6">Geral</TabsTrigger>
                  <TabsTrigger value="etapas" className="text-[11px] px-2 h-6">Etapas</TabsTrigger>
                  <TabsTrigger value="criterios" className="text-[11px] px-2 h-6">Critérios</TabsTrigger>
                  <TabsTrigger value="parametros" className="text-[11px] px-2 h-6">Parâmetros</TabsTrigger>
                  <TabsTrigger value="metas" className="text-[11px] px-2 h-6">Metas</TabsTrigger>
                  <TabsTrigger value="proms" className="text-[11px] px-2 h-6">PROMs/PREMs</TabsTrigger>
                  <TabsTrigger value="tarefas" className="text-[11px] px-2 h-6">Tarefas</TabsTrigger>
                  <TabsTrigger value="automacoes" className="text-[11px] px-2 h-6">Automações</TabsTrigger>
                  <TabsTrigger value="alertas" className="text-[11px] px-2 h-6">Alertas</TabsTrigger>
                  <TabsTrigger value="bi" className="text-[11px] px-2 h-6">BI</TabsTrigger>
                </TabsList>
              </ScrollArea>
            </div>
            <ScrollArea className="flex-1 px-4 pb-4">
              <TabsContent value="geral" className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nome da Linha</Label>
                  <Input value={selected.name} onChange={e => updateLine({ name: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ícone</Label>
                  <div className="flex gap-2 flex-wrap">
                    {iconOptions.map(ic => {
                      const Ic = iconMap[ic];
                      return (
                        <button key={ic} onClick={() => updateLine({ icon: ic })}
                          className={`p-2 rounded-lg border transition-colors ${selected.icon === ic ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                          <Ic className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map(c => (
                      <button key={c} onClick={() => updateLine({ color: c })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selected.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="etapas" className="mt-3">
                <div className="space-y-3">
                  <div><h3 className="text-sm font-semibold text-foreground">Etapas da Jornada</h3><p className="text-xs text-muted-foreground">Defina a sequência de etapas</p></div>
                  <div className="space-y-1.5">{defaultSteps.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20">
                      <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                      <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm text-foreground flex-1">{item}</span>
                    </div>
                  ))}</div>
                </div>
              </TabsContent>

              <TabsContent value="criterios" className="mt-3 space-y-6">
                <EditableStringList label="Critérios de Inclusão" items={selected.criteriosInclusao} onChange={items => updateLine({ criteriosInclusao: items })} />
                <EditableStringList label="Critérios de Saída" items={selected.criteriosSaida} onChange={items => updateLine({ criteriosSaida: items })} />
              </TabsContent>

              <TabsContent value="parametros" className="mt-3">
                <EditableStringList label="Parâmetros Clínicos" items={selected.clinicalParameters} onChange={items => updateLine({ clinicalParameters: items })} />
              </TabsContent>

              <TabsContent value="metas" className="mt-3">
                <p className="text-xs text-muted-foreground">Editor de metas (em breve)</p>
              </TabsContent>

              <TabsContent value="proms" className="mt-3 space-y-6">
                <EditableStringList label="PROMs" items={selected.proms} onChange={items => updateLine({ proms: items })} />
                <EditableStringList label="PREMs" items={selected.prems} onChange={items => updateLine({ prems: items })} />
              </TabsContent>

              <TabsContent value="tarefas" className="mt-3">
                <p className="text-xs text-muted-foreground">Editor de tarefas (em breve)</p>
              </TabsContent>
              <TabsContent value="automacoes" className="mt-3">
                <p className="text-xs text-muted-foreground">Editor de automações (em breve)</p>
              </TabsContent>
              <TabsContent value="alertas" className="mt-3">
                <p className="text-xs text-muted-foreground">Editor de alertas (em breve)</p>
              </TabsContent>
              <TabsContent value="bi" className="mt-3">
                <p className="text-xs text-muted-foreground">Editor de indicadores BI (em breve)</p>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>

        {showPreview && (
          <Card className="h-[calc(100vh-180px)]">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs text-muted-foreground">Preview da Jornada</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="h-[calc(100vh-270px)]">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    {defaultSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ borderColor: selected.color, color: selected.color }}>{i + 1}</div>
                        <span className="text-[11px] text-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Resumo</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <SummaryBadge icon={Target} label="Metas" count={selected.metas.length} />
                      <SummaryBadge icon={Settings} label="Parâmetros" count={selected.clinicalParameters.length} />
                      <SummaryBadge icon={ListChecks} label="Tarefas" count={selected.tarefasPadrao.length} />
                      <SummaryBadge icon={Beaker} label="Exames" count={selected.examesPadrao.length} />
                      <SummaryBadge icon={Zap} label="Automações" count={selected.automacoes.filter(a => a.ativa).length} />
                      <SummaryBadge icon={AlertTriangle} label="Alertas" count={selected.alertas.length} />
                      <SummaryBadge icon={FileText} label="PROMs" count={selected.proms.length} />
                      <SummaryBadge icon={BarChart3} label="BI" count={(selected.indicadoresBI || []).length} />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryBadge({ icon: Ic, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30">
      <Ic className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-foreground flex-1">{label}</span>
      <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{count}</Badge>
    </div>
  );
}

function EditableStringList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const [newItem, setNewItem] = useState('');
  const add = () => { if (!newItem.trim()) return; onChange([...items, newItem.trim()]); setNewItem(''); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
            <span className="text-sm text-foreground flex-1">{item}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => remove(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Adicionar item..." className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && add()} />
        <Button size="sm" className="h-8 px-3" onClick={add}><Plus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}
