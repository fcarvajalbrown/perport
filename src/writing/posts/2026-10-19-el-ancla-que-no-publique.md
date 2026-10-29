---
title: "Le puse blockchain a un fiscalizador de compras públicas"
date: 2026-10-19
type: articulo
topics: [software, govtech]
cover: /writing/covers/2026-10-19-el-ancla-que-no-publique.webp
---

Esta semana bajo osint-mercado.cl. Es una herramienta que audita compras públicas de los municipios de la Región Metropolitana, y en un solo día le agregué blockchain: cada hallazgo firmado con SHA-256, anclado en Stellar testnet y verificable desde el navegador. Después de 241 commits, el sitio tiene 2 hallazgos confirmados.

## Lo que ancló de verdad

La herramienta cruza órdenes de compra de Mercado Público contra precios de retail de una canasta de productos, y marca las que se alejan del precio de referencia. Para un hackathon de Stellar le sumé una capa de integridad: cada publicación serializa los datos, calcula el hash de cada fila y el dígesto del lote, y lo escribe en una transacción de la red. Si alguien edita un número después de publicado, la fila se pinta roja en el navegador.

**Veinte de esos 241 commits son del anclaje y el sello, y los veinte caen el mismo día, el 9 de octubre.** El último ancla quedó en el ledger 5112586 y sella 3.895 entradas.

![OSINT-Mercado: commits por semana, con los 20 del anclaje en Stellar marcados, y lo que hay publicado en el sitio: 3.893 pistas y 2 hallazgos confirmados](/writing/covers/2026-10-19-el-ancla-que-no-publique-fig1-osint-mercado.webp)

## Por qué no lo seguí

Primero, porque la complejidad no es proporcional a lo que protege. Sumé una librería, una llave privada que custodiar y un verificador en el navegador a un sitio cuyo producto son dos hallazgos revisados y casi 3.900 pistas en espera de revisión. Cuando llevé una crítica técnica sobre esto a representantes locales de Stellar, la leyeron como un mensaje de odio. Una crítica y un reclamo no son lo mismo que un insulto.

Segundo, porque el propio diseño admite su límite. Lo escribí en el documento de decisión: el testnet de Stellar se reinicia periódicamente, así que lo anclado ahí es una demostración, no un registro permanente. **Pasar a mainnet quedó como una decisión aparte que nunca tomé.**

Tercero, y lo digo rápido: el ancla prueba que yo no edité mis propios hallazgos, pero no la orden de compra de origen. Al revisar las cuatro órdenes publicadas en ese momento, ninguna se abría en Mercado Público sin iniciar sesión.

## El puente: a veces el problema ya está resuelto

Diego Stutgard subió a GitHub, entre el 30 de septiembre y el 7 de octubre, dos herramientas que cubren la mitad del problema que yo llamaba precio de referencia: comparar una canasta de productos entre tiendas chilenas. Price-comparator-cl lee un Excel con una lista de productos, cotiza en Sodimac, Falabella y Hites, y devuelve el mejor precio por ítem. PriceTarget hace lo mismo todos los días y avisa cuando un precio llega al valor que fijaste. **Ninguno de los dos tiene una línea de blockchain, y los dos tienen una prueba programada que corre contra las tiendas reales.**

![Commits y corridas automáticas de price-comparator-cl y PriceTarget en GitHub Actions: pruebas de integración continua y una prueba programada contra las tiendas reales](/writing/covers/2026-10-19-el-ancla-que-no-publique-fig2-diego-stutgard.webp)

La integridad de un dato público no la da la cadena que lo firma. La da que cualquiera pueda volver a correr el cálculo y le dé el mismo número. Eso es más barato, más verificable y no depende de que una red de prueba siga viva.

Hago este trabajo como investigador independiente, con mi tiempo y pagando de mi bolsillo las herramientas que uso, cerca de cien dólares al mes que nadie me devuelve. Por eso me cuesta más admitir cuándo una parte de lo que construí no valía el tiempo.

Es martes: toca soltar algo. No voy a seguir empujando OSINT-Mercado: hay proyectos que valen más mi tiempo y mi plata. Hay que saber reconocer cuándo uno, aunque funcione a medias, ya murió.
