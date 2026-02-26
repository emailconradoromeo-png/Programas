"""
Sistema de memoria de conocimiento aprendido.
Guarda pares pregunta/respuesta exitosos y los reutiliza
en futuras consultas similares usando similitud por palabras clave.
"""

import sqlite3
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

# Stopwords en español para excluir de la similitud
STOPWORDS = {
    "de", "la", "el", "en", "y", "a", "los", "las", "del", "un", "una",
    "es", "se", "que", "por", "con", "no", "para", "al", "lo", "como",
    "más", "mas", "pero", "su", "sus", "le", "ya", "o", "fue", "ha",
    "son", "muy", "mi", "me", "qué", "que", "te", "tu", "nos", "si",
    "sobre", "este", "esta", "ser", "tiene", "hay", "puede", "yo",
    "cuando", "todo", "esta", "sin", "también", "entre", "después",
    "todos", "esa", "eso", "hace", "otra", "otro", "ni", "mismo",
    "hola", "cual", "cuál", "donde", "dónde", "cómo", "cuales",
    "puedo", "tengo", "tiene", "hacer", "saber", "decir",
}

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chatbot_memoria.db")


def _tokenizar(texto):
    """Tokeniza texto: minúsculas, elimina puntuación, filtra stopwords."""
    texto = texto.lower().strip()
    # Reemplazar puntuación por espacios
    for char in "¿?¡!.,;:()[]{}\"'-_/\\@#$%^&*+=~`<>":
        texto = texto.replace(char, " ")
    palabras = set(texto.split())
    return palabras - STOPWORDS


def _calcular_similitud(palabras_nueva, palabras_guardada):
    """Calcula similitud por intersección de palabras clave."""
    if not palabras_nueva or not palabras_guardada:
        return 0.0
    interseccion = palabras_nueva & palabras_guardada
    denominador = max(len(palabras_nueva), len(palabras_guardada))
    return len(interseccion) / denominador


class KnowledgeMemory:
    """Memoria de conocimiento aprendido con SQLite."""

    def __init__(self):
        self._init_db()

    def _init_db(self):
        """Inicializa la base de datos y la tabla."""
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS conocimiento_aprendido (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pregunta TEXT NOT NULL,
                    respuesta TEXT NOT NULL,
                    idioma TEXT DEFAULT 'es',
                    categoria TEXT DEFAULT 'general',
                    veces_consultado INTEGER DEFAULT 0,
                    fecha_creacion TEXT NOT NULL,
                    fecha_ultimo_uso TEXT NOT NULL
                )
            """)
            conn.commit()
            conn.close()
            logger.info("Base de datos de memoria inicializada correctamente")
        except Exception as e:
            logger.error(f"Error inicializando BD de memoria: {e}")

    def guardar(self, pregunta, respuesta, idioma="es"):
        """
        Guarda un par pregunta/respuesta.
        Si ya existe una pregunta similar, actualiza en vez de duplicar.
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            ahora = datetime.now().isoformat()

            # Verificar si ya existe una pregunta similar
            cursor.execute(
                "SELECT id, pregunta FROM conocimiento_aprendido WHERE idioma = ?",
                (idioma,),
            )
            registros = cursor.fetchall()

            palabras_nueva = _tokenizar(pregunta)

            for reg_id, reg_pregunta in registros:
                palabras_guardada = _tokenizar(reg_pregunta)
                similitud = _calcular_similitud(palabras_nueva, palabras_guardada)

                if similitud >= 0.7:
                    # Actualizar registro existente con la respuesta más reciente
                    cursor.execute(
                        """UPDATE conocimiento_aprendido
                           SET respuesta = ?, fecha_ultimo_uso = ?
                           WHERE id = ?""",
                        (respuesta, ahora, reg_id),
                    )
                    conn.commit()
                    conn.close()
                    logger.debug(f"Memoria actualizada (similitud {similitud:.2f}): {pregunta[:50]}")
                    return

            # No hay duplicado, insertar nuevo
            cursor.execute(
                """INSERT INTO conocimiento_aprendido
                   (pregunta, respuesta, idioma, fecha_creacion, fecha_ultimo_uso)
                   VALUES (?, ?, ?, ?, ?)""",
                (pregunta, respuesta, idioma, ahora, ahora),
            )
            conn.commit()
            conn.close()
            logger.debug(f"Nuevo conocimiento guardado: {pregunta[:50]}")

        except Exception as e:
            logger.error(f"Error guardando en memoria: {e}")

    def buscar(self, pregunta, idioma="es"):
        """
        Busca respuestas previas por similitud de palabras clave.
        Retorna (respuesta, confianza) o (None, 0).
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, pregunta, respuesta FROM conocimiento_aprendido WHERE idioma = ?",
                (idioma,),
            )
            registros = cursor.fetchall()

            palabras_nueva = _tokenizar(pregunta)
            mejor_match = None
            mejor_similitud = 0.0

            for reg_id, reg_pregunta, reg_respuesta in registros:
                palabras_guardada = _tokenizar(reg_pregunta)
                similitud = _calcular_similitud(palabras_nueva, palabras_guardada)

                if similitud > mejor_similitud:
                    mejor_similitud = similitud
                    mejor_match = (reg_id, reg_respuesta)

            if mejor_match and mejor_similitud >= 0.6:
                # Incrementar contador de uso
                ahora = datetime.now().isoformat()
                cursor.execute(
                    """UPDATE conocimiento_aprendido
                       SET veces_consultado = veces_consultado + 1,
                           fecha_ultimo_uso = ?
                       WHERE id = ?""",
                    (ahora, mejor_match[0]),
                )
                conn.commit()
                conn.close()
                logger.info(
                    f"Memoria encontrada (similitud {mejor_similitud:.2f}): {pregunta[:50]}"
                )
                return mejor_match[1], mejor_similitud

            conn.close()
            return None, 0.0

        except Exception as e:
            logger.error(f"Error buscando en memoria: {e}")
            return None, 0.0

    def obtener_contexto_para_ia(self, pregunta):
        """
        Devuelve respuestas parciales como contexto adicional para OpenAI.
        Busca matches con similitud >= 0.4 (umbral más bajo que buscar()).
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT pregunta, respuesta FROM conocimiento_aprendido"
            )
            registros = cursor.fetchall()
            conn.close()

            palabras_nueva = _tokenizar(pregunta)
            contextos = []

            for reg_pregunta, reg_respuesta in registros:
                palabras_guardada = _tokenizar(reg_pregunta)
                similitud = _calcular_similitud(palabras_nueva, palabras_guardada)

                if similitud >= 0.4:
                    contextos.append(
                        f"Pregunta anterior: {reg_pregunta}\n"
                        f"Respuesta: {reg_respuesta[:300]}"
                    )

            if contextos:
                # Máximo 3 contextos para no sobrecargar el prompt
                return "\n\n".join(contextos[:3])
            return ""

        except Exception as e:
            logger.error(f"Error obteniendo contexto de memoria: {e}")
            return ""
