

# Plan: Darker Colors + Bigger Buttons

## Changes

### 1. `src/index.css` — Darker color palette
- Darken the light theme background to a deep slate/dark tone (making the default theme essentially dark)
- Primary color: deep blue-slate
- Foreground: light text on dark backgrounds
- Cards/popovers: slightly lighter dark surfaces
- Borders/inputs: subtle dark borders

### 2. `src/components/ui/button.tsx` — Larger buttons
- Increase default height from `h-10` to `h-12`, padding from `px-4` to `px-6`
- Increase `sm` size from `h-9` to `h-10`
- Increase `lg` size from `h-11` to `h-14`, padding from `px-8` to `px-10`
- Increase icon size from `h-10 w-10` to `h-12 w-12`
- Bump font size from `text-sm` to `text-base`

These are CSS-only changes — no structural modifications needed.

