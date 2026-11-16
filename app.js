'use strict';
{
const API = 'https://zwiftgopher.com/api/optimize';
const LS = 'ppttt.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
const fmt = (n, d = 0) => (n == null || n === '' || isNaN(Number(n))) ? '–' : Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/* ---------- Beschriftungen ---------- */
const EFF = [['0.8', 'Sehr locker'], ['0.9', 'Locker'], ['0.95', 'Etwas lockerer'], ['1', 'Normal'], ['1.05', 'Scharf'], ['1.1', 'Sehr scharf']];
const INT = {
  '-3': ['Sehr locker', 'Alle kommen sicher und gemeinsam ins Ziel, mit viel Reserve.'],
  '-2': ['Locker', 'Alle kommen gemeinsam ins Ziel, mit Reserve.'],
  '-1': ['Kontrolliert', 'Alle kommen ins Ziel, aber nah am Limit.'],
  '0': ['Normal / Wettkampf', 'Das Tempo, das ein typisches Team wirklich fährt: Ein, zwei Fahrer lassen evtl. Züge aus, der schwächste kann kurz vor Schluss abreißen.'],
  '1': ['Offensiv', 'Schneller; dafür dürfen Fahrer geopfert werden.'],
  '2': ['Sehr offensiv', 'Deutlich schneller; mehrere Fahrer können abreißen.'],
  '3': ['Maximal', 'Volles Risiko: Hauptsache, die nötigen Finisher kommen schnell an.']
};
const EFFLBL = { Poor: 'Schwach', Average: 'Durchschnittlich', Good: 'Gut', Excellent: 'Sehr gut', Elite: 'Elite' };
const BIND = {
  if_limit: 'IF-Grenze', pull_limit: 'Grenze der Zugleistung', route_if_cap: 'IF-Deckel für diese Strecke',
  fatigue_no_drop: 'Ermüdung: niemand darf abreißen', fatigue_quorum: 'Ermüdung: genug Fahrer müssen ankommen',
  fatigue_survival: 'Ermüdung: Durchhaltevermögen', minimum_finishers: 'Mindestzahl Finisher', speed_floor: 'Mindesttempo',
  speed_ceiling: 'Höchsttempo', target_speed_locked: 'Tempo fest vorgegeben', evaluate_only: 'Plan nur bewertet (nicht optimiert)', none: 'nichts'
};
const WARN = {
  PULL_FTP_HIGH: 'Zugleistung sehr hoch', WHEEL_POWER_HIGH: 'Leistung im Windschatten sehr hoch', IF_HIGH: 'IF über dem eigenen Limit',
  EFFORT_NOT_MET: 'Effort-Wunsch nicht erfüllt', EFFORT_COST: 'Was die lockeren Fahrer kosten', IF_TARGET_NOT_REACHED: 'Team-IF-Ziel nicht erreicht',
  CONSTRAINT_AT_LIMIT: 'Vorgabe am Limit', TARGET_SPEED_INFEASIBLE: 'Tempo nicht haltbar', PLAN_OVER_LIMITS: 'Plan über den Grenzen', IMAGE_FAILED: 'Bild konnte nicht erstellt werden'
};
const LEVEL = [['', 'Automatisch'], ['untrained', 'Untrainiert'], ['recreational', 'Freizeit'], ['trained', 'Trainiert'], ['competitive', 'Wettkampf'], ['elite', 'Elite'], ['pro', 'Profi']];
const SURF = { brick: 'Ziegel', cobbles: 'Kopfsteinpflaster', wood: 'Holz', snow: 'Schnee', dirt: 'Erde', grass: 'Gras', gravel: 'Schotter' };
const OUT = { met: 'erfüllt', partly: 'teilweise erfüllt', not_met: 'nicht erfüllt', no_effect: 'ohne Wirkung' };
const FIN = { met: 'erfüllt', not_met: 'nicht erfüllt', unverified: 'nicht geprüft' };
const COLORS = [['', 'Automatisch'], ['#FF1A1A', 'Rot'], ['#1D3FD8', 'Blau'], ['#FFF014', 'Gelb'], ['#12A80B', 'Grün'], ['#FF8C00', 'Orange'], ['#8E24AA', 'Lila'], ['#00BCD4', 'Cyan'], ['#FF4FA3', 'Pink'], ['#FFFFFF', 'Weiß'], ['#111111', 'Schwarz'], ['#8A8A8A', 'Grau'], ['#7A4A1E', 'Braun']];
const CATS = ['', 'A+', 'A', 'B', 'C', 'D', 'E'];
const ICON = {
  up: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5-5 5 5"/></svg>',
  down: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l5 5 5-5"/></svg>',
  gear: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h9M15 5h2M3 10h3M9 10h8M3 15h7M13 15h4"/><circle cx="13.5" cy="5" r="1.6"/><circle cx="7.5" cy="10" r="1.6"/><circle cx="11.5" cy="15" r="1.6"/></svg>'
};

/* ---------- Zustand ---------- */
const DEF = () => ({
  v: 1, key: '', roster: ROSTER.map(r => ({ ...r })), sel: [], opt: {},
  race: { mode: 'race', race: 'next', route: '2836167073', laps: '1', km: '', bike: 'auto' },
  set: { intensity: '0', efficiency: 'auto', finishers: '0', minPull: '30', maxPull: '180', step: '15', zero: false, strategy: 'variable', speed: '', holdSpeed: false, keepOrder: false, avgIf: '', maxIf: '', ftpSrc: 'zr', optimizer: 'v2', team: 'Pacepresso B', colour: '#0b4f43', layout: '' },
  last: null
});
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(LS) || 'null');
    if (j && j.v === 1) { const d = DEF(); return { ...d, ...j, race: { ...d.race, ...j.race }, set: { ...d.set, ...j.set }, opt: j.opt || {} }; }
  } catch (e) { /* kein Speicher */ }
  return DEF();
}
let S = load();
const save = () => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* voll oder gesperrt */ } };
const byId = id => S.roster.find(r => r.id === id);
const optOf = id => (S.opt[id] = S.opt[id] || {});
const routeById = id => ROUTES.find(r => r[1] === id);
const getPath = p => p.split('.').reduce((o, k) => o?.[k], S);
const setPath = (p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], S)[last] = v; };

let shared = null;   // Plan aus einem geteilten Link
let ed = null;       // Bearbeitungsmodus
const openDet = new Set();

/* ---------- Status ---------- */
function say(msg, cls = '') {
  $$('.status-out').forEach(el => { el.textContent = msg; el.className = 'status status-out ' + cls; });
}
let busy = false, coolUntil = 0;
function setBusy(on, msg) {
  busy = on;
  const b = $('#optBtn');
  b.disabled = on;
  b.innerHTML = on ? `<span class="spin"></span>${esc(msg)}` : 'Optimieren <small>· 10 Einheiten</small>';
  $$('[data-need-api]').forEach(x => { x.disabled = on; });
  if (on) say(msg);
}

