from django.urls import path
from .views import HealthCheckView
from .audit_views import AuditTrailView

app_name = 'core'

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('audit-trail/', AuditTrailView.as_view(), name='audit-trail'),
]
