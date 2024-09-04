#
# 
#

from django.urls import path

from .views import getAboutMePage, getHomePage, getLicensePage


urlpatterns = [
    path('', getHomePage, name='home-page'),
    path('license', getLicensePage, name='license'),
    path('about-me', getAboutMePage, name='about-me'),
]
