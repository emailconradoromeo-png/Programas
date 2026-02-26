# Chatbot Médico para Guinea Ecuatorial
## Guía de Configuración e Instalación

### Requisitos
- Python 3.9 o superior
- Cuenta de Meta for Developers (WhatsApp Business API)
- Cuenta de OpenAI (opcional, para respuestas IA avanzadas)
- ngrok (para exponer el servidor local)

---

### Paso 1: Instalación

```bash
cd chatbot-salud-gq
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### Paso 2: Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### Paso 3: Configurar WhatsApp Business API

1. Ir a https://developers.facebook.com/
2. Crear una app de tipo "Business"
3. Agregar el producto "WhatsApp"
4. En WhatsApp > API Setup:
   - Copiar el **Token temporal** → `WHATSAPP_TOKEN`
   - Copiar el **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
5. Configurar el Webhook:
   - URL: `https://tu-dominio.ngrok.io/webhook`
   - Verify Token: `chatbot_salud_gq_2024`
   - Suscribir a: `messages`

### Paso 4: Ejecutar

```bash
# Terminal 1: Iniciar el servidor
python app.py

# Terminal 2: Exponer con ngrok
ngrok http 5000
```

### Paso 5: Probar

- **Con WhatsApp**: Enviar mensaje al número configurado
- **Sin WhatsApp**: Abrir http://localhost:5000/test en el navegador

---

### Estructura del Proyecto

```
chatbot-salud-gq/
├── app.py                          # Aplicación principal Flask
├── config/
│   └── settings.py                 # Configuración
├── knowledge/
│   ├── enfermedades.py             # Base de datos de enfermedades GQ
│   ├── centros_salud.py            # Directorio de centros de salud
│   └── idioma_fang.py              # Frases bilingüe español/fang
├── services/
│   ├── ai_service.py               # Servicio de IA (OpenAI)
│   ├── whatsapp_service.py         # Integración WhatsApp API
│   └── session_manager.py          # Gestor de sesiones
├── requirements.txt
├── .env.example
└── GUIA_CONFIGURACION.md
```

### Comandos del Chatbot

| Comando | Descripción |
|---------|------------|
| menu    | Ver menú principal |
| 1       | Consultar síntomas |
| 2       | Buscar centro de salud |
| 3       | Lista de enfermedades |
| 4       | Números de emergencia |
| 5       | Cambiar idioma |
| 6       | Primeros auxilios |
| fang    | Cambiar a idioma fang |
| español | Cambiar a español |
