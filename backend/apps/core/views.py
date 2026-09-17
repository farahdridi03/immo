from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection


class HealthCheckView(APIView):
    """
    Health check endpoint returning system health and backend status.
    URL: GET /api/v1/health/
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_status = "connected"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_status = "disconnected"

        return Response(
            {
                "status": "healthy",
                "service": "Django REST Backend",
                "database": {
                    "engine": "postgresql",
                    "status": db_status
                },
                "version": "1.0.0"
            },
            status=status.HTTP_200_OK if db_status == "connected" else status.HTTP_503_SERVICE_UNAVAILABLE
        )


class APIRootView(APIView):
    """
    Root endpoint for the backend API.
    URL: GET /
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "message": "Backend API is running",
                "status": "online",
                "endpoints": {
                    "health_check": "/api/v1/health/",
                    "admin": "/admin/"
                }
            },
            status=status.HTTP_200_OK
        )

