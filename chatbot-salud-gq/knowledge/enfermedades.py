"""
Base de conocimiento: Enfermedades prevalentes en Guinea Ecuatorial.
Fuentes: OMS, Ministerio de Sanidad y Bienestar Social de GQ.
"""

ENFERMEDADES = {
    "malaria": {
        "nombre_es": "Malaria (Paludismo)",
        "nombre_fang": "Ebo'o / Okiri",
        "descripcion_es": (
            "La malaria es la enfermedad más común en Guinea Ecuatorial. "
            "Es transmitida por la picadura del mosquito Anopheles, "
            "especialmente durante la temporada de lluvias."
        ),
        "descripcion_fang": (
            "Ebo'o ane eki nlem e Guinea Ecuatorial. "
            "Mosquito Anopheles ane a bele ebo'o. "
            "A yem nnam ngon mvura."
        ),
        "sintomas_es": [
            "Fiebre alta y escalofríos",
            "Dolor de cabeza intenso",
            "Sudoración excesiva",
            "Náuseas y vómitos",
            "Dolor muscular y articular",
            "Fatiga extrema",
            "En casos graves: convulsiones, anemia severa",
        ],
        "sintomas_fang": [
            "Efie e ne ntangan (fiebre alta)",
            "Nlo a yem (dolor de cabeza)",
            "Nsua nnam (sudor del cuerpo)",
            "Evu a biki (náuseas)",
            "Nnam a yem (dolor de cuerpo)",
        ],
        "prevencion_es": [
            "Dormir bajo mosquitero tratado con insecticida",
            "Usar repelente de mosquitos",
            "Eliminar aguas estancadas cerca de la casa",
            "Tomar medicación preventiva si está disponible",
            "Usar ropa de manga larga al atardecer",
        ],
        "tratamiento_es": (
            "Acudir inmediatamente al centro de salud más cercano. "
            "El tratamiento incluye medicamentos antimaláricos como "
            "Artemisinina combinada (ACT). NO se automedique."
        ),
        "urgencia": "alta",
        "categoria": "parasitaria",
    },
    "fiebre_tifoidea": {
        "nombre_es": "Fiebre Tifoidea",
        "nombre_fang": "Efie e mam (fiebre del agua)",
        "descripcion_es": (
            "Infección bacteriana causada por Salmonella typhi, "
            "transmitida por agua y alimentos contaminados. "
            "Muy común en zonas con saneamiento deficiente."
        ),
        "descripcion_fang": (
            "Eki ya bacteria Salmonella. A ze mam ne bikalá bi ne mbamba."
        ),
        "sintomas_es": [
            "Fiebre que sube gradualmente",
            "Dolor abdominal",
            "Dolor de cabeza",
            "Debilidad general",
            "Pérdida de apetito",
            "Diarrea o estreñimiento",
            "Manchas rosadas en el pecho",
        ],
        "sintomas_fang": [
            "Efie a ke a komo (fiebre gradual)",
            "Evu a yem (dolor de estómago)",
            "Nlo a yem (dolor de cabeza)",
            "Nnam a ke (debilidad)",
        ],
        "prevencion_es": [
            "Hervir o purificar el agua antes de beber",
            "Lavarse las manos con jabón frecuentemente",
            "Cocinar bien los alimentos",
            "Evitar alimentos de vendedores ambulantes sin higiene",
            "Vacunación cuando esté disponible",
        ],
        "tratamiento_es": (
            "Requiere antibióticos recetados por un médico. "
            "Es importante completar todo el tratamiento. "
            "Beber muchos líquidos para evitar la deshidratación."
        ),
        "urgencia": "alta",
        "categoria": "bacteriana",
    },
    "colera": {
        "nombre_es": "Cólera",
        "nombre_fang": "Eki ya mam mbamba (enfermedad del agua sucia)",
        "descripcion_es": (
            "Infección intestinal aguda causada por la bacteria Vibrio cholerae. "
            "Se transmite por agua y alimentos contaminados. "
            "Puede causar deshidratación grave y muerte si no se trata."
        ),
        "descripcion_fang": (
            "Eki e ne ntangan ya evu. A ze mam mbamba. "
            "A bele a wu mot si a yia doctor."
        ),
        "sintomas_es": [
            "Diarrea acuosa abundante (aspecto de agua de arroz)",
            "Vómitos frecuentes",
            "Deshidratación rápida",
            "Calambres musculares",
            "Sed intensa",
            "Ojos hundidos",
            "Pulso débil",
        ],
        "sintomas_fang": [
            "Nsus nnam ose (diarrea fuerte)",
            "Evu a biki (vómitos)",
            "Nnam a sili (cuerpo seco/deshidratación)",
            "Mam a yem (sed fuerte)",
        ],
        "prevencion_es": [
            "Beber solo agua hervida o purificada",
            "Lavarse las manos antes de comer y después del baño",
            "No defecar al aire libre",
            "Cocinar bien los mariscos y pescados",
            "Mantener la higiene en la cocina",
        ],
        "tratamiento_es": (
            "EMERGENCIA MÉDICA. Acudir al hospital inmediatamente. "
            "Mientras tanto, preparar suero de rehidratación oral: "
            "1 litro de agua hervida + 6 cucharaditas de azúcar + "
            "1/2 cucharadita de sal. Beber a sorbos frecuentes."
        ),
        "urgencia": "critica",
        "categoria": "bacteriana",
    },
    "vih_sida": {
        "nombre_es": "VIH/SIDA",
        "nombre_fang": "Eki ya meyon (enfermedad de la sangre)",
        "descripcion_es": (
            "El Virus de Inmunodeficiencia Humana debilita el sistema "
            "inmunológico. Guinea Ecuatorial tiene una prevalencia "
            "significativa. Se puede vivir con VIH con tratamiento adecuado."
        ),
        "descripcion_fang": (
            "Virus ya meyon a bele a sili nnam. "
            "Mot a bele a duan ne eki yayie si a yia biyón."
        ),
        "sintomas_es": [
            "Fase inicial: fiebre, dolor de garganta, ganglios inflamados",
            "Pérdida de peso inexplicable",
            "Diarrea crónica",
            "Sudores nocturnos",
            "Infecciones frecuentes",
            "Fatiga persistente",
            "Muchos infectados no presentan síntomas durante años",
        ],
        "sintomas_fang": [
            "Efie ne nlo a yem (fiebre y dolor)",
            "Nnam a ke meka (pérdida de peso)",
            "Nsus nnam (diarrea)",
            "Nsua akiri (sudor de noche)",
        ],
        "prevencion_es": [
            "Usar preservativo en todas las relaciones sexuales",
            "Hacerse la prueba del VIH regularmente",
            "No compartir agujas ni objetos cortantes",
            "Las mujeres embarazadas deben hacerse la prueba",
            "Tratamiento preventivo para parejas serodiscordantes",
        ],
        "tratamiento_es": (
            "El tratamiento antirretroviral (TAR) está disponible "
            "gratuitamente en los centros de salud de Guinea Ecuatorial. "
            "Con tratamiento, una persona con VIH puede vivir una vida "
            "larga y saludable. La prueba es confidencial."
        ),
        "urgencia": "media",
        "categoria": "viral",
    },
    "tuberculosis": {
        "nombre_es": "Tuberculosis (TB)",
        "nombre_fang": "Eki ya ntuba (enfermedad del pecho)",
        "descripcion_es": (
            "Infección bacteriana que afecta principalmente los pulmones. "
            "Se transmite por el aire cuando una persona infectada tose o estornuda."
        ),
        "descripcion_fang": (
            "Eki ya bacteria a yem ntuba. "
            "A ze fufú si mot a kos ane eki."
        ),
        "sintomas_es": [
            "Tos persistente por más de 2 semanas",
            "Tos con sangre o esputo",
            "Fiebre baja persistente",
            "Sudores nocturnos",
            "Pérdida de peso y apetito",
            "Dolor en el pecho al respirar",
            "Fatiga",
        ],
        "sintomas_fang": [
            "Ekos e ke e fulu (tos que no para)",
            "Ekos ne meyon (tos con sangre)",
            "Efie mekidi (fiebre baja)",
            "Nnam a ke meka (pérdida de peso)",
        ],
        "prevencion_es": [
            "Vacunación BCG para los recién nacidos",
            "Ventilar bien las habitaciones",
            "Cubrirse la boca al toser",
            "Acudir al médico si la tos dura más de 2 semanas",
            "Completar todo el tratamiento si es diagnosticado",
        ],
        "tratamiento_es": (
            "El tratamiento dura 6 meses con antibióticos. "
            "Es FUNDAMENTAL completar todo el tratamiento aunque se sienta mejor. "
            "Abandonar el tratamiento crea resistencia. "
            "El tratamiento es gratuito en los centros de salud."
        ),
        "urgencia": "alta",
        "categoria": "bacteriana",
    },
    "diarrea_infantil": {
        "nombre_es": "Enfermedades Diarreicas (Infantil)",
        "nombre_fang": "Nsus nnam ya moan (diarrea del niño)",
        "descripcion_es": (
            "Las enfermedades diarreicas son una de las principales causas "
            "de muerte en niños menores de 5 años en Guinea Ecuatorial. "
            "Generalmente causadas por agua contaminada o falta de higiene."
        ),
        "descripcion_fang": (
            "Nsus nnam ane eki e wu moan Guinea Ecuatorial. "
            "A ze mam mbamba."
        ),
        "sintomas_es": [
            "Deposiciones líquidas frecuentes (más de 3 al día)",
            "Vómitos",
            "Fiebre",
            "Irritabilidad o llanto sin lágrimas",
            "Boca y lengua secas",
            "Ojos hundidos",
            "Piel que no regresa rápido al pellizcar",
        ],
        "sintomas_fang": [
            "Nsus nnam ose (diarrea fuerte)",
            "Evu a biki (vómitos)",
            "Efie (fiebre)",
            "Moan a boo (niño llora sin lágrimas)",
        ],
        "prevencion_es": [
            "Lactancia materna exclusiva los primeros 6 meses",
            "Hervir el agua para preparar biberones",
            "Lavarse las manos con jabón antes de preparar comida",
            "Usar letrinas o baños adecuados",
            "Vacunar contra el rotavirus",
        ],
        "tratamiento_es": (
            "Dar suero de rehidratación oral inmediatamente. "
            "Seguir alimentando al niño y dando pecho. "
            "Si hay sangre en las heces, fiebre alta o el niño "
            "no mejora en 24 horas, acudir al hospital URGENTE."
        ),
        "urgencia": "alta",
        "categoria": "infecciosa",
    },
    "parasitos_intestinales": {
        "nombre_es": "Parásitos Intestinales (Lombrices)",
        "nombre_fang": "Minyón ya evu (gusanos del estómago)",
        "descripcion_es": (
            "Las infecciones por parásitos intestinales son muy comunes, "
            "especialmente en niños. Incluyen lombrices, tenias y amebas."
        ),
        "descripcion_fang": (
            "Minyón ya evu ane eki e ne ntangan ya moan. "
            "A ze nnam mbamba ne bikalá."
        ),
        "sintomas_es": [
            "Dolor abdominal",
            "Diarrea o estreñimiento",
            "Barriga hinchada",
            "Pérdida de peso a pesar de comer bien",
            "Picazón anal (especialmente de noche)",
            "Fatiga y anemia",
            "Gusanos visibles en las heces",
        ],
        "sintomas_fang": [
            "Evu a yem (dolor de estómago)",
            "Evu e ne ntangan (barriga hinchada)",
            "Nnam a ke meka (pérdida de peso)",
        ],
        "prevencion_es": [
            "Lavarse las manos antes de comer y después del baño",
            "Usar zapatos (no caminar descalzo)",
            "Lavar bien frutas y verduras",
            "Desparasitación regular cada 6 meses",
            "Cocinar bien las carnes",
        ],
        "tratamiento_es": (
            "La desparasitación con Albendazol o Mebendazol es sencilla "
            "y efectiva. Consulte en su centro de salud para el "
            "tratamiento correcto según la edad."
        ),
        "urgencia": "baja",
        "categoria": "parasitaria",
    },
    "infecciones_respiratorias": {
        "nombre_es": "Infecciones Respiratorias Agudas (IRA)",
        "nombre_fang": "Eki ya ntuba ne mfú (enfermedad del pecho y nariz)",
        "descripcion_es": (
            "Incluyen neumonía, bronquitis y otras infecciones. "
            "Son una causa importante de enfermedad y muerte "
            "en niños pequeños en Guinea Ecuatorial."
        ),
        "descripcion_fang": (
            "Eki ya ntuba ne mfú ane eki e wu moan."
        ),
        "sintomas_es": [
            "Tos frecuente",
            "Dificultad para respirar",
            "Respiración rápida",
            "Fiebre",
            "Dolor en el pecho",
            "Silbidos al respirar",
            "En niños: hundimiento del pecho al respirar",
        ],
        "sintomas_fang": [
            "Ekos ose (tos fuerte)",
            "Fufú a yem (dificultad para respirar)",
            "Efie (fiebre)",
            "Ntuba a yem (dolor de pecho)",
        ],
        "prevencion_es": [
            "Vacunación completa de los niños",
            "Evitar el humo de leña dentro de la casa",
            "Lactancia materna",
            "Buena nutrición",
            "Evitar contacto con personas enfermas",
        ],
        "tratamiento_es": (
            "Si un niño tiene dificultad para respirar o respiración "
            "rápida, acudir al hospital INMEDIATAMENTE. "
            "La neumonía puede matar en horas si no se trata."
        ),
        "urgencia": "alta",
        "categoria": "infecciosa",
    },
    "hipertension": {
        "nombre_es": "Hipertensión Arterial (Presión Alta)",
        "nombre_fang": "Meyon a komo (sangre que sube)",
        "descripcion_es": (
            "La presión arterial alta es cada vez más común en Guinea Ecuatorial "
            "debido a cambios en la dieta y estilo de vida. "
            "Se le llama 'el asesino silencioso' porque no da síntomas claros."
        ),
        "descripcion_fang": (
            "Meyon a komo ane eki e ke e komo Guinea Ecuatorial. "
            "A wu mot si a si yia."
        ),
        "sintomas_es": [
            "Generalmente NO tiene síntomas (por eso es peligrosa)",
            "Dolor de cabeza frecuente",
            "Mareos",
            "Visión borrosa",
            "Sangrado nasal",
            "Zumbido en los oídos",
            "En casos graves: dolor en el pecho, dificultad para respirar",
        ],
        "sintomas_fang": [
            "Eki yayie a si yia minsón (no da síntomas)",
            "Nlo a yem (dolor de cabeza)",
            "Nlo a sekele (mareos)",
        ],
        "prevencion_es": [
            "Reducir el consumo de sal",
            "Hacer ejercicio regularmente",
            "Mantener un peso saludable",
            "Limitar el consumo de alcohol",
            "No fumar",
            "Controlarse la presión regularmente",
        ],
        "tratamiento_es": (
            "La hipertensión se controla con medicamentos diarios "
            "que NO se deben dejar de tomar aunque se sienta bien. "
            "Acuda al médico para que le recete el tratamiento adecuado."
        ),
        "urgencia": "media",
        "categoria": "cronica",
    },
    "diabetes": {
        "nombre_es": "Diabetes",
        "nombre_fang": "Eki ya azúcar (enfermedad del azúcar)",
        "descripcion_es": (
            "Enfermedad crónica en la que el cuerpo no puede controlar "
            "el nivel de azúcar en la sangre. Está aumentando en "
            "Guinea Ecuatorial por los cambios en la alimentación."
        ),
        "descripcion_fang": (
            "Eki ya azúcar a komo Guinea Ecuatorial. "
            "Nnam a si bele a yia azúcar ya meyon."
        ),
        "sintomas_es": [
            "Sed excesiva",
            "Orinar con mucha frecuencia",
            "Hambre constante",
            "Pérdida de peso sin explicación",
            "Visión borrosa",
            "Heridas que tardan en sanar",
            "Hormigueo en manos y pies",
            "Fatiga",
        ],
        "sintomas_fang": [
            "Mam a yem ose (mucha sed)",
            "A ke nsisim ose (orinar mucho)",
            "Ndjá ose (mucha hambre)",
            "Nnam a ke meka (pérdida de peso)",
        ],
        "prevencion_es": [
            "Comer más frutas, verduras y alimentos naturales",
            "Reducir azúcar y bebidas azucaradas",
            "Hacer ejercicio regularmente",
            "Mantener un peso saludable",
            "Hacerse análisis de sangre periódicamente",
        ],
        "tratamiento_es": (
            "La diabetes requiere control médico regular. "
            "Puede necesitar medicamentos orales o insulina. "
            "Una dieta adecuada y ejercicio son fundamentales. "
            "NO deje el tratamiento por su cuenta."
        ),
        "urgencia": "media",
        "categoria": "cronica",
    },
    "anemia": {
        "nombre_es": "Anemia",
        "nombre_fang": "Meyon mekidi (sangre poca/débil)",
        "descripcion_es": (
            "Muy común en mujeres embarazadas y niños. "
            "Frecuentemente causada por malaria, parásitos o "
            "mala alimentación. Puede ser peligrosa en el embarazo."
        ),
        "descripcion_fang": (
            "Meyon mekidi ane eki ya binga ba ne evu ne bian. "
            "Ebo'o ne minyón a bele a yia meyon mekidi."
        ),
        "sintomas_es": [
            "Cansancio extremo",
            "Palidez (palmas de las manos blancas)",
            "Mareos y debilidad",
            "Dificultad para respirar con esfuerzo",
            "Latidos del corazón rápidos",
            "Uñas frágiles",
            "En embarazadas: parto prematuro, bebé de bajo peso",
        ],
        "sintomas_fang": [
            "Nnam a ke (cansancio)",
            "Nnam a fufub (palidez)",
            "Nlo a sekele (mareos)",
        ],
        "prevencion_es": [
            "Comer alimentos ricos en hierro (hígado, frijoles, hojas verdes)",
            "Tomar suplementos de hierro durante el embarazo",
            "Desparasitarse regularmente",
            "Dormir bajo mosquitero (prevenir malaria)",
            "Comer frutas con vitamina C para absorber mejor el hierro",
        ],
        "tratamiento_es": (
            "Suplementos de hierro y ácido fólico. "
            "Si es por malaria o parásitos, tratar la causa. "
            "En casos graves puede necesitar transfusión de sangre."
        ),
        "urgencia": "media",
        "categoria": "nutricional",
    },
    "dengue": {
        "nombre_es": "Dengue",
        "nombre_fang": "Ebo'o ya mebá (fiebre de los huesos)",
        "descripcion_es": (
            "Enfermedad viral transmitida por el mosquito Aedes aegypti. "
            "Puede ser grave si se presenta como dengue hemorrágico."
        ),
        "descripcion_fang": (
            "Eki ya virus a ze mosquito Aedes. "
            "A bele a yia ntangan ose."
        ),
        "sintomas_es": [
            "Fiebre alta repentina",
            "Dolor intenso de huesos y articulaciones",
            "Dolor detrás de los ojos",
            "Dolor de cabeza fuerte",
            "Erupción en la piel",
            "Sangrado de encías o nariz (caso grave)",
            "Náuseas y vómitos",
        ],
        "sintomas_fang": [
            "Efie e ne ntangan ose (fiebre alta repentina)",
            "Mebá a yem ose (dolor de huesos fuerte)",
            "Nlo a yem (dolor de cabeza)",
        ],
        "prevencion_es": [
            "Eliminar recipientes con agua estancada",
            "Usar repelente de mosquitos",
            "Colocar mosquiteros en ventanas",
            "Usar ropa que cubra brazos y piernas",
        ],
        "tratamiento_es": (
            "No hay tratamiento específico. Reposo, muchos líquidos "
            "y paracetamol para la fiebre. NO tomar aspirina ni ibuprofeno. "
            "Si hay sangrado, acudir al hospital URGENTE."
        ),
        "urgencia": "alta",
        "categoria": "viral",
    },
}

