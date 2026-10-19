export type Language = "en" | "es"
export type DiscoveryItem = { slug: string; en: string; es: string; enDescription: string; esDescription: string }
export const neighbourhoods: DiscoveryItem[] = [
{slug:"arturo-soria",en:"Arturo Soria",es:"Arturo Soria",enDescription:"Explore after-school routines, local school communities and academic support around Arturo Soria.",esDescription:"Descubre recursos para familias, colegios y apoyo extraescolar en Arturo Soria."},
{slug:"conde-orgaz",en:"Conde Orgaz",es:"Conde Orgaz",enDescription:"A local guide for families navigating school life around Conde Orgaz.",esDescription:"Guía local para familias y vida escolar en Conde Orgaz."},
{slug:"piovera",en:"Piovera",es:"Piovera",enDescription:"School-life resources for families living in Piovera.",esDescription:"Recursos de vida escolar para familias de Piovera."},
{slug:"hortaleza",en:"Hortaleza",es:"Hortaleza",enDescription:"Explore English-speaking academic support and school routines in Hortaleza.",esDescription:"Descubre apoyo académico en inglés y rutinas escolares en Hortaleza."},
{slug:"chamartin",en:"Chamartín",es:"Chamartín",enDescription:"Practical information for international families in Chamartín.",esDescription:"Información práctica para familias internacionales en Chamartín."},
{slug:"canillas",en:"Canillas",es:"Canillas",enDescription:"Discover local education resources and after-school support near Canillas.",esDescription:"Recursos educativos y apoyo extraescolar cerca de Canillas."}
]
export const supports: DiscoveryItem[] = [
{slug:"british-curriculum",en:"British curriculum support",es:"Apoyo al currículo británico",enDescription:"How supplementary academic support can reinforce schoolwork without replacing classroom teaching.",esDescription:"Cómo el apoyo complementario puede reforzar el trabajo escolar sin sustituir las clases."},
{slug:"homework",en:"Homework support",es:"Apoyo con los deberes",enDescription:"A calm routine to approach homework with guidance and growing independence.",esDescription:"Una rutina tranquila para abordar los deberes con orientación y autonomía."},
{slug:"mathematics",en:"Maths confidence",es:"Confianza en matemáticas",enDescription:"Support for practising core mathematical skills and asking questions.",esDescription:"Apoyo para practicar matemáticas y resolver dudas."},
{slug:"english-literacy",en:"English reading and writing",es:"Lectura y escritura en inglés",enDescription:"Build reading comprehension, writing confidence and vocabulary through practice.",esDescription:"Practica comprensión lectora, expresión escrita y vocabulario."},
{slug:"study-habits",en:"Independent study habits",es:"Hábitos de estudio",enDescription:"Help children plan tasks, check their work and take ownership of learning.",esDescription:"Ayuda a los niños a organizar tareas, revisar su trabajo y aprender con autonomía."},
{slug:"igcse-chemistry",en:"IGCSE Chemistry Focus Group",es:"Grupo de Química IGCSE",enDescription:"Explore focused small-group Chemistry support for Years 10–11.",esDescription:"Descubre el apoyo de Química en grupos reducidos para Years 10–11."}
]
export const resources: DiscoveryItem[] = [
{slug:"choosing-after-school-support",en:"Choosing after-school support",es:"Cómo elegir apoyo extraescolar",enDescription:"Questions to ask about group size, curriculum, communication and the child's needs.",esDescription:"Qué preguntar sobre grupos, currículo, comunicación y necesidades del niño."},
{slug:"international-school-routines",en:"International-school family routines",es:"Rutinas para familias internacionales",enDescription:"Practical ways to make school afternoons calmer.",esDescription:"Ideas prácticas para organizar tardes más tranquilas."},
{slug:"homework-without-conflict",en:"Homework without conflict",es:"Deberes sin conflictos",enDescription:"Create a predictable time, a realistic goal and a supportive atmosphere.",esDescription:"Crea un horario previsible, un objetivo realista y un ambiente de apoyo."},
{slug:"moving-schools-in-madrid",en:"Moving schools in Madrid",es:"Cambiar de colegio en Madrid",enDescription:"A checklist of practical questions when changing school communities.",esDescription:"Lista de preguntas prácticas al cambiar de comunidad escolar."},
{slug:"questions-for-a-school-visit",en:"Questions for a school visit",es:"Preguntas para visitar un colegio",enDescription:"Useful questions about curriculum, daily routines and pastoral support.",esDescription:"Preguntas sobre currículo, rutinas diarias y acompañamiento."}
]
export type School = {slug:string;name:string;website:string;area:string;campusNote?:string;verified:boolean}
export const schools: School[] = [
{slug:"hastings-school",name:"Hastings School",website:"https://www.hastingsschool.com/",area:"Arturo Soria / Conde Orgaz",campusNote:"Multiple Madrid campuses; consult the school's official site for the relevant age group and campus.",verified:true}
]
export const sections = {neighbourhoods,supports,resources}
export const translated = (item:DiscoveryItem,lang:Language)=>({title:item[lang],description:lang==="en"?item.enDescription:item.esDescription})
export const root = (lang:Language)=>lang==="es"?"/es/guia":"/guide"
export const sectionLabel = (section:keyof typeof sections,lang:Language)=>({
neighbourhoods:lang==="en"?"Neighbourhoods":"Zonas",
supports:lang==="en"?"Academic support":"Apoyo académico",
resources:lang==="en"?"Parent resources":"Recursos para familias"
})[section]
