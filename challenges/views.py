#
# 
#

from typing import Any

from django.http import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods


def getChallengesIndexPage(request: HttpRequest) -> HttpResponse:
    context = dict[str, Any]()
    return render(
        request,
        template_name='challenges-index.j2',
        context=context)


@require_http_methods(['GET', 'POST'])
def playRps(request: HttpRequest) -> HttpResponse: # type: ignore
    if request.method == 'GET':
        return render(
            request,
            template_name='rps.j2',
            context={},)
    if request.method == 'POST':
        pass
