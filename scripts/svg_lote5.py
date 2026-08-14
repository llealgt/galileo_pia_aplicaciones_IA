import io
p='index.html'; s=io.open(p,encoding='utf-8').read()
C = dict(fg='#ece6d0', dim='#8a86a0', blue='#58C4DD', yel='#FFFF00', grn='#83C167',
         red='#FC6255', org='#FF862F', pur='#9A72AC', teal='#5CD0B3', pink='#E48BB0')
def svg(i,vb="0 0 760 116",mh=118):
    return ('    <div style="text-align:center; margin:0.3em 0;">\n      <svg viewBox="'+vb+
            '" style="width:100%; max-width:760px; max-height:'+str(mh)+'px;" role="img">\n'+i+'\n      </svg>\n    </div>\n')
def caja(x,y,w,h,col,txt,fs=12.5,sub=None,op=0.16,dash=False):
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
def nota(t,y=106,col=None):
    return '<text x="380" y="%d" text-anchor="middle" fill="%s" font-size="11.5" font-family="Lora,serif" font-style="italic">%s</text>'%(y,col or C['yel'],t)
def tres(a,b,c,na='',nb='',nc='',ca=None,cb=None,cc=None,pie=''):
    return svg(caja(16,26,232,54,ca or C['blue'],a,12,na)+caja(264,26,232,54,cb or C['grn'],b,12,nb)
              +caja(512,26,232,54,cc or C['org'],c,12,nc)+(nota(pie,102) if pie else ''),"0 0 760 110",112)
def dos(a,b,na='',nb='',ca=None,cb=None,pie=''):
    return svg(caja(20,26,340,58,ca or C['red'],a,12.5,na)+caja(400,26,340,58,cb or C['grn'],b,12.5,nb)
              +(nota(pie,106) if pie else ''),"0 0 760 114",116)
P={}

# --- 11 transfer learning ---
P['El Problema de Siempre']=dos('miles de imágenes etiquetadas','245 fotos y un fin de semana',
    'lo que pide entrenar desde cero','lo que de verdad tienes',pie='transfer learning es la diferencia entre funcionar y no funcionar')
inner=''
for i,(t,sub,col) in enumerate([('bordes y color','sirve para todo',C['blue']),('texturas','casi todo',C['teal']),
                                ('partes','tu dominio',C['org']),('la clase','solo ImageNet',C['red'])]):
    x=16+i*186; inner+=caja(x,26,168,54,col,t,12,sub)
    if i<3: inner+=flecha(x+168,53,x+186)
P['Qué Aprende una Red por Capas']=svg(inner+nota('cuanto más al final, más específico — por eso se corta por ahí',104),"0 0 760 112",114)

# --- 12 LLMs ---
P['Un LLM es un Autocompletado muy Sofisticado']=svg(
    caja(20,30,300,50,C['blue'],'un texto cualquiera',12,'lo que va antes')
   +flecha(320,55,384,C['yel'],'única operación')
   +caja(384,30,180,50,C['yel'],'¿qué sigue?',12)
   +flecha(564,55,620)
   +caja(620,30,124,50,C['grn'],'un token',12)
   +nota('todo lo demás —resumir, traducir, programar— sale de repetir esto',104),
    "0 0 760 112",114)
P['Dos Corridas, Dos Respuestas']=dos('mismo prompt','mismo prompt','corrida 1','corrida 2',C['blue'],C['pur'],
    pie='no es un error: el muestreo elige al azar dentro de la distribución')
inner=''
for i,(t,col) in enumerate([('resumir',C['blue']),('clasificar',C['grn']),('extraer',C['org']),
                            ('reescribir',C['pur']),('responder',C['teal'])]):
    inner+=caja(12+i*150,30,138,44,col,t,12)
inner+=nota('las cinco son la misma operación: texto entra, texto sale',100)
P['Para Qué se Usa un LLM en la Práctica']=svg(inner,"0 0 760 108",110)
P['Corregir y Cambiar el Estilo']=dos('«oye mandame el reporte ya»','«¿Podrías enviarme el reporte?»',
    'lo que escribió alguien','lo que sale',C['org'],C['grn'],
    pie='el contenido no cambia; cambia el registro. Es transformación, no conocimiento')
P['Ocho Cosas que Saber sobre los LLMs']=svg(
    ''.join(caja(12+i*94,34,84,46,c,str(i+1),15) for i,c in enumerate(
        [C['blue'],C['teal'],C['grn'],C['yel'],C['org'],C['red'],C['pink'],C['pur']]))
   +nota('ocho hallazgos con evidencia, no opiniones — Bowman, 2023',104),"0 0 760 112",114)

# --- 13 aplicaciones ---
P['Aplicaciones: Código y Empresa']=dos('tu repositorio','la documentación interna',
    'busca el snippet parecido antes de sugerir','responde citando el manual, no de memoria',C['blue'],C['grn'],
    pie='en los dos casos el dato es privado y cambia cada semana')
P['Aplicaciones: Dominios Especializados y Personales']=dos('leyes, papers, historiales',
    'tus correos y tus notas','donde equivocarse cuesta caro','donde el corpus eres tú',C['org'],C['pur'],
    pie='cuanto más específico el dominio, menos puede saberlo el modelo por su cuenta')

# --- 14 ---
P['¿Cómo Sabe el Modelo Dónde Poner Cada Texto?']=svg(
    caja(20,28,220,54,C['grn'],'parecidos',12,'se acercan')
   +caja(270,28,220,54,C['red'],'distintos',12,'se alejan')
   +caja(520,28,220,54,C['blue'],'millones de veces',12,'y el espacio se ordena')
   +nota('nadie dibuja el mapa: sale de repetir ese tirón',104),"0 0 760 112",114)
