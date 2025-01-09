#
# 
#

from collections import defaultdict

from . import IRpsPlayer, Rps


class Rps10Player(IRpsPlayer):
    name = 'RPS 10'

    def __init__(
            self,
            history: list[Rps],
            rival_history: list[Rps],
            ) -> None:
        super().__init__(history, rival_history,)
    
    def move(self) -> Rps:
        # Declaring of variables --------------------------
        import random
        # Functioning -------------------------------------
        predicts: dict[Rps, int] = defaultdict(lambda: 0)
        if len(self._rivalHistory) >= 5:
            map_ = self._listToDict(self._rivalHistory[-5:])
            res = self._decide(map_, 5)
            if isinstance(res, Rps):
                return res.getDefier()
            elif isinstance(res, tuple):
                for spsc in res:
                    predicts[spsc] += 1
        if len(self._rivalHistory) >= 10:
            map_ = self._listToDict(self._rivalHistory[-10:-5], map_) # type: ignore
            res = self._decide(map_, 10)
            if isinstance(res, Rps):
                return res.getDefier()
            elif isinstance(res, tuple):
                for spsc in predicts:
                    predicts[spsc] += 1
                for spsc in res:
                    predicts[spsc] += 1
        if len(self._rivalHistory) >= 20:
            for n in range(20, len(self._rivalHistory), 10):
                map_ = self._listToDict(self._rivalHistory[-n:(10-n)], map_) # type: ignore
                res = self._decide(map_, 10)
                if isinstance(res, Rps):
                    for spsc in predicts:
                        predicts[spsc] += 1
                    predicts[res] += 1
                elif isinstance(res, tuple):
                    for spsc in predicts:
                        predicts[spsc] += 1
                    for spsc in res:
                        predicts[spsc] += 1
        for spsc in Rps:
            predicts[spsc] += 1
        weights = [predicts[spsc] for spsc in Rps]
        guess = random.choices(list(Rps), weights, k=1)[0]
        return guess.getDefier()
    
    def _listToDict(
            self,
            sub_history: list[Rps],
            map_: dict[Rps, int] | None = None,
            ) -> dict[Rps, int]:
        """Converts queue of user choices into a mapping of
        `Rps -> number of choices`. if `map_` is provided, it will be
        updated with the new slice of the queue. Otherwise `map_` will
        be created, intialized and returned.
        """
        if map_ is None:
            map_ = defaultdict(lambda: 0)
        for elem in sub_history:
            map_[elem] += 1
        return map_
    
    def _decide(
            self,
            map_: dict[Rps, int],
            sum_: int,
            ) -> None | Rps | tuple[Rps] | tuple[Rps, Rps]:
        highFreq: list[Rps] = []
        for elem in map_:
            freq = map_[elem] / sum_
            if freq >= 0.65:
                return elem
            elif freq >= 0.4:
                highFreq.append(elem)
        if len(highFreq) > 0:
            return tuple(highFreq) # type: ignore
