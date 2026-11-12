# Fase 6 — Victoria con historia, diario de Lumo y final del Faro

## Qué hay
- **`src/datos/victoria.js`** (funciones puras, con `pruebas/victoria.test.mjs`, 10 pruebas):
  - `avance(zona, hecho)`: línea de avance narrativo bajo las estrellas («Faltan 7 retos para llegar hasta Brasa.», «Falta 1 reto…», «¡Has encontrado a Titila!»). No cuenta `m3-p1…p5` ni secretos. Solo Primaria.
  - `celebracion(nivelId, estrellas)`: sin azar. Baile = `[voltereta, brújula, zona, abrazo][(posición en la zona + estrellas) % 4]`. Especial `chispa-al-faro` en el reto-meta de cada chispa y `faro-encendido` en `f-03`. `bichito` en toda victoria de depuración.
  - `faroPequeno(hecho)`: ventanas encendidas = chispas cuyo reto-meta está superado; luz final al superar `f-03`.
  - `paginasDiario(perfil, infantil)`: páginas calculadas desde retos superados y escenas vistas (sin campos nuevos; los perfiles antiguos cargan igual).
- **Pantalla de resultados** (`src/ui/juego.js`): Lumo emocionado con la celebración del reto; el amigo de la zona abraza a Lumo en la variante «abrazo»; Bichito se escabulle riéndose tras una depuración (en Infantil, sin texto); en Primaria, el Faro en pequeño con la ventana nueva (la chispa vuela hasta él y la ventana se enciende a los 1,7 s). Infantil: solo celebración, sin texto de avance ni Faro.
- **Diario de Lumo** (sustituye al «Álbum de recuerdos», en Mi colección): una página por chispa y amigo (Lumo, Conejo, Bruma, Titila, Brasa, Tinta, Destello, lagarto, Ascua, Bit, Píxel, Cometa, 5 de Bichito, 3 de la brújula, guiño, abuela). Las cerradas aparecen en silueta con «???». Las que tienen escena permiten **volver a verla**. Infantil: solo dibujos (sin texto).
- **Final del Faro** (FIN-01…04): ya escenificado con `pasos` desde la Fase 3 (ventanas que se encienden, luz central, estrella). En esta fase no se ha cambiado.

## Reglas respetadas
Estrellas, validación y reglas de los niveles no cambian. Reducir animaciones: sin baile, sin Bichito, sin vuelo de la chispa (el Faro aparece ya con su ventana encendida).

## Comprobado
- 220+ pruebas unitarias; e2e completa; capturas de resultados (meta de zona, depuración, f-03, Infantil) y diario a 1280×800, 1024×768 y 1920×1080 revisadas.

## No comprobado / limitaciones
- La pantalla de resultados con muchas insignias nuevas a la vez (perfil fabricado en las pruebas) desborda en 800 px de alto y hace scroll; en juego real las insignias llegan de una en una.
- Las páginas «Bichito (1–5)» y «La brújula (1–3)» comparten dibujo (Bichito/Lumo) hasta que haya ilustraciones propias (ver `docs/recursos-pendientes.md`, Fase 7).
- Infantil: el diario no tiene voz (las páginas no tienen líneas de voz grabadas); solo dibujo y, si hay escena, se puede volver a ver.
- Móvil estrecho (<760 px) sin probar.
