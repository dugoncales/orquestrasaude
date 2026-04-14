import { careLines } from '@/data/care-lines';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Copy, Settings, Users, TrendingUp } from 'lucide-react';
import { Activity, Heart, Scale, Droplets, Brain, Wind } from 'lucide-react';

const iconMap: Record<string, any> = { Activity, Heart, Scale, Droplets, Brain, Wind };

export default function LinhasDeCuidado() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Linhas de Cuidado</h1>
          <p className="text-xs text-muted-foreground">{careLines.length} linhas configuradas</p>
        </div>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Linha</Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {careLines.map(line => {
          const Icon = iconMap[line.icon] || Activity;
          return (
            <Card key={line.id} className="border-t-2 hover:border-primary/50 transition-colors" style={{ borderTopColor: line.color }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: line.color + '22' }}>
                    <Icon className="h-5 w-5" style={{ color: line.color }} />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{line.name}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{line.patientCount}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{line.avgAdherence}% adesão</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <span className="text-[10px] status-chip bg-secondary text-secondary-foreground">{line.clinicalParameters.length} parâmetros</span>
                  <span className="text-[10px] status-chip bg-secondary text-secondary-foreground">{line.proms.length} PROMs</span>
                  <span className="text-[10px] status-chip bg-secondary text-secondary-foreground">{line.prems.length} PREMs</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
