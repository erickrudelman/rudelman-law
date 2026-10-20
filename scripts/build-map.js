// Generates public/img/cr-map.svg — an illustrated map of Costa Rica in the site palette.
// Real coastline from Natural Earth (world-atlas 1:10m); illustration is procedural.
// Run: node scripts/build-map.js
const fs = require('fs');
const path = require('path');
const topo = require('world-atlas/countries-10m.json');
const { feature } = require('topojson-client');

// ---------- Projection ----------
const LON0 = -86.05, LON1 = -82.35, LAT0 = 7.85, LAT1 = 11.35;
const COS = Math.cos((9.6 * Math.PI) / 180);
const K = 1000 / ((LON1 - LON0) * COS);
const W = 1000, H = Math.round((LAT1 - LAT0) * K);
const proj = ([lon, lat]) => [(lon - LON0) * COS * K, (LAT1 - lat) * K];
const ll = (lat, lon) => proj([lon, lat]);
const f1 = (n) => +n.toFixed(1);

// Deterministic randomness so the map is identical on every build
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a, b) => a + rnd() * (b - a);

// ---------- Geometry ----------
const countries = feature(topo, topo.objects.countries).features;
const byId = (id) => countries.find((c) => c.id === id);

function rings(f, filter = () => true) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.filter(filter).map((poly) => poly.map((ring) => ring.map(proj)));
}

function toPath(polys, minPx, clamp = false) {
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      let last = null, seg = '', n = 0;
      for (let [x, y] of ring) {
        if (clamp) { x = Math.max(-40, Math.min(W + 40, x)); y = Math.max(-40, Math.min(H + 40, y)); }
        if (last && Math.hypot(x - last[0], y - last[1]) < minPx) continue;
        seg += (seg ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        last = [x, y]; n++;
      }
      if (n > 3) d += seg + 'Z';
    }
  }
  return d;
}

function inside([x, y], polys) {
  let hit = false;
  for (const poly of polys) {
    for (const ring of poly) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
    }
  }
  return hit;
}

const cr = rings(byId('188'), (p) => p[0][0][0] > -86); // drop Isla del Coco
const ni = rings(byId('558'), (p) => p[0].some((c) => c[1] < 11.5));
const pa = rings(byId('591'), (p) => p[0].some((c) => c[0] < -82.3));
const allLand = [...cr, ...ni, ...pa];
const onLand = (p) => inside(p, allLand);
const inCR = (p) => inside(p, cr);

// ---------- Places ----------
// [lat, lon, label?, label anchor/offset]
const PLACES = {
  // Central Valley & provincial capitals
  'San José':       [9.933, -84.083, true, 'end', -14, -10],
  'Alajuela':       [10.016, -84.214],
  'Heredia':        [9.998, -84.117],
  'Cartago':        [9.864, -83.919],
  'Turrialba':      [9.906, -83.683],
  'Liberia':        [10.635, -85.437, true, 'start', 12, 5],
  'Limón':          [9.99, -83.031, true, 'end', -12, -6],
  // Guanacaste
  'Tamarindo':      [10.299, -85.837, true, 'end', -12, 4],
  'Nosara':         [9.979, -85.653, true, 'end', -12, 4],
  'Flamingo':       [10.433, -85.785],
  'Marbella':       [10.056, -85.71],
  'Papagayo':       [10.63, -85.68, true, 'end', -12, 4],
  'Las Catalinas':  [10.478, -85.792],
  'Playa Hermosa':  [10.567, -85.675],
  'Islita':         [9.857, -85.405],
  'Santa Cruz':     [10.261, -85.585],
  'Nicoya':         [10.148, -85.452],
  // Southern Nicoya Peninsula & Central Pacific
  'Santa Teresa':   [9.643, -85.168, true, 'end', -12, 10],
  'Malpaís':        [9.607, -85.142],
  'Cabuya':         [9.596, -85.093],
  'Montezuma':      [9.655, -85.069],
  'Cóbano':         [9.683, -85.11],
  'Tambor':         [9.716, -85.016],
  'Manzanillo':     [9.69, -85.2],
  'Puntarenas':     [9.976, -84.838, true, 'start', 10, 4],
  'Monteverde':     [10.301, -84.825],
  'Quepos':         [9.43, -84.162, true, 'end', -12, 4],
  // Southern zone
  'Dominical':      [9.253, -83.861],
  'Uvita':          [9.16, -83.745, true, 'end', -12, 6],
  'Ojochal':        [9.077, -83.665],
  'Pérez Zeledón':  [9.373, -83.704, true, 'start', 12, 5],
  'Buenos Aires':   [9.165, -83.334],
  'San Vito':       [8.821, -82.971],
  'Golfito':        [8.64, -83.183, true, 'start', 12, 5],
  'Puerto Jiménez': [8.535, -83.305],
  'Pavones':        [8.392, -83.14],
  // Northern zone
  'Arenal':         [10.463, -84.703, true, 'end', -12, -6],
  'Ciudad Quesada': [10.323, -84.427, true, 'start', 12, 6],
  'Upala':          [10.898, -85.016],
  'Los Chiles':     [11.033, -84.713, true, 'start', 12, 5],
  'Sarapiquí':      [10.452, -84.018],
  // Caribbean
  'Guápiles':       [10.216, -83.787],
  'Tortuguero':     [10.543, -83.504, true, 'start', 12, 5],
  'Cahuita':        [9.737, -82.84],
  'Puerto Viejo':   [9.656, -82.755, true, 'end', -12, 16],
};

