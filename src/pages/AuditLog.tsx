import { useState } from 'react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const TABLES = [
  'patients', 'journeys', 'journey_steps', 'exams', 'tasks',
  'appointments', 'parameter_records', 'user_roles',
];
const ACTIONS = ['INSERT', 'UPDATE', 'DELETE'];

const actionColor: Record<string, string> = {
  INSERT: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]',
  UPDATE: 'bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]',
  DELETE: 'bg-destructive/15 text-destructive',
};

export default function AuditLog() {
  const { currentRole } = useAuth();
  const [tableName, setTableName] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [userEmail, setUserEmail] = useState('');

  if (currentRole !== 'admin' && currentRole !== 'manager') {
    return <Navigate to="/" replace />;
  }

  const { data, isLoading } = useAuditLogs({
    tableName: tableName === 'all' ? undefined : tableName,
    action: action === 'all' ? undefined : action,
    userEmail: userEmail || undefined,
    limit: 200,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Auditoria</h1>
          <p className="text-xs text-muted-foreground">Histórico de alterações em dados clínicos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={tableName} onValueChange={setTableName}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tabelas</SelectItem>
            {TABLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="Filtrar por email do usuário"
          className="w-[260px] h-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table className="table-premium">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead className="hidden md:table-cell">Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm">{log.user_email ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{log.table_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${actionColor[log.action] ?? ''}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground hidden md:table-cell">
                      {log.record_id?.substring(0, 8) ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
