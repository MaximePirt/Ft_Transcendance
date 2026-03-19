#!/bin/sh
set -eu

/scripts/vault-run.sh /secrets/front/app.env /bin/sh -eu <<'SH'
OUT="/usr/share/nginx/html/env-config.js"

js_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

trim() {
  printf '%s' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

is_valid_key() {
  printf '%s' "$1" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$'
}

{
  printf 'window.env = {\n'
  first=1

  while IFS= read -r raw || [ -n "$raw" ]; do
    line=$(printf '%s' "$raw" | tr -d '\r')
    line=$(trim "$line")

    [ -z "$line" ] && continue
    case "$line" in \#*) continue ;; esac

    case "$line" in
      *=*) key=${line%%=*} ;;
      *:*) key=${line%%:*} ;;
      *) continue ;;
    esac

    key=$(trim "$key")
    is_valid_key "$key" || continue

    val=$(printenv "$key" 2>/dev/null || true)
    val=$(js_escape "$val")

    [ "$first" -eq 0 ] && printf ',\n'
    printf '  "%s": "%s"' "$key" "$val"
    first=0
  done < /secrets/front/app.env

  printf '\n};\n'
} > "$OUT"
SH