// Province borders (Natural Earth admin-1, public domain) and label anchors
const PROVINCE_DATA = require('../data-src/cr-provinces.json');
const PROVINCE_LABELS = {
  Guanacaste: [10.36, -85.27], Alajuela: [10.74, -84.42], Heredia: [10.6, -84.0], Limón: [10.22, -83.42],
  'San José': [9.5, -83.98], Cartago: [9.7, -83.6], Puntarenas: [8.82, -83.42],
};

// ---------- Illustration pieces ----------
const C = {
  land: '#2f3b26', land2: '#3a482e', ridge: '#6d7d4f', sage: '#7f8e5c', sageLight: '#a9b388',
  canopy: '#45542f', cream: '#fff8f1', gold: '#c9a878', navy: '#172457',
};

function mountain(x, y, s, snow = false) {
  const h = 16 * s, w = 13 * s;
  let out = `<path d="M${f1(x - w)} ${f1(y)}L${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y)}Z" fill="${C.ridge}"/>`;
  out += `<path d="M${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y)}L${f1(x + w * 0.35)} ${f1(y)}Z" fill="${C.land}" opacity=".45"/>`;
  if (snow) out += `<path d="M${f1(x - w * 0.28)} ${f1(y - h * 0.72)}L${f1(x)} ${f1(y - h)}L${f1(x + w * 0.28)} ${f1(y - h * 0.72)}L${f1(x + w * 0.1)} ${f1(y - h * 0.8)}L${f1(x - w * 0.08)} ${f1(y - h * 0.7)}Z" fill="${C.sageLight}"/>`;
  return out;
}

function volcano(x, y, s, smoke = false) {
  const h = 26 * s, w = 22 * s, crater = 4 * s;
  let out = `<path d="M${f1(x - w)} ${f1(y)}Q${f1(x - w * 0.35)} ${f1(y - h * 0.55)} ${f1(x - crater)} ${f1(y - h)}L${f1(x + crater)} ${f1(y - h)}Q${f1(x + w * 0.35)} ${f1(y - h * 0.55)} ${f1(x + w)} ${f1(y)}Z" fill="${C.ridge}"/>`;
  out += `<path d="M${f1(x + crater)} ${f1(y - h)}Q${f1(x + w * 0.35)} ${f1(y - h * 0.55)} ${f1(x + w)} ${f1(y)}L${f1(x + w * 0.2)} ${f1(y)}Z" fill="${C.land}" opacity=".45"/>`;
  out += `<path d="M${f1(x - crater)} ${f1(y - h)}L${f1(x + crater)} ${f1(y - h)}L${f1(x + crater * 0.6)} ${f1(y - h + 3 * s)}L${f1(x - crater * 0.6)} ${f1(y - h + 3 * s)}Z" fill="${C.sageLight}"/>`;
  if (smoke) {
    out += `<g class="smoke" fill="none" stroke="${C.cream}" stroke-width="${f1(2 * s)}" stroke-linecap="round" opacity=".75">` +
      `<path d="M${f1(x)} ${f1(y - h - 3)}c${f1(-6 * s)} ${f1(-6 * s)} ${f1(6 * s)} ${f1(-10 * s)} 0 ${f1(-16 * s)}"/>` +
      `<path d="M${f1(x + 6 * s)} ${f1(y - h - 8 * s)}c${f1(-5 * s)} ${f1(-5 * s)} ${f1(5 * s)} ${f1(-8 * s)} 0 ${f1(-13 * s)}" opacity=".6"/></g>`;
  }
  return out;
}

