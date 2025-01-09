#
# 
#

from __future__ import annotations
from importlib import import_module
from inspect import isabstract, isclass
import json
from pathlib import Path
import pickle
import random
from typing import Literal

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

_WIN_MSGS = {
    1: [
        "Great start!", 
        "Nice one!", 
        "Good job!", 
        "Solid choice!", 
        "Well done, keep it up!", 
        "You've got this!",
    ],
    2: [
        "Impressive!", 
        "You're gaining momentum!", 
        "Nice streak! Keep going!", 
        "You're on fire!", 
        "Way to go—two in a row!", 
        "You're showing some skill!",
    ],
    3: [
        "You're on a roll!", 
        "Victory is becoming your habit!", 
        "Impressive streak!", 
        "Well played, you’re unstoppable!", 
        "Three times the charm!", 
        "You're crushing it!",
    ],
    4: [
        "You're a force to be reckoned with!", 
        "You're dominating this game!", 
        "Unstoppable! Keep it going!", 
        "Incredible streak! Keep winning!", 
        "You're a Rock-Paper-Scissors legend!", 
        "Master of the game!"
    ],
}
_LOSS_MSGS = {
    1: [
        "Tough luck, try again!", 
        "You'll get it next time!", 
        "Not your best move, but keep going!", 
        "Don't give up!", 
        "Stay focused, you'll bounce back!", 
        "Just a setback, you're still in the game!"
    ],
    2: [
        "Hang in there, you can still turn this around!", 
        "It’s just a rough patch, keep playing!", 
        "Losing is part of learning!", 
        "You’re getting closer, don't stop!", 
        "Every loss is a step toward improvement!", 
        "Keep your head up, it's not over yet!"
    ],
    3: [
        "Don't let this get you down, you're learning!", 
        "You're bound to win the next one!", 
        "Tough streak, but you're improving!", 
        "Keep going! Victory is just around the corner!", 
        "Believe in yourself, you're on the right track!", 
        "The next win will feel even better after this!"
    ],
    4: [
        "Everyone has a bad streak—don’t give up!", 
        "You can still make a comeback!", 
        "Shake it off and focus!", 
        "You’re getting stronger with every loss!", 
        "Champions are made by pushing through tough times!", 
        "Stay resilient—your winning streak will come!"
    ],
}

players: dict[str, type[IRpsPlayer]] = {}
"""The mappng between names and implementations of RPS players."""


class RpsPlayerInfo:
    def __init__(
            self,
            name: str,
            history: list[Rps],
            score: int = 0,
            player: IRpsPlayer | None = None,
            ) -> None:
        self.name = name
        self.history = history
        self.score = score
        self.player = player


class RpsGameInfo:
    def __init__(
            self,
            left: RpsPlayerInfo,
            right: RpsPlayerInfo,
            ) -> None:
        self.left = left
        self.right = right
        self.lastWinner: Literal['user', 'com', 'none',] = 'none'
        """The winner of the last move."""
        self.nLastWins = 0
        """The number of consecutive wins that happened last."""
        self.nBeforeWins = 0
        """The number of consecutive wins that happened before last loss
        or losses.
        """
        self.nLastLosses = 0
        """The number of consecutive losses that happened last."""
        self.nBeofreLosses = 0
        """The number of consecutive losses that happened before last win
        or wins.
        """


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
        jinja2Engine = engines['jinja2']
        template = jinja2Engine.get_template('challenges/rps/page.j2')
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
                if 'move' not in data:
                    return HttpResponseBadRequest('move is not specified')
                elif data['move'] not in {'rock', 'paper', 'scissors'}:
                    return HttpResponseBadRequest(
                        f'bad move value: {data['move']}')
                return _move(data['move'], request.session)
            case _:
                return HttpResponseBadRequest(
                    f'invalid action: {data['action']}')


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
                f'assets.challenges.rps.rps.{fileName.stem}')
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
        lInfo = RpsPlayerInfo(
            name=lname,
            history=lHistory,
            score=0,
            player=lPlayer)
        rInfo = RpsPlayerInfo(
            name=rname,
            history=rHistory,
            score=0,
            player=rPlayer)
        #
        rpsInfo = RpsGameInfo(lInfo, rInfo)
        cache.set(session.session_key, pickle.dumps(rpsInfo))
        # Responding with HTTP 200 OK...
        return HttpResponse('RPS game initialized', content_type='text/plain',)
    else:
        return HttpResponseBadRequest(
            'This app does not support game between two computer '
            'algorithms for the time being.')


