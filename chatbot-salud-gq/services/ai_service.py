"""
Servicio de IA: Genera respuestas inteligentes usando OpenAI.
Integra la base de conocimiento local (salud, constitución, OHADA, historia)
con la capacidad de GPT. Registra TODAS las interacciones para aprendizaje continuo.
"""

import logging
from openai import OpenAI

from config.settings import OPENAI_API_KEY, OPENAI_MODEL, SYSTEM_PROMPT
from knowledge.enfermedades import (
    ENFERMEDADES,
    buscar_enfermedad,
    buscar_por_sintomas,
    listar_enfermedades,
)
from knowledge.centros_salud import (
    buscar_centros,
    formatear_centro,
    formatear_emergencias,
    EMERGENCIAS,
)
from knowledge.idioma_fang import obtener_frase, VOCABULARIO_MEDICO
from knowledge.constitucion_gq import buscar_constitucion, formatear_constitucion, formatear_resumen_constitucion
from knowledge.ohada import buscar_ohada, formatear_ohada, formatear_resumen_ohada
from knowledge.historia_gq import buscar_historia, formatear_historia, formatear_resumen_historia
from services.knowledge_memory import KnowledgeMemory

logger = logging.getLogger(__name__)

# Palabras clave para detección de categoría
CATEGORIAS_KEYWORDS = {
    "centros_salud": [
        "centro", "hospital", "clínica", "clinica", "doctor", "médico", "medico",
        "malabo", "bata", "ebebiyin", "mongomo", "evinayong", "luba", "aconibe",
        "annobon", "annobón", "farmacia",
    ],
    "sintomas": [
        "fiebre", "dolor", "tos", "diarrea", "vomito", "vómito", "sangre",
        "mareo", "picazón", "hinchado", "herida", "nausea", "náusea",
        "cansancio", "debilidad", "efie", "a yem", "ekos", "nsus", "meyon", "evu",
    ],
    "enfermedad": [
        "malaria", "paludismo", "tifoidea", "dengue", "vih", "sida", "tuberculosis",
        "colera", "cólera", "hepatitis", "parasit", "anemia", "diabetes",
        "hipertension", "hipertensión", "asma", "neumonia", "neumonía",
    ],
    "emergencia": [
        "emergencia", "urgente", "urgencia", "me muero", "no respira",
        "convulsiones", "desmayo", "inconsciente", "accidente",
        "envenenamiento", "veneno", "mordedura", "serpiente",
        "quemadura", "ahogando", "parto",
    ],
    "prevencion": [
        "prevenir", "prevencion", "prevención", "vacuna", "proteger",
        "mosquitero", "repelente", "higiene", "agua potable", "lavarse",
    ],
    "constitucion": [
        "constitución", "constitucion", "ley fundamental", "derechos",
        "deberes", "poder ejecutivo", "poder legislativo", "poder judicial",
        "presidente", "parlamento", "senado", "diputado", "tribunal",
        "bandera", "himno", "escudo", "símbolo", "simbolo",
    ],
    "ohada": [
        "ohada", "derecho mercantil", "acta uniforme", "empresa",
        "sociedad", "sarl", "comercial", "arbitraje", "ccja",
        "crear empresa", "negocio", "emprender",
    ],
    "historia": [
        "historia", "independencia", "colonial", "colonia", "portugal",
        "precolonial", "macías", "macias", "obiang", "1968",
        "etnia", "fang", "bubi", "ndowé", "ndowe", "fernandino",
    ],
}


