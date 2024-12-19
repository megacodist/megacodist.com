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


RAND_INT_CONTROLLER = 'RAND_INT_STREAM'
"""The name of the cached varibales which controls the production of the
stream of random integers.
"""


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


def _startStreamingRandInts(request: HttpRequest) -> StreamingHttpResponse:
    # Declaring variables -----------------------------
    import random
    import time
    global RAND_INT_CONTROLLER
    MAX_INT = 100
    # Function ----------------------------------------
    def generator() -> Generator[Any, Any, int]:
        cache.set(RAND_INT_CONTROLLER, True,)
        while cache.get(RAND_INT_CONTROLLER):
            yield random.randrange(0, MAX_INT)
            time.sleep(0.8)
        cache.delete(RAND_INT_CONTROLLER)
        return random.randrange(0, MAX_INT)
    return StreamingHttpResponse(
        generator(),
        content_type='text/event-stream',)


def _stopStreamingRandInts() -> None:
    cache.set(RAND_INT_CONTROLLER, False,)


@shared_task
def generateRandomData() -> None:
    pass
