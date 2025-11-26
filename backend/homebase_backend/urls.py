from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("verification.urls")),
    path("api/verification/", include("verification.enhanced_urls")),
    path("api/verification/", include("users.verification_urls")),  # Verification status endpoints
    path("api/verification/renewal/", include("verification.renewal_urls")),  # Renewal endpoints
    path("api/verification/admin/", include("verification.admin_urls")),  # Admin review endpoints
    path("api/auth/", include("djoser.urls")),
    path("api/auth/", include("djoser.urls.jwt")),
    path("api/social-auth/", include("social_django.urls", namespace="social")),
   # path("api/auth/", include("dj_rest_auth.urls")),


    path("api/", include("listings.urls")),
    path("api/", include("payments.urls")),
    path("api/messages/", include("messaging.urls")),
    path("api/", include("profiles.urls")),
    path("api/", include("support.urls")),
    path("api/", include("community.urls")),
    path("api/admin/", include("admin_api.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
