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
        if 'data-type' in request.GET:
            match request.GET['data-type']:
                case 'int':
                    return await _startStreamingRandInts(request)
                case _:
                    # Returning HTTP 400 Bad Request...
                    return JsonResponse(
                        {
                            'status': 'error',
                            'reason': (
                                'unsupported type of random data: ',
                                f"{request.GET['data-type']}"),
                        },
                        status=400,)
        else:
            return await asyncio.to_thread(
                render,
                request,
                'challenges/random_data/page.j2',
                context={},)
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
            msg = 'unknown POST request for random data endpoint'
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
        ) -> StreamingHttpResponse:
    # Declaring variables -----------------------------
    import json
    import random
    import time
    global RAND_INT_STOPPED
    MAX_INT = 100
    # Function ----------------------------------------
    async def generator() -> AsyncGenerator[bytes, None]:
        while not cache.get(RAND_INT_STOPPED):
            yield f'data: {random.randrange(0, MAX_INT)}\n\n'.encode()
            await asyncio.sleep(0.8)
        cache.delete(RAND_INT_STOPPED)
    #
    _logger.info('_startStream')
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
