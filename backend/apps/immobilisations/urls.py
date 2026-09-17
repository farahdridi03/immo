from rest_framework.routers import DefaultRouter
from .views import (
    EmplacementViewSet,
    FamilleViewSet,
    ImmobilisationViewSet,
    MouvementEmplacementViewSet,
    PlanAmortissementViewSet,
    EcritureAmortissementViewSet,
)

router = DefaultRouter()
router.register(r"familles", FamilleViewSet, basename="famille")
router.register(r"emplacements", EmplacementViewSet, basename="emplacement")
router.register(r"immobilisations", ImmobilisationViewSet, basename="immobilisation")
router.register(
    r"mouvements-emplacement",
    MouvementEmplacementViewSet,
    basename="mouvement-emplacement",
)
router.register(
    r"plans-amortissement",
    PlanAmortissementViewSet,
    basename="plan-amortissement",
)
router.register(
    r"ecritures-amortissement",
    EcritureAmortissementViewSet,
    basename="ecriture-amortissement",
)

urlpatterns = router.urls
