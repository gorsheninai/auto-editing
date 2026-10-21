#!/usr/bin/env python3
"""Копирует выбранные блоки remocn (и их registry-зависимости) в src/remocn/ плоско, переписывая импорты @/lib/remocn/* и @/components/remocn/* на относительные."""
import json, os, re, sys
SRC, DST = sys.argv[1], sys.argv[2]   # SRC = .../remocn/registry/remocn
want = sys.argv[3:]
reg = {it['name']: it for it in json.load(open(os.path.join(SRC, 'registry.json')))['items']}
seen, order, npm = set(), [], set()
def walk(n):
    if n in seen: return
    seen.add(n); it = reg[n]
    for dep in it.get('registryDependencies') or []:
        walk(dep.rstrip('/').split('/')[-1].replace('.json', ''))
    npm.update(it.get('dependencies') or []); order.append(n)
for w in want: walk(w)
os.makedirs(DST, exist_ok=True)
for n in order:
    for f in reg[n]['files']:
        tgt = os.path.basename(f['target'])
        s = open(os.path.join(SRC, f['path'])).read()
        s = re.sub(r'["\']@/(?:lib|components)/remocn/([\w-]+)["\']', lambda m: f'"./{m.group(1)}"', s)
        s = s.replace('"use client";\n', '')
        open(os.path.join(DST, tgt), 'w').write('// из remocn (MIT, github.com/remocn/remocn) — блок ' + n + '\n' + s)
print('files:', len(order)); print('npm:', ' '.join(sorted(npm)))
left = [l for n in order for f in reg[n]['files'] for l in open(os.path.join(SRC, f['path'])) if '@/' in l]
print('unresolved:', left[:10])
