import { useClinicalExtractions } from '@/hooks/useClinicalExtractionsDb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Activity, CheckCheck } from 'lucide-react';
import { formatDateBR } from '@/lib/format';

interface Props {
  patientId: string;
  limit?: number;
}

export function PatientExtractionsList({ patientId, limit = 10 }: Props) {
  const { data, isLoading } = useClinicalExtractions({ patientId, limit });

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Extrações IA · {data.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((ext) => {
          const redFlags = (ext.red_flags ?? []).length;
          const params = Array.isArray(ext.extracted_params) ? ext.extracted_params.length : 0;
          return (
            <div key={ext.id} className="p-3 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatDateBR(ext.created_at)} · {ext.model?.split('/').pop() ?? '—'}
                </span>
                <div className="flex gap-1">
                  {ext.applied && (
                    <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-0 text-[10px]">
                      <CheckCheck className="h-3 w-3 mr-1" /> aplicada
                    </Badge>
                  )}
                  {redFlags > 0 && (
                    <Badge className="bg-[hsl(var(--destructive))] text-white text-[10px]">
                      <Zap className="h-3 w-3 mr-1" /> {redFlags}
                    </Badge>
                  )}
                  {params > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      <Activity className="h-3 w-3 mr-1" /> {params}
                    </Badge>
                  )}
                </div>
              </div>
              {ext.summary && (
                <p className="text-xs text-foreground line-clamp-3">{ext.summary}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
