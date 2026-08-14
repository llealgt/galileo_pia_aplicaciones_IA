import io
p='index.html'; s=io.open(p,encoding='utf-8').read()
C = dict(fg='#ece6d0', dim='#8a86a0', blue='#58C4DD', yel='#FFFF00', grn='#83C167',
         red='#FC6255', org='#FF862F', pur='#9A72AC', teal='#5CD0B3', pink='#E48BB0')
def svg(i,vb="0 0 760 120",mh=126):
    return ('    <div style="text-align:center; margin:0.3em 0;">\n      <svg viewBox="'+vb+
            '" style="width:100%; max-width:760px; max-height:'+str(mh)+'px;" role="img">\n'+i+'\n      </svg>\n    </div>\n')
def caja(x,y,w,h,col,txt,fs=13,sub=None,op=0.16,dash=False):
    da=' stroke-dasharray="5 4"' if dash else ''
    r='<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="%s" fill-opacity="%s" stroke="%s" stroke-width="1.4"%s/>'%(x,y,w,h,col,op,col,da)
    dy=0 if not sub else -5
    r+='<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="%s" font-family="Lora,serif" dominant-baseline="middle">%s</text>'%(x+w/2,y+h/2+dy,C['fg'],fs,txt)
    if sub: r+='<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="10.5" font-family="Fira Code,monospace">%s</text>'%(x+w/2,y+h/2+13,C['dim'],sub)
    return r
def flecha(x1,y,x2,col=None,lab=''):
    col=col or C['dim']
    r='<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1.6"/><polygon points="%d,%d %d,%s %d,%s" fill="%s"/>'%(x1,y,x2-7,y,col,x2,y,x2-8,y-4.5,x2-8,y+4.5,col)
    if lab: r+='<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="10" font-family="Fira Code,monospace">%s</text>'%((x1+x2)/2,y-8,col,lab)
    return r
def nota(t,y=112,col=None):
    return '<text x="380" y="%d" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">%s</text>'%(y,col or C['yel'],t)
P={}

# ---------- 15 ----------
tm=[('ANN','buscar rápido',C['blue']),('base vectorial','dónde guardar',C['teal']),
    ('chunking','en qué trozos',C['grn']),('consulta','cómo preguntar',C['org'])]
inner=''
for i,(t,sub,col) in enumerate(tm):
    inner+=caja(20+i*186,28,168,54,col,t,12.5,sub)
P['Los Cuatro Temas']=svg(inner+nota('los cuatro pasan ANTES de que el LLM vea nada',104),"0 0 760 112",116)

P['ANN: Lo que Hay que Llevarse']=svg(
    '<text x="120" y="24" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">exacto</text>'%C['red']
   +'<rect x="30" y="34" width="180" height="24" rx="4" fill="%s" fill-opacity="0.4"/>'%C['red']
   +'<text x="120" y="72" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">100 %% de recall</text>'%C['dim']
   +'<text x="120" y="88" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">lentísimo</text>'%C['dim']
   +'<text x="560" y="24" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">aproximado</text>'%C['grn']
   +'<rect x="470" y="34" width="180" height="24" rx="4" fill="%s" fill-opacity="0.4"/>'%C['grn']
   +'<text x="560" y="72" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">~95 %% de recall</text>'%C['dim']
   +'<text x="560" y="88" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">cientos de veces más rápido</text>'%C['dim']
   +'<text x="340" y="52" text-anchor="middle" fill="%s" font-size="20">→</text>'%C['yel']
   +nota('cambias un 5 % de aciertos por dos órdenes de magnitud de velocidad',110),
    "0 0 760 118",120)

P['El Prompt que Llega no Sirve para Buscar']=svg(
    caja(20,26,330,60,C['red'],'«oye, ¿y lo de las vacaciones qué?»',11.5,'lo que escribe el usuario')
   +flecha(350,56,406,C['yel'],'reescribir')
   +caja(406,26,330,60,C['grn'],'política de vacaciones, días anuales',11.5,'lo que sirve para buscar')
   +nota('el usuario no escribe para un buscador: escribe para una persona',108),
    "0 0 760 116",118)

