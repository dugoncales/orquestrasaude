import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPatients } from '@/data/mock-patients';
import { careLines } from '@/data/care-lines';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Pacientes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('all');

  const filtered = mockPatients.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchLine = filterLine === 'all' || p.linhasAtivas.includes(filterLine);
    return matchSearch && matchLine;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pacientes</h1>
          <p className="text-xs text-muted-foreground">{mockPatients.length} pacientes cadastrados</p>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo Paciente</Button>
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
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
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
            {filtered.map(p => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                <TableCell><RiskSemaphore level={p.riskLevel} score={p.scoreRisco} /></TableCell>
                <TableCell>
                  <p className="font-medium text-foreground text-sm">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.convenio} · {p.unidade}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.diagnosticosAtivos.join(', ')}</p>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {p.linhasAtivas.map(l => (
                      <span key={l} className="status-chip bg-secondary text-secondary-foreground text-[10px]">{l}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <StatusChip status={p.statusCadastral === 'ativo' ? 'concluido' : 'nao_iniciado'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
