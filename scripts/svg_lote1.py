import io, re, math
p='index.html'; s=io.open(p,encoding='utf-8').read()

C = dict(bg='#1b1b2f', fg='#ece6d0', dim='#8a86a0', blue='#58C4DD', yel='#FFFF00',
         grn='#83C167', red='#FC6255', org='#FF862F', pur='#9A72AC', teal='#5CD0B3')

def svg(inner, vb="0 0 760 120", mh=126):
    return ('    <div style="text-align:center; margin:0.3em 0;">\n'
            '      <svg viewBox="' + vb + '" style="width:100%; max-width:760px; max-height:'
            + str(mh) + 'px;" role="img">\n' + inner + '\n      </svg>\n    </div>\n')

def caja(x,y,w,h,col,txt,fs=13,sub=None,op=0.16,dash=False):
    da = ' stroke-dasharray="5 4"' if dash else ''
    r = ('<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="%s" fill-opacity="%s" '
         'stroke="%s" stroke-width="1.4"%s/>' % (x,y,w,h,col,op,col,da))
    dy = 0 if not sub else -5
    t = ('<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="%s" '
         'font-family="Lora,serif" dominant-baseline="middle">%s</text>'
         % (x+w/2, y+h/2+dy, C['fg'], fs, txt))
    if sub:
        t += ('<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="10.5" '
              'font-family="Fira Code,monospace">%s</text>' % (x+w/2, y+h/2+13, C['dim'], sub))
    return r+t

def flecha(x1,y,x2,col=None,lab=''):
    col = col or C['dim']
    r=('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1.6"/>'
       '<polygon points="%d,%d %d,%d %d,%d" fill="%s"/>'
       % (x1,y,x2-7,y,col, x2,y, x2-8,y-4.5, x2-8,y+4.5, col))
    if lab:
        r+=('<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="10" '
            'font-family="Fira Code,monospace">%s</text>' % ((x1+x2)/2, y-8, col, lab))
    return r

P = {}

etapas=[('prototipo','funciona en tu laptop',C['blue']),('usuarios reales','preguntan raro',C['teal']),
        ('escala','millones de docs',C['grn']),('dinero','se paga por token',C['org']),
        ('ataque','quieren romperlo',C['red'])]
inner=''
for i,(t,sub,col) in enumerate(etapas):
    x=8+i*150
    inner+=caja(x,26,134,54,col,t,12,sub)
    if i<4: inner+=flecha(x+134,53,x+150)
P['Cinco Cosas que Cambian']=svg(inner,"0 0 760 100",106)

pasos=[('post satírico','en un foro',C['dim'],0.10),('se indexa','nadie lo filtró',C['org'],0.14),
       ('sale 1.º','coincide muy bien',C['red'],0.20),('se cita','«según la fuente»',C['red'],0.20),
       ('respuesta','come piedras',C['red'],0.24)]
inner=('<text x="380" y="14" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" '
       'font-style="italic">ningún paso falló: cada uno hizo exactamente su trabajo</text>' % C['yel'])
for i,(t,sub,col,op) in enumerate(pasos):
    x=8+i*150
    inner+=caja(x,30,134,52,col,t,12,sub,op)
    if i<4: inner+=flecha(x+134,56,x+150, C['red'] if i>=1 else C['dim'])
P['El Caso "Cómete unas Piedras"']=svg(inner,"0 0 760 96",104)

tramos=[('recuperar',40,C['grn']),('rerank',90,C['teal']),('armar prompt',12,C['blue']),('generar',1400,C['red'])]
tot=sum(t[1] for t in tramos); x=150
inner=('<text x="8" y="16" fill="%s" font-size="11" font-family="Fira Code,monospace">'
       'una consulta, etapa por etapa</text>' % C['dim'])
for i,(t,ms,col) in enumerate(tramos):
    w=max(14,(ms/tot)*560); y=28+i*22
    inner+=('<rect x="%d" y="%d" width="%.1f" height="15" rx="3" fill="%s" fill-opacity="0.55"/>'
            '<text x="%d" y="%d" text-anchor="end" fill="%s" font-size="11.5" font-family="Lora,serif">%s</text>'
            '<text x="%.1f" y="%d" fill="%s" font-size="11" font-family="Fira Code,monospace">%d ms</text>'
            % (x,y,w,col, x-8,y+12,C['fg'],t, x+w+7,y+12,C['dim'],ms))
