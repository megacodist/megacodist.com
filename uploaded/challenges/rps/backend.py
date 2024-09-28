#
# 
#

from __future__ import annotations
from importlib import import_module
from inspect import isabstract, isclass
import json
from pathlib import Path
import pickle

from django.contrib.sessions.backends.base import SessionBase
from django.core.cache import cache
from django.http import (
    HttpRequest, HttpResponse, HttpResponseBadRequest, JsonResponse)
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .rps import Rps, IRpsPlayer


_USER = 'User'

RPS_DIR = Path(__file__).resolve().parent
"""The directory of Rock, Paper, Scissors challenge."""

players: dict[str, type[IRpsPlayer]] = {}
"""The mappng between name and implementation of RPS players."""


class RpsPlayerInfo:
    def __init__(
            self,
            name: str,
            history: list[Rps],
            player: IRpsPlayer | None,
            ) -> None:
        self.name = name
        self.history = history
        self.player = player


class RpsGameInfo:
    def __init__(
            self,
            left: RpsPlayerInfo,
            right: RpsPlayerInfo,
            ) -> None:
        self.left = left
        self.right = right


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
            'players': [_USER, *players.keys()],}
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
                if ('left' not in data) or ('right' not in data):
                    return HttpResponseBadRequest(
                        "'left' or 'right' not found")
                return _initRps(data['left'], data['right'], request.session)
            case 'stop':
                return _uninitRps(request.session)
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
            request.session['winner'] = _USER
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


def _initRps(
        lname: str,
        rname: str,
        session: SessionBase,
        ) -> HttpResponse:
    # Declaring variables -------------------------------------------
    global players
    # ---------------------------------------------------------------
    breakpoint()
    bothPlayers = {lname, rname}
    if bothPlayers == {_USER}:
        return HttpResponseBadRequest(
            'This app does not support game between two users.')
    elif _USER in bothPlayers:
        #
        lHistory = list[Rps]()
        rHistory = list[Rps]()
        #
        try:
            lPlayer = players[lname](lHistory, rHistory)
        except KeyError:
            lPlayer = None
        try:
            rPlayer = players[rname](rHistory, lHistory)
        except KeyError:
            rPlayer = None
        #
        lInfo = RpsPlayerInfo(lname, lHistory, lPlayer)
        rInfo = RpsPlayerInfo(rname, rHistory, rPlayer)
        #
        rpsInfo = RpsGameInfo(lInfo, rInfo)
        cache.set(session.session_key, pickle.dumps(rpsInfo))
        # Responding with HTTP 200 OK...
        return HttpResponse('RPS game initialized', content_type='text/plain')
    else:
        return HttpResponseBadRequest(
            'This app does not support game between two computer '
            'algorithms for the time being.')


def _uninitRps(session: SessionBase) -> HttpResponse:
    cache.delete(session.session_key)
    return HttpResponse('The RPS game uninitialized.')
