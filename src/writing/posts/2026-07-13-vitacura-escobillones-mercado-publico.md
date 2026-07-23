---
title: "ChileCompra publica todo. Vitacura igual pagó el doble."
date: 2026-07-13
type: articulo
topics: [govtech]
cover: /writing/covers/2026-07-13-vitacura-escobillones-mercado-publico.webp
---

Vitacura compró 25 escobillones Virutex a $5.125 por unidad, IVA incluido. El mismo escobillón cuesta $1.990 en el supermercado. La diferencia es 2,58 veces el precio de referencia retail. La orden de compra existe, es pública, y el número es 1480090-33-CM26: disponible en Mercado Público ahora mismo, sin clave, sin solicitud especial.

En la misma orden, Vitacura pagó $6.553 por un cloro gel Igenix de 5.000 ml. El precio retail de referencia es $3.490. Ratio: 1,88x.

Conchalí también aparece, orden 2296-305-AG26: escobillones a $3.767 frente a los mismos $1.990. 1,89x sobre el precio de referencia.

No estoy diciendo que hubo corrupción. Lo que estoy mostrando es que hay un sobreprecio documentado, verificable, con link, en compras realizadas con dinero público, y que ningún sistema oficial estaba diseñado para detectarlo.

**En 2025, el Estado chileno transó US$21.953 millones a través de ChileCompra.** Si una fracción proporcional de esas compras presenta sobreprecios similares, el número agregado no es trivial.

## El sistema más transparente de la región

Chile tiene la plataforma de compras públicas más abierta de América Latina. Mercado Público publica en tiempo real cada orden de compra de todos los organismos del Estado. La API de ChileCompra es de acceso libre. Cada ítem va clasificado con código UNSPSC. Eso no es menor: la mayoría de los países de la región no tienen nada que se le acerque.

Ese sistema funciona como instrumento de rendición de cuentas cuando alguien lo usa para pedir cuentas. La Contraloría General de la República puede hacerlo y a veces lo hace. **En 2025 detectó sobreprecios de hasta 44% en la adquisición de canastas del Plan Alimentos para Chile**, con las diferencias más altas en Tarapacá, Maule y Antofagasta.

En abril del mismo año, la Dirección de Presupuestos (DIPRES) publicó una revisión del gasto que definió formalmente el sobreprecio en compras públicas como el diferencial entre lo que el Estado paga y el menor precio disponible en el mercado.

El problema no es que la Contraloría no pueda actuar. Es que actúa cuando hay una denuncia, un programa específico bajo escrutinio, o una emergencia que concentra la atención política. No hay ningún proceso que corra, de manera rutinaria, un precio de referencia retail contra cada línea de cada orden de compra de cada municipio.

Ese espacio existe. Y está vacío.

## Una canasta de 19 productos y 52 municipios

OSINT-Mercado es un pipeline Python que ingesta órdenes de compra desde la API oficial de ChileCompra, las cruza contra una canasta de 19 SKUs comoditizados, y marca las compras que superan un umbral sobre el precio de referencia retail. Los 19 SKUs son bienes básicos con precio observable en cualquier supermercado: escobillones, cloro, alcohol gel, papel higiénico, resmas de hoja carta. Comodities. No hay ambigüedad de especificación técnica posible.

La Fase 1 cubre los 52 municipios de la Región Metropolitana. Cada flag generado incluye la URL de la orden original, el precio pagado, el precio de referencia, y el ratio de sobreprecio. Cualquier persona puede verificar los resultados directamente en Mercado Público.

Los precios de referencia tienen confianza media: son observaciones reales de precios retail, no precios contractuales negociados por volumen. El ratio podría ser menor si el proveedor ofreció condiciones que el supermercado no incluye. También podría ser mayor.

**Tres flags confirmados hasta ahora.** La herramienta lleva semanas corriendo sobre un conjunto acotado de SKUs, en una región, en una etapa temprana. OSINT-Mercado tiene además una interfaz web en construcción, no publicada aún: el panel que muestra la orden de Vitacura marcada como "Alta" severidad lleva ahí desde antes del lanzamiento. Lo encontramos en pre-beta. Uno solo basta para hacer la pregunta.

## Lo que una escoba multiplica

En 2025 se emitieron 1.868.361 órdenes de compra a través de Mercado Público. Cada orden puede contener decenas de ítems distintos. La Compra Ágil, el mecanismo para adquisiciones rápidas y de bajo monto, transó sola más de US$1.166 millones ese año. Es el mismo tipo de procedimiento donde aparecen los escobillones, el cloro, el papel de impresora: bienes básicos, sin especificación técnica compleja, comprados miles de veces al año por cientos de organismos distintos.

Las municipalidades representaron el 20,1% del gasto total transado en 2025, algo más de US$4.400 millones solo en el sector municipal. No en obras de infraestructura ni en contratos de consultoría: en el agregado de compras cotidianas que nadie compara con el precio de mercado.

**La DIPRES midió en 2025 un sobregasto de $10.615 millones de pesos en apenas 12 convenios marco durante 2022 y 2023: un 3,6% del gasto efectuado.** La OCDE, al recomendar a Chile ese mismo año instalar un sistema permanente de revisiones del gasto, estimó un ahorro potencial de entre 0,11% y 0,13% del PIB. Con el PIB de 2024, eso equivale a varios cientos de millones de dólares anuales.

No en fraudes. En compras pequeñas, repetidas, sin comparación de precios, a escala de Estado.

La escoba de $5.125 no es la historia. Es el exponente.

## La pregunta que esto plantea

Vitacura no es un municipio sin recursos. Es el municipio con el ingreso per cápita más alto de Chile. El punto no es culpar a un funcionario en particular. El punto es estructural: ¿existe algún mecanismo automático, en algún organismo del Estado, que compare el precio unitario de cada orden de compra con el precio retail del mismo bien y emita una alerta cuando la diferencia supera el doble?

Hasta donde pude verificar investigando esto, la respuesta es que no.

La Contraloría tiene el mandato y lo ejerce de forma reactiva, no rutinaria. La FNE renovó en 2025 su convenio con ChileCompra para detectar colusión entre proveedores, no sobreprecios unitarios. La DIPRES estudió el problema en términos agregados. Los datos están ahí, clasificados y con API, desde hace años.

**Lo que no existe es la rutina.**

Un sistema automático que tome las órdenes de compra, las cruce contra precios de mercado y entregue un reporte mensual a cada municipio diciendo "aquí pagaste 2,6 veces el precio retail" no es ciencia ficción. Es el mismo proceso que construí, de forma incompleta, en mi tiempo libre.

Eso no es falta de transparencia. Es transparencia que nadie convirtió en auditoría.
