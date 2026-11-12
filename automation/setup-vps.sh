#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[!] File .env baru dibuat dari .env.example."
  echo "    Edit .env terlebih dahulu (N8N_DOMAIN, N8N_PUBLIC_URL, N8N_ENCRYPTION_KEY, WABLAS_TOKEN) lalu jalankan ulang script ini."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[*] Menginstall Docker + Compose plugin..."
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[!] docker compose plugin belum tersedia. Pastikan Docker versi terbaru terpasang."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -n "${N8N_DOMAIN:-}" ] && [ "${N8N_DOMAIN}" != "localhost" ]; then
  echo "[*] Menyalakan stack RPA (Playwright + n8n + Caddy HTTPS untuk ${N8N_DOMAIN})..."
  docker compose --profile ssl up -d --build
else
  echo "[*] Menyalakan stack RPA (Playwright + n8n HTTP port 5678)..."
  docker compose up -d --build
fi

echo ""
echo "[OK] Layanan RPA berjalan:"
docker compose ps