CATEGORIAS = {
    "parasitaria": "Enfermedad Parasitaria",
    "bacteriana": "Enfermedad Bacteriana",
    "viral": "Enfermedad Viral",
    "cronica": "Enfermedad Crónica",
    "infecciosa": "Enfermedad Infecciosa",
    "nutricional": "Trastorno Nutricional",
}


def buscar_enfermedad(texto):
    """Busca enfermedades que coincidan con el texto del usuario."""
    texto = texto.lower().strip()
    resultados = []

    for clave, enfermedad in ENFERMEDADES.items():
        nombre_es = enfermedad["nombre_es"].lower()
        nombre_fang = enfermedad["nombre_fang"].lower()

        if (
            texto in clave
            or texto in nombre_es
            or texto in nombre_fang
            or any(texto in s.lower() for s in enfermedad["sintomas_es"])
        ):
            resultados.append((clave, enfermedad))

    return resultados


def buscar_por_sintomas(sintomas_texto):
    """Busca enfermedades que coincidan con una lista de síntomas."""
    palabras = sintomas_texto.lower().split()
    puntuacion = {}

    for clave, enfermedad in ENFERMEDADES.items():
        score = 0
        todos_sintomas = " ".join(enfermedad["sintomas_es"]).lower()
        for palabra in palabras:
            if len(palabra) > 3 and palabra in todos_sintomas:
                score += 1
        if score > 0:
            puntuacion[clave] = score

    ordenados = sorted(puntuacion.items(), key=lambda x: x[1], reverse=True)
    return [(clave, ENFERMEDADES[clave]) for clave, _ in ordenados[:3]]


def listar_enfermedades():
    """Retorna lista formateada de todas las enfermedades."""
    lista = []
    for i, (clave, enf) in enumerate(ENFERMEDADES.items(), 1):
        lista.append(f"{i}. {enf['nombre_es']} ({enf['nombre_fang']})")
    return "\n".join(lista)