/* ---------- Kopfzeile ---------- */
function raceName(id) {
  const r = RACES.find(x => x[0] === id);
  const d = new Date(id.slice(4) + 'T12:00:00');
  const date = `${WD[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
  const kind = id.startsWith('zrl') ? 'ZRL' : 'WTRL';
  return r ? `${date} · ${kind} · ${r[1]} (${r[2]})` : `${date} · ${kind}`;
}
function upcoming() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return RACES.filter(r => new Date(r[0].slice(4) + 'T23:59:00') >= today);
}
function renderTop() {
  const up = upcoming()[0];
  $('#nextLine').textContent = up ? 'Nächstes Rennen: ' + raceName(up[0]) : 'Zugplan für das Mannschaftszeitfahren';
  const k = $('#keyBtn');
  k.className = 'chip ' + (S.key ? 'ok' : 'no');
  k.textContent = S.key ? 'API verbunden' : 'API-Key fehlt';
}

/* ---------- Kader ---------- */
function riderHTML(r) {
  const i = S.sel.indexOf(r.id), on = i >= 0, o = S.opt[r.id] || {}, open = openDet.has(r.id);
  const info = r.guest ? `Gast · FTP ${fmt(r.ftp)} W · ${fmt(r.weight, 1)} kg` : `#${r.id}${r.zftp ? ` · ${r.zftp} W · ${fmt(r.wkg, 2)} W/kg` : ''}`;
  const pins = ['pull', 'pmin', 'pmax', 'adj', 'amin', 'amax', 'ftp', 'weight', 'height', 'p5', 'cp', 'wkj', 'level'].some(k => o[k] !== undefined && o[k] !== '');
  const eff = o.effort || '1';
  const sel = (k, list, v) => `<select data-o="${k}">${list.map(([val, lab]) => `<option value="${val}"${String(v ?? '') === val ? ' selected' : ''}>${lab}</option>`).join('')}</select>`;
  const inp = (k, lab, attrs = '') => `<label>${lab}<input type="number" data-o="${k}" value="${esc(o[k] ?? '')}" ${attrs}></label>`;
  const det = !open ? '' : `<div class="det">
    <h3>Fahrerwerte <span class="badge">leer = automatisch</span></h3>
    <div class="g4">
      ${r.guest
        ? `<label>FTP (W)<input type="number" data-r="ftp" value="${esc(r.ftp)}" min="50" max="2000"></label><label>Gewicht (kg)<input type="number" data-r="weight" value="${esc(r.weight)}" step="0.1"></label><label>Größe (cm)<input type="number" data-r="height" value="${esc(r.height)}"></label>`
        : inp('ftp', 'FTP (W)', 'min="50" max="2000" placeholder="auto"') + inp('weight', 'Gewicht (kg)', 'step="0.1" placeholder="auto"') + inp('height', 'Größe (cm)', 'placeholder="auto"')}
      ${inp('p5', '5-min-Leistung (W)', 'placeholder="auto"')}
      ${inp('cp', 'CP (W)', 'placeholder="auto"')}
      ${inp('wkj', 'W′ (kJ)', 'step="0.1" placeholder="auto"')}
      <label>Trainingsstand${sel('level', LEVEL, o.level)}</label>
      <label>Kategorie${sel('cat', CATS.map(c => [c, c || 'Wie Profil']), o.cat)}</label>
    </div>
    <h3>Vorgaben für den Optimierer</h3>
    <div class="g4">
      ${inp('pull', 'Zug fest (s)', 'min="0" max="600" step="5" placeholder="frei"')}
      ${inp('pmin', 'Zug min. (s)', 'min="10" max="600" step="5" placeholder="global"')}
      ${inp('pmax', 'Zug max. (s)', 'min="10" max="600" step="5" placeholder="global"')}
      <label>Trikotfarbe${sel('color', COLORS, o.color)}</label>
      ${inp('adj', 'Anpassung fest (%)', 'min="50" max="150" placeholder="frei"')}
      ${inp('amin', 'Anpassung min. (%)', 'min="50" max="150" placeholder="50"')}
      ${inp('amax', 'Anpassung max. (%)', 'min="50" max="150" placeholder="150"')}
    </div>
    <p class="hint">Anpassung = Zugleistung relativ zum Teamtempo (100 % = Zug im Zieltempo). „Zug fest 0“ heißt: fährt nur im Windschatten.</p>
    <button class="link" type="button" data-act="remove">Aus dem Kader entfernen</button>
  </div>`;
  return `<li class="rider${on ? ' on' : ''}" data-id="${esc(r.id)}">
    <div class="r-main">
      <label class="pick"><input type="checkbox" class="selbox"${on ? ' checked' : ''} aria-label="${esc(r.name)} fährt mit"><span class="ord">${on ? i + 1 : ''}</span></label>
      <div class="who" data-act="tog"><b>${esc(r.name)}${r.guest ? '<span class="badge">Gast</span>' : ''}<span class="badge g pinb"${pins ? '' : ' hidden'}>Vorgaben</span></b><small>${esc(info)}</small></div>
      ${on ? `<select class="eff" data-o="effort" aria-label="Effort ${esc(r.name)}">${EFF.map(([v, l]) => `<option value="${v}"${v === String(eff) ? ' selected' : ''}>${l}${v === '1' ? '' : ' (' + v.replace('.', ',') + ')'}</option>`).join('')}</select>` : ''}
      ${on ? `<div class="r-act"><button class="ib" type="button" data-act="up" aria-label="${esc(r.name)} nach vorn">${ICON.up}</button><button class="ib" type="button" data-act="down" aria-label="${esc(r.name)} nach hinten">${ICON.down}</button></div>` : ''}
      <button class="ib gearb" type="button" data-act="det" aria-expanded="${open}" aria-label="Details ${esc(r.name)}">${ICON.gear}</button>
    </div>${det}</li>`;
}
function renderRoster() {
  const sel = S.sel.map(byId).filter(Boolean);
  S.sel = sel.map(r => r.id);
  const rest = S.roster.filter(r => !S.sel.includes(r.id));
  $('#roster').innerHTML = [...sel, ...rest].map(riderHTML).join('');
  const n = S.sel.length, c = $('#selCount');
  c.textContent = `${n} von 8 gewählt`;
  c.classList.toggle('bad', n > 0 && (n < 2 || n > 8));
  const zrl = S.race.mode === 'race' && /zrl/.test(S.race.race === 'next' ? (upcoming()[0]?.[0] || '') : S.race.race);
  $('#selHint').textContent = zrl
    ? 'ZRL-TTT: 4 bis 6 Fahrer starten, gewertet wird die Zeit des 4. Fahrers. Fahrer antippen zum Auswählen, Pfeile für die Startreihenfolge.'
    : 'Fahrer antippen zum Auswählen (2 bis 8). Mit den Pfeilen legst du die Startreihenfolge fest.';
}
function toggle(id) {
  const i = S.sel.indexOf(id);
  if (i >= 0) S.sel.splice(i, 1);
  else if (S.sel.length >= 8) { say('Maximal 8 Fahrer pro Team.', 'err'); return renderRoster(); }
  else S.sel.push(id);
  save(); renderRoster();
}
function bindRoster() {
  const ro = $('#roster');
  ro.addEventListener('change', e => {
    const li = e.target.closest('.rider'); if (!li) return;
    const id = li.dataset.id;
    if (e.target.classList.contains('selbox')) return toggle(id);
  });
  ro.addEventListener('input', e => {
    const li = e.target.closest('.rider'); if (!li) return;
    const id = li.dataset.id, t = e.target;
    if (t.dataset.o) {
      optOf(id)[t.dataset.o] = t.value; save();
      const o = S.opt[id];
      li.querySelector('.pinb').hidden = !['pull', 'pmin', 'pmax', 'adj', 'amin', 'amax', 'ftp', 'weight', 'height', 'p5', 'cp', 'wkj', 'level'].some(k => o[k] !== undefined && o[k] !== '');
    } else if (t.dataset.r) { const r = byId(id); if (r) { r[t.dataset.r] = num(t.value); save(); } }
  });
  ro.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const li = b.closest('.rider'), id = li.dataset.id, act = b.dataset.act;
    if (act === 'tog') return toggle(id);
    if (act === 'det') { openDet.has(id) ? openDet.delete(id) : openDet.add(id); return renderRoster(); }
    if (act === 'up' || act === 'down') {
      const i = S.sel.indexOf(id), j = act === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= S.sel.length) return;
      [S.sel[i], S.sel[j]] = [S.sel[j], S.sel[i]]; save(); renderRoster();
      const nb = $(`.rider[data-id="${CSS.escape(id)}"] [data-act="${act}"]`); if (nb) nb.focus();
      return;
    }
    if (act === 'remove') {
      S.roster = S.roster.filter(r => r.id !== id); S.sel = S.sel.filter(x => x !== id); delete S.opt[id]; openDet.delete(id);
      save(); renderRoster(); say('Fahrer aus dem Kader entfernt.');
    }
  });
  $('#addZwift').addEventListener('submit', e => {
    e.preventDefault();
    const id = $('#aId').value.trim(), name = $('#aName').value.trim();
    if (!/^\d+$/.test(id)) return say('Die Zwift-ID besteht nur aus Ziffern.', 'err');
    if (byId(id)) return say('Dieser Fahrer ist schon im Kader.', 'err');
    S.roster.push({ id, name: name || '#' + id, cat: 'B' }); save(); renderRoster();
    e.target.reset(); say(`${name || id} hinzugefügt. FTP und Gewicht holt sich die API.`, 'ok');
  });
  $('#addGuest').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#gName').value.replace(/[^\p{L}\p{N} ._'-]/gu, '').trim().slice(0, 60);
    if (!name) return say('Bitte einen Namen eingeben (Buchstaben, Ziffern, Leerzeichen).', 'err');
    S.roster.push({ id: 'g' + Date.now().toString(36), name, guest: true, ftp: num($('#gFtp').value), weight: num($('#gKg').value), height: num($('#gCm').value) });
    save(); renderRoster(); e.target.reset(); say(`Gast ${name} hinzugefügt.`, 'ok');
  });
  $('#resetRoster').addEventListener('click', () => {
    S.roster = ROSTER.map(r => ({ ...r })); S.sel = S.sel.filter(id => byId(id)); save(); renderRoster(); say('Kader zurückgesetzt.', 'ok');
  });
}

