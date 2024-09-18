#
# 
#
"""The URL configuration for Challenges app in the project (website). This
`URLConf` assumes that redirected URLs start with `challenges/`.
"""

from django.urls import path

from .views import getChallengesIndexPage, playRps


app_name = 'challenges'

urlpatterns = [
    path('', getChallengesIndexPage, name='index-page'),
    path('rps', playRps, name='rps'),
]
