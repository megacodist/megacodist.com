#
# 
#

import os
from celery import Celery


# Setting the default Django settings module for the `celery`` program...
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Creating a Celery instance...
# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
celeryApp = Celery('core')

# Loading task modules from all registered Django app configs...
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
celeryApp.config_from_object('django.conf:settings', namespace='CELERY')

# Forcing Celery to auto-discover tasks from installed apps...
celeryApp.autodiscover_tasks(['challenges'])