/* ---------- Rennen und Taktik ---------- */
function fillSelects() {
  const races = [['next', 'Nächstes Rennen (automatisch)'], ['next_zrl', 'Nächstes ZRL-Rennen'], ['next_wtrl', 'Nächstes WTRL-TTT'], ...upcoming().map(r => [r[0], raceName(r[0])])];
  if (!races.some(r => r[0] === S.race.race)) races.push([S.race.race, S.race.race]);
  $('#raceSel').innerHTML = races.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const worlds = [...new Set(ROUTES.map(r => r[0]))];
  $('#routeSel').innerHTML = worlds.map(w => `<optgroup label="${esc(w)}">${ROUTES.filter(r => r[0] === w).map(r => `<option value="${esc(r[1])}">${esc(r[2])}${r[3] ? ` (${fmt(r[3], 1)} km${r[4] ? ', Punkt zu Punkt' : ''})` : ''}</option>`).join('')}</optgroup>`).join('');
}
function syncRace() {
  const isRace = S.race.mode === 'race';
  $('#raceBox').hidden = !isRace; $('#routeBox').hidden = isRace;
  const r = routeById(S.race.route), li = $('#lapsIn');
  if (r) {
    li.disabled = !!r[4]; li.max = r[5] || 1;
    $('#routeInfo').textContent = r[4] ? 'Punkt-zu-Punkt-Strecke oder WTRL-Kurs: keine Runden, ganze Strecke oder Teilstück per Distanz.' : `Bis zu ${r[5]} Runden möglich (Rennen max. 200 km). Distanz statt Runden schneidet die Strecke ab.`;
  }
  const v = String(S.set.intensity);
  $('#intOut').textContent = (Number(v) > 0 ? '+' : '') + v + ' · ' + INT[v][0];
  $('#intDesc').textContent = INT[v][1];
}
function bindSettings() {
  $$('[data-s]').forEach(el => {
    const v = getPath(el.dataset.s);
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'radio') el.checked = el.value === v;
    else el.value = v ?? '';
    const ev = (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(ev, () => {
      if (el.type === 'radio' && !el.checked) return;
      setPath(el.dataset.s, el.type === 'checkbox' ? el.checked : el.value);
      save(); syncRace();
      if (el.dataset.s.startsWith('race.')) renderRoster();
    });
  });
}

