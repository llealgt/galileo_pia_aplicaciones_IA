import io, math
p='index.html'; s=io.open(p,encoding='utf-8').read()
C = dict(fg='#ece6d0', dim='#8a86a0', blue='#58C4DD', yel='#FFFF00', grn='#83C167',
         red='#FC6255', org='#FF862F', pur='#9A72AC', teal='#5CD0B3', pink='#E48BB0')

def svg(inner, vb="0 0 760 120", mh=126):
    return ('    <div style="text-align:center; margin:0.3em 0;">\n      <svg viewBox="' + vb +
            '" style="width:100%; max-width:760px; max-height:' + str(mh) + 'px;" role="img">\n'
            + inner + '\n      </svg>\n    </div>\n')

def caja(x,y,w,h,col,txt,fs=13,sub=None,op=0.16,dash=False):
    da=' stroke-dasharray="5 4"' if dash else ''
    r=('<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="%s" fill-opacity="%s" stroke="%s" stroke-width="1.4"%s/>'
       %(x,y,w,h,col,op,col,da))
    dy=0 if not sub else -5
    r+=('<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="%s" font-family="Lora,serif" dominant-baseline="middle">%s</text>'
        %(x+w/2,y+h/2+dy,C['fg'],fs,txt))
    if sub: r+=('<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="10.5" font-family="Fira Code,monospace">%s</text>'
                %(x+w/2,y+h/2+13,C['dim'],sub))
    return r

def flecha(x1,y,x2,col=None,lab=''):
    col=col or C['dim']
    r=('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1.6"/><polygon points="%d,%d %d,%s %d,%s" fill="%s"/>'
       %(x1,y,x2-7,y,col,x2,y,x2-8,y-4.5,x2-8,y+4.5,col))
    if lab: r+=('<text x="%d" y="%d" text-anchor="middle" fill="%s" font-size="10" font-family="Fira Code,monospace">%s</text>'
                %((x1+x2)/2,y-8,col,lab))
    return r

def nota(txt, y=124, col=None):
    return ('<text x="380" y="%d" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">%s</text>'
            %(y, col or C['yel'], txt))

P={}
# ================= SECCION 13 · RAG =================
P['Dos Preguntas Muy Distintas']=svg(
    caja(30,26,320,58,C['grn'],'«¿por qué el cielo es azul?»',12.5,'está en el modelo')
   +caja(410,26,320,58,C['red'],'«¿cuántos días me quedan?»',12.5,'no puede estar')
   +'<text x="190" y="106" text-anchor="middle" fill="%s" font-size="11.5" font-family="Fira Code,monospace">conocimiento del mundo</text>'%C['grn']
   +'<text x="570" y="106" text-anchor="middle" fill="%s" font-size="11.5" font-family="Fira Code,monospace">datos tuyos, privados y de hoy</text>'%C['red'],
    "0 0 760 114",118)

P['Lo que un LLM Sabe y lo que No']=svg(
    '<line x1="40" y1="70" x2="720" y2="70" stroke="%s" stroke-width="1.5"/>'%C['dim']
   +'<line x1="470" y1="30" x2="470" y2="96" stroke="%s" stroke-width="2" stroke-dasharray="5 4"/>'%C['yel']
   +'<rect x="40" y="52" width="430" height="18" fill="%s" fill-opacity="0.30"/>'%C['grn']
   +'<text x="255" y="46" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">lo que estaba en el corpus</text>'%C['grn']
   +'<text x="470" y="22" text-anchor="middle" fill="%s" font-size="11.5" font-family="Fira Code,monospace">fecha de corte</text>'%C['yel']
   +'<text x="600" y="46" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">lo que pasó después</text>'%C['red']
   +'<text x="600" y="88" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">y lo privado, de cualquier fecha</text>'%C['red']
   +nota('el modelo no sabe dónde está esa línea: contesta igual a los dos lados',112),
    "0 0 760 120",124)

P['La Respuesta: ¡Ponlo en el Prompt!']=svg(
    caja(20,20,150,44,C['blue'],'instrucción',12)
   +caja(20,72,150,44,C['grn'],'contexto',12,'lo recuperado')
   +caja(20,124,150,44,C['org'],'la pregunta',12)
   +'<path d="M180 42 Q 240 42 240 90" fill="none" stroke="%s" stroke-width="1.4"/>'%C['dim']
   +'<path d="M180 94 L 240 94" fill="none" stroke="%s" stroke-width="1.4"/>'%C['dim']
   +'<path d="M180 146 Q 240 146 240 98" fill="none" stroke="%s" stroke-width="1.4"/>'%C['dim']
   +flecha(240,94,300)
   +caja(300,60,180,68,C['yel'],'un solo texto',13,'el prompt final')
   +flecha(480,94,540)
   +caja(540,60,200,68,C['pur'],'el LLM',13,'lee y responde')
   +'<text x="380" y="176" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">no se reentrena nada: se le cambia lo que tiene delante</text>'%C['yel'],
    "0 0 760 186",166)

P['El Retriever y la Base de Conocimiento']=svg(
    caja(16,44,132,50,C['org'],'consulta',12)
   +flecha(148,69,204)
   +caja(204,44,150,50,C['blue'],'retriever',12,'busca')
   +'<path d="M279 94 L279 116" stroke="%s" stroke-width="1.4"/>'%C['dim']
   +'<ellipse cx="279" cy="128" rx="62" ry="12" fill="%s" fill-opacity="0.22" stroke="%s"/>'%(C['teal'],C['teal'])
   +'<text x="279" y="132" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">tus documentos</text>'%C['teal']
   +flecha(354,69,410,C['grn'],'top-k')
   +caja(410,44,150,50,C['grn'],'contexto',12)
   +flecha(560,69,616)
   +caja(616,44,130,50,C['pur'],'LLM',12)
   +'<text x="380" y="158" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">el retriever no entiende la pregunta: sólo trae lo que se le parece</text>'%C['yel'],
    "0 0 760 168",158)

