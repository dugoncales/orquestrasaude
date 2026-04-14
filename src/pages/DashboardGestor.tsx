import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GitBranch, TrendingUp, AlertTriangle, Clock, BarChart3, Target } from 'lucide-react';
import { careLines } from '@/data/care-lines';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const patientsByLine = careLines.map(l => ({ name: l.name.split(' ')[0], pacientes: l.patientCount, adesao: l.avgAdherence }));
const stageData = [
  { name: 'Elegib.', value: 12 }, { name: 'Inclusão', value: 8 }, { name: 'Avaliação', value: 45 },
  { name: 'Estratif.', value: 38 }, { name: 'Plano', value: 120 }, { name: 'Seguim.', value: 280 },
  { name: 'PROMs', value: 95 }, { name: 'Reaval.', value: 72 }, { name: 'Manut.', value: 45 }, { name: 'Alta', value: 18 },
];
const COLORS = ['hsl(355,86%,52%)', 'hsl(213,94%,56%)', 'hsl(40,96%,50%)', 'hsl(152,69%,40%)', 'hsl(270,60%,55%)', 'hsl(190,70%,45%)'];

export default function DashboardGestor() {
  const totalPatients = careLines.reduce((s, l) => s + l.patientCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Painel Executivo</h1>
        <p className="text-xs text-muted-foreground">Visão agregada de indicadores assistenciais</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Total Pacientes" value={totalPatients} icon={Users} trend={{ value: 8, positive: true }} />
        <KPICard title="Linhas Ativas" value={careLines.length} icon={GitBranch} />
        <KPICard title="Taxa Adesão" value="74%" icon={Target} trend={{ value: 3, positive: true }} />
        <KPICard title="Gargalos" value={3} icon={AlertTriangle} subtitle="linhas com atraso" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Pacientes por Linha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={patientsByLine}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="pacientes" fill="hsl(355,86%,52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Distribuição por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(213,94%,56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Tempo Médio entre Etapas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Elegib. → Inclusão', 'Inclusão → Avaliação', 'Avaliação → Estratif.', 'Estratif. → Plano', 'Plano → Seguimento'].map((label, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-foreground">{[3, 5, 7, 4, 2][i]} dias</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Adesão por Linha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={patientsByLine} dataKey="adesao" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {patientsByLine.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
