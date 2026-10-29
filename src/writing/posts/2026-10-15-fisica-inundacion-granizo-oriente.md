---
title: "Por qué Santiago se inundó: la física que nadie explicó"
date: 2026-10-15
type: articulo
topics: [ciencia, ciudad]
cover: /writing/covers/2026-10-15-fisica-inundacion-granizo-oriente.webp
---

## La calle que se volvió río

Salí del trabajo pasadas las 17:30 del martes 13 de octubre. Llegué a mi casa en Ñuñoa a las 20:00. Dos horas y media para un trayecto que cualquier otro día me toma cuarenta minutos, entre calles del sector oriente convertidas en cauces, autos varados con el agua a la altura de la puerta y un Metro colapsado tragándose a la gente que huía de la lluvia hacia el subterráneo. Ese día Senapred declaró alerta roja ampliada para diez comunas de la Región Metropolitana por riesgo de aluvión, después del granizo que cubrió Las Condes, Vitacura, Providencia y Ñuñoa.

La explicación que circuló fue climática: llovió mucho, granizó fuerte, el sistema colapsó. Cierto, pero incompleto. **Lo que convirtió una tormenta fuerte en una calle intransitable no fue solo la cantidad de agua que cayó, fue lo que pasó en la boca de cada sumidero cuando el granizo se apiló encima.** Esa es la parte que se puede modelar, y la que explica por qué el mismo aguacero inunda una cuadra y deja la de al lado seca.

## Dos físicas que chocan en una reja de metal

El agua de lluvia se comporta como un fluido continuo: se puede describir con las ecuaciones de aguas someras que usan los modelos hidráulicos de Santiago, las mismas que sustentan el Plan Maestro de Aguas Lluvias del MOP. El granizo, en cambio, no es un fluido. Es un conjunto de partículas sólidas discretas, cada una con su tamaño, que caen, rebotan y se apilan unas sobre otras en la reja del sumidero como ladrillos sueltos, no como agua que se escurre. Esa segunda física se modela con métodos de elementos discretos (*DEM*), la misma familia de herramientas que la ingeniería usa para simular cómo se compacta el hielo en un río o cómo se atasca un filtro con partículas finas.

El punto de choque es la boca del sumidero. Ahí rige una ecuación de más de un siglo, la del orificio: el caudal que logra salir es proporcional al área abierta de la reja multiplicada por la raíz cuadrada de la altura de agua acumulada. La raíz cuadrada es la trampa. Si el granizo tapa el 99% de esa área, el caudal de salida no cae un 99%: colapsa mucho más rápido, porque ya casi no queda área por la cual escapar, y el agua que sigue llegando no tiene adónde ir salvo subir.

![Modelo ilustrativo: altura de agua con reja despejada versus reja taponada por granizo](/writing/covers/2026-10-15-fisica-inundacion-granizo-oriente-clogging_demo.webp)

Armé un modelo reducido, acoplando ese bloqueo tipo DEM (partículas de granizo apilándose sobre una reja) con la ecuación de continuidad de un sumidero real, para ver qué tan rápido se separan los dos escenarios. Con la reja despejada, la lluvia simulada ni se nota en la calle. Con la reja cubierta en un 99%, el mismo caudal de entrada acumula **25 centímetros de agua en poco más de dos horas**, el mismo rango de profundidad que le vi a los autos varados esa tarde.

## Lo que el modelo no inventa

Ese resultado es ilustrativo, no una medición de ninguna calle real de Providencia o Ñuñoa. No tengo la topografía exacta de esas cuadras, ni el registro de lluvia minuto a minuto del 13 de octubre, ni el tamaño real de cada reja que vi tapada. Lo que sí es real es la física: la ecuación del orificio es la que usa la ingeniería hidráulica chilena para dimensionar sumideros, y el acoplamiento con partículas sólidas acumulándose es el mismo mecanismo que describe la clausura de un filtro o una alcantarilla con escombros. El modelo no prueba qué pasó exactamente esa tarde. Prueba que es físicamente coherente que un volumen aparentemente pequeño de hielo bloquee casi toda la capacidad de desagüe de una calle, mucho antes de que el aguacero termine.

## Seguir la plata

Acá está el dato que más me pesa. En julio de 2026, tres meses antes del aluvión que remeció a Las Condes, Hacienda recortó **918 millones de pesos** al presupuesto de Senapred. El Presupuesto 2027, discutido mientras el barro todavía se secaba en San Carlos de Apoquindo, sigue esa misma línea: caídas reales de hasta 23% en los programas de evaluación y fiscalización ambiental, y senadores de oposición y de gobierno pidiendo frenar los recortes a adaptación climática. Mientras tanto, los colectores de aguas lluvias de Santiago siguen dimensionados, en buena parte, con periodos de retorno de entre 2 y 10 años, para una ciudad que en los primeros nueve días de octubre registró la lluvia más intensa desde 1930.

No hace falta un modelo DEM para ver la incoherencia. El Estado sabe que el clima cambió, lo dice su propio Centro de Ciencia del Clima, y aun así reduce la plata del organismo que tiene que avisarnos a tiempo. Eso no es austeridad fiscal. Es apostar a que el próximo temporal no nos toque a nosotros.

La reja se puede limpiar en una hora. El presupuesto que decide si alguien la limpia antes de que llueva, no.

Colegio de Ingenieros de Chile A.G. y Libertad y Desarrollo, los invito a debatir esto con datos, no con consignas.
