# Asistente Inteligente de Guinea Ecuatorial
## Chatbot Bilingue con IA, Aprendizaje Automatico e Integracion WhatsApp

---

## 1. Resumen Ejecutivo

El **Asistente GQ** es un chatbot inteligente bilingue (Espanol/Fang) integrado con WhatsApp, disenado especificamente para Guinea Ecuatorial. Combina inteligencia artificial (OpenAI GPT), una base de conocimiento local exhaustiva y un sistema de aprendizaje automatico que mejora con cada conversacion.

**Lo que lo hace unico:**
- Unico chatbot en Africa hispanofona con conocimiento integrado de salud, derecho mercantil (OHADA), constitucion e historia nacional
- Bilingue: Espanol y Fang (lengua del 80% de la poblacion)
- Sistema de memoria que aprende de cada interaccion y persiste entre reinicios
- Accesible via WhatsApp, la aplicacion mas usada en el pais

---

## 2. Problema que Resuelve

| Problema | Solucion |
|----------|----------|
| Acceso limitado a informacion medica en zonas rurales | Informacion de 13 enfermedades prevalentes + directorio de centros de salud por region |
| Barrera linguistica (muchos solo hablan Fang) | Soporte completo bilingue Espanol/Fang |
| Desconocimiento de derechos constitucionales | Base de conocimiento de la Constitucion de GQ (reforma 2012) |
| Dificultad para emprender y conocer leyes mercantiles | Guia completa de OHADA: tipos de sociedad, requisitos, actas uniformes |
| Desconocimiento de la historia nacional | 8 periodos historicos, grupos etnicos, datos actuales |
| No hay asistentes virtuales adaptados a GQ | Primer asistente inteligente culturalmente adaptado al pais |

---

## 3. Arquitectura Tecnica

### 3.1 Stack Tecnologico

```
+------------------+     +------------------+     +------------------+
|   WhatsApp       |     |   Navegador Web  |     |   API REST       |
|   (Green API)    |     |   /test          |     |   /api/chat      |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                        |
         +-------------------------+------------------------+
                                   |
                          +--------v---------+
                          |    Flask App     |
                          |    (app.py)      |
                          +--------+---------+
                                   |
                 +-----------------+-----------------+
                 |                 |                 |
        +--------v------+  +------v-------+  +------v--------+
        | AI Service    |  | Session Mgr  |  | WhatsApp Svc  |
        | (OpenAI GPT)  |  | (Perfiles)   |  | (Green API)   |
        +--------+------+  +------+-------+  +---------------+
                 |                 |
        +--------v-----------------v--------+
        |     Knowledge Memory (SQLite)     |
        |  - Conocimiento aprendido         |
        |  - Historial de consultas         |
        |  - Perfiles de usuario            |
        |  - Patrones aprendidos            |
        +--------+-------------------------+
                 |
    +------------+-------------+-------------+-------------+
    |            |             |             |             |
+---v---+  +----v----+  +-----v-----+  +---v----+  +----v-----+
|Enfer- |  |Centros  |  |Constitu-  |  |OHADA   |  |Historia  |
|medades|  |de Salud |  |cion GQ    |  |Derecho |  |de GQ     |
|  (13) |  | (8 reg) |  |(7 titulos)|  |Mercantil| |(8 epocas)|
+-------+  +---------+  +-----------+  +--------+  +----------+
```

### 3.2 Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| Backend | Python 3 + Flask |
| Inteligencia Artificial | OpenAI GPT-4o-mini |
| Base de Datos | SQLite (persistencia sin servidor externo) |
| Mensajeria | WhatsApp via Green API |
| Tunelizacion | Ngrok (exposicion a internet) |
| Interfaz web | HTML5 + CSS3 + JavaScript (Web Speech API) |
| Despliegue | Gunicorn (produccion) |

### 3.3 Estructura del Proyecto

```
chatbot-salud-gq/
|-- app.py                          # Aplicacion principal Flask
|-- config/
|   |-- settings.py                 # Configuracion y prompt del sistema
|-- knowledge/                      # Bases de conocimiento
|   |-- enfermedades.py            # 13 enfermedades con sintomas bilingues
|   |-- centros_salud.py           # Directorio nacional de centros de salud
|   |-- idioma_fang.py             # Sistema bilingue Espanol/Fang
|   |-- constitucion_gq.py        # Constitucion de Guinea Ecuatorial
|   |-- ohada.py                   # Derecho mercantil OHADA
|   |-- historia_gq.py            # Historia de Guinea Ecuatorial
|-- services/                       # Servicios del sistema
|   |-- ai_service.py             # Motor de IA con 6 niveles de respuesta
|   |-- knowledge_memory.py       # Sistema de aprendizaje con 4 tablas
|   |-- session_manager.py        # Gestion de sesiones persistentes
|   |-- whatsapp_service.py       # Integracion WhatsApp
|-- data/
|   |-- chatbot_memoria.db        # Base de datos SQLite
```