const TREE_SYMBOLS = [0, 1, 2].map((v) => {
  const r = 5;
  const lean = [0, 0.25, -0.2][v];
  return `<g id="crTree${v}">` +
    `<circle cx="${f1(r * 0.3)}" cy="${f1(r * 0.4)}" r="${f1(r * 1.05)}" fill="${C.land}" opacity=".55"/>` +
    `<circle cx="${f1(-r * (0.55 + lean))}" cy="0" r="${f1(r * 0.78)}" fill="${C.canopy}"/>` +
    `<circle cx="${f1(r * (0.55 - lean))}" cy="${f1(r * 0.1)}" r="${f1(r * 0.72)}" fill="${C.canopy}"/>` +
    `<circle cx="${f1(lean * r)}" cy="${f1(-r * 0.45)}" r="${f1(r * (0.82 + v * 0.06))}" fill="${v === 2 ? C.sageLight : C.sage}"/>` +
    `<circle cx="${f1(-r * 0.3 + lean * r)}" cy="${f1(-r * 0.75)}" r="${f1(r * 0.28)}" fill="${C.sageLight}" opacity=".75"/></g>`;
}).join('');
const tree = (x, y, s) => `<use href="#crTree${Math.floor(rnd() * 3)}" transform="translate(${f1(x)} ${f1(y)}) scale(${s.toFixed(2)})"/>`;

// Smooth value noise, used to cluster the jungle into natural masses
const GRID = Array.from({ length: 400 }, () => rnd());
const g = (i, j) => GRID[((i * 31 + j * 17) % 400 + 400) % 400];
function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j;
  const sm = (t) => t * t * (3 - 2 * t);
  const a = g(i, j) + (g(i + 1, j) - g(i, j)) * sm(u);
  const b = g(i, j + 1) + (g(i + 1, j + 1) - g(i, j + 1)) * sm(u);
  return a + (b - a) * sm(v);
}

