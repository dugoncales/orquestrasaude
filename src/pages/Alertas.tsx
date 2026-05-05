import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAlerts, useMarkAlertRead } from '@/hooks/useAlerts';
import { AlertTriangle, BellOff, CheckCheck, Info, XCircle } from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const sevIcon = { info: Info, warning: AlertTriangle, critical: XCircle } as const;
const sevStyle: Record<string, string> = {
  info: 'border-[hsl(var(--info))]/30 bg-[hsl(var(--info))]/5 text-[hsl(var(--info))]',
  warning: 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 text-[hsl(var(--warning))]',
  critical: 'border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 text-[hsl(var(--destructive))]',
};

export default function Alertas() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'unread' | 'all'>('unread');
  const [sev, setSev] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const { data, isLoading } = useAlerts(undefined, tab === 'unread');
  const markRead = useMarkAlertRead();

  const alerts = useMemo(() => {
    return (data || []).filter(a => sev === 'all' || a.severidade === sev);
  }, [data, sev]);

  const counts = useMemo(() => {
    const all = data || [];
    return {
      total: all.length,
      critical: all.filter(a => a.severidade === 'critical').length,
      warning: all.filter(a => a.severidade === 'warning').length,
    };
  }, [data]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Alertas Clínicos</h1>
        <p className="text-xs text-muted-foreground">Notificações geradas automaticamente a partir de parâmetros e regras</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'unread' | 'all')}>
          <TabsList>
            <TabsTrigger value="unread">Não lidos {counts.total > 0 && tab === 'unread' && <Badge variant="secondary" className="ml-2 text-[10px]">{counts.total}</Badge>}</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={sev} onValueChange={(v) => setSev(v as typeof sev)}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda severidade</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="warning">Atenção</SelectItem>
            <SelectItem value="info">Informativo</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2 text-[10px]">
          <Badge variant="destructive">{counts.critical} críticos</Badge>
          <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">{counts.warning} atenção</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" /> Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center">
              <BellOff className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{tab === 'unread' ? 'Nenhum alerta pendente. Tudo em dia.' : 'Nenhum alerta encontrado.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => {
                const Icon = sevIcon[a.severidade as keyof typeof sevIcon] ?? Info;
                return (
                  <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 ${sevStyle[a.severidade] || ''}`}>
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.patient_name && (
                          <button
                            className="text-xs font-semibold text-foreground hover:underline"
                            onClick={() => a.patient_id && navigate(`/pacientes/${a.patient_id}`)}
                          >
                            {a.patient_name}
                          </button>
                        )}
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-current">{a.tipo}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatDateBR(a.data)}</span>
                      </div>
                      <p className="text-xs mt-1 opacity-90">{a.mensagem}</p>
                    </div>
                    {!a.lido && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(a.id, {
                          onSuccess: () => toast.success('Alerta marcado como lido'),
                          onError: (e: any) => toast.error(e?.message || 'Erro'),
                        })}
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1" /> Lido
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
