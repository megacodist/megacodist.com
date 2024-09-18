#
# 
#

from typing import Any

from django.http import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import allow_method


def getChallengesIndexPage(request: HttpRequest) -> HttpResponse:
    context = dict[str, Any]()
    return render(
        request,
        template_name='challenges-index.j2',
        context=context)


@allow_method(['GET', 'POST'])
def playRps(request: HttpRequest) -> HttpResponse:
    if request.method == 'GET':
        return render(
            request,
            template_name='rps.j2',
            context=dict[str, Any]())
    if request.