P['Reescritura: un Ejemplo Real']=svg(
    '<text x="30" y="22" fill="%s" font-size="11" font-family="Fira Code,monospace">turno 1</text>'%C['dim']
   +caja(30,30,300,34,C['blue'],'«¿cuántos días de vacaciones tengo?»',11)
   +'<text x="30" y="86" fill="%s" font-size="11" font-family="Fira Code,monospace">turno 2</text>'%C['dim']
   +caja(30,94,300,34,C['org'],'«¿y si llevo dos años?»',11)
   +flecha(340,111,400,C['yel'])
   +caja(400,80,340,62,C['grn'],'días de vacaciones con dos años',11.5,'de antigüedad en la empresa')
   +'<text x="410" y="34" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">sin el historial, «¿y si llevo dos años?»</text>'%C['yel']
   +'<text x="410" y="50" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">no recupera absolutamente nada</text>'%C['yel'],
    "0 0 760 150",142)

P['NER: Sacar Entidades para Filtrar']=svg(
    '<text x="30" y="26" fill="%s" font-size="13" font-family="Lora,serif">«contratos de <tspan fill="%s">Acme</tspan> firmados en <tspan fill="%s">2023</tspan> por <tspan fill="%s">María Rodríguez</tspan>»</text>'%(C['fg'],C['org'],C['teal'],C['pink'])
   +caja(30,48,210,44,C['org'],'Acme',12,'ORG → filtro')
   +caja(270,48,210,44,C['teal'],'2023',12,'FECHA → filtro')
   +caja(510,48,220,44,C['pink'],'María Rodríguez',12,'PERSONA → filtro')
   +nota('lo que queda —«contratos»— es lo único que va a la búsqueda semántica',112),
    "0 0 760 120",122)

inner=''
for i in range(4):
    x=40+i*72
    inner+=('<rect x="%d" y="26" width="60" height="22" rx="3" fill="%s" fill-opacity="0.2" stroke="%s"/>'
            '<text x="%d" y="41" text-anchor="middle" fill="%s" font-size="10.5" font-family="Fira Code,monospace">q%d</text>'%(x,C['org'],C['org'],x+30,C['org'],i+1))
for j in range(5):
    x=380+j*72
    inner+=('<rect x="%d" y="26" width="60" height="22" rx="3" fill="%s" fill-opacity="0.2" stroke="%s"/>'
            '<text x="%d" y="41" text-anchor="middle" fill="%s" font-size="10.5" font-family="Fira Code,monospace">d%d</text>'%(x,C['blue'],C['blue'],x+30,C['blue'],j+1))
inner+=('<text x="160" y="18" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">consulta: un vector por token</text>'%C['org']
       +'<text x="524" y="18" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">documento: un vector por token</text>'%C['blue'])
for i,j in [(0,1),(1,3),(2,0),(3,4)]:
    inner+='<line x1="%d" y1="52" x2="%d" y2="52" stroke="%s" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6"/>'%(70+i*72,410+j*72,C['grn'])
inner+=('<text x="380" y="80" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">cada token de la consulta busca su mejor pareja: <tspan font-family="Fira Code,monospace">MaxSim</tspan></text>'%C['grn']
       +'<text x="380" y="102" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">precisión de cross-encoder a un costo más cercano al bi-encoder… si aguantas el índice</text>'%C['yel'])
P['ColBERT: un Vector por Token']=svg(inner,"0 0 760 110",114)

inner=''
for i in range(10):
    x=40+i*70
    dentro = i<6
    col = C['grn'] if dentro else C['red']
    inner+='<rect x="%d" y="34" width="58" height="26" rx="4" fill="%s" fill-opacity="%s" stroke="%s"/>'%(x,col,'0.3' if dentro else '0.12',col)
inner+=('<text x="40" y="24" fill="%s" font-size="11" font-family="Fira Code,monospace">etapa 1 devuelve 6 relevantes de 10</text>'%C['grn']
       +'<text x="40" y="80" fill="%s" font-size="12" font-family="Lora,serif">el reranker puede reordenar estos 10…</text>'%C['fg']
       +'<text x="40" y="100" fill="%s" font-size="12" font-family="Lora,serif">…pero <tspan fill="%s">no puede inventar el que la etapa 1 no trajo</tspan></text>'%(C['fg'],C['red'])
       +nota('el techo del reranking es el recall de la primera etapa',124))
P['El Límite del Reranking']=svg(inner,"0 0 760 132",134)

# ---------- 16 ----------
tm=[('el transformer','cómo funciona por dentro',C['blue']),('el muestreo','cómo elige cada token',C['org']),
    ('el prompt','cómo se le habla',C['grn']),('la evaluación','cómo se sabe si sirve',C['pur'])]