// A palm frond: curved stem with tapered leaflets along both sides
function frond(x, y, len, angle, bend, leaflets, width, color, stemColor = color) {
  const a = (angle * Math.PI) / 180;
  const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const nx = -Math.sin(a), ny = Math.cos(a);
  const cx = (x + ex) / 2 + nx * bend, cy = (y + ey) / 2 + ny * bend;
  const at = (t) => [(1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ey];
  let d = '';
  for (let i = 1; i <= leaflets; i++) {
    const t = 0.12 + (i / leaflets) * 0.86;
    const [px, py] = at(t);
    const [qx, qy] = at(Math.min(1, t + 0.02));
    const tx = qx - px, ty = qy - py, tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl, uy = ty / tl;
    const l = len * 0.42 * Math.sin(Math.PI * (0.18 + t * 0.78)) * (0.85 + rnd() * 0.25);
    for (const side of [1, -1]) {
      const sw = 35 * (Math.PI / 180) * side;
      const dx = ux * Math.cos(sw) - uy * Math.sin(sw), dy = ux * Math.sin(sw) + uy * Math.cos(sw);
      const tipx = px + dx * l, tipy = py + dy * l + l * 0.12;
      const mx = (px + tipx) / 2, my = (py + tipy) / 2;
      const w = width * (1 - t * 0.5);
      d += `M${f1(px)} ${f1(py)}Q${f1(mx - dy * w)} ${f1(my + dx * w)} ${f1(tipx)} ${f1(tipy)}Q${f1(mx + dy * w * 0.3)} ${f1(my - dx * w * 0.3)} ${f1(px)} ${f1(py)}Z`;
    }
  }
  return `<path d="${d}" fill="${color}"/><path d="M${f1(x)} ${f1(y)}Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}" fill="none" stroke="${stemColor}" stroke-width="${f1(width * 0.35)}" stroke-linecap="round"/>`;
}

function palm(x, y, s) {
  let out = `<path d="M${f1(x)} ${f1(y)}q${f1(3 * s)} ${f1(-12 * s)} ${f1(-2 * s)} ${f1(-26 * s)}" fill="none" stroke="#6b5a42" stroke-width="${f1(2.4 * s)}" stroke-linecap="round"/>`;
  const tx = x - 2 * s, ty = y - 26 * s;
  [-160, -120, -60, -20, 20, 160].forEach((ang, i) => {
    out += frond(tx, ty, (12 + (i % 2) * 3) * s, ang, 3 * s * (ang > -90 ? 1 : -1), 5, 1.6 * s, i % 2 ? C.sage : C.canopy);
  });
  return out;
}

function waves(x, y, s, o = 0.22) {
  const w = 14 * s;
  return `<path d="M${f1(x)} ${f1(y)}q${f1(w / 2)} ${f1(-5 * s)} ${f1(w)} 0t${f1(w)} 0M${f1(x + w * 0.6)} ${f1(y + 7 * s)}q${f1(w / 2)} ${f1(-5 * s)} ${f1(w)} 0t${f1(w)} 0" fill="none" stroke="${C.navy}" stroke-width="1.3" stroke-linecap="round" opacity="${o}"/>`;
}

// ---------- Compose ----------
const crPath = toPath(cr, 1.2);
const niPath = toPath(ni, 3, true);
const paPath = toPath(pa, 3, true);

// Cordillera: Guanacaste → Tilarán → Central → Talamanca
const RIDGE = [[10.83, -85.33], [10.67, -85.02], [10.46, -84.75], [10.25, -84.45], [10.12, -84.15], [9.98, -83.86],
  [9.75, -83.62], [9.5, -83.45], [9.25, -83.15], [9.0, -82.92]].map(([a, b]) => ll(a, b));
function along(points, t) {
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let d = t * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) { const k = d / segs[i]; return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i][1] + (points[i + 1][1] - points[i][1]) * k]; }
    d -= segs[i];
  }
  return points[points.length - 1];
}

const VOLCANOES = [
  [10.83, -85.324, 0.95], [10.67, -85.015, 0.85], [10.463, -84.703, 1.15, true], [10.2, -84.233, 1],
  [9.979, -83.852, 1.05], [10.025, -83.767, 0.9, true],
].map(([a, b, s, smoke]) => [...ll(a, b), s, smoke]);
const pinXY = Object.fromEntries(Object.entries(PLACES).map(([k, v]) => [k, ll(v[0], v[1])]));
const nearPins = (p, r) => Object.values(pinXY).some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < r);
const nearVolcano = (p, r) => VOLCANOES.some((v) => Math.hypot(p[0] - v[0], p[1] - (v[1] - 10)) < r);

const relief = [];
for (let i = 0; i <= 54; i++) {
  const t = i / 54;
  const [x, y] = along(RIDGE, t);
  for (const off of [-1, 1]) {
    const p = [x + between(-8, 8), y + off * between(4, 13)];
    if (!inCR(p) || nearVolcano(p, 26)) continue;
    const s = between(0.6, 1.05) * (t > 0.6 ? 1.15 : 0.9);
    relief.push({ y: p[1], svg: mountain(p[0], p[1], s, t > 0.68 && t < 0.82 && rnd() > 0.5) });
  }
}
VOLCANOES.forEach(([x, y, s, smoke]) => relief.push({ y, svg: volcano(x, y, s, smoke) }));

