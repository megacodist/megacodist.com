#
# 
#

from typing import Any

from django.http import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render


def getChallengesIndexPage(request: HttpRequest) -> HttpResponse:
    context = dict[str, Any]()
    return render(
        request,
        template_name='challenges-index.j2',
        context=context)


def getRpsPage(request: HttpRequest) -> HttpResponse:
    context = dict[str, Any]()
    return render(
        request,
        template_name='rps.j2',
        context=context)
