"""Observation corrections — your eyes are the final authority.

The astronomy engine predicts; you observe. Whenever a relevant
observation exists, it overrides the prediction. Kairos never argues
with what you actually saw.
"""

from datetime import datetime

from core.anchor import get_last_observation


def correct_solar_noon(predicted, max_age_days=2):
    """Adjust a predicted solar noon using your most recent observation.

    If a solar noon was observed recently (within `max_age_days`), the
    observed wall-clock time replaces the prediction — the sky you saw
    beats any formula. Otherwise the prediction stands.
    """
    observed = get_last_observation("solar_noon")
    if observed:
        try:
            observed_time = datetime.fromisoformat(observed["timestamp"])
        except (ValueError, TypeError):
            return predicted
        age = abs((predicted - observed_time).total_seconds())
        if age <= max_age_days * 86400:
            return predicted.replace(
                hour=observed_time.hour,
                minute=observed_time.minute,
                second=observed_time.second,
                microsecond=0,
            )
    return predicted