inner+=('<text x="150" y="126" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">'
        'sin la traza sólo ves «tardó %.1f s» y no dónde</text>' % (C['yel'], tot/1000))
P['Trazas: Seguir un Prompt']=svg(inner,"0 0 760 134",136)

vals=[0.42,-0.17,0.88,-0.03,-0.61,0.25,0.07,-0.44]
inner=('<text x="8" y="14" fill="%s" font-size="11" font-family="Fira Code,monospace">'
       'float32 · 4 bytes cada uno</text>' % C['dim'])
for i,v in enumerate(vals):
    x=8+i*94
    b = 1 if v>0 else 0
    col = C['grn'] if b else C['red']
    inner+=('<rect x="%d" y="22" width="86" height="26" rx="4" fill="%s" fill-opacity="0.16" stroke="%s" stroke-width="1"/>'
            '<text x="%d" y="39" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">%+.2f</text>'
            '<line x1="%d" y1="52" x2="%d" y2="64" stroke="%s" stroke-width="1.4"/>'
            '<polygon points="%d,68 %.1f,60 %.1f,60" fill="%s"/>'
            '<rect x="%d" y="74" width="32" height="26" rx="4" fill="%s" fill-opacity="0.22" stroke="%s" stroke-width="1.2"/>'
            '<text x="%d" y="91" text-anchor="middle" fill="%s" font-size="13" font-family="Fira Code,monospace" font-weight="bold">%d</text>'
            % (x,C['blue'],C['blue'], x+43,C['fg'],v, x+43,x+43,C['dim'], x+43,x+38.5,x+47.5,C['dim'],
               x+27,col,col, x+43,col,b))
inner+=('<text x="8" y="116" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">'
        'sólo el signo: 32 veces menos espacio, y la dirección se conserva</text>' % C['yel'])
P['Un Bit: el Extremo']=svg(inner,"0 0 760 124",130)

dims=[(1024,C['blue']),(512,C['teal']),(256,C['grn']),(128,C['org']),(64,C['red'])]
inner=''
for i,(d,col) in enumerate(dims):
    w=640*(d/1024.0); y=12+i*20
    inner+=('<rect x="30" y="%d" width="%.1f" height="15" rx="3" fill="%s" fill-opacity="0.4"/>'
            '<text x="%.1f" y="%d" fill="%s" font-size="11.5" font-family="Fira Code,monospace">%d dim</text>'
            % (y,w,col, 30+w+8,y+12,col,d))
inner+=('<text x="30" y="124" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">'
        'cada prefijo sigue siendo un vector válido — pero sólo si el modelo se entrenó así</text>' % C['yel'])
P['Matryoshka: Cortar Dimensiones']=svg(inner,"0 0 760 132",134)

pts=' '.join('%d,%.1f' % (40+i*68, 110-0.95**i*90) for i in range(11))
pts2=' '.join('%d,%.1f' % (40+i*68, 110-0.99**i*90) for i in range(11))
inner=('<line x1="40" y1="110" x2="720" y2="110" stroke="%s" stroke-width="1" opacity="0.5"/>'
       '<line x1="40" y1="16" x2="40" y2="110" stroke="%s" stroke-width="1" opacity="0.5"/>'
       '<polyline points="%s" fill="none" stroke="%s" stroke-width="2"/>'
       '<polyline points="%s" fill="none" stroke="%s" stroke-width="2.2"/>'
       '<text x="40" y="124" fill="%s" font-size="10.5" font-family="Fira Code,monospace">0 etapas</text>'
       '<text x="720" y="124" text-anchor="end" fill="%s" font-size="10.5" font-family="Fira Code,monospace">10</text>'
       '<text x="32" y="22" text-anchor="end" fill="%s" font-size="10.5" font-family="Fira Code,monospace">100%%</text>'
       '<text x="560" y="30" fill="%s" font-size="12" font-family="Fira Code,monospace">0.99ⁿ → 90%%</text>'
       '<text x="560" y="96" fill="%s" font-size="12" font-family="Fira Code,monospace">0.95ⁿ → 60%%</text>'
       % (C['dim'],C['dim'], pts2,C['grn'], pts,C['red'], C['dim'],C['dim'],C['dim'],C['grn'],C['red']))
