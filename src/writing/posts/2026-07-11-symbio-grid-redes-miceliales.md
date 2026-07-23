---
title: "El bosque no es altruista. Es funcional."
date: 2026-07-11
type: articulo
topics: [software]
cover: /writing/covers/2026-07-11-symbio-grid-redes-miceliales.webp
---

Cuando diseño un sistema distribuido, la primera pregunta es siempre la misma: ¿qué pasa cuando falla un nodo?

No qué hacer cuando falla. Qué tan preparado estaba el sistema para que fallara. Esa es la diferencia entre una arquitectura que resiste y una que cede. Y es lo más difícil de responder antes de que ocurra.

La red micelial lleva 450 millones de años respondiendo esa pregunta. Hace unos meses, la simulé.

## El modelo que construí

Symbio-Grid (disponible en GitHub bajo licencia GPL v3) es un autómata evolutivo donde dos tipos de agentes operan sobre una grilla: plantas y hongos. Las plantas producen carbono (1.0 unidades por paso) y consumen fósforo (0.3 por paso). Los hongos absorben fósforo del suelo y gastan carbono (0.2 por paso). Cuando cualquiera de esos recursos llega a cero, el agente muere.

El mecanismo central es el intercambio. Cuando un hongo decide hacer *trade* con una planta vecina, le transfiere hasta el 25% de su fósforo, con tope de 2.0 unidades. La planta devuelve lo mismo en carbono. Sin intercambio, los dos mueren por caminos distintos: el hongo se queda sin carbono, la planta se queda sin fósforo.

Los hijos nacen con el 40% del capital del padre. Las reglas de comportamiento mutan con cada generación, y hay generaciones donde el intercambio deja de ocurrir.

**Esas son las generaciones que colapsan.**

## El 90% que no dice todo

Más del 90% de las plantas terrestres viven en simbiosis con hongos micorrícicos. Las plantas les ceden hasta el 20% de su carbono fotosintetizado; los hongos devuelven hasta el 80% del fósforo que la planta necesita. Es una de las cifras más citadas de la ecología, y con razón: a esa escala, esta relación no es un detalle, es la infraestructura del ecosistema.

La narrativa popular la llama el "wood wide web": el bosque solidario que comparte recursos bajo la tierra, los árboles grandes que alimentan a los chicos, la red que redistribuye donde hay déficit. Es una imagen poderosa. Y hasta cierto punto, documentada.

Hasta cierto punto.

Un estudio publicado en la revista *Mycorrhiza* en mayo de 2026, de las universidades de Chiba y Kobe, confirmó movimiento real de carbono entre plantas a través de redes de hongos arbusculares, usando trazadores isotópicos C3 y C4. El carbono se mueve. Eso está confirmado.

Lo que no lo está es el por qué solidario. Los mismos autores describen el fenómeno como posible "distribución de energía". La pregunta de si ese movimiento ocurre por la red micorrícica o por otras vías del suelo sigue siendo científicamente abierta.

**La red no funciona por solidaridad. Funciona porque cada nodo obtiene algo que no puede producir solo.**

Eso no es lo mismo. Y esa diferencia importa cuando diseñas algo que tiene que durar.

## Lo que se puede sacar de esto

Asimetría recíproca. El valor del intercambio existe exactamente porque ningún agente puede hacer lo que hace el otro. La planta fotosintetiza pero no puede absorber fósforo del suelo. El hongo absorbe fósforo pero no puede producir carbono. Sin esa asimetría, el intercambio no tendría sentido: cada uno se proveería solo. El contrato es valioso porque la necesidad es real y mutua. En software: una API que solo consume sin especificar lo que entrega es un parásito, no un socio. El contrato bidireccional no es burocracia, es la condición mínima para que el sistema no ceda cuando hay estrés.

Decisión en contexto. Los agentes no tienen una estrategia fija: un hongo con fósforo mayor a 6.0 y carbono mayor a 4.0 se expande; uno con carbono menor a 2.0 busca intercambio de inmediato. Las reglas mutan con cada generación. En sistemas distribuidos, esto tiene nombre: *circuit breakers*, *backpressure*, *adaptive rate limiting*. **No son *features* opcionales. Son el sistema nervioso del intercambio bajo presión.**

El colapso es gradual y detectable. En la simulación, un hongo no muere de golpe: se expande cuando no debería, agota su carbono, deja descendencia que también agota el suyo. La degradación es progresiva, y cada paso fue visible antes del final. La deuda técnica funciona igual: no hay un momento en que el sistema "colapsa". Hay una serie de decisiones de expansión hechas mientras los recursos ya estaban estresados. La diferencia entre un sistema que resiste y uno que cede es si eso se vio venir o no.

No es altruismo. Es la condición de existencia.
