SEASONS = ["Emerge", "Flourish", "Harvest", "Stillness"]


def tartarian_season(season_index):
    if season_index is None or not (0 <= season_index < len(SEASONS)):
        return None
    return SEASONS[season_index]