P['¿Y Cómo Sé si Está Funcionando?']=svg(
    caja(30,28,200,54,C['blue'],'¿los trae?',12,'recall')
   +caja(280,28,200,54,C['grn'],'¿trae basura?',12,'precisión')
   +caja(530,28,200,54,C['org'],'¿arriba?',12,'MRR, MAP')
   +nota('tres preguntas distintas: ninguna métrica sola las contesta',104),"0 0 760 112",114)

# --- 16 ---
P['Penalizaciones y Sesgos']=tres('repetición','frecuencia','sesgo por token',
    'castiga lo ya dicho','castiga lo muy usado','empuja o prohíbe',C['blue'],C['org'],C['pur'],
    pie='se tocan al final, sobre los logits, sin cambiar el modelo')
P['Tres Formas de Medir la Calidad']=tres('benchmarks','jueces LLM','personas',
    'baratos y comparables','escalan, con sesgos','caras y lentas',C['blue'],C['org'],C['grn'],
    pie='se usan las tres: la de arriba filtra, la de abajo decide')
P['Cómo Leer un Benchmark']=dos('el número del ranking','tu propia tarea',
    'promedio de tareas que no son la tuya','lo único que te importa',C['red'],C['grn'],
    pie='y ojo con la contaminación: el test pudo estar en el corpus de entrenamiento')
P['El System Prompt de un RAG']=svg(
    caja(60,24,640,26,C['pur'],'responde SOLO con el contexto',11.5,op=0.22)
   +caja(60,54,640,26,C['org'],'si no alcanza, dilo',11.5,op=0.20)
   +caja(60,84,640,26,C['grn'],'cita de qué fragmento sale cada afirmación',11.5,op=0.18)
   +nota('las tres reglas bajan alucinaciones más que cualquier ajuste de muestreo',130),
    "0 0 760 138",132)
P['Por Qué Pasa y Por Qué Importa']=dos('el contexto se contradice o no alcanza',
    'el modelo rellena igual','la causa','la consecuencia',C['org'],C['red'],
    pie='y como suena bien, nadie lo revisa: es el fallo más caro de detectar')
P['Qué Sí se Puede Hacer']=tres('pedir citas','revisar la respuesta','medir siempre',
    'contra el fragmento','con otro modelo','faithfulness',C['grn'],C['blue'],C['org'],
    pie='ninguna lo elimina; las tres juntas lo vuelven manejable')
P['Medir sin Métricas: el Sistema Completo']=tres('¿lo vuelve a usar?','¿corrige la respuesta?','¿escala al humano?',
    'retención','edición','abandono',C['grn'],C['org'],C['red'],
    pie='las señales del uso real llegan antes que cualquier métrica offline')
P['¿Y Por Qué Elegir?']=dos('fine-tuning','RAG','el estilo y el formato','los hechos y lo que cambia',
    C['pur'],C['grn'],pie='responden preguntas distintas: en producción se usan juntos')

# --- 17 ---
P['Abaratar el LLM']=tres('modelo más chico','menos contexto','caché',
    'la palanca más grande','menos tokens de entrada','no pagar dos veces',C['blue'],C['org'],C['grn'],
    pie='en ese orden: cambiar de modelo pesa más que todo lo demás junto')
P['Abaratar la Base Vectorial']=tres('cuantizar','menos dimensiones','menos réplicas',
    'de 4 bytes a 1','si el modelo lo permite','y aceptar más latencia',C['teal'],C['org'],C['pur'],
    pie='el almacenamiento es lineal en dimensión × documentos × bytes')
P['Latencia de Recuperación']=svg(
    '<text x="30" y="20" fill="%s" font-size="11" font-family="Fira Code,monospace">de dónde sale el tiempo cuando SÍ es la recuperación</text>'%C['dim']
   +''.join('<rect x="140" y="%d" width="%d" height="15" rx="3" fill="%s" fill-opacity="0.5"/>'
            '<text x="132" y="%d" text-anchor="end" fill="%s" font-size="11.5" font-family="Lora,serif">%s</text>'
            '<text x="%d" y="%d" fill="%s" font-size="11" font-family="Fira Code,monospace">%s</text>'
            %(30+i*24, w, c, 42+i*24, C['fg'], t, 150+w, 42+i*24, C['dim'], v)
            for i,(t,w,v,c) in enumerate([('red',210,'ida y vuelta',C['org']),
                                          ('índice ANN',90,'milisegundos',C['grn']),
                                          ('filtros',150,'si son selectivos, duele',C['red']),
                                          ('reranking',330,'el más caro de los cuatro',C['pur'])]))
   +nota('mide antes de optimizar: casi nunca es donde uno cree',128),"0 0 760 136",132)
P['Proteger la Base de Conocimiento']=tres('permisos por documento','aislar por cliente','borrar de verdad',
    'filtra antes de buscar','no compartir el índice','y reindexar',C['blue'],C['teal'],C['red'],
    pie='el retriever no sabe de permisos: si el vector está, lo puede traer')
P['La Base Vectorial También se Hackea']=dos('meter documentos envenenados','sacar el contenido a preguntas',
    'inyección en el índice','extracción','el atacante escribe','el atacante lee',
    pie='todo lo que se indexa acaba pudiendo salir en una respuesta')

n=0
for t,b in P.items():
    a='<h2>'+t+'</h2>\n'
    if s.count(a)!=1: print('  !! %s: %d'%(t,s.count(a))); continue
    s=s.replace(a,a+b); n+=1
io.open(p,'w',encoding='utf-8').write(s)
print('insertados: %d/%d'%(n,len(P)))