inner=''
for i,(t,sub,col) in enumerate(tm):
    inner+=caja(20+i*186,28,168,54,col,t,12,sub)
P['Qué Vamos a Ver']=svg(inner+nota('de adentro hacia afuera',104),"0 0 760 112",116)

probs=[('París',0.62),('Lyon',0.11),('Marsella',0.07),('la',0.05),('una',0.03),('…',0.12)]
inner='<text x="30" y="18" fill="%s" font-size="11" font-family="Fira Code,monospace">un número por cada token del vocabulario (151 000 de ellos)</text>'%C['dim']
for i,(t,v) in enumerate(probs):
    y=28+i*17
    col = C['yel'] if i==0 else C['blue']
    inner+=('<text x="120" y="%d" text-anchor="end" fill="%s" font-size="11.5" font-family="Fira Code,monospace">%s</text>'%(y+11,C['fg'] if i==0 else C['dim'],t)
           +'<rect x="130" y="%d" width="%.0f" height="12" rx="2" fill="%s" fill-opacity="0.5"/>'%(y+1,v*520,col)
           +'<text x="%.0f" y="%d" fill="%s" font-size="11" font-family="Fira Code,monospace">%.2f</text>'%(130+v*520+8,y+11,C['dim'],v))
inner+=nota('el modelo no elige: produce una distribución. Elegir es el paso siguiente',128)
P['Y al Final: la Distribución']=svg(inner,"0 0 760 136",138)

P['Por Qué RAG Funciona']=svg(
    caja(20,30,330,58,C['red'],'sin contexto',12,'la distribución se reparte')
   +caja(410,30,330,58,C['grn'],'con contexto',12,'la masa se concentra en la respuesta')
   +'<text x="380" y="64" text-anchor="middle" fill="%s" font-size="20">→</text>'%C['yel']
   +nota('RAG no vuelve humilde al modelo: cambia lo que tiene delante',110),
    "0 0 760 118",120)

inner='<text x="30" y="18" fill="%s" font-size="11" font-family="Fira Code,monospace">siempre la barra más alta, paso tras paso</text>'%C['dim']
for i in range(5):
    x=40+i*140
    inner+=('<rect x="%d" y="30" width="34" height="46" rx="3" fill="%s" fill-opacity="0.5"/>'%(x,C['yel'])
           +'<rect x="%d" y="52" width="34" height="24" rx="3" fill="%s" fill-opacity="0.25"/>'%(x+40,C['blue'])
           +'<rect x="%d" y="62" width="34" height="14" rx="3" fill="%s" fill-opacity="0.2"/>'%(x+80,C['blue']))
    if i<4: inner+=flecha(x+118,53,x+140)
inner+=('<text x="30" y="96" fill="%s" font-size="12" font-family="Lora,serif">nunca explora la segunda opción — por eso repite y da vueltas</text>'%C['fg']
       +nota('mismo prompt, misma respeusta siempre: útil para reproducir, malo para escribir',118))
P['Greedy: Siempre el Más Probable']=svg(inner.replace('respeusta','respuesta'),"0 0 760 126",128)

P['El System Prompt']=svg(
    caja(60,26,640,30,C['pur'],'system  ·  quién eres y qué NO debes hacer',12,op=0.22)
   +caja(60,62,640,30,C['blue'],'user  ·  lo que escribe la persona',12,op=0.16)
   +caja(60,98,640,30,C['grn'],'assistant  ·  lo que respondes',12,op=0.16)
   +'<text x="380" y="146" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">para el modelo los tres son el mismo texto: la separación es una convención</text>'%C['yel'],
    "0 0 760 154",146)

P['Modelos de Razonamiento']=svg(
    caja(20,34,200,52,C['blue'],'pregunta',12)
   +flecha(220,60,272)
   +caja(272,34,220,52,C['dim'],'tokens de pensamiento',11.5,'que no ves y sí pagas')
   +flecha(492,60,544)
   +caja(544,34,196,52,C['grn'],'respuesta',12)
   +nota('cambias dinero y latencia por aciertos en problemas de varios pasos',110),
    "0 0 760 118",120)

n=0
for t,b in P.items():
    a='<h2>'+t+'</h2>\n'
    if s.count(a)!=1: print('  !! %s: %d'%(t,s.count(a))); continue
    s=s.replace(a,a+b); n+=1
io.open(p,'w',encoding='utf-8').write(s)
print('insertados: %d/%d'%(n,len(P)))
