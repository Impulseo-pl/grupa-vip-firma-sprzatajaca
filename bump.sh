#!/usr/bin/env bash
# Dopisuje cache-buster ?v=<md5> do lokalnych assetów we wszystkich .html
set -euo pipefail
cd "$(dirname "$0")"
for f in *.html; do
  python3 - "$f" <<'PY'
import hashlib, re, sys, os
f = sys.argv[1]
h = open(f, encoding='utf-8').read()
def stamp(m):
    path = m.group(2).split('?')[0]
    if not os.path.isfile(path):
        return m.group(0)
    d = hashlib.md5(open(path, 'rb').read()).hexdigest()[:8]
    return f'{m.group(1)}="{path}?v={d}"'
h = re.sub(r'(href|src)="(assets/[^"]+)"', stamp, h)
open(f, 'w', encoding='utf-8').write(h)
print(f'  {f}')
PY
done
