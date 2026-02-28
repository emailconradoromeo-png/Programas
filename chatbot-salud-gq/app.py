"""
Chatbot Médico para Guinea Ecuatorial
Asistente de salud bilingüe (Español/Fang) integrado con WhatsApp.

Autor: Asistente de Salud GQ
Descripción: Chatbot de IA que actúa como orientador médico,
             con información sobre enfermedades prevalentes en GQ,
             directorio de centros de salud y soporte bilingüe.
"""

import logging
import os
from datetime import datetime

from flask import Flask, request, jsonify

from config.settings import (
    FLASK_HOST,
    FLASK_PORT,
    FLASK_DEBUG,
    SECRET_KEY,
    GREEN_API_INSTANCE_ID,
    LOG_LEVEL,
    LOG_FILE,
)
from services.knowledge_memory import KnowledgeMemory
from services.ai_service import AIService
from services.whatsapp_service import WhatsAppService
from services.session_manager import SessionManager
from knowledge.idioma_fang import obtener_frase, obtener_saludo
from knowledge.enfermedades import listar_enfermedades
from knowledge.centros_salud import formatear_emergencias, listar_regiones

# ==================== Configuración de logging ====================
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# ==================== Inicialización ====================
app = Flask(__name__)
app.secret_key = SECRET_KEY

memory = KnowledgeMemory()
ai_service = AIService(memory=memory)
whatsapp_service = WhatsAppService()
session_manager = SessionManager(memory=memory)


