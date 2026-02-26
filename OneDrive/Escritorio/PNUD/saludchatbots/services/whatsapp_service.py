"""
Servicio de WhatsApp: Integración con Meta Cloud API para WhatsApp Business.
Maneja el envío y recepción de mensajes de WhatsApp.
"""

import logging
import requests

from config.settings import (
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_API_URL,
)

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Servicio para enviar y recibir mensajes de WhatsApp."""

    def __init__(self):
        self.api_url = f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
        self.headers = {
            "Authorization": f"Bearer {WHATSAPP_TOKEN}",
            "Content-Type": "application/json",
        }

    def enviar_mensaje(self, telefono, mensaje):
        """Envía un mensaje de texto a un número de WhatsApp."""
        # WhatsApp tiene límite de 4096 caracteres por mensaje
        if len(mensaje) > 4000:
            return self._enviar_mensaje_largo(telefono, mensaje)

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": telefono,
            "type": "text",
            "text": {"preview_url": False, "body": mensaje},
        }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            logger.info(f"Mensaje enviado a {telefono}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando mensaje a {telefono}: {e}")
            return False

    def _enviar_mensaje_largo(self, telefono, mensaje):
        """Divide y envía mensajes que exceden el límite de caracteres."""
        partes = []
        while len(mensaje) > 0:
            if len(mensaje) <= 4000:
                partes.append(mensaje)
                break
            corte = mensaje[:4000].rfind("\n")
            if corte == -1:
                corte = 4000
            partes.append(mensaje[:corte])
            mensaje = mensaje[corte:].lstrip()

        exito = True
        for i, parte in enumerate(partes):
            if len(partes) > 1:
                parte = f"({i + 1}/{len(partes)})\n\n{parte}"
            if not self.enviar_mensaje(telefono, parte):
                exito = False
        return exito

    def enviar_menu_interactivo(self, telefono, titulo, cuerpo, botones):
        """Envía un mensaje con botones interactivos."""
        buttons = []
        for btn_id, btn_titulo in botones[:3]:  # Max 3 botones
            buttons.append({
                "type": "reply",
                "reply": {"id": btn_id, "title": btn_titulo[:20]},
            })

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": telefono,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": cuerpo},
                "action": {"buttons": buttons},
            },
        }

        if titulo:
            payload["interactive"]["header"] = {
                "type": "text",
                "text": titulo,
            }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            logger.info(f"Menú interactivo enviado a {telefono}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando menú a {telefono}: {e}")
            return False

    def enviar_lista(self, telefono, titulo, cuerpo, boton, secciones):
        """Envía un mensaje con lista interactiva."""
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": telefono,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {"text": cuerpo},
                "action": {
                    "button": boton[:20],
                    "sections": secciones,
                },
            },
        }

        if titulo:
            payload["interactive"]["header"] = {
                "type": "text",
                "text": titulo,
            }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            logger.info(f"Lista interactiva enviada a {telefono}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando lista a {telefono}: {e}")
            return False

    def enviar_ubicacion(self, telefono, latitud, longitud, nombre, direccion):
        """Envía una ubicación (para centros de salud)."""
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": telefono,
            "type": "location",
            "location": {
                "latitude": latitud,
                "longitude": longitud,
                "name": nombre,
                "address": direccion,
            },
        }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error enviando ubicación a {telefono}: {e}")
            return False

    def marcar_como_leido(self, message_id):
        """Marca un mensaje como leído."""
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
        }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=10,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException:
            pass  # No es crítico si falla

    @staticmethod
    def extraer_mensaje(data):
        """Extrae el mensaje del webhook de WhatsApp."""
        try:
            entry = data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            if not messages:
                return None

            message = messages[0]
            telefono = message.get("from", "")
            message_id = message.get("id", "")

            # Texto normal
            if message.get("type") == "text":
                texto = message.get("text", {}).get("body", "")
                return {
                    "telefono": telefono,
                    "message_id": message_id,
                    "texto": texto,
                    "tipo": "text",
                }

            # Respuesta de botón interactivo
            if message.get("type") == "interactive":
                interactive = message.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    return {
                        "telefono": telefono,
                        "message_id": message_id,
                        "texto": interactive["button_reply"]["id"],
                        "tipo": "button",
                    }
                if interactive.get("type") == "list_reply":
                    return {
                        "telefono": telefono,
                        "message_id": message_id,
                        "texto": interactive["list_reply"]["id"],
                        "tipo": "list",
                    }

            # Ubicación compartida
            if message.get("type") == "location":
                location = message.get("location", {})
                return {
                    "telefono": telefono,
                    "message_id": message_id,
                    "texto": f"ubicacion:{location.get('latitude')},{location.get('longitude')}",
                    "tipo": "location",
                }

            return {
                "telefono": telefono,
                "message_id": message_id,
                "texto": "[Tipo de mensaje no soportado]",
                "tipo": "unsupported",
            }

        except (IndexError, KeyError) as e:
            logger.error(f"Error extrayendo mensaje: {e}")
            return None
