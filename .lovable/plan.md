

# Plano: Dashboard Paciente — Experiência Premium Mobile-First

## Objetivo
Reescrever `DashboardPaciente.tsx` com foco em simplicidade, acolhimento e clareza. Linguagem acessível, layout mobile-first (single column, touch-friendly), sem jargão técnico.

## Mudanças

### 1. `DashboardPaciente.tsx` — Reescrever completamente

**Hero de boas-vindas** (topo)
- Saudação contextual por horário ("Bom dia, Maria!", "Boa tarde...")
- Avatar com iniciais em gradient suave
- Frase motivacional curta ("Você está progredindo bem no seu tratamento")
- Contagem de pendências como badge sutil ("3 itens precisam da sua atenção")

**Card "Seu Próximo Passo"** (destaque principal)
- Card grande com borda colorida da linha de cuidado
- Nome da etapa em linguagem simples
- Ícone da ação esperada (calendário, tubo de ensaio, etc.)
- Descrição humanizada ("Sua próxima consulta de acompanhamento está agendada")
- Botão CTA grande ("Ver detalhes")

**Mini jornada simplificada** (3 etapas: anterior → atual → próxima)
- Vertical, com circles conectados por linha
- Etapa anterior: check verde + nome
- Etapa atual: pulse azul + nome + pendência principal em linguagem simples
- Próxima etapa: cinza + nome
- Se múltiplas linhas: tabs simples no topo para alternar ("Diabetes", "Pressão", "Peso")

**Próximas consultas** (cards touch-friendly)
- Cards individuais por consulta (não tabela)
- Tipo + profissional + data/hora em layout claro
- Ícone de calendário proeminente

**Exames pendentes** (lista simples)
- Cards com nome do exame + status em linguagem simples ("Aguardando resultado", "Precisa realizar")
- Sem códigos ou termos técnicos

**Questionários pendentes** (CTAs proeminentes)
- Cada questionário como card com botão "Responder" grande
- Descrição amigável ("Nos conte como você está se sentindo")
- Badge de tempo estimado ("~3 min")

**Metas clínicas** (visual simplificado)
- GoalProgress mas com labels amigáveis ("Controle do açúcar", "Colesterol", "Peso")
- Emojis/ícones em vez de códigos (🎯 no alvo, ⚠️ precisa atenção)
- Barra de progresso com cores suaves
- Mensagem positiva quando no alvo ("Parabéns, seu controle está dentro da meta!")

**Orientações recentes** (novo)
- Card com últimas orientações da equipe
- Mock: 2-3 orientações simples ("Manter caminhada diária de 30 min", "Tomar medicação pela manhã")
- Ícone de coração/cuidado

**Rodapé acolhedor**
- "Sua equipe está acompanhando sua jornada" com avatares da equipe

### 2. `mock-data.ts` — Adicionar orientações
- Adicionar array `mockOrientacoes` com orientações mock por paciente

### 3. Ajustes de estilo
- `max-w-lg` para manter layout narrow/mobile
- Padding generoso, bordas arredondadas grandes (rounded-2xl)
- Textos maiores para leitura fácil (text-base mínimo para conteúdo)
- Touch targets mínimo h-12 para botões
- Cores mais suaves/quentes no hero

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/DashboardPaciente.tsx` | Reescrever — mobile-first acolhedor |
| `src/data/mock-data.ts` | Adicionar `mockOrientacoes` |

