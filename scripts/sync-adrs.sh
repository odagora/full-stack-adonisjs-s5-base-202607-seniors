#!/usr/bin/env bash
# Sincroniza los ADRs (log4brains) de docs/adr/ y */docs/adr/ hacia
# docs/site/src/content/docs/adr/, agregando el frontmatter que Starlight
# necesita (title) y quitando el H1 original del cuerpo: Starlight ya
# renderiza el título desde el frontmatter, así que dejarlo duplicaría
# el título visualmente (ver guía de Starlight sobre no empezar el
# contenido con un H1: https://starlight.astro.build/guides/authoring-content/).
#
# Uso: ./scripts/sync-adrs.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$ROOT_DIR/docs/site/src/content/docs/adr"
EXCLUDE_NAMES=("index.md" "README.md" "template.md")

mkdir -p "$DEST_DIR"
rm -f "$DEST_DIR"/*.md

is_excluded() {
	local name="$1"
	for excluded in "${EXCLUDE_NAMES[@]}"; do
		[[ "$name" == "$excluded" ]] && return 0
	done
	return 1
}

sync_dir() {
	local src_dir="$1"
	[[ -d "$src_dir" ]] || return 0

	for file in "$src_dir"/*.md; do
		[[ -e "$file" ]] || continue
		local name
		name="$(basename "$file")"
		is_excluded "$name" && continue

		local title
		title="$(grep -m1 '^# ' "$file" | sed 's/^# //')"
		[[ -z "$title" ]] && title="$name"

		{
			printf -- '---\n'
			printf 'title: "%s"\n' "$(printf '%s' "$title" | sed 's/"/\\"/g')"
			printf -- '---\n\n'
			# Saca el H1 original (línea 1) para no duplicar el título que ya
			# pone Starlight desde el frontmatter.
			awk 'NR == 1 && /^# / { next } { print }' "$file"
		} >"$DEST_DIR/$name"

		echo "synced: $src_dir/$name -> docs/site/src/content/docs/adr/$name"
	done
}

sync_dir "$ROOT_DIR/docs/adr"
sync_dir "$ROOT_DIR/backend/docs/adr"
sync_dir "$ROOT_DIR/frontend/docs/adr"
