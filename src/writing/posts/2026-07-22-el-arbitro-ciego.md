---
title: "El árbitro ciego"
date: 2026-07-22
type: articulo
topics: [ia, ciencia]
cover: /writing/covers/2026-07-22-el-arbitro-ciego.webp
---

Cuando armé Probator, un escritorio para escribir papers donde fabricar una cita es físicamente imposible, mucha gente me preguntó lo mismo: ¿para quién haces eso? Los investigadores serios no necesitan que les bloqueen citas. Tienen la ética.

Tenían razón en lo que pensaban que importaba. El investigador serio no fabrica citas a propósito. El problema es que ahora puede hacerlo sin saberlo, y el sistema construido para atraparlo no fue diseñado para ese caso. No hay reglamento de integridad académica que cubra al autor que mintió sin intención porque le creyó a un modelo de lenguaje.

Eso no es una falla moral. Es una falla de arquitectura. Y la diferencia importa porque los remedios son distintos.

## Un número que crece solo

En 2023, 1 de cada 2.828 papers publicados en PubMed contenía al menos una referencia fabricada. Un número que parecía marginal, algo así como ruido de fondo, una rareza estadística. A inicios de 2026, esa proporción es **1 de cada 277**. Doce veces más en tres años, según el análisis de Maxim Topaz (Universidad de Columbia) sobre 2,5 millones de artículos biomédicos y 97 millones de citas, publicado en The Lancet.

Los LLMs generan referencias con la seguridad de quien sabe de lo que habla: título correcto, año plausible, nombre de revista creíble, DOI que parece real. El autor los recibe así, los mete en el manuscrito de buena fe y los pasa al árbitro. El árbitro los lee. Nadie los verifica contra la base de datos.

¿Por qué no? Porque en 350 años de revisión de pares científicos, esa verificación nunca fue necesaria. El árbitro asumía, con razón, que el autor sabía lo que citaba, porque lo había leído.

## Lo que el árbitro asume

La revisión de pares no es un mecanismo de verificación de hechos. Nunca lo fue. **Es un filtro de plausibilidad**: ¿el argumento es coherente?, ¿la metodología es razonable?, ¿las conclusiones siguen de los datos? Si la bibliografía parece correcta, el árbitro no va a abrir cada URL. Tiene treinta páginas por leer y dos semanas para devolverlas.

Esto funcionó mientras se cumplía una condición básica: los autores sabían lo que citaban porque lo habían leído. Los LLMs rompieron esa condición sin que nadie lo decidiera ni lo declarara. El modelo completa texto con lo que suena verosímil, y una cita inventada suena exactamente igual que una real: mismo formato, misma confianza, misma ausencia de señal de alarma.

El sistema de control de calidad de la ciencia fue construido para dos casos: el autor que se equivoca de buena fe y el autor que miente a propósito. No asumió un tercer caso. El autor que no sabe que miente porque le confió esa responsabilidad a una máquina que no tiene ninguna.

## Donde falló hasta NeurIPS

NeurIPS 2025, la conferencia más importante del mundo en inteligencia artificial. Samar Ansari revisó una muestra de los papers aceptados y encontró 100 citas fabricadas repartidas en 53 artículos distintos. Cada uno de esos 53 papers pasó por un comité de revisión de entre tres y cinco expertos en el área.

**Cien citas inventadas. Cero detectadas por la revisión de pares.**

No fue descuido de árbitros malos. Fueron especialistas en IA revisando papers sobre IA, que no distinguieron las referencias reales de las que los propios modelos que estudian habían fabricado. Ansari clasificó las falsificaciones: 66% eran fabricaciones totales, sin ninguna existencia verificable; 27% tenían atribuciones parcialmente corruptas (autor real, título inventado, o al revés).

Los casos extremos miden el límite. En un artículo publicado en Digestive Diseases and Sciences, 12 de 14 citas eran inventadas. En un paper de PLOS ONE sobre aprendizaje combinado, 18 de 76 referencias no existían. Springer Nature retiró en julio de 2025 un libro completo de machine learning: dos de cada tres citas o no existían o estaban materialmente equivocadas. La editorial tiene políticas explícitas contra la autoría por IA. Las citas de igual manera entraron.

El problema no es la calidad del árbitro. Es que el árbitro hace lo que siempre ha hecho, y lo que siempre ha hecho ya no alcanza.

## La solución que cuesta cero

Probator tiene un módulo que se llama Citation Firewall: verifica cada cita en tiempo real contra OpenAlex, Crossref y Semantic Scholar mientras el investigador escribe. Si la referencia no existe en esas bases, no puede entrar al manuscrito. No es una advertencia ni un signo de exclamación en el margen. Es un bloqueo. La arquitectura hace que el error sea imposible, no que sea visible.

No es el único camino. HalluCiteChecker, publicado en arXiv en abril de 2026 bajo licencia Apache 2.0, es una librería de Python que corre en cualquier computador sin GPU y sin conexión a internet. SwanRef verifica referencias contra 150 millones de papers vía web, gratis, en segundos. urlhealth son 83 líneas de código que clasifican cada URL como real, archivada, muerta o probable invención.

**Cuatro herramientas distintas, todas gratuitas o *open source*, todas disponibles hoy.** Ninguna requiere infraestructura institucional ni presupuesto de investigación. Cualquier laboratorio o tesista puede correrlas esta semana desde un computador básico.

## La política sin la arquitectura

El único análisis sistemático disponible de las políticas de integridad académica de las universidades chilenas (Springer, 2024, sobre 43 instituciones acreditadas) encontró: lenguaje legal de difícil acceso para los estudiantes, enfoque mayoritariamente punitivo, mecanismos preventivos casi ausentes, y escasa referencia al riesgo específico de los LLMs.

La política existe. La arquitectura que la hace cumplir, no.

Conozco ese patrón de cerca. La Ley 21.663 creó el marco de ciberseguridad obligatorio para organismos del Estado en 2024 y no puso el presupuesto para cumplirlo. Armé MuniANCI, el escáner de cumplimiento, gratis, para que los municipios tuvieran algo concreto con qué trabajar. El patrón se repite: la institución declara el estándar y la herramienta técnica la financia quien puede.

Las universidades chilenas saben que sus estudiantes e investigadores usan LLMs. Lo que no tienen es la exigencia de que ningún paper salga de sus aulas sin pasar por un verificador de citas. Esa exigencia no requiere plata, no requiere licitación ni proceso administrativo. Requiere decidir que la arquitectura importa tanto como el reglamento.

La cita inventada ya no es un signo de deshonestidad. Es un signo de que el sistema de producción científica tiene un componente nuevo que no estaba cuando se diseñaron las reglas. La herramienta que lo corrige existe. La voluntad institucional de exigirla, todavía no.
