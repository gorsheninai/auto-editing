# usage: python3 align.py script.txt segs.json [out=../src/words.json]  (SP: произношение чисел/аббревиатур — дополнять)
import json,re,sys
words=[w for w in open(sys.argv[1]).read().split() if w!='—']
SP={'10':2,'2026':8,'120':5,'сша':3,'ии':2}
def syl(w):
    b=re.sub(r'[.,:?!«»]','',w.lower())
    if b in SP: return SP[b]
    return max(1,len(re.findall('[аеёиоуыэюя]',b)))
P=lambda w: bool(re.search(r'[.,:?!»]$',w))
weights=[syl(w)+0.35+(0.3 if P(w) else 0) for w in words]
if len(sys.argv)>2:
    m=json.load(open(sys.argv[2])); segs=[];t=0
    for a,b in m: d=(b-a)/1.2; segs.append((t,t+d)); t+=d
else:
    m=None; t=sum(syl(w) for w in words)/7.6; segs=[(0,t)]
T=t; tot=sum(weights); bounds=[0];c=0
for w in weights: c+=w; bounds.append(c/tot*T)
anchors=[(0,0.0),(len(words),T)]
if m:
    for i in range(len(m)-1):
        gap=m[i+1][0]-m[i][1]
        if min(m[i][1]-m[i][0],m[i+1][1]-m[i+1][0])<0.4 or gap<0.25: continue
        st=segs[i][1]
        d,k=min((abs(bounds[k]-st),k) for k in range(1,len(words)) if P(words[k-1]))
        if d<1.2: anchors.append((k,st))
anchors=sorted(anchors); a2=[anchors[0]]
for k,tt in anchors[1:]:
    if k>a2[-1][0] and tt>a2[-1][1]: a2.append((k,tt))
def warp(k):
    for (k0,t0),(k1,t1) in zip(a2,a2[1:]):
        if k0<=k<=k1: return t0+(bounds[k]-bounds[k0])/(bounds[k1]-bounds[k0])*(t1-t0)
out=[{'w':w,'s':round(warp(i),3),'e':round(warp(i+1),3)} for i,w in enumerate(words)]
json.dump(out,open(sys.argv[3] if len(sys.argv)>3 else '../src/words.json','w'),ensure_ascii=False)
print('T',round(T,2),'anchors',[(words[k-1] if k else '^',round(t,2)) for k,t in a2])
