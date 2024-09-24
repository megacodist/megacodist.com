#
# 
#

from __future__ import annotations
import enum
import json
from typing import Any

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.http.response import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods


class Rps(enum.IntEnum):
    """This enumeration offers choices of Rock, Paper, Scissors game.
    This class implements hashable and rich comparisonprotocols.
    """
    ROCK = 1
    PAPER = 2
    SCISSORS = 3

    @classmethod
    def getComparer(cls, a: Rps, b: Rps) -> int:
        """If the return is:
        * positive: `a > b`
        * 0: `a == b`
        * negative: `a < b`
        """
        dif = a.value - b.value
        return dif * ((-1) ** (abs(dif) - 1))

    def getDefier(self) -> Rps:
        """Gets the enumerator that defies this one."""
        match self:
            case Rps.ROCK:
                return Rps.PAPER
            case Rps.PAPER:
                return Rps.SCISSORS
            case Rps.SCISSORS:
                return Rps.ROCK
    
    def getLoser(self) -> Rps:
        """Gets the enumerator that loses this one."""
        match self:
            case Rps.ROCK:
                return Rps.SCISSORS
            case Rps.PAPER:
                return Rps.ROCK
            case Rps.SCISSORS:
                return Rps.PAPER

    def __lt__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.getDefier() == other
    
    def __le__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.getLoser() != other
    
    def __gt__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.getLoser() == other
    
    def __ge__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.getDefier() != other
    
    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.value == other.value
    
    def __ne__(self, other: Any) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.value != other.value
    
    def __hash__(self) -> int:
        return self.value


@require_http_methods(['GET', 'POST'])
def play(request: HttpRequest) -> HttpResponse: # type: ignore
    from random import choice
    if request.method == 'GET':
        context = {
            'algorithms': ['Random'],}
        return render(
            request,
            template_name='challenges/rps/page.j2',
            context=context)
    if request.method == 'POST':
        # Retrieving data...
        try:
            data = json.loads(request.body)
        except Exception:
            return HttpResponseBadRequest(
                'could not retrieve data')
        #
        match data['action']:
            case 'start':
                pass
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

