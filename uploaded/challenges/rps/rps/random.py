#
# 
#

import random

from . import IRpsPlayer, Rps


class RandomRpsPlayer(IRpsPlayer):
    name = 'Random'

    def __init__(
            self,
            history: list[Rps],
            rival_history: list[Rps],
            ) -> None:
        super().__init__(history, rival_history)
    
    def move(self) -> Rps:
        return random.choice(list(Rps))
