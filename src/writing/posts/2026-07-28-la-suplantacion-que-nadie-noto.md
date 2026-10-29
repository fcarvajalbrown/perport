---
title: "La suplantación que nadie notó"
date: 2026-07-28
type: articulo
topics: [software, govtech]
cover: /writing/covers/2026-07-28-la-suplantacion-que-nadie-noto.webp
---

Estaba depurando RadarCL cuando lo encontré. No buscaba suplantación: buscaba por qué la herramienta marcaba como inválidas direcciones que claramente existían. En ese proceso leí con cuidado qué decían los servidores cuando contestaban, y noté que el HELO de cada prueba SMTP decía `verify.cl`. Busqué el dominio. Registro A en `54.88.168.60`, nameservers de AWS, dueño que no soy yo.

Cada bloqueo que RadarCL se ganó, cada reclamo que un servidor de correo levantó, llegó a la casilla de ese tercero.

**Eso no es un error de lógica. Es hacerse pasar por alguien sin pedirle permiso.**

## Lo que el servidor ve

Cuando RadarCL llega a un servidor de correo, el servidor hace tres preguntas antes de decidir si le habla: quién eres, de dónde vienes, qué quieres. Las dos primeras se responden en el HELO y el MAIL FROM. RadarCL respondía "soy verify.cl" y "vengo de check@verify.cl".

Si el servidor contestaba con un `550 5.7.606`, que es el código de Microsoft Exchange para "IP bloqueada", RadarCL lo leía como "la dirección no existe" y la marcaba INVÁLIDA. **Pero ese 550 no habla de la dirección: habla de RadarCL.** El servidor rechazó al que llamó a la puerta, no al destinatario del que se preguntó si existía.

El dueño de verify.cl acumula la reputación negativa de los bloqueos que yo me gané. No hay arreglo retroactivo para eso.

## El error debajo del error

El problema de identidad no apareció solo. Mientras lo investigaba encontré cinco lugares más donde RadarCL leía una respuesta de servidor como evidencia de algo distinto de lo que describía.

El RFC 3463 define seis categorías de código extendido de respuesta SMTP. Las dos primeras, "addressing" y "mailbox", hablan del destinatario. Las otras cuatro hablan del sistema remoto, de la ruta, del protocolo, de la política. **RadarCL trataba los seis como si todos hablaran del destinatario.** Un buzón lleno, código `X.2.2`, quedaba marcado INVÁLIDO, aunque estar lleno prueba que el buzón existe. Un dominio que publicaba un null MX, la manera que tiene el RFC 7505 de decirte con todas sus letras "no acepto correo", quedaba DESCONOCIDO en vez de INVÁLIDO. Respuestas de greylisting, servidores que te piden que vuelvas más tarde porque están ocupados, eran indistinguibles de fallas definitivas.

La confusión era la misma en seis lugares: leer una respuesta como evidencia sobre su tema cuando hablaba de otra cosa.

## La corrección

Postfix hace exactamente lo que hace RadarCL: sondea servidores SMTP para verificar si una dirección existe antes de aceptar un mensaje entrante. Se presenta con el nombre del equipo donde corre y usa el remitente nulo, la convención de la RFC 5321 para sondas que nunca van a enviar nada.

RadarCL hace lo mismo desde la versión 0.5.5. Se presenta con el FQDN del equipo que corre el escaneo. Quien tenga un dominio propio con PTR que calce puede sobreescribir eso con la variable de entorno `RADARCL_HELO`. **No es un sistema complejo: es dejar de mentir sobre quién llama a la puerta.**

## Un principio, seis correcciones

Lo que une los seis errores es lo mismo: **una respuesta solo es evidencia de lo que describe.** Un servidor que te rechaza a ti no te dice nada sobre el destinatario. Una consulta DNS que no contesta no te dice que el dominio no tiene correo. Un buzón lleno no te dice que el buzón no existe.

Ese principio, una vez escrito, es obvio. Antes de escribirlo lo estaba violando en seis lugares al mismo tiempo.

La v0.5.5 salió con las seis correcciones: clasificación de respuestas 5xx por RFC 3463, null MX como INVÁLIDO definitivo, identidad honesta en el HELO, y dos estados nuevos.

El primero es para greylisting: un 4xx con patrón de reintento lleva ahora una marca y el motivo escrito. La dirección sigue siendo DESCONOCIDA, porque todavía no se sabe nada, pero queda señalizada para una segunda pasada con el subcomando `verify`. El 421, carga del servidor, queda excluido a propósito: reintentar rápido a un servidor saturado es exactamente cómo una demora se vuelve un bloqueo.

El segundo estado es "acepta todo". Un servidor que responde 250 a cualquier destinatario no está confirmando que el buzón exista: está aceptando a quien llegue. RadarCL detecta eso con dos sondas de veinte caracteres aleatorios sobre la misma conexión ya abierta, una vez por dominio, no una por dirección, porque aceptar todo es una propiedad del servidor, no del buzón. Esas direcciones quedan fuera del CSV, igual que los desconocidos. En veinte dominios .cl reales: el 17% acepta todo.

## Construir herramientas honestas

Hay una forma de tocar infraestructura ajena sin pagar el precio: atribuirle a otro lo que haces. Eso hacía RadarCL sin que yo lo supiera. No era malicia. Era descuido. Para el dueño de verify.cl, el resultado es el mismo.

Una herramienta que toca servidores de correo ajenos tiene que decir quién es. No por una razón legal abstracta, sino porque el trabajo depende de eso: **toda la información que te da un servidor que no sabe con quién habla es evidencia envenenada desde la raíz.**

En Chile las herramientas de civic-tech y OSINT son escasas. La confianza que les queda no se gana suplantando: se gana diciendo el nombre.
