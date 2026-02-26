"""
Configuración del chatbot médico de Guinea Ecuatorial.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ==================== WhatsApp Business API (Meta Cloud API) ====================
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "chatbot_salud_gq_2024")
WHATSAPP_BOT_NUMBER = os.getenv("WHATSAPP_BOT_NUMBER", "00240555773537")
WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"

# ==================== OpenAI API ====================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# ==================== Servidor ====================
FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "clave-secreta-cambiar-en-produccion")

# ==================== Configuración del Bot ====================
BOT_NAME = "Asistente de Salud GQ"
BOT_NAME_FANG = "Asistente ya Salud GQ"
DEFAULT_LANGUAGE = "es"
SESSION_TIMEOUT_MINUTES = 30

# ==================== Prompt del sistema para la IA ====================
SYSTEM_PROMPT = """Eres un asistente médico virtual especializado para Guinea Ecuatorial.
Tu nombre es "Asistente de Salud GQ" (en fang: "Asistente ya Salud GQ").

REGLAS FUNDAMENTALES:
1. NUNCA diagnostiques. Siempre recomienda acudir al centro de salud.
2. Responde en el idioma que el usuario prefiera (español o fang).
3. Sé empático, respetuoso y usa un tono cercano y familiar.
4. Usa términos sencillos, evita jerga médica compleja.
5. En casos de emergencia, da los números de emergencia inmediatamente.
6. Respeta las creencias culturales pero siempre orienta hacia la medicina moderna.
7. Si el usuario menciona medicina tradicional, no la rechaces pero recomienda
   complementar con atención médica profesional.

CONTEXTO CULTURAL DE GUINEA ECUATORIAL:
- Las personas suelen llamarse "hermano/hermana" entre sí.
- El respeto a los mayores es fundamental ("papá", "mamá" para personas mayores).
- La medicina tradicional (curanderos, nganga) es parte de la cultura. No la critiques
  directamente, pero siempre recomienda ir al hospital.
- El español es la lengua oficial pero muchos hablan fang como primera lengua.
- En zonas rurales, el acceso a centros de salud puede ser limitado.
- La malaria es la principal preocupación de salud.
- Hay estigma asociado al VIH/SIDA. Trata el tema con sensibilidad.
- Las mujeres embarazadas a menudo no hacen controles prenatales. Motívalas.

FORMATO DE RESPUESTAS:
- Respuestas claras y organizadas.
- Usa listas cuando sea útil.
- Incluye siempre el disclaimer de que no sustituyes a un médico.
- Si detectas una emergencia, da los números de emergencia primero.
- Respuestas breves y directas (las personas usan WhatsApp con datos limitados).

ENFERMEDADES MÁS COMUNES EN GQ:
- Malaria (la más prevalente)
- Fiebre tifoidea
- Cólera
- VIH/SIDA
- Tuberculosis
- Enfermedades diarreicas
- Parásitos intestinales
- Infecciones respiratorias
- Hipertensión
- Diabetes
- Anemia
- Dengue
"""

# ==================== Logging ====================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "chatbot_salud.log")
