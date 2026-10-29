---
title: "ChileCompra presume transparencia. Los datos que importan siguen vacíos."
date: 2026-10-22
type: articulo
topics: [govtech]
cover: /writing/covers/2026-10-22-api-chilecompra-licitaciones.webp
---

Hoy a las 22:59 le pedí a la API oficial de Mercado Público el listado de licitaciones adjudicadas en Chile. Devolvió 360. Filtré las de municipios: 137. De esas, 32 se adjudicaron a un solo oferente. Uno de cada cuatro.

No es una encuesta ni un rumor de pasillo. **Es la respuesta literal, en vivo, de la plataforma que el Estado chileno exhibe como ejemplo internacional de transparencia y datos abiertos en compras públicas.** La bajé yo mismo, con mi propio ticket de API, hace unas horas.

## El truco viejo murió. El que sigue vivo no se mira.

Hasta 2022, el patrón clásico para blindar una licitación era simple: abrirla por menos de cuatro días hábiles, para que casi nadie llegara a postular a tiempo. La Ley 21.634, que modernizó las compras públicas en diciembre de 2023, parece haber apretado ese tornillo. En mi muestra de hoy, de 137 licitaciones municipales, solo 3 tuvieron ventana corta.

Corrí una simulación de Monte Carlo con 10.000 iteraciones sobre esos mismos datos, cruzando oferente único con ventana corta. El resultado es honesto, no espectacular: el cruce no fue estadísticamente significativo, la muestra es chica. **Pero el oferente único no necesitó la ventana corta para seguir en el 23% de las licitaciones municipales de hoy.** El truco cambió de forma. Nadie lo está mirando con el mismo cuidado.

## El Estado ya escribió dónde está el hueco

Esto no es una sospecha mía. Open Contracting Partnership, que mantiene el espejo internacional de los datos de ChileCompra, documentó que la API dice actualizarse en tiempo real pero en la práctica se refresca cada seis meses, que hay 74.931 contratos registrados contra 4,9 millones de adjudicaciones, y que los campos de transacciones e hitos están vacíos.

Entre diciembre de 2025 y febrero de 2026, ChileCompra hizo su propia consulta pública sobre el futuro de sus APIs. Recibió 35 respuestas. El 94% de los que contestaron ya usa las APIs todos los días. Y encontraron, con sus propias palabras, brechas de cobertura justo en tratos directos, compra ágil y convenios marco. **Es decir: el propio organismo que administra los datos reconoció que el hueco está exactamente donde se esconden las compras sin competencia real.**

## No es incapacidad. Es que a nadie le urge

El estudio de la UC y la USACH (Martín Ordóñez y Pablo Carvacho, mayo 2025) revisó 345 municipios entre 2015 y 2022: 2.858 auditorías de Contraloría con más de 33.500 faltas graves, y 72.000 licitaciones adjudicadas a un solo oferente. Chile, mientras tanto, lleva desde 2018 recibiendo reconocimiento internacional por publicar esos mismos datos en estándar abierto.

Las dos cosas son ciertas a la vez, y eso es el punto. **Publicar datos abiertos y que esos datos sirvan para auditar lo que de verdad importa no es lo mismo, y Chile celebra lo primero mientras lo segundo sigue roto donde más duele.** No es que falte capacidad técnica para arreglarlo. Es que a nadie con poder de decisión le urge que esos datos se puedan cruzar fácil.

Yo ya crucé algunos. Hay un proveedor de salud primaria que se repite en trato directo en cinco comunas distintas, siempre con el mismo paquete de licencias y el mismo camino administrativo. A los que ya saben de qué hablo, no hace falta que diga el nombre. Al resto le queda la tarea: la API está ahí, parcialmente, esperando que alguien más la lea.
