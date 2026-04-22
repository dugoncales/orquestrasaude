#!/usr/bin/env bash
set -euo pipefail

MODE="install"
if [[ "${1:-}" == "--check" ]]; then
  MODE="check"
fi

echo "[carejourney] Node: $(node -v)"
echo "[carejourney] npm:  $(npm -v)"

if [[ -n "${npm_config_http_proxy:-}" || -n "${HTTP_PROXY:-}" ]]; then
  echo "[carejourney] Limpando proxies de ambiente para evitar falhas de install..."
  unset npm_config_http_proxy npm_config_https_proxy HTTP_PROXY HTTPS_PROXY
fi

npm config set registry https://registry.npmjs.org/ >/dev/null

if [[ "$MODE" == "install" ]]; then
  echo "[carejourney] Instalando dependencias (npm install)..."
  npm install
fi

if [[ -x "node_modules/.bin/vitest" ]]; then
  echo "[carejourney] OK: vitest encontrado em node_modules/.bin/vitest"
  exit 0
fi

echo "[carejourney] ERRO: vitest nao encontrado."
echo "[carejourney] Rode: npm install"
exit 1
