import { useState } from 'react';
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
import { toast } from 'sonner';
import {
  Plus, Copy, Trash2, GripVertical, ChevronRight, Settings, Activity,
  Heart, Brain, Stethoscope, Baby, Bone, PanelRightClose, PanelRightOpen,
  Target, ClipboardList, AlertTriangle, BarChart3, ListChecks, Beaker,
  Zap, FileText, ArrowUp, ArrowDown, Save
} from 'lucide-react';
import { careLines as initialCareLines } from '@/data/care-lines';
import { CareLine, CareLineMeta, CareLineTarefa, CareLineExame, CareLineAutomacao, CareLineAlerta } from '@/data/types';

const iconMap: Record<string, React.ElementType> = {
  Activity, Heart, Brain, Stethoscope, Baby, Bone,
};

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
  return {
    id: `linha_${Date.now()}`,
    name: 'Nova Linha de Cuidado',
    icon: 'Activity',
    color: 'hsl(200, 80%, 50%)',
    clinicalParameters: [],
    proms: [],
    prems: [],
    patientCount: 0,
    avgAdherence: 0,
    criteriosInclusao: [],
    criteriosSaida: [],
    metas: [],
    tarefasPadrao: [],
    examesPadrao: [],
    automacoes: [],
    alertas: [],
    indicadoresBI: [],
  };
}

