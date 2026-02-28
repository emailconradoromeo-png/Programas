"""
Sistema de traducción y frases bilingüe español-fang.
Adaptado al contexto cultural de Guinea Ecuatorial.

Nota: El fang (pangwe/pahouin) es la lengua más hablada en GQ.
Las traducciones son aproximadas y respetan las variantes locales.
"""

# Frases comunes del chatbot en ambos idiomas
FRASES = {
    "saludo": {
        "es": (
            "Hola, soy tu asistente de salud para Guinea Ecuatorial. "
            "Estoy aquí para ayudarte con información médica. "
            "¿En qué puedo ayudarte hoy?"
        ),
        "fang": (
            "Mbolo! Me ne asistente ya salud ya Guinea Ecuatorial. "
            "Me ne va'a a yia wo nsisim. "
            "Akié wo a yem nseñ?"
        ),
    },
    "saludo_informal": {
        "es": "¡Buenas! ¿Cómo estás? Soy tu asistente de salud. ¿Qué necesitas?",
        "fang": "Mbolo! Wo ne fé? Me ne asistente ya salud. Akié wo a yem?",
    },
    "despedida": {
        "es": (
            "Cuídate mucho. Recuerda: si los síntomas empeoran, "
            "acude al centro de salud más cercano. ¡Hasta pronto!"
        ),
        "fang": (
            "Yia nnam! Enonga: si eki a komo, "
            "ke hospital e ne meki. Akeva!"
        ),
    },
    "disclaimer": {
        "es": (
            "IMPORTANTE: Soy un asistente virtual y NO sustituyo a un médico. "
            "Esta información es orientativa. Para diagnóstico y tratamiento, "
            "acuda siempre a un profesional de salud."
        ),
        "fang": (
            "NTANGAN: Me ne asistente virtual, me si ne doctor. "
            "Nsisim yayie ane ya yia wo nseñ. "
            "Ke doctor a yia wo biyón."
        ),
    },
    "emergencia": {
        "es": (
            "Si es una EMERGENCIA, llame inmediatamente al 114 "
            "o acuda al hospital más cercano."
        ),
        "fang": (
            "Si ane EMERGENCIA, fón 114 "
            "o ke hospital e ne meki."
        ),
    },
    "no_entiendo": {
        "es": (
            "Disculpa, no he entendido bien. Puedes decirme:\n"
            "1. Una enfermedad o síntoma que quieras consultar\n"
            "2. Tu ubicación para buscar centros de salud\n"
            "3. Escribir 'ayuda' para ver todas las opciones"
        ),
        "fang": (
            "Nsama, me si yia. Wo bele a tege me:\n"
            "1. Eki o minsón wo a yem\n"
            "2. Fulu ya wo a yia centros ya salud\n"
            "3. Fila 'ayuda' a yia minsón mese"
        ),
    },
    "menu_principal": {
        "es": (
            "¿Qué necesitas saber?\n\n"
            "*Salud:*\n"
            "1. Consultar síntomas\n"
            "2. Buscar centro de salud cercano\n"
            "3. Lista de enfermedades comunes\n"
            "4. Números de emergencia\n"
            "5. Cambiar idioma (Español/Fang)\n"
            "6. Primeros auxilios\n\n"
            "*Guinea Ecuatorial:*\n"
            "7. Constitución de GQ\n"
            "8. OHADA (Derecho Mercantil)\n"
            "9. Historia de Guinea Ecuatorial\n\n"
            "Escribe el número o describe lo que necesitas."
        ),
        "fang": (
            "Akié wo a yem?\n\n"
            "*Salud:*\n"
            "1. Bisá minsón ya eki\n"
            "2. Sili centro ya salud e ne meki\n"
            "3. Lista ya beki bi ne ntangan\n"
            "4. Números ya emergencia\n"
            "5. Chañe idioma (Español/Fang)\n"
            "6. Primeros auxilios\n\n"
            "*Guinea Ecuatorial:*\n"
            "7. Constitución ya GQ\n"
            "8. OHADA (Derecho Mercantil)\n"
            "9. Historia ya Guinea Ecuatorial\n\n"
            "Fila número o tege akié wo a yem."
        ),
    },
    "pidiendo_ubicacion": {
        "es": (
            "¿Dónde te encuentras? Dime tu ciudad o zona:\n"
            "- Malabo\n"
            "- Bata\n"
            "- Ebebiyín\n"
            "- Mongomo\n"
            "- Evinayong\n"
            "- Luba\n"
            "- Aconibe\n"
            "- Annobón\n"
            "- Zona rural (poblado)"
        ),
        "fang": (
            "Fulu fié wo ne? Tege me mboan o zona ya wo:\n"
            "- Malabo\n"
            "- Bata\n"
            "- Ebebiyín\n"
            "- Mongomo\n"
            "- Evinayong\n"
            "- Luba\n"
            "- Aconibe\n"
            "- Annobón\n"
            "- Ebuán (zona rural)"
        ),
    },
    "pregunta_sintomas": {
        "es": (
            "Cuéntame qué síntomas tienes. Intenta ser lo más "
            "específico posible. Por ejemplo:\n"
            "- 'Tengo fiebre y dolor de cabeza'\n"
            "- 'Mi hijo tiene diarrea y vómitos'\n"
            "- 'Tengo tos desde hace dos semanas'"
        ),
        "fang": (
            "Tege me minsón ya wo. Yia minsón ne nseñ:\n"
            "- 'Me ne ne efie ne nlo a yem'\n"
            "- 'Moan wam a ne ne nsus nnam ne evu a biki'\n"
            "- 'Me ne ne ekos ane semana ebe'"
        ),
    },
    "consejo_mosquitero": {
        "es": (
            "RECUERDA: Dormir bajo mosquitero tratado con insecticida "
            "es la mejor protección contra la malaria. "
            "Asegúrate de que toda tu familia duerma protegida."
        ),
        "fang": (
            "ENONGA: Elan abum mosquitero ane biyón bi ne meki "
            "a yia ebo'o. Yia familia ya wo ese a elan ne mosquitero."
        ),
    },
    "consejo_agua": {
        "es": (
            "IMPORTANTE: Siempre hierve el agua antes de beber, "
            "especialmente para los niños. El agua contaminada "
            "causa muchas enfermedades."
        ),
        "fang": (
            "NTANGAN: Tua mam a biki ane si wo a nua, "
            "ntangan ya bian. Mam mbamba a yia beki ose."
        ),
    },
    "embarazo_control": {
        "es": (
            "Si estás embarazada, es muy importante hacer los controles "
            "prenatales. Acude al centro de salud al menos 4 veces "
            "durante el embarazo. Toma los suplementos de hierro y "
            "ácido fólico que te den."
        ),
        "fang": (
            "Si wo ne evu, ane ntangan a ke control prenatal. "
            "Ke centro ya salud mefak mená ane evu. "
            "Nua biyón ya hierro ne ácido fólico."
        ),
    },
    "cambio_idioma_es": {
        "es": "He cambiado el idioma a Español.",
        "fang": "Me chañe idioma a Español.",
    },
    "cambio_idioma_fang": {
        "es": "He cambiado el idioma a Fang.",
        "fang": "Me chañe idioma a Fang.",
    },
    "primeros_auxilios_fiebre": {
        "es": (
            "Para la fiebre mientras llega al centro de salud:\n"
            "1. Tome paracetamol (NO aspirina si sospecha dengue)\n"
            "2. Aplique paños húmedos en la frente\n"
            "3. Beba muchos líquidos\n"
            "4. Descanse en lugar fresco\n"
            "5. Si la fiebre pasa de 39°C o dura más de 2 días, "
            "acuda al hospital"
        ),
        "fang": (
            "Biyón ya efie ane si wo ke hospital:\n"
            "1. Nua paracetamol\n"
            "2. Bile mam ya fufú a nlo\n"
            "3. Nua mam ose\n"
            "4. Suan fulu ya fufú\n"
            "5. Si efie a si ke, ke hospital"
        ),
    },
    "primeros_auxilios_diarrea": {
        "es": (
            "Para la diarrea:\n"
            "1. Prepare suero oral: 1 litro de agua hervida + "
            "6 cucharaditas de azúcar + media cucharadita de sal\n"
            "2. Beba a pequeños sorbos frecuentes\n"
            "3. Siga comiendo alimentos suaves\n"
            "4. Para niños: NO deje de dar el pecho\n"
            "5. Si hay sangre en las heces o no mejora en 24h, "
            "vaya al hospital"
        ),
        "fang": (
            "Biyón ya nsus nnam:\n"
            "1. Yia suero oral: 1 litro mam a biki + "
            "6 cucharaditas azúcar + media cucharadita sal\n"
            "2. Nua mekidi mekidi ose\n"
            "3. Dia bikalá bi meyóng\n"
            "4. Bian: A SI FULU a yia ebam\n"
            "5. Si meyon ne nsus o a si ke, ke hospital"
        ),
    },
}

