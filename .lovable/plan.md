

# Plano: Corrigir Clipping Visual na Timeline da Jornada Clínica

## Problema

A timeline interativa (ZONA B) tem elementos cortados:
- Badge "ETAPA ATUAL" usa `absolute -top-3` e é cortado pelo container
- Linha conectora usa `absolute top-6` sem contribuir para altura do pai
- `overflow-x-auto` no wrapper corta elementos que excedem no eixo Y
- Container interno com `min-w-max` não garante espaço vertical

## Mudanças em `src/pages/JornadaClinica.tsx`

### Wrapper da timeline (linhas 250-251)
- Trocar `overflow-x-auto` por `overflow-x-auto overflow-y-visible`
- Adicionar `pt-6 pb-2` ao container scrollável para dar espaço ao badge "ETAPA ATUAL" acima e aos cards abaixo

### Container flex interno (linha 251)
- Adicionar `pt-5 pb-2` ao `div.flex.items-start` para garantir que o badge com `-top-3` não fique fora da área visível

### Linha conectora (linha 253)
- Manter `absolute` mas ajustar `top` para acompanhar o padding extra adicionado

### Badge "ETAPA ATUAL" (linhas 284-290)
- Ajustar de `-top-3` para `-top-5` ou equivalente, compatível com o padding adicionado
- Garantir que `whitespace-nowrap` e `z-10` mantenham visibilidade

## Arquivo

| Arquivo | Ação |
|---|---|
| `src/pages/JornadaClinica.tsx` | Ajustar classes CSS na ZONA B (linhas 247-323) |

