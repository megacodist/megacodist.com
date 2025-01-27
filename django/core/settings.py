"""
Django settings for core project.

Generated by 'django-admin startproject' using Django 5.1.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from __future__ import annotations
import logging
import os
from pathlib import Path
import sys

from dotenv import load_dotenv
from jinja2 import Undefined, DebugUndefined
from utils.funcs import toBool


def _parseAllowedHosts(hosts: str) -> list[str]:
    """
    Parses ALLOWED_HOSTS from a string.
    * If the value is an empty string, returns an empty list `[]`.
    * If the value is a string representation of a list, safely evaluates
    it into a Python list.
    * If the value is a comma-separated string, splits it into a list.
    """
    import ast
    if not hosts:
        return []
    try:
        # Try to evaluate the string as a Python list
        return ast.literal_eval(hosts)
    except (ValueError, SyntaxError):
        # If evaluation fails, treat it as a comma-separated string
        return [host.strip() for host in hosts.split(',') if host.strip()]


# Getting project directory...
DJANGO_DIR = Path(__file__).resolve().parent.parent


# Configuring logging...
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'root_formatter': {
            'format': (
                'ROOT{levelname}: {asctime} {module} {process:d} {thread:d}\n'
                '{message}\n'),
            'style': '{',
        },
        'django_formatter': {
            'format': (
                'Django {levelname}: {asctime} {module} {process:d} {thread:d}\n'
                '{message}\n'),
            'style': '{',
        },
        'megacodist_formatter': {
            'format': (
                'Megacodist {levelname}: {asctime} {module} {process:d} '
                '{thread:d}\n{message}\n'),
            'style': '{',
        },
    },
    'handlers': {
        'root_file': {
            'class': 'logging.FileHandler',
            'filename': DJANGO_DIR / 'log.log',
            'encoding': 'utf-8',
            'formatter': 'root_formatter',
        },
        'django_file': {
            'class': 'logging.FileHandler',
            'filename': DJANGO_DIR / 'log.log',
            'encoding': 'utf-8',
            'formatter': 'django_formatter',
        },
        'megacodist_file': {
            'class': 'logging.FileHandler',
            'filename': DJANGO_DIR / 'log.log',
            'encoding': 'utf-8',
            'formatter': 'megacodist_formatter',
        },
    },
    'loggers': {
        # Defining the root logger...
        '': {
            'handlers': ['root_file',],
            'level': 'DEBUG',
            'propagate': True,
        },
        # Defining the Django logger...
        'django': {
            'handlers': ['django_file',],
            'level': 'INFO',
            'propagate': False,
        },
        # Defining Megacodist-specific logger...
        'megacodist': {
            'handlers': ['megacodist_file',],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


# Loading the `.env` file...
_loaded = load_dotenv(dotenv_path=DJANGO_DIR / '.env', override=True)
if not _loaded:
    sys.stderr.write('probably failed to load `.env` file in settings.py\n')


# SECURITY WARNING: don't run with debug turned on in production!
try:
    DEBUG = toBool(os.environ['DEBUG'])
except KeyError as err:
    raise KeyError('DEBUG setting is not set') from err
except ValueError as err:
    raise ValueError('DEBUG value is invalid') from err


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/
# SECURITY WARNING: keep the secret key used in production secret!
try:
    SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
except KeyError as err:
    raise KeyError('DJANGO_SECRET_KEY setting is not set') from err


#
ALLOWED_HOSTS = _parseAllowedHosts(os.environ['ALLOWED_HOSTS'])


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',     # Supporting for anonymous sessions
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'main',
    'challenges',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',    # Supporting for anonymous sessions
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
if DEBUG:
    MIDDLEWARE.append('whitenoise.middleware.WhiteNoiseMiddleware')

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    # Enabling Jinja2 templating engine...
    {
        'BACKEND': 'django.template.backends.jinja2.Jinja2',
        'DIRS': [
            DJANGO_DIR / 'assets' / 'templates',
            DJANGO_DIR / 'assets',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'environment': 'core.jinja2.environment',
            'autoescape': True,
            'auto_reload': DEBUG,
            'undefined': DebugUndefined if DEBUG else Undefined,
        },
    },
    # Enabling DTL (Django Template Language)...
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            DJANGO_DIR / 'assets' / 'templates',
            DJANGO_DIR / 'assets',
        ],
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


WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DJANGO_DIR / 'db.sqlite3',
    }
}


# Caches...
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Session backend...
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'


# Setting SSL/TLS...
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS  = [
        'https://megacodist.com/',
        'https://www.megacodist.com/',]
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https',)
    CSRF_COOKIE_DOMAIN = '.megacodist.com'


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/
STATIC_URL = 'assets/'
STATICFILES_DIRS = [
    DJANGO_DIR / 'assets',
]


# User-uploaded files...
MEDIA_URL = '/media/'
MEDIA_ROOT = DJANGO_DIR / 'media/'


# Enabling Django Debug Toolbar for development environment...
if DEBUG:
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    INSTALLED_APPS.append('debug_toolbar')
    INTERNAL_IPS = ['172.17.0.3',]


# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Celery settings...
CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['application/json',]
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_WORKER_STATE_DB = None
CELERY_TIMEZONE = TIME_ZONE
