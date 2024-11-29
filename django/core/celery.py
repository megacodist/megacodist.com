#
# 
#

import os
from pathlib import Path

from celery import Celery


DJANGO_DIR = Path(__file__).resolve().parent.parent


# Setting the default Django settings module for the `celery`` program...
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Creating a Celery instance...
# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
celeryApp = Celery('core')
#celeryApp.conf.update(
#    worker_state_db='django://default',
#    worker_state_db_detailed=True,)  # Optional: stores more detailed state info

# Loading task modules from all registered Django app configs...
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
celeryApp.config_from_object('django.conf:settings', namespace='CELERY')

# Forcing Celery to auto-discover tasks from installed apps...
celeryApp.autodiscover_tasks(['challenges'])
