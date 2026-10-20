m = open('src/Main.tsx').read()
m = m.replace("import {C, SANS, TOTAL, WORDS, clamp, useFonts, wf} from './kit';", "import {N, SANS, TOTAL, WORDS, clamp, useFonts, wf} from './kit';")
a = m.index("  const onDark = mode === 'A';")
b = m.index("  );\n};\n\n// ---------- transition")
m = m[:a] + """  // dark backdrop everywhere -> white captions with a soft shadow
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, translate: '0 -50%', textAlign: 'center'}}>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 56, letterSpacing: -1, color: '#fff',
        textShadow: '0 2px 10px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.6)'}}>{ch.text}</span>
    </div>
""" + m[b:]
m = m.replace("const cols = [C.lav, C.violet, C.orange];", "const cols = [N.violet, N.pink, N.yellow, N.blue];")
m = m.replace("const col = cols[B.indexOf(b) % 3];", "const col = cols[B.indexOf(b) % cols.length];")
s0 = m.index("const sfx: [string, number, number][] = (() => {")
s1 = m.index("export const Main")
m = m[:s0] + """const sfx: [string, number, number][] = (() => {
  const L: [string, number, number][] = [];
  B.slice(1, -1).forEach((b) => L.push(['whoosh', b - 6, 0.12]));
  L.push(['click', wf('белом'), 0.15], ['flash', wf('пересвета'), 0.16]);
  ['лицо', 'глаза', 'очками', 'рот', 'брекеты'].forEach((w) => L.push(['pop', wf(w), 0.14]));
  L.push(['shutter', wf('кадре'), 0.2], ['tick', wf('шея'), 0.14], ['tick', wf('корпус'), 0.14]);
  L.push(['buzz', wf('неонами'), 0.18], ['swish', wf('ракетками'), 0.18], ['thud', wf('ракетками') + 10, 0.12]);
  L.push(['swish', wf('перенести') + 2, 0.12], ['ding', wf('качественное') + 4, 0.16], ['pop', wf('без', 1), 0.15], ['swish', wf('человека') + 6, 0.15]);
  for (let k = 0; k < 5; k++) L.push(['tick', wf('свет') + 4 + k * 4, 0.08]);
  for (let k = 0; k < 5; k++) L.push(['tick', wf('цвет') + 4 + k * 4, 0.08]);
  L.push(['buzz', wf('неоновые'), 0.12], ['success', wf('отражения') + 6, 0.16]);
  return L;
})();

""" + m[s1:]
m = m.replace("<AbsoluteFill style={{background: C.cream}}>", "<AbsoluteFill style={{background: N.navy}}>")
assert 'C.' not in m.replace('B.slice', ''), [l for l in m.splitlines() if 'C.' in l]
open('src/Main.tsx', 'w').write(m)
print('ok')
