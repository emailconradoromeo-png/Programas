import base64
import logging
from decimal import Decimal

import numpy as np
from django.conf import settings
from django.db.models import Avg, Q

logger = logging.getLogger(__name__)


class ValuationService:
    """Servicio de valoración automática de propiedades usando ML."""

    @staticmethod
    def estimate_price(property_obj):
        """
        Estima el precio de una propiedad basándose en propiedades similares
        y un modelo de regresión simple.
        """
        from apps.listings.models import Listing
        from apps.properties.models import Property

        # Buscar propiedades similares en la misma ciudad y categoría
        similar_filters = Q(
            property__city=property_obj.city,
            property__category=property_obj.category,
            status="activo",
        )

        # Filtros adicionales opcionales
        if property_obj.bedrooms:
            similar_filters &= Q(
                property__bedrooms__gte=max(0, property_obj.bedrooms - 1),
                property__bedrooms__lte=property_obj.bedrooms + 1,
            )

        similar_listings = Listing.objects.filter(similar_filters).exclude(
            property=property_obj
        ).select_related("property")[:20]

        if not similar_listings.exists():
            # Ampliar búsqueda solo por ciudad
            similar_listings = Listing.objects.filter(
                property__city=property_obj.city,
                status="activo",
            ).exclude(property=property_obj).select_related("property")[:20]

        if not similar_listings.exists():
            return {
                "estimated_price_xaf": Decimal("0"),
                "confidence_score": 0.0,
                "comparable_listings": [],
                "factors": {"message": "No se encontraron propiedades comparables."},
            }

        # Extraer datos para el modelo
        prices = []
        areas = []
        comparable = []

        for listing in similar_listings:
            prop = listing.property
            price_val = float(listing.price_xaf)
            area_val = float(prop.area_m2) if prop.area_m2 else None

            prices.append(price_val)
            comparable.append({
                "listing_id": str(listing.id),
                "property_title": prop.title,
                "price_xaf": price_val,
                "city": prop.city,
                "area_m2": float(prop.area_m2) if prop.area_m2 else None,
                "bedrooms": prop.bedrooms,
            })

            if area_val and area_val > 0:
                areas.append((area_val, price_val))

        # Modelo simple: media ponderada ajustada por área
        prices_arr = np.array(prices)
        mean_price = float(np.mean(prices_arr))
        median_price = float(np.median(prices_arr))

        estimated = median_price  # Base: mediana

        # Ajuste por área si tenemos datos
        if areas and property_obj.area_m2 and float(property_obj.area_m2) > 0:
            areas_arr = np.array([a[0] for a in areas])
            prices_by_area = np.array([a[1] for a in areas])
            price_per_m2 = float(np.median(prices_by_area / areas_arr))
            estimated = price_per_m2 * float(property_obj.area_m2)

        # Ajuste por habitaciones
        if property_obj.bedrooms:
            avg_bedrooms_result = similar_listings.aggregate(
                avg_bedrooms=Avg("property__bedrooms")
            )
            avg_bedrooms = avg_bedrooms_result["avg_bedrooms"]
            if avg_bedrooms and avg_bedrooms > 0:
                bedroom_factor = 1 + (property_obj.bedrooms - avg_bedrooms) * 0.05
                estimated *= bedroom_factor

        # Calcular confianza basada en cantidad de comparables y dispersión
        n_comparable = len(prices)
        std_price = float(np.std(prices_arr)) if n_comparable > 1 else mean_price
        cv = std_price / mean_price if mean_price > 0 else 1  # Coef. variación

        confidence = min(1.0, max(0.1, (n_comparable / 20) * (1 - min(cv, 1.0))))

        factors = {
            "n_comparable": n_comparable,
            "mean_price": round(mean_price, 2),
            "median_price": round(median_price, 2),
            "coefficient_of_variation": round(cv, 4),
            "city": property_obj.city,
            "category": property_obj.category.name if property_obj.category else None,
            "bedrooms": property_obj.bedrooms,
            "area_m2": float(property_obj.area_m2) if property_obj.area_m2 else None,
        }

        return {
            "estimated_price_xaf": Decimal(str(round(max(estimated, 0), 2))),
            "confidence_score": round(confidence, 4),
            "comparable_listings": comparable[:10],
            "factors": factors,
        }


