// ═══════════════════════════════════════════
//  COINHUB — GAMES.JS  (ähli 9 oýun)
// ═══════════════════════════════════════════

// ─── BET HELPER ─────────────────────────────
function betBox(id, def) {
  def = def || 100;
  const max = window.S && S.user ? S.user.coins : 10000;
  return `<div class="bet-box">
    <div class="bet-lbl">Goýum möçberi (5 – 10 000 TMT)</div>
    <input class="bet-inp" id="bet-${id}" type="number" value="${Math.min(def, max)}" min="5" max="10000">
    <div class="chips">
      <span class="chip" onclick="setb('${id}',25)">25</span>
      <span class="chip" onclick="setb('${id}',50)">50</span>
      <span class="chip" onclick="setb('${id}',100)">100</span>
      <span class="chip" onclick="setb('${id}',500)">500</span>
      <span class="chip" onclick="setb('${id}',1000)">1K</span>
      <span class="chip" onclick="setb('${id}',5000)">5K</span>
      <span class="chip" onclick="setb('${id}',Math.floor(S.user.coins/2))">½</span>
      <span class="chip" onclick="setb('${id}',S.user.coins)">MAX</span>
    </div>
  </div>`;
}
function setb(id, v) {
  const el = document.getElementById('bet-' + id);
  if (el) el.value = Math.max(5, Math.min(10000, v));
}
function getBet(id) {
  const el = document.getElementById('bet-' + id);
  const n = parseInt(el ? el.value : 100, 10) || 5;
  return Math.max(5, Math.min(10000, n));
}
function chkBal(bet) {
  if (!S.user || S.user.coins < bet) { toast('Balansyňyz ýetmez!'); return false; }
  return true;
}
function gResult(id, html) {
  const el = document.getElementById(id);
  if (el) { el.innerHTML = html; el.style.display = 'block'; }
}
function updBal() {
  const c = S.user ? S.user.coins.toLocaleString() : '0';
  document.querySelectorAll('.hdr-bal,.bal-inline,.g-bal').forEach(el => {
    el.textContent = '💰 ' + c + ' TMT';
  });
}

// ═══════════════════════════════════════════
//  1. SLOT MAŞYN
// ═══════════════════════════════════════════
const SYMS  = ['🍒','🍋','🍊','🍇','⭐','7️⃣','💎','🎰'];
const SMULS = { '🍒':2,'🍋':3,'🍊':4,'🍇':5,'⭐':8,'7️⃣':15,'💎':30,'🎰':150 };
let slotBusy = false;

function renderSlot() {
  return `
    ${betBox('slot', 100)}
    <div class="reels">
      <div class="reel" id="r0">🍒</div>
      <div class="reel" id="r1">🍋</div>
      <div class="reel" id="r2">🍊</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;font-size:11px;color:var(--muted)">
      Üçisi deň = jackpot! | Ikisi deň = 1.5× | Üçüsi dürli = ýeňiliş
    </div>
    <div id="sres" style="display:none"></div>
    <button class="btn btn-gold w100" id="sbtn" onclick="doSlot()">🎰 AÝLANMAK</button>`;
}

function doSlot() {
  if (slotBusy) return;
  const bet = getBet('slot');
  if (!chkBal(bet)) return;
  slotBusy = true;
  document.getElementById('sbtn').disabled = true;
  document.getElementById('sres').style.display = 'none';

  const reels = [0,1,2].map(i => document.getElementById('r' + i));
  reels.forEach(r => r.classList.add('spin'));

  let f = SYMS.map(() => SYMS[Math.floor(Math.random() * SYMS.length)]);
  // house edge ~30%
  if (Math.random() > 0.22) {
    let tries = 0;
    while (f[0] === f[1] && f[1] === f[2] && tries++ < 20)
      f[2] = SYMS[Math.floor(Math.random() * SYMS.length)];
  }

  setTimeout(() => {
    reels.forEach((r, i) => { r.classList.remove('spin'); r.textContent = f[i]; });

    let mult = 0, label = '';
    if (f[0] === f[1] && f[1] === f[2]) {
      mult = SMULS[f[0]] || 2;
      label = `${f.join('')} — Jackpot ${mult}×!`;
    } else if (f[0] === f[1] || f[1] === f[2] || f[0] === f[2]) {
      mult = 1.5;
      label = `Ikisi deň — 1.5×`;
    }

    if (mult > 1) {
      const net = Math.round(bet * mult) - bet;
      addTx(`Slot: ${f.join('')} ×${mult}`, net, 'game_slot');
      gResult('sres', `<div class="res res-w"><div class="res-big w">+${net.toLocaleString()} TMT</div><div class="res-msg">${label}</div></div>`);
    } else {
      addTx(`Slot: ${f.join('')}`, -bet, 'game_slot');
      gResult('sres', `<div class="res res-l"><div class="res-big l">-${bet.toLocaleString()} TMT</div><div class="res-msg">Bagtyňyz ýokdy...</div></div>`);
    }
    updBal(); slotBusy = false;
    document.getElementById('sbtn').disabled = false;
  }, 1400);
}

