/**
 * Kairos — 13-point degree wheel (360 / 13 = 27.6923076923…°)
 *
 * The natural 13-fold division of the circle, as a small pure helper plus a
 * decorative ring inside the sky-dome SVG.
 *
 * The sky-dome's OUTER wheel stays a physical azimuth readout (0–360° every
 * 30°: 180° top = noon, 90° left = sunrise, 270° right = sunset), because
 * the header shows the Sun's real azimuth and the number and the bead must
 * always agree. The 13-point ring is a clearly-separated INNER ring (r = 250)
 * that shows the natural scale of the 13 · 28 · 7 sequence — 13 equal parts,
 * each 27.6923076923…° (a repeating decimal, 692307…) — without touching the
 * azimuth labels or the beads.
 *
 * The ring renders into the <g id="natural-13-ring"> placeholder that lives
 * in both web/index.html and web/templates/concentric_view.html (the
 * canonical fragment). It is decorative: it never affects bead placement or
 * the header degree.
 */

const DEGREE_POINTS = 13;
const DEGREE_STEP = 360 / DEGREE_POINTS;      // 27.69230769230769… (repeating)

function getDegreeLabel(pointIndex) {
    const deg = pointIndex * DEGREE_STEP;
    return deg.toFixed(2) + '°';
}

function getDegreePoints() {
    const points = [];
    for (let i = 0; i < DEGREE_POINTS; i++) {
        points.push({
            angle: i * DEGREE_STEP,
            label: (i === 0) ? '0°' : (i * DEGREE_STEP).toFixed(2) + '°'
        });
    }
    return points;
}

// The wheel's angle convention: 0° at the bottom, counter-clockwise — the
// same convention as the azimuth wheel (x = cx − r·sinφ, y = cy + r·cosφ).
function degreePointXY(angleDeg, r, cx, cy) {
    const phi = angleDeg * Math.PI / 180;
    return {
        x: cx - r * Math.sin(phi),
        y: cy + r * Math.cos(phi)
    };
}

// Render the decorative 13-point natural ring into the placeholder. Pure and
// idempotent: safe to call from Node tests, never duplicates.
function renderNaturalThirteenRing() {
    if (typeof document === 'undefined') return 0;
    const host = document.getElementById('natural-13-ring');
    if (!host) return 0;
    if (host.childElementCount > 0) return host.childElementCount;
    const NS = 'http://www.w3.org/2000/svg';
    const CX = 400, CY = 400, RING_R = 250, LABEL_R = 258;
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', CX);
    ring.setAttribute('cy', CY);
    ring.setAttribute('r', RING_R);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#4a8f6f');
    ring.setAttribute('stroke-width', '1');
    ring.setAttribute('stroke-dasharray', '3,3');
    host.appendChild(ring);
    const points = getDegreePoints();
    for (let i = 0; i < points.length; i++) {
        const p = degreePointXY(points[i].angle, RING_R, CX, CY);
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', '#4a8f6f');
        const title = document.createElementNS(NS, 'title');
        title.textContent = '13-point natural scale · ' + points[i].label
            + ' (360/13 = 27.692307°)';
        dot.appendChild(title);
        host.appendChild(dot);
        const lp = degreePointXY(points[i].angle, LABEL_R, CX, CY);
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', lp.x);
        label.setAttribute('y', lp.y);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'central');
        label.setAttribute('fill', '#4a8f6f');
        label.setAttribute('font-size', '9');
        label.setAttribute('class', 'degree-label');
        label.textContent = points[i].label;
        host.appendChild(label);
    }
    return host.childElementCount;
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNaturalThirteenRing);
    } else {
        renderNaturalThirteenRing();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.DEGREE_POINTS = DEGREE_POINTS;
    module.exports.DEGREE_STEP = DEGREE_STEP;
    module.exports.getDegreeLabel = getDegreeLabel;
    module.exports.getDegreePoints = getDegreePoints;
    module.exports.degreePointXY = degreePointXY;
    module.exports.renderNaturalThirteenRing = renderNaturalThirteenRing;
}
