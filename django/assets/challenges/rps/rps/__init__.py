#
# 
#

from __future__ import annotations
from abc import ABC, abstractmethod
import enum
from typing import Any


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


class IRpsPlayer(ABC):
    name: str

    def __init__(
            self,
            history: list[Rps],
            rival_history: list[Rps],
            ) -> None:
        self._history = history
        self._rivalHistory = rival_history
    
    def __call__(self) -> Any:
        return self.move()
    
    @abstractmethod
    def move(self) -> Rps:
        pass