# ==================== Procesador de mensajes ====================
def procesar_mensaje(telefono, texto, tipo_mensaje="text"):
    """
    Procesa un mensaje entrante y genera la respuesta apropiada.
    Este es el cerebro del chatbot.
    """
    sesion = session_manager.obtener_sesion(telefono)
    idioma = sesion["idioma"]
    texto_lower = texto.lower().strip()
    session_manager.incrementar_mensajes(telefono)

    # === Mensaje de bienvenida para nuevos usuarios ===
    if session_manager.es_primera_vez(telefono):
        session_manager.marcar_bienvenida_enviada(telefono)
        hora = datetime.now().hour
        saludo = obtener_saludo(hora, idioma)
        bienvenida = (
            f"{saludo}\n\n"
            f"{obtener_frase('saludo', idioma)}\n\n"
            f"{obtener_frase('menu_principal', idioma)}"
        )
        memory.registrar_consulta(telefono, texto, bienvenida, "menu", idioma, "bienvenida")
        return bienvenida

    # === Comandos de navegación ===
    if texto_lower in ("menu", "menú", "inicio", "ayuda", "help", "hola", "hi"):
        respuesta_menu = obtener_frase("menu_principal", idioma)
        memory.registrar_consulta(telefono, texto, respuesta_menu, "menu", idioma, "menu")
        return respuesta_menu

    # Cambio de idioma
    if texto_lower in ("fang", "lengua fang", "en fang", "habla fang", "fang language"):
        session_manager.actualizar_idioma(telefono, "fang")
        respuesta_idioma = (
            obtener_frase("cambio_idioma_fang", "fang")
            + "\n\n"
            + obtener_frase("menu_principal", "fang")
        )
        memory.registrar_consulta(telefono, texto, respuesta_idioma, "menu", "fang", "idioma")
        return respuesta_idioma

    if texto_lower in (
        "español", "espanol", "castellano", "en español",
        "habla español", "spanish",
    ):
        session_manager.actualizar_idioma(telefono, "es")
        respuesta_idioma = (
            obtener_frase("cambio_idioma_es", "es")
            + "\n\n"
            + obtener_frase("menu_principal", "es")
        )
        memory.registrar_consulta(telefono, texto, respuesta_idioma, "menu", "es", "idioma")
        return respuesta_idioma

    # === Opciones del menú por número ===
    if texto_lower == "1" or texto_lower == "sintomas" or texto_lower == "síntomas":
        session_manager.actualizar_estado(telefono, "esperando_sintomas")
        respuesta_sintomas = obtener_frase("pregunta_sintomas", idioma)
        memory.registrar_consulta(telefono, texto, respuesta_sintomas, "menu", idioma, "sintomas")
        return respuesta_sintomas

    if texto_lower == "2" or texto_lower == "centros" or texto_lower == "hospital":
        session_manager.actualizar_estado(telefono, "esperando_ubicacion")
        respuesta_centros = obtener_frase("pidiendo_ubicacion", idioma)
        memory.registrar_consulta(telefono, texto, respuesta_centros, "menu", idioma, "centros_salud")
        return respuesta_centros

    if texto_lower == "3" or texto_lower == "enfermedades" or texto_lower == "lista":
        lista = listar_enfermedades()
        if idioma == "fang":
            encabezado = "*Beki bi ne ntangan Guinea Ecuatorial:*\n\n"
            pie = "\n\nFila nombre ya eki a yia minsón mese."
        else:
            encabezado = "*Enfermedades comunes en Guinea Ecuatorial:*\n\n"
            pie = "\n\nEscribe el nombre de la enfermedad para más información."
        respuesta_enf = encabezado + lista + pie
        memory.registrar_consulta(telefono, texto, respuesta_enf, "menu", idioma, "enfermedad")
        return respuesta_enf

    if texto_lower == "4" or texto_lower == "emergencia" or texto_lower == "emergencias":
        respuesta_emerg = formatear_emergencias()
        memory.registrar_consulta(telefono, texto, respuesta_emerg, "menu", idioma, "emergencia")
        return respuesta_emerg

    if texto_lower == "5" or texto_lower == "idioma":
        if idioma == "es":
            respuesta_idioma_menu = (
                "Selecciona tu idioma:\n\n"
                "- Escribe *español* para continuar en español\n"
                "- Escribe *fang* para cambiar a fang\n\n"
                "Select your language:\n"
                "- Write *español* for Spanish\n"
                "- Write *fang* for Fang language"
            )
        else:
            respuesta_idioma_menu = (
                "Yia idioma ya wo:\n\n"
                "- Fila *español* a ke español\n"
                "- Fila *fang* a ke fang\n\n"
                "Selecciona tu idioma:\n"
                "- Escribe *español* para español\n"
                "- Escribe *fang* para fang"
            )
        memory.registrar_consulta(telefono, texto, respuesta_idioma_menu, "menu", idioma, "idioma")
        return respuesta_idioma_menu

    if texto_lower == "6" or texto_lower == "primeros auxilios":
        if idioma == "fang":
            respuesta_pa = (
                "*Primeros auxilios básicos:*\n\n"
                "*Efie (Fiebre):*\n"
                + obtener_frase("primeros_auxilios_fiebre", "fang")
                + "\n\n*Nsus nnam (Diarrea):*\n"
                + obtener_frase("primeros_auxilios_diarrea", "fang")
            )
        else:
            respuesta_pa = (
                "*Primeros auxilios básicos:*\n\n"
                "*Fiebre:*\n"
                + obtener_frase("primeros_auxilios_fiebre", "es")
                + "\n\n*Diarrea:*\n"
                + obtener_frase("primeros_auxilios_diarrea", "es")
            )
        memory.registrar_consulta(telefono, texto, respuesta_pa, "menu", idioma, "primeros_auxilios")
        return respuesta_pa

    # === Consejos periódicos ===
    if sesion["mensajes_count"] % 5 == 0:
        consejo = ""
        if sesion["mensajes_count"] % 10 == 0:
            consejo = "\n\n---\n" + obtener_frase("consejo_mosquitero", idioma)
        elif sesion["mensajes_count"] % 15 == 0:
            consejo = "\n\n---\n" + obtener_frase("consejo_agua", idioma)

    # === Despedida ===
    if texto_lower in (
        "gracias", "adios", "adiós", "chao", "bye",
        "hasta luego", "akeva", "mbolo",
    ):
        respuesta_despedida = obtener_frase("despedida", idioma)
        memory.registrar_consulta(telefono, texto, respuesta_despedida, "menu", idioma, "despedida")
        return respuesta_despedida

    # === Consulta a la IA para todo lo demás ===
    respuesta = ai_service.generar_respuesta(telefono, texto, idioma)
    return respuesta