// Jungle: dense canopy in the lowlands, sparse in the dry northwest (Guanacaste)
const forest = [];
for (let i = 0; i < 20000 && forest.length < 720; i++) {
  const p = [between(0, W), between(0, H)];
  if (!inCR(p) || nearPins(p, 13) || nearVolcano(p, 30)) continue;
  const ridgeDist = Math.min(...Array.from({ length: 60 }, (_, k) => { const q = along(RIDGE, k / 59); return Math.hypot(p[0] - q[0], p[1] - q[1]); }));
  if (ridgeDist < 20) continue;
  const dryNW = p[0] < 330 && p[1] < 330; // Guanacaste is drier
  const density = noise(p[0] / 70, p[1] / 70) * 0.7 + noise(p[0] / 25, p[1] / 25) * 0.3;
  if (rnd() > Math.pow(density, 1.6) * (dryNW ? 0.5 : 1.9)) continue;
  if (forest.some((q) => Math.hypot(q.p[0] - p[0], q.p[1] - p[1]) < 9.5)) continue;
  forest.push({ p, y: p[1], svg: tree(p[0], p[1], between(0.8, 1.2)) });
}

const palms = [['Tamarindo', 16, -4], ['Santa Teresa', 18, -14], ['Puerto Viejo', -22, -6], ['Uvita', 14, -18], ['Nosara', 16, 2], ['Pavones', 14, -18]]
  .map(([k, dx, dy]) => { const [x, y] = pinXY[k]; return { y: y + dy, svg: palm(x + dx, y + dy, 0.95) }; });

const provincePaths = PROVINCE_DATA.features.map((f) => {
  const polys = f.type === 'Polygon' ? [f.coordinates] : f.coordinates;
  return toPath(polys.map((poly) => poly.map((ring) => ring.map(proj))), 1.2);
}).join('');
const provinceLabels = Object.entries(PROVINCE_LABELS).map(([name, [lat, lon]]) => {
  const [x, y] = ll(lat, lon);
  return `<text class="map-province" x="${f1(x)}" y="${f1(y)}" text-anchor="middle">${name.toUpperCase()}</text>`;
}).join('');

const layered = [...forest, ...relief, ...palms].sort((a, b) => a.y - b.y).map((o) => o.svg).join('');

// Sea waves
const waveMarks = [];
for (let i = 0; i < 400 && waveMarks.length < 26; i++) {
  const p = [between(30, W - 60), between(30, H - 30)];
  if (onLand(p) || onLand([p[0] + 30, p[1]]) || onLand([p[0], p[1] + 20]) || onLand([p[0] - 20, p[1] - 20])) continue;
  if (waveMarks.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 95)) continue;
  if (p[0] < 260 && p[1] > 830) continue; // compass area
  waveMarks.push(p);
}

// Pins
const pinsSvg = Object.entries(PLACES).map(([name, [, , labeled, anchor = 'start', dx = 10, dy = 4]]) => {
  const [x, y] = pinXY[name];
  const capital = name === 'San José';
  const r = capital ? 7.5 : labeled ? 5.5 : 4.2;
  return `<g class="pin${labeled ? ' labeled' : ''}${capital ? ' capital' : ''}" data-place="${name}" transform="translate(${f1(x)} ${f1(y)})" tabindex="0">` +
    `<title>${name}</title>` +
    `<circle class="pin-pulse" r="${r}"/>` +
    (capital ? `<circle r="${r + 5}" fill="none" stroke="${C.gold}" stroke-width="1.5"/>` : '') +
    `<circle class="pin-dot" r="${r}"/>` +
    `<text class="pin-label" x="${dx}" y="${dy}" text-anchor="${anchor}">${name}</text></g>`;
}).join('');

const compass = (() => {
  const x = 120, y = 870;
  return `<g class="compass" transform="translate(${x} ${y})" opacity=".55">` +
    `<circle r="30" fill="none" stroke="${C.navy}" stroke-width="1"/><circle r="22" fill="none" stroke="${C.navy}" stroke-width=".6" stroke-dasharray="2 3"/>` +
    `<path d="M0 -40L6 0L0 6L-6 0Z" fill="${C.navy}"/><path d="M0 40L6 0L0 -6L-6 0Z" fill="none" stroke="${C.navy}"/>` +
    `<path d="M-40 0L0 -4L4 0L0 4Z" fill="none" stroke="${C.navy}" stroke-width=".8"/><path d="M40 0L0 -4L-4 0L0 4Z" fill="none" stroke="${C.navy}" stroke-width=".8"/>` +
    `<text y="-46" text-anchor="middle" class="compass-n">N</text></g>`;
})();

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="cr-map-svg" role="img" aria-labelledby="crmap-title">
<title id="crmap-title">Costa Rica — Rudelman Law</title>
<defs>
  <linearGradient id="crLand" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.land2}"/><stop offset="1" stop-color="${C.land}"/>
  </linearGradient>
  <pattern id="crHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="7" stroke="${C.navy}" stroke-width=".7" opacity=".16"/>
  </pattern>
  <path id="crShape" d="${crPath}"/>
  <clipPath id="crClip"><use href="#crShape"/></clipPath>
  <filter id="crShadow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="crSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
  ${TREE_SYMBOLS}