class RecommendationService:
    """Servicio de recomendaciones personalizadas."""

    @staticmethod
    def generate_for_user(user):
        """
        Genera recomendaciones para un usuario basándose en su historial
        de favoritos y búsquedas.
        """
        from apps.listings.models import Favorite, Listing

        from .models import Recommendation, SearchHistory

        # Obtener preferencias del usuario
        favorites = Favorite.objects.filter(user=user).select_related(
            "listing__property"
        )[:50]
        searches = SearchHistory.objects.filter(user=user)[:20]

        # Extraer preferencias de favoritos
        preferred_cities = set()
        preferred_categories = set()
        price_range = {"min": None, "max": None}
        preferred_bedrooms = []

        for fav in favorites:
            prop = fav.listing.property
            preferred_cities.add(prop.city)
            if prop.category_id:
                preferred_categories.add(prop.category_id)
            if prop.bedrooms:
                preferred_bedrooms.append(prop.bedrooms)

            price = float(fav.listing.price_xaf)
            if price_range["min"] is None or price < price_range["min"]:
                price_range["min"] = price
            if price_range["max"] is None or price > price_range["max"]:
                price_range["max"] = price

        # Extraer preferencias de búsquedas
        for search in searches:
            if search.filters.get("city"):
                preferred_cities.add(search.filters["city"])
            if search.filters.get("category"):
                preferred_categories.add(search.filters["category"])

        # Buscar anuncios relevantes
        base_qs = Listing.objects.filter(status="activo").select_related("property")

        # Excluir ya recomendados y ya favoritados
        favorited_ids = set(favorites.values_list("listing_id", flat=True))
        existing_rec_ids = set(
            Recommendation.objects.filter(user=user).values_list(
                "listing_id", flat=True
            )
        )
        exclude_ids = favorited_ids | existing_rec_ids
        base_qs = base_qs.exclude(id__in=exclude_ids)

        # Excluir propias
        base_qs = base_qs.exclude(posted_by=user)

        recommendations = []

        # Score por ciudad y categoría
        for listing in base_qs[:100]:
            prop = listing.property
            score = 0.0
            reasons = []

            if prop.city in preferred_cities:
                score += 0.3
                reasons.append(f"Ciudad preferida: {prop.city}")

            if prop.category_id in preferred_categories:
                score += 0.25
                reasons.append("Categoría de interés")

            if preferred_bedrooms and prop.bedrooms:
                avg_beds = sum(preferred_bedrooms) / len(preferred_bedrooms)
                if abs(prop.bedrooms - avg_beds) <= 1:
                    score += 0.2
                    reasons.append(f"Habitaciones similares: {prop.bedrooms}")

            if price_range["min"] is not None and price_range["max"] is not None:
                price = float(listing.price_xaf)
                margin = (price_range["max"] - price_range["min"]) * 0.2
                if (
                    price_range["min"] - margin
                    <= price
                    <= price_range["max"] + margin
                ):
                    score += 0.15
                    reasons.append("Rango de precio similar")

            if listing.is_featured:
                score += 0.1
                reasons.append("Anuncio destacado")

            if score > 0.1:
                recommendations.append({
                    "listing": listing,
                    "score": min(score, 1.0),
                    "reason": ". ".join(reasons),
                })

        # Ordenar y tomar los mejores
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        recommendations = recommendations[:20]

        # Guardar recomendaciones
        created = []
        for rec in recommendations:
            obj, was_created = Recommendation.objects.update_or_create(
                user=user,
                listing=rec["listing"],
                defaults={
                    "score": rec["score"],
                    "reason": rec["reason"],
                },
            )
            if was_created:
                created.append(obj)

        return created


