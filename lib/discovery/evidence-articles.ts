export type EvidenceArticle={section:"supports"|"resources";slug:string;en:{title:string;intro:string;sections:{title:string;body:string}[]};es:{title:string;intro:string;sections:{title:string;body:string}[]};sources:{title:string;url:string}[];related:{section:"supports"|"resources";slug:string}};
export const evidenceArticles:EvidenceArticle[] = [
  {
    "section": "supports",
    "slug": "homework",
    "en": {
      "title": "Homework support in English in Arturo Soria, Madrid",
      "intro": "A calm homework routine is not simply extra time at a desk. Effective support starts by finding out what the task requires, where a child is stuck, and what help their teacher expects.",
      "sections": [
        {
          "title": "What the research actually says",
          "body": "The EEF's evidence review finds a positive average association for homework interventions, but the evidence is less secure for primary pupils and the size of the benefit varies. Feedback and purposeful tasks matter. This is not a prediction of results from any individual after-school programme."
        },
        {
          "title": "A practical homework routine",
          "body": "Agree on a short starting time, read the instructions together, let your child attempt the first step, then ask them to explain what they tried. Record questions for the class teacher rather than completing the work for them."
        },
        {
          "title": "When to seek support",
          "body": "If homework routinely exceeds the school's guidance, causes distress, or reveals repeated gaps in understanding, speak to the teacher first. Ask whether the difficulty is language, subject knowledge, attention or the task itself."
        }
      ]
    },
    "es": {
      "title": "Apoyo con los deberes en inglés en Arturo Soria, Madrid",
      "intro": "Ayudar con los deberes no consiste simplemente en pasar más tiempo ante el cuaderno. Conviene comprender la tarea, identificar el bloqueo y respetar las indicaciones del colegio.",
      "sections": [
        {
          "title": "Qué dice la investigación",
          "body": "La revisión de la EEF encuentra efectos positivos de media para las intervenciones relacionadas con los deberes, pero la evidencia es menos sólida en primaria y los resultados varían. La calidad de la tarea y la devolución del profesor importan. No es una promesa de resultados de una academia."
        },
        {
          "title": "Una rutina útil",
          "body": "Acordad una hora de comienzo, leed juntos las instrucciones, dejad que el niño pruebe el primer paso y preguntadle cómo lo ha intentado. Anotad las dudas para el profesor en lugar de hacerle el trabajo."
        },
        {
          "title": "Cuándo pedir ayuda",
          "body": "Si los deberes superan habitualmente el tiempo recomendado, generan angustia o revelan dificultades repetidas, hablad primero con el docente. Aclarad si el problema es de idioma, conocimientos, atención o de la propia tarea."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Homework",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/homework"
      },
      {
        "title": "EEF: Metacognition and self-regulation",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation"
      }
    ],
    "related": {
      "section": "resources",
      "slug": "homework-without-conflict"
    }
  },
  {
    "section": "supports",
    "slug": "british-curriculum",
    "en": {
      "title": "British curriculum academic support in Madrid",
      "intro": "Families following an English-language or British curriculum need support that fits the child's actual classroom topics and school expectations—not a generic worksheet labelled 'British'.",
      "sections": [
        {
          "title": "Start with the school's curriculum",
          "body": "Ask for the current year group, topics, reading expectations and feedback from the teacher. Different schools and campuses may follow different sequences. An external tutor should not assume every British school uses the same materials."
        },
        {
          "title": "Teach strategies, not just answers",
          "body": "The EEF's metacognition review supports explicitly teaching children to plan, monitor and evaluate their work. For example: identify what the question asks, model one step, let the pupil try and review the result."
        },
        {
          "title": "Keep communication practical",
          "body": "Ask how support will identify a specific gap and communicate progress. For early reading, England's Department for Education reading framework offers useful background, but it is guidance for England rather than a Madrid-wide requirement."
        }
      ]
    },
    "es": {
      "title": "Apoyo escolar para el currículo británico en Madrid",
      "intro": "Las familias con currículo británico o enseñanza en inglés necesitan un apoyo ajustado a los contenidos y expectativas del colegio, no fichas genéricas con una etiqueta británica.",
      "sections": [
        {
          "title": "Partid del programa del colegio",
          "body": "Pedid el curso, los temas actuales, las expectativas de lectura y los comentarios del docente. Los centros y sedes pueden seguir secuencias diferentes; no hay que suponer que todos usan los mismos materiales."
        },
        {
          "title": "Enseñar estrategias, no respuestas",
          "body": "La revisión de la EEF sobre metacognición respalda enseñar explícitamente a planificar, supervisar y evaluar el trabajo: entender la pregunta, modelar un paso, dejar que el alumno lo intente y revisar el resultado."
        },
        {
          "title": "Comunicación concreta",
          "body": "Preguntad qué dificultad específica se trabajará y cómo se comunicará el progreso. El marco de lectura del Gobierno británico puede orientar, pero se aplica a Inglaterra y no es una norma general de Madrid."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Reading comprehension strategies",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/reading-comprehension-strategies"
      },
      {
        "title": "Department for Education (England): The reading framework",
        "url": "https://www.gov.uk/government/publications/the-reading-framework-teaching-the-foundations-of-literacy"
      }
    ],
    "related": {
      "section": "resources",
      "slug": "questions-for-a-school-visit"
    }
  },
  {
    "section": "supports",
    "slug": "mathematics",
    "en": {
      "title": "Primary maths support in English in Madrid",
      "intro": "A child who says 'I'm bad at maths' may be struggling with number concepts, mathematical vocabulary, multi-step instructions or confidence. Those are different starting points.",
      "sections": [
        {
          "title": "Find the precise sticking point",
          "body": "Ask your child to talk through one recent problem. Can they explain what the numbers mean? Can they choose an operation? Does the difficulty appear only when the question is written in English?"
        },
        {
          "title": "Use worked examples carefully",
          "body": "Research on metacognition emphasises modelling thinking aloud and then gradually removing prompts. Show why a method works, invite the child to explain it, and check whether they can use it on a different question."
        },
        {
          "title": "Small groups are not automatically better",
          "body": "EEF reviews suggest targeted small-group tuition can help, especially when aligned with classroom learning. Ask about actual group size, age mix, goals and how the tutor checks understanding."
        }
      ]
    },
    "es": {
      "title": "Refuerzo de matemáticas de primaria en inglés en Madrid",
      "intro": "Un niño que dice «se me dan mal las mates» puede tener dificultades con el sentido numérico, el vocabulario matemático, los problemas de varios pasos o la confianza. No es lo mismo.",
      "sections": [
        {
          "title": "Localizar la dificultad",
          "body": "Pedidle que explique un problema reciente: ¿entiende las cantidades?, ¿sabe elegir la operación?, ¿la dificultad aparece solo cuando el enunciado está en inglés?"
        },
        {
          "title": "Modelar el razonamiento",
          "body": "La investigación sobre metacognición destaca explicar en voz alta cómo se piensa y retirar poco a poco las ayudas. Mostrad por qué funciona un método y comprobad si puede aplicarlo a otro problema."
        },
        {
          "title": "No todos los grupos son iguales",
          "body": "La EEF encuentra beneficios potenciales en tutorías dirigidas en grupos pequeños, especialmente si se coordinan con lo trabajado en clase. Preguntad por tamaño, edades, objetivos y evaluación de comprensión."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Metacognition and self-regulation",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation"
      },
      {
        "title": "EEF: Small group tuition",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition"
      }
    ],
    "related": {
      "section": "resources",
      "slug": "choosing-after-school-support"
    }
  },
  {
    "section": "supports",
    "slug": "english-literacy",
    "en": {
      "title": "English reading comprehension and writing support in Madrid",
      "intro": "Reading words accurately and understanding a text are related but different skills. The first question is whether your child needs help decoding, building vocabulary, making inferences or organising written ideas.",
      "sections": [
        {
          "title": "Reading is more than sounding out",
          "body": "The EEF reviews reading-comprehension strategies such as questioning, predicting, clarifying and summarising. These are most useful when explicitly modelled and practised with suitable texts."
        },
        {
          "title": "Try a five-minute conversation",
          "body": "After reading a short passage, ask: What happened? What clues tell you why? Which word was unfamiliar? Let your child point to evidence in the text rather than guessing what the adult wants."
        },
        {
          "title": "Match support to the stage",
          "body": "If decoding remains difficult, comprehension questions alone may not address the cause. Discuss phonics and reading fluency with the school. The DfE reading framework describes approaches used in England, not a universal rule for every Madrid school."
        }
      ]
    },
    "es": {
      "title": "Apoyo en comprensión lectora y escritura en inglés en Madrid",
      "intro": "Leer palabras correctamente y comprender un texto son capacidades relacionadas, pero distintas. Hay que identificar si la dificultad está en descifrar, el vocabulario, las inferencias o la expresión escrita.",
      "sections": [
        {
          "title": "Leer no es solo pronunciar",
          "body": "La EEF estudia estrategias como preguntar, predecir, aclarar y resumir. Funcionan mejor cuando se enseñan de forma explícita y se practican con textos adecuados."
        },
        {
          "title": "Cinco minutos de conversación",
          "body": "Tras un texto breve, preguntad: ¿qué ocurrió?, ¿qué pistas lo explican?, ¿qué palabra no conocías? Invitad al niño a buscar pruebas en el texto en vez de adivinar la respuesta del adulto."
        },
        {
          "title": "Adaptar la ayuda",
          "body": "Si sigue costando descifrar palabras, las preguntas de comprensión no bastan. Hablad con el colegio sobre fonética y fluidez. El marco de lectura del DfE describe enfoques de Inglaterra, no una norma para todos los centros madrileños."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Reading comprehension strategies",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/reading-comprehension-strategies"
      },
      {
        "title": "Department for Education (England): The reading framework",
        "url": "https://www.gov.uk/government/publications/the-reading-framework-teaching-the-foundations-of-literacy"
      }
    ],
    "related": {
      "section": "resources",
      "slug": "homework-without-conflict"
    }
  },
  {
    "section": "supports",
    "slug": "study-habits",
    "en": {
      "title": "Independent study habits for primary school children",
      "intro": "Independence is taught gradually. A child who needs repeated reminders may benefit from clear steps and feedback rather than another lecture about responsibility.",
      "sections": [
        {
          "title": "Teach a three-step cycle",
          "body": "Before starting, ask 'What is the task and what do I need?' During it, ask 'Is my approach working?' At the end, ask 'What should I check?' This follows the planning, monitoring and evaluation cycle described by the EEF."
        },
        {
          "title": "Remove help gradually",
          "body": "Model the first example, work through another together, then let the child try independently. A short checklist can replace repeated adult instructions."
        },
        {
          "title": "Measure useful progress",
          "body": "Notice whether your child starts more readily, identifies a problem, checks an answer or asks a specific question. Completing a worksheet faster is not the only sign of improvement."
        }
      ]
    },
    "es": {
      "title": "Hábitos de estudio y autonomía en primaria",
      "intro": "La autonomía se enseña poco a poco. Si un niño necesita recordatorios constantes, pueden ayudarle los pasos claros y la retroalimentación más que otra charla sobre responsabilidad.",
      "sections": [
        {
          "title": "Enseñar tres pasos",
          "body": "Antes: «¿Qué tengo que hacer y qué necesito?». Durante: «¿Está funcionando mi método?». Al terminar: «¿Qué debo comprobar?». Es el ciclo de planificación, supervisión y evaluación descrito por la EEF."
        },
        {
          "title": "Retirar la ayuda poco a poco",
          "body": "Mostrad un ejemplo, haced otro juntos y dejad que pruebe solo. Una lista breve puede sustituir los recordatorios continuos."
        },
        {
          "title": "Observar el progreso",
          "body": "Fijaos en si empieza antes, detecta un problema, revisa una respuesta o hace una pregunta concreta. Terminar más rápido no es el único indicador."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Metacognition and self-regulation",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation"
      },
      {
        "title": "EEF: Guidance report on metacognition",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition"
      }
    ],
    "related": {
      "section": "resources",
      "slug": "homework-without-conflict"
    }
  },
  {
    "section": "supports",
    "slug": "igcse-chemistry",
    "en": {
      "title": "IGCSE Chemistry: choosing focused academic support",
      "intro": "IGCSE Chemistry requires close attention to the student's exam board, syllabus, practical-work expectations and command words. Before choosing tuition, check exactly which qualification the school teaches.",
      "sections": [
        {
          "title": "Check the exam specification",
          "body": "Ask the school whether the pupil follows Cambridge, Pearson Edexcel or another specification and which exam series applies. Use that board's current official syllabus and past-paper guidance; topic lists are not interchangeable."
        },
        {
          "title": "Work from misconceptions",
          "body": "Use one recent classroom question to discover whether the problem is chemistry knowledge, mathematical calculation, scientific vocabulary or explaining a result. Targeted teaching is more useful than indiscriminate past papers."
        },
        {
          "title": "Check suitability and availability",
          "body": "This page describes how to evaluate focused Chemistry tuition, not a guarantee that TAA currently runs an IGCSE group. Confirm age suitability, timetable and subject provision before booking."
        }
      ]
    },
    "es": {
      "title": "Química IGCSE: cómo elegir un apoyo académico específico",
      "intro": "Química IGCSE exige conocer la entidad examinadora, el programa, las prácticas y los verbos de examen. Antes de contratar apoyo, comprobad la titulación exacta del centro.",
      "sections": [
        {
          "title": "Comprobar el programa",
          "body": "Preguntad si el alumno sigue Cambridge, Pearson Edexcel u otro programa y a qué convocatoria se presenta. Consultad el temario oficial vigente: las listas de temas no son intercambiables."
        },
        {
          "title": "Partir de errores concretos",
          "body": "Una pregunta reciente puede revelar si falla el concepto químico, el cálculo, el vocabulario científico o la explicación de resultados. Conviene abordar esa dificultad antes de acumular exámenes de práctica."
        },
        {
          "title": "Confirmar la oferta",
          "body": "Esta página explica cómo evaluar el apoyo en Química; no garantiza que TAA tenga ahora un grupo IGCSE activo. Confirmad edades, horarios y disponibilidad antes de reservar."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Small group tuition",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition"
      },
      {
        "title": "EEF: One to one tuition",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/one-to-one-tuition"
      }
    ],
    "related": {
      "section": "resources",
      "slug": "choosing-after-school-support"
    }
  },
  {
    "section": "resources",
    "slug": "homework-without-conflict",
    "en": {
      "title": "Homework without arguments: a practical guide for parents",
      "intro": "If homework ends in tears or arguments, start by changing the routine and understanding the task—not by increasing pressure. Persistent difficulty is a reason to involve the teacher.",
      "sections": [
        {
          "title": "Before the first pencil mark",
          "body": "Offer a short break after school, food or water if needed, and a predictable start. Ask your child to show you what is due and choose one manageable first step. Avoid turning every afternoon into an extended tutoring session."
        },
        {
          "title": "During a difficult moment",
          "body": "Say what you can see without blaming: 'This question is frustrating.' Ask which instruction is unclear. Offer a short reset, then return to a smaller step. If your child cannot attempt the work without adult answers, record that for the teacher."
        },
        {
          "title": "Afterwards: one useful question",
          "body": "Ask 'What helped you get started today?' instead of 'Why did this take so long?' EEF evidence on metacognition supports reflection and explicit strategies, while its homework review emphasises purposeful tasks and feedback."
        },
        {
          "title": "When the pattern continues",
          "body": "Speak to the class teacher about expected time, accessibility and whether the task matches what was taught. For persistent anxiety, distress or suspected additional learning needs, seek appropriate professional guidance rather than assuming more homework will solve it."
        }
      ]
    },
    "es": {
      "title": "Deberes sin discusiones: guía práctica para familias",
      "intro": "Si los deberes acaban en lágrimas o discusiones, empezad por revisar la rutina y comprender la tarea, no por aumentar la presión. Las dificultades persistentes merecen hablarse con el profesor.",
      "sections": [
        {
          "title": "Antes de empezar",
          "body": "Dejad un descanso breve al salir del colegio y fijad un momento previsible. Pedidle que enseñe las tareas y elija un primer paso manejable. No convirtáis cada tarde en una sesión interminable."
        },
        {
          "title": "En un momento difícil",
          "body": "Describid lo que ocurre sin culpar: «Esta pregunta te está frustrando». Averiguad qué instrucción no se entiende. Haced una pausa breve y volved a un paso más pequeño. Si solo puede avanzar con respuestas del adulto, comentadlo con el docente."
        },
        {
          "title": "Después: una pregunta útil",
          "body": "Preguntad «¿qué te ayudó a empezar hoy?» en vez de «¿por qué has tardado tanto?». La EEF destaca la reflexión y las estrategias explícitas, y su revisión de deberes resalta las tareas con propósito y el feedback."
        },
        {
          "title": "Si se repite",
          "body": "Hablad con el profesor sobre el tiempo esperado, la accesibilidad y si el trabajo coincide con lo enseñado. Ante ansiedad persistente o posibles necesidades adicionales, buscad orientación profesional adecuada."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Homework",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/homework"
      },
      {
        "title": "EEF: Parental engagement",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/parental-engagement"
      }
    ],
    "related": {
      "section": "supports",
      "slug": "homework"
    }
  },
  {
    "section": "resources",
    "slug": "choosing-after-school-support",
    "en": {
      "title": "How to choose after-school academic support in Madrid",
      "intro": "A good choice depends on your child's actual difficulty, the quality of instruction and whether the provider can explain how it will communicate with you—not simply the advertised number of hours.",
      "sections": [
        {
          "title": "Five questions worth asking",
          "body": "What specific skill will be supported? Who will teach it? How many children share the session? How does it relate to schoolwork? What feedback will parents receive?"
        },
        {
          "title": "Individual or small group?",
          "body": "The EEF has evidence reviews for both one-to-one and small-group tuition. Their findings concern well-targeted teaching, not a blanket endorsement of any provider. Ask whether your child needs intensive individual attention or benefits from explaining ideas with peers."
        },
        {
          "title": "Look beyond promises",
          "body": "Avoid guaranteed grade increases and claims that one method suits everyone. Ask for a realistic review point and a way to share concerns with the child's school."
        }
      ]
    },
    "es": {
      "title": "Cómo elegir apoyo escolar extraescolar en Madrid",
      "intro": "Una buena elección depende de la dificultad concreta del niño, de cómo se enseña y de cómo se informa a la familia; no solo de las horas anunciadas.",
      "sections": [
        {
          "title": "Cinco preguntas importantes",
          "body": "¿Qué habilidad concreta se trabajará? ¿Quién enseñará? ¿Cuántos niños habrá? ¿Cómo se relaciona con el colegio? ¿Qué información recibirá la familia?"
        },
        {
          "title": "¿Individual o grupo reducido?",
          "body": "La EEF revisa tanto la tutoría individual como la de grupos pequeños. Sus conclusiones se refieren a una enseñanza bien dirigida, no avalan automáticamente a ningún proveedor. Valorad si el niño necesita atención intensiva o se beneficia de hablar con compañeros."
        },
        {
          "title": "Más allá de las promesas",
          "body": "Desconfiad de mejoras de notas garantizadas o métodos universales. Pedid un momento de revisión realista y un canal para trasladar inquietudes al colegio."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Small group tuition",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition"
      },
      {
        "title": "EEF: One to one tuition",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/one-to-one-tuition"
      }
    ],
    "related": {
      "section": "supports",
      "slug": "homework"
    }
  },
  {
    "section": "resources",
    "slug": "international-school-routines",
    "en": {
      "title": "After-school routines for international-school families in Madrid",
      "intro": "International-school afternoons may combine long journeys, homework in another language, sport and family life. A sustainable routine protects rest as well as learning.",
      "sections": [
        {
          "title": "Map the real afternoon",
          "body": "Write down collection time, travel, snack, homework, play and bedtime. Identify which days are already full before adding another commitment."
        },
        {
          "title": "Agree on language support",
          "body": "If homework is in English but adults are more comfortable in Spanish, ask the teacher whether the aim is independent reading, subject understanding or practising English vocabulary. Translating every answer may undermine the intended practice."
        },
        {
          "title": "Use the school as a partner",
          "body": "The EEF's parental-engagement review highlights constructive communication. Ask for clear expectations and report recurring friction, rather than guessing what the teacher wants."
        }
      ]
    },
    "es": {
      "title": "Rutinas de tarde para familias de colegios internacionales en Madrid",
      "intro": "Las tardes pueden combinar desplazamientos, deberes en otro idioma, deporte y vida familiar. Una rutina sostenible protege tanto el descanso como el aprendizaje.",
      "sections": [
        {
          "title": "Dibujar la tarde real",
          "body": "Anotad recogida, trayecto, merienda, deberes, juego y hora de dormir. Detectad los días saturados antes de añadir otra actividad."
        },
        {
          "title": "Acordar el apoyo lingüístico",
          "body": "Si los deberes son en inglés pero los adultos dominan más el español, preguntad si el objetivo es leer con autonomía, comprender la materia o practicar vocabulario. Traducir todas las respuestas puede eliminar parte del ejercicio."
        },
        {
          "title": "El colegio como aliado",
          "body": "La revisión de la EEF sobre participación familiar destaca la comunicación constructiva. Pedid expectativas claras y comentad los conflictos repetidos en vez de adivinar lo que quiere el docente."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Homework",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/homework"
      },
      {
        "title": "EEF: Parental engagement",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/parental-engagement"
      }
    ],
    "related": {
      "section": "supports",
      "slug": "study-habits"
    }
  },
  {
    "section": "resources",
    "slug": "moving-schools-in-madrid",
    "en": {
      "title": "Changing schools in Madrid: a family checklist",
      "intro": "Changing schools is both an administrative process and a learning transition. Publicly funded schools and private or international schools may have different admissions arrangements.",
      "sections": [
        {
          "title": "Check the official admissions route",
          "body": "For publicly funded places, consult the Comunidad de Madrid's current admissions page and the rules for the relevant school year. Do not rely on last year's dates. For independent schools, ask the school directly about availability and application steps."
        },
        {
          "title": "Ask for a learning handover",
          "body": "Request recent reports, subjects studied, language of instruction, support plans where relevant, and any records the new school needs. Ask which curriculum differences may require bridging work."
        },
        {
          "title": "Plan the first six weeks",
          "body": "Confirm the campus address, journey, lunch arrangements, clubs, homework system and contact for pastoral concerns. Arrange an early check-in with the new teacher rather than waiting for a problem."
        }
      ]
    },
    "es": {
      "title": "Cambiar de colegio en Madrid: lista de comprobación",
      "intro": "Cambiar de colegio es un trámite administrativo y una transición educativa. Los centros sostenidos con fondos públicos y los privados o internacionales pueden seguir procedimientos de admisión diferentes.",
      "sections": [
        {
          "title": "Comprobar el procedimiento oficial",
          "body": "Para plazas sostenidas con fondos públicos, consultad la página de admisión de la Comunidad de Madrid y la normativa del curso correspondiente. No reutilicéis plazos de años anteriores. En colegios privados, preguntad directamente por vacantes y solicitudes."
        },
        {
          "title": "Preparar el traspaso académico",
          "body": "Reunid informes recientes, materias cursadas, idioma de enseñanza, planes de apoyo si existen y documentos solicitados. Preguntad por diferencias curriculares que puedan requerir adaptación."
        },
        {
          "title": "Planificar las primeras seis semanas",
          "body": "Confirmad sede, trayecto, comedor, actividades, sistema de deberes y contacto de orientación. Acordad una primera revisión con el docente sin esperar a que surja un problema."
        }
      ]
    },
    "sources": [
      {
        "title": "Comunidad de Madrid: Official school admissions information",
        "url": "https://www.comunidad.madrid/educacion/solicita-tu-admision-educacion-infantil-obligatoria-bachillerato"
      }
    ],
    "related": {
      "section": "supports",
      "slug": "questions-for-a-school-visit"
    }
  },
  {
    "section": "resources",
    "slug": "questions-for-a-school-visit",
    "en": {
      "title": "Questions to ask when visiting a school in Madrid",
      "intro": "A school visit is more useful when you leave with answers about teaching, daily routines and how the school responds when a child needs help—not just impressions of the facilities.",
      "sections": [
        {
          "title": "Curriculum and classroom learning",
          "body": "Which curriculum and language are used in this year group? How is reading taught? What does homework look like at this age? How does the school identify a pupil who is falling behind?"
        },
        {
          "title": "Daily life and wellbeing",
          "body": "Which campus will my child attend? What is the actual school-day timetable? Who should a parent contact about friendships, anxiety or additional learning needs? How does the school communicate with families?"
        },
        {
          "title": "Admissions and practical details",
          "body": "Ask for written confirmation of fees, admissions requirements, transport, lunch, after-school options and the current safeguarding policy. Verify key claims against the school's official documents."
        },
        {
          "title": "Compare schools fairly",
          "body": "Take the same questions to every school. A school with an attractive building may still be a poor fit for a particular child; ask about classroom experience, not just marketing."
        }
      ]
    },
    "es": {
      "title": "Qué preguntar al visitar un colegio en Madrid",
      "intro": "Una visita escolar resulta más útil si salís con respuestas sobre enseñanza, rutinas y apoyo ante dificultades, no solo con impresiones de las instalaciones.",
      "sections": [
        {
          "title": "Currículo y aprendizaje",
          "body": "¿Qué currículo e idioma se usan en este curso? ¿Cómo se enseña a leer? ¿Qué deberes se mandan a esta edad? ¿Cómo se detectan dificultades?"
        },
        {
          "title": "Vida diaria y bienestar",
          "body": "¿A qué sede irá mi hijo? ¿Cuál es el horario real? ¿Con quién hablar sobre amistades, ansiedad o necesidades de apoyo? ¿Cómo se informa a las familias?"
        },
        {
          "title": "Admisión y cuestiones prácticas",
          "body": "Pedid por escrito tarifas, requisitos de admisión, transporte, comedor, extraescolares y política de protección infantil vigente. Contrastad lo importante con documentos oficiales del centro."
        },
        {
          "title": "Comparar con criterio",
          "body": "Llevad las mismas preguntas a cada colegio. Un edificio atractivo no garantiza el mejor encaje; preguntad por la experiencia en el aula, no solo por el folleto."
        }
      ]
    },
    "sources": [
      {
        "title": "EEF: Homework",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/homework"
      },
      {
        "title": "EEF: Parental engagement",
        "url": "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/parental-engagement"
      }
    ],
    "related": {
      "section": "supports",
      "slug": "choosing-after-school-support"
    }
  }
];
export const getEvidenceArticle=(section:string,slug:string)=>evidenceArticles.find(a=>a.section===section&&a.slug===slug);
