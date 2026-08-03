#!/usr/bin/env bash
# Descarga un snapshot del spec OpenAPI real del backend (@foadonis/openapi,
# expuesto en /api.yaml) y lo guarda en docs/site/openapi.yaml. starlight-openapi
# lee ese snapshot en build time, no el backend en vivo.
#
# Requiere el backend corriendo (npm run dev en backend/, puerto 3333 por defecto).
#
# Uso: ./scripts/generate-openapi.sh [backend_url]

set -euo pipefail

BACKEND_URL="${1:-http://localhost:3333}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT_DIR/docs/site/openapi.yaml"

# Ojo: @foadonis/openapi acumula parámetros duplicados en la spec cada vez
# que se pega a /api.yaml o /api.json dentro del mismo proceso vivo del
# backend (bug conocido, ver docs/adr o el hallazgo de esta sesión). Por eso
# el chequeo de salud usa /api/v1/health en vez de /api.yaml: hay que pegarle
# a /api.yaml una sola vez por ejecución de este script.
if ! curl -s -o /dev/null -w '%{http_code}' "$BACKEND_URL/api/v1/health" | grep -q '^200$'; then
	echo "Error: no se pudo alcanzar $BACKEND_URL/api/v1/health" >&2
	echo "Levanta el backend primero: cd backend && npm run dev" >&2
	exit 1
fi

curl -s "$BACKEND_URL/api.yaml" -o "$DEST"
echo "OpenAPI spec guardado en docs/site/openapi.yaml ($(wc -l <"$DEST" | tr -d ' ') líneas)"
