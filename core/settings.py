import os
from pathlib import Path
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# 1. SEGURANÇA E AMBIENTE (Lidos das variáveis do sistema)
SECRET_KEY = config('SECRET_KEY', default='django-insecure-chave-apenas-para-dev-local-nunca-usar-na-nuvem')
DEBUG = config('DEBUG', default=False, cast=bool) # Por segurança, o default agora é False!
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost,.onrender.com', cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', # WhiteNoise antes do staticfiles
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'financas',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Servidor de estáticos de alta performance
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # CORS deve vir antes de CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# 2. BANCO DE DADOS (SQLite no local, Postgres no Render)
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///' + str(BASE_DIR / 'db.sqlite3')),
        conn_max_age=600 # Otimização de performance para manter conexão aberta no Postgres
    )
}

# 3. AUTENTICAÇÃO E JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# 4. INTERFACE HTML (TEMPLATES)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Aponta para a pasta templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 5. ARQUIVOS ESTÁTICOS (WhiteNoise)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 6. SEGURANÇA E CORS BLINDADOS
# apenas requisições vindas dos domínios autorizados.
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True # Libera tudo apenas se estiver testando no local com DEBUG = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    # Lista de domínios seguros na sua variável CORS_ALLOWED_ORIGINS
    CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='https://almaza-financas.onrender.com', cast=Csv())