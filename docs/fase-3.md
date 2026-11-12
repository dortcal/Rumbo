# Fase 3 — Lumo, personajes y motor de escenas

## Qué cambia
- **Lumo redibujado** (`src/ui/arte.js`): una sola figura modular (cuerpo con llama, ojos grandes con brillo, mejillas, bracitos, pies y brújula dorada).
  8 expresiones: `normal, alegre, concentrado, sorprendido, ups, orgulloso, emocionado, tierno`. Ya no hay cara triste: `triste` se muestra como `ups`.
  Los nombres antiguos (`feliz, sorpresa, pensando`) se traducen, así que el resto del código sigue funcionando.
  Poses de brazos (`bajos, arriba, saludo, pecho, recoge`), mirada ajustable, perfil E/O y espalda N. Los 7 disfraces se conservan.
- **Seis chispas con lenguaje propio** (Titila, Brasa, Destello, Ascua, Píxel, Cometa): mismo cuerpo que Lumo, color y rasgo propios, 4 expresiones.
- **Tablero**: Lumo respira, rebota al saltar con estiramiento y aplastamiento, recoge con los brazos hacia delante, se alegra con los brazos arriba al ganar.
- **Motor de escenas** (`src/ui/escena-motor.js`) en lugar de las dos cabezas con burbuja:
  fondo por capas (cielo, lejano, medio, suelo, primer plano) para las 10 zonas, partículas de luz, personajes de cuerpo entero que entran
  (desliza/salta/cae), hablan (rebote + gesto según emoción), actúan (salta, baila, tiembla…), objetos que brillan (pieza de brújula, luz…), cámara y fundidos.
- **Datos**: las escenas pueden llevar `pasos` (ver cabecera de `escenas.js`). 5 escenas ya los usan (C0-01, CAP1-01, C2-01, FIN-01, FIN-02);
  las demás los deducen de sus intervenciones. Saltar, Siguiente y el álbum funcionan igual.
- Con «Reducir animaciones» no hay desplazamientos ni partículas: cortes limpios.

## Qué no está hecho (a propósito, o pendiente)
- Los personajes secundarios que no son chispas (Abuela Chispa, Búho Bruma, Tinta, Lagarto, Conejo, Bit, Bichito) **conservan su dibujo anterior**,
  sin variantes de expresión. Solo Abuela Chispa pierde el halo duro. Se redibujarán en una pasada posterior.
- Las escenas sin `pasos` usan la entrada y las emociones automáticas; no tienen objetos ni cámara.
- Imágenes de historia (`historia/<id>.jpg`) y voz grabada (`audio/voz/<id>.mp3`): el motor aún no las busca; llegan con la fase 5/7.
- La salida de las ayudas visuales (cuadro del Faro, chispa en la meta) llega en la fase 4.

## Pruebas
- `npm test`: 197 correctas (5 nuevas sobre `pasos`).
- Capturas revisadas a 1280×800, 1024×768 y 1920×1080 (Infantil, bosque, montañas, mar, espacio, Faro).