</defs>
<g class="sea">${waveMarks.map(([x, y]) => waves(x, y, between(0.9, 1.3))).join('')}</g>
<g class="neighbors">
  <path d="${niPath}" fill="url(#crHatch)" stroke="${C.navy}" stroke-opacity=".28" stroke-width="1" stroke-dasharray="3 4"/>
  <path d="${paPath}" fill="url(#crHatch)" stroke="${C.navy}" stroke-opacity=".28" stroke-width="1" stroke-dasharray="3 4"/>
  <text x="${f1(ll(11.2, -85.1)[0])}" y="${f1(ll(11.2, -85.1)[1])}" class="map-country">NICARAGUA</text>
  <text x="${f1(ll(8.55, -82.62)[0])}" y="${f1(ll(8.55, -82.62)[1])}" class="map-country">PANAMÁ</text>
</g>
<g class="coast-halo" fill="none" stroke="${C.navy}" stroke-linejoin="round">
  <use href="#crShape" stroke-width="44" stroke-opacity=".035"/>
  <use href="#crShape" stroke-width="26" stroke-opacity=".045"/>
  <use href="#crShape" stroke-width="12" stroke-opacity=".06"/>
</g>
<use href="#crShape" fill="${C.land}" opacity=".35" transform="translate(8 12)" filter="url(#crShadow)"/>
<use href="#crShape" fill="url(#crLand)"/>
<g clip-path="url(#crClip)">
  <path d="${'M' + RIDGE.map((p) => p.map(f1).join(' ')).join('L')}" fill="none" stroke="${C.sage}" stroke-width="90" stroke-linecap="round" stroke-linejoin="round" opacity=".1" filter="url(#crSoft)"/>
  ${layered}
  <path class="province-borders" d="${provincePaths}" fill="none" stroke="${C.cream}" stroke-width="1.4" stroke-opacity=".55" stroke-dasharray="5 5" stroke-linejoin="round"/>
</g>
<g class="provinces">${provinceLabels}</g>
<use href="#crShape" fill="none" stroke="${C.cream}" stroke-width="1.4" stroke-opacity=".55"/>
<text class="map-sea" data-i18n="map.pacific" transform="translate(${f1(ll(9.05, -85.35)[0])} ${f1(ll(9.05, -85.35)[1])}) rotate(-28)">Pacific Ocean</text>
<text class="map-sea" data-i18n="map.caribbean" transform="translate(${f1(ll(10.75, -83.15)[0])} ${f1(ll(10.75, -83.15)[1])}) rotate(-38)">Caribbean Sea</text>
${compass}
<g class="pins">${pinsSvg}</g>
</svg>
`;

// ---------- Decorative palm leaves for the section corners ----------
function leafCluster(fronds) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">` +
    fronds.map(([ang, len, bend, color, op]) => `<g opacity="${op}">${frond(-10, -10, len, ang, bend, 24, 7.5, color)}</g>`).join('') +
    `</svg>
`;
}
const leaves = leafCluster([
  [62, 380, -34, C.sage, 0.55],
  [12, 360, 30, C.sage, 0.5],
  [45, 410, -18, C.canopy, 0.85],
  [24, 330, 26, C.land, 0.9],
  [78, 300, -26, C.land, 0.8],
]);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'img', 'leaves.svg'), leaves);

const out = path.join(__dirname, '..', 'public', 'img', 'cr-map.svg');
fs.writeFileSync(out, svg);
console.log(`Wrote ${out} (${(svg.length / 1024).toFixed(1)} KB): ${forest.length} trees, ${relief.length} relief, ${waveMarks.length} waves`);
