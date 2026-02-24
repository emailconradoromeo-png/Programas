from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import Property, PropertyImage

from .models import ChatSession, ImageAnalysis, PropertyValuation, Recommendation
from .serializers import (
    ChatRequestSerializer,
    ChatSessionListSerializer,
    ChatSessionSerializer,
    ImageAnalysisRequestSerializer,
    ImageAnalysisSerializer,
    PropertyValuationSerializer,
    RecommendationSerializer,
    ValuationRequestSerializer,
)
from .tasks import analyze_property_image, generate_valuation


class RequestValuationView(APIView):
    """POST /api/v1/ai/valuations/ - Solicitar valoración de una propiedad."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ValuationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        property_id = serializer.validated_data["property_id"]

        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response(
                {"error": "Propiedad no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Lanzar tarea asíncrona
        generate_valuation.delay(str(property_id))

        # Verificar si ya hay una valoración existente
        existing = PropertyValuation.objects.filter(property=property_obj).first()
        if existing:
            return Response(
                {
                    "message": "Valoración existente encontrada. Se está generando una nueva.",
                    "valuation": PropertyValuationSerializer(existing).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Valoración solicitada. Se procesará en breve."},
            status=status.HTTP_202_ACCEPTED,
        )


class GetValuationView(APIView):
    """GET /api/v1/ai/valuations/<property_id>/ - Obtener valoración."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, property_id):
        valuation = PropertyValuation.objects.filter(
            property_id=property_id
        ).first()

        if not valuation:
            return Response(
                {"error": "No se encontró valoración para esta propiedad."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PropertyValuationSerializer(valuation)
        return Response(serializer.data)


class RecommendationsView(generics.ListAPIView):
    """GET /api/v1/ai/recommendations/ - Recomendaciones personalizadas."""

    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recommendation.objects.filter(
            user=self.request.user
        ).select_related("listing__property")


class ChatView(APIView):
    """POST /api/v1/ai/chat/ - Enviar mensaje al chatbot."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        session_id = serializer.validated_data.get("session_id")

        # Obtener o crear sesión
        if session_id:
            try:
                session = ChatSession.objects.get(
                    id=session_id, user=request.user
                )
            except ChatSession.DoesNotExist:
                return Response(
                    {"error": "Sesión no encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            session = ChatSession.objects.create(user=request.user)

        # Obtener respuesta del chatbot
        from .services import ChatbotService

        response_text = ChatbotService.get_response(session, message)

        session_serializer = ChatSessionSerializer(session)

        return Response(
            {
                "session_id": str(session.id),
                "response": response_text,
                "session": session_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ChatSessionsListView(generics.ListAPIView):
    """GET /api/v1/ai/chat/sessions/ - Listar sesiones de chat."""

    serializer_class = ChatSessionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class ChatSessionDetailView(APIView):
    """GET /api/v1/ai/chat/sessions/<session_id>/ - Detalle de sesión."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(
                id=session_id, user=request.user
            )
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Sesión no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)


class RequestImageAnalysisView(APIView):
    """POST /api/v1/ai/image-analysis/ - Solicitar análisis de imagen."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ImageAnalysisRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_id = serializer.validated_data["property_image_id"]

        try:
            property_image = PropertyImage.objects.get(id=image_id)
        except PropertyImage.DoesNotExist:
            return Response(
                {"error": "Imagen de propiedad no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Crear registro de análisis
        analysis = ImageAnalysis.objects.create(property_image=property_image)

        # Lanzar tarea asíncrona
        analyze_property_image.delay(str(analysis.id))

        return Response(
            ImageAnalysisSerializer(analysis, context={"request": request}).data,
            status=status.HTTP_202_ACCEPTED,
        )


class GetImageAnalysisView(APIView):
    """GET /api/v1/ai/image-analysis/<id>/ - Obtener resultado de análisis."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, analysis_id):
        try:
            analysis = ImageAnalysis.objects.get(id=analysis_id)
        except ImageAnalysis.DoesNotExist:
            return Response(
                {"error": "Análisis no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ImageAnalysisSerializer(
            analysis, context={"request": request}
        )
        return Response(serializer.data)
