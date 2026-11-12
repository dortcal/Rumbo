/*
 * RUMBO — Escenas de la historia «La luz de Lumo» (v2), dirigidas por datos.
 *
 * Cada escena dice cuándo se dispara (antes o después de un reto), para qué etapa, sobre qué fondo y qué frases dice.
 * Las frases viven en voces-es.js (aquí solo su identificador). Guion completo: docs/guion-v2.md.
 *
 * ESTADO (fase 2): los pasos de puesta en escena (entradas, acciones, objetos, cámara, sonido) se añadirán en la fase 3
 * junto con el motor de escenas; hoy cada escena es una lista de intervenciones («lineas») sobre un fondo de zona.
 *
 * Reglas de elegibilidad (función pendientes, pura y probada):
 *   - Infantil solo ve escenas de etapa «infantil»; Primaria, solo las de etapa «primaria».
 *   - Las escenas FIN-* solo se ven en el último reto de la aventura del propio curso (soloFinalCurso).
 *   - «siNoVista»: solo si ese otro identificador no se ha visto (resúmenes «Antes, en RUMBO…»).
 *   - «requiere: guinos»: no se ofrece hasta que exista el guiño visual (fase 4); ver GUINOS_ACTIVOS.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.RumboEscenas = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Se pondrá a true en la fase 4, cuando el Faro del mapa pueda hacer el guiño (corto, corto, largo).
  var GUINOS_ACTIVOS = false;

  var ESCENAS = [
  {
    id: 'C0-01',
    titulo: 'Un vientazo en el valle',
    etapa: 'infantil',
    zona: 'jardin',
    dur: 18,
    dispara: {
      cuando: 'antes',
      nivel: 'i3-01'
    },
    lineas: [
      {
        id: 'c0_01_a',
        emocion: 'sorprendido'
      },
      {
        id: 'c0_01_b',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'BV-01',
    titulo: 'BV-01',
    etapa: 'primaria',
    zona: 'jardin',
    dur: 15,
    dispara: {
      cuando: 'antes',
      nivel: 'i3-01'
    },
    lineas: [
      {
        id: 'bv_01_a',
        emocion: 'normal'
      },
      {
        id: 'bv_01_b',
        emocion: 'normal'
      },
      {
        id: 'bv_01_c',
        emocion: 'normal'
      },
      {
        id: 'bv_01_d',
        emocion: 'normal'
      },
      {
        id: 'bv_01_e',
        emocion: 'normal'
      },
      {
        id: 'bv_01_f',
        emocion: 'normal'
      }
    ]
  },
  {
    id: 'BV-02',
    titulo: 'BV-02',
    etapa: 'primaria',
    zona: 'jardin',
    dur: 15,
    dispara: {
      cuando: 'antes',
      nivel: 'i3-02'
    },
    lineas: [
      {
        id: 'bv_02_a',
        emocion: 'normal'
      },
      {
        id: 'bv_02_b',
        emocion: 'normal'
      }
    ]
  },
  {
    id: 'BV-03',
    titulo: 'BV-03',
    etapa: 'primaria',
    zona: 'jardin',
    dur: 15,
    dispara: {
      cuando: 'antes',
      nivel: 'i3-04'
    },
    lineas: [
      {
        id: 'bv_03_a',
        emocion: 'normal'
      },
      {
        id: 'bv_03_b',
        emocion: 'normal'
      }
    ]
  },
  {
    id: 'BV-04',
    titulo: 'BV-04',
    etapa: 'primaria',
    zona: 'jardin',
    dur: 15,
    dispara: {
      cuando: 'antes',
      nivel: 'i3-05'
    },
    lineas: [
      {
        id: 'bv_04_a',
        emocion: 'normal'
      },
      {
        id: 'bv_04_b',
        emocion: 'normal'
      }
    ]
  },
  {
    id: 'GC-0',
    titulo: 'Una luz que parpadea',
    etapa: 'infantil',
    zona: 'jardin',
    dur: 6,
    dispara: {
      cuando: 'despues',
      nivel: 'i3-01'
    },
    lineas: [
      {
        id: 'gc_0_a',
        emocion: 'sorprendido'
      }
    ],
    requiere: 'guinos'
  },
  {
    id: 'BV-05',
    titulo: 'BV-05',
    etapa: 'primaria',
    zona: 'jardin',
    dur: 15,
    dispara: {
      cuando: 'despues',
      nivel: 'i3-05'
    },
    lineas: [
      {
        id: 'bv_05_a',
        emocion: 'normal'
      },
      {
        id: 'bv_05_b',
        emocion: 'normal'
      },
      {
        id: 'bv_05_c',
        emocion: 'normal'
      },
      {
        id: 'bv_05_d',
        emocion: 'normal'
      }
    ]
  },
  {
    id: 'C0-02',
    titulo: 'Conejo y la flor',
    etapa: 'infantil',
    zona: 'jardin',
    dur: 20,
    dispara: {
      cuando: 'despues',
      nivel: 'i3-05'
    },
    lineas: [
      {
        id: 'c0_02_a',
        emocion: 'alegre'
      },
      {
        id: 'c0_02_b',
        emocion: 'tierno'
      }
    ]
  },
  {
    id: 'C0-03',
    titulo: 'El camino de los animales',
    etapa: 'infantil',
    zona: 'granja',
    dur: 20,
    dispara: {
      cuando: 'despues',
      nivel: 'i4-05'
    },
    lineas: [
      {
        id: 'c0_03_b',
        emocion: 'emocionado'
      },
      {
        id: 'c0_03_a',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'C0-04',
    titulo: 'Mira, mi casa',
    etapa: 'infantil',
    zona: 'playa',
    dur: 22,
    dispara: {
      cuando: 'despues',
      nivel: 'i5-05'
    },
    lineas: [
      {
        id: 'c0_04_a',
        emocion: 'tierno'
      },
      {
        id: 'c0_04_b',
        emocion: 'emocionado'
      }
    ]
  },
  {
    id: 'C1-01',
    titulo: 'El bosque que parpadea',
    etapa: 'primaria',
    zona: 'bosque',
    dur: 30,
    dispara: {
      cuando: 'antes',
      nivel: 'm1-01'
    },
    lineas: [
      {
        id: 'c1_01_b',
        emocion: 'sereno'
      },
      {
        id: 'c1_01_c',
        emocion: 'ups'
      },
      {
        id: 'c1_01_a',
        emocion: 'sereno'
      },
      {
        id: 'c1_01_d',
        emocion: 'tierno'
      },
      {
        id: 'c1_01_e',
        emocion: 'emocionado'
      }
    ]
  },
  {
    id: 'GC-1',
    titulo: 'GC-1',
    etapa: 'primaria',
    zona: 'bosque',
    dur: 6,
    dispara: {
      cuando: 'despues',
      nivel: 'm1-01'
    },
    lineas: [
      {
        id: 'gc_1_a',
        emocion: 'sorprendido'
      }
    ],
    requiere: 'guinos'
  },
  {
    id: 'CAP1-A',
    titulo: 'La lucecita del arroyo',
    etapa: 'primaria',
    zona: 'bosque',
    dur: 28,
    dispara: {
      cuando: 'despues',
      nivel: 'm1-13'
    },
    lineas: [
      {
        id: 'cap1_a_a',
        emocion: 'tierno'
      },
      {
        id: 'cap1_a_b',
        emocion: 'alegre'
      },
      {
        id: 'cap1_a_c',
        emocion: 'alegre'
      },
      {
        id: 'cap1_a_d',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'BR-2',
    titulo: 'La gorra de Bruma',
    etapa: 'primaria',
    zona: 'bosque',
    dur: 15,
    dispara: {
      cuando: 'despues',
      nivel: 'm1-13'
    },
    lineas: [
      {
        id: 'br_2_a',
        emocion: 'sereno'
      },
      {
        id: 'br_2_b',
        emocion: 'tierno'
      },
      {
        id: 'br_2_c',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'C1-06',
    titulo: 'La voz de la cumbre',
    etapa: 'primaria',
    zona: 'montanas',
    dur: 22,
    dispara: {
      cuando: 'antes',
      nivel: 'm1-14'
    },
    lineas: [
      {
        id: 'c1_06_a',
        emocion: 'terco'
      },
      {
        id: 'c1_06_b',
        emocion: 'alegre'
      },
      {
        id: 'c1_06_c',
        emocion: 'terco'
      },
      {
        id: 'c1_06_d',
        emocion: 'tierno'
      }
    ]
  },
  {
    id: 'C1-03',
    titulo: 'Siempre lo mismo',
    etapa: 'primaria',
    zona: 'montanas',
    dur: 28,
    dispara: {
      cuando: 'antes',
      nivel: 'm1-15'
    },
    lineas: [
      {
        id: 'c1_03_b',
        emocion: 'ups'
      },
      {
        id: 'c1_03_a',
        emocion: 'concentrado'
      },
      {
        id: 'c1_04_a',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'C1-02',
    titulo: '¿Quién ha movido las tarjetas?',
    etapa: 'primaria',
    zona: 'montanas',
    dur: 20,
    dispara: {
      cuando: 'antes',
      nivel: 'm1-18'
    },
    lineas: [
      {
        id: 'c1_02_a',
        emocion: 'travieso'
      },
      {
        id: 'c1_02_b',
        emocion: 'sorprendido'
      },
      {
        id: 'c1_02_c',
        emocion: 'concentrado'
      }
    ]
  },
  {
    id: 'CAP1-01',
    titulo: 'La primera luz',
    etapa: 'primaria',
    zona: 'montanas',
    dur: 32,
    dispara: {
      cuando: 'despues',
      nivel: 'm1-25'
    },
    lineas: [
      {
        id: 'cap1_01_a',
        emocion: 'terco'
      },
      {
        id: 'cap1_01_b',
        emocion: 'orgulloso'
      },
      {
        id: 'c1_05_a',
        emocion: 'emocionado'
      },
      {
        id: 'cap1_01_c',
        emocion: 'emocionado'
      },
      {
        id: 'cap1_01_d',
        emocion: 'emocionado'
      },
      {
        id: 'cap1_01_e',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'CAP1-02',
    titulo: 'Una lucecita para Bichito',
    etapa: 'primaria',
    zona: 'montanas',
    dur: 18,
    dispara: {
      cuando: 'despues',
      nivel: 'm1-25'
    },
    lineas: [
      {
        id: 'cap1_02_a',
        emocion: 'tierno'
      },
      {
        id: 'cap1_02_b',
        emocion: 'tierno'
      },
      {
        id: 'cap1_02_c',
        emocion: 'tierno'
      }
    ]
  },
  {
    id: 'CAP1-03',
    titulo: 'Fin del capítulo 1 y avance',
    etapa: 'primaria',
    zona: 'montanas',
    dur: 15,
    dispara: {
      cuando: 'despues',
      nivel: 'm1-25'
    },
    lineas: [
      {
        id: 'cap1_03_a',
        emocion: 'alegre'
      },
      {
        id: 'cap1_03_b',
        emocion: 'emocionado'
      }
    ],
    tipo: 'creditos',
    creditos: {
      titulo: 'Capítulo 1 · La primera luz',
      filas: [
        [
          'Lumo',
          'La chispa que busca su camino'
        ],
        [
          'Búho Bruma',
          'Bosque encantado'
        ],
        [
          'Titila',
          'Rescatada en el bosque'
        ],
        [
          'Brasa',
          'Rescatada en las montañas'
        ],
        [
          'Bichito',
          'El fallo que nos sigue'
        ]
      ]
    }
  },
  {
    id: 'AR-2',
    titulo: 'Antes, en RUMBO… (hasta el mar)',
    etapa: 'primaria',
    zona: 'faro',
    dur: 12,
    dispara: {
      cuando: 'antes',
      nivel: 'm2-01'
    },
    lineas: [
      {
        id: 'ar_2_a',
        emocion: 'normal'
      },
      {
        id: 'ar_2_b',
        emocion: 'normal'
      },
      {
        id: 'ar_2_c',
        emocion: 'orgulloso'
      },
      {
        id: 'ar_2_d',
        emocion: 'alegre'
      }
    ],
    siNoVista: 'CAP1-03'
  },
  {
    id: 'C2-01',
    titulo: 'Todo funciona con instrucciones',
    etapa: 'primaria',
    zona: 'mar',
    dur: 30,
    dispara: {
      cuando: 'antes',
      nivel: 'm2-01'
    },
    lineas: [
      {
        id: 'c2_01_a',
        emocion: 'alegre'
      },
      {
        id: 'c2_01_b',
        emocion: 'emocionado'
      },
      {
        id: 'c2_01_c',
        emocion: 'alegre'
      },
      {
        id: 'c2_01_d',
        emocion: 'alegre'
      },
      {
        id: 'c2_01_e',
        emocion: 'emocionado'
      }
    ]
  },
  {
    id: 'GC-2',
    titulo: 'GC-2',
    etapa: 'primaria',
    zona: 'mar',
    dur: 6,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-08'
    },
    lineas: [
      {
        id: 'gc_2_a',
        emocion: 'concentrado'
      }
    ],
    requiere: 'guinos'
  },
  {
    id: 'C2-02',
    titulo: 'Una receta, muchas veces',
    etapa: 'primaria',
    zona: 'mar',
    dur: 22,
    dispara: {
      cuando: 'antes',
      nivel: 'm2-11'
    },
    lineas: [
      {
        id: 'c2_02_b',
        emocion: 'ups'
      },
      {
        id: 'c2_02_a',
        emocion: 'alegre'
      },
      {
        id: 'c2_02_c',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'CAP2-A',
    titulo: 'Destello se esconde',
    etapa: 'primaria',
    zona: 'mar',
    dur: 28,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-13'
    },
    lineas: [
      {
        id: 'cap2_a_a',
        emocion: 'alegre'
      },
      {
        id: 'cap2_a_b',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'TIN-2',
    titulo: 'El camino de luz',
    etapa: 'primaria',
    zona: 'mar',
    dur: 15,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-13'
    },
    lineas: [
      {
        id: 'tin_2_a',
        emocion: 'emocionado'
      },
      {
        id: 'tin_2_b',
        emocion: 'tierno'
      },
      {
        id: 'tin_2_c',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'C2-03',
    titulo: 'El lagarto que no cabe',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 30,
    dispara: {
      cuando: 'antes',
      nivel: 'm2-14'
    },
    lineas: [
      {
        id: 'c2_03_a',
        emocion: 'sereno'
      },
      {
        id: 'c2_03_b',
        emocion: 'sorprendido'
      },
      {
        id: 'c2_03_c',
        emocion: 'sereno'
      },
      {
        id: 'c2_03_d',
        emocion: 'tierno'
      },
      {
        id: 'c2_03_e',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'B2-1',
    titulo: 'Alguien nos sigue',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 15,
    dispara: {
      cuando: 'antes',
      nivel: 'm2-17'
    },
    lineas: [
      {
        id: 'c2_04_a',
        emocion: 'concentrado'
      },
      {
        id: 'b2_1_a',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'B2-2',
    titulo: 'El fallo que abrió un camino',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 18,
    dispara: {
      cuando: 'antes',
      nivel: 'm2-22'
    },
    lineas: [
      {
        id: 'b2_2_a',
        emocion: 'ups'
      },
      {
        id: 'b2_2_b',
        emocion: 'divertido'
      },
      {
        id: 'b2_2_c',
        emocion: 'emocionado'
      }
    ]
  },
  {
    id: 'CAP2-B',
    titulo: 'Ascua, la gruñona',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 32,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-25'
    },
    lineas: [
      {
        id: 'cap2_b_a',
        emocion: 'tierno'
      },
      {
        id: 'cap2_b_b',
        emocion: 'tierno'
      },
      {
        id: 'cap2_b_c',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'CAP2-01',
    titulo: 'El Faro contesta más fuerte',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 30,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-25'
    },
    lineas: [
      {
        id: 'cap2_01_a',
        emocion: 'sereno'
      },
      {
        id: 'cap2_01_b',
        emocion: 'alegre'
      },
      {
        id: 'cap2_01_c',
        emocion: 'emocionado'
      },
      {
        id: 'cap2_01_d',
        emocion: 'sereno'
      }
    ]
  },
  {
    id: 'CAP2-02',
    titulo: 'La pieza que volvió',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 18,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-25'
    },
    lineas: [
      {
        id: 'cap2_02_a',
        emocion: 'sorprendido'
      },
      {
        id: 'c2_05_a',
        emocion: 'tierno'
      }
    ]
  },
  {
    id: 'CAP2-03',
    titulo: 'Fin del capítulo 2 y avance',
    etapa: 'primaria',
    zona: 'volcan',
    dur: 15,
    dispara: {
      cuando: 'despues',
      nivel: 'm2-25'
    },
    lineas: [
      {
        id: 'cap2_03_a',
        emocion: 'literal'
      },
      {
        id: 'cap2_03_b',
        emocion: 'alegre'
      }
    ],
    tipo: 'creditos',
    creditos: {
      titulo: 'Capítulo 2 · El corazón del volcán',
      filas: [
        [
          'Tinta',
          'Mundo submarino'
        ],
        [
          'Destello',
          'Rescatado en el mar'
        ],
        [
          'Lagarto gigante',
          'Isla volcánica'
        ],
        [
          'Ascua',
          'Rescatada en el volcán'
        ],
        [
          'Bichito',
          'Nos devolvió una pieza'
        ]
      ]
    }
  },
  {
    id: 'AR-3',
    titulo: 'Antes, en RUMBO… (hasta la ciudad)',
    etapa: 'primaria',
    zona: 'faro',
    dur: 15,
    dispara: {
      cuando: 'antes',
      nivel: 'm3-p1'
    },
    lineas: [
      {
        id: 'ar_3_a',
        emocion: 'normal'
      },
      {
        id: 'ar_3_b',
        emocion: 'normal'
      },
      {
        id: 'ar_3_c',
        emocion: 'orgulloso'
      },
      {
        id: 'ar_3_d',
        emocion: 'alegre'
      },
      {
        id: 'ar_3_e',
        emocion: 'emocionado'
      }
    ],
    siNoVista: 'CAP2-03',
    marca: [
      'AR-2'
    ]
  },
  {
    id: 'C3-01',
    titulo: 'La ciudad sin energía',
    etapa: 'primaria',
    zona: 'ciudad',
    dur: 30,
    dispara: {
      cuando: 'antes',
      nivel: 'm3-p1'
    },
    lineas: [
      {
        id: 'c3_01_b',
        emocion: 'literal'
      },
      {
        id: 'c3_01_c',
        emocion: 'alegre'
      },
      {
        id: 'c3_01_d',
        emocion: 'literal'
      },
      {
        id: 'c3_01_e',
        emocion: 'literal'
      },
      {
        id: 'c3_01_f',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'BI-3',
    titulo: 'Bichito quiere ayudar',
    etapa: 'primaria',
    zona: 'ciudad',
    dur: 28,
    dispara: {
      cuando: 'antes',
      nivel: 'm3-04'
    },
    lineas: [
      {
        id: 'bi_3_a',
        emocion: 'ilusionado'
      },
      {
        id: 'bi_3_b',
        emocion: 'literal'
      },
      {
        id: 'bi_3_c',
        emocion: 'concentrado'
      },
      {
        id: 'bi_3_d',
        emocion: 'sorprendido'
      }
    ]
  },
  {
    id: 'GC-3',
    titulo: 'GC-3',
    etapa: 'primaria',
    zona: 'ciudad',
    dur: 6,
    dispara: {
      cuando: 'despues',
      nivel: 'm3-05'
    },
    lineas: [
      {
        id: 'gc_3_a',
        emocion: 'emocionado'
      }
    ],
    requiere: 'guinos'
  },
  {
    id: 'C3-02',
    titulo: 'Observa, decide, actúa',
    etapa: 'primaria',
    zona: 'ciudad',
    dur: 25,
    dispara: {
      cuando: 'antes',
      nivel: 'm3-06'
    },
    lineas: [
      {
        id: 'c3_01_a',
        emocion: 'literal'
      },
      {
        id: 'c3_02_a',
        emocion: 'concentrado'
      },
      {
        id: 'c3_02_b',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'CAP3-A',
    titulo: 'Píxel entre los cables',
    etapa: 'primaria',
    zona: 'ciudad',
    dur: 28,
    dispara: {
      cuando: 'despues',
      nivel: 'm3-13'
    },
    lineas: [
      {
        id: 'cap3_a_a',
        emocion: 'curioso'
      },
      {
        id: 'cap3_a_b',
        emocion: 'literal'
      },
      {
        id: 'cap3_a_c',
        emocion: 'alegre'
      },
      {
        id: 'cap3_a_d',
        emocion: 'curioso'
      },
      {
        id: 'cap3_a_e',
        emocion: 'orgulloso'
      }
    ]
  },
  {
    id: 'C3-04',
    titulo: 'Rumbo a la estación',
    etapa: 'primaria',
    zona: 'espacio',
    dur: 20,
    dispara: {
      cuando: 'antes',
      nivel: 'm3-14'
    },
    lineas: [
      {
        id: 'c3_04_b',
        emocion: 'literal'
      },
      {
        id: 'c3_04_c',
        emocion: 'sorprendido'
      },
      {
        id: 'c3_04_d',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'BI-4a',
    titulo: 'Una chispa sin luz',
    etapa: 'primaria',
    zona: 'espacio',
    dur: 30,
    dispara: {
      cuando: 'despues',
      nivel: 'm3-21'
    },
    lineas: [
      {
        id: 'c3_03_a',
        emocion: 'sincero'
      },
      {
        id: 'bi_4a_a',
        emocion: 'sorprendido'
      },
      {
        id: 'bi_4a_b',
        emocion: 'sincero'
      },
      {
        id: 'bi_4a_c',
        emocion: 'tierno'
      }
    ]
  },
  {
    id: 'BI-4b',
    titulo: 'Un amigo más',
    etapa: 'primaria',
    zona: 'espacio',
    dur: 16,
    dispara: {
      cuando: 'despues',
      nivel: 'm3-21'
    },
    lineas: [
      {
        id: 'c3_04_a',
        emocion: 'tierno'
      },
      {
        id: 'bi_4b_a',
        emocion: 'alegre'
      },
      {
        id: 'bi_4b_b',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'CAP3-B',
    titulo: 'Cometa y el reactor',
    etapa: 'primaria',
    zona: 'espacio',
    dur: 32,
    dispara: {
      cuando: 'despues',
      nivel: 'm3-25'
    },
    lineas: [
      {
        id: 'cap3_b_a',
        emocion: 'soñador'
      },
      {
        id: 'cap3_b_b',
        emocion: 'tierno'
      },
      {
        id: 'cap3_b_c',
        emocion: 'soñador'
      },
      {
        id: 'cap3_b_d',
        emocion: 'literal'
      },
      {
        id: 'c3_05_a',
        emocion: 'emocionado'
      }
    ]
  },
  {
    id: 'BIT-2',
    titulo: 'La antena de Bit',
    etapa: 'primaria',
    zona: 'espacio',
    dur: 16,
    dispara: {
      cuando: 'despues',
      nivel: 'm3-25'
    },
    lineas: [
      {
        id: 'bit_2_a',
        emocion: 'alegre'
      },
      {
        id: 'bit_2_b',
        emocion: 'literal'
      },
      {
        id: 'bit_2_c',
        emocion: 'alegre'
      }
    ]
  },
  {
    id: 'CF-01',
    titulo: 'La brújula completa',
    etapa: 'primaria',
    zona: 'faro',
    dur: 28,
    dispara: {
      cuando: 'antes',
      nivel: 'f-01'
    },
    lineas: [
      {
        id: 'cf_01_a',
        emocion: 'emocionado'
      },
      {
        id: 'cf_01_b',
        emocion: 'orgulloso'
      },
      {
        id: 'cf_01_c',
        emocion: 'ilusionado'
      }
    ]
  },
  {
    id: 'CF-02',
    titulo: 'Todos a sus puestos',
    etapa: 'primaria',
    zona: 'faro',
    dur: 20,
    dispara: {
      cuando: 'antes',
      nivel: 'f-03'
    },
    lineas: [
      {
        id: 'cf_02_a',
        emocion: 'orgulloso'
      },
      {
        id: 'cf_02_b',
        emocion: 'concentrado'
      }
    ]
  },
  {
    id: 'FIN-01',
    titulo: 'El Faro se enciende',
    etapa: 'primaria',
    zona: 'faro',
    dur: 35,
    dispara: {
      cuando: 'despues',
      nivel: 'f-03'
    },
    lineas: [
      {
        id: 'fin_01_a',
        emocion: 'concentrado'
      },
      {
        id: 'fin_01_b',
        emocion: 'emocionado'
      },
      {
        id: 'fin_01_c',
        emocion: 'ilusionado'
      },
      {
        id: 'fin_01_d',
        emocion: 'tierno'
      }
    ],
    soloFinalCurso: true
  },
  {
    id: 'FIN-02',
    titulo: 'La abuela Chispa',
    etapa: 'primaria',
    zona: 'faro',
    dur: 35,
    dispara: {
      cuando: 'despues',
      nivel: 'f-03'
    },
    lineas: [
      {
        id: 'cf_03_a',
        emocion: 'serena'
      },
      {
        id: 'cf_03_b',
        emocion: 'sorprendido'
      },
      {
        id: 'cf_03_c',
        emocion: 'serena'
      },
      {
        id: 'fin_02_a',
        emocion: 'tierno'
      },
      {
        id: 'fin_02_b',
        emocion: 'tierna'
      }
    ],
    soloFinalCurso: true
  },
  {
    id: 'FIN-03',
    titulo: 'Gracias por encender el Faro',
    etapa: 'primaria',
    zona: 'faro',
    dur: null,
    dispara: {
      cuando: 'despues',
      nivel: 'f-03'
    },
    lineas: [],
    soloFinalCurso: true,
    tipo: 'creditos',
    creditos: {
      titulo: 'Gracias por encender el Faro',
      filas: [
        [
          'Búho Bruma',
          'Bosque encantado · «Las luciérnagas hablaban en orden.»'
        ],
        [
          'Brasa',
          'Reino de las montañas · «Subir juntos es más divertido.»'
        ],
        [
          'Tinta',
          'Mundo submarino · «Una receta se usa muchas veces.»'
        ],
        [
          'Lagarto gigante',
          'Isla volcánica · «Hasta un fallo puede abrir un camino.»'
        ],
        [
          'Bit',
          'Ciudad tecnológica · «Observa, decide, actúa.»'
        ],
        [
          'Cometa',
          'Mundo espacial · «Los errores también necesitan amigos.»'
        ],
        [
          'Abuela Chispa',
          'El Faro Mayor · La guardiana del Faro'
        ],
        [
          'Bichito',
          'El Faro Mayor · El fallo que volvió a brillar'
        ]
      ]
    }
  },
  {
    id: 'FIN-04',
    titulo: 'Ahora te toca a ti',
    etapa: 'primaria',
    zona: 'faro',
    dur: 20,
    dispara: {
      cuando: 'despues',
      nivel: 'f-03'
    },
    lineas: [
      {
        id: 'cf_05_a',
        emocion: 'alegre'
      },
      {
        id: 'fin_04_a',
        emocion: 'emocionado'
      }
    ],
    soloFinalCurso: true,
    final: true
  }
];

  // Hitos del guiño de la abuela (corto, corto, largo). «respuesta»: el Faro contesta; «encendido»: el final.
  var GUINOS = [
  {
    id: 'G-01',
    tipo: 'guino',
    infantil: 'i3-01',
    primaria: 'm1-01'
  },
  {
    id: 'G-02',
    tipo: 'guino',
    primaria: 'm1-13'
  },
  {
    id: 'G-03',
    tipo: 'guino',
    infantil: 'i5-04',
    primaria: 'm1-17'
  },
  {
    id: 'G-I2',
    tipo: 'guino',
    infantil: 'i4-05'
  },
  {
    id: 'R-1',
    tipo: 'respuesta',
    primaria: 'm1-25'
  },
  {
    id: 'G-04',
    tipo: 'guino',
    primaria: 'm2-08'
  },
  {
    id: 'G-05',
    tipo: 'guino',
    primaria: 'm2-13'
  },
  {
    id: 'R-2',
    tipo: 'respuesta',
    primaria: 'm2-25'
  },
  {
    id: 'G-06',
    tipo: 'guino',
    primaria: 'm3-05'
  },
  {
    id: 'G-07',
    tipo: 'guino',
    primaria: 'm3-13'
  },
  {
    id: 'G-08',
    tipo: 'guino',
    primaria: 'm3-25'
  },
  {
    id: 'R-3',
    tipo: 'encendido',
    primaria: 'f-03'
  }
];

  // Las seis chispas de la familia de Lumo: se rescatan en el último reto de su zona y encienden una ventana del Faro.
  var CHISPAS = [
  {
    id: 'titila',
    nombre: 'Titila',
    zona: 'bosque',
    meta: 'm1-13',
    ventana: 1,
    anuncio: 'C1-01',
    rescate: 'CAP1-A'
  },
  {
    id: 'brasa',
    nombre: 'Brasa',
    zona: 'montanas',
    meta: 'm1-25',
    ventana: 2,
    anuncio: 'C1-06',
    rescate: 'CAP1-01'
  },
  {
    id: 'destello',
    nombre: 'Destello',
    zona: 'mar',
    meta: 'm2-13',
    ventana: 3,
    anuncio: 'C2-01',
    rescate: 'CAP2-A'
  },
  {
    id: 'ascua',
    nombre: 'Ascua',
    zona: 'volcan',
    meta: 'm2-25',
    ventana: 4,
    anuncio: 'C2-03',
    rescate: 'CAP2-B'
  },
  {
    id: 'pixel',
    nombre: 'Píxel',
    zona: 'ciudad',
    meta: 'm3-13',
    ventana: 5,
    anuncio: 'C3-01',
    rescate: 'CAP3-A'
  },
  {
    id: 'cometa',
    nombre: 'Cometa',
    zona: 'espacio',
    meta: 'm3-25',
    ventana: 6,
    anuncio: 'C3-04',
    rescate: 'CAP3-B'
  }
];

  var POR_ID = {};
  ESCENAS.forEach(function (e) { POR_ID[e.id] = e; });

  function zonaDe(id) { return POR_ID[id] ? POR_ID[id].zona : 'jardin'; }
  function lineasDe(id) { return POR_ID[id] ? POR_ID[id].lineas.map(function (l) { return l.id; }) : []; }

  /*
   * Escenas que corresponde reproducir ahora.
   * o: { cuando: 'antes'|'despues', nivel, infantil: bool, vistas: {id: true}, esFinalDelCurso: bool, guinosActivos: bool }
   */
  function pendientes(o) {
    var vistas = o.vistas || {};
    var activos = o.guinosActivos == null ? GUINOS_ACTIVOS : o.guinosActivos;
    return ESCENAS.filter(function (e) {
      if (e.dispara.cuando !== o.cuando || e.dispara.nivel !== o.nivel) return false;
      if ((e.etapa === 'infantil') !== !!o.infantil) return false;
      if (e.soloFinalCurso && !o.esFinalDelCurso) return false;
      if (e.requiere === 'guinos' && !activos) return false;
      if (e.siNoVista && vistas[e.siNoVista]) return false;
      return !vistas[e.id];
    }).map(function (e) { return e.id; });
  }

  return { ESCENAS: ESCENAS, POR_ID: POR_ID, GUINOS: GUINOS, CHISPAS: CHISPAS, zonaDe: zonaDe, lineasDe: lineasDe, pendientes: pendientes,
    get GUINOS_ACTIVOS() { return GUINOS_ACTIVOS; } };
});