// ═══════════════════════════════════════════
//  2. BAGT ÇARHY (WHEEL)
// ═══════════════════════════════════════════
const WSEGS = [
  {l:'0×',m:0,c:'#dc2626'}, {l:'2×',m:2,c:'#1d4ed8'},
  {l:'0×',m:0,c:'#dc2626'}, {l:'1.5×',m:1.5,c:'#15803d'},
  {l:'0×',m:0,c:'#dc2626'}, {l:'3×',m:3,c:'#7c3aed'},
  {l:'1.5×',m:1.5,c:'#15803d'},{l:'0×',m:0,c:'#dc2626'},
  {l:'5×',m:5,c:'#D4AF37'}, {l:'0×',m:0,c:'#dc2626'},
  {l:'10×',m:10,c:'#D4AF37'},{l:'1.5×',m:1.5,c:'#15803d'},
];
let wAngle = 0, wBusy = false;

function renderWheel() {
  return `
    ${betBox('wheel', 100)}
    <div class="wheel-wrap">
      <div class="wheel-ptr">▼</div>
      <canvas class="wheel-c" id="wc" width="280" height="280"></canvas>
    </div>
    <div id="wres" style="display:none"></div>
    <button class="btn btn-gold w100" id="wbtn" onclick="doWheel()">🎡 AÝLANMAK</button>`;
}

