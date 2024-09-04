#
# 
#

from typing import Any
from django.http import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render


def getHomePage(request: HttpRequest) -> HttpResponse:
    # Returning the HTTP response...
    context = dict[str, Any]()
    return render(
        request,
        template_name='home.j2',
        context=context)
