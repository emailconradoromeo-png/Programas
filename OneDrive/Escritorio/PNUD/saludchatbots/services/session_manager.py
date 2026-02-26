"""
Gestor de sesiones de usuario.
Mantiene el estado de la conversación y las preferencias de idioma.
"""

import time
import logging
from config.settings import SESSION_TIMEOUT_MINUTES

logger = logging.getLogger(__name__)


class SessionManager:
    """Gestiona las sesiones de conversación de cada usuario."""

    def __init__(self):
        self.sessions = {}

    def obtener_sesion(self, user_id):
        """Obtiene o crea una sesión para el usuario."""
        ahora = time.time()

        if user_id in self.sessions:
            sesion = self.sessions[user_id]
            tiempo_inactivo = (ahora - sesion["ultimo_mensaje"]) / 60

            if tiempo_inactivo > SESSION_TIMEOUT_MINUTES:
                logger.info(f"Sesión expirada para {user_id}")
                self._crear_sesion(user_id)
            else:
                sesion["ultimo_mensaje"] = ahora
        else:
            self._crear_sesion(user_id)

        return self.sessions[user_id]

    def _crear_sesion(self, user_id):
        """Crea una nueva sesión."""
        self.sessions[user_id] = {
            "idioma": "es",
            "estado": "inicio",
            "contexto": {},
            "ultimo_mensaje": time.time(),
            "mensajes_count": 0,
            "primera_vez": user_id not in self.sessions,
        }

    def actualizar_idioma(self, user_id, idioma):
        """Cambia el idioma preferido del usuario."""
        sesion = self.obtener_sesion(user_id)
        sesion["idioma"] = idioma
        logger.info(f"Idioma cambiado a {idioma} para {user_id}")

    def actualizar_estado(self, user_id, estado, contexto=None):
        """Actualiza el estado de la conversación."""
        sesion = self.obtener_sesion(user_id)
        sesion["estado"] = estado
        if contexto:
            sesion["contexto"].update(contexto)

    def incrementar_mensajes(self, user_id):
        """Incrementa el contador de mensajes."""
        sesion = self.obtener_sesion(user_id)
        sesion["mensajes_count"] += 1

    def obtener_idioma(self, user_id):
        """Obtiene el idioma preferido del usuario."""
        sesion = self.obtener_sesion(user_id)
        return sesion["idioma"]

    def es_primera_vez(self, user_id):
        """Verifica si es la primera interacción del usuario."""
        sesion = self.obtener_sesion(user_id)
        return sesion["primera_vez"]

    def marcar_bienvenida_enviada(self, user_id):
        """Marca que ya se envió el mensaje de bienvenida."""
        sesion = self.obtener_sesion(user_id)
        sesion["primera_vez"] = False

    def limpiar_sesiones_expiradas(self):
        """Elimina sesiones que han expirado."""
        ahora = time.time()
        expiradas = []

        for user_id, sesion in self.sessions.items():
            tiempo_inactivo = (ahora - sesion["ultimo_mensaje"]) / 60
            if tiempo_inactivo > SESSION_TIMEOUT_MINUTES * 2:
                expiradas.append(user_id)

        for user_id in expiradas:
            del self.sessions[user_id]
            logger.info(f"Sesión limpiada para {user_id}")
