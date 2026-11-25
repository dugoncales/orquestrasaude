import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppointments } from '@/hooks/useAppointments';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function periodo(hora: string) {
  const h = parseInt(hora?.slice(0, 2) || '0', 10);
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

function countBy<T>(items: T[], key: (i: T) => string) {
  const m = new Map<string, number>();
  items.forEach(i => { const k = key(i); m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

function ChartCard({ title, data, sort = true }: { title: string; data: { name: string; total: number }[]; sort?: boolean }) {
  const d = sort ? data : data;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="h-64">
        {d.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados no período.</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function IndicadoresConsultas() {
  const { data: appts = [], isLoading } = useAppointments();
  const today = new Date();
  const [de, setDe] = useState(new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().slice(0, 10));
  const [ate, setAte] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10));

  const f = useMemo(() => appts.filter(a => a.data >= de && a.data <= ate), [appts, de, ate]);
  const stats = useMemo(() => {
    const realizadas = f.filter(a => a.status === 'realizada').length;
    const faltas = f.filter(a => a.status === 'faltou').length;
    const porDia = DIAS.map((name, i) => ({ name, total: f.filter(a => new Date(a.data + 'T12:00').getDay() === i).length }));
    const porPeriodo = ['Manhã', 'Tarde', 'Noite'].map(name => ({ name, total: f.filter(a => periodo(a.hora) === name).length }));
    return {
      realizadas, faltas,
      medicos: countBy(f, a => a.profissional || 'Não informado'),
      unidades: countBy(f, a => (a as any).unidade || 'Não informada'),
      tipos: countBy(f, a => a.tipo),
      porDia, porPeriodo,
      topDia: [...porDia].sort((a, b) => b.total - a.total)[0],
      topPeriodo: [...porPeriodo].sort((a, b) => b.total - a.total)[0],
    };
  }, [f]);

  const kpis = [
    { label: 'Total de consultas', value: f.length },
    { label: 'Realizadas', value: stats.realizadas },
    { label: 'Faltas', value: stats.faltas },
    { label: 'Dia mais usado', value: f.length ? stats.topDia.name : '—' },
    { label: 'Período mais usado', value: f.length ? stats.topPeriodo.name : '—' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Indicadores de Consultas</h1>
          <p className="text-sm text-muted-foreground">Volume, profissionais, unidades, dias e períodos de atendimento</p>
        </div>
        <div className="flex gap-3">
          <div><Label className="text-xs">De</Label><Input type="date" value={de} onChange={e => setDe(e.target.value)} /></div>
          <div><Label className="text-xs">Até</Label><Input type="date" value={ate} onChange={e => setAte(e.target.value)} /></div>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {kpis.map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-2xl font-bold">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Consultas por profissional" data={stats.medicos} />
            <ChartCard title="Consultas por unidade" data={stats.unidades} />
            <ChartCard title="Dias da semana" data={stats.porDia} />
            <ChartCard title="Períodos (manhã até 12h, tarde até 18h, noite)" data={stats.porPeriodo} />
            <ChartCard title="Por tipo de atendimento" data={stats.tipos} />
          </div>
        </>
      )}
    </div>
  );
}