vent=[('sin RAG','inventa',C['red'],0.55),('con RAG','cita la fuente',C['grn'],0.95)]
inner=''
for i,(t,sub,col,v) in enumerate(vent):
    y=22+i*46
    inner+=('<text x="120" y="%d" text-anchor="end" fill="%s" font-size="13" font-family="Lora,serif">%s</text>'%(y+16,C['fg'],t))
    inner+=('<rect x="132" y="%d" width="%.0f" height="26" rx="4" fill="%s" fill-opacity="0.45"/>'%(y,v*560,col))
    inner+=('<text x="%.0f" y="%d" fill="%s" font-size="11.5" font-family="Fira Code,monospace">%s</text>'%(132+v*560+10,y+18,col,sub))
inner+=('<text x="132" y="126" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">'
        'y las cuatro ventajas: se actualiza sin reentrenar, cita, se audita y se puede borrar un dato</text>'%C['yel'])
P['Ventajas de RAG']=svg(inner,"0 0 760 134",128)

P['Dónde se Guarda la Base de Conocimiento']=svg(
    caja(30,30,200,60,C['teal'],'base vectorial',12,'los embeddings')
   +caja(280,30,200,60,C['blue'],'el documento',12,'texto original')
   +caja(530,30,200,60,C['org'],'la metadata',12,'fecha, autor, permisos')
   +'<text x="380" y="112" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">los tres viajan juntos: sin el texto no hay qué citar, sin metadata no hay cómo filtrar</text>'%C['yel'],
    "0 0 760 120",122)

# ================= SECCION 14 · Recuperacion =================
P['El Trabajo Sucio del Retriever']=svg(
    caja(20,34,150,52,C['org'],'la pregunta',12,'como la escriben')
   +flecha(170,60,224)
   +caja(224,34,150,52,C['blue'],'limpiar',12,'y reescribir')
   +flecha(374,60,428)
   +caja(428,34,150,52,C['grn'],'buscar',12,'léxica + semántica')
   +flecha(578,60,632)
   +caja(632,34,110,52,C['pur'],'ordenar',12)
   +nota('el LLM se lleva el crédito; el 90 % del trabajo pasa aquí',112),
    "0 0 760 120",122)

tec=[('metadata','filtra por campos',C['org']),('palabras clave','coincidencia exacta',C['blue']),('semántica','parecido de sentido',C['grn'])]
inner=''
for i,(t,sub,col) in enumerate(tec):
    x=20+i*250
    inner+=caja(x,26,230,56,col,t,13,sub)
inner+=('<text x="380" y="104" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">'
        'no compiten: en producción se usan las tres a la vez</text>'%C['yel'])
P['Tres Técnicas, no Una']=svg(inner,"0 0 760 112",116)

P['Búsqueda por Palabras Clave']=svg(
    '<text x="380" y="20" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">«pizza sin horno»</text>'%C['yel']
   +caja(60,36,290,50,C['grn'],'contiene «pizza» y «horno»',11.5,'coincide')
   +caja(410,36,290,50,C['red'],'«masa al sartén»',11.5,'no coincide, aunque sirva')
   +nota('rápida, exacta y explicable — y ciega a los sinónimos',110),
    "0 0 760 118",120)

pal=['hacer','pizza','sin','horno']
inner=('<text x="30" y="20" fill="%s" font-size="12" font-family="Fira Code,monospace">«cómo hacer pizza sin horno»</text>'%C['fg'])
for i,w in enumerate(pal):
    x=30+i*96
    inner+=('<rect x="%d" y="32" width="86" height="26" rx="4" fill="%s" fill-opacity="0.18" stroke="%s"/>'
            '<text x="%d" y="49" text-anchor="middle" fill="%s" font-size="12" font-family="Fira Code,monospace">%s</text>'
            %(x,C['blue'],C['blue'],x+43,C['fg'],w))
inner+=flecha(430,45,486)
inner+=('<rect x="496" y="24" width="240" height="46" rx="8" fill="%s" fill-opacity="0.14" stroke="%s" stroke-dasharray="5 4"/>'
        '<text x="616" y="44" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">una bolsa, sin orden</text>'
        '<text x="616" y="60" text-anchor="middle" fill="%s" font-size="10.5" font-family="Fira Code,monospace">{horno, pizza, sin, hacer}</text>'
        %(C['org'],C['org'],C['fg'],C['dim']))
inner+=('<text x="30" y="96" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">'
        '«pizza sin horno» y «horno sin pizza» son la MISMA bolsa</text>'%C['yel'])
P['Bolsa de Palabras']=svg(inner,"0 0 760 104",110)

P['El Costo Escondido: el Ground Truth']=svg(
    caja(40,30,300,56,C['blue'],'consultas de prueba',12,'las escribes tú')
   +'<text x="360" y="62" text-anchor="middle" fill="%s" font-size="18">+</text>'%C['dim']
   +caja(380,30,340,56,C['org'],'cuál documento es el correcto',12,'una persona lo decide')
   +nota('sin esto no puedes medir nada — y es lo primero que nadie quiere hacer',110),
    "0 0 760 118",120)

n=0
for t,b in P.items():
    a='<h2>'+t+'</h2>\n'
    if s.count(a)!=1: print('  !! %s: %d'%(t,s.count(a))); continue
    s=s.replace(a,a+b); n+=1
io.open(p,'w',encoding='utf-8').write(s)
print('insertados: %d/%d'%(n,len(P)))
