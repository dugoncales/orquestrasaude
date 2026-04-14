import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/shared/KPICard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Users, Target, TrendingUp, Clock, Calendar, Activity } from 'lucide-react';

const tooltipStyle = { background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 };
const tickStyle = { fill: 'hsl(215,15%,50%)', fontSize: 10 };

const opData = [
  { name: 'Jan', consultas: 120, exames: 85, tarefas: 95 },
  { name: 'Fev', consultas: 135, exames: 92, tarefas: 88 },
  { name: 'Mar', consultas: 142, exames: 88, tarefas: 102 },
  { name: 'Abr', consultas: 128, exames: 95, tarefas: 78 },
];

const clinData = [
  { name: 'Jan', hba1c_meta: 58, pa_meta: 62, adesao: 72 },
  { name: 'Fev', hba1c_meta: 61, pa_meta: 65, adesao: 74 },
  { name: 'Mar', hba1c_meta: 63, pa_meta: 68, adesao: 76 },
  { name: 'Abr', hba1c_meta: 60, pa_meta: 70, adesao: 78 },
];

const execData = [
  { name: 'Q1', conclusao: 22, risco: 15 },
  { name: 'Q2', conclusao: 28, risco: 12 },
  { name: 'Q3', conclusao: 35, risco: 18 },
  { name: 'Q4', conclusao: 30, risco: 14 },
];

export default function BI() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">BI Assistencial</h1>
        <p className="text-xs text-muted-foreground">Business Intelligence — indicadores operacionais, clínicos e executivos</p>
      </div>

      <Tabs defaultValue="operacional">
        <TabsList>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="clinico">Clínico</TabsTrigger>
          <TabsTrigger value="executivo">Executivo</TabsTrigger>
        </TabsList>

        <TabsContent value="operacional" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="Consultas/Mês" value={128} icon={Calendar} trend={{ value: 5, positive: true }} />
            <KPICard title="Exames Pendentes" value={14} icon={Activity} />
            <KPICard title="Taxa Adesão" value="74%" icon={Target} trend={{ value: 3, positive: true }} />
            <KPICard title="Tempo Médio" value="4.2d" icon={Clock} subtitle="entre etapas" />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Volume Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={opData}>
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="consultas" fill="hsl(355,86%,52%)" radius={[4,4,0,0]} />
                  <Bar dataKey="exames" fill="hsl(213,94%,56%)" radius={[4,4,0,0]} />
                  <Bar dataKey="tarefas" fill="hsl(152,69%,40%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinico" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <KPICard title="% na Meta HbA1c" value="60%" icon={Target} />
            <KPICard title="% PA Controlada" value="70%" icon={Activity} />
            <KPICard title="Adesão Geral" value="78%" icon={TrendingUp} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Evolução de Indicadores Clínicos (%)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={clinData}>
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="hba1c_meta" stroke="hsl(355,86%,52%)" strokeWidth={2} name="HbA1c na Meta" />
                  <Line type="monotone" dataKey="pa_meta" stroke="hsl(213,94%,56%)" strokeWidth={2} name="PA Controlada" />
                  <Line type="monotone" dataKey="adesao" stroke="hsl(152,69%,40%)" strokeWidth={2} name="Adesão" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executivo" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard title="Jornadas Concluídas" value={115} icon={TrendingUp} trend={{ value: 12, positive: true }} />
            <KPICard title="Risco Agregado" value="Moderado" icon={Activity} />
            <KPICard title="Coortes Ativas" value={6} icon={Users} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Conclusão de Jornadas vs Risco</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={execData}>
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="conclusao" fill="hsl(152,69%,40%)" fillOpacity={0.2} stroke="hsl(152,69%,40%)" strokeWidth={2} name="Conclusão" />
                  <Area type="monotone" dataKey="risco" fill="hsl(355,86%,52%)" fillOpacity={0.2} stroke="hsl(355,86%,52%)" strokeWidth={2} name="Risco" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