class ChatbotService:
    """Servicio de chatbot asistente con OpenAI + fallback inteligente."""

    SYSTEM_PROMPT = (
        "Eres el asistente virtual de EGINMOTEG, la plataforma inmobiliaria "
        "inteligente de Guinea Ecuatorial. Ayudas a los usuarios a encontrar "
        "propiedades, entender el mercado inmobiliario local, resolver dudas "
        "sobre compra/alquiler, y dar información sobre las ciudades de Guinea "
        "Ecuatorial (Malabo, Bata, Oyala, Ebebiyín, Mongomo). "
        "Responde siempre de forma amable y profesional. "
        "Si no sabes algo, sé honesto y sugiere contactar con un agente. "
        "Puedes responder en español o francés según el idioma del usuario."
    )

    # Base de conocimiento para el modo fallback
    KNOWLEDGE_BASE = {
        "ciudades": {
            "malabo": (
                "Malabo es la capital de Guinea Ecuatorial, ubicada en la isla de Bioko. "
                "Es el centro económico y cultural del país con propiedades modernas y "
                "vistas al mar. Las zonas más cotizadas son el centro urbano, Ela Nguema, "
                "y las áreas cercanas al aeropuerto. Los precios varían entre 15-80 millones XAF "
                "para apartamentos y 50-300 millones XAF para casas."
            ),
            "bata": (
                "Bata es la ciudad más grande del continente en Guinea Ecuatorial, con un "
                "mercado inmobiliario dinámico y en crecimiento. Las zonas residenciales "
                "más populares incluyen el centro, Comandachina y las áreas costeras. "
                "Los precios son generalmente más accesibles que en Malabo, con apartamentos "
                "desde 10 millones XAF y casas desde 30 millones XAF."
            ),
            "oyala": (
                "Oyala (Ciudad de la Paz) es la nueva capital planificada, ubicada en el "
                "interior del continente. Ofrece infraestructura moderna y excelentes "
                "oportunidades de inversión a largo plazo. Los precios de las propiedades "
                "son competitivos y hay muchas opciones de obra nueva."
            ),
            "ebebiyin": (
                "Ebebiyín está ubicada cerca de la frontera con Camerún y Gabón. "
                "Es un importante centro comercial con propiedades accesibles. "
                "Ideal para inversores que buscan oportunidades en zonas fronterizas "
                "con actividad comercial internacional."
            ),
            "mongomo": (
                "Mongomo es conocida por sus modernas infraestructuras deportivas "
                "y gubernamentales. Ofrece propiedades residenciales de calidad "
                "a precios razonables, con buenas conexiones por carretera."
            ),
        },
        "operaciones": {
            "compra": (
                "Para comprar una propiedad en Guinea Ecuatorial te recomendamos:\n"
                "1. Define tu presupuesto y la ciudad de interés\n"
                "2. Usa nuestros filtros de búsqueda para encontrar propiedades\n"
                "3. Contacta al propietario o agente directamente desde la plataforma\n"
                "4. Visita la propiedad y negocia el precio\n"
                "5. Asegúrate de verificar la documentación legal antes de firmar\n\n"
                "En EGINMOTEG puedes filtrar por ciudad, precio, habitaciones y tipo."
            ),
            "alquiler": (
                "Para alquilar una propiedad:\n"
                "1. Busca propiedades con el filtro 'Alquiler' activado\n"
                "2. Los precios de alquiler en Malabo van desde 200.000-2.000.000 XAF/mes\n"
                "3. En Bata los alquileres son más económicos: 100.000-1.000.000 XAF/mes\n"
                "4. Normalmente se pide un depósito de 1-3 meses\n"
                "5. Contacta al propietario para coordinar una visita"
            ),
            "inversion": (
                "Guinea Ecuatorial ofrece oportunidades de inversión inmobiliaria:\n"
                "- Oyala: ciudad nueva con alto potencial de revalorización\n"
                "- Malabo: demanda constante por ser la capital\n"
                "- Bata: mercado en crecimiento con precios accesibles\n"
                "- Alquiler vacacional: creciente sector turístico\n\n"
                "Usa nuestra herramienta de valoración IA para estimar precios."
            ),
        },
        "plataforma": {
            "buscar": (
                "Para buscar propiedades en EGINMOTEG:\n"
                "- Usa la barra de búsqueda en la página principal\n"
                "- Aplica filtros por ciudad, precio, habitaciones y tipo de operación\n"
                "- Usa la vista de mapa para explorar por ubicación\n"
                "- Guarda tus favoritos para recibir recomendaciones personalizadas"
            ),
            "cuenta": (
                "Con tu cuenta en EGINMOTEG puedes:\n"
                "- Publicar propiedades en venta o alquiler\n"
                "- Guardar propiedades favoritas\n"
                "- Enviar mensajes a propietarios y agentes\n"
                "- Recibir recomendaciones personalizadas con IA\n"
                "- Obtener valoraciones automáticas de propiedades"
            ),
            "valoracion": (
                "Nuestra herramienta de valoración con IA analiza propiedades "
                "similares en la misma zona para estimar un precio justo. "
                "Ve a la página de detalle de cualquier propiedad y haz clic "
                "en 'Solicitar valoración' en la barra lateral."
            ),
        },
    }

    GREETINGS = ["hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos", "bonjour", "salut", "bonsoir"]
    FAREWELLS = ["adios", "bye", "hasta luego", "chao", "nos vemos", "au revoir", "a bientot"]

    @staticmethod
    def _fallback_response(user_message):
        """Genera una respuesta inteligente sin OpenAI usando la base de conocimiento."""
        msg = user_message.lower().strip()

        # Saludos
        if any(g in msg for g in ChatbotService.GREETINGS):
            return (
                "¡Hola! Soy el asistente virtual de EGINMOTEG. "
                "Puedo ayudarte con información sobre:\n\n"
                "- **Ciudades**: Malabo, Bata, Oyala, Ebebiyín, Mongomo\n"
                "- **Compra y alquiler** de propiedades\n"
                "- **Inversión** inmobiliaria en Guinea Ecuatorial\n"
                "- **Cómo usar** la plataforma EGINMOTEG\n\n"
                "¿En qué puedo ayudarte?"
            )

        # Despedidas
        if any(f in msg for f in ChatbotService.FAREWELLS):
            return (
                "¡Hasta luego! Fue un placer ayudarte. "
                "Si necesitas más información sobre propiedades en Guinea Ecuatorial, "
                "no dudes en volver. ¡Buena suerte con tu búsqueda!"
            )

        # Ciudades
        kb = ChatbotService.KNOWLEDGE_BASE
        for city, info in kb["ciudades"].items():
            if city in msg:
                return info

        # Operaciones
        buy_words = ["comprar", "compra", "adquirir", "acheter", "achat"]
        rent_words = ["alquilar", "alquiler", "rentar", "renta", "arrendar", "louer", "location"]
        invest_words = ["invertir", "inversion", "inversión", "investir", "investissement", "negocio"]

        if any(w in msg for w in buy_words):
            return kb["operaciones"]["compra"]
        if any(w in msg for w in rent_words):
            return kb["operaciones"]["alquiler"]
        if any(w in msg for w in invest_words):
            return kb["operaciones"]["inversion"]

        # Plataforma
        search_words = ["buscar", "encontrar", "filtro", "filtros", "chercher", "rechercher"]
        account_words = ["cuenta", "perfil", "registr", "publicar", "compte", "profil"]
        valuation_words = ["valoracion", "valoración", "precio", "estimar", "cuanto vale", "évaluation", "prix"]

        if any(w in msg for w in search_words):
            return kb["plataforma"]["buscar"]
        if any(w in msg for w in account_words):
            return kb["plataforma"]["cuenta"]
        if any(w in msg for w in valuation_words):
            return kb["plataforma"]["valoracion"]

        # Precios
        if "precio" in msg or "cuanto" in msg or "cuesta" in msg or "prix" in msg or "combien" in msg:
            return (
                "Los precios de propiedades en Guinea Ecuatorial varían según la ciudad:\n\n"
                "**Malabo** (capital):\n"
                "- Apartamentos: 15-80 millones XAF\n"
                "- Casas: 50-300 millones XAF\n"
                "- Alquiler: 200.000-2.000.000 XAF/mes\n\n"
                "**Bata**:\n"
                "- Apartamentos: 10-50 millones XAF\n"
                "- Casas: 30-150 millones XAF\n"
                "- Alquiler: 100.000-1.000.000 XAF/mes\n\n"
                "**Oyala**: Precios competitivos con mucha obra nueva.\n\n"
                "Para un precio más preciso, usa nuestra herramienta de valoración IA "
                "en la página de detalle de cualquier propiedad."
            )

        # Respuesta genérica
        return (
            "Gracias por tu mensaje. Como asistente de EGINMOTEG, "
            "puedo ayudarte con:\n\n"
            "- Información sobre **ciudades** de Guinea Ecuatorial "
            "(Malabo, Bata, Oyala, Ebebiyín, Mongomo)\n"
            "- Consejos para **comprar o alquilar** propiedades\n"
            "- **Precios** y tendencias del mercado inmobiliario\n"
            "- Cómo **usar la plataforma** (buscar, publicar, valorar)\n"
            "- Oportunidades de **inversión** inmobiliaria\n\n"
            "Prueba a preguntarme algo como: \"¿Qué zonas recomiendas en Malabo?\" "
            "o \"¿Cuánto cuesta alquilar en Bata?\""
        )

    @staticmethod
    def get_response(session, user_message):
        """
        Envía un mensaje al chatbot. Usa OpenAI si está disponible,
        si no, usa el modo fallback con base de conocimiento local.
        """
        from .models import ChatMessage

        # Guardar mensaje del usuario
        ChatMessage.objects.create(
            session=session,
            role="user",
            content=user_message,
        )

        # Intentar con OpenAI primero
        api_key = getattr(settings, "OPENAI_API_KEY", "")
        assistant_content = None

        if api_key:
            try:
                from openai import OpenAI

                client = OpenAI(api_key=api_key)

                # Construir historial de mensajes
                messages = [{"role": "system", "content": ChatbotService.SYSTEM_PROMPT}]

                if session.context:
                    context_msg = f"Contexto del usuario: {session.context}"
                    messages.append({"role": "system", "content": context_msg})

                previous = ChatMessage.objects.filter(session=session).order_by(
                    "created_at"
                )[:20]
                for msg in previous:
                    if msg.role in ("user", "assistant"):
                        messages.append({"role": msg.role, "content": msg.content})

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.7,
                )
                assistant_content = response.choices[0].message.content
                logger.info("Respuesta generada con OpenAI para sesión %s", session.id)

            except Exception as e:
                logger.warning("OpenAI no disponible, usando fallback: %s", e)
                assistant_content = None

        # Fallback si OpenAI falla o no está configurado
        if assistant_content is None:
            assistant_content = ChatbotService._fallback_response(user_message)
            logger.info("Respuesta generada con fallback para sesión %s", session.id)

        # Guardar respuesta del asistente
        ChatMessage.objects.create(
            session=session,
            role="assistant",
            content=assistant_content,
        )

        # Actualizar título de la sesión si es el primer mensaje
        if not session.title and user_message:
            session.title = user_message[:100]
            session.save(update_fields=["title"])

        return assistant_content


