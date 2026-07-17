import os
import django

# Prepara o ambiente do Django para podermos mexer no banco
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# 1. Criar usuário do Rodrigo (Proprietário / Admin principal)
if not User.objects.filter(username="rodrigo").exists():
    User.objects.create_superuser("rodrigo", "rodrigo@almaza.com", "almaza2026")
    print("✅ Superusuário 'rodrigo' criado com sucesso na nuvem!")
else:
    print("ℹ️ Usuário 'rodrigo' já existe. Nenhuma ação necessária.")

# 2. Criar usuário da Esposa / Sócia (como administradora também)
if not User.objects.filter(username="socia").exists():
    User.objects.create_superuser("socia", "socia@almaza.com", "almaza2026")
    print("✅ Superusuário 'socia' criado com sucesso na nuvem!")
else:
    print("ℹ️ Usuário 'socia' já existe. Nenhuma ação necessária.")