---

## 4. Funcionalidades Principales

### 4.1 Menu del Chatbot (9 opciones)

**Salud:**
1. Consultar sintomas
2. Buscar centro de salud cercano
3. Lista de enfermedades comunes
4. Numeros de emergencia
5. Cambiar idioma (Espanol/Fang)
6. Primeros auxilios

**Guinea Ecuatorial:**
7. Constitucion de GQ
8. OHADA (Derecho Mercantil)
9. Historia de Guinea Ecuatorial

### 4.2 Modulo de Salud

- **13 enfermedades** documentadas con nombre en Espanol y Fang, sintomas, prevencion, tratamiento y nivel de urgencia
- **Enfermedades cubiertas:** Malaria, Fiebre Tifoidea, Colera, VIH/SIDA, Tuberculosis, Enfermedades Diarreicas, Parasitos Intestinales, Infecciones Respiratorias, Hipertension, Diabetes, Anemia, Dengue
- **Directorio de centros de salud** en 8 regiones con telefono, direccion, horario y servicios
- **Deteccion de emergencias** automatica con numeros de contacto inmediato
- **Busqueda por sintomas** que sugiere posibles enfermedades

### 4.3 Modulo de Constitucion

- Estructura completa (7 Titulos, 104+ Articulos)
- Derechos y deberes fundamentales con referencia a articulos
- Los 3 poderes del Estado (Ejecutivo, Legislativo, Judicial)
- Organizacion territorial (regiones, provincias, distritos)
- Simbolos nacionales (bandera, escudo, himno, lema)

### 4.4 Modulo de OHADA

- 10 Actas Uniformes explicadas (comercio, sociedades, garantias, arbitraje, contabilidad...)
- Guia para crear empresa: 5 tipos de sociedad (SARL, SA, SAS, SNC, GIE) con capital minimo
- 4 instituciones de la OHADA
- 17 paises miembros
- Importancia especifica para Guinea Ecuatorial

### 4.5 Modulo de Historia

- 8 periodos historicos: precolonial, portugues, colonial espanol, independencia, primera republica, segunda republica, datos actuales
- 6 grupos etnicos detallados (Fang, Bubi, Ndowe, Annoboneses, Bisio, Fernandinos)
- Fechas clave y eventos historicos

---

## 5. Sistema de Aprendizaje Automatico

### 5.1 Como Aprende el Chatbot

El chatbot tiene un sistema de **aprendizaje continuo** basado en 4 tablas SQLite:

```
INTERACCION DEL USUARIO
        |
        v
+-------+--------+     +------------------+     +------------------+
| 1. Registrar   |---->| historial_       |     | Historial        |
|    consulta    |     | consultas        |     | completo de      |
|                |     | (user, pregunta, |     | TODAS las        |
|                |     |  respuesta,      |     | interacciones    |
|                |     |  fuente, idioma) |     |                  |
+-------+--------+     +------------------+     +------------------+
        |
        v
+-------+--------+     +------------------+     +------------------+
| 2. Guardar     |---->| conocimiento_    |     | Pares pregunta/  |
|    conocimiento|     | aprendido        |     | respuesta        |
|    (si es util)|     | (pregunta,       |     | exitosos para    |
|                |     |  respuesta,      |     | reutilizar       |
|                |     |  similitud 70%)  |     |                  |
+-------+--------+     +------------------+     +------------------+
        |
        v
+-------+--------+     +------------------+     +------------------+
| 3. Actualizar  |---->| patrones_        |     | Preguntas        |
|    patron      |     | aprendidos       |     | frecuentes       |
|                |     | (patron, freq,   |     | (activos cuando  |
|                |     |  categoria)      |     |  freq >= 3)      |
+-------+--------+     +------------------+     +------------------+
        |
        v
+-------+--------+     +------------------+     +------------------+
| 4. Actualizar  |---->| perfiles_        |     | Preferencias     |
|    perfil      |     | usuario          |     | persistentes     |
|    usuario     |     | (idioma, temas,  |     | (sobreviven      |
|                |     |  mensajes)       |     |  reinicios)      |
+----------------+     +------------------+     +------------------+
```

### 5.2 Jerarquia de Respuesta Inteligente (6 Niveles)

```
MENSAJE DEL USUARIO
    |
    v
1. EMERGENCIA? ----SI----> Numeros de emergencia + instrucciones
    |NO
    v
2. BASE LOCAL? ----SI----> Enfermedad/Centro/Constitucion/OHADA/Historia
    |NO
    v
3. MEMORIA? -------SI----> Respuesta aprendida previamente (confianza >= 60%)
    |NO
    v
4. PATRON? --------SI----> Respuesta de patron frecuente (freq >= 3, conf >= 60%)
    |NO
    v
5. OpenAI GPT? ----SI----> Respuesta IA con contexto enriquecido
    |NO (sin API key)
    v
6. FALLBACK -------------> Busqueda por sintomas + guia al usuario
```

