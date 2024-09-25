#
# 
#

from __future__ import annotations
from importlib import import_module
from inspect import isabstract, isclass
import json
from pathlib import Path

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.http.response import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .rps import Rps, IRpsPlayer


RPS_DIR = Path(__file__).resolve().parent
"""The directory of Rock, Paper, Scissors challenge."""

players: dict[str, type[IRpsPlayer]] = {}
"""The mappng between name and implementation of RPS players."""


@require_http_methods(['GET', 'POST'])
def play(request: HttpRequest) -> HttpResponse: # type: ignore
    """
    * If this endpoint is called with GET method, it returns the page of
    the game.
    * If this endpoint is called with POST method, the request must contain
    JSON data if the following format:
        * `data = {'action': 'start', 'left': the name of the left player, 
        'right': the name of the right player}`: to start game.
        * `data = {'action': 'stop',}`: to stop the game.
        * `data = {'action': 'move', 'move': '1', '2' or '3'}`: to specify
        user move.
    """
    # Declaring variables ---------------------------------
    global players
    from random import choice
    # -----------------------------------------------------
    if request.method == 'GET':
        _loadPlayers()
        context = {
            'players': ['User', *players.keys()],}
        from django.template import engines
        jinja2_engine = engines['jinja2']
        template = jinja2_engine.get_template('challenges/rps/page.j2')
        return HttpResponse(template.render(context))
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
                return initializeRps(request)
            case 'stop':
                pass
            case 'move':
                pass
            case _:
                return HttpResponseBadRequest()
        #
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
            request.session['winner'] = ''
        #
        response = {
            'user_score': request.session['user_score'],
            'com_score': request.session['com_score'],
            'winner': request.session['winner'],}
        return JsonResponse(response)


def _loadPlayers() -> None:
    # Declaring variables ---------------------------------
    global RPS_DIR
    global players
    # Loading players -------------------------------------
    # Listing players files directory...
    filesDir = RPS_DIR / 'rps'
    filesNames = list(filesDir.glob('*.py'))
    filesNames = [fileName.relative_to(filesDir) for fileName in filesNames]
    try:
        filesNames.remove(Path('__init__.py'))
    except ValueError:
        pass
    #
    players.clear()
    for fileName in filesNames:
        try:
            modObj = import_module(
                f'uploaded.challenges.rps.rps.{fileName.stem}')
        except Exception:
            continue
        for item in dir(modObj):
            item = getattr(modObj, item)
            if isclass(item) and not isabstract(item) and \
                    issubclass(item, IRpsPlayer):
                players[item.name] = item


def initializeRps(
        request: HttpRequest,
        lplayer: str,
        rplayer: str,
        ) -> HttpResponse:
    match (lplayer, rplayer):
        case ('User', 'User',):
            return HttpResponseBadRequest(
                'This app does not support game between two users.')
        case ('User', _,):
            pass
        case (_, 'User',):
            pass
        case (_, _,):
            return HttpResponseBadRequest(
                'This app does not support game between two computer '
                'algorithms for the time being.')
