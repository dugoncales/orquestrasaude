

# Plano: Multi-roles + acesso completo para dugoncales@gmail.com

Permitir que um usuário tenha múltiplos perfis (`patient`, `professional`, `manager`, `admin`) e alterne entre as visões pelo header. Conceder os 4 roles à conta `dugoncales@gmail.com`.

---

## 1. Banco — conceder os 4 roles ao usuário

Usuário já existe: `4184cc80-80b5-4552-b05b-2474ca5a29bc` (`dugoncales@gmail.com`), hoje só tem `professional`.

Inserir os 3 roles faltantes (`patient`, `manager`, `admin`) na tabela `user_roles`. A constraint `UNIQUE(user_id, role)` evita duplicatas, então usaremos `ON CONFLICT DO NOTHING`.

> Vai ser feito via insert tool (operação de dados, não schema).

---

## 2. AuthContext — expor lista de roles e permitir troca da role ativa

`src/contexts/AuthContext.tsx`:

- Carregar **todos** os roles do usuário (não só o de maior privilégio).
- Expor:
  - `roles: UserRole[]` — todos os roles do usuário no banco
  - `activeRole: UserRole | null` — qual está em uso agora
  - `setActiveRole(role: UserRole)` — troca a visão (entre as roles que o usuário possui)
- Persistir a escolha em `localStorage` (chave `orquestra:activeRole:<userId>`) para sobreviver a reload.
- Default: maior privilégio entre os roles disponíveis (mesma ordem atual: `admin > manager > professional > patient`).
- Manter `role` (compat) apontando para `activeRole`.
- Manter `setRole` antigo como alias de `setActiveRole`, mas **sem mais depender de `ENABLE_ROLE_SWITCHER`** quando o usuário realmente possui múltiplos roles. Trocar entre roles próprios é comportamento de produto, não dev.
- `ENABLE_ROLE_SWITCHER` continua existindo só para forçar uma role que o usuário **não** tem (apenas dev).

---

## 3. Header — seletor de visão quando o usuário tem 2+ roles

`src/components/layout/AppHeader.tsx`:

- Se `roles.length >= 2`: mostrar dropdown "Visão: <role atual>" com as roles do usuário, marcando a ativa. Trocar chama `setActiveRole`.
- Se `roles.length === 1`: badge informativo (igual hoje).
- Mostrar todos os roles do usuário no menu de perfil (lista compacta sob nome/email).
- Manter o dropdown dev (`ENABLE_ROLE_SWITCHER`) só quando explicitamente ativado por env var, para simular roles que o usuário não tem.

---

## 4. Sidebar — refletir a role ativa

`src/components/layout/AppSidebar.tsx` já lê `currentRole` do contexto, então atualiza automaticamente quando `activeRole` muda. Sem mudanças necessárias.

`DashboardRouter.tsx` também já reage a `role`, sem mudanças.

---

## Arquivos editados

| Arquivo | Mudança |
|---|---|
| (data migration via insert tool) | conceder `patient`, `manager`, `admin` para `dugoncales@gmail.com` |
| `src/contexts/AuthContext.tsx` | expor `roles[]`, `activeRole`, `setActiveRole`; persistir em localStorage |
| `src/components/layout/AppHeader.tsx` | dropdown "Visão" quando `roles.length >= 2`; lista de roles no menu de perfil |

## Fora de escopo (continuação dos sprints)

- Sprint 3 (mocks restantes em `DashboardPaciente` e `BI`, helpers de formatação, timeline)
- Sprint 4 (hooks especializados, `id` vs `slug`)
- Sprint 5 (RLS por role, audit, anexos)

Posso seguir com Sprint 3 logo após este ajuste se quiser.

