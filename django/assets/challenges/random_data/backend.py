#
# 
#

import json
from typing import Any, Generator

from django.core.cache import cache
from django.http import (
    HttpRequest, HttpResponse, HttpResponseBadRequest,
    StreamingHttpResponse,)
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from celery import shared_task
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
                return _startStreamingRandInts(request)
            case 'stop':
                _stopStreamingRandInts()
                return HttpResponse(
                    'Streaming random integers stopped.',
                    content_type='text/plain',) 
            case _:
                return HttpResponseBadRequest(
                    f'invalid action: {data['action']}')


def _startStreamingRandInts(request: HttpRequest) -> HttpResponse:
    def generator() -> Generator[Any, Any, int]:
        import random
        import time
        MAX_INT = 100
        cache.set('RAND_INT_STREAM', True,)
        while cache.get('RAND_INT_STREAM'):
            yield random.randrange(0, MAX_INT)
            time.sleep(0.8)
        return random.randrange(0, MAX_INT)
    return StreamingHttpResponse(generator())


def _stopStreamingRandInts() -> None:
    cache.set('RAND_INT_STREAM', False,)


@shared_task
def generateRandomData() -> None:
    pass
