#
# 
#

from typing import Any

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
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
    from random import choice
    from uploaded.challenges.rps.rps import Rps
    if request.method == 'GET':
        return render(
            request,
            template_name='challenges/rps/page.j2',
            context={})
    if request.method == 'POST':
        userMove = request.POST.get('user_move')
        if userMove is None:
            return HttpResponseBadRequest(
                'The server did not received user move')
        userMove = Rps(int(userMove))
        comMove = choice(list(Rps))
        #
        if 'user_score' not in request.session:
            request.session['user_score'] = 0
        if 'com_score' not in request.session:
            request.session['com_score'] = 0
        #
        if userMove > comMove:
            request.session['winner'] = 'user'
            request.session['user_score'] += 1
        elif comMove > userMove:
            request.session['winner'] = 'com'
            request.session['com_score'] += 1
        else:
            request.session['winner'] = 'user'
        #
        response = {
            'user_score': request.session['user_score'],
            'com_score': request.session['com_score'],
            'winner': request.session['winner'],}
        return JsonResponse(response)