P['La Factura: la Fiabilidad se Multiplica']=svg(inner,"0 0 760 130",132)

inner=('<circle cx="180" cy="62" r="46" fill="%s" fill-opacity="0.13" stroke="%s" stroke-dasharray="4 4"/>'
       '<circle cx="560" cy="62" r="46" fill="%s" fill-opacity="0.13" stroke="%s" stroke-dasharray="4 4"/>'
       '<text x="180" y="16" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">documentos en inglés</text>'
       '<text x="560" y="16" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">consulta en español</text>'
       '<circle cx="168" cy="54" r="5" fill="%s"/><circle cx="196" cy="72" r="5" fill="%s"/>'
       '<circle cx="176" cy="80" r="5" fill="%s"/><circle cx="560" cy="62" r="6.5" fill="%s"/>'
       '<line x1="228" y1="62" x2="512" y2="62" stroke="%s" stroke-width="1.6" stroke-dasharray="6 5"/>'
       '<text x="370" y="54" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">lejos, aunque hablen de lo mismo</text>'
       '<text x="370" y="118" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">un modelo sólo-inglés no cruza el idioma: hay que usar uno multilingüe</text>'
       % (C['blue'],C['blue'], C['org'],C['org'], C['blue'],C['org'],
          C['blue'],C['blue'],C['blue'],C['yel'], C['red'], C['red'], C['yel']))
P['La Trampa del Idioma']=svg(inner,"0 0 760 126",130)

inner=(caja(20,32,150,52,C['yel'],'el LLM',13,'sólo produce texto')
      +flecha(170,58,236,C['yel'],'pide')
      +caja(236,32,170,52,C['blue'],'tu código',13,'valida y ejecuta')
      +flecha(406,58,472,C['blue'])
      +caja(472,32,150,52,C['grn'],'el mundo',13,'API, base, calculadora')
      +'<path d="M547 86 L547 106 L95 106 L95 88" fill="none" stroke="%s" stroke-width="1.5"/>' % C['grn']
      +'<polygon points="95,82 90.5,91 99.5,91" fill="%s"/>' % C['grn']
      +'<text x="321" y="102" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">vuelve como observación, en texto</text>' % C['grn'])
P['Qué es una Herramienta']=svg(inner,"0 0 760 116",122)

nodos=[('pensar',C['blue'],380,26),('actuar',C['org'],600,84),('observar',C['grn'],160,84)]
inner=''
for t,col,x,y in nodos:
    inner+=('<rect x="%d" y="%d" width="130" height="30" rx="15" fill="%s" fill-opacity="0.18" stroke="%s" stroke-width="1.4"/>'
            '<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="13" font-family="Lora,serif">%s</text>'
            % (x-65,y-15,col,col, x,y+5,col,t))
inner+=('<path d="M 448 34 Q 560 40 570 68" fill="none" stroke="%s" stroke-width="1.5"/>'
        '<polygon points="572,76 566,66 577,65" fill="%s"/>'
        '<path d="M 534 92 Q 380 122 226 92" fill="none" stroke="%s" stroke-width="1.5"/>'
        '<polygon points="220,88 231,86 226,96" fill="%s"/>'
        '<path d="M 190 68 Q 200 40 312 34" fill="none" stroke="%s" stroke-width="1.5"/>'
        '<polygon points="318,33 307,29 308,40" fill="%s"/>'
        '<text x="380" y="128" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">hasta que decide que terminó — o hasta el tope de pasos</text>'
        % (C['dim'],C['dim'],C['dim'],C['dim'],C['dim'],C['dim'],C['yel']))
P['El Bucle ReAct']=svg(inner,"0 0 760 136",138)

n=0
for titulo, bloque in P.items():
    anc = '<h2>' + titulo + '</h2>\n'
    if s.count(anc) != 1:
        print('  !! %s: %d coincidencias' % (titulo, s.count(anc))); continue
    s = s.replace(anc, anc + bloque); n += 1
io.open(p,'w',encoding='utf-8').write(s)
print('insertados: %d/%d' % (n, len(P)))