/* ---------- Anfrage bauen ---------- */
function baseReq() {
  const s = S.set, q = { request_id: 'pp-' + Date.now().toString(36), include_calculator_link: true };
  if (s.team.trim()) q.team_name = s.team.trim().slice(0, 60);
  if (/^#[0-9a-f]{6}$/i.test(s.colour)) q.team_colour = s.colour;
  if (S.race.mode === 'race') q.route = S.race.race || 'next';
  else {
    const r = routeById(S.race.route); q.route = S.race.route;
    const km = num(S.race.km);
    if (km) q.distance_km = km; else if (r && !r[4]) q.laps = Math.max(1, Math.round(num(S.race.laps) || 1));
  }
  if (S.race.bike !== 'auto') q.bike = S.race.bike;
  q.intensity = Number(s.intensity);
  if (s.efficiency !== 'auto') q.efficiency = Number(s.efficiency);
  q.minimum_finishers = Number(s.finishers);
  q.min_pull_duration = num(s.minPull) ?? 30;
  q.max_pull_duration = num(s.maxPull) ?? 180;
  q.duration_interval = Number(s.step);
  q.allow_zero_pulls = !!s.zero;
  q.optimization_strategy = s.strategy;
  q.optimizer_version = s.optimizer;
  const ai = num(s.avgIf), mi = num(s.maxIf);
  if (ai) q.average_if = ai;
  if (mi) q.max_if = mi;
  const sp = num(s.speed);
  if (sp) { q.target_speed = sp; if (s.holdSpeed) q.respect_target_speed = true; }
  if (s.keepOrder) q.respect_order = true;
  q.image = s.layout ? { layout: s.layout } : {};
  return q;
}
function riderObj(r) {
  const o = S.opt[r.id] || {}, x = {};
  if (!r.guest) x.zwift_id = Number(r.id);
  x.name = String(r.name).slice(0, 60);
  const cat = o.cat || r.cat; if (cat) x.cat = cat;
  if (r.guest) { x.ftp = num(r.ftp); x.weight = num(r.weight); x.height = num(r.height); }
  else {
    if (S.set.ftpSrc === 'team' && r.zftp && r.wkg) { x.ftp = r.zftp; x.weight = Math.round(r.zftp / r.wkg * 10) / 10; }
    for (const k of ['ftp', 'weight', 'height']) { const v = num(o[k]); if (v != null) x[k] = v; }
  }
  const m = { p5: 'power_300_watts', cp: 'cp', wkj: 'wprime_kj' };
  for (const k in m) { const v = num(o[k]); if (v != null) x[m[k]] = v; }
  if (o.level) x.training_level = o.level;
  if (o.color) x.color = o.color;
  const ef = num(o.effort); if (ef != null && ef !== 1) x.effort = ef;
  const pull = num(o.pull), adj = num(o.adj);
  if (pull != null) x.pull_duration = pull;
  else { const a = num(o.pmin), b = num(o.pmax); if (a != null) x.min_pull_duration = a; if (b != null) x.max_pull_duration = b; }
  if (adj != null) x.fixed_adjustment = adj;
  else { const a = num(o.amin), b = num(o.amax); if (a != null) x.min_adjustment = a; if (b != null) x.max_adjustment = b; }
  return x;
}

/* ---------- API ---------- */
async function run(q, msg) {
  if (busy) return null;
  if (!S.key) { openKey('Bitte zuerst den API-Key eintragen oder den Team-Link öffnen.'); return null; }
  const wait = Math.ceil((coolUntil - Date.now()) / 1000);
  if (wait > 0) { say(`Bitte noch ${wait} s warten (API-Budget).`, 'err'); return null; }
  setBusy(true, msg);
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 90000);
    let res;
    try { res = await fetch(API, { method: 'POST', headers: { Authorization: 'Bearer ' + S.key, 'Content-Type': 'application/json' }, body: JSON.stringify(q), signal: ctl.signal }); }
    finally { clearTimeout(to); }
    let j = null; try { j = await res.json(); } catch (e) { /* keine JSON-Antwort */ }
    if (res.ok && j && j.success) { setBusy(false); say(`Fertig in ${fmt((j.meta?.response_time_ms || 0) / 1000, 1)} s.`, 'ok'); return j; }
    const code = j?.error || '', m = j?.message || '';
    setBusy(false);
    if (res.status === 401) say('API-Key ungültig oder fehlt. Bitte oben rechts prüfen.', 'err');
    else if (res.status === 429 || res.status === 503) {
      const s = Math.max(2, Math.ceil(j?.details?.retry_after_seconds || (res.status === 429 ? 20 : 5)));
      coolUntil = Date.now() + s * 1000;
      say(res.status === 429 ? `API-Budget für diese Minute verbraucht. In ${s} s wieder möglich.` : code === 'SERVER_BUSY' ? `Server gerade ausgelastet. In ${s} s nochmal versuchen.` : `Fahrerdaten gerade nicht abrufbar. In ${s} s nochmal versuchen.`, 'err');
    } else if (res.status === 400 || res.status === 422) say('Eingabe abgelehnt: ' + m, 'err');
    else say(`Fehler ${res.status}${code ? ' ' + code : ''}: ${m || 'unbekannt'}${j?.error_id ? ' (' + j.error_id + ')' : ''}`, 'err');
    return null;
  } catch (e) {
    setBusy(false);
    say(e.name === 'AbortError' ? 'Keine Antwort nach 90 s. Bitte erneut versuchen.' : 'Keine Verbindung zur API: ' + e.message, 'err');
    return null;
  }
}
async function optimize() {
  const R = S.sel.map(byId).filter(Boolean);
  if (R.length < 2) return say('Bitte mindestens 2 Fahrer auswählen.', 'err');
  if (R.length > 8) return say('Maximal 8 Fahrer pro Team.', 'err');
  const bad = R.find(r => r.guest && !(r.ftp && r.weight && r.height));
  if (bad) return say(`Beim Gast ${bad.name} fehlen FTP, Gewicht oder Größe.`, 'err');
  const q = baseReq(), zr = R.filter(r => !r.guest), gu = R.filter(r => r.guest);
  if (zr.length) q.riders = zr.map(riderObj);
  if (gu.length) q.custom_riders = gu.map(riderObj);
  if ([...(q.riders || []), ...(q.custom_riders || [])].some(x => x.pull_duration === 0)) q.allow_zero_pulls = true;
  const j = await run(q, 'Optimiere …');
  if (j) setPlan({ at: Date.now(), req: q, data: j.data });
}
function evalReq(rows, speed, base) {
  const strip = o => { const c = { ...o }; ['fixed_adjustment', 'min_adjustment', 'max_adjustment', 'min_pull_duration', 'max_pull_duration'].forEach(k => delete c[k]); return c; };
  const q = { ...base, request_id: 'pp-' + Date.now().toString(36), evaluate_only: true, target_speed: speed, min_pull_duration: 10, max_pull_duration: 600 };
  delete q.riders; delete q.custom_riders; delete q.respect_target_speed; delete q.respect_order;
  const rr = [], cr = [];
  for (const row of rows) {
    if (typeof row.key === 'number') rr.push({ ...strip((base.riders || []).find(x => x.zwift_id === row.key) || { zwift_id: row.key }), adjustment: row.adj, pull_duration: row.pull });
    else { const n = parseInt(String(row.key).split('_')[1], 10); cr.push({ ...strip((base.custom_riders || [])[n - 1] || {}), adjustment: row.adj, pull_duration: row.pull }); }
  }
  if (rr.length) q.riders = rr;
  if (cr.length) q.custom_riders = cr;
  if (rows.some(r => r.pull === 0)) q.allow_zero_pulls = true;
  return q;
}
const planRows = d => d.riders.slice().sort((a, b) => a.order - b.order).map(x => ({ key: x.zwift_id, name: x.name, color: x.color, pull: x.pull_duration, adj: x.adjustment }));
async function evaluate() {
  const p = S.last; if (!p || !ed) return;
  const step = p.req.duration_interval || 15;
  for (const r of ed.rows) {
    if (!Number.isFinite(r.pull) || r.pull < 0 || r.pull > 600 || (r.pull !== 0 && (r.pull < 10 || r.pull % step))) return say(`${r.name}: Zugzeit muss 0 oder 10–600 s im ${step}-s-Raster sein.`, 'err');
    if (!Number.isFinite(r.adj) || r.adj < 50 || r.adj > 150) return say(`${r.name}: Anpassung muss zwischen 50 und 150 % liegen.`, 'err');
  }
  const sp = num(ed.speed);
  if (!sp || sp < 15 || sp > 70) return say('Zieltempo muss zwischen 15 und 70 km/h liegen.', 'err');
  const q = evalReq(ed.rows, sp, p.req);
  const j = await run(q, 'Bewerte Plan …');
  if (j) { ed = null; setPlan({ at: Date.now(), req: q, data: j.data, evaluated: true }); }
}
async function makeImage() {
  const p = S.last; if (!p) return;
  const q = evalReq(planRows(p.data), num(p.data.target_speed), p.req);
  q.image = S.set.layout ? { layout: S.set.layout } : {};
  const j = await run(q, 'Erzeuge Bild …');
  if (j && j.data.image_url) {
    Object.assign(p.data, { image_url: j.data.image_url, image_width: j.data.image_width, image_height: j.data.image_height });
    if (j.data.calculator_url) p.data.calculator_url = j.data.calculator_url;
    save(); renderResult(); say('Bild erstellt.', 'ok');
  } else if (j) say('Die API hat kein Bild geliefert.', 'err');
}
function setPlan(p) {
  S.last = p; ed = null; save();
  if (shared) { shared = null; $('#shared').hidden = true; $('#planner').after($('#result')); }
  renderResult();
  $('#result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

/* ---------- Ergebnis ---------- */
function raceLabel(d) {
  if (d.race_id && /^(zrl|ttt)-\d{4}-\d\d-\d\d$/.test(d.race_id)) {
    const dt = new Date(d.race_id.slice(4) + 'T12:00:00');
    return `${d.race_id.startsWith('zrl') ? 'ZRL' : 'WTRL'} ${WD[dt.getDay()]} ${dt.getDate()}.${dt.getMonth() + 1}.`;
  }
  return 'Freie Strecke';
}
function fatTxt(x) {
  const f = x.fatigue || {};
  let t, c = '';
  if (f.will_drop) { t = `Reißt ab${f.drop_distance_km != null ? ' bei km ' + fmt(f.drop_distance_km, 1) : ''}`; c = 'bad'; }
  else if (f.will_skip) { t = `Lässt ${f.skipped_turns || 'einige'} Züge aus${f.skip_distance_km != null ? ' ab km ' + fmt(f.skip_distance_km, 1) : ''}`; c = 'mid'; }
  else t = `${f.pulls_taken ?? '–'} Züge · Reserve min. ${fmt(f.min_reserve_percent, 0)} %`;
  if (x.effort_outcome) t += ` · Effort ${OUT[x.effort_outcome] || x.effort_outcome}`;
  return [t, c];
}
function tableHTML(d) {
  const byKey = new Map(d.riders.map(x => [String(x.zwift_id), x]));
  const list = ed ? ed.rows.map(r => ({ row: r, x: byKey.get(String(r.key)) })) : d.riders.slice().sort((a, b) => a.order - b.order).map(x => ({ x }));
  const step = S.last?.req?.duration_interval || 15;
  const o = ed ? '' : ' opt';
  const body = list.map(({ row, x }, i) => {
    const [st, sc] = fatTxt(x);
    const ifHi = x.if_limit_percent != null && x.if_percent > x.if_limit_percent;
    const eff = x.effort && x.effort !== 1 ? `<span class="badge">Effort ${String(x.effort).replace('.', ',')}</span>` : '';
    const mv = ed ? `<span class="mv"><button class="ib" type="button" data-mv="-1" data-i="${i}" aria-label="${esc(x.name)} nach vorn">${ICON.up}</button><button class="ib" type="button" data-mv="1" data-i="${i}" aria-label="${esc(x.name)} nach hinten">${ICON.down}</button></span>` : '';
    return `<tr>
      <td class="n">${i + 1}</td>
      <td class="nmc"><span class="dot" style="--c:${esc(x.color || '#999')}"></span><span class="nm">${esc(x.name)}</span>${x.cat ? `<span class="badge">${esc(x.cat)}</span>` : ''}${eff}<span class="ftp">FTP ${fmt(x.ftp)} W · ${fmt(x.wkg, 2)} W/kg</span>${mv}</td>
      <td class="big" data-l="Zug">${ed ? `<input type="number" data-ed="pull" data-i="${i}" value="${row.pull}" min="0" max="600" step="${step}" aria-label="Zugzeit ${esc(x.name)} in s">` : `${x.pull_duration} s`}</td>
      <td class="big" data-l="Zugleistung">${fmt(x.pull_power)} W</td>
      <td data-l="W/kg">${fmt(x.pull_power_wkg, 2)}</td>
      <td class="opt" data-l="% FTP">${fmt(x.pull_ftp_percent)} %</td>
      <td class="opt" data-l="Zugtempo">${fmt(x.pull_speed, 1)} km/h</td>
      <td class="${o}" data-l="Anpassung">${ed ? `<input type="number" data-ed="adj" data-i="${i}" value="${row.adj}" min="50" max="150" step="1" aria-label="Anpassung ${esc(x.name)} in %">` : `${fmt(x.adjustment)} %`}</td>
      <td class="opt" data-l="Ø Leistung">${fmt(x.avg_power)} W</td>
      <td data-l="IF"${ifHi ? ' class="warnc"' : ''} title="Limit ${fmt(x.if_limit_percent, 1)} %">${fmt(x.if_percent, 1)} %</td>
      <td class="wide" data-l="Windschatten 2./3./4.">${(x.wheel_powers || []).map(w => fmt(w)).join(' / ')} W</td>
      <td class="st ${sc}" data-l="Status">${esc(st)}</td></tr>`;
  }).join('');
  return `<div class="scroll"><table class="stack"><thead><tr><th>#</th><th>Fahrer</th><th>Zug</th><th>Zugleistung</th><th>W/kg</th><th>% FTP</th><th>Zugtempo</th><th>Anpassung</th><th>Ø Leistung</th><th>IF</th><th>Windschatten 2./3./4.</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></div>`;
}
function factsHTML(p) {
  const d = p.data, s = d.settings || {}, f = d.fatigue || {}, fr = d.finish_requirement || {}, cd = d.constraint_detail || {};
  const surf = (d.surfaces || []).map(x => `${fmt(x.km, 1)} km ${SURF[x.surface] || x.surface}`).join(', ') || 'Asphalt';
  const bike = d.bike ? `${d.bike.default === 'climb' ? 'Kletterrad' : 'Zeitfahrrad'}${(d.bike.swaps || []).map(w => `, ab km ${fmt(w.at_km, 1)} ${w.to === 'climb' ? 'Kletterrad' : 'Zeitfahrrad'}`).join('')}` : '–';
  const iv = String(s.intensity ?? '');
  const rows = [
    ['Strecke', `${esc(d.route)} · ${fmt(d.distance_km, 1)} km · ${fmt(d.elevation_m)} Hm${d.laps ? ` · ${d.laps} ${d.laps === 1 ? 'Runde' : 'Runden'}` : ''}${d.point_to_point ? ' · Punkt zu Punkt' : ''}`],
    ['Belag und Rad', `${esc(surf)} · ${esc(bike)}`],
    ['Intensität', INT[iv] ? `${iv} · ${INT[iv][0]}` : esc(s.intensity_label || '–')],
    ['Team-Effizienz', `${esc(EFFLBL[s.efficiency_label] || s.efficiency_label || '–')}${s.efficiency_auto ? ' (automatisch)' : ''}`],
    ['Tempo begrenzt durch', `${esc(BIND[d.binding_constraint] || d.binding_constraint || '–')}${cd.label && d.binding_constraint !== 'evaluate_only' ? `<br><small>${esc(cd.label)}</small>` : ''}`],
    ['Team im Ziel', `${f.survivors_count ?? '–'} von ${d.riders.length} · ${f.predicted_drop_count || 0} Abhänger, ${f.predicted_skip_count || 0} lassen Züge aus${f.best_rider_to_protect ? `<br><small>Schützen: ${esc(f.best_rider_to_protect)}</small>` : ''}`],
    ['Finisher-Vorgabe', `${esc(FIN[fr.status] || fr.status || '–')}${fr.timing_count ? ` · Zeit nach dem ${fr.timing_count}. Fahrer` : ''}`],
    ['Plan', `${p.evaluated ? 'Von Hand bearbeitet und bewertet' : `Optimiert (${s.optimization_strategy === 'fixed' ? 'gleichmäßig' : 'variabel'}, ${esc(s.optimizer_version || 'v2')})`} · ${new Date(p.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}`]
  ];
  return `<dl class="facts">${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
}
function warnsHTML(d, evaluated) {
  const w = (d.warnings || []).filter(x => !(evaluated && x.type === 'CONSTRAINT_AT_LIMIT'));
  if (!w.length) return '<p class="hint">Keine Warnungen.</p>';
  const order = { warning: 0, info: 2 };
  return `<ul class="warns">${w.slice().sort((a, b) => (order[a.severity] ?? 1) - (order[b.severity] ?? 1)).map(x => {
    const t = WARN[x.type] || (String(x.type).startsWith('FINISH_REQUIREMENT') ? 'Finisher-Vorgabe' : x.type);
    return `<li class="${esc(x.severity || '')}"><b>${x.rider_name ? esc(x.rider_name) + ': ' : ''}${esc(t)}</b><small>${esc(x.message || '')}</small></li>`;
  }).join('')}</ul>`;
}
function renderResult() {
  const box = $('#result');
  const p = shared || S.last;
  if (!p || !p.data) {
    box.innerHTML = '<div class="empty"><b>Noch kein Plan</b>Wähle 2 bis 8 Fahrer, stell Rennen und Taktik ein und drück auf Optimieren.</div>';
    return;
  }
  const d = p.data, ro = !!shared;
  const fr = d.finish_requirement || {};
  const surf = (d.surfaces || []).length ? ' · ' + d.surfaces.map(x => `${fmt(x.km, 1)} km ${SURF[x.surface] || x.surface}`).join(', ') : '';
  const tools = ro ? `
      ${d.calculator_url ? `<a class="btn" href="${esc(d.calculator_url)}" target="_blank" rel="noopener">Im ZwiftGopher-Rechner öffnen</a>` : ''}
      <button class="btn" type="button" data-t="text">Text kopieren</button>
      ${navigator.share ? '<button class="btn" type="button" data-t="share">Teilen</button>' : ''}`
    : ed ? '' : `
      <button class="btn primary" type="button" data-t="edit">Plan bearbeiten</button>
      ${d.calculator_url ? `<a class="btn" href="${esc(d.calculator_url)}" target="_blank" rel="noopener">Im ZwiftGopher-Rechner öffnen</a>` : ''}
      <button class="btn" type="button" data-t="link">Plan-Link kopieren</button>
      <button class="btn" type="button" data-t="text">Text kopieren</button>
      ${navigator.share ? '<button class="btn" type="button" data-t="share">Teilen</button>' : ''}
      <button class="btn" type="button" data-t="json">JSON kopieren</button>`;
  const edbar = ed ? `<div class="edbar">
      <label>Zieltempo (km/h)<input type="number" id="edSpeed" value="${esc(ed.speed)}" min="15" max="70" step="0.1"></label>
      <button class="btn primary" type="button" data-t="eval" data-need-api>Neu bewerten <small>· 1 Einheit</small></button>
      <button class="btn ghost" type="button" data-t="cancel">Abbrechen</button>
      <p class="hint" style="flex-basis:100%;margin:0">Zugzeiten, Anpassungen und Reihenfolge ändern, dann neu bewerten. Werte in der Tabelle sind bis dahin die alten.${(d.riders || []).some(x => typeof x.zwift_id !== 'number') ? ' Gäste stehen bei der Bewertung hinter den Teamfahrern.' : ''}</p>
    </div>` : '';
  box.innerHTML = `<article class="plan">
    <div class="hero">
      <div class="t">${esc(d.estimated_time_formatted)}<small>Zielzeit${fr.timing_count ? ` (${fr.timing_count}. Fahrer)` : ''}</small></div>
      <div class="kpis">
        <div class="kpi"><b>${fmt(num(d.target_speed), 1)} km/h</b><span>Zieltempo</span></div>
        <div class="kpi"><b>${fmt(d.estimated_avg_speed, 1)} km/h</b><span>Ø Tempo</span></div>
        <div class="kpi"><b>${fmt(d.team_avg_power)} W</b><span>Ø Leistung</span></div>
        <div class="kpi"><b>${fmt(d.team_avg_if, 1)} %</b><span>Ø IF</span></div>
      </div>
      <div class="rt"><b>${esc(raceLabel(d))} · ${esc(d.route)}</b> · ${fmt(d.distance_km, 1)} km · ${fmt(d.elevation_m)} Hm${esc(surf)} · ${esc(p.req?.team_name || p.team || '')}</div>
    </div>
    <div class="pbody">
      <div class="toolbar">${tools}<span class="sp"></span></div>
      <p class="status status-out" role="status" aria-live="polite"></p>
      ${edbar}
      ${tableHTML(d)}
      <div class="twocol">
        <div class="sec"><h3>W′-Reserve über die Strecke</h3><div class="fig" id="fig"><svg role="img" aria-label="Verlauf der anaeroben Reserve je Fahrer über die Strecke"></svg></div><div class="legend" id="legend"></div></div>
        <div class="sec"><h3>Warnungen</h3>${warnsHTML(d, p.evaluated || d.binding_constraint === 'evaluate_only')}</div>
      </div>
      <div class="twocol">
        <div class="sec"><h3>Details</h3>${factsHTML(p)}</div>
        <div class="sec img"><h3>Bild für den Team-Chat</h3>${d.image_url ? `<a href="${esc(d.image_url)}" target="_blank" rel="noopener"><img src="${esc(d.image_url)}" alt="Zugplan als Bild" width="${d.image_width || ''}" height="${d.image_height || ''}" loading="lazy"></a><p class="hint">Antippen öffnet das Bild in voller Größe (7 Tage gültig).</p>` : '<p class="hint">Noch kein Bild.</p>'}
          ${ro ? '' : `<div class="toolbar"><button class="btn" type="button" data-t="img" data-need-api>Bild neu erzeugen <small>· 1 Einheit</small></button><span class="hint" style="margin:0">Layout unter Taktik → Erweitert</span></div>`}
        </div>
      </div>
    </div></article>`;
  drawChart(d);
}
let obs = null;
function drawChart(d) {
  const fig = $('#fig'); if (!fig) return;
  const svg = fig.querySelector('svg'), lg = $('#legend');
  const sm = d.fatigue?.trace?.samples || [];
  if (!sm.length) { fig.innerHTML = '<p class="hint">Kein Verlauf in der Antwort.</p>'; return; }
  const riders = d.riders.slice().sort((a, b) => a.order - b.order);
  lg.innerHTML = riders.map(x => `<span><span class="dot" style="--c:${esc(x.color || '#999')}"></span>${esc(x.name)} · min. ${fmt(x.fatigue?.min_reserve_percent, 0)} %</span>`).join('');
  const draw = () => {
    const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
    const L = 40, R = 10, T = 10, B = 46, pw = W - L - R, ph = H - T - B;
    const maxKm = sm[sm.length - 1].dist_km || d.distance_km || 1;
    let lo = 100;
    for (const p of sm) for (const v of Object.values(p.riders || {})) lo = Math.min(lo, v);
    const y0 = Math.max(0, Math.min(50, Math.floor((lo - 5) / 10) * 10));
    const x = k => L + (k / maxKm) * pw, y = v => T + (1 - (Math.max(y0, Math.min(100, v)) - y0) / (100 - y0)) * ph;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ink').trim(), mut = css.getPropertyValue('--mut').trim(), line = css.getPropertyValue('--line').trim();
    let s = '';
    const yst = (100 - y0) > 50 ? 25 : 10;
    for (let v = y0; v <= 100; v += yst) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${line}" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="${mut}">${v} %</text>`;
    const stepKm = maxKm > 40 ? 10 : W < 520 ? 10 : 5;
    for (let k = 0; k <= maxKm + 0.01; k += stepKm) s += `<text x="${x(k)}" y="${H - 6}" text-anchor="middle" font-size="12" fill="${mut}">${k} km</text>`;
    const gy = T + ph + 6, gh = 14;
    sm.forEach((p, i) => {
      const k0 = i ? (sm[i - 1].dist_km + p.dist_km) / 2 : 0, k1 = i < sm.length - 1 ? (p.dist_km + sm[i + 1].dist_km) / 2 : maxKm;
      const g = p.gradient ?? 0, c = g >= 4 ? '#c23a2c' : g >= 2 ? '#e08a2a' : g <= -2 ? '#2f8fd1' : '#9aa8a3';
      s += `<rect x="${x(k0)}" y="${gy}" width="${Math.max(1, x(k1) - x(k0))}" height="${gh}" fill="${c}" opacity=".85"><title>km ${fmt(p.dist_km, 1)}: ${fmt(g, 1)} %</title></rect>`;
    });
    for (const r of riders) {
      const id = String(r.zwift_id);
      const pts = sm.filter(p => p.riders && p.riders[id] != null).map(p => `${x(p.dist_km).toFixed(1)},${y(p.riders[id]).toFixed(1)}`).join(' ');
      if (!pts) continue;
      s += `<polyline points="${pts}" fill="none" stroke="${ink}" stroke-opacity=".28" stroke-width="4.5" stroke-linejoin="round"/>`;
      s += `<polyline points="${pts}" fill="none" stroke="${esc(r.color || '#888')}" stroke-width="2.5" stroke-linejoin="round"><title>${esc(r.name)}</title></polyline>`;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = s;
  };
  if (obs) obs.disconnect();
  obs = new ResizeObserver(draw); obs.observe(svg);
  draw();
}
function bindResult() {
  const box = $('#result');
  box.addEventListener('click', e => {
    const mvb = e.target.closest('[data-mv]');
    if (mvb && ed) {
      const i = +mvb.dataset.i, j = i + Number(mvb.dataset.mv);
      if (j < 0 || j >= ed.rows.length) return;
      [ed.rows[i], ed.rows[j]] = [ed.rows[j], ed.rows[i]]; renderResult();
      const nb = $(`[data-mv="${mvb.dataset.mv}"][data-i="${j}"]`); if (nb) nb.focus();
      return;
    }
    const b = e.target.closest('[data-t]'); if (!b) return;
    const t = b.dataset.t, p = shared || S.last;
    if (t === 'edit') { ed = { speed: p.data.target_speed, rows: planRows(p.data) }; renderResult(); }
    else if (t === 'cancel') { ed = null; renderResult(); }
    else if (t === 'eval') evaluate();
    else if (t === 'img') makeImage();
    else if (t === 'text') copy(planText(p), 'Text kopiert. Einfach in den Team-Chat einfügen.');
    else if (t === 'json') copy(JSON.stringify({ request: p.req, data: p.data }, null, 2), 'JSON kopiert.');
    else if (t === 'link') copy(planLink(p), 'Plan-Link kopiert. Jeder sieht damit genau diesen Plan, ohne Key.');
    else if (t === 'share') sharePlan(p);
  });
  box.addEventListener('input', e => {
    const el = e.target; if (!ed) return;
    if (el.id === 'edSpeed') ed.speed = el.value;
    else if (el.dataset.ed) ed.rows[+el.dataset.i][el.dataset.ed] = num(el.value);
  });
}

/* ---------- Teilen ---------- */
function planText(p) {
  const d = p.data, rs = d.riders.slice().sort((a, b) => a.order - b.order);
  const L = [];
  L.push(`${p.req?.team_name || p.team || 'Team'} · TTT ${raceLabel(d)} · ${d.route}`);
  L.push(`${fmt(d.distance_km, 1)} km · ${fmt(d.elevation_m)} Hm · Zieltempo ${fmt(num(d.target_speed), 1)} km/h · Zielzeit ${d.estimated_time_formatted} · Ø ${fmt(d.team_avg_power)} W`);
  L.push('');
  L.push('Reihenfolge · Zug · Zugleistung · Windschatten 2./3./4.');
  for (const x of rs) {
    const f = x.fatigue || {};
    const st = f.will_drop ? ` · reißt ab${f.drop_distance_km != null ? ' bei km ' + fmt(f.drop_distance_km, 1) : ''}` : f.will_skip ? ` · lässt ${f.skipped_turns || 'einige'} Züge aus` : '';
    L.push(`${x.order}. ${x.name}: ${x.pull_duration} s @ ${fmt(x.pull_power)} W (${fmt(x.pull_power_wkg, 2)} W/kg) · ${(x.wheel_powers || []).map(w => fmt(w)).join('/')} W${st}`);
  }
  const w = (d.warnings || []).filter(x => x.severity === 'warning' && !(x.type === 'CONSTRAINT_AT_LIMIT' && d.binding_constraint === 'evaluate_only'));
  if (w.length) { L.push(''); w.forEach(x => L.push(`Achtung ${x.rider_name ? x.rider_name + ': ' : ''}${WARN[x.type] || x.type}`)); }
  if (d.calculator_url) { L.push(''); L.push('Im Rechner: ' + d.calculator_url); }
  return L.join('\n');
}
const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
function slim(p) {
  const d = JSON.parse(JSON.stringify(p.data));
  const tr = d.fatigue?.trace;
  if (tr?.samples?.length) {
    const s = tr.samples, st = Math.ceil(s.length / 45);
    tr.samples = s.filter((_, i) => i % st === 0 || i === s.length - 1).map(o => ({ dist_km: Math.round(o.dist_km * 100) / 100, gradient: o.gradient, riders: Object.fromEntries(Object.entries(o.riders || {}).map(([k, v]) => [k, Math.round(v)])) }));
  }
  if (d.fatigue) delete d.fatigue.note;
  if (d.constraint_detail) { delete d.constraint_detail.guard; delete d.constraint_detail.effort; }
  if (d.settings) delete d.settings.intensity_description;
  d.riders.forEach(x => { ['wheel_ftp_percents', 'speed_index_source', 'cp_source', 'wprime_source', 'wprime_confidence'].forEach(k => delete x[k]); });
  return { at: p.at, team: p.req?.team_name || '', evaluated: !!p.evaluated, data: d };
}
async function planLink(p) {
  const json = JSON.stringify(slim(p));
  let tok;
  if ('CompressionStream' in window) {
    const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    tok = 'z' + b64u(new Uint8Array(buf));
  } else tok = 'j' + b64u(new TextEncoder().encode(json));
  return location.origin + location.pathname + '#plan=' + tok;
}
async function readPlan(tok) {
  const bytes = unb64u(tok.slice(1));
  let txt;
  if (tok[0] === 'z') txt = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  else txt = new TextDecoder().decode(bytes);
  return JSON.parse(txt);
}
async function sharePlan(p) {
  try {
    const url = shared ? location.href : await planLink(p);
    await navigator.share({ title: 'TTT-Plan', text: planText(p).split('\nIm Rechner:')[0], url });
  } catch (e) { if (e.name !== 'AbortError') say('Teilen nicht möglich: ' + e.message, 'err'); }
}
async function copy(t, ok) {
  /* t darf ein Text oder ein Promise auf einen Text sein (Safari braucht dafür ClipboardItem) */
  try {
    if (typeof t !== 'string' && window.ClipboardItem && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': Promise.resolve(t).then(x => new Blob([x], { type: 'text/plain' })) })]);
      return say(ok, 'ok');
    }
    const txt = await t;
    await navigator.clipboard.writeText(txt); say(ok, 'ok');
  } catch (e) {
    const txt = await t;
    const ta = document.createElement('textarea');
    ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(ta); ta.select();
    let done = false; try { done = document.execCommand('copy'); } catch (_) { /* nicht unterstützt */ }
    ta.remove(); say(done ? ok : 'Kopieren nicht möglich.', done ? 'ok' : 'err');
  }
}
function showShared() {
  const b = $('#shared');
  $('#planner').before($('#result'));
  b.hidden = false;
  b.innerHTML = `<div class="wrap"><span><b>Geteilter Plan</b> vom ${new Date(shared.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}${shared.team ? ' · ' + esc(shared.team) : ''}. So hat ihn der Captain gerechnet.</span><button class="btn" type="button" id="leaveShared">Eigenen Plan rechnen</button></div>`;
  $('#leaveShared').addEventListener('click', () => { shared = null; b.hidden = true; $('#planner').after($('#result')); history.replaceState(null, '', location.pathname + location.search); renderResult(); $('#planner').scrollIntoView(); });
}

/* ---------- Key ---------- */
function openKey(msg) {
  const d = $('#keyDlg');
  $('#keyIn').value = S.key; $('#keyMsg').textContent = msg || ''; $('#keyMsg').className = 'status' + (msg ? ' err' : '');
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
}
function bindKey() {
  $('#keyBtn').addEventListener('click', () => openKey());
  $('#keyShow').addEventListener('change', e => { $('#keyIn').type = e.target.checked ? 'text' : 'password'; });
  $('#keyForm').addEventListener('submit', e => {
    if (e.submitter && e.submitter.value === 'save') {
      const k = $('#keyIn').value.trim();
      if (k && !/^sk_(live|test)_[A-Za-z0-9]+$/.test(k)) { e.preventDefault(); $('#keyMsg').textContent = 'Das sieht nicht wie ein Key aus (sk_live_…).'; $('#keyMsg').className = 'status err'; return; }
      S.key = k; save(); renderTop(); say(k ? 'API-Key gespeichert.' : 'API-Key entfernt.', 'ok');
    }
  });
  $('#teamLink').addEventListener('click', () => {
    const k = $('#keyIn').value.trim() || S.key;
    if (!k) { $('#keyMsg').textContent = 'Erst einen Key eintragen.'; $('#keyMsg').className = 'status err'; return; }
    const u = location.origin + location.pathname + '#key=' + encodeURIComponent(k);
    navigator.clipboard.writeText(u).then(() => { $('#keyMsg').textContent = 'Team-Link kopiert. Nur im Team teilen, er enthält den Key.'; $('#keyMsg').className = 'status ok'; })
      .catch(() => { $('#keyIn').type = 'text'; $('#keyIn').value = u; $('#keyIn').select(); $('#keyMsg').textContent = 'Link steht im Feld, bitte selbst kopieren.'; $('#keyMsg').className = 'status'; });
  });
  $('#keyDel').addEventListener('click', () => { S.key = ''; $('#keyIn').value = ''; save(); renderTop(); $('#keyMsg').textContent = 'Key entfernt.'; $('#keyMsg').className = 'status'; });
}

/* ---------- Start ---------- */
async function init() {
  $('#status').classList.add('status-out');
  const hp = new URLSearchParams(location.hash.slice(1));
  const k = hp.get('key');
  if (k && /^sk_(live|test)_[A-Za-z0-9]+$/.test(k.trim())) {
    S.key = k.trim(); save();
    history.replaceState(null, '', location.pathname + location.search);
  }
  fillSelects(); bindSettings(); syncRace(); renderTop(); renderRoster();
  bindRoster(); bindResult(); bindKey();
  $('#optBtn').addEventListener('click', optimize);
  setBusy(false);
  const pt = hp.get('plan');
  if (pt) {
    try { shared = await readPlan(pt); showShared(); }
    catch (e) { shared = null; say('Der geteilte Plan-Link ist unvollständig oder beschädigt.', 'err'); }
  }
  renderResult();
  if (k) say('API-Key übernommen. Du kannst direkt rechnen.', 'ok');
  if (shared) $('#shared').scrollIntoView();
}
init();
}
