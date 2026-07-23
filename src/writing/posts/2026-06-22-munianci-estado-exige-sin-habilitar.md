---
title: "Ley 21.663: el Estado exige pero no equipa a los municipios"
date: 2026-06-22
type: articulo
topics: [govtech]
cover: /writing/covers/2026-06-22-munianci-estado-exige-sin-habilitar.webp
---

El 71% de los municipios en Chile no ha capacitado a su personal en ciberseguridad en los últimos 18 meses.

La Ley 21.663 les puede cobrar hasta 10.000 UTM por eso.

Son 715 millones de pesos.

La ANCI no les dio herramientas. Yo las construí.

## Lo que exige la Ley 21.663

La ley, promulgada en abril de 2024 y con sus artículos clave en vigor desde marzo de 2025, convirtió a los municipios en organismos obligados: deben implementar sistemas de gestión de seguridad, mantener planes de respuesta a incidentes, reportar brechas al CSIRT Chile en 72 horas. **Los municipios clasificados como Prestadores de Servicios Esenciales (PSE) enfrentan multas de hasta 10.000 UTM. Los que lleguen a ser Operadores de Importancia Vital (OIV), 20.000 UTM. Son 715 y 1.430 millones de pesos, respectivamente.**

La Asociación de Municipalidades de Chile publicó el diagnóstico. El 68,7% de los municipios no tiene plan de respuesta a incidentes. El 63% no tiene presupuesto para digitalización. El 27,8% no cuenta siquiera con un encargado de seguridad a tiempo completo.

## Lo que el Estado no hizo

El Estado promulgó la ley, fijó las multas y creó la Agencia Nacional de Ciberseguridad. Lo que no hizo es construir la infraestructura que permite cumplir lo que se exige.

Piensen en el encargado de TI de una municipalidad pequeña, el de Loncoche o el de Futaleufú. La ley le pide tener un sistema de gestión de seguridad, un plan de respuesta a incidentes, y capacidad para reportar una brecha al CSIRT Chile en 72 horas. Setenta y dos horas. Si no detecta la brecha, si no tiene cómo caracterizarla, si no sabe a qué contacto del CSIRT escribirle, el reloj corre igual y la multa llega igual. La ley no distingue entre el municipio que ignoró las instrucciones y el que quiso cumplirlas pero no tenía cómo.

Eso lo hice yo, de noche, en mi tiempo libre.

## MuniANCI: código abierto, gratis, para cualquier municipio

MuniANCI combina escaneo activo de red con un cuestionario declarativo alineado a las Instrucciones Generales de la ANCI. Produce dos salidas: un informe de brechas en PDF con lenguaje ejecutivo, pensado para el alcalde o el jefe de gabinete, que incluye la escala de multas en UTM y el aviso de obligación al CSIRT; y un reporte JSON listo para enviar directamente al CSIRT Chile. **El encargado de TI puede correrlo en su propia red, sin enviar datos a ningún servidor externo.** Está en GitHub. Es gratis.

## Una brecha de diseño, no de intención

La Ley 21.663 es necesaria. Chile necesitaba un marco de ciberseguridad, la ANCI necesitaba existir, y las multas necesitaban ser altas para que el tema se tomara en serio. Pero una ley sin infraestructura de cumplimiento gratuita es una ley que golpea más fuerte donde el presupuesto es menor.

No es mala intención. Es una brecha de diseño.

¿Cuántos más estamos construyendo gratis lo que el Estado debería proveer?

MuniANCI está en github.com/fcarvajalbrown/MuniANCI. Si trabajas en TI municipal o conoces a alguien que lo haga, es tuya.

---
