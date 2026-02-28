"""
Sistema de memoria de conocimiento aprendido.
Guarda pares pregunta/respuesta exitosos y los reutiliza
en futuras consultas similares usando similitud por palabras clave.

Incluye sistema completo de aprendizaje:
- Historial de todas las consultas
- Perfiles persistentes de usuario
- Patrones aprendidos de preguntas frecuentes
"""

import sqlite3
import json
import logging
import os
from datetime import datetime, timedelta

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
        """Inicializa la base de datos y todas las tablas."""
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        try:
            conn = sqlite3.connect(DB_PATH)

            # Tabla original: conocimiento aprendido
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

            # Historial de TODAS las interacciones
            conn.execute("""
                CREATE TABLE IF NOT EXISTS historial_consultas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    pregunta TEXT NOT NULL,
                    respuesta TEXT NOT NULL,
                    fuente TEXT NOT NULL,
                    idioma TEXT DEFAULT 'es',
                    categoria TEXT DEFAULT 'general',
                    fecha TEXT NOT NULL
                )
            """)

            # Perfiles persistentes de usuario
            conn.execute("""
                CREATE TABLE IF NOT EXISTS perfiles_usuario (
                    user_id TEXT PRIMARY KEY,
                    idioma_preferido TEXT DEFAULT 'es',
                    total_mensajes INTEGER DEFAULT 0,
                    temas_frecuentes TEXT DEFAULT '{}',
                    primera_interaccion TEXT NOT NULL,
                    ultima_interaccion TEXT NOT NULL
                )
            """)

            # Patrones aprendidos de preguntas frecuentes
            conn.execute("""
                CREATE TABLE IF NOT EXISTS patrones_aprendidos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patron_palabras TEXT NOT NULL,
                    categoria TEXT DEFAULT 'general',
                    respuesta_sugerida TEXT NOT NULL,
                    frecuencia INTEGER DEFAULT 1,
                    idioma TEXT DEFAULT 'es',
                    fecha_creacion TEXT NOT NULL,
                    fecha_actualizacion TEXT NOT NULL
                )
            """)

            # Índices para rendimiento
            conn.execute("CREATE INDEX IF NOT EXISTS idx_historial_user ON historial_consultas(user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_consultas(fecha)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_patrones_idioma ON patrones_aprendidos(idioma)")

            conn.commit()
            conn.close()
            logger.info("Base de datos de memoria inicializada correctamente")
        except Exception as e:
            logger.error(f"Error inicializando BD de memoria: {e}")

    # ==================== Conocimiento aprendido ====================

    def guardar(self, pregunta, respuesta, idioma="es", categoria="general"):
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
                           SET respuesta = ?, categoria = ?, fecha_ultimo_uso = ?
                           WHERE id = ?""",
                        (respuesta, categoria, ahora, reg_id),
                    )
                    conn.commit()
                    conn.close()
                    logger.debug(f"Memoria actualizada (similitud {similitud:.2f}): {pregunta[:50]}")
                    return

            # No hay duplicado, insertar nuevo
            cursor.execute(
                """INSERT INTO conocimiento_aprendido
                   (pregunta, respuesta, idioma, categoria, fecha_creacion, fecha_ultimo_uso)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (pregunta, respuesta, idioma, categoria, ahora, ahora),
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

    # ==================== Historial de consultas ====================

    def registrar_consulta(self, user_id, pregunta, respuesta, fuente, idioma="es", categoria="general"):
        """Registra cada interacción en el historial completo."""
        try:
            conn = sqlite3.connect(DB_PATH)
            ahora = datetime.now().isoformat()
            conn.execute(
                """INSERT INTO historial_consultas
                   (user_id, pregunta, respuesta, fuente, idioma, categoria, fecha)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (user_id, pregunta, respuesta, fuente, idioma, categoria, ahora),
            )
            conn.commit()
            conn.close()
            logger.debug(f"Consulta registrada [{fuente}]: {pregunta[:50]}")
        except Exception as e:
            logger.error(f"Error registrando consulta: {e}")

    def obtener_historial_usuario(self, user_id, limite=10):
        """Obtiene el historial reciente de un usuario."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """SELECT pregunta, respuesta, fuente, categoria, fecha
                   FROM historial_consultas
                   WHERE user_id = ?
                   ORDER BY fecha DESC
                   LIMIT ?""",
                (user_id, limite),
            )
            registros = cursor.fetchall()
            conn.close()
            return [
                {
                    "pregunta": r[0],
                    "respuesta": r[1][:200],
                    "fuente": r[2],
                    "categoria": r[3],
                    "fecha": r[4],
                }
                for r in registros
            ]
        except Exception as e:
            logger.error(f"Error obteniendo historial: {e}")
            return []

    def obtener_temas_populares(self, limite=10, dias=30):
        """Obtiene los temas más consultados en los últimos N días."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            fecha_limite = (datetime.now() - timedelta(days=dias)).isoformat()
            cursor.execute(
                """SELECT categoria, COUNT(*) as total
                   FROM historial_consultas
                   WHERE fecha >= ?
                   GROUP BY categoria
                   ORDER BY total DESC
                   LIMIT ?""",
                (fecha_limite, limite),
            )
            registros = cursor.fetchall()
            conn.close()
            return [{"categoria": r[0], "total": r[1]} for r in registros]
        except Exception as e:
            logger.error(f"Error obteniendo temas populares: {e}")
            return []

    # ==================== Perfiles de usuario ====================

    def obtener_perfil(self, user_id):
        """Obtiene o crea perfil persistente de usuario."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM perfiles_usuario WHERE user_id = ?",
                (user_id,),
            )
            registro = cursor.fetchone()

            if registro:
                conn.close()
                return {
                    "user_id": registro[0],
                    "idioma_preferido": registro[1],
                    "total_mensajes": registro[2],
                    "temas_frecuentes": json.loads(registro[3]),
                    "primera_interaccion": registro[4],
                    "ultima_interaccion": registro[5],
                }

            # Crear perfil nuevo
            ahora = datetime.now().isoformat()
            cursor.execute(
                """INSERT INTO perfiles_usuario
                   (user_id, idioma_preferido, total_mensajes, temas_frecuentes,
                    primera_interaccion, ultima_interaccion)
                   VALUES (?, 'es', 0, '{}', ?, ?)""",
                (user_id, ahora, ahora),
            )
            conn.commit()
            conn.close()
            return {
                "user_id": user_id,
                "idioma_preferido": "es",
                "total_mensajes": 0,
                "temas_frecuentes": {},
                "primera_interaccion": ahora,
                "ultima_interaccion": ahora,
            }
        except Exception as e:
            logger.error(f"Error obteniendo perfil: {e}")
            return None

    def actualizar_perfil(self, user_id, idioma=None, tema=None):
        """Actualiza perfil con última interacción, idioma y temas."""
        try:
            # Asegurar que el perfil existe
            perfil = self.obtener_perfil(user_id)
            if not perfil:
                return

            conn = sqlite3.connect(DB_PATH)
            ahora = datetime.now().isoformat()

            # Actualizar temas frecuentes
            temas = perfil["temas_frecuentes"]
            if tema:
                temas[tema] = temas.get(tema, 0) + 1

            idioma_actual = idioma or perfil["idioma_preferido"]

            conn.execute(
                """UPDATE perfiles_usuario
                   SET idioma_preferido = ?,
                       total_mensajes = total_mensajes + 1,
                       temas_frecuentes = ?,
                       ultima_interaccion = ?
                   WHERE user_id = ?""",
                (idioma_actual, json.dumps(temas), ahora, user_id),
            )
            conn.commit()
            conn.close()
            logger.debug(f"Perfil actualizado para {user_id}")
        except Exception as e:
            logger.error(f"Error actualizando perfil: {e}")

    # ==================== Patrones aprendidos ====================

    def actualizar_patron(self, pregunta, respuesta, idioma="es", categoria="general"):
        """Crea o actualiza un patrón aprendido a partir de preguntas frecuentes."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            ahora = datetime.now().isoformat()

            palabras = _tokenizar(pregunta)
            if not palabras:
                conn.close()
                return

            patron_str = " ".join(sorted(palabras))

            # Buscar patrón similar existente
            cursor.execute(
                "SELECT id, patron_palabras, frecuencia FROM patrones_aprendidos WHERE idioma = ?",
                (idioma,),
            )
            registros = cursor.fetchall()

            for reg_id, reg_patron, reg_frecuencia in registros:
                palabras_guardada = set(reg_patron.split())
                similitud = _calcular_similitud(palabras, palabras_guardada)

                if similitud >= 0.7:
                    cursor.execute(
                        """UPDATE patrones_aprendidos
                           SET frecuencia = frecuencia + 1,
                               respuesta_sugerida = ?,
                               fecha_actualizacion = ?
                           WHERE id = ?""",
                        (respuesta, ahora, reg_id),
                    )
                    conn.commit()
                    conn.close()
                    logger.debug(f"Patrón actualizado (freq={reg_frecuencia + 1}): {patron_str[:50]}")
                    return

            # Nuevo patrón
            cursor.execute(
                """INSERT INTO patrones_aprendidos
                   (patron_palabras, categoria, respuesta_sugerida, frecuencia,
                    idioma, fecha_creacion, fecha_actualizacion)
                   VALUES (?, ?, ?, 1, ?, ?, ?)""",
                (patron_str, categoria, respuesta, idioma, ahora, ahora),
            )
            conn.commit()
            conn.close()
            logger.debug(f"Nuevo patrón creado: {patron_str[:50]}")
        except Exception as e:
            logger.error(f"Error actualizando patrón: {e}")

    def buscar_patron(self, pregunta, idioma="es"):
        """
        Busca patrón similar aprendido.
        Solo retorna si frecuencia >= 3 (patrón confirmado).
        Retorna (respuesta, frecuencia, confianza) o (None, 0, 0).
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """SELECT id, patron_palabras, respuesta_sugerida, frecuencia
                   FROM patrones_aprendidos
                   WHERE idioma = ? AND frecuencia >= 3""",
                (idioma,),
            )
            registros = cursor.fetchall()

            palabras_nueva = _tokenizar(pregunta)
            mejor_match = None
            mejor_similitud = 0.0

            for reg_id, reg_patron, reg_respuesta, reg_frecuencia in registros:
                palabras_guardada = set(reg_patron.split())
                similitud = _calcular_similitud(palabras_nueva, palabras_guardada)

                if similitud > mejor_similitud:
                    mejor_similitud = similitud
                    mejor_match = (reg_id, reg_respuesta, reg_frecuencia)

            if mejor_match and mejor_similitud >= 0.6:
                ahora = datetime.now().isoformat()
                cursor.execute(
                    """UPDATE patrones_aprendidos
                       SET frecuencia = frecuencia + 1,
                           fecha_actualizacion = ?
                       WHERE id = ?""",
                    (ahora, mejor_match[0]),
                )
                conn.commit()
                conn.close()
                logger.info(
                    f"Patrón encontrado (freq={mejor_match[2]}, sim={mejor_similitud:.2f}): {pregunta[:50]}"
                )
                return mejor_match[1], mejor_match[2], mejor_similitud

            conn.close()
            return None, 0, 0.0
        except Exception as e:
            logger.error(f"Error buscando patrón: {e}")
            return None, 0, 0.0

    # ==================== Contexto enriquecido ====================

    def obtener_contexto_enriquecido(self, pregunta, user_id):
        """
        Combina memoria + patrones + historial + tendencias para enriquecer
        el prompt de OpenAI con todo el conocimiento disponible.
        """
        partes = []

        # 1. Contexto de conocimiento aprendido
        contexto_memoria = self.obtener_contexto_para_ia(pregunta)
        if contexto_memoria:
            partes.append(f"[Conocimiento aprendido]\n{contexto_memoria}")

        # 2. Historial reciente del usuario
        historial = self.obtener_historial_usuario(user_id, limite=5)
        if historial:
            hist_texto = "\n".join(
                f"- Preguntó: {h['pregunta'][:80]} → Tema: {h['categoria']}"
                for h in historial
            )
            partes.append(f"[Historial reciente del usuario]\n{hist_texto}")

        # 3. Temas populares recientes
        temas = self.obtener_temas_populares(limite=5, dias=7)
        if temas:
            temas_texto = ", ".join(f"{t['categoria']}({t['total']})" for t in temas)
            partes.append(f"[Temas populares esta semana]\n{temas_texto}")

        # 4. Perfil del usuario
        perfil = self.obtener_perfil(user_id)
        if perfil and perfil["total_mensajes"] > 0:
            top_temas = sorted(
                perfil["temas_frecuentes"].items(),
                key=lambda x: x[1],
                reverse=True,
            )[:3]
            if top_temas:
                temas_user = ", ".join(f"{t[0]}" for t in top_temas)
                partes.append(f"[Intereses del usuario]\nTemas frecuentes: {temas_user}")

        if partes:
            return "\n\n".join(partes)
        return ""

    # ==================== Estadísticas ====================

    def obtener_estadisticas(self):
        """Estadísticas completas del sistema de aprendizaje."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            stats = {}

            # Total de conocimientos aprendidos
            cursor.execute("SELECT COUNT(*) FROM conocimiento_aprendido")
            stats["conocimientos_aprendidos"] = cursor.fetchone()[0]

            # Total de consultas registradas
            cursor.execute("SELECT COUNT(*) FROM historial_consultas")
            stats["total_consultas"] = cursor.fetchone()[0]

            # Consultas por fuente
            cursor.execute(
                """SELECT fuente, COUNT(*) as total
                   FROM historial_consultas
                   GROUP BY fuente
                   ORDER BY total DESC"""
            )
            stats["consultas_por_fuente"] = {r[0]: r[1] for r in cursor.fetchall()}

            # Consultas por categoría
            cursor.execute(
                """SELECT categoria, COUNT(*) as total
                   FROM historial_consultas
                   GROUP BY categoria
                   ORDER BY total DESC"""
            )
            stats["consultas_por_categoria"] = {r[0]: r[1] for r in cursor.fetchall()}

            # Total de usuarios únicos
            cursor.execute("SELECT COUNT(*) FROM perfiles_usuario")
            stats["usuarios_registrados"] = cursor.fetchone()[0]

            # Total de patrones aprendidos
            cursor.execute("SELECT COUNT(*) FROM patrones_aprendidos")
            stats["patrones_totales"] = cursor.fetchone()[0]

            # Patrones confirmados (frecuencia >= 3)
            cursor.execute("SELECT COUNT(*) FROM patrones_aprendidos WHERE frecuencia >= 3")
            stats["patrones_confirmados"] = cursor.fetchone()[0]

            # Top 5 patrones más frecuentes
            cursor.execute(
                """SELECT patron_palabras, categoria, frecuencia
                   FROM patrones_aprendidos
                   ORDER BY frecuencia DESC
                   LIMIT 5"""
            )
            stats["top_patrones"] = [
                {"patron": r[0], "categoria": r[1], "frecuencia": r[2]}
                for r in cursor.fetchall()
            ]

            # Consultas últimas 24 horas
            hace_24h = (datetime.now() - timedelta(hours=24)).isoformat()
            cursor.execute(
                "SELECT COUNT(*) FROM historial_consultas WHERE fecha >= ?",
                (hace_24h,),
            )
            stats["consultas_24h"] = cursor.fetchone()[0]

            # Temas populares última semana
            stats["temas_populares_semana"] = self.obtener_temas_populares(limite=10, dias=7)

            conn.close()
            return stats
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {e}")
            return {"error": str(e)}
