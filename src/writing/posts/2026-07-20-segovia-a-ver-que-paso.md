---
title: "Segovia: a ver qué pasó"
date: 2026-07-20
type: articulo
topics: [software, ciencia]
cover: /writing/covers/2026-07-20-segovia-a-ver-que-paso.webp
---

A ver qué pasó.

En junio prometí que había un solo test que importaba: procesar una grabación real de una hora en menos de dos gigabytes de memoria, más rápido que las herramientas actuales. Y que si no lo superaba, lo diría.

Cuarenta días después, el test está corrido. Sobre datos reales del International Brain Laboratory, una de las bases de electrofisiología más usadas en neurociencia activa. Los números son los que son.

## El test

Una sola sonda Neuropixels escribe unos 80 GB por hora a 30 kHz. El problema no es la grabación: es procesarla sin que el software reviente la memoria de la máquina que tienes encima de la mesa.

Segovia procesa esa señal en modo *streaming*: lee un trozo, filtra, devuelve a Python, descarta. El tamaño del buffer no escala con el largo de la grabación. **Una grabación de un minuto y una de una hora tienen el mismo techo de memoria, por construcción.** El nombre no es un accidente: el Acueducto de Segovia lleva agua tramo a tramo, por arcos, sin acumularla.

La comparación fue contra SpikeInterface en dos modos: *thread pool* (memoria compartida entre hilos) y *process pool* (un proceso Python por worker, más su copia de memoria). El presupuesto de tiempo que importa en procesamiento online es 300 ms por trozo; si el motor overruna ese límite, no sirve para tiempo real.

## Los números

Sobre una hora de datos IBL reales:

Memoria: **Segovia usa ~1 GB de peak RSS. El thread pool de SpikeInterface usa 1,75 GB; el process pool, 2,84 GB.** En la máquina de 7,8 GB de RAM donde corrí la prueba, el process pool con 8 workers revienta con OOM. Segovia no. Ese era el punto.

Latencia online: Segovia cumple el presupuesto de 300 ms en el 100% de los trozos sobre datos comprimidos `.cbin` reales. SpikeInterface llega al 69,5% con p99 de 366 ms, que ya overruna el deadline. En online, Segovia gana en media, en cola y en porcentaje de cumplimiento.

Y la trampa honesta: en procesamiento batch offline, con el executor paralelo de SpikeInterface, las dos herramientas empatan. Segovia corre a ~0,84× la velocidad del thread pool de SI, dentro del margen de medición. Lo documenté tal como salió, sin suavizarlo. El README tiene los números, el método y las advertencias completas.

La promesa era memoria acotada y latencia online. Eso se cumplió. El batch, no.

## Lo que sigue

v0.4.0 sale con la cadena completa de preprocesamiento: filtro pasa-banda, *common-median reference* y blanqueo, todo en un solo pase sobre datos de cualquier largo. Un paper está en revisión en GigaByte Journal, con el método, las cifras verificadas y el código reproducible. `pip install segovia` ya funciona en v0.3.0 con los tres lectores; el preprocesamiento llega en el siguiente release.

La parte que sigue siendo honesta: **el motor que resuelve electrofisiología comparte núcleo con el que podría un día ayudar en genómica de célula única, la que sí estudia cómo evoluciona una leucemia.** Lo construyo neutral respecto al dominio para que esa puerta quede abierta, no para prometérsela a nadie. Ayudar, si se puede. No prometer de más.

Claudio Segovia tenía 26 años.
