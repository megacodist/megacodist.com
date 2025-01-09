#
# 
#

def toBool(s: str) -> bool:
    """Converts `s`, representing Boolean values to a `bool` object. Raises
    `ValueError` if `s` is not valid.
    """
    if s.lower() == 'true':
        return True
    elif s.lower() == 'false':
        return False
    else:
        raise ValueError(f"'{s}' is not a valid boolean value")
