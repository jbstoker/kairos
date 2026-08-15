"""Display driver for the Kairos Pico clock (SSD1306 OLED, I2C)."""

from machine import Pin, I2C
import ssd1306


class KairosDisplay:
    """Thin wrapper around an SSD1306 128x64 OLED for Kairos screens."""

    def __init__(self, scl_pin=1, sda_pin=0, width=128, height=64, freq=400000):
        self.width = width
        self.height = height
        i2c = I2C(0, scl=Pin(scl_pin), sda=Pin(sda_pin), freq=freq)
        self._oled = ssd1306.SSD1306_I2C(width, height, i2c)

    def clear(self):
        self._oled.fill(0)

    def line(self, line_index, text):
        """Render text on a 16px line (4 lines fit on a 64px display)."""
        y = (line_index * 16) % self.height
        self._oled.text(str(text), 0, y, 1)

    def render(self):
        self._oled.show()

    def show_screen(self, solar, moon, season):
        self.clear()
        self.line(0, "Kairos")
        self.line(1, "Solar: " + str(solar))
        self.line(2, "Moon: " + str(moon))
        self.line(3, "Season: " + str(season))
        self.render()