class AIService:
    """Servicio de inteligencia artificial para el chatbot médico."""

    def __init__(self, memory=None):
        self.client = None
        if OPENAI_API_KEY:
            self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.conversation_history = {}
        self.memory = memory or KnowledgeMemory()

    def generar_respuesta(self, user_id, mensaje, idioma="es"):
        """
        Genera una respuesta médica inteligente.
        Registra TODAS las interacciones para aprendizaje.
        """
        mensaje_lower = mensaje.lower().strip()
        categoria = self._detectar_categoria(mensaje_lower)

        # 1. Detectar emergencias
        if self._es_emergencia(mensaje_lower):
            respuesta = self._respuesta_emergencia(idioma)
            self._post_procesar(user_id, mensaje, respuesta, "emergencia", idioma, "emergencia")
            return respuesta

        # 2. Buscar en base de conocimiento local
        respuesta_local = self._buscar_local(mensaje_lower, idioma)
        if respuesta_local:
            self._post_procesar(user_id, mensaje, respuesta_local, "local", idioma, categoria)
            return respuesta_local

        # 3. Buscar en memoria aprendida
        respuesta_memoria, confianza = self.memory.buscar(mensaje_lower, idioma)
        if respuesta_memoria and confianza >= 0.6:
            logger.info(f"Respuesta desde memoria (confianza: {confianza:.2f})")
            self._post_procesar(user_id, mensaje, respuesta_memoria, "memoria", idioma, categoria)
            return respuesta_memoria

        # 4. Buscar en patrones aprendidos
        respuesta_patron, frecuencia, confianza_patron = self.memory.buscar_patron(mensaje_lower, idioma)
        if respuesta_patron and confianza_patron >= 0.6:
            logger.info(f"Respuesta desde patrón (freq={frecuencia}, confianza: {confianza_patron:.2f})")
            self._post_procesar(user_id, mensaje, respuesta_patron, "patron", idioma, categoria)
            return respuesta_patron

        # 5. Si hay API de OpenAI, usar IA
        if self.client:
            respuesta_ia = self._respuesta_ia(user_id, mensaje, idioma)
            self._post_procesar(user_id, mensaje, respuesta_ia, "openai", idioma, categoria)
            return respuesta_ia

        # 6. Fallback sin IA
        respuesta_fb = self._respuesta_fallback(mensaje_lower, idioma)
        self._post_procesar(user_id, mensaje, respuesta_fb, "fallback", idioma, categoria)
        return respuesta_fb

    def _post_procesar(self, user_id, pregunta, respuesta, fuente, idioma, categoria):
        """
        Post-procesamiento: registra en historial, guarda conocimiento,
        actualiza patrones y perfil del usuario.
        """
        try:
            # 1. Siempre registrar en historial
            self.memory.registrar_consulta(user_id, pregunta, respuesta, fuente, idioma, categoria)

            # 2. Guardar en conocimiento aprendido si es respuesta útil
            if fuente in ("local", "openai"):
                self.memory.guardar(pregunta, respuesta, idioma, categoria)

            # 3. Actualizar patrones aprendidos
            if fuente in ("local", "openai", "memoria"):
                self.memory.actualizar_patron(pregunta, respuesta, idioma, categoria)

            # 4. Actualizar perfil del usuario
            self.memory.actualizar_perfil(user_id, idioma, categoria)

        except Exception as e:
            logger.error(f"Error en post-procesamiento: {e}")

    def _detectar_categoria(self, mensaje):
        """Detecta la categoría del mensaje basándose en palabras clave."""
        for categoria, keywords in CATEGORIAS_KEYWORDS.items():
            if any(kw in mensaje for kw in keywords):
                return categoria
        return "general"

    def _es_emergencia(self, mensaje):
        """Detecta si el mensaje describe una emergencia médica."""
        palabras_emergencia = [
            "emergencia", "urgente", "urgencia", "me muero",
            "no respira", "no puede respirar", "sangre mucha",
            "convulsiones", "desmayo", "inconsciente",
            "se cayó", "accidente", "envenenamiento", "veneno",
            "parto", "trabajo de parto", "va a nacer",
            "mordedura de serpiente", "serpiente",
            "quemadura grave", "quemadura",
            "ahogando", "se ahoga",
            # Fang
            "emergencia", "a wu", "a si fufú",
            "meyon ose", "a biki nnam",
        ]
        return any(palabra in mensaje for palabra in palabras_emergencia)

    def _respuesta_emergencia(self, idioma):
        """Genera respuesta de emergencia con números importantes."""
        if idioma == "fang":
            texto = (
                "EMERGENCIA! Fón números yayie ESIKA:\n\n"
                f"Emergencias Médicas: {EMERGENCIAS['emergencias_medicas']['numero']}\n"
                f"Hospital Malabo: {EMERGENCIAS['hospital_malabo']['numero']}\n"
                f"Hospital Bata: {EMERGENCIAS['hospital_bata']['numero']}\n"
                f"Policía: {EMERGENCIAS['policia']['numero']}\n\n"
                "Si mot a si fufú, bile nnam ya mot abe ne abum "
                "a ke arriba ne a biki fufú ya boca.\n\n"
                "Ke hospital ESIKA!"
            )
        else:
            texto = (
                "EMERGENCIA! Llame a estos números AHORA:\n\n"
                f"Emergencias Médicas: {EMERGENCIAS['emergencias_medicas']['numero']}\n"
                f"Hospital Malabo: {EMERGENCIAS['hospital_malabo']['numero']}\n"
                f"Hospital Bata: {EMERGENCIAS['hospital_bata']['numero']}\n"
                f"Policía: {EMERGENCIAS['policia']['numero']}\n\n"
                "Si la persona no respira, colóquela de lado, "
                "incline la cabeza hacia atrás y abra la boca.\n\n"
                "Vaya al hospital MÁS CERCANO inmediatamente."
            )
        return texto

    def _buscar_local(self, mensaje, idioma):
        """Busca respuestas en la base de conocimiento local."""
        # Buscar enfermedades específicas
        resultados = buscar_enfermedad(mensaje)
        if resultados:
            return self._formatear_enfermedad(resultados[0], idioma)

        # Buscar por síntomas
        palabras_sintomas = [
            "fiebre", "dolor", "tos", "diarrea", "vomito", "vómito",
            "sangre", "mareo", "picazón", "hinchado", "herida",
            "efie", "a yem", "ekos", "nsus", "meyon", "evu",
        ]
        if any(palabra in mensaje for palabra in palabras_sintomas):
            resultados = buscar_por_sintomas(mensaje)
            if resultados:
                return self._formatear_resultados_sintomas(resultados, idioma)

        # Buscar centros de salud
        ciudades = [
            "malabo", "bata", "ebebiyin", "ebebiyín", "mongomo",
            "evinayong", "luba", "aconibe", "annobon", "annobón",
            "hospital", "centro de salud", "doctor", "médico",
        ]
        palabras_msg = mensaje.split()
        if any(ciudad in mensaje for ciudad in ciudades) or any(
            palabra in ciudades for palabra in palabras_msg
        ):
            return self._buscar_centros_salud(mensaje, idioma)

        # Buscar en Constitución
        secciones_const = buscar_constitucion(mensaje)
        if secciones_const:
            return formatear_constitucion(secciones_const, idioma)

        # Buscar en OHADA
        secciones_ohada = buscar_ohada(mensaje)
        if secciones_ohada:
            return formatear_ohada(secciones_ohada, idioma)

        # Buscar en Historia
        secciones_hist = buscar_historia(mensaje)
        if secciones_hist:
            return formatear_historia(secciones_hist, idioma)

        return None

    def _formatear_enfermedad(self, resultado, idioma):
        """Formatea la información de una enfermedad."""
        clave, enf = resultado

        if idioma == "fang":
            texto = f"*{enf['nombre_fang']}* ({enf['nombre_es']})\n\n"
            texto += f"{enf.get('descripcion_fang', enf['descripcion_es'])}\n\n"
            texto += "*Minsón (Síntomas):*\n"
            for s in enf.get("sintomas_fang", enf["sintomas_es"]):
                texto += f"- {s}\n"
            texto += f"\n*Biyón ya eki (Prevención):*\n"
            for p in enf["prevencion_es"]:
                texto += f"- {p}\n"
            texto += f"\n*Tratamiento:*\n{enf['tratamiento_es']}\n\n"
            texto += obtener_frase("disclaimer", "fang")
        else:
            texto = f"*{enf['nombre_es']}* ({enf['nombre_fang']})\n\n"
            texto += f"{enf['descripcion_es']}\n\n"
            texto += "*Síntomas:*\n"
            for s in enf["sintomas_es"]:
                texto += f"- {s}\n"
            texto += f"\n*Prevención:*\n"
            for p in enf["prevencion_es"]:
                texto += f"- {p}\n"
            texto += f"\n*Tratamiento:*\n{enf['tratamiento_es']}\n\n"

            if enf["urgencia"] == "critica":
                texto += "URGENCIA CRÍTICA - Acuda al hospital INMEDIATAMENTE\n\n"
            elif enf["urgencia"] == "alta":
                texto += "Acuda al centro de salud lo antes posible.\n\n"

            texto += obtener_frase("disclaimer", "es")

        return texto

    def _formatear_resultados_sintomas(self, resultados, idioma):
        """Formatea resultados de búsqueda por síntomas."""
        if idioma == "fang":
            texto = "*Beki bi bele a yia minsón yayie (posibles enfermedades):*\n\n"
        else:
            texto = "*Según tus síntomas, podría tratarse de:*\n\n"

        for i, (clave, enf) in enumerate(resultados, 1):
            if idioma == "fang":
                texto += f"{i}. *{enf['nombre_fang']}* ({enf['nombre_es']})\n"
                texto += f"   {enf.get('descripcion_fang', '')}\n\n"
            else:
                texto += f"{i}. *{enf['nombre_es']}* ({enf['nombre_fang']})\n"
                texto += f"   {enf['descripcion_es'][:100]}...\n\n"

        if idioma == "fang":
            texto += (
                "\nFila nombre ya eki a yia minsón mese.\n\n"
                + obtener_frase("disclaimer", "fang")
            )
        else:
            texto += (
                "\nEscribe el nombre de la enfermedad para más detalles.\n\n"
                + obtener_frase("disclaimer", "es")
            )

        return texto

    def _buscar_centros_salud(self, mensaje, idioma):
        """Busca y formatea centros de salud."""
        resultados = buscar_centros(mensaje)

        # Si no encuentra con el texto completo, buscar por cada palabra
        if not resultados:
            for palabra in mensaje.split():
                if len(palabra) > 2:
                    resultados = buscar_centros(palabra)
                    if resultados:
                        break

        if not resultados:
            if idioma == "fang":
                return obtener_frase("pidiendo_ubicacion", "fang")
            return obtener_frase("pidiendo_ubicacion", "es")

        clave, zona = resultados[0]
        if idioma == "fang":
            texto = f"*Centros ya salud - {zona['nombre_fang']}:*\n\n"
        else:
            texto = f"*Centros de salud - {zona['region']}:*\n\n"

        for centro in zona["centros"]:
            texto += formatear_centro(centro) + "\n"

        texto += "\n" + formatear_emergencias()
        return texto

    def _respuesta_ia(self, user_id, mensaje, idioma):
        """Genera respuesta usando OpenAI con contexto médico enriquecido."""
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []

        idioma_instruccion = (
            "Responde en fang (lengua de Guinea Ecuatorial) "
            "con explicaciones en español si es necesario."
            if idioma == "fang"
            else "Responde en español sencillo."
        )

        context = self._construir_contexto(mensaje)

        # Contexto enriquecido: memoria + patrones + historial + tendencias
        contexto_enriquecido = self.memory.obtener_contexto_enriquecido(mensaje, user_id)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + idioma_instruccion},
        ]

        if context:
            messages.append({
                "role": "system",
                "content": f"Contexto relevante de la base de datos local:\n{context}",
            })

        if contexto_enriquecido:
            messages.append({
                "role": "system",
                "content": f"Conocimiento aprendido y contexto del usuario:\n{contexto_enriquecido}",
            })

        history = self.conversation_history[user_id][-6:]
        messages.extend(history)
        messages.append({"role": "user", "content": mensaje})

        try:
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                max_tokens=800,
                temperature=0.3,
            )

            respuesta = response.choices[0].message.content

            self.conversation_history[user_id].append(
                {"role": "user", "content": mensaje}
            )
            self.conversation_history[user_id].append(
                {"role": "assistant", "content": respuesta}
            )

            if len(self.conversation_history[user_id]) > 20:
                self.conversation_history[user_id] = (
                    self.conversation_history[user_id][-12:]
                )

            return respuesta

        except Exception as e:
            logger.error(f"Error en OpenAI API: {e}")
            return self._respuesta_fallback(mensaje.lower(), idioma)

    def _construir_contexto(self, mensaje):
        """Construye contexto relevante de la base de conocimiento."""
        contexto_partes = []
        mensaje_lower = mensaje.lower()

        resultados_enf = buscar_enfermedad(mensaje_lower)
        if resultados_enf:
            clave, enf = resultados_enf[0]
            contexto_partes.append(
                f"Enfermedad relevante: {enf['nombre_es']}\n"
                f"Descripción: {enf['descripcion_es']}\n"
                f"Síntomas: {', '.join(enf['sintomas_es'][:5])}\n"
                f"Tratamiento: {enf['tratamiento_es']}"
            )

        resultados_sintomas = buscar_por_sintomas(mensaje_lower)
        if resultados_sintomas:
            nombres = [enf["nombre_es"] for _, enf in resultados_sintomas]
            contexto_partes.append(
                f"Enfermedades posibles por síntomas: {', '.join(nombres)}"
            )

        # Contexto de constitución
        secciones_const = buscar_constitucion(mensaje_lower)
        if secciones_const:
            contexto_partes.append(
                f"Tema constitucional detectado: {', '.join(secciones_const)}"
            )

        # Contexto de OHADA
        secciones_ohada = buscar_ohada(mensaje_lower)
        if secciones_ohada:
            contexto_partes.append(
                f"Tema OHADA detectado: {', '.join(secciones_ohada)}"
            )

        # Contexto de historia
        secciones_hist = buscar_historia(mensaje_lower)
        if secciones_hist:
            contexto_partes.append(
                f"Tema histórico detectado: {', '.join(secciones_hist)}"
            )

        return "\n\n".join(contexto_partes)

    def _respuesta_fallback(self, mensaje, idioma):
        """Respuesta cuando no hay API de IA disponible."""
        resultados = buscar_por_sintomas(mensaje)
        if resultados:
            return self._formatear_resultados_sintomas(resultados, idioma)

        # Buscar en memoria aprendida antes de devolver "no entiendo"
        respuesta_memoria, confianza = self.memory.buscar(mensaje, idioma)
        if respuesta_memoria:
            logger.info(f"Fallback: respuesta desde memoria (confianza: {confianza:.2f})")
            return respuesta_memoria

        return obtener_frase("no_entiendo", idioma)

    def limpiar_sesion(self, user_id):
        """Limpia el historial de conversación de un usuario."""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]