class ImageAnalysisService:
    """Servicio de análisis de imágenes de propiedades con OpenAI Vision."""

    @staticmethod
    def analyze_image(image_analysis):
        """
        Analiza una imagen de propiedad usando OpenAI Vision API.
        """
        from .models import ImageAnalysis

        image_analysis.status = "procesando"
        image_analysis.save(update_fields=["status"])

        try:
            from openai import OpenAI

            client = OpenAI(api_key=getattr(settings, "OPENAI_API_KEY", ""))
        except Exception as e:
            logger.error("Error inicializando OpenAI: %s", e)
            image_analysis.status = "error"
            image_analysis.error_message = str(e)
            image_analysis.save(update_fields=["status", "error_message"])
            return

        try:
            # Leer la imagen y convertirla a base64
            image_file = image_analysis.property_image.image
            image_file.open("rb")
            image_data = base64.b64encode(image_file.read()).decode("utf-8")
            image_file.close()

            # Determinar tipo MIME
            file_name = image_file.name.lower()
            if file_name.endswith(".png"):
                mime_type = "image/png"
            elif file_name.endswith(".webp"):
                mime_type = "image/webp"
            else:
                mime_type = "image/jpeg"

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Eres un experto en análisis inmobiliario. Analiza la imagen "
                            "de una propiedad y proporciona información estructurada. "
                            "Responde SIEMPRE en formato JSON válido con estos campos: "
                            "room_type (string: salon, dormitorio, cocina, baño, exterior, "
                            "terraza, jardin, garaje, oficina, otro), "
                            "quality_score (number 1-10), "
                            "description (string en español, 2-3 oraciones), "
                            "features (array de strings con características detectadas)."
                        ),
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Analiza esta imagen de una propiedad inmobiliaria. "
                                    "Identifica el tipo de habitación, evalúa la calidad "
                                    "del espacio, describe lo que ves y lista las "
                                    "características principales."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}",
                                },
                            },
                        ],
                    },
                ],
                max_tokens=500,
                temperature=0.3,
            )

            result_text = response.choices[0].message.content

            # Parsear JSON de la respuesta
            import json

            # Limpiar posibles ```json wrappers
            clean = result_text.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()

            result = json.loads(clean)

            image_analysis.room_type = result.get("room_type", "otro")
            image_analysis.quality_score = float(result.get("quality_score", 5))
            image_analysis.description = result.get("description", "")
            image_analysis.features = result.get("features", [])
            image_analysis.status = "completado"
            image_analysis.save(
                update_fields=[
                    "room_type",
                    "quality_score",
                    "description",
                    "features",
                    "status",
                ]
            )

        except Exception as e:
            logger.error("Error en análisis de imagen: %s", e)
            image_analysis.status = "error"
            image_analysis.error_message = str(e)
            image_analysis.save(update_fields=["status", "error_message"])
