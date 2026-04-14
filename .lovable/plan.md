

# Plano: Refinamento Visual Premium + Identidade HealthBit (Azul)

Cor primaria da HealthBit: **azul corporativo `#0056A0`** (HSL ~207 100% 31%) conforme imagem do site. Accent/CTA secundario: **rosa `#E6197A`** (HSL ~335 82% 50%) para botoes de destaque.

---

## 1. `src/index.css` — Paleta azul HealthBit + classes premium

**Cores** (`:root` e `.dark`):
- `--primary`: `207 100% 31%` (azul HealthBit)
- `--accent`: `207 60% 15%` / `--accent-foreground`: `207 100% 70%`
- `--ring`, `--sidebar-primary`, `--sidebar-ring`: harmonizar com azul
- `--sidebar-accent`: `207 50% 12%` / `--sidebar-accent-foreground`: `207 100% 70%`

**Classes novas**:
- `.card-elevated` — `shadow-lg shadow-black/20 border-white/[0.04]`
- `.section-label` — `text-[11px] uppercase tracking-widest font-semibold text-muted-foreground`
- `.table-premium th` — `bg-muted/30 text-[11px] uppercase tracking-wider`
- `.table-premium tr` — `hover:bg-muted/20 even:bg-muted/10`

## 2. `AppHeader.tsx` — Glass + breadcrumb + avatar iniciais

- `backdrop-blur-xl bg-card/80` no header
- Avatar com iniciais coloridas (azul HealthBit) em vez de icone User
- Breadcrumb do modulo atual via `useLocation`
- Badge notificacao com `animate-pulse` em alertas criticos

## 3. `AppSidebar.tsx` — Grupos + barra ativa + footer

- Separadores entre grupos: Core (Dashboard, Pacientes, Jornadas) / Analise (BI, IA) / Admin (Studio, Editor)
- Item ativo: `border-l-2 border-primary`
- Footer: "HealthBit · v3.0"

## 4. `KPICard.tsx` — Border-top contextual + hover

- Prop `accentColor?: 'success' | 'warning' | 'destructive' | 'info' | 'primary'`
- `border-t-2` com cor do accent
- Gradiente sutil `bg-gradient-to-br from-card to-card/80`
- `hover:scale-[1.01] hover:shadow-lg transition-all`

## 5. `StatusChip.tsx` — Dot indicator

- Bolinha `h-1.5 w-1.5 rounded-full` colorida antes do texto
- `font-medium` em vez de `font-semibold`

## 6. `RiskSemaphore.tsx` — Labels + pulso critico

- Dot `h-3 w-3`, label textual ("Baixo"/"Moderado"/"Alto"/"Critico")
- Prop `showLabel` (default true)
- `animate-pulse` no nivel critico

## 7. `Pacientes.tsx` — Filtro risco + visual

- Dropdown filtro por risco
- Badges contagem por risco no header
- `border-l-2` colorida por risco em cada row

## 8. `Consultas.tsx` — Filtros + agenda

- Filtro por status e profissional
- Card "Hoje" com `border-l-2 border-primary`
- Botao "Iniciar" com variante `default`

## 9. `Exames.tsx` — Filtro status + urgencia

- Dropdown filtro por status
- KPI "Atrasados" com `accentColor="destructive"`

## 10. `Questionarios.tsx` — Tipo PROM/PREM

- Badge diferenciado por tipo
- Filtro por linha de cuidado

## 11. Dashboards (Profissional + Gestor) — Section labels + card-elevated

- `.section-label` em todas as secoes
- `.card-elevated` nos KPIs

## 12. `PerfilPaciente.tsx` — Avatar iniciais + header elevado

- Avatar com iniciais em fundo azul HealthBit

## 13. `StudioAdmin.tsx` — Tabelas premium

- Headers `bg-muted/30`, hover, zebra striping

---

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/index.css` | Paleta azul HealthBit + classes utilitarias |
| `src/components/layout/AppHeader.tsx` | Glass, breadcrumb, avatar |
| `src/components/layout/AppSidebar.tsx` | Grupos, barra ativa, footer |
| `src/components/shared/KPICard.tsx` | Border-top, gradiente, hover |
| `src/components/shared/StatusChip.tsx` | Dot indicator |
| `src/components/shared/RiskSemaphore.tsx` | Label, pulso critico |
| `src/pages/Pacientes.tsx` | Filtro risco, border-left |
| `src/pages/Consultas.tsx` | Filtros, destaque hoje |
| `src/pages/Exames.tsx` | Filtro status, urgencia |
| `src/pages/Questionarios.tsx` | Tipo PROM/PREM, filtro |
| `src/pages/DashboardProfissional.tsx` | Section labels, card-elevated |
| `src/pages/DashboardGestor.tsx` | Section labels, card-elevated |
| `src/pages/PerfilPaciente.tsx` | Avatar iniciais |
| `src/pages/StudioAdmin.tsx` | Tabelas premium |

