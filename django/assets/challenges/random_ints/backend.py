#
# 
#

import asyncio
import json
import logging
from typing import AsyncGenerator

from django.core.cache import cache
from django.http import (
    HttpRequest, HttpResponse, StreamingHttpResponse, JsonResponse,)
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from celery import shared_task
import redis


_logger = logging.getLogger('megacodist')

RAND_INT_STOPPED = 'RAND_INT_STREAM'
"""The name of the cached varibales which controls the production of the
stream of random integers.
"""


@require_http_methods(['GET', 'POST',])
async def play(request: HttpRequest) -> HttpResponse:
    """This view function does the following:
    1. Loads the page itself: Using a GET method with no query string.
    """
    _logger.debug('random data stream request is received')
    if request.method == 'GET':
        match ('lower-int' in request.GET, 'upper-int' in request.GET,):
            case (True, True,):
                return await _startStreamingRandInts(
                    request,
                    int(request.GET['lower-int']),
                    int(request.GET['upper-int']))
            case (True, False,):
                return JsonResponse(
                    {
                        'status': 'error',
                        'reason': 'upper bound missing',
                    },
                    status=400,)
            case (False, True,):
                return JsonResponse(
                    {
                        'status': 'error',
                        'reason': 'lower bound missing',
                    },
                    status=400,)
            case (False, False,):
                # Returning the page...
                return await asyncio.to_thread(
                    render,
                    request,
                    'challenges/random_ints/page.j2',
                    context={},)
            case _:
                _logger.error('E-1')
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as err:
            # Returning HTTP 400 Bad Request...
            return JsonResponse(
                {
                    'status': 'error',
                    'reason': f'failed to read JSON object: {err}',
                },
                status=400,)
        if 'action' in data and data['action'] == 'stop':
            _stopStreamingRandInts()
            return JsonResponse(
                {'status': 'ok',},
                status=200,)
        else:
            # Returning HTTP 400 Bad Request...
            msg = 'unknown POST request for random integers endpoint'
            _logger.warning(msg)
            return JsonResponse(
                {
                    'status': 'error',
                    'reason': msg,
                },
                status=400,)
    else:
        # Returning HTTP 400 Bad Request...
        msg = f'unsupported HTTP method: {request.method}'
        _logger.warning(msg)
        return JsonResponse(
                {
                    'status': 'error',
                    'reason': msg,
                },
                status=400,)


async def _startStreamingRandInts(
        request: HttpRequest,
        lower: int,
        upper: int,
        wait: float = 0.75,
        ) -> StreamingHttpResponse:
    """Returns a `StreamingHttpResponse` (response to a request to
    establish an SSE connection) to produce random integers between `lower`
    and `upper` at an interval of `wait` seconds.
    """
    # Declaring variables -----------------------------
    import json
    import random
    import time
    global RAND_INT_STOPPED
    # Function ----------------------------------------
    async def generator() -> AsyncGenerator[bytes, None]:
        while not cache.get(RAND_INT_STOPPED):
            randInt = random.randrange(lower, upper)
            yield f'data: {randInt}\n\n'.encode()
            await asyncio.sleep(wait)
        cache.delete(RAND_INT_STOPPED)
        _logger.debug('exiting the rand int generator.')
    #
    _logger.info('rand int generator started')
    cache.set(RAND_INT_STOPPED, False,)
    sseResp = StreamingHttpResponse(
        generator(),
        content_type='text/event-stream',)
    sseResp['Cache-Control'] = 'no-cache' 
    return sseResp


def _stopStreamingRandInts() -> None:
    import inspect
    currFrame = inspect.currentframe()
    if currFrame:
        funcName = currFrame.f_code.co_name
        _logger.info(f'{funcName}() is called.')
    else:
        _logger.warning('failed to get the function name.')
    cache.set(RAND_INT_STOPPED, True,)


@shared_task
def generateRandomData() -> None:
    pass
