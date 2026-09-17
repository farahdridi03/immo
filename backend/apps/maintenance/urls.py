from rest_framework.routers import DefaultRouter
from .views import (
    ContratMaintenanceViewSet,
    ImmobilisationContratViewSet,
    DocumentContratViewSet,
    InterventionViewSet,
    AlerteViewSet,
)

router = DefaultRouter()
router.register(r"contrats", ContratMaintenanceViewSet, basename="contrat-maintenance")
router.register(r"immobilisations-contrats", ImmobilisationContratViewSet, basename="immobilisation-contrat")
router.register(r"documents-contrats", DocumentContratViewSet, basename="document-contrat")
router.register(r"interventions", InterventionViewSet, basename="intervention-maintenance")
router.register(r"alertes", AlerteViewSet, basename="alerte-maintenance")

urlpatterns = router.urls