### 5.3 Contexto Enriquecido para la IA

Cuando se consulta a OpenAI, el chatbot envia:
- Contexto de la base de conocimiento local relevante
- Conocimiento aprendido de consultas anteriores similares
- Historial reciente del usuario (ultimas 5 consultas)
- Temas populares de la semana
- Intereses del usuario (temas frecuentes)

Esto hace que las respuestas de la IA sean **mucho mas relevantes y contextualizadas**.

---

## 6. Integracion con WhatsApp

```
USUARIO WHATSAPP
    |
    | Envia mensaje
    v
GREEN API (Cloud)
    |
    | Webhook POST /webhook
    v
NGROK (Tunel seguro)
    |
    | HTTPS -> HTTP
    v
FLASK SERVER (localhost:5000)
    |
    | Procesa mensaje
    | Genera respuesta
    v
GREEN API (Cloud)
    |
    | Envia respuesta
    v
USUARIO WHATSAPP (recibe respuesta)
```

**Caracteristicas de la integracion:**
- Mensajes de texto y texto extendido
- Mensajes de ubicacion (extrae coordenadas)
- Division automatica de mensajes largos (>4000 caracteres)
- Marcado como leido automatico
- Manejo de tipos no soportados

---

## 7. Interfaz Web de Prueba

El chatbot incluye una interfaz web en `/test` con:

- **Diseno oscuro** con colores de la bandera de GQ (verde, blanco, rojo)
- **Reconocimiento de voz** (Web Speech API) para hablar al chatbot
- **Sintesis de voz** para escuchar las respuestas
- **Modo auto-lectura** toggle para leer respuestas automaticamente
- **Responsivo** para movil y escritorio

---

## 8. Estadisticas y Monitoreo

El endpoint `/api/stats` proporciona en tiempo real:

| Metrica | Descripcion |
|---------|-------------|
| Conocimientos aprendidos | Total de pares pregunta/respuesta guardados |
| Total de consultas | Todas las interacciones registradas |
| Consultas por fuente | local, memoria, patron, openai, fallback, menu |
| Consultas por categoria | salud, constitucion, ohada, historia, emergencia... |
| Usuarios registrados | Perfiles unicos con preferencias |
| Patrones confirmados | Preguntas frecuentes (freq >= 3) |
| Top patrones | Los 5 patrones mas consultados |
| Consultas 24h | Actividad del ultimo dia |
| Temas populares | Tendencias de la semana |

---

## 9. Adaptacion Cultural

El chatbot esta disenado con profundo respeto por la cultura ecuatoguineana:

- **Saludos por hora:** "Buenos dias hermano/hermana" segun la hora del dia
- **Respeto a la medicina tradicional:** No la critica, pero siempre recomienda complementar con atencion medica
- **Sensibilidad con VIH/SIDA:** Informacion sobre pruebas confidenciales y gratuitas
- **Motivacion prenatal:** Mensajes especificos para mujeres embarazadas
- **Consejos periodicos:** Cada 5 mensajes muestra consejos sobre mosquiteros o agua potable
- **Lenguaje sencillo:** Respuestas breves adaptadas a usuarios con datos limitados

---

## 10. Datos del Proyecto

| Aspecto | Valor |
|---------|-------|
| Lineas de codigo | ~3,500+ |
| Enfermedades documentadas | 13 |
| Centros de salud | 30+ en 8 regiones |
| Periodos historicos | 8 |
| Actas OHADA | 10 |
| Articulos constitucionales | 104+ |
| Grupos etnicos documentados | 6 |
| Vocabulario medico bilingue | 80+ terminos |
| Idiomas soportados | 2 (Espanol, Fang) |
| Tablas de base de datos | 4 |
| Niveles de respuesta IA | 6 |
| Canales de acceso | 3 (WhatsApp, Web, API REST) |

---

## 11. Como Ejecutar

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con las API keys

# 3. Ejecutar
python app.py

# 4. Abrir en navegador
# http://127.0.0.1:5000/test

# 5. Para WhatsApp: exponer con ngrok
ngrok http 5000
# Configurar webhook en Green API con la URL de ngrok
```

---

## 12. Impacto Social

- **1.7 millones** de habitantes potencialmente beneficiados
- **Acceso 24/7** a informacion de salud en su idioma nativo
- **Reduccion de desinformacion** medica en zonas rurales
- **Empoderamiento legal:** ciudadanos conocen sus derechos constitucionales
- **Fomento del emprendimiento:** guia practica para crear empresas (OHADA)
- **Preservacion cultural:** documentacion de historia y etnias en formato accesible
- **Escalable:** el sistema de aprendizaje mejora automaticamente con cada uso

---

*Desarrollado para Guinea Ecuatorial con tecnologia de inteligencia artificial*
*Asistente GQ - "Unidad, Paz, Justicia"*
