#
# 
#

from typing import Any

from django.http import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render
from django.template import engines
from django.views.decorators.http import require_http_methods


def getChallengesIndexPage(request: HttpRequest) -> HttpResponse:
    context = dict[str, Any]()
    return render(
        request,
        template_name='challenges-index.j2',
        context=context)


@require_http_methods(['GET', 'POST'])
def playRps(request: HttpRequest) -> HttpResponse: # type: ignore
    from django.http import HttpResponse as HttpResponse_
    if request.method == 'GET':
        jinja2Engine = engines['jinja2']
        template = jinja2Engine.get_template('challenges/rps/page.j2')
        return HttpResponse_(template.render(
            context={},
            request=request,))
    if request.method == 'POST':
        pass
