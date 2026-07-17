# core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Entrega a interface HTML diretamente na raiz do site
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Rotas de Autenticação e API
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/', include('financas.urls')),
]
