#
# 
#

from datetime import datetime

from jinja2 import Environment
from django.templatetags.static import static
from django.urls import reverse


def environment(**options):
   env = Environment(**options)
   env.globals.update({
      'trim_blocks': True,
      'lstrip_blocks': True,
      'static': static,
      'url': reverse,
      'range': range,
      'now': datetime.now,
      'app_name': 'Megacodist Coding Blog',
   })
   #env.globals['trim_blocks'] = True
   #env.globals['lstrip_blocks'] = True

   return env