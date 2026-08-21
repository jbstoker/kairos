"""Elliptical orbital radii — the dynamic radial scaling for the header gauge.

The header's non-crossing axis gauge shows the Sun and Moon sliding along a
single vertical track. This module computes purely the dynamic scaling
factors from true astronomical anomaly equations (perihelion/aphelion for
the Sun, perigee/apogee for the Moon); the raw floats are passed straight to
the front-end render loop.
"""

import math
import time


class CelestialRadialMetrics:
    def __init__(self):
        self.sun_avg_dist = 149597870
        self.moon_avg_dist = 384400

    def get_sun_distance_factor(self, unix_timestamp):
        """
        Maps Earth's proximity to the sun (Perihelion to Aphelion).
        Returns radial multiplier bounded between ~0.983 and ~1.017.
        """
        tm = time.gmtime(unix_timestamp)
        day_of_year = tm.tm_yday
        anomaly = 2 * math.pi * (day_of_year - 3) / 365.25
        return 1 + 0.0167 * math.cos(anomaly)

    def get_moon_distance_factor(self, unix_timestamp):
        """
        Maps the Moon's elastic perigee-to-apogee variance.
        Returns radial multiplier bounded between ~0.94 and ~1.06.
        """
        base_perigee_unixtime = 1705147200
        elapsed_seconds = unix_timestamp - base_perigee_unixtime
        anomalistic_month_seconds = 27.55455 * 24 * 3600

        orbit_phase = (elapsed_seconds % anomalistic_month_seconds) / anomalistic_month_seconds
        anomaly = 2 * math.pi * orbit_phase
        return 1 + 0.0549 * math.cos(anomaly)
