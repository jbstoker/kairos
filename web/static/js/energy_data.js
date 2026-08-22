// Kairos — Energy Lens data (web/static/js/energy_data.js).
//
// Seven energy traditions (Curanderismo, Taoist, Vedic, Pagan/Wiccan,
// Mesopotamian, Egyptian, Mayan), each reinterpreting the same optional
// layers that Kairos already computes — the 13-day archetype wheel, the
// moon-phase mood, the element of the day, the seasonal festival and the
// in-season foods & herbs. All values are translation keys resolved through
// the i18n catalog (web/i18n.js), so the whole layer is fully multilingual.
//
// The structure mirrors the "pure Kairos" keys:
//   archetypes : { KairosArchetype : { equivalentKey, practiceKey } }
//   moonMoods  : { KairosPhase   : { moodKey, practiceKey } }
//   elements   : { Fire|Water|Earth|Air|Ether : { elementKey, directionKey, colorKey } }
//   festivals  : { Solstice/Equinox/Moon : { equivalentKey, practiceKey } }
//   seasons    : { KairosSeason : { foodsKey, herbsKey } }
//
// Directions and colours are shared across traditions (direction_* / color_*).

const ENERGY_LENSES = {
    // --- Curanderismo ----------------------------------------------------
    curanderismo: {
        nameKey: 'energy_lens_curanderismo',
        icon: '🌿',
        archetypes: {
            'Creator': { equivalentKey: 'curanderismo_archetype_creator', practiceKey: 'curanderismo_practice_creator' },
            'Healer': { equivalentKey: 'curanderismo_archetype_healer', practiceKey: 'curanderismo_practice_healer' },
            'Warrior': { equivalentKey: 'curanderismo_archetype_warrior', practiceKey: 'curanderismo_practice_warrior' },
            'Sage': { equivalentKey: 'curanderismo_archetype_sage', practiceKey: 'curanderismo_practice_sage' },
            'Lover': { equivalentKey: 'curanderismo_archetype_lover', practiceKey: 'curanderismo_practice_lover' },
            'Guardian': { equivalentKey: 'curanderismo_archetype_guardian', practiceKey: 'curanderismo_practice_guardian' },
            'Mystic': { equivalentKey: 'curanderismo_archetype_mystic', practiceKey: 'curanderismo_practice_mystic' },
            'Destroyer': { equivalentKey: 'curanderismo_archetype_destroyer', practiceKey: 'curanderismo_practice_destroyer' },
            'Fool': { equivalentKey: 'curanderismo_archetype_fool', practiceKey: 'curanderismo_practice_fool' },
            'Magician': { equivalentKey: 'curanderismo_archetype_magician', practiceKey: 'curanderismo_practice_magician' },
            'Empress': { equivalentKey: 'curanderismo_archetype_empress', practiceKey: 'curanderismo_practice_empress' },
            'Emperor': { equivalentKey: 'curanderismo_archetype_emperor', practiceKey: 'curanderismo_practice_emperor' },
            'Star': { equivalentKey: 'curanderismo_archetype_star', practiceKey: 'curanderismo_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'curanderismo_moon_new', practiceKey: 'curanderismo_practice_new' },
            'Waxing Crescent': { moodKey: 'curanderismo_moon_waxing_crescent', practiceKey: 'curanderismo_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'curanderismo_moon_first_quarter', practiceKey: 'curanderismo_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'curanderismo_moon_waxing_gibbous', practiceKey: 'curanderismo_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'curanderismo_moon_full', practiceKey: 'curanderismo_practice_full' },
            'Waning Gibbous': { moodKey: 'curanderismo_moon_waning_gibbous', practiceKey: 'curanderismo_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'curanderismo_moon_last_quarter', practiceKey: 'curanderismo_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'curanderismo_moon_waning_crescent', practiceKey: 'curanderismo_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'curanderismo_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'curanderismo_element_water', directionKey: 'direction_west', colorKey: 'color_blue' },
            'Earth': { elementKey: 'curanderismo_element_earth', directionKey: 'direction_north', colorKey: 'color_green' },
            'Air': { elementKey: 'curanderismo_element_air', directionKey: 'direction_east', colorKey: 'color_yellow' },
            'Ether': { elementKey: 'curanderismo_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'curanderismo_festival_summer_solstice', practiceKey: 'curanderismo_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'curanderismo_festival_winter_solstice', practiceKey: 'curanderismo_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'curanderismo_festival_spring_equinox', practiceKey: 'curanderismo_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'curanderismo_festival_autumn_equinox', practiceKey: 'curanderismo_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'curanderismo_festival_full_moon', practiceKey: 'curanderismo_practice_full_moon' },
            'New Moon': { equivalentKey: 'curanderismo_festival_new_moon', practiceKey: 'curanderismo_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'curanderismo_season_emergence_foods', herbsKey: 'curanderismo_season_emergence_herbs' },
            'Radiance': { foodsKey: 'curanderismo_season_radiance_foods', herbsKey: 'curanderismo_season_radiance_herbs' },
            'Release': { foodsKey: 'curanderismo_season_release_foods', herbsKey: 'curanderismo_season_release_herbs' },
            'Stillness': { foodsKey: 'curanderismo_season_stillness_foods', herbsKey: 'curanderismo_season_stillness_herbs' }
        }
    },
    // --- Taoist ----------------------------------------------------------
    taoist: {
        nameKey: 'energy_lens_taoist',
        icon: '☯️',
        archetypes: {
            'Creator': { equivalentKey: 'taoist_archetype_creator', practiceKey: 'taoist_practice_creator' },
            'Healer': { equivalentKey: 'taoist_archetype_healer', practiceKey: 'taoist_practice_healer' },
            'Warrior': { equivalentKey: 'taoist_archetype_warrior', practiceKey: 'taoist_practice_warrior' },
            'Sage': { equivalentKey: 'taoist_archetype_sage', practiceKey: 'taoist_practice_sage' },
            'Lover': { equivalentKey: 'taoist_archetype_lover', practiceKey: 'taoist_practice_lover' },
            'Guardian': { equivalentKey: 'taoist_archetype_guardian', practiceKey: 'taoist_practice_guardian' },
            'Mystic': { equivalentKey: 'taoist_archetype_mystic', practiceKey: 'taoist_practice_mystic' },
            'Destroyer': { equivalentKey: 'taoist_archetype_destroyer', practiceKey: 'taoist_practice_destroyer' },
            'Fool': { equivalentKey: 'taoist_archetype_fool', practiceKey: 'taoist_practice_fool' },
            'Magician': { equivalentKey: 'taoist_archetype_magician', practiceKey: 'taoist_practice_magician' },
            'Empress': { equivalentKey: 'taoist_archetype_empress', practiceKey: 'taoist_practice_empress' },
            'Emperor': { equivalentKey: 'taoist_archetype_emperor', practiceKey: 'taoist_practice_emperor' },
            'Star': { equivalentKey: 'taoist_archetype_star', practiceKey: 'taoist_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'taoist_moon_new', practiceKey: 'taoist_practice_new' },
            'Waxing Crescent': { moodKey: 'taoist_moon_waxing_crescent', practiceKey: 'taoist_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'taoist_moon_first_quarter', practiceKey: 'taoist_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'taoist_moon_waxing_gibbous', practiceKey: 'taoist_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'taoist_moon_full', practiceKey: 'taoist_practice_full' },
            'Waning Gibbous': { moodKey: 'taoist_moon_waning_gibbous', practiceKey: 'taoist_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'taoist_moon_last_quarter', practiceKey: 'taoist_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'taoist_moon_waning_crescent', practiceKey: 'taoist_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'taoist_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'taoist_element_water', directionKey: 'direction_north', colorKey: 'color_black' },
            'Earth': { elementKey: 'taoist_element_earth', directionKey: 'direction_center', colorKey: 'color_yellow' },
            'Air': { elementKey: 'taoist_element_air', directionKey: 'direction_east', colorKey: 'color_green' },
            'Ether': { elementKey: 'taoist_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'taoist_festival_summer_solstice', practiceKey: 'taoist_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'taoist_festival_winter_solstice', practiceKey: 'taoist_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'taoist_festival_spring_equinox', practiceKey: 'taoist_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'taoist_festival_autumn_equinox', practiceKey: 'taoist_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'taoist_festival_full_moon', practiceKey: 'taoist_practice_full_moon' },
            'New Moon': { equivalentKey: 'taoist_festival_new_moon', practiceKey: 'taoist_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'taoist_season_emergence_foods', herbsKey: 'taoist_season_emergence_herbs' },
            'Radiance': { foodsKey: 'taoist_season_radiance_foods', herbsKey: 'taoist_season_radiance_herbs' },
            'Release': { foodsKey: 'taoist_season_release_foods', herbsKey: 'taoist_season_release_herbs' },
            'Stillness': { foodsKey: 'taoist_season_stillness_foods', herbsKey: 'taoist_season_stillness_herbs' }
        }
    },
    // --- Vedic -----------------------------------------------------------
    vedic: {
        nameKey: 'energy_lens_vedic',
        icon: '🕉️',
        archetypes: {
            'Creator': { equivalentKey: 'vedic_archetype_creator', practiceKey: 'vedic_practice_creator' },
            'Healer': { equivalentKey: 'vedic_archetype_healer', practiceKey: 'vedic_practice_healer' },
            'Warrior': { equivalentKey: 'vedic_archetype_warrior', practiceKey: 'vedic_practice_warrior' },
            'Sage': { equivalentKey: 'vedic_archetype_sage', practiceKey: 'vedic_practice_sage' },
            'Lover': { equivalentKey: 'vedic_archetype_lover', practiceKey: 'vedic_practice_lover' },
            'Guardian': { equivalentKey: 'vedic_archetype_guardian', practiceKey: 'vedic_practice_guardian' },
            'Mystic': { equivalentKey: 'vedic_archetype_mystic', practiceKey: 'vedic_practice_mystic' },
            'Destroyer': { equivalentKey: 'vedic_archetype_destroyer', practiceKey: 'vedic_practice_destroyer' },
            'Fool': { equivalentKey: 'vedic_archetype_fool', practiceKey: 'vedic_practice_fool' },
            'Magician': { equivalentKey: 'vedic_archetype_magician', practiceKey: 'vedic_practice_magician' },
            'Empress': { equivalentKey: 'vedic_archetype_empress', practiceKey: 'vedic_practice_empress' },
            'Emperor': { equivalentKey: 'vedic_archetype_emperor', practiceKey: 'vedic_practice_emperor' },
            'Star': { equivalentKey: 'vedic_archetype_star', practiceKey: 'vedic_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'vedic_moon_new', practiceKey: 'vedic_practice_new' },
            'Waxing Crescent': { moodKey: 'vedic_moon_waxing_crescent', practiceKey: 'vedic_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'vedic_moon_first_quarter', practiceKey: 'vedic_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'vedic_moon_waxing_gibbous', practiceKey: 'vedic_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'vedic_moon_full', practiceKey: 'vedic_practice_full' },
            'Waning Gibbous': { moodKey: 'vedic_moon_waning_gibbous', practiceKey: 'vedic_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'vedic_moon_last_quarter', practiceKey: 'vedic_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'vedic_moon_waning_crescent', practiceKey: 'vedic_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'vedic_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'vedic_element_water', directionKey: 'direction_west', colorKey: 'color_blue' },
            'Earth': { elementKey: 'vedic_element_earth', directionKey: 'direction_north', colorKey: 'color_green' },
            'Air': { elementKey: 'vedic_element_air', directionKey: 'direction_east', colorKey: 'color_yellow' },
            'Ether': { elementKey: 'vedic_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'vedic_festival_summer_solstice', practiceKey: 'vedic_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'vedic_festival_winter_solstice', practiceKey: 'vedic_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'vedic_festival_spring_equinox', practiceKey: 'vedic_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'vedic_festival_autumn_equinox', practiceKey: 'vedic_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'vedic_festival_full_moon', practiceKey: 'vedic_practice_full_moon' },
            'New Moon': { equivalentKey: 'vedic_festival_new_moon', practiceKey: 'vedic_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'vedic_season_emergence_foods', herbsKey: 'vedic_season_emergence_herbs' },
            'Radiance': { foodsKey: 'vedic_season_radiance_foods', herbsKey: 'vedic_season_radiance_herbs' },
            'Release': { foodsKey: 'vedic_season_release_foods', herbsKey: 'vedic_season_release_herbs' },
            'Stillness': { foodsKey: 'vedic_season_stillness_foods', herbsKey: 'vedic_season_stillness_herbs' }
        }
    },
    // --- Pagan / Wiccan --------------------------------------------------
    pagan: {
        nameKey: 'energy_lens_pagan',
        icon: '🕊️',
        archetypes: {
            'Creator': { equivalentKey: 'pagan_archetype_creator', practiceKey: 'pagan_practice_creator' },
            'Healer': { equivalentKey: 'pagan_archetype_healer', practiceKey: 'pagan_practice_healer' },
            'Warrior': { equivalentKey: 'pagan_archetype_warrior', practiceKey: 'pagan_practice_warrior' },
            'Sage': { equivalentKey: 'pagan_archetype_sage', practiceKey: 'pagan_practice_sage' },
            'Lover': { equivalentKey: 'pagan_archetype_lover', practiceKey: 'pagan_practice_lover' },
            'Guardian': { equivalentKey: 'pagan_archetype_guardian', practiceKey: 'pagan_practice_guardian' },
            'Mystic': { equivalentKey: 'pagan_archetype_mystic', practiceKey: 'pagan_practice_mystic' },
            'Destroyer': { equivalentKey: 'pagan_archetype_destroyer', practiceKey: 'pagan_practice_destroyer' },
            'Fool': { equivalentKey: 'pagan_archetype_fool', practiceKey: 'pagan_practice_fool' },
            'Magician': { equivalentKey: 'pagan_archetype_magician', practiceKey: 'pagan_practice_magician' },
            'Empress': { equivalentKey: 'pagan_archetype_empress', practiceKey: 'pagan_practice_empress' },
            'Emperor': { equivalentKey: 'pagan_archetype_emperor', practiceKey: 'pagan_practice_emperor' },
            'Star': { equivalentKey: 'pagan_archetype_star', practiceKey: 'pagan_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'pagan_moon_new', practiceKey: 'pagan_practice_new' },
            'Waxing Crescent': { moodKey: 'pagan_moon_waxing_crescent', practiceKey: 'pagan_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'pagan_moon_first_quarter', practiceKey: 'pagan_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'pagan_moon_waxing_gibbous', practiceKey: 'pagan_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'pagan_moon_full', practiceKey: 'pagan_practice_full' },
            'Waning Gibbous': { moodKey: 'pagan_moon_waning_gibbous', practiceKey: 'pagan_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'pagan_moon_last_quarter', practiceKey: 'pagan_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'pagan_moon_waning_crescent', practiceKey: 'pagan_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'pagan_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'pagan_element_water', directionKey: 'direction_west', colorKey: 'color_blue' },
            'Earth': { elementKey: 'pagan_element_earth', directionKey: 'direction_north', colorKey: 'color_green' },
            'Air': { elementKey: 'pagan_element_air', directionKey: 'direction_east', colorKey: 'color_yellow' },
            'Ether': { elementKey: 'pagan_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'pagan_festival_summer_solstice', practiceKey: 'pagan_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'pagan_festival_winter_solstice', practiceKey: 'pagan_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'pagan_festival_spring_equinox', practiceKey: 'pagan_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'pagan_festival_autumn_equinox', practiceKey: 'pagan_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'pagan_festival_full_moon', practiceKey: 'pagan_practice_full_moon' },
            'New Moon': { equivalentKey: 'pagan_festival_new_moon', practiceKey: 'pagan_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'pagan_season_emergence_foods', herbsKey: 'pagan_season_emergence_herbs' },
            'Radiance': { foodsKey: 'pagan_season_radiance_foods', herbsKey: 'pagan_season_radiance_herbs' },
            'Release': { foodsKey: 'pagan_season_release_foods', herbsKey: 'pagan_season_release_herbs' },
            'Stillness': { foodsKey: 'pagan_season_stillness_foods', herbsKey: 'pagan_season_stillness_herbs' }
        }
    },
    // --- Mesopotamian ----------------------------------------------------
    mesopotamian: {
        nameKey: 'energy_lens_mesopotamian',
        icon: '🏛️',
        archetypes: {
            'Creator': { equivalentKey: 'mesopotamian_archetype_creator', practiceKey: 'mesopotamian_practice_creator' },
            'Healer': { equivalentKey: 'mesopotamian_archetype_healer', practiceKey: 'mesopotamian_practice_healer' },
            'Warrior': { equivalentKey: 'mesopotamian_archetype_warrior', practiceKey: 'mesopotamian_practice_warrior' },
            'Sage': { equivalentKey: 'mesopotamian_archetype_sage', practiceKey: 'mesopotamian_practice_sage' },
            'Lover': { equivalentKey: 'mesopotamian_archetype_lover', practiceKey: 'mesopotamian_practice_lover' },
            'Guardian': { equivalentKey: 'mesopotamian_archetype_guardian', practiceKey: 'mesopotamian_practice_guardian' },
            'Mystic': { equivalentKey: 'mesopotamian_archetype_mystic', practiceKey: 'mesopotamian_practice_mystic' },
            'Destroyer': { equivalentKey: 'mesopotamian_archetype_destroyer', practiceKey: 'mesopotamian_practice_destroyer' },
            'Fool': { equivalentKey: 'mesopotamian_archetype_fool', practiceKey: 'mesopotamian_practice_fool' },
            'Magician': { equivalentKey: 'mesopotamian_archetype_magician', practiceKey: 'mesopotamian_practice_magician' },
            'Empress': { equivalentKey: 'mesopotamian_archetype_empress', practiceKey: 'mesopotamian_practice_empress' },
            'Emperor': { equivalentKey: 'mesopotamian_archetype_emperor', practiceKey: 'mesopotamian_practice_emperor' },
            'Star': { equivalentKey: 'mesopotamian_archetype_star', practiceKey: 'mesopotamian_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'mesopotamian_moon_new', practiceKey: 'mesopotamian_practice_new' },
            'Waxing Crescent': { moodKey: 'mesopotamian_moon_waxing_crescent', practiceKey: 'mesopotamian_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'mesopotamian_moon_first_quarter', practiceKey: 'mesopotamian_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'mesopotamian_moon_waxing_gibbous', practiceKey: 'mesopotamian_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'mesopotamian_moon_full', practiceKey: 'mesopotamian_practice_full' },
            'Waning Gibbous': { moodKey: 'mesopotamian_moon_waning_gibbous', practiceKey: 'mesopotamian_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'mesopotamian_moon_last_quarter', practiceKey: 'mesopotamian_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'mesopotamian_moon_waning_crescent', practiceKey: 'mesopotamian_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'mesopotamian_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'mesopotamian_element_water', directionKey: 'direction_west', colorKey: 'color_blue' },
            'Earth': { elementKey: 'mesopotamian_element_earth', directionKey: 'direction_north', colorKey: 'color_green' },
            'Air': { elementKey: 'mesopotamian_element_air', directionKey: 'direction_east', colorKey: 'color_yellow' },
            'Ether': { elementKey: 'mesopotamian_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'mesopotamian_festival_summer_solstice', practiceKey: 'mesopotamian_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'mesopotamian_festival_winter_solstice', practiceKey: 'mesopotamian_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'mesopotamian_festival_spring_equinox', practiceKey: 'mesopotamian_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'mesopotamian_festival_autumn_equinox', practiceKey: 'mesopotamian_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'mesopotamian_festival_full_moon', practiceKey: 'mesopotamian_practice_full_moon' },
            'New Moon': { equivalentKey: 'mesopotamian_festival_new_moon', practiceKey: 'mesopotamian_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'mesopotamian_season_emergence_foods', herbsKey: 'mesopotamian_season_emergence_herbs' },
            'Radiance': { foodsKey: 'mesopotamian_season_radiance_foods', herbsKey: 'mesopotamian_season_radiance_herbs' },
            'Release': { foodsKey: 'mesopotamian_season_release_foods', herbsKey: 'mesopotamian_season_release_herbs' },
            'Stillness': { foodsKey: 'mesopotamian_season_stillness_foods', herbsKey: 'mesopotamian_season_stillness_herbs' }
        }
    },
    // --- Egyptian --------------------------------------------------------
    egyptian: {
        nameKey: 'energy_lens_egyptian',
        icon: '🏺',
        archetypes: {
            'Creator': { equivalentKey: 'egyptian_archetype_creator', practiceKey: 'egyptian_practice_creator' },
            'Healer': { equivalentKey: 'egyptian_archetype_healer', practiceKey: 'egyptian_practice_healer' },
            'Warrior': { equivalentKey: 'egyptian_archetype_warrior', practiceKey: 'egyptian_practice_warrior' },
            'Sage': { equivalentKey: 'egyptian_archetype_sage', practiceKey: 'egyptian_practice_sage' },
            'Lover': { equivalentKey: 'egyptian_archetype_lover', practiceKey: 'egyptian_practice_lover' },
            'Guardian': { equivalentKey: 'egyptian_archetype_guardian', practiceKey: 'egyptian_practice_guardian' },
            'Mystic': { equivalentKey: 'egyptian_archetype_mystic', practiceKey: 'egyptian_practice_mystic' },
            'Destroyer': { equivalentKey: 'egyptian_archetype_destroyer', practiceKey: 'egyptian_practice_destroyer' },
            'Fool': { equivalentKey: 'egyptian_archetype_fool', practiceKey: 'egyptian_practice_fool' },
            'Magician': { equivalentKey: 'egyptian_archetype_magician', practiceKey: 'egyptian_practice_magician' },
            'Empress': { equivalentKey: 'egyptian_archetype_empress', practiceKey: 'egyptian_practice_empress' },
            'Emperor': { equivalentKey: 'egyptian_archetype_emperor', practiceKey: 'egyptian_practice_emperor' },
            'Star': { equivalentKey: 'egyptian_archetype_star', practiceKey: 'egyptian_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'egyptian_moon_new', practiceKey: 'egyptian_practice_new' },
            'Waxing Crescent': { moodKey: 'egyptian_moon_waxing_crescent', practiceKey: 'egyptian_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'egyptian_moon_first_quarter', practiceKey: 'egyptian_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'egyptian_moon_waxing_gibbous', practiceKey: 'egyptian_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'egyptian_moon_full', practiceKey: 'egyptian_practice_full' },
            'Waning Gibbous': { moodKey: 'egyptian_moon_waning_gibbous', practiceKey: 'egyptian_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'egyptian_moon_last_quarter', practiceKey: 'egyptian_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'egyptian_moon_waning_crescent', practiceKey: 'egyptian_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'egyptian_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'egyptian_element_water', directionKey: 'direction_west', colorKey: 'color_blue' },
            'Earth': { elementKey: 'egyptian_element_earth', directionKey: 'direction_north', colorKey: 'color_green' },
            'Air': { elementKey: 'egyptian_element_air', directionKey: 'direction_east', colorKey: 'color_yellow' },
            'Ether': { elementKey: 'egyptian_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'egyptian_festival_summer_solstice', practiceKey: 'egyptian_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'egyptian_festival_winter_solstice', practiceKey: 'egyptian_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'egyptian_festival_spring_equinox', practiceKey: 'egyptian_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'egyptian_festival_autumn_equinox', practiceKey: 'egyptian_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'egyptian_festival_full_moon', practiceKey: 'egyptian_practice_full_moon' },
            'New Moon': { equivalentKey: 'egyptian_festival_new_moon', practiceKey: 'egyptian_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'egyptian_season_emergence_foods', herbsKey: 'egyptian_season_emergence_herbs' },
            'Radiance': { foodsKey: 'egyptian_season_radiance_foods', herbsKey: 'egyptian_season_radiance_herbs' },
            'Release': { foodsKey: 'egyptian_season_release_foods', herbsKey: 'egyptian_season_release_herbs' },
            'Stillness': { foodsKey: 'egyptian_season_stillness_foods', herbsKey: 'egyptian_season_stillness_herbs' }
        }
    },
    // --- Mayan -----------------------------------------------------------
    mayan: {
        nameKey: 'energy_lens_mayan',
        icon: '🌎',
        archetypes: {
            'Creator': { equivalentKey: 'mayan_archetype_creator', practiceKey: 'mayan_practice_creator' },
            'Healer': { equivalentKey: 'mayan_archetype_healer', practiceKey: 'mayan_practice_healer' },
            'Warrior': { equivalentKey: 'mayan_archetype_warrior', practiceKey: 'mayan_practice_warrior' },
            'Sage': { equivalentKey: 'mayan_archetype_sage', practiceKey: 'mayan_practice_sage' },
            'Lover': { equivalentKey: 'mayan_archetype_lover', practiceKey: 'mayan_practice_lover' },
            'Guardian': { equivalentKey: 'mayan_archetype_guardian', practiceKey: 'mayan_practice_guardian' },
            'Mystic': { equivalentKey: 'mayan_archetype_mystic', practiceKey: 'mayan_practice_mystic' },
            'Destroyer': { equivalentKey: 'mayan_archetype_destroyer', practiceKey: 'mayan_practice_destroyer' },
            'Fool': { equivalentKey: 'mayan_archetype_fool', practiceKey: 'mayan_practice_fool' },
            'Magician': { equivalentKey: 'mayan_archetype_magician', practiceKey: 'mayan_practice_magician' },
            'Empress': { equivalentKey: 'mayan_archetype_empress', practiceKey: 'mayan_practice_empress' },
            'Emperor': { equivalentKey: 'mayan_archetype_emperor', practiceKey: 'mayan_practice_emperor' },
            'Star': { equivalentKey: 'mayan_archetype_star', practiceKey: 'mayan_practice_star' }
        },
        moonMoods: {
            'New Moon': { moodKey: 'mayan_moon_new', practiceKey: 'mayan_practice_new' },
            'Waxing Crescent': { moodKey: 'mayan_moon_waxing_crescent', practiceKey: 'mayan_practice_waxing_crescent' },
            'First Quarter': { moodKey: 'mayan_moon_first_quarter', practiceKey: 'mayan_practice_first_quarter' },
            'Waxing Gibbous': { moodKey: 'mayan_moon_waxing_gibbous', practiceKey: 'mayan_practice_waxing_gibbous' },
            'Full Moon': { moodKey: 'mayan_moon_full', practiceKey: 'mayan_practice_full' },
            'Waning Gibbous': { moodKey: 'mayan_moon_waning_gibbous', practiceKey: 'mayan_practice_waning_gibbous' },
            'Last Quarter': { moodKey: 'mayan_moon_last_quarter', practiceKey: 'mayan_practice_last_quarter' },
            'Waning Crescent': { moodKey: 'mayan_moon_waning_crescent', practiceKey: 'mayan_practice_waning_crescent' }
        },
        elements: {
            'Fire': { elementKey: 'mayan_element_fire', directionKey: 'direction_south', colorKey: 'color_red' },
            'Water': { elementKey: 'mayan_element_water', directionKey: 'direction_west', colorKey: 'color_blue' },
            'Earth': { elementKey: 'mayan_element_earth', directionKey: 'direction_north', colorKey: 'color_green' },
            'Air': { elementKey: 'mayan_element_air', directionKey: 'direction_east', colorKey: 'color_yellow' },
            'Ether': { elementKey: 'mayan_element_ether', directionKey: 'direction_center', colorKey: 'color_white' }
        },
        festivals: {
            'Summer Solstice': { equivalentKey: 'mayan_festival_summer_solstice', practiceKey: 'mayan_practice_summer_solstice' },
            'Winter Solstice': { equivalentKey: 'mayan_festival_winter_solstice', practiceKey: 'mayan_practice_winter_solstice' },
            'Spring Equinox': { equivalentKey: 'mayan_festival_spring_equinox', practiceKey: 'mayan_practice_spring_equinox' },
            'Autumn Equinox': { equivalentKey: 'mayan_festival_autumn_equinox', practiceKey: 'mayan_practice_autumn_equinox' },
            'Full Moon': { equivalentKey: 'mayan_festival_full_moon', practiceKey: 'mayan_practice_full_moon' },
            'New Moon': { equivalentKey: 'mayan_festival_new_moon', practiceKey: 'mayan_practice_new_moon' }
        },
        seasons: {
            'Emergence': { foodsKey: 'mayan_season_emergence_foods', herbsKey: 'mayan_season_emergence_herbs' },
            'Radiance': { foodsKey: 'mayan_season_radiance_foods', herbsKey: 'mayan_season_radiance_herbs' },
            'Release': { foodsKey: 'mayan_season_release_foods', herbsKey: 'mayan_season_release_herbs' },
            'Stillness': { foodsKey: 'mayan_season_stillness_foods', herbsKey: 'mayan_season_stillness_herbs' }
        }
    }
};

// Helper: get energy lens data for a specific lens
function getEnergyLensData(lensName) {
    return ENERGY_LENSES[lensName] || null;
}

// Resolve a translation key through the i18n catalog. The addendum used
// window.t, but in this codebase `t` is a global lexical binding (app.js),
// not a window property — so we resolve it defensively.
function trEnergyKey(key) {
    if (key == null) return null;
    if (typeof window !== 'undefined' && window.KairosI18n) {
        return window.KairosI18n.t(key);
    }
    if (typeof t === 'function') return t(key);
    return key;
}

// Helper: get translated value from a lens, using a key
function getEnergyValue(lensName, category, kairosKey, valueType) {
    const lens = getEnergyLensData(lensName);
    if (!lens) return null;
    const categoryData = lens[category];
    if (!categoryData) return null;
    const item = categoryData[kairosKey];
    if (!item) return null;
    const key = item[valueType + 'Key'];
    if (!key) return null;
    return trEnergyKey(key);
}

window.ENERGY_LENSES = ENERGY_LENSES;
window.getEnergyLensData = getEnergyLensData;
window.getEnergyValue = getEnergyValue;

if (typeof module !== 'undefined' && module.exports) {
    module.exports.ENERGY_LENSES = ENERGY_LENSES;
    module.exports.getEnergyLensData = getEnergyLensData;
    module.exports.getEnergyValue = getEnergyValue;
}