def _uninitRps(session: SessionBase) -> HttpResponse:
    cache.delete(session.session_key)
    return HttpResponse(
        'The RPS game uninitialized.',
        content_type='text/plain',)


def _move(
        user_move: Literal['rock', 'paper', 'scissors'],
        session: SessionBase,
        ) -> HttpResponse:
    # Declaring variables -------------------------------------------
    global cache
    # ---------------------------------------------------------------
    rpsInfo: RpsGameInfo = pickle.loads(cache.get(session.session_key))
    if not (bool(rpsInfo.left.player) ^ bool(rpsInfo.right.player)):
        return HttpResponseBadRequest(
            "'move' is only acceptable in user-computer game")
    if rpsInfo.left.player is None:
        userInfo = rpsInfo.left
        comInfo = rpsInfo.right
    else:
        userInfo = rpsInfo.right
        comInfo = rpsInfo.left
    #
    try:
        userMove = Rps[user_move.upper()]
    except KeyError:
        return HttpResponseBadRequest(f'invalid user move: {user_move}')
    comMove = comInfo.player.move() # type: ignore
    userInfo.history.append(userMove)
    comInfo.history.append(comMove)
    #
    if userMove > comMove:
        winner = 'user'
        userInfo.score += 1
        if rpsInfo.lastWinner == 'none':
            rpsInfo.lastWinner = 'user'
            rpsInfo.nLastWins = 1
            rpsInfo.nBeforeWins = 0
            rpsInfo.nLastLosses = 0
            rpsInfo.nBeofreLosses = 0
        elif rpsInfo.lastWinner == 'user':
            rpsInfo.nLastWins += 1
        elif rpsInfo.lastWinner == 'com':
            rpsInfo.lastWinner = 'user'
            rpsInfo.nBeforeWins = rpsInfo.nLastWins
            rpsInfo.nLastWins = 1
        else:
            pass
        rpsInfo.lastWinner = 'user'
        message = _getWinLossMsg(rpsInfo)
    elif comMove > userMove:
        winner = 'com'
        comInfo.score += 1
        if rpsInfo.lastWinner == 'none':
            rpsInfo.lastWinner = 'com'
            rpsInfo.nLastWins = 0
            rpsInfo.nBeforeWins = 0
            rpsInfo.nLastLosses = 1
            rpsInfo.nBeofreLosses = 0
        elif rpsInfo.lastWinner == 'user':
            rpsInfo.nBeofreLosses = rpsInfo.nLastLosses
            rpsInfo.nLastLosses = 1
        elif rpsInfo.lastWinner == 'com':
            rpsInfo.nLastLosses += 1
        else:
            pass
        rpsInfo.lastWinner = 'com'
        message = _getWinLossMsg(rpsInfo)
    else:
        winner = 'draw'
        message = 'draw'
    cache.set(session.session_key, pickle.dumps(rpsInfo),)
    #
    data = {
        'user_move': user_move,
        'com_move': comMove.name.lower(),
        'user_score': userInfo.score,
        'com_score': comInfo.score,
        'winner': winner,
        'message': message}
    return JsonResponse(data)


def _getWinLossMsg(rps_info: RpsGameInfo) -> str:
    """Gets a suitable message for user or computer win. It raises
    `ValueError` if last move resulted in draw.
    """
    # declaring variables ---------------------------------
    global _WIN_MSGS
    global _LOSS_MSGS
    #------------------------------------------------------
    if rps_info.lastWinner == 'user':
        if rps_info.nLastLosses < 2:
            idx = rps_info.nLastWins + rps_info.nBeforeWins
            if idx > 4:
                idx = 4
            return random.choice(_WIN_MSGS[idx])
        else:
            idx = 4 if rps_info.nLastWins > 4 else rps_info.nLastWins
            return random.choice(_WIN_MSGS[idx])
    elif rps_info.lastWinner == 'com':
        if rps_info.nLastWins < 2:
            idx = rps_info.nLastLosses + rps_info.nBeofreLosses
            if idx > 4:
                idx = 4
            return random.choice(_LOSS_MSGS[idx])
        else:
            idx = 4 if rps_info.nLastLosses > 4 else rps_info.nLastLosses
            return random.choice(_LOSS_MSGS[idx])
    else:
        raise ValueError('last move resulted in draw')
