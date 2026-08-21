/**
 * Kairos — Mobile Touch Enhancements
 *
 * MOBILE OPTIMIZATION addendum, adapted to the consolidated layout:
 * - The touchend handler is DELEGATED (document-level), so the seasonal
 *   chips injected into #seasonalContainer after load
 *   (web/seasonal_display.js) are covered too — the addendum's
 *   querySelectorAll snapshot at load time would miss them.
 * - #kstDisplay gets the panel chrome only; the primary KST one-line is
 *   sized by mobile.css (a blanket font-size on the panel would inflate the
 *   SVG matrix, metadata grid and buttons inside it).
 */

document.addEventListener('DOMContentLoaded', function () {
    // --- Prevent zoom on double-tap for buttons ---
    document.addEventListener('touchend', function (e) {
        const el = e.target && e.target.closest
            ? e.target.closest('button, .action-btn, .seasonal-item')
            : null;
        if (el) {
            e.preventDefault();
            el.click();
        }
    }, { passive: false });

    // --- Improve scroll on modals ---
    document.querySelectorAll('.modal-overlay').forEach(function (modal) {
        modal.addEventListener('touchmove', function (e) {
            e.stopPropagation();
        }, { passive: true });
    });

    // --- Ensure status messages are readable ---
    const status = document.getElementById('status');
    if (status) {
        status.style.fontSize = '1rem';
        status.style.padding = '12px';
        status.style.background = '#1a2230';
        status.style.borderRadius = '12px';
        status.style.marginTop = '12px';
        status.style.color = '#d4d9e6';
    }

    // --- Make the KST display more prominent ---
    const kstDisplay = document.getElementById('kstDisplay');
    if (kstDisplay) {
        kstDisplay.style.padding = '16px';
        kstDisplay.style.background = '#1a2230';
        kstDisplay.style.borderRadius = '20px';
        kstDisplay.style.border = '1px solid #2a3442';
        kstDisplay.style.color = '#f5e6c4';
        kstDisplay.style.textAlign = 'center';
        kstDisplay.style.lineHeight = '1.6';
        kstDisplay.style.wordWrap = 'break-word';
    }
});
