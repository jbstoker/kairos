#ifndef KAIROS_CONFIG_H
#define KAIROS_CONFIG_H

// ---- Pins -------------------------------------------------------------
#define BUTTON_PIN 15     // solar-noon button (INPUT_PULLUP)
#define OLED_SDA 21       // ESP32 default I2C SDA
#define OLED_SCL 22       // ESP32 default I2C SCL

// ---- Display ----------------------------------------------------------
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_ADDR     0x3C
#define OLED_RESET    -1   // no reset pin

// ---- Time -------------------------------------------------------------
#define REFRESH_MS    60000   // redraw every 60 s
#define DEBOUNCE_MS   200     // button debounce

#endif // KAIROS_CONFIG_H