# ==================== Rutas de Flask ====================
@app.route("/", methods=["GET"])
def index():
    """Página de inicio / verificación de estado."""
    return jsonify({
        "status": "active",
        "service": "Chatbot Médico Guinea Ecuatorial",
        "version": "1.0.0",
        "whatsapp": "Green API",
        "languages": ["español", "fang"],
        "description": (
            "Asistente de salud bilingüe para Guinea Ecuatorial "
            "integrado con WhatsApp"
        ),
    })


@app.route("/webhook", methods=["GET"])
def verificar_webhook():
    """
    Verificación del webhook (Green API).
    Devuelve 200 para confirmar que el endpoint está activo.
    """
    logger.info("Webhook verificado correctamente")
    return "OK", 200


@app.route("/webhook", methods=["POST"])
def recibir_mensaje():
    """
    Recibe mensajes de WhatsApp via webhook de Green API.
    Green API envía JSON con la estructura de notificación.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"status": "no data"}), 200

        # Extraer información del mensaje
        mensaje_info = WhatsAppService.extraer_mensaje(data)

        if not mensaje_info:
            return jsonify({"status": "no message"}), 200

        telefono = mensaje_info["telefono"]
        texto = mensaje_info["texto"]
        message_id = mensaje_info["message_id"]
        tipo = mensaje_info["tipo"]

        logger.info(f"Mensaje recibido de {telefono}: {texto[:50]}...")

        # Marcar como leído
        whatsapp_service.marcar_como_leido(telefono, message_id)

        # No procesar mensajes no soportados
        if tipo == "unsupported":
            idioma = session_manager.obtener_idioma(telefono)
            whatsapp_service.enviar_mensaje(
                telefono,
                obtener_frase("no_entiendo", idioma),
            )
            return jsonify({"status": "ok"}), 200

        # Procesar y responder
        respuesta = procesar_mensaje(telefono, texto, tipo)
        whatsapp_service.enviar_mensaje(telefono, respuesta)

        logger.info(f"Respuesta enviada a {telefono}")
        return jsonify({"status": "ok"}), 200

    except Exception as e:
        logger.error(f"Error procesando webhook: {e}", exc_info=True)
        return jsonify({"status": "error"}), 200


# ==================== Ruta de prueba (sin WhatsApp) ====================
@app.route("/test", methods=["GET"])
def pagina_test():
    """Página HTML simple para probar el chatbot sin WhatsApp, con soporte de voz."""
    return """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot Salud GQ - Prueba</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', sans-serif;
                background: #0a1628;
                color: #e0e0e0;
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
            .header {
                background: linear-gradient(135deg, #006B3F, #CE1126);
                padding: 15px 20px;
                text-align: center;
                color: white;
                position: relative;
            }
            .header h1 { font-size: 1.2em; }
            .header p { font-size: 0.8em; opacity: 0.9; }
            .auto-read-toggle {
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.75em;
                cursor: pointer;
                user-select: none;
            }
            .auto-read-toggle input { display: none; }
            .toggle-slider {
                width: 36px;
                height: 20px;
                background: rgba(255,255,255,0.3);
                border-radius: 10px;
                position: relative;
                transition: background 0.3s;
            }
            .toggle-slider::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: transform 0.3s;
            }
            .auto-read-toggle input:checked + .toggle-slider {
                background: rgba(255,255,255,0.7);
            }
            .auto-read-toggle input:checked + .toggle-slider::after {
                transform: translateX(16px);
            }
            .flag-bar {
                height: 4px;
                background: linear-gradient(90deg, #006B3F 33%, #fff 33%, #fff 66%, #CE1126 66%);
            }
            #chat {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .message {
                max-width: 80%;
                padding: 10px 14px;
                border-radius: 12px;
                line-height: 1.5;
                font-size: 0.9em;
                white-space: pre-wrap;
            }
            .bot {
                background: #1a2744;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                border: 1px solid #2a3a5c;
                position: relative;
            }
            .user {
                background: #006B3F;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .bot-msg-wrapper {
                align-self: flex-start;
                max-width: 80%;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .bot-msg-wrapper .message { max-width: 100%; }
            .btn-speak {
                background: none;
                border: none;
                color: #6a8bb5;
                cursor: pointer;
                font-size: 0.75em;
                padding: 2px 8px;
                border-radius: 8px;
                width: auto;
                height: auto;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                align-self: flex-start;
                transition: color 0.2s;
            }
            .btn-speak:hover { color: #8ab4f8; background: rgba(255,255,255,0.05); }
            .btn-speak.speaking { color: #CE1126; }
            .input-area {
                padding: 10px;
                background: #0d1f3c;
                display: flex;
                gap: 8px;
                border-top: 1px solid #2a3a5c;
                align-items: center;
            }
            #msg {
                flex: 1;
                padding: 10px 14px;
                border: 1px solid #2a3a5c;
                border-radius: 20px;
                background: #1a2744;
                color: #e0e0e0;
                font-size: 0.9em;
                outline: none;
            }
            #msg:focus { border-color: #006B3F; }
            #msg::placeholder { color: #666; }
            .btn-circle {
                background: #006B3F;
                color: white;
                border: none;
                border-radius: 50%;
                width: 42px;
                height: 42px;
                cursor: pointer;
                font-size: 1.2em;
                transition: background 0.2s;
                flex-shrink: 0;
            }
            .btn-circle:hover { background: #008B4F; }
            #btnMic {
                background: #1a2744;
                border: 2px solid #2a3a5c;
                font-size: 1.1em;
            }
            #btnMic:hover { background: #253556; }
            #btnMic.recording {
                background: #CE1126;
                border-color: #CE1126;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(206,17,38,0.5); }
                70% { box-shadow: 0 0 0 10px rgba(206,17,38,0); }
                100% { box-shadow: 0 0 0 0 rgba(206,17,38,0); }
            }
            .listening-indicator {
                text-align: center;
                padding: 6px;
                background: rgba(206,17,38,0.15);
                color: #ff6b7a;
                font-size: 0.8em;
                display: none;
                border-top: 1px solid rgba(206,17,38,0.3);
            }
            .listening-indicator.active { display: block; }
            .typing { opacity: 0.6; font-style: italic; }
            .voice-unsupported {
                text-align: center;
                padding: 8px;
                background: rgba(206,17,38,0.1);
                color: #ff6b7a;
                font-size: 0.75em;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Asistente de Salud GQ</h1>
            <p>WhatsApp: +240 555 773 537 | Guinea Ecuatorial</p>
            <label class="auto-read-toggle" title="Leer respuestas automaticamente">
                <span>&#128264; Auto</span>
                <input type="checkbox" id="autoRead" onchange="toggleAutoLectura()">
                <div class="toggle-slider"></div>
            </label>
        </div>
        <div class="flag-bar"></div>
        <div id="voiceUnsupported" class="voice-unsupported">
            Tu navegador no soporta voz. Usa Chrome o Edge para funciones de voz.
        </div>
        <div id="chat"></div>
        <div id="listeningIndicator" class="listening-indicator">
            &#127908; Escuchando... habla ahora
        </div>
        <div class="input-area">
            <button id="btnMic" class="btn-circle" onclick="toggleVoz()" title="Hablar">
                &#127908;
            </button>
            <input type="text" id="msg" placeholder="Escribe tu mensaje o pulsa el microfono..."
                   onkeypress="if(event.key==='Enter')enviar()">
            <button class="btn-circle" onclick="enviar()" title="Enviar">&#10148;</button>
        </div>
        <script>
            const chat = document.getElementById('chat');
            const btnMic = document.getElementById('btnMic');
            const listeningIndicator = document.getElementById('listeningIndicator');
            let autoLectura = false;
            let recognition = null;
            let isRecording = false;
            let currentUtterance = null;

            // === Verificar soporte de Web Speech API ===
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const speechSynthSupported = 'speechSynthesis' in window;

            if (!SpeechRecognition) {
                btnMic.style.display = 'none';
                document.getElementById('voiceUnsupported').style.display = 'block';
            }

            // === Mensajes ===
            function addMsg(text, isUser) {
                if (isUser) {
                    const div = document.createElement('div');
                    div.className = 'message user';
                    div.textContent = text;
                    chat.appendChild(div);
                } else {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'bot-msg-wrapper';

                    const div = document.createElement('div');
                    div.className = 'message bot';
                    div.textContent = text;
                    wrapper.appendChild(div);

                    if (speechSynthSupported) {
                        const btn = document.createElement('button');
                        btn.className = 'btn-speak';
                        btn.innerHTML = '&#128264; Escuchar';
                        btn.onclick = function() { leerMensaje(text, btn); };
                        wrapper.appendChild(btn);
                    }

                    chat.appendChild(wrapper);

                    if (autoLectura && speechSynthSupported) {
                        leerMensaje(text, wrapper.querySelector('.btn-speak'));
                    }
                }
                chat.scrollTop = chat.scrollHeight;
            }

            // === Enviar mensaje ===
            async function enviar() {
                const input = document.getElementById('msg');
                const text = input.value.trim();
                if (!text) return;

                addMsg(text, true);
                input.value = '';

                const typing = document.createElement('div');
                typing.className = 'message bot typing';
                typing.textContent = 'Escribiendo...';
                chat.appendChild(typing);
                chat.scrollTop = chat.scrollHeight;

                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({mensaje: text, telefono: 'test-user'})
                    });
                    const data = await res.json();
                    typing.remove();
                    addMsg(data.respuesta, false);
                } catch(e) {
                    typing.remove();
                    addMsg('Error de conexion. Intente de nuevo.', false);
                }
            }

            // === Voz: SpeechRecognition ===
            function toggleVoz() {
                if (isRecording) {
                    detenerVoz();
                } else {
                    iniciarVoz();
                }
            }

            function iniciarVoz() {
                if (!SpeechRecognition) return;

                // Detener cualquier lectura en curso
                if (speechSynthSupported) {
                    window.speechSynthesis.cancel();
                }

                recognition = new SpeechRecognition();
                recognition.lang = 'es-ES';
                recognition.interimResults = true;
                recognition.continuous = false;
                recognition.maxAlternatives = 1;

                recognition.onstart = function() {
                    isRecording = true;
                    btnMic.classList.add('recording');
                    listeningIndicator.classList.add('active');
                    document.getElementById('msg').placeholder = 'Escuchando...';
                };

                recognition.onresult = function(event) {
                    const result = event.results[event.results.length - 1];
                    const transcript = result[0].transcript;
                    document.getElementById('msg').value = transcript;

                    if (result.isFinal) {
                        detenerVoz();
                        if (transcript.trim()) {
                            enviar();
                        }
                    }
                };

                recognition.onerror = function(event) {
                    console.error('Error de reconocimiento:', event.error);
                    detenerVoz();
                    if (event.error === 'no-speech') {
                        document.getElementById('msg').placeholder = 'No se detecto voz. Intenta de nuevo...';
                        setTimeout(function() {
                            document.getElementById('msg').placeholder = 'Escribe tu mensaje o pulsa el microfono...';
                        }, 2000);
                    }
                };

                recognition.onend = function() {
                    detenerVoz();
                };

                try {
                    recognition.start();
                } catch(e) {
                    console.error('No se pudo iniciar reconocimiento:', e);
                }
            }

            function detenerVoz() {
                isRecording = false;
                btnMic.classList.remove('recording');
                listeningIndicator.classList.remove('active');
                document.getElementById('msg').placeholder = 'Escribe tu mensaje o pulsa el microfono...';
                if (recognition) {
                    try { recognition.stop(); } catch(e) {}
                }
            }

            // === Voz: SpeechSynthesis ===
            function leerMensaje(texto, btn) {
                if (!speechSynthSupported) return;

                // Si ya esta leyendo este mismo texto, detener
                if (btn && btn.classList.contains('speaking')) {
                    window.speechSynthesis.cancel();
                    btn.classList.remove('speaking');
                    btn.innerHTML = '&#128264; Escuchar';
                    return;
                }

                // Detener cualquier lectura previa
                window.speechSynthesis.cancel();
                document.querySelectorAll('.btn-speak.speaking').forEach(function(b) {
                    b.classList.remove('speaking');
                    b.innerHTML = '&#128264; Escuchar';
                });

                const utterance = new SpeechSynthesisUtterance(texto);
                utterance.lang = 'es-ES';
                utterance.rate = 0.95;
                utterance.pitch = 1;

                if (btn) {
                    btn.classList.add('speaking');
                    btn.innerHTML = '&#9632; Detener';
                }

                utterance.onend = function() {
                    if (btn) {
                        btn.classList.remove('speaking');
                        btn.innerHTML = '&#128264; Escuchar';
                    }
                };

                utterance.onerror = function() {
                    if (btn) {
                        btn.classList.remove('speaking');
                        btn.innerHTML = '&#128264; Escuchar';
                    }
                };

                window.speechSynthesis.speak(utterance);
            }

            // === Auto-lectura toggle ===
            function toggleAutoLectura() {
                autoLectura = document.getElementById('autoRead').checked;
            }

            // Mensaje inicial
            addMsg('Hola, soy tu asistente de salud para Guinea Ecuatorial.\\nEstoy aqui para ayudarte con informacion medica.\\n\\nEscribe "menu" para ver las opciones, o pulsa el microfono para hablar.', false);
        </script>
    </body>
    </html>
    """


@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    API REST para probar el chatbot sin WhatsApp.
    Útil para desarrollo y testing.
    """
    try:
        data = request.get_json()
        mensaje = data.get("mensaje", "")
        telefono = data.get("telefono", "test-user")

        if not mensaje:
            return jsonify({"error": "No se proporcionó mensaje"}), 400

        respuesta = procesar_mensaje(telefono, mensaje)
        return jsonify({"respuesta": respuesta, "status": "ok"})

    except Exception as e:
        logger.error(f"Error en API chat: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/stats", methods=["GET"])
def api_stats():
    """Endpoint para ver estadísticas del sistema de aprendizaje."""
    try:
        stats = memory.obtener_estadisticas()
        return jsonify({"status": "ok", "estadisticas": stats})
    except Exception as e:
        logger.error(f"Error en API stats: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ==================== Punto de entrada ====================
if __name__ == "__main__":
    # Crear directorio data/ para la base de datos de memoria
    os.makedirs(os.path.join(os.path.dirname(__file__), "data"), exist_ok=True)

    logger.info("=" * 60)
    logger.info("Iniciando Chatbot Médico de Guinea Ecuatorial")
    logger.info(f"Servidor: {FLASK_HOST}:{FLASK_PORT}")
    logger.info(f"WhatsApp via Green API (Instance: {GREEN_API_INSTANCE_ID})")
    logger.info("Idiomas: Español, Fang")
    logger.info("Sistema de memoria aprendida: ACTIVO")
    logger.info("Sistema de aprendizaje completo: ACTIVO")
    logger.info("Endpoint de estadísticas: /api/stats")
    logger.info("=" * 60)

    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=FLASK_DEBUG,
    )
