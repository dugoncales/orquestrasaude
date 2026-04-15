import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { useCareLines } from '@/hooks/useCareLines';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RiskLevel } from '@/data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { mapCareLine, riskLevel } from '@/lib/db-helpers';

const riskBorderColors: Record<RiskLevel, string> = {
  baixo: 'border-l-[hsl(var(--success))]',
  moderado: 'border-l-[hsl(var(--warning))]',
  alto: 'border-l-[hsl(var(--status-waiting))]',
  critico: 'border-l-[hsl(var(--destructive))]',
};

export default function Pacientes() {
  const navigate = useNavigate();
  const { data: patients, isLoading } = usePatients();
  const { data: careLinesData } = useCareLines();
  const careLines = (careLinesData || []).map(mapCareLine);
  const safePatients = patients || [];

  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  const riskCounts = {
    critico: safePatients.filter(p => p.risk_level === 'critico').length,
    alto: safePatients.filter(p => p.risk_level === 'alto').length,
    moderado: safePatients.filter(p => p.risk_level === 'moderado').length,
    baixo: safePatients.filter(p => p.risk_level === 'baixo').length,
  };

  const filtered = safePatients.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchLine = filterLine === 'all' || (p.linhas_ativas || []).includes(filterLine);
    const matchRisk = filterRisk === 'all' || p.risk_level === filterRisk;
    return matchSearch && matchLine && matchRisk;
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pacientes</h1>
          <p className="text-xs text-muted-foreground">{safePatients.length} pacientes cadastrados</p>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo Paciente</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="destructive" className="text-[10px] gap-1">{riskCounts.critico} críticos</Badge>
        <Badge className="text-[10px] gap-1 bg-[hsl(var(--status-waiting-bg))] text-[hsl(var(--status-waiting))] border-transparent">{riskCounts.alto} alto risco</Badge>
        <Badge className="text-[10px] gap-1 bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))] border-transparent">{riskCounts.moderado} moderados</Badge>
        <Badge className="text-[10px] gap-1 bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))] border-transparent">{riskCounts.baixo} baixo risco</Badge>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filterLine} onValueChange={setFilterLine}>
          <SelectTrigger className="w-[180px] h-9">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Linha de cuidado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as linhas</SelectItem>
            {careLines.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os riscos</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="moderado">Moderado</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table className="table-premium">
          <TableHeader>
            <TableRow>
              <TableHead>Risco</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden md:table-cell">Diagnósticos</TableHead>
              <TableHead>Linhas</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => {
              const rl = riskLevel(p);
              return (
                <TableRow key={p.id} className={`cursor-pointer border-l-2 ${riskBorderColors[rl]}`} onClick={() => navigate(`/pacientes/${p.id}`)}>
                  <TableCell><RiskSemaphore level={rl} score={p.score_risco ?? 0} /></TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground text-sm">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.convenio} · {p.unidade}{p.dias_sem_retorno ? ` · ${p.dias_sem_retorno}d sem retorno` : ''}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{(p.diagnosticos_ativos || []).join(', ')}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(p.linhas_ativas || []).map(l => {
                        const line = careLines.find(cl => cl.id === l);
                        return (
                          <span key={l} className="status-chip text-[10px]" style={{ background: line ? line.color + '22' : undefined, color: line?.color }}>
                            {line?.name.split(' ')[0] || l}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusChip status={p.status_cadastral === 'ativo' ? 'concluido' : 'nao_iniciado'} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
