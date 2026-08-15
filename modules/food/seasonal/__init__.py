"""Seasonal eating — food that grows where you are, when it grows."""

SEASONAL_FOODS = {
    "Spring": ["asparagus", "peas", "radishes", "spinach", "strawberries"],
    "Summer": ["tomatoes", "zucchini", "berries", "corn", "peppers"],
    "Autumn": ["squash", "apples", "mushrooms", "root vegetables", "pumpkin"],
    "Winter": ["cabbage", "potatoes", "carrots", "citrus", "leeks"],
}


def food_for_season(season):
    return SEASONAL_FOODS.get(season, ["eat what is local"])
