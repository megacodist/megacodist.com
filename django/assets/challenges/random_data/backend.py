#
# 
#

import json

from celery import shared_task
from django.http import (HttpRequest, HttpResponse, HttpResponseBadRequest,)
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
import redis


@require_http_methods(['GET', 'POST'])
def play(request: HttpRequest) -> HttpResponse:
    if request.method == 'GET':
        context = {}
        return render(
            request,
            'challenges/random_data/page.j2',
            context=context)
    if request.method == 'POST':
        # Retrieving data...
        try:
            data = json.loads(request.body)
        except Exception:
            return HttpResponseBadRequest(
                'could not retrieve data')
        # Determining the requested action...
        if 'action' not in data:
            return HttpResponseBadRequest('no action is specified')
        match data['action']:
            case 'start':
                pass
            case 'stop':
                pass
            case _:
                return HttpResponseBadRequest(
                    f'invalid action: {data['action']}')


@shared_task
def generateRandomData() -> None:
    pass
