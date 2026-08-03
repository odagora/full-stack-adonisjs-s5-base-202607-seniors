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

if ! curl -s -o /dev/null -w '%{http_code}' "$BACKEND_URL/api.yaml" | grep -q '^200$'; then
	echo "Error: no se pudo alcanzar $BACKEND_URL/api.yaml" >&2
	echo "Levanta el backend primero: cd backend && npm run dev" >&2
	exit 1
fi

curl -s "$BACKEND_URL/api.yaml" -o "$DEST"
echo "OpenAPI spec guardado en docs/site/openapi.yaml ($(wc -l <"$DEST" | tr -d ' ') líneas)"