# Vocabulario médico básico español-fang
VOCABULARIO_MEDICO = {
    "doctor": {"es": "doctor/médico", "fang": "doctor"},
    "hospital": {"es": "hospital", "fang": "hospital"},
    "enfermedad": {"es": "enfermedad", "fang": "eki"},
    "dolor": {"es": "dolor", "fang": "a yem"},
    "fiebre": {"es": "fiebre", "fang": "efie"},
    "cabeza": {"es": "cabeza", "fang": "nlo"},
    "estomago": {"es": "estómago/barriga", "fang": "evu"},
    "cuerpo": {"es": "cuerpo", "fang": "nnam"},
    "sangre": {"es": "sangre", "fang": "meyon"},
    "agua": {"es": "agua", "fang": "mam"},
    "medicina": {"es": "medicina/medicamento", "fang": "biyón"},
    "nino": {"es": "niño/niña", "fang": "moan"},
    "mujer": {"es": "mujer", "fang": "minga"},
    "hombre": {"es": "hombre", "fang": "fam"},
    "embarazada": {"es": "embarazada", "fang": "minga a ne evu"},
    "pecho": {"es": "pecho", "fang": "ntuba"},
    "tos": {"es": "tos", "fang": "ekos"},
    "diarrea": {"es": "diarrea", "fang": "nsus nnam"},
    "vomito": {"es": "vómito", "fang": "evu a biki"},
    "muerte": {"es": "muerte", "fang": "awu"},
    "vida": {"es": "vida", "fang": "eduan"},
    "comida": {"es": "comida", "fang": "bikalá"},
    "mosquito": {"es": "mosquito", "fang": "nsok"},
    "mosquitero": {"es": "mosquitero", "fang": "mosquitero"},
    "inyeccion": {"es": "inyección", "fang": "pikí"},
    "pastilla": {"es": "pastilla", "fang": "pastilla"},
    "herida": {"es": "herida", "fang": "ebolá"},
    "morir": {"es": "morir", "fang": "awu"},
    "curar": {"es": "curar", "fang": "a fé"},
    "dormir": {"es": "dormir", "fang": "elan"},
    "comer": {"es": "comer", "fang": "dia"},
    "beber": {"es": "beber", "fang": "nua"},
}

