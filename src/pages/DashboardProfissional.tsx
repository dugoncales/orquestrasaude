import { KPICard } from '@/components/shared/KPICard';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { StatusChip } from '@/components/shared/StatusChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, AlertTriangle, ListChecks, Clock, ArrowRight, Activity } from 'lucide-react';
import { mockPatients } from '@/data/mock-patients';
import { mockAppointments, mockTasks, mockAlerts } from '@/data/mock-data';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { useNavigate } from 'react-router-dom';

export default function DashboardProfissional() {
  const navigate = useNavigate();
  const todayAppointments = mockAppointments.filter(a => a.data === '2025-04-15');
  const priorityPatients = mockPatients.filter(p => p.riskLevel === 'critico' || p.riskLevel === 'alto').slice(0, 5);
  const pendingTasks = mockTasks.filter(t => t.status === 'pendente' || t.status === 'atrasada');
  const criticalAlerts = mockAlerts.filter(a => !a.lido && a.severidade === 'critical');
  const faltosos = mockAppointments.filter(a => a.status === 'faltou');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cockpit Assistencial</h1>
          <p className="text-xs text-muted-foreground">Visão geral do seu painel clínico</p>
        </div>
        <Button size="sm" onClick={() => navigate('/pacientes')} className="gap-1">
          <Users className="h-4 w-4" /> Ver Pacientes
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Pacientes Ativos" value={mockPatients.length} icon={Users} subtitle="8 em acompanhamento" />
        <KPICard title="Consultas Hoje" value={todayAppointments.length} icon={Calendar} subtitle="15/04/2025" />
        <KPICard title="Tarefas Pendentes" value={pendingTasks.length} icon={ListChecks} trend={{ value: 12, positive: false }} />
        <KPICard title="Alertas Críticos" value={criticalAlerts.length} icon={AlertTriangle} />
      </div>

      {/* Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Alertas Críticos</h2>
          {criticalAlerts.map(a => <AlertBanner key={a.id} alert={a} />)}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Priority patients */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Pacientes Prioritários</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/pacientes')}>
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityPatients.map(p => (
              <div key={p.id} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2" onClick={() => navigate(`/pacientes/${p.id}`)}>
                <div className="flex items-center gap-3">
                  <RiskSemaphore level={p.riskLevel} score={p.scoreRisco} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.diagnosticosAtivos.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {p.linhasAtivas.slice(0, 2).map(l => (
                    <span key={l} className="status-chip bg-secondary text-secondary-foreground text-[10px]">{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Tarefas do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground">{t.patientName} · {t.responsavel}</p>
                </div>
                <StatusChip status={t.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Consultas de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma consulta hoje</p> : todayAppointments.map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">{a.hora} · {a.tipo}</p>
                </div>
                <StatusChip status={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Faltosos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Faltosos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faltosos.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum faltoso recente</p> : faltosos.map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">{a.data} · {a.tipo}</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs">Buscar</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
