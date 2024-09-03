#
# 
#

from django.urls import path

from .views import getHomePage


urlpatterns = [
    path('', getHomePage, name='home_page'),
]
