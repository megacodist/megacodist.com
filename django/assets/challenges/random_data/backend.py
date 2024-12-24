#
# 
#

import json
import logging
from typing import Any, Generator

from django.core.cache import cache
from django.http import (
    HttpRequest, HttpResponse, HttpResponseBadRequest,
    StreamingHttpResponse, )
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from celery import shared_task
import redis


RAND_INT_CONTROLLER = 'RAND_INT_STREAM'
"""The name of the cached varibales which controls the production of the
stream of random integers.
"""


@require_http_methods(['GET', 'POST',])
def play(request: HttpRequest) -> HttpResponse:
    """This view function does the following:
    1. Loads the page itself: Using a GET method with no query string.
    """
    if request.method == 'GET':
        if 'data-type' in request.GET:
            match request.GET['data-type']:
                case 'int':
                    return _startStreamingRandInts(request)
                case _:
                    return HttpResponseBadRequest(
                        "unsupported type of random data: "
                        f"{request.GET['data-type']}")
        else:
            return render(
                request,
                'challenges/random_data/page.j2',
                context={},)
    elif request.method == 'POST':
        data = json.loads(request.body)
        if 'action' in data and data['action'] == 'stop':
            _stopStreamingRandInts()
            return HttpResponse(
                'Streaming random integers stopped.',
                content_type='text/plain', )
        else:
            msg = f'unknown POST request for random data endpoint'
            logging.warning(msg)
    else:
        return HttpResponseBadRequest(
            f'unsupported HTTP method: {request.method}')


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
            yield f"data: {random.randrange(0, MAX_INT)}\n\n"
            time.sleep(0.8)
        cache.delete(RAND_INT_CONTROLLER)
        return random.randrange(0, MAX_INT)
    return StreamingHttpResponse(
        generator(),
        content_type='text/event-stream', )


def _stopStreamingRandInts() -> None:
    cache.set(RAND_INT_CONTROLLER, False,)


@shared_task
def generateRandomData() -> None:
    pass
