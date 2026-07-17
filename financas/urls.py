# financas/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DespesaViewSet, ReceitaSemanalViewSet

router = DefaultRouter()
router.register(r'despesas', DespesaViewSet, basename='despesa')
router.register(r'receitas', ReceitaSemanalViewSet, basename='receita')

urlpatterns = [
    path('', include(router.urls)),
]