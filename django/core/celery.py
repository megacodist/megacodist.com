#
# 
#

import os
from celery import Celery


# Setting the default Django settings module for the `celery`` program...
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Creating a Celery instance...
celeryApp = Celery('core')

# Loading task modules from all registered Django app configs...
celeryApp.config_from_object('django.conf:settings', namespace='CELERY')

# Forcing Celery to auto-discover tasks from installed apps...
celeryApp.autodiscover_tasks(['challenges'])
