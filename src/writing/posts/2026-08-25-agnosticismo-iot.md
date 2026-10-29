---
title: "Agnosticismo de proveedor: un consejo de software en IoT"
date: 2026-08-25
type: articulo
topics: [software]
cover: /writing/covers/2026-08-25-agnosticismo-iot.webp
---

El Kinect está muerto. La versión de Xbox 360 se descontinuó en 2016, la versión 2 en 2017, y el sucesor profesional, Azure Kinect, dejó de fabricarse en 2023.

Lo descubrí cotizando cámaras de profundidad para un piloto de bajo presupuesto. Mi primera reacción fue la que tenemos todos los que venimos del software: bueno, hay que hacer el sistema agnóstico, que no dependa de ningún proveedor. Me demoré un rato en darme cuenta de que ese consejo, en un proyecto con dispositivos instalados en terreno, no sirve casi para nada.

## Lo que se muere es lo que no puedes cambiar

Microsoft no botó la tecnología del Kinect: le licenció su sensor de tiempo de vuelo a Orbbec. Hoy el Femto Bolt de esa empresa usa el mismo sensor iToF y trae un envoltorio del SDK que hace correr código escrito para Azure Kinect.

Cuesta 418 dólares. Si no necesitas esa compatibilidad, el Gemini 215 hace profundidad real por 218, y el Astra Mini Pro por 150. **El reemplazo oficial de un sensor que costaba 150 dólares vale hoy casi el triple, y a Chile hay que sumarle envío, 19% de IVA y aduana.**

El resto del rubro cuenta lo mismo. RealSense, la línea de Intel, sobrevivió a un anuncio de cierre en 2021 y terminó independizándose de Intel en julio de 2025 con 50 millones de dólares de inversión. Luxonis subió el precio de su OAK-D Lite el 9 de julio de este año porque se acabó el chip Myriad X que usaba.

Ningún proveedor de este mercado llegó a los cinco años sin cambiar de manos, de precio o de línea de producto.

## El consejo que se repite sin pensarlo

Frente a eso, la respuesta de manual es escribir todo desacoplado, con una capa de abstracción por si el proveedor desaparece. En software puro el consejo se sostiene, porque el costo de equivocarse es un refactor. Cambias la implementación detrás de la interfaz, corres los tests, haces el deploy y listo. La abstracción cuesta poco y te ahorra un dolor grande.

En IoT la aritmética es otra. **El acoplamiento que te mata no es lógico, es físico.** Un dispositivo en terreno no es un sensor: es un sensor más una pantalla, un gabinete, una fuente de alimentación, un cable, un soporte y alguien que se subió a una escalera a instalarlo.

Cuando el sensor cambia de modelo, cambia el tamaño, cambia el consumo y cambia el conector. Muchas veces cambia el gabinete completo. No hay interfaz que abstraiga eso. Hay que volver al sitio, uno por uno.

Por eso me molesta ver "hazlo agnóstico" repetido como si fuera una respuesta. Es un consejo nacido en un contexto donde reemplazar la pieza cuesta un commit, aplicado mecánicamente a otro donde reemplazarla cuesta una visita a terreno multiplicada por la cantidad de puntos instalados. No es el mismo problema.

## Para qué sirve, entonces, un orquestador agnóstico

Sirve, pero mucho menos de lo que se vende. Llevo tiempo trabajando con Strands, el framework de agentes que Amazon liberó como código abierto en mayo de 2025, y su agnosticismo de modelo es genuino: se conecta a Bedrock, a Anthropic, a OpenAI o a un modelo corriendo local, y cambiar de uno a otro no te obliga a reescribir la lógica.

Eso es real y tiene valor, porque los proveedores de modelos cambian de precio y de nombre cada pocos meses, y ahí sí el reemplazo es barato. Lo honesto es decir qué protege y qué no. Protege la capa donde el cambio ya era barato. No protege ni un peso de lo que de verdad se te va a caer, que es el fierro.

**Buscando casos documentados de un orquestador de agentes coordinando sensores IoT en producción, fuera del propio material de AWS, no encontré ninguno.** Amazon publicó buenas guías con IoT Greengrass, pero las escribió Amazon para vender Amazon.

El framework tiene alrededor de 6.500 estrellas en GitHub y usuarios nombrados como Smartsheet y Swisscom, así que la herramienta existe y funciona. La práctica instalada, con hardware barato y presupuesto acotado, todavía no.

## Dónde poner el rigor

Mi conclusión es incómoda para alguien que escribe código: la decisión que hay que pensar más es la compra, no la arquitectura. Elegir un sensor que siga en catálogo, con soporte vigente y repuesto conseguible en dos años, importa más que cualquier capa de abstracción, porque esa decisión es la irreversible. La abstracción sale casi regalada y te devuelve poco. El sensor equivocado te obliga a desmontar lo que ya instalaste.

Hago este trabajo como investigador independiente, con mi tiempo y pagando de mi bolsillo las herramientas que uso, cerca de cien dólares al mes que nadie me devuelve. Prefiero equivocarme antes de comprar que después.

Si alguien tiene un caso real de agentes orquestando sensores en terreno, fuera del material de AWS, quiero verlo. Con esa pregunta quedé.

Cambiar de proveedor de modelos me cuesta una línea de configuración. Cambiar el sensor me cuesta volver a subir la escalera.