export default function EditorNoCode() {
  const [lines, setLines] = useState<CareLine[]>(() => initialCareLines.map(l => ({ ...l, indicadoresBI: l.indicadoresBI || [] })));
  const [selectedId, setSelectedId] = useState<string>(lines[0]?.id || '');
  const [showPreview, setShowPreview] = useState(true);

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
        {/* Sidebar - Line list */}
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
                    <div
                      key={line.id}
                      onClick={() => setSelectedId(line.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs group ${
                        line.id === selectedId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/40 border border-transparent'
                      }`}
                    >
                      <LIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: line.color }} />
                      <span className="flex-1 truncate text-foreground">{line.name}</span>
                      <div className="hidden group-hover:flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); duplicateLine(line.id); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={e => { e.stopPropagation(); deleteLine(line.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Central - Config tabs */}
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
              {/* Tab Geral */}
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

              {/* Tab Etapas */}
              <TabsContent value="etapas" className="mt-3">
                <EditableList
                  title="Etapas da Jornada"
                  description="Defina a sequência de etapas do paciente"
                  items={selected.clinicalParameters.length === 0 && !selected.criteriosInclusao.length ? defaultSteps : defaultSteps}
                  renderItem={(item, i) => (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20">
                      <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                      <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm text-foreground flex-1">{item}</span>
                    </div>
                  )}
                  onAdd={() => toast.info('Adicionar etapa — em breve')}
                />
              </TabsContent>

              {/* Tab Critérios */}
              <TabsContent value="criterios" className="mt-3 space-y-6">
                <EditableStringList label="Critérios de Inclusão" items={selected.criteriosInclusao}
                  onChange={items => updateLine({ criteriosInclusao: items })} />
                <EditableStringList label="Critérios de Saída" items={selected.criteriosSaida}
                  onChange={items => updateLine({ criteriosSaida: items })} />
              </TabsContent>

              {/* Tab Parâmetros */}
              <TabsContent value="parametros" className="mt-3">
                <EditableStringList label="Parâmetros Clínicos" items={selected.clinicalParameters}
                  onChange={items => updateLine({ clinicalParameters: items })} />
              </TabsContent>

              {/* Tab Metas */}
              <TabsContent value="metas" className="mt-3">
                <MetasEditor metas={selected.metas} onChange={metas => updateLine({ metas })} />
              </TabsContent>

              {/* Tab PROMs/PREMs */}
              <TabsContent value="proms" className="mt-3 space-y-6">
                <EditableStringList label="PROMs" items={selected.proms} onChange={items => updateLine({ proms: items })} />
                <EditableStringList label="PREMs" items={selected.prems} onChange={items => updateLine({ prems: items })} />
              </TabsContent>

              {/* Tab Tarefas */}
              <TabsContent value="tarefas" className="mt-3">
                <TarefasEditor tarefas={selected.tarefasPadrao} exames={selected.examesPadrao}
                  onChangeTarefas={t => updateLine({ tarefasPadrao: t })}
                  onChangeExames={e => updateLine({ examesPadrao: e })} />
              </TabsContent>

              {/* Tab Automações */}
              <TabsContent value="automacoes" className="mt-3">
                <AutomacoesEditor automacoes={selected.automacoes} onChange={a => updateLine({ automacoes: a })} />
              </TabsContent>

              {/* Tab Alertas */}
              <TabsContent value="alertas" className="mt-3">
                <AlertasEditor alertas={selected.alertas} onChange={a => updateLine({ alertas: a })} />
              </TabsContent>

              {/* Tab BI */}
              <TabsContent value="bi" className="mt-3">
                <BIEditor indicadores={selected.indicadoresBI || []} onChange={bi => updateLine({ indicadoresBI: bi })} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>

        {/* Preview panel */}
        {showPreview && (
          <Card className="h-[calc(100vh-180px)]">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs text-muted-foreground">Preview da Jornada</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="h-[calc(100vh-270px)]">
                <div className="space-y-4">
                  {/* Journey steps */}
                  <div className="space-y-1.5">
                    {defaultSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ borderColor: selected.color, color: selected.color }}>
                          {i + 1}
                        </div>
                        <span className="text-[11px] text-foreground">{step}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Summary badges */}
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

/* ─── Sub-components ─── */

function SummaryBadge({ icon: Ic, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30">
      <Ic className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-foreground flex-1">{label}</span>
      <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{count}</Badge>
    </div>
  );
}

function EditableList({ title, description, items, renderItem, onAdd }: {
  title: string; description: string; items: string[];
  renderItem: (item: string, i: number) => React.ReactNode; onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-1.5">{items.map((item, i) => <div key={i}>{renderItem(item, i)}</div>)}</div>
      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={onAdd}>
        <Plus className="h-3 w-3" /> Adicionar
      </Button>
    </div>
  );
}

function EditableStringList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const [newItem, setNewItem] = useState('');
  const add = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem('');
  };
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
        <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Adicionar item..."
          className="h-8 text-xs flex-1" onKeyDown={e => e.key === 'Enter' && add()} />
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={add}><Plus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

function MetasEditor({ metas, onChange }: { metas: CareLineMeta[]; onChange: (m: CareLineMeta[]) => void }) {
  const [form, setForm] = useState({ parametro: '', operador: '<', valor: '', unidade: '' });
  const add = () => {
    if (!form.parametro || !form.valor) return;
    onChange([...metas, { ...form, valor: Number(form.valor) }]);
    setForm({ parametro: '', operador: '<', valor: '', unidade: '' });
  };
  const remove = (i: number) => onChange(metas.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Metas Clínicas</h3>
        <p className="text-xs text-muted-foreground">Defina valores-alvo para os parâmetros</p>
      </div>
      <div className="space-y-1.5">
        {metas.map((m, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
            <span className="text-sm text-foreground flex-1">
              {m.parametro} <span className="text-primary font-mono">{m.operador} {m.valor}</span> {m.unidade}
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => remove(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        <Input value={form.parametro} onChange={e => setForm(f => ({ ...f, parametro: e.target.value }))} placeholder="Parâmetro" className="h-8 text-xs col-span-2" />
        <Select value={form.operador} onValueChange={v => setForm(f => ({ ...f, operador: v }))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['<', '>', '<=', '>=', '='].map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="Valor" className="h-8 text-xs" type="number" />
        <Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Un." className="h-8 text-xs" />
      </div>
      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={add}><Plus className="h-3 w-3" /> Adicionar Meta</Button>
    </div>
  );
}

function TarefasEditor({ tarefas, exames, onChangeTarefas, onChangeExames }: {
  tarefas: CareLineTarefa[]; exames: CareLineExame[];
  onChangeTarefas: (t: CareLineTarefa[]) => void; onChangeExames: (e: CareLineExame[]) => void;
}) {
  const [tf, setTf] = useState({ nome: '', responsavel: '', etapa: '' });
  const [ef, setEf] = useState({ nome: '', frequencia: '', etapa: '' });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tarefas Padrão</h3>
          <p className="text-xs text-muted-foreground">Tarefas recorrentes da linha</p>
        </div>
        <div className="space-y-1.5">
          {tarefas.map((t, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
              <div className="flex-1">
                <span className="text-sm text-foreground">{t.nome}</span>
                <span className="text-xs text-muted-foreground ml-2">• {t.responsavel} • {t.etapa}</span>
              </div>
              {t.compartilhada && <Badge variant="outline" className="text-[9px] h-4">Comp.</Badge>}
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => onChangeTarefas(tarefas.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input value={tf.nome} onChange={e => setTf(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className="h-8 text-xs" />
          <Input value={tf.responsavel} onChange={e => setTf(f => ({ ...f, responsavel: e.target.value }))} placeholder="Responsável" className="h-8 text-xs" />
          <Input value={tf.etapa} onChange={e => setTf(f => ({ ...f, etapa: e.target.value }))} placeholder="Etapa" className="h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => {
          if (!tf.nome) return;
          onChangeTarefas([...tarefas, tf]);
          setTf({ nome: '', responsavel: '', etapa: '' });
        }}><Plus className="h-3 w-3" /> Adicionar Tarefa</Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Exames Padrão</h3>
          <p className="text-xs text-muted-foreground">Exames recorrentes com frequência</p>
        </div>
        <div className="space-y-1.5">
          {exames.map((e, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
              <span className="text-sm text-foreground flex-1">{e.nome} <span className="text-xs text-muted-foreground">• {e.frequencia} • {e.etapa}</span></span>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => onChangeExames(exames.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input value={ef.nome} onChange={e => setEf(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className="h-8 text-xs" />
          <Input value={ef.frequencia} onChange={e => setEf(f => ({ ...f, frequencia: e.target.value }))} placeholder="Frequência" className="h-8 text-xs" />
          <Input value={ef.etapa} onChange={e => setEf(f => ({ ...f, etapa: e.target.value }))} placeholder="Etapa" className="h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => {
          if (!ef.nome) return;
          onChangeExames([...exames, ef]);
          setEf({ nome: '', frequencia: '', etapa: '' });
        }}><Plus className="h-3 w-3" /> Adicionar Exame</Button>
      </div>
    </div>
  );
}

function AutomacoesEditor({ automacoes, onChange }: { automacoes: CareLineAutomacao[]; onChange: (a: CareLineAutomacao[]) => void }) {
  const [form, setForm] = useState({ condicao: '', acao: '' });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Automações</h3>
        <p className="text-xs text-muted-foreground">Regras automáticas condição → ação</p>
      </div>
      <div className="space-y-1.5">
        {automacoes.map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Se: <span className="text-foreground">{a.condicao}</span></p>
              <p className="text-xs text-muted-foreground">Então: <span className="text-foreground">{a.acao}</span></p>
            </div>
            <Switch checked={a.ativa} onCheckedChange={v => onChange(automacoes.map((x, idx) => idx === i ? { ...x, ativa: v } : x))} />
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => onChange(automacoes.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={form.condicao} onChange={e => setForm(f => ({ ...f, condicao: e.target.value }))} placeholder="Condição (ex: HbA1c > 9%)" className="h-8 text-xs" />
        <Input value={form.acao} onChange={e => setForm(f => ({ ...f, acao: e.target.value }))} placeholder="Ação (ex: Criar tarefa urgente)" className="h-8 text-xs" />
      </div>
      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => {
        if (!form.condicao) return;
        onChange([...automacoes, { ...form, ativa: true }]);
        setForm({ condicao: '', acao: '' });
      }}><Plus className="h-3 w-3" /> Adicionar Automação</Button>
    </div>
  );
}

function AlertasEditor({ alertas, onChange }: { alertas: CareLineAlerta[]; onChange: (a: CareLineAlerta[]) => void }) {
  const [form, setForm] = useState({ condicao: '', severidade: 'warning' as 'warning' | 'critical', mensagem: '' });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Alertas</h3>
        <p className="text-xs text-muted-foreground">Alertas clínicos e operacionais</p>
      </div>
      <div className="space-y-1.5">
        {alertas.map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${a.severidade === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
            <div className="flex-1">
              <p className="text-sm text-foreground">{a.mensagem}</p>
              <p className="text-xs text-muted-foreground">{a.condicao}</p>
            </div>
            <Badge variant={a.severidade === 'critical' ? 'destructive' : 'secondary'} className="text-[9px] h-4">{a.severidade}</Badge>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => onChange(alertas.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input value={form.condicao} onChange={e => setForm(f => ({ ...f, condicao: e.target.value }))} placeholder="Condição" className="h-8 text-xs" />
        <Select value={form.severidade} onValueChange={v => setForm(f => ({ ...f, severidade: v as any }))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Input value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} placeholder="Mensagem" className="h-8 text-xs" />
      </div>
      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => {
        if (!form.condicao) return;
        onChange([...alertas, form]);
        setForm({ condicao: '', severidade: 'warning', mensagem: '' });
      }}><Plus className="h-3 w-3" /> Adicionar Alerta</Button>
    </div>
  );
}

function BIEditor({ indicadores, onChange }: { indicadores: { nome: string; formula: string; tipo: string }[]; onChange: (i: { nome: string; formula: string; tipo: string }[]) => void }) {
  const [form, setForm] = useState({ nome: '', formula: '', tipo: 'percentual' });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Indicadores de BI</h3>
        <p className="text-xs text-muted-foreground">KPIs e métricas customizadas por linha</p>
      </div>
      <div className="space-y-1.5">
        {indicadores.map((ind, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 group">
            <BarChart3 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{ind.nome}</p>
              <p className="text-xs text-muted-foreground font-mono">{ind.formula}</p>
            </div>
            <Badge variant="outline" className="text-[9px] h-4">{ind.tipo}</Badge>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => onChange(indicadores.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do indicador" className="h-8 text-xs" />
        <Input value={form.formula} onChange={e => setForm(f => ({ ...f, formula: e.target.value }))} placeholder="Fórmula" className="h-8 text-xs" />
        <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="percentual">Percentual</SelectItem>
            <SelectItem value="absoluto">Absoluto</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="contagem">Contagem</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => {
        if (!form.nome) return;
        onChange([...indicadores, form]);
        setForm({ nome: '', formula: '', tipo: 'percentual' });
      }}><Plus className="h-3 w-3" /> Adicionar Indicador</Button>
    </div>
  );
}
