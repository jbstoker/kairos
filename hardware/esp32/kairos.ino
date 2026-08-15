// Kairos clock for ESP32 (Arduino).
// Records solar noon with a button and shows Kairos time on an SSD1306 OLED.
// Requires: Adafruit SSD1306 + Adafruit GFX libraries.
// Configuration lives in config.h.

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

volatile bool noonPressed = false;
unsigned long lastNoonEpoch = 0;

void IRAM_ATTR onNoonButton() {
    static unsigned long last = 0;
    unsigned long now = millis();
    if (now - last > DEBOUNCE_MS) {
        last = now;
        noonPressed = true;
    }
}

void render() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    display.setCursor(0, 0);
    display.println(F("Kairos"));

    display.setCursor(0, 16);
    if (lastNoonEpoch > 0) {
        unsigned long elapsedSec = millis() / 1000 - lastNoonEpoch;
        unsigned long h = (elapsedSec / 3600) % 24;
        unsigned long m = (elapsedSec % 3600) / 60;
        display.print(F("Solar: "));
        display.print(h);
        display.print(F(":"));
        if (m < 10) display.print('0');
        display.println(m);
    } else {
        display.println(F("Solar: --:--"));
    }

    display.setCursor(0, 32);
    display.println(F("Moon: observe"));

    display.setCursor(0, 48);
    display.println(F("Season: observe"));

    display.display();
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onNoonButton, FALLING);

    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println(F("SSD1306 allocation failed"));
        for (;;) {}
    }
    display.clearDisplay();
    render();
}

void loop() {
    if (noonPressed) {
        noonPressed = false;
        lastNoonEpoch = millis() / 1000;
        Serial.println(F("Solar noon recorded"));
        render();
    }
    delay(REFRESH_MS);
}
