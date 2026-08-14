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
def nota(t,y=108,col=None):
    return '<text x="380" y="%d" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">%s</text>'%(y,col or C['yel'],t)
P={}

P['Patrones Estadísticos, no Conocimiento']=svg(
    caja(20,26,340,60,C['red'],'lo que NO hay dentro',12,'hechos guardados en una tabla')
   +caja(400,26,340,60,C['grn'],'lo que SÍ hay',12,'qué tan probable es cada continuación')
   +nota('el modelo no consulta: reconstruye. Por eso a veces reconstruye mal',106),
    "0 0 760 114",116)

P['Respuestas Probables, no Correctas']=svg(
    '<text x="30" y="22" fill="%s" font-size="12" font-family="Fira Code,monospace">el objetivo con el que se entrenó</text>'%C['dim']
   +caja(30,32,320,44,C['grn'],'que el texto suene probable',12)
   +'<text x="410" y="22" fill="%s" font-size="12" font-family="Fira Code,monospace">lo que tú esperas</text>'%C['dim']
   +caja(410,32,320,44,C['yel'],'que el texto sea correcto',12)
   +'<text x="380" y="98" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">coinciden casi siempre — y cuando no, no hay nada que avise</text>'%C['fg']
   +nota('nadie optimizó la verdad: se optimizó el parecido con el corpus',118),
    "0 0 760 126",128)

P['Cómo Aprenden']=svg(
    caja(16,34,180,52,C['blue'],'texto de internet',11.5,'sin etiquetar')
   +flecha(196,60,246)
   +caja(246,34,190,52,C['grn'],'tapar una palabra',11.5,'y adivinarla')
   +flecha(436,60,486)
   +caja(486,34,120,52,C['org'],'error',11.5)
   +flecha(606,60,656)
   +caja(656,34,88,52,C['pur'],'ajuste',11.5)
   +'<path d="M700 86 L700 104 L120 104 L120 88" fill="none" stroke="%s" stroke-width="1.4" stroke-dasharray="4 4"/>'%C['dim']
   +'<polygon points="120,82 115.5,91 124.5,91" fill="%s"/>'%C['dim']
   +'<text x="410" y="118" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">billones de veces. La etiqueta la pone el propio texto</text>'%C['yel'],
    "0 0 760 126",128)

P['¿Cuánto es 1 + 1?']=svg(
    '<text x="30" y="20" fill="%s" font-size="11" font-family="Fira Code,monospace">lo que el modelo calcula: qué token sigue a «1 + 1 =»</text>'%C['dim']
   +'<rect x="30" y="30" width="520" height="22" rx="3" fill="%s" fill-opacity="0.5"/>'%C['grn']
   +'<text x="560" y="46" fill="%s" font-size="12" font-family="Fira Code,monospace">«2»</text>'%C['grn']
   +'<rect x="30" y="58" width="70" height="22" rx="3" fill="%s" fill-opacity="0.4"/>'%C['org']
   +'<text x="110" y="74" fill="%s" font-size="12" font-family="Fira Code,monospace">«10»  (en base binaria)</text>'%C['org']
   +'<rect x="30" y="86" width="26" height="22" rx="3" fill="%s" fill-opacity="0.4"/>'%C['red']
   +'<text x="66" y="102" fill="%s" font-size="12" font-family="Fira Code,monospace">«3», «11», «ventana»…</text>'%C['red']
   +nota('sale «2» porque es lo más frecuente en el corpus, no porque lo haya sumado',126),
    "0 0 760 134",136)

P['Por Qué el Corpus No Siempre Dice "2"']=svg(
    caja(16,30,232,56,C['org'],'datos incorrectos',11.5,'errores que nadie corrigió')
   +caja(264,30,232,56,C['red'],'contaminación deliberada',11.5,'escrito para envenenar')
   +caja(512,30,232,56,C['blue'],'contexto distinto',11.5,'un blog sobre base binaria')
   +nota('el corpus es internet: lo correcto y lo incorrecto entraron juntos',108),
    "0 0 760 116",118)

P['Cuándo Sirve y Cuándo No']=svg(
    caja(20,26,340,64,C['grn'],'transformar texto que le das',12,'resumir, clasificar, reescribir')
   +caja(400,26,340,64,C['red'],'ser la fuente del dato',12,'cifras, fechas, políticas internas')
   +nota('la frontera no es la dificultad de la tarea: es de dónde sale el dato',110),
    "0 0 760 118",120)

esc=[('GPT-1',6),('GPT-2',16),('GPT-3',48),('GPT-4',88)]
inner='<text x="30" y="18" fill="%s" font-size="11" font-family="Fira Code,monospace">acierto en una tarea de varios pasos</text>'%C['dim']
for i,(t,v) in enumerate(esc):
    x=90+i*160
    h=v*0.9
    col = C['red'] if v<20 else (C['org'] if v<60 else C['grn'])
    inner+=('<rect x="%d" y="%.0f" width="70" height="%.0f" rx="3" fill="%s" fill-opacity="0.45"/>'%(x,100-h,h,col)
           +'<text x="%d" y="114" text-anchor="middle" fill="%s" font-size="11.5" font-family="Fira Code,monospace">%s</text>'%(x+35,C['dim'],t)
           +'<text x="%d" y="%.0f" text-anchor="middle" fill="%s" font-size="11" font-family="Fira Code,monospace">%d %%</text>'%(x+35,96-h,col,v))
inner+='<text x="380" y="132" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">la curva del tamaño es suave; la de la capacidad, un escalón — y nadie sabe dónde cae</text>'%C['yel']
P['2. Pero <em>Qué</em> Capacidades Aparecen, No']=svg(inner,"0 0 760 140",130)

P['6. El Nivel Humano No es un Techo']=svg(
    '<line x1="40" y1="88" x2="720" y2="88" stroke="%s" stroke-width="1"/>'%C['dim']
   +'<line x1="40" y1="52" x2="720" y2="52" stroke="%s" stroke-width="1.6" stroke-dasharray="6 4"/>'%C['yel']
   +'<text x="726" y="56" text-anchor="end" fill="%s" font-size="11" font-family="Fira Code,monospace">nivel humano</text>'%C['yel']
   +'<polyline points="40,86 160,80 280,70 400,56 520,40 640,26 720,20" fill="none" stroke="%s" stroke-width="2.2"/>'%C['grn']
   +'<text x="380" y="112" text-anchor="middle" fill="%s" font-size="12" font-family="Lora,serif">nada en el entrenamiento se detiene ahí: el texto humano es el punto de partida, no la meta</text>'%C['fg'],
    "0 0 760 120",122)

n=0
for t,b in P.items():
    a='<h2>'+t+'</h2>\n'
    if s.count(a)!=1: print('  !! %s: %d'%(t,s.count(a))); continue
    s=s.replace(a,a+b); n+=1
io.open(p,'w',encoding='utf-8').write(s)
print('insertados: %d/%d'%(n,len(P)))
