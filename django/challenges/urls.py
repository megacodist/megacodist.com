#
# 
#
"""The URL configuration for Challenges app in the project (website). This
`URLConf` assumes that redirected URLs start with `challenges/`.
"""

from django.urls import path

from .views import getChallengesIndexPage
from assets.challenges.rps.backend import play as playRps
from assets.challenges.random_ints.backend import play as playRandom


app_name = 'challenges'

urlpatterns = [
    path('', getChallengesIndexPage, name='index-page'),
    path('rps', playRps, name='rps'),
    path('random-ints', playRandom, name='random-ints'),
]