function drawWheel(a) {
  const cv = document.getElementById('wc');
  if (!cv) return;
  const ctx = cv.getContext('2d'), cx = 140, cy = 140, r = 132, n = WSEGS.length, arc = 2 * Math.PI / n;
  ctx.clearRect(0, 0, 280, 280);
  WSEGS.forEach((s, i) => {
    const st = a + i * arc - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, st, st + arc);
    ctx.fillStyle = s.c; ctx.fill();
    ctx.strokeStyle = '#0a0a0f'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(st + arc / 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 3;
    ctx.fillText(s.l, r * 0.66, 5); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  g.addColorStop(0, '#fff8dc'); g.addColorStop(1, '#D4AF37');
  ctx.fillStyle = g; ctx.fill();
}

function doWheel() {
  if (wBusy) return;
  const bet = getBet('wheel');
  if (!chkBal(bet)) return;
  wBusy = true;
  document.getElementById('wbtn').disabled = true;
  document.getElementById('wres').style.display = 'none';

  const n = WSEGS.length, arc = 2 * Math.PI / n;
  const idx = Math.floor(Math.random() * n);
  const target = wAngle + Math.PI * 10 - idx * arc;
  const t0 = Date.now(), dur = 3400, s0 = wAngle;

  (function fr() {
    const t = Math.min(1, (Date.now() - t0) / dur);
    const e = 1 - Math.pow(1 - t, 4);
    wAngle = s0 + (target - s0) * e;
    drawWheel(wAngle);
    if (t < 1) { requestAnimationFrame(fr); return; }
    wBusy = false;
    document.getElementById('wbtn').disabled = false;
    const seg = WSEGS[idx];
    if (seg.m > 1) {
      const net = Math.round(bet * seg.m) - bet;
      addTx(`Çarhy: ${seg.l}`, net, 'game_spin');
      gResult('wres', `<div class="res res-w"><div class="res-big w">+${net.toLocaleString()} TMT</div><div class="res-msg">${seg.l} — Ýeňiş!</div></div>`);
    } else {
      addTx(`Çarhy: ${seg.l}`, -bet, 'game_spin');
      gResult('wres', `<div class="res res-l"><div class="res-big l">-${bet.toLocaleString()} TMT</div><div class="res-msg">0× — Bagtyňyz ýokdy</div></div>`);
    }
    updBal();
  })();
}

// ═══════════════════════════════════════════
//  3. BAGT GUTUSY (BOXES)
// ═══════════════════════════════════════════
let bPrizes = [], bBet = 0, bActive = false;

function renderBoxes() {
  return `
    ${betBox('boxes', 100)}
    <div class="boxes-grid" id="bxg">
      ${Array.from({length:9},(_,i)=>`<div class="box" id="bx${i}" onclick="openBox(${i})">🎁</div>`).join('')}
    </div>
    <div id="bres" style="display:none"></div>
    <button class="btn btn-gold w100" id="bxbtn" onclick="startBoxes()">🎁 OÝNA / TÄZELE</button>`;
}

function startBoxes() {
  const bet = getBet('boxes');
  if (!chkBal(bet)) return;
  bBet = bet; bActive = true;
  const pool = [0, 0, 0, 0, 1.5, 1.5, 2, 3, Math.random() < .05 ? 50 : 5];
  bPrizes = pool.sort(() => Math.random() - .5);
  document.getElementById('bres').style.display = 'none';
  document.getElementById('bxbtn').disabled = true;
  for (let i = 0; i < 9; i++) {
    const e = document.getElementById('bx' + i);
    e.innerHTML = '🎁'; e.className = 'box'; e.style.borderColor = '';
  }
}

function openBox(i) {
  if (!bActive) return;
  const el = document.getElementById('bx' + i);
  if (el.classList.contains('open')) return;
  el.classList.add('open'); bActive = false;
  const m = bPrizes[i];
  if (m > 0) {
    el.innerHTML = `💰<div class="box-mul">${m}×</div>`; el.style.borderColor = 'var(--gold)';
    const net = Math.round(bBet * m) - bBet;
    addTx(`Guty: ${m}×`, net, 'game_luckybox');
    gResult('bres', `<div class="res res-w"><div class="res-big w">+${net.toLocaleString()} TMT</div><div class="res-msg">${m}× köpeltme!</div></div>`);
  } else {
    el.innerHTML = '💨<div class="box-mul" style="color:var(--muted)">Boş</div>'; el.style.borderColor = '#6b7280';
    addTx('Guty: Boş', -bBet, 'game_luckybox');
    gResult('bres', `<div class="res res-l"><div class="res-big l">-${bBet.toLocaleString()} TMT</div><div class="res-msg">Boş guty!</div></div>`);
  }
  setTimeout(() => {
    for (let j = 0; j < 9; j++) {
      const e = document.getElementById('bx' + j);
      if (!e.classList.contains('open')) {
        e.classList.add('open');
        const mm = bPrizes[j];
        e.innerHTML = mm > 0 ? `💰<div class="box-mul">${mm}×</div>` : '💨<div class="box-mul" style="color:var(--muted)">Boş</div>';
        if (mm > 0) e.style.borderColor = 'var(--gold)';
      }
    }
  }, 400);
  updBal();
  document.getElementById('bxbtn').disabled = false;
}

// ═══════════════════════════════════════════
//  4. BAGT UÇUŞY (CRASH)
// ═══════════════════════════════════════════
let crashInt = null, crashMul = 1, crashTarget = 1;
let crashBet = 0, crashCO = false, crashRunning = false;

function renderCrash() {
  return `
    ${betBox('crash', 100)}
    <div class="crash-box">
      <div class="crash-x live" id="cx">1.00×</div>
      <div class="crash-lbl" id="cl">Başlamak üçin basyň</div>
    </div>
    <div id="cres" style="display:none"></div>
    <div class="flex gap8">
      <button class="btn btn-gold" style="flex:1" id="cbtn" onclick="startCrash()">🚀 BAŞLA</button>
      <button class="btn btn-out"  style="flex:1" id="cobt" onclick="cashCrash()" disabled>💰 ÇYKARYP AL</button>
    </div>`;
}

function crashGen() {
  const r = Math.random();
  if (r < .45) return 1 + Math.random() * .6;
  if (r < .72) return 1.6 + Math.random() * 1.4;
  if (r < .88) return 3 + Math.random() * 5;
  if (r < .96) return 8 + Math.random() * 22;
  return 30 + Math.random() * 70;
}

function startCrash() {
  if (crashRunning) return;
  const bet = getBet('crash');
  if (!chkBal(bet)) return;
  crashBet = bet; crashMul = 1.0; crashTarget = crashGen(); crashCO = false; crashRunning = true;
  addTx('Crash: goýum', -bet, 'game_crash'); updBal();
  document.getElementById('cbtn').disabled = true;
  document.getElementById('cobt').disabled = false;
  document.getElementById('cres').style.display = 'none';
  const cx = document.getElementById('cx');
  cx.className = 'crash-x live'; cx.textContent = '1.00×';
  document.getElementById('cl').textContent = 'Uçuş dowam edýär... 🚀';
  crashInt = setInterval(() => {
    crashMul = Math.min(crashTarget, crashMul + crashMul * .02);
    const el = document.getElementById('cx');
    if (!el) { clearInterval(crashInt); return; }
    el.textContent = crashMul.toFixed(2) + '×';
    if (crashMul >= crashTarget) {
      clearInterval(crashInt); crashInt = null; crashRunning = false;
      el.className = 'crash-x dead';
      el.textContent = crashTarget.toFixed(2) + '× 💥';
      document.getElementById('cl').textContent = 'UÇUŞ TAMAMLANDY!';
      document.getElementById('cbtn').disabled = false;
      document.getElementById('cobt').disabled = true;
      if (!crashCO)
        gResult('cres', `<div class="res res-l"><div class="res-big l">-${crashBet.toLocaleString()} TMT</div><div class="res-msg">${crashTarget.toFixed(2)}× — Uçdy!</div></div>`);
    }
  }, 100);
}

function cashCrash() {
  if (!crashRunning || crashCO) return;
  clearInterval(crashInt); crashInt = null; crashRunning = false; crashCO = true;
  const win = Math.round(crashBet * crashMul);
  addTx(`Crash: ${crashMul.toFixed(2)}×`, win, 'game_crash'); updBal();
  document.getElementById('cbtn').disabled = false;
  document.getElementById('cobt').disabled = true;
  document.getElementById('cx').className = 'crash-x safe';
  gResult('cres', `<div class="res res-w"><div class="res-big w">+${win.toLocaleString()} TMT</div><div class="res-msg">${crashMul.toFixed(2)}× çykyş!</div></div>`);
}

// ═══════════════════════════════════════════
//  5. ZAR (DICE)
// ═══════════════════════════════════════════
let dicePick = 'high';
const dMap = { high:'dh', low:'dl', seven:'ds', even:'de', odd:'do' };

function renderDice() {
  return `
    ${betBox('dice', 100)}
    <div class="dice-disp">
      <div class="die" id="d1">🎲</div>
      <div class="die" id="d2">🎲</div>
    </div>
    <div>
      <div class="bet-lbl" style="margin-bottom:8px">BAHANY SAÝLAŇ</div>
      <div class="opts">
        <span class="opt on" id="dh" onclick="selDice('high')">Uly (7+) — 1.9×</span>
        <span class="opt"    id="dl" onclick="selDice('low')">Kiçi (≤6) — 1.9×</span>
        <span class="opt"    id="ds" onclick="selDice('seven')">Edil 7 — 5×</span>
        <span class="opt"    id="de" onclick="selDice('even')">Jüft jemi — 1.9×</span>
        <span class="opt"    id="do" onclick="selDice('odd')">Täk jemi — 1.9×</span>
      </div>
    </div>
    <div id="dres" style="display:none"></div>
    <button class="btn btn-gold w100" onclick="doDice()">🎲 GÖÝBERMEK</button>`;
}

function selDice(v) {
  dicePick = v;
  Object.values(dMap).forEach(id => { const e = document.getElementById(id); if (e) e.className = 'opt'; });
  const e = document.getElementById(dMap[v]); if (e) e.className = 'opt on';
}

function doDice() {
  const bet = getBet('dice');
  if (!chkBal(bet)) return;
  const d1 = Math.ceil(Math.random() * 6), d2 = Math.ceil(Math.random() * 6), sum = d1 + d2;
  const F = ['','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];
  const d1el = document.getElementById('d1'), d2el = document.getElementById('d2');
  d1el.textContent = F[d1]; d1el.classList.add('rolled');
  d2el.textContent = F[d2]; d2el.classList.add('rolled');
  let win = false, mult = 0;
  if (dicePick === 'high'  && sum >= 7)      { win = true; mult = 1.9; }
  if (dicePick === 'low'   && sum <= 6)      { win = true; mult = 1.9; }
  if (dicePick === 'seven' && sum === 7)     { win = true; mult = 5;   }
  if (dicePick === 'even'  && sum % 2 === 0) { win = true; mult = 1.9; }
  if (dicePick === 'odd'   && sum % 2 === 1) { win = true; mult = 1.9; }
  if (win) {
    const net = Math.round(bet * mult) - bet;
    addTx(`Zar: ${d1}+${d2}=${sum}`, net, 'game_dice');
    gResult('dres', `<div class="res res-w"><div class="res-big w">+${net.toLocaleString()} TMT</div><div class="res-msg">Jemi ${sum} — Ýeňiş! (${mult}×)</div></div>`);
  } else {
    addTx(`Zar: ${d1}+${d2}=${sum}`, -bet, 'game_dice');
    gResult('dres', `<div class="res res-l"><div class="res-big l">-${bet.toLocaleString()} TMT</div><div class="res-msg">Jemi ${sum} — Ýeňildiňiz</div></div>`);
  }
  updBal();
}

// ═══════════════════════════════════════════
//  6. MINALAR (MINES)
// ═══════════════════════════════════════════
let mGrid = [], mBet = 0, mActive = false, mRev = 0, mMul = 1, mCnt = 5;

function renderMines() {
  return `
    ${betBox('mines', 100)}
    <div class="flex aic jcb" style="font-size:13px">
      <div>
        <span class="muted">Mina sany: </span>
        <select id="mine-cnt" style="width:auto;padding:5px 8px;font-size:13px" onchange="mCnt=+this.value">
          <option value="3">3</option>
          <option value="5" selected>5</option>
          <option value="8">8</option>
          <option value="12">12</option>
          <option value="18">18</option>
        </select>
      </div>
      <div>Köpeltme: <span class="gold bold" id="mm">1.00×</span></div>
    </div>
    <div class="mines-grid" id="mg">
      ${Array.from({length:25},(_,i)=>`<div class="mc" id="mc${i}" onclick="mClick(${i})">❓</div>`).join('')}
    </div>
    <div id="mres" style="display:none"></div>
    <div class="flex gap8">
      <button class="btn btn-gold" style="flex:1" id="mbtn"  onclick="startMines()">💣 BAŞLA</button>
      <button class="btn btn-out"  style="flex:1" id="mcbtn" onclick="cashMines()" disabled>💰 AL</button>
    </div>`;
}

function startMines() {
  const bet = getBet('mines');
  if (!chkBal(bet)) return;
  mCnt = parseInt(document.getElementById('mine-cnt').value, 10) || 5;
  mBet = bet; mActive = true; mRev = 0; mMul = 1.0;
  mGrid = Array(25).fill(false);
  let b = 0;
  while (b < mCnt) { const i = Math.floor(Math.random() * 25); if (!mGrid[i]) { mGrid[i] = true; b++; } }
  for (let i = 0; i < 25; i++) { const e = document.getElementById('mc' + i); e.textContent = '❓'; e.className = 'mc'; }
  document.getElementById('mres').style.display = 'none';
  document.getElementById('mbtn').disabled = true;
  document.getElementById('mcbtn').disabled = false;
  document.getElementById('mm').textContent = '1.00×';
  addTx('Minalar: goýum', -bet, 'game_mines'); updBal();
}

function mClick(i) {
  if (!mActive) return;
  const el = document.getElementById('mc' + i);
  if (el.classList.contains('safe') || el.classList.contains('bomb')) return;
  if (mGrid[i]) {
    el.textContent = '💣'; el.className = 'mc bomb open'; mActive = false;
    for (let j = 0; j < 25; j++) if (mGrid[j] && j !== i) { const e = document.getElementById('mc' + j); e.textContent = '💣'; e.className = 'mc bomb open'; }
    gResult('mres', `<div class="res res-l"><div class="res-big l">-${mBet.toLocaleString()} TMT</div><div class="res-msg">💥 Mina partlady!</div></div>`);
    document.getElementById('mbtn').disabled = false;
    document.getElementById('mcbtn').disabled = true;
  } else {
    el.textContent = '💎'; el.className = 'mc safe open'; mRev++;
    const safeTotal = 25 - mCnt;
    mMul = parseFloat((1 + mRev * (mCnt / safeTotal) * 0.9).toFixed(2));
    document.getElementById('mm').textContent = mMul.toFixed(2) + '×';
    if (mRev >= safeTotal) cashMines();
  }
}

function cashMines() {
  if (!mActive) return; mActive = false;
  const win = Math.round(mBet * mMul);
  addTx(`Minalar: ${mMul.toFixed(2)}×`, win, 'game_mines'); updBal();
  gResult('mres', `<div class="res res-w"><div class="res-big w">+${win.toLocaleString()} TMT</div><div class="res-msg">${mRev} öýjük — ${mMul.toFixed(2)}×</div></div>`);
  document.getElementById('mbtn').disabled = false;
  document.getElementById('mcbtn').disabled = true;
}

// ═══════════════════════════════════════════
//  7. RULETKA
// ═══════════════════════════════════════════
const RED_N = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
let rPick = 'red';

function renderRoulette() {
  return `
    ${betBox('roulette', 100)}
    <div>
      <div class="bet-lbl" style="margin-bottom:8px">BAHA GÖRNÜŞINI SAÝLAŇ</div>
      <div class="opts">
        <span class="opt on"  id="rp-red"   onclick="selRoul('red')">🔴 Gyzyl (2×)</span>
        <span class="opt"     id="rp-black" onclick="selRoul('black')">⚫ Gara (2×)</span>
        <span class="opt"     id="rp-green" onclick="selRoul('green')">🟢 Nol (35×)</span>
        <span class="opt"     id="rp-odd"   onclick="selRoul('odd')">Täk san (2×)</span>
        <span class="opt"     id="rp-even"  onclick="selRoul('even')">Jüft san (2×)</span>
        <span class="opt"     id="rp-low"   onclick="selRoul('low')">1–18 (2×)</span>
        <span class="opt"     id="rp-high"  onclick="selRoul('high')">19–36 (2×)</span>
        <span class="opt"     id="rp-doz1"  onclick="selRoul('doz1')">1–12 (3×)</span>
        <span class="opt"     id="rp-doz2"  onclick="selRoul('doz2')">13–24 (3×)</span>
        <span class="opt"     id="rp-doz3"  onclick="selRoul('doz3')">25–36 (3×)</span>
      </div>
    </div>
    <div class="rou-ball" id="rb">🎱</div>
    <div id="rres" style="display:none"></div>
    <button class="btn btn-gold w100" onclick="doRoul()">🔴 AÝLANMAK</button>`;
}

function selRoul(v) {
  rPick = v;
  ['red','black','green','odd','even','low','high','doz1','doz2','doz3'].forEach(k => {
    const e = document.getElementById('rp-' + k); if (e) e.className = 'opt';
  });
  const e = document.getElementById('rp-' + v); if (e) e.className = 'opt on';
}

function doRoul() {
  const bet = getBet('roulette');
  if (!chkBal(bet)) return;
  const rb = document.getElementById('rb');
  rb.textContent = '🎱'; rb.style.fontSize = '';
  setTimeout(() => {
    const n = Math.floor(Math.random() * 37);
    const col = n === 0 ? 'green' : RED_N.includes(n) ? 'red' : 'black';
    const em = n === 0 ? '🟢' : col === 'red' ? '🔴' : '⚫';
    rb.innerHTML = `<span style="font-size:20px">${em}</span> <span style="font-size:26px;font-weight:900">${n}</span>`;
    let mult = 0;
    if (rPick === 'red'   && col === 'red')           mult = 2;
    if (rPick === 'black' && col === 'black')         mult = 2;
    if (rPick === 'green' && n === 0)                 mult = 35;
    if (rPick === 'odd'   && n > 0 && n % 2 === 1)   mult = 2;
    if (rPick === 'even'  && n > 0 && n % 2 === 0)   mult = 2;
    if (rPick === 'low'   && n >= 1 && n <= 18)       mult = 2;
    if (rPick === 'high'  && n >= 19)                 mult = 2;
    if (rPick === 'doz1'  && n >= 1  && n <= 12)      mult = 3;
    if (rPick === 'doz2'  && n >= 13 && n <= 24)      mult = 3;
    if (rPick === 'doz3'  && n >= 25 && n <= 36)      mult = 3;
    if (mult > 1) {
      const net = Math.round(bet * mult) - bet;
      addTx(`Ruletka: ${n} (${col})`, net, 'game_roulette');
      gResult('rres', `<div class="res res-w"><div class="res-big w">+${net.toLocaleString()} TMT</div><div class="res-msg">${n} ${col} — ${mult}×</div></div>`);
    } else {
      addTx(`Ruletka: ${n} (${col})`, -bet, 'game_roulette');
      gResult('rres', `<div class="res res-l"><div class="res-big l">-${bet.toLocaleString()} TMT</div><div class="res-msg">${n} ${col}</div></div>`);
    }
    updBal();
  }, 1000);
}

// ═══════════════════════════════════════════
//  8. PLINKO
// ═══════════════════════════════════════════
const PMULS = [100, 10, 5, 2, 1, 0.5, 1, 2, 5, 10, 100];
let plBusy = false;

function renderPlinko() {
  return `
    ${betBox('plinko', 100)}
    <canvas id="plinko" width="310" height="330"></canvas>
    <div id="plres" style="display:none"></div>
    <button class="btn btn-gold w100" id="plbtn" onclick="doPlinko()">⚡ TAŞLAMAK</button>`;
}

function drawPlinko(bx, by, hlit) {
  const cv = document.getElementById('plinko');
  if (!cv) return;
  const ctx = cv.getContext('2d'), W = 310, H = 330, rows = 9;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#D4AF37';
  for (let r = 0; r < rows; r++) {
    const pegs = r + 3, y = 32 + r * (H - 100) / rows;
    const sx = W / 2 - (pegs - 1) * 15;
    for (let p = 0; p < pegs; p++) {
      ctx.beginPath(); ctx.arc(sx + p * 30, y, 5, 0, 2 * Math.PI); ctx.fill();
    }
  }
  const bw = W / PMULS.length;
  PMULS.forEach((m, i) => {
    const col = hlit === i ? '#fff' : (m >= 10 ? '#D4AF37' : m >= 5 ? '#22c55e' : m >= 2 ? '#3b82f6' : m >= 1 ? '#6b7280' : '#4b5563');
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(i * bw + 2, H - 50, bw - 4, 44, 6);
    ctx.fill();
    ctx.fillStyle = hlit === i ? '#000' : '#fff';
    ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(m + '×', i * bw + bw / 2, H - 23);
  });
  if (bx !== null) {
    ctx.beginPath(); ctx.arc(bx, by, 10, 0, 2 * Math.PI);
    const g = ctx.createRadialGradient(bx-3, by-3, 0, bx, by, 10);
    g.addColorStop(0, '#fff'); g.addColorStop(1, '#D4AF37');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.stroke();
  }
}

function doPlinko() {
  if (plBusy) return;
  const bet = getBet('plinko');
  if (!chkBal(bet)) return;
  plBusy = true;
  document.getElementById('plbtn').disabled = true;
  document.getElementById('plres').style.display = 'none';
  const W = 310, H = 330, rows = 9;
  let pos = W / 2;
  const path = [pos];
  for (let r = 0; r < rows; r++) {
    pos += (Math.random() < .5 ? -1 : 1) * 15;
    pos = Math.max(25, Math.min(W - 25, pos));
    path.push(pos);
  }
  let step = 0;
  (function fr() {
    if (step > rows) {
      const bw = W / PMULS.length;
      const bi = Math.max(0, Math.min(PMULS.length - 1, Math.floor(path[rows] / bw)));
      const m = PMULS[bi];
      drawPlinko(path[rows], H - 31, bi);
      const net = Math.round(bet * m) - bet;
      addTx(`Plinko: ${m}×`, net, 'game_plinko'); updBal();
      gResult('plres', net >= 0
        ? `<div class="res res-w"><div class="res-big w">+${net.toLocaleString()} TMT</div><div class="res-msg">${m}× köpeltme</div></div>`
        : `<div class="res res-l"><div class="res-big l">${net.toLocaleString()} TMT</div><div class="res-msg">${m}× köpeltme</div></div>`);
      plBusy = false;
      document.getElementById('plbtn').disabled = false;
      return;
    }
    const y = 32 + step * (H - 100) / rows;
    drawPlinko(path[step] || W / 2, y, null);
    step++;
    setTimeout(fr, 130);
  })();
  drawPlinko(W / 2, 16, null);
}

// ═══════════════════════════════════════════
//  9. HI-LO
// ═══════════════════════════════════════════
const HVALS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const HSUITS = ['♠','♥','♦','♣'];
let hCard = null, hBet = 0, hMul = 1, hActive = false;

function hDraw() { return { v: HVALS[Math.floor(Math.random() * 13)], s: HSUITS[Math.floor(Math.random() * 4)] }; }
function hVal(c) { return HVALS.indexOf(c.v); }
function hCol(c) { return (c.s === '♥' || c.s === '♦') ? 'hc-r' : 'hc-b'; }

function renderHilo() {
  hCard = hDraw();
  return `
    ${betBox('hilo', 100)}
    <div style="text-align:center">
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">
        Häzirki köpeltme: <span id="hm" class="gold bold" style="font-size:14px">1.00×</span>
      </div>
      <div class="hilo-card ${hCol(hCard)}" id="hc">${hCard.v}${hCard.s}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px">Indiki kart has ýokarymy ýa-da aşakmy?</div>
    </div>
    <div id="hres" style="display:none"></div>
    <div class="flex gap8">
      <button class="btn btn-gold" style="flex:1" id="hhigh" onclick="hGuess('high')" disabled>▲ Ýokary</button>
      <button class="btn btn-out"  style="flex:1" id="hcash" onclick="hCash()" disabled>💰 Al</button>
      <button class="btn btn-red"  style="flex:1" id="hlow"  onclick="hGuess('low')" disabled>▼ Aşak</button>
    </div>
    <button class="btn btn-gray w100" id="hstart" onclick="startHilo()">🃏 BAŞLA</button>`;
}

function startHilo() {
  const bet = getBet('hilo');
  if (!chkBal(bet)) return;
  hBet = bet; hMul = 1.0; hActive = true; hCard = hDraw();
  addTx('HiLo: goýum', -bet, 'game_hilo'); updBal();
  document.getElementById('hc').className = 'hilo-card ' + hCol(hCard);
  document.getElementById('hc').textContent = hCard.v + hCard.s;
  document.getElementById('hm').textContent = '1.00×';
  document.getElementById('hres').style.display = 'none';
  document.getElementById('hhigh').disabled = false;
  document.getElementById('hlow').disabled = false;
  document.getElementById('hcash').disabled = true;
  document.getElementById('hstart').disabled = true;
}

function hGuess(dir) {
  if (!hActive) return;
  const prev = hCard; hCard = hDraw();
  document.getElementById('hc').className = 'hilo-card ' + hCol(hCard);
  document.getElementById('hc').textContent = hCard.v + hCard.s;
  const pv = hVal(prev), nv = hVal(hCard);
  const ok = (dir === 'high' && nv >= pv) || (dir === 'low' && nv <= pv);
  if (ok) {
    hMul = parseFloat((hMul * 1.55).toFixed(2));
    document.getElementById('hm').textContent = hMul.toFixed(2) + '×';
    document.getElementById('hres').innerHTML = `<div style="text-align:center;color:var(--green);font-weight:800;padding:6px;font-size:14px">✓ Dogry! ${hMul.toFixed(2)}×</div>`;
    document.getElementById('hres').style.display = 'block';
    document.getElementById('hcash').disabled = false;
  } else {
    hActive = false;
    ['hhigh','hlow','hcash'].forEach(id => document.getElementById(id).disabled = true);
    document.getElementById('hstart').disabled = false;
    gResult('hres', `<div class="res res-l"><div class="res-big l">-${hBet.toLocaleString()} TMT</div><div class="res-msg">Nädogry çaklama!</div></div>`);
  }
}

function hCash() {
  if (!hActive) return; hActive = false;
  const win = Math.round(hBet * hMul);
  addTx(`HiLo: ${hMul.toFixed(2)}×`, win, 'game_hilo'); updBal();
  ['hhigh','hlow','hcash'].forEach(id => document.getElementById(id).disabled = true);
  document.getElementById('hstart').disabled = false;
  gResult('hres', `<div class="res res-w"><div class="res-big w">+${win.toLocaleString()} TMT</div><div class="res-msg">${hMul.toFixed(2)}× çykyş!</div></div>`);
}

// ═══════════════════════════════════════════
//  AFTER-RENDER INIT
// ═══════════════════════════════════════════
function gamesAfterRender() {
  setTimeout(() => {
    if (document.getElementById('wc'))     drawWheel(wAngle);
    if (document.getElementById('plinko')) drawPlinko(155, 16, null);
  }, 50);
}