# Saludos culturalmente apropiados según la hora
SALUDOS_POR_HORA = {
    "manana": {
        "es": "Buenos días, hermano/hermana.",
        "fang": "Mbemba meyong, mbo'o/mna'a.",
    },
    "tarde": {
        "es": "Buenas tardes, hermano/hermana.",
        "fang": "Mbemba akiri, mbo'o/mna'a.",
    },
    "noche": {
        "es": "Buenas noches, hermano/hermana.",
        "fang": "Mbemba ebubu, mbo'o/mna'a.",
    },
}


def obtener_frase(clave, idioma="es"):
    """Obtiene una frase en el idioma especificado."""
    frase = FRASES.get(clave, {})
    return frase.get(idioma, frase.get("es", ""))


def obtener_saludo(hora, idioma="es"):
    """Obtiene el saludo apropiado según la hora del día."""
    if 5 <= hora < 12:
        periodo = "manana"
    elif 12 <= hora < 18:
        periodo = "tarde"
    else:
        periodo = "noche"
    return SALUDOS_POR_HORA[periodo][idioma]


def traducir_palabra(palabra, idioma_destino="fang"):
    """Traduce una palabra del vocabulario médico."""
    palabra = palabra.lower().strip()
    for clave, traducciones in VOCABULARIO_MEDICO.items():
        if palabra in traducciones["es"] or palabra == clave:
            return traducciones[idioma_destino]
    return None
