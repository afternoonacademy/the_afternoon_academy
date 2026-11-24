export type HomeworkParentGuideContent = {
  title: string;
  intro: string;
  sections: { title: string; paragraphs: string[] }[];
  note: string;
  ctaLabel: string;
};

export const homeworkParentGuide: Record<"en" | "es", HomeworkParentGuideContent> = {
  "en": {
    "title": "When your child struggles with homework",
    "intro": "Five patterns worth noticing, practical things to try, and when to speak to school.",
    "sections": [
      {
        "title": "",
        "paragraphs": [
          "The homework is on the table, but getting started feels harder than the work itself. You offer a reminder, then another. Before long, everyone is frustrated.",
          "If that sounds familiar, start with one question: ‘Which part is difficult for my child?’",
          "We suggest looking for patterns across different evenings, while taking your child’s age, the task and their school’s expectations into account. The observations below are prompts for a conversation, not a test or diagnosis."
        ]
      },
      {
        "title": "Five patterns worth noticing",
        "paragraphs": []
      },
      {
        "title": "1 They cannot explain what they are being asked to do",
        "paragraphs": [
          "Try asking, ‘Can you tell me what you need to do, in your own words?’ Check the instructions together. Is an unfamiliar word getting in the way, or is the method itself unclear? If you are both unsure, mark the question to ask the teacher. You do not need to invent an explanation on the spot."
        ]
      },
      {
        "title": "2 Homework repeatedly takes much longer than the school expects",
        "paragraphs": [
          "Find out the expected time for that particular task. Notice how much time goes into starting, working and getting stuck. If unfinished tasks are building up, make a brief list and contact school to agree priorities. East Sussex County Council recommends noting the time spent and discussing difficulty or workload with the teacher. [4]"
        ]
      },
      {
        "title": "3 They need you to guide almost every step",
        "paragraphs": [
          "Consider how much help is appropriate for their age and the activity. If you find yourself supplying most of the answers, try one prompt: ‘Show me the part you can do.’ Let the teacher know what your child managed independently and where help was needed. EEF guidance supports parents helping with planning and organisation, while directing subject difficulties back to teachers. [5]"
        ]
      },
      {
        "title": "4 The same sticking point keeps returning",
        "paragraphs": [
          "Be specific about what you notice. Is it reading the question, recalling a method, putting an idea into writing, or organising several tasks? Make a note of the exact step and one example to discuss with the teacher. ‘They get stuck choosing how to start these questions’ is a more useful conversation opener than ‘They’re bad at maths.’"
        ]
      },
      {
        "title": "5 Homework regularly ends in frustration or discouragement",
        "paragraphs": [
          "If you hear ‘I can’t do this’ before your child has even started, pause and ask what they are expecting to find difficult. Try returning to one manageable step when things feel calmer. Repeated distress deserves a conversation with school; it should not become a reason to keep extending the homework session."
        ]
      },
      {
        "title": "A small change to try at home",
        "paragraphs": [
          "Choose one change together: a more predictable start, materials ready in one place, or a working spot with fewer interruptions. Education Scotland advises parents to provide time and space, show interest and ask school when they are unsure how to help. You do not need to know every answer to be supportive. [3]",
          "You could also try three short questions:",
          "Before: ‘What will you start with?’",
          "During: ‘What is working, and where are you stuck?’",
          "After: ‘What helped you today?’",
          "These are our parent-friendly adaptations of EEF’s guidance on planning, checking and reflecting on learning. The guidance is primarily for teachers; the questions are conversation starters, not an assessment. [6]"
        ]
      },
      {
        "title": "What the research helps us understand",
        "paragraphs": [
          "In the Department for Education’s October 2025 survey in England, 22% of Key Stage 3 pupils and 21% of Key Stage 4 pupils identified difficulty understanding homework assignments as a barrier to learning outside school. Those findings concern secondary pupils in England; they do not tell us how common the problem is among primary pupils or Madrid families. [1]",
          "The Education Endowment Foundation’s review suggests that homework quality matters more than quantity, and that links to classroom learning and useful feedback matter. It rates the security of the homework evidence as low, so this is guidance for thoughtful decisions, not a guarantee of results. [2]",
          "Our practical starting point: before adding more time, find out what is making the task difficult."
        ]
      },
      {
        "title": "When to speak to the teacher",
        "paragraphs": [
          "You do not need to wait for a poor report. If a pattern keeps returning, share a specific example and ask what support would be useful. A starting message could be:",
          "‘We’ve noticed that this task is difficult to complete independently. This is where they get stuck, and this is the help they need. Is the work taking the time you would expect? What would you suggest we try, and what should we do if they cannot finish?’",
          "If your concerns extend beyond the work itself, ask the school about the appropriate learning-support or pastoral route. Additional tuition is one possible option, and suitability depends on the child’s needs."
        ]
      },
      {
        "title": "How The Afternoon Academy can help",
        "paragraphs": [
          "If your family would welcome some extra support, we’d be happy to talk about what your child is finding difficult.",
          "At The Afternoon Academy in Arturo Soria, qualified teachers offer small-group support with homework, reading, writing and maths. We welcome pupils from Spanish, British and other international school systems. Our aim is to help children understand their work and become more confident tackling it for themselves.",
          "New families can request a free first group session, subject to a suitable place being available. Tell us what your child is working on and we can discuss the right next step together.",
          "Calle Asura 40, Arturo Soria, Madrid."
        ]
      }
    ],
    "note": "Drawing on UK public education guidance and research summaries. The five observations and example questions are TAA’s practical synthesis. Advice should be adapted with your child’s school. Sources checked 24 November 2026. EEF is an independent education charity; the sources do not evaluate or endorse TAA.",
    "ctaLabel": "Request a free first group session"
  },
  "es": {
    "title": "Cuando a tu hijo le cuestan los deberes",
    "intro": "Cinco situaciones en las que fijarte, ideas prácticas para casa y cuándo hablar con el colegio.",
    "sections": [
      {
        "title": "",
        "paragraphs": [
          "Los deberes están sobre la mesa, pero ponerse a hacerlos parece más difícil que el trabajo en sí. Se lo recuerdas una vez, luego otra. Al poco rato, la frustración se ha instalado en casa.",
          "Si te resulta familiar, empieza por una pregunta: «¿Qué parte le está costando a mi hijo o hija?».",
          "Te proponemos fijarte en lo que se repite en distintas tardes, teniendo en cuenta la edad de tu hijo, la tarea y lo que espera su colegio. Las observaciones que siguen sirven para abrir una conversación; no son una prueba ni un diagnóstico."
        ]
      },
      {
        "title": "Cinco situaciones en las que conviene fijarse",
        "paragraphs": []
      },
      {
        "title": "1 No sabe explicar qué le están pidiendo",
        "paragraphs": [
          "Prueba a preguntar: «¿Puedes contarme con tus palabras qué tienes que hacer?». Revisad las instrucciones juntos. ¿Hay alguna palabra que no entiende o no tiene claro cómo resolver la tarea? Si ninguno de los dos lo ve claro, señalad la pregunta para consultarla con su docente. No hace falta improvisar una explicación en ese momento."
        ]
      },
      {
        "title": "2 Los deberes suelen llevarle mucho más tiempo del que espera el colegio",
        "paragraphs": [
          "Averigua cuánto tiempo se espera que dedique a esa tarea concreta. Fíjate en cuánto tarda en empezar, cuánto tiempo trabaja y dónde se atasca. Si se acumulan tareas sin terminar, prepara una lista breve y habla con el colegio para acordar prioridades. El Consejo del Condado de East Sussex recomienda anotar el tiempo dedicado y comentar con el docente las dificultades o la carga de trabajo. [4]"
        ]
      },
      {
        "title": "3 Necesita que le guíes en casi cada paso",
        "paragraphs": [
          "Piensa en cuánta ayuda es adecuada para su edad y para esa actividad. Si te das cuenta de que estás dando casi todas las respuestas, prueba con una indicación: «Enséñame la parte que puedes hacer». Cuenta a su docente qué ha conseguido hacer por su cuenta y dónde ha necesitado ayuda. Las orientaciones de la Education Endowment Foundation (EEF) apoyan que las familias ayuden con la planificación y la organización, y que consulten con los docentes las dificultades relacionadas con la materia. [5]"
        ]
      },
      {
        "title": "4 Se atasca una y otra vez en el mismo punto",
        "paragraphs": [
          "Intenta concretar qué observas. ¿Le cuesta leer la pregunta, recordar cómo se resuelve, poner una idea por escrito u organizar varias tareas? Anota el paso exacto y un ejemplo para comentarlo con su docente. «Se atasca al decidir cómo empezar estas preguntas» permite iniciar una conversación más útil que «Se le dan mal las matemáticas»."
        ]
      },
      {
        "title": "5 Los deberes suelen acabar en frustración o desánimo",
        "paragraphs": [
          "Si oyes «No puedo hacerlo» antes de que tu hijo haya empezado, haz una pausa y pregunta qué cree que le va a resultar difícil. Cuando estéis más tranquilos, probad a retomar un solo paso que pueda abordar. Si el malestar se repite, merece la pena hablar con el colegio; no debería convertirse en un motivo para seguir alargando el tiempo de deberes."
        ]
      },
      {
        "title": "Un pequeño cambio que podéis probar en casa",
        "paragraphs": [
          "Elegid juntos un cambio: una hora de inicio más previsible, tener los materiales preparados en un mismo sitio o trabajar en un lugar con menos interrupciones. Education Scotland aconseja a las familias facilitar tiempo y espacio, mostrar interés y preguntar al colegio cuando no sepan cómo ayudar. No necesitas conocer todas las respuestas para acompañar a tu hijo. [3]",
          "También podéis probar estas tres preguntas breves:",
          "Antes: «¿Por dónde vas a empezar?».",
          "Durante: «¿Qué te está funcionando y dónde te has atascado?».",
          "Después: «¿Qué te ha ayudado hoy?».",
          "Son nuestras adaptaciones para familias de las orientaciones de la EEF sobre planificar, comprobar cómo va el trabajo y reflexionar sobre lo aprendido. Esas orientaciones se dirigen principalmente a docentes; estas preguntas sirven para conversar, no para evaluar. [6]"
        ]
      },
      {
        "title": "Qué nos ayuda a entender la investigación",
        "paragraphs": [
          "En la encuesta de octubre de 2025 del Department for Education, realizada en Inglaterra, el 22 % del alumnado de Key Stage 3 y el 21 % del de Key Stage 4 —etapas de secundaria en Inglaterra— señalaron la dificultad para entender las tareas como una barrera para aprender fuera del colegio. Estos resultados se refieren a alumnado de secundaria en Inglaterra; no indican con qué frecuencia ocurre entre estudiantes de primaria o familias de Madrid. [1]",
          "La revisión de la Education Endowment Foundation sugiere que la calidad de los deberes importa más que la cantidad, y que también importan su relación con lo trabajado en clase y recibir comentarios útiles sobre el trabajo. La EEF califica como baja la solidez del conjunto de estudios sobre los deberes, por lo que estas conclusiones ayudan a tomar decisiones con criterio, pero no garantizan resultados. [2]",
          "Nuestro punto de partida es práctico: antes de dedicar más tiempo, averigua qué está haciendo difícil la tarea."
        ]
      },
      {
        "title": "Cuándo hablar con su docente",
        "paragraphs": [
          "No hace falta esperar a que lleguen malas notas. Si una dificultad se repite, comparte un ejemplo concreto y pregunta qué apoyo podría ser útil. Puedes empezar con un mensaje como este:",
          "«Hemos observado que le cuesta completar esta tarea por su cuenta. Este es el punto en el que se atasca y esta es la ayuda que necesita. ¿Está dedicando el tiempo que esperarías? ¿Qué nos recomendarías probar y qué deberíamos hacer si no consigue terminar?».",
          "Si lo que te preocupa va más allá de la tarea, pregunta al colegio a quién puedes acudir para recibir apoyo educativo o de orientación y bienestar. Las clases de apoyo son una de las opciones posibles, y su idoneidad depende de las necesidades de cada niño."
        ]
      },
      {
        "title": "Cómo puede ayudar The Afternoon Academy",
        "paragraphs": [
          "Si a vuestra familia le vendría bien un poco de apoyo adicional, estaremos encantados de hablar sobre lo que le está costando a vuestro hijo o hija.",
          "En The Afternoon Academy, en Arturo Soria, nuestros docentes cualificados ofrecen apoyo en grupos reducidos con los deberes, la lectura, la escritura y las matemáticas. Acogemos a alumnado de colegios españoles, británicos y de otros sistemas internacionales. Nuestro objetivo es ayudar a los niños a comprender su trabajo y a sentirse más seguros al abordarlo por sí mismos.",
          "Las familias nuevas pueden solicitar una primera sesión en grupo gratuita, siempre que haya una plaza adecuada disponible. Contadnos qué está trabajando vuestro hijo o hija y podremos valorar juntos el siguiente paso.",
          "Calle Asura 40, Arturo Soria, Madrid."
        ]
      }
    ],
    "note": "Este artículo se basa en orientaciones de organismos públicos de educación del Reino Unido y en síntesis de investigación. Las cinco observaciones y las preguntas de ejemplo son una síntesis práctica de TAA. Conviene adaptar los consejos con el colegio de tu hijo. Fuentes consultadas el 24 de noviembre de 2026. La EEF es una organización benéfica independiente dedicada a la educación; las fuentes citadas no evalúan ni avalan a TAA.",
    "ctaLabel": "Solicita una primera sesión en grupo gratuita"
  }
};

export const homeworkParentGuideSources: { title: string; url: string }[] = [
  {
    "title": "Department for Education — Parent pupil and learner voice October 2025",
    "url": "https://www.gov.uk/government/publications/parent-pupil-and-learner-voice-omnibus-surveys-for-2025-to-2026/parent-pupil-and-learner-voice-october-2025"
  },
  {
    "title": "Education Endowment Foundation — Homework",
    "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/homework"
  },
  {
    "title": "Education Scotland — Home learning environment",
    "url": "https://education.gov.scot/parentzone/learning-at-home/home-learning-environment/"
  },
  {
    "title": "East Sussex County Council — Homework",
    "url": "https://thestoppingplace.eastsussex.gov.uk/parents/homework"
  },
  {
    "title": "Education Endowment Foundation — Parental engagement",
    "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/parental-engagement"
  },
  {
    "title": "Education Endowment Foundation — Metacognition and Self Regulated Learning",
    "url": "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition"
  }
];
