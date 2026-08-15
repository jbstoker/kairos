# Kairos Hardware Clock

A physical Kairos clock: an OLED that shows solar time, moon phase, and
season, with one button for recording solar noon.

## Components

- Raspberry Pi Pico W (or any MicroPython board) — `hardware/pico/`
- or ESP32 (Arduino) — `hardware/esp32/`
- SSD1306 OLED display (128x64, I2C)
- Push button (for solar noon)
- 3.7V battery or USB power

## Wiring (Pico)

| Part | Pin |
| --- | --- |
| VCC | 3.3V |
| GND | GND |
| SCL | GP1 |
| SDA | GP0 |
| Button | GP15 (pull-up) |

## Wiring (ESP32)

| Part | Pin |
| --- | --- |
| VCC | 3.3V |
| GND | GND |
| SCL | GPIO22 |
| SDA | GPIO21 |
| Button | GPIO15 (pull-up) |

Pins are defined in `config.h` — change them to match your board.

## Software — Pico (MicroPython)

1. Flash MicroPython onto the board.
2. Copy `main.py` and `display_driver.py` (plus the `ssd1306` driver) to the
   device root.
3. Run. The clock displays:

       Kairos
       Solar: (2025, 3, 21, 12, 0, 0, 4, 80)
       Moon: 🌑
       Season: Observing...

## Software — ESP32 (Arduino)

1. Install the Adafruit SSD1306 and Adafruit GFX libraries.
2. Open `kairos.ino`, select your board, upload.
3. The button records solar noon; the display then shows hours:minutes since
   that noon.

## Usage

- Press the button when the shadow is shortest (solar noon). Do this a few
  days in a row for a reliable anchor.
- Moon phase and season can be set from the web app or serial input and, in a
  full build, synced to the device.

## Notes & limitations

- The default SSD1306 text font is 8x8 and cannot render emoji; the moon
  glyphs will appear as placeholder characters on the device.
- The firmware keeps observations in memory. For a permanent log, pair the
  device with the Python core (`core/anchor.py`) or the web app.
