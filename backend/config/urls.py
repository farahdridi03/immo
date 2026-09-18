"""
URL configuration for backend project.

Versioned API routes are prefixed under `/api/v1/`.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False), name='index-redirect'),
    path('admin/', admin.site.urls),
    # Versioned API routes
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.immobilisations.urls')),
    path('api/v1/', include('apps.maintenance.urls')),

    # Unversioned API route fallbacks
    path('api/', include('apps.core.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.immobilisations.urls')),
    path('api/', include('apps.maintenance.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

