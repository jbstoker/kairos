/**
 * Kairos — Solar Time Engine
 */

function getSolarDegrees() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msSinceStart = now - startOfDay;
    const totalMsInDay = 24 * 60 * 60 * 1000;
    const fractionOfDay = msSinceStart / totalMsInDay;
    return fractionOfDay * 360;
}

function degreesToKairosTime(degrees) {
    const totalMinutes = (degrees / 360) * 24 * 60;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getKairosTimeDisplay() {
    const degrees = getSolarDegrees();
    const time = degreesToKairosTime(degrees);
    return `${time} (${degrees.toFixed(1)}°)`;
}

function getGregorianTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getSolarDegrees = getSolarDegrees;
    module.exports.degreesToKairosTime = degreesToKairosTime;
    module.exports.getKairosTimeDisplay = getKairosTimeDisplay;
    module.exports.getGregorianTime = getGregorianTime;
}
