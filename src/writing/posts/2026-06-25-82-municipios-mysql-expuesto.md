---
title: "82 municipios con MySQL expuesto: lo que la ANCI no publicó"
date: 2026-06-25
type: articulo
topics: [govtech]
cover: /writing/covers/2026-06-25-82-municipios-mysql-expuesto.webp
---

Viña del Mar tiene el puerto 3306 de su base de datos abierto al mundo. La Serena también. Antofagasta, San Miguel, Vallenar. Cualquier persona con un computador puede intentar conectarse a los registros de contribuyentes, trámites y datos personales de sus vecinos. Lo verifiqué yo, el 10 de marzo de 2026, con un scanner construido en mi tiempo libre y que cualquiera puede reproducir hoy mismo.

## Lo que encontré en los 345 municipios

Tiré el scanner sobre los 345 sitios web municipales de Chile en la semana exacta del cambio de mando presidencial. El resultado: **82 municipalidades, el 24% del total, tienen el puerto MySQL directamente expuesto a internet.** Eso significa que cualquier persona puede intentar conectarse a su base de datos desde cualquier parte del mundo, sin pisar el municipio, sin vulnerar nada sofisticado. Basta un TCP connect al puerto 3306.

Otros 50 municipios operan sin SSL válido. Los datos que sus vecinos ingresan en formularios en línea viajan sin cifrar por la red, del computador al servidor, pasando por todo lo que hay en el medio. Siete municipios siguen corriendo PHP 5.x, software sin actualizaciones de seguridad desde diciembre de 2018. Y 221 tienen el panel de administración de su servidor (cPanel) accesible desde internet, para que lo intente abrir quien quiera.

No es una alerta genérica de consultor. El código del scanner está en GitHub, los datos crudos en `results.json`, todo reproducible. Si alguien quiere refutar el número, tiene las herramientas a disposición.

¿Quién lo encargó? Nadie. Lo hice en mi tiempo libre.

## La ley que lleva más de un año en vigor

La Ley Marco de Ciberseguridad N° 21.663 fue promulgada en abril de 2024. Sus obligaciones entraron a regir el 1 de marzo de 2025, y los municipios están dentro de su alcance: el artículo primero los incluye entre los organismos del Estado que deben cumplir. La ANCI empezó a operar el 2 de enero de 2025 y tiene la facultad de solicitar evidencia de cumplimiento y aplicar sanciones. **Por infracciones graves puede multar hasta 20.000 UTM, y hasta 40.000 UTM a los operadores de importancia vital.**

Un MySQL con el puerto 3306 expuesto a internet es, sin eufemismos, un servicio sin las medidas mínimas que la ley exige. No hace falta una auditoría técnica sofisticada para comprobarlo. El que expone su base de datos al mundo no puede alegar ignorancia técnica, y la ANCI no puede alegar que no tenía herramientas. Las herramientas están en GitHub, gratis, con licencia abierta.

La ley es reciente y los organismos tienen plazos para ponerse al día. Pero los plazos ya corrieron. Las obligaciones rigen desde marzo de 2025, y los 82 municipios con MySQL expuesto en marzo de 2026 no son un problema de agenda.

## El diagnóstico que ya existía antes de la ley

La Asociación de Municipalidades de Chile (AMUCH) publicó en octubre de 2024 un informe sobre los desafíos de ciberseguridad en los municipios. No como predicción: como diagnóstico.

**El 68.7% de los municipios no tiene un plan de respuesta ante incidentes de ciberseguridad.** El 71% no había capacitado a su personal en los 18 meses anteriores. El 63% no tiene presupuesto para avanzar en digitalización. El 57.2% no clasifica la información que maneja bajo ningún criterio de seguridad.

El problema no llegó con la Ley 21.663. La ley llegó después del problema. No al revés. Lo que cambió fue la obligación formal y la posibilidad de sanción. Lo que no cambió fue la realidad técnica de los municipios, como confirma el scanner.

Nadie puede decir que no sabía. AMUCH lo publicó. Está disponible en su sitio, en abierto. Aun así, en la semana en que Chile estrenaba un nuevo gobierno, 82 bases de datos municipales seguían con el puerto expuesto.

## La pregunta que la ANCI no ha respondido

Llevan un año y medio funcionando. Tienen el mandato legal y las facultades para auditar a todos los organismos del Estado. Pueden solicitar evidencia de cumplimiento y aplicar multas. **Lo que no han publicado, a la fecha, es un reporte público de cumplimiento municipal.**

No hay un listado oficial de qué municipios cumplen y cuáles no. No hay un número oficial de organismos con servicios expuestos a internet. El Estado legisló la ciberseguridad y todavía no midió si la tiene.

Lo que sí existe es un scanner construido en tiempo libre, con código abierto, por un ingeniero que gana cerca del sueldo mínimo. Los datos están en GitHub: los 82 municipios con MySQL expuesto, los 50 sin SSL, los 7 con PHP obsoleto desde 2018, los 221 con cPanel abierto. Todo ahí, sin costo, reproducible por cualquiera.

La ANCI lleva un año y medio funcionando.

¿Cuándo va a publicar su propio reporte?
