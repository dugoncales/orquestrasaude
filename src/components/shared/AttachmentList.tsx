import { useRef, useState } from 'react';
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  getAttachmentSignedUrl,
  type AttachmentRow,
} from '@/hooks/useAttachments';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDateBR } from '@/lib/format';
import { Upload, Download, Trash2, Paperclip, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  patientId: string;
  /** Quando definido, anexos enviados ficam vinculados ao step. Não filtra a listagem. */
  relatedJourneyStepId?: string | null;
  /** Quando definido, anexos enviados ficam vinculados ao exame. Não filtra a listagem. */
  relatedExamId?: string | null;
  /** Categoria sugerida no upload */
  defaultCategory?: 'exame' | 'receita' | 'atestado' | 'outro';
  className?: string;
  /** Limita tamanho da lista visível (ainda mostra todos com scroll) */
  compact?: boolean;
}

const categoryLabel: Record<string, string> = {
  exame: 'Exame',
  receita: 'Receita',
  atestado: 'Atestado',
  outro: 'Outro',
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  patientId,
  relatedJourneyStepId,
  relatedExamId,
  defaultCategory = 'outro',
  className,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { data: attachments, isLoading } = useAttachments(patientId);
  const upload = useUploadAttachment();
  const remove = useDeleteAttachment();

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      try {
        await upload.mutateAsync({
          file,
          patientId,
          category: defaultCategory,
          relatedExamId,
          relatedJourneyStepId,
        });
        toast.success(`${file.name} enviado`);
      } catch (err: any) {
        toast.error(`Falha ao enviar ${file.name}: ${err.message ?? 'erro'}`);
      }
    }
  };

  const handleDownload = async (att: AttachmentRow) => {
    try {
      const url = await getAttachmentSignedUrl(att.storage_path, 60);
      window.open(url, '_blank', 'noopener');
    } catch (err: any) {
      toast.error(`Falha ao gerar link: ${err.message ?? 'erro'}`);
    }
  };

  const handleDelete = async (att: AttachmentRow) => {
    if (!confirm(`Excluir "${att.filename}"?`)) return;
    try {
      await remove.mutateAsync(att);
      toast.success('Anexo removido');
    } catch (err: any) {
      toast.error(`Falha ao remover: ${err.message ?? 'erro'}`);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl border-2 border-dashed border-border p-4 transition-colors text-center',
          dragOver && 'border-primary bg-primary/5',
        )}
      >
        <Paperclip className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground mb-2">
          Arraste arquivos aqui ou
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          {upload.isPending ? 'Enviando…' : 'Selecionar arquivo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !attachments?.length ? (
        <p className="text-xs text-muted-foreground text-center py-3">Nenhum anexo</p>
      ) : (
        <div className={cn('space-y-1.5', compact && 'max-h-64 overflow-y-auto pr-1')}>
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{att.filename}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(att.size_bytes)} · {formatDateBR(att.created_at)}
                </p>
              </div>
              {att.category && (
                <Badge variant="secondary" className="text-[9px]">
                  {categoryLabel[att.category] || att.category}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleDownload(att)}
                title="Baixar"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(att)}
                title="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
