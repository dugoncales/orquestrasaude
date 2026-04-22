

# Plano: Correção de Build + Sprint 1 (alto impacto, baixo esforço)

Corrigir o erro de build atual e aplicar as correções imediatas listadas: navegação quebrada do dashboard, branding inconsistente, header com role-switcher de demo, e README. As mudanças estruturais maiores (auth real, profiles, RLS por role, refator do `DashboardPaciente`) ficam para Sprints seguintes — esse plano cobre apenas a fila marcada como **Sprint 1** + o build error.

---

## 1. Corrigir build error (`JornadaClinica.tsx` linhas 257 e 263)

O problema: ao passar alertas vindos do banco para `AlertBanner`, o campo `tipo` é `string` (banco), mas o tipo `Alert` da UI exige union `'clinico' | 'operacional' | 'sistema'`.

Solução: cast explícito `tipo: a.tipo as any` (consistente com o cast já feito em `severidade`). Mudança pontual em 2 linhas.

## 2. Corrigir rota quebrada do dashboard profissional

`src/pages/DashboardProfissional.tsx` (linha 232): trocar `navigate('/jornada-clinica?paciente=${p.id}')` por `navigate('/jornadas?paciente=${p.id}')`.

`src/pages/JornadaClinica.tsx`: ler `?paciente=` via `useSearchParams` e usar como valor inicial de `selectedPatientId` (sem alterar lógica geral).

## 3. Branding centralizado "Orquestra Care"

Criar `src/config/app.ts`:

```ts
export const APP_NAME = "Orquestra Care";
export const APP_VERSION = "v1.0";
export const APP_TAGLINE = "Gestão de Jornadas Clínicas";
```

Atualizar:
- `src/components/layout/AppSidebar.tsx`: header e footer passam a usar `APP_NAME` / `APP_VERSION`.
- `src/components/layout/AppHeader.tsx`: breadcrumb mostra `APP_NAME` em vez de "HealthBit".
- `index.html`: `<title>` para "Orquestra Care".

## 4. Header: trocar dropdown de roles por menu de usuário (com flag dev)

`src/components/layout/AppHeader.tsx`:
- Manter o role-switcher **apenas** quando `import.meta.env.VITE_ENABLE_ROLE_SWITCHER === 'true'`.
- Em produção (default), substituir por um `DropdownMenu` real do usuário com:
  - Nome + email no header do menu
  - Item "Meu perfil" (placeholder, navega para `/perfil` — rota a criar como stub no futuro; por enquanto desabilitado)
  - Item "Sair" (por enquanto chama `toast` "Logout em breve" — auth real virá no Sprint 2)
- O badge da role atual continua visível ao lado do avatar (informativo, não clicável).

## 5. README útil

Reescrever `README.md` com:
- Objetivo do app (gestão de jornadas clínicas)
- Stack (React 18 + Vite + Tailwind + shadcn + Supabase via Lovable Cloud + React Query)
- Variáveis de ambiente (.env auto-gerado: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`; opcional `VITE_ENABLE_ROLE_SWITCHER`)
- Como rodar local (`npm i && npm run dev`)
- Como publicar (Lovable → Publish)
- Visão das roles (patient / professional / manager / admin)
- Visão do schema (lista das 13 tabelas e relações principais)

---

## Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/pages/JornadaClinica.tsx` | cast `tipo: a.tipo as any` (2 linhas) + ler `?paciente` via `useSearchParams` |
| `src/pages/DashboardProfissional.tsx` | corrigir rota `/jornadas?paciente=...` |
| `src/config/app.ts` | **novo** — constantes de branding |
| `src/components/layout/AppSidebar.tsx` | usar `APP_NAME` / `APP_VERSION` |
| `src/components/layout/AppHeader.tsx` | breadcrumb com `APP_NAME`; menu de usuário real; role-switcher só com `VITE_ENABLE_ROLE_SWITCHER=true` |
| `index.html` | `<title>` para Orquestra Care |
| `README.md` | documentação completa |

## Fora de escopo (Sprints seguintes)

- Auth real com Supabase + tabela `profiles` + `user_roles` (Sprint 2)
- Refator de `DashboardPaciente` removendo mocks (Sprint 3)
- Hooks especializados (`useTodayAppointments`, `usePendingTasks`, etc.) e `id` vs `slug` em `mapCareLine` (Sprint 4)
- RLS por role, audit logs, anexos (Sprint 5)
- Melhorias de timeline e formatação de sexo em `PerfilPaciente` (vão junto do Sprint 3)

