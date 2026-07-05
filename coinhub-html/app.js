// ==================== CONFIG ====================
const START_COINS = 1000;
const MIN_BET = 5;
const MAX_BET = 10000;

// ==================== STATE ====================
let S = { page: 'login', user: null, gameid: null };

function loadS() {
  try {
    const u = localStorage.getItem('ch_user');
    if (u) { S.user = JSON.parse(u); S.page = 'home'; }
  } catch(e) {}
}
function saveU() {
  if (S.user) {
    localStorage.setItem('ch_user', JSON.stringify(S.user));
    const a = allUsers();
    a[S.user.username] = S.user;
    localStorage.setItem('ch_all', JSON.stringify(a));
  }
}
function allUsers() {
  try { return JSON.parse(localStorage.getItem('ch_all') || '{}'); } catch(e) { return {}; }
}

function addTx(desc, amount, src) {
  if (!S.user) return;
  const tx = { id: Date.now(), desc, amount, src, at: new Date().toISOString() };
  S.user.txs = [tx, ...(S.user.txs || [])].slice(0, 200);
  S.user.coins = Math.max(0, S.user.coins + amount);
  saveU();
}

function parseBet(v) {
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10) || MIN_BET;
  return Math.max(MIN_BET, Math.min(MAX_BET, n));
}
function getBet(id) {
  const el = document.getElementById('bet-' + id);
  return el ? parseBet(el.value) : MIN_BET;
}
function checkBal(bet) {
  if (S.user.coins < bet) { toast('Balansyňyz ýetmez!'); return false; }
  return true;
}

function toast(msg, dur = 2800) {
  document.querySelectorAll('.toast').forEach(n => n.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur);
}

function updateBalDisp() {
  const c = S.user ? S.user.coins : 0;
  document.querySelectorAll('.hdr-bal, .bal-inline').forEach(el => {
    el.textContent = '💰 ' + c.toLocaleString() + ' TMT';
  });
}

// ==================== ROUTER ====================
function go(page, gameid) {
  if (crashInt) { clearInterval(crashInt); crashInt = null; crashRunning = false; }
  S.page = page;
  S.gameid = gameid || null;
  render();
  window.scrollTo(0, 0);
}

// ==================== RENDER ====================
function render() {
  const app = document.getElementById('app');
  if (S.page === 'login') { app.innerHTML = renderLogin(); return; }
  const inner =
    S.page === 'home'    ? renderHome() :
    S.page === 'wallet'  ? renderWallet() :
    S.page === 'profile' ? renderProfile() :
    S.page === 'game'    ? renderGameWrap() : '';
  app.innerHTML = renderHdr() + `<div class="fade">${inner}</div>` + renderNav();
  afterRender();
}

function renderHdr() {
  const c = S.user ? S.user.coins.toLocaleString() : '0';
  return `<div class="hdr">
    <div class="hdr-logo">💎 CoinHub</div>
    <div class="hdr-bal">💰 ${c} TMT</div>
  </div>`;
}
function renderNav() {
  const p = S.page;
  const on = id => (p === id || (p === 'game' && id === 'home')) ? 'on' : '';
  return `<div class="nav">
    <button class="nav-btn ${on('home')}" onclick="go('home')"><span class="nav-icon">🏠</span>Baş sahypa</button>
    <button class="nav-btn ${on('wallet')}" onclick="go('wallet')"><span class="nav-icon">💼</span>Gapjyk</button>
    <button class="nav-btn ${on('profile')}" onclick="go('profile')"><span class="nav-icon">👤</span>Profil</button>
  </div>`;
}

// ==================== LOGIN ====================
function renderLogin() {
  return `<div class="login-wrap">
    <div>
      <div class="login-logo shimmer">💎 CoinHub</div>
      <div class="login-sub" style="margin-top:6px">Iň gowy wirtual kazino platformasy</div>
    </div>
    <div class="login-form">
      <div class="tabs">
        <button class="tab on" id="t-in" onclick="swTab('in')">Giriş</button>
        <button class="tab" id="t-up" onclick="swTab('up')">Hasap açmak</button>
      </div>
      <div id="pane-in" class="gap">
        <input type="text" id="lu" placeholder="Ulanyjy ady" autocomplete="username">
        <input type="password" id="lp" placeholder="Açar sözi" autocomplete="current-password">
        <button class="btn btn-gold" style="width:100%" onclick="doLogin()">Giriş ↗</button>
      </div>
      <div id="pane-up" class="gap" style="display:none">
        <input type="text" id="ru" placeholder="Ulanyjy ady (3-24 harp)" autocomplete="username">
        <input type="password" id="rp" placeholder="Açar sözi (min 4)" autocomplete="new-password">
        <button class="btn btn-gold" style="width:100%" onclick="doReg()">Hasap açmak ↗</button>
      </div>
      <div style="text-align:center;font-size:12px;color:var(--muted)">Täze hasap: ${START_COINS.toLocaleString()} TMT başlangyjy berilýär</div>
    </div>
  </div>`;
}
function swTab(t) {
  document.getElementById('t-in').className = 'tab' + (t === 'in' ? ' on' : '');
  document.getElementById('t-up').className = 'tab' + (t === 'up' ? ' on' : '');
  document.getElementById('pane-in').style.display = t === 'in' ? '' : 'none';
  document.getElementById('pane-up').style.display = t === 'up' ? '' : 'none';
}
function doLogin() {
  const u = document.getElementById('lu').value.trim();
  const p = document.getElementById('lp').value;
  if (!u || !p) return toast('Maglumatlary doldyryň');
  const a = allUsers();
  if (!a[u] || a[u].pass !== btoa(p)) return toast('Ady ýa-da açar sözi nädogry');
  S.user = { ...a[u] };
  saveU();
  go('home');
}
function doReg() {
  const u = document.getElementById('ru').value.trim().replace(/[^a-zA-Z0-9_]/g, '');
  const p = document.getElementById('rp').value;
  if (u.length < 3) return toast('Ulanyjy ady iň az 3 harp bolmaly');
  if (p.length < 4) return toast('Açar sözi iň az 4 harp bolmaly');
  const a = allUsers();
  if (a[u]) return toast('Bu ulanyjy ady eýýäm bar');
  const nu = { username: u, pass: btoa(p), coins: START_COINS, txs: [], color: '#D4AF37', created: new Date().toISOString() };
  a[u] = nu;
  localStorage.setItem('ch_all', JSON.stringify(a));
  S.user = { ...nu };
  saveU();
  go('home');
}

// ==================== HOME ====================
const GAMES = [
  { id: 'slot',     name: 'Slot Maşyn',   icon: '🎰', max: '150×' },
  { id: 'wheel',    name: 'Bagt Çarhy',   icon: '🎡', max: '100×' },
  { id: 'boxes',    name: 'Bagt Gutusy',  icon: '🎁', max: '50×'  },
  { id: 'crash',    name: 'Bagt Uçuşy',  icon: '🚀', max: '100×' },
  { id: 'dice',     name: 'Zar',          icon: '🎲', max: '5×'   },
  { id: 'mines',    name: 'Minalar',      icon: '💣', max: '100×' },
  { id: 'roulette', name: 'Ruletka',      icon: '🔴', max: '35×'  },
  { id: 'plinko',   name: 'Plinko',       icon: '⚡', max: '100×' },
  { id: 'hilo',     name: 'Hi-Lo',        icon: '🃏', max: '50×'  },
];

function renderHome() {
  const u = S.user;
  const txs = u.txs || [];
  const games = txs.filter(t => t.src && t.src.startsWith('game')).length;
  return `<div class="page">
    <div style="text-align:center;padding:14px 0 20px">
      <div style="font-size:12px;color:var(--muted);margin-bottom:4px">Balansyňyz</div>
      <div style="font-size:34px;font-weight:900" class="shimmer">${u.coins.toLocaleString()} TMT</div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">${games} oýun oýnaldy</div>
    </div>
    <div class="section-title">🎮 Oýunlar</div>
    <div class="games-grid">
      ${GAMES.map(g => `<div class="game-card" onclick="go('game','${g.id}')">
        <div class="game-icon">${g.icon}</div>
        <div class="game-name">${g.name}</div>
        <div class="game-max">Maks ${g.max}</div>
        <button class="game-play-btn">OÝNA</button>
      </div>`).join('')}
    </div>
  </div>`;
}

// ==================== WALLET ====================
function renderWallet() {
  const txs = S.user.txs || [];
  const earned = txs.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const spent = txs.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
  return `<div class="page">
    <div class="section-title">💼 Gapjyk</div>
    <div class="card" style="text-align:center;margin-bottom:12px">
      <div style="font-size:12px;color:var(--muted)">Häzirki balans</div>
      <div style="font-size:30px;font-weight:900;color:var(--gold)">${S.user.coins.toLocaleString()} TMT</div>
    </div>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat-card"><div class="stat-val" style="color:#22c55e">+${earned.toLocaleString()}</div><div class="stat-lbl">Gazanylan</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#ef4444">-${spent.toLocaleString()}</div><div class="stat-lbl">Harçlanan</div></div>
    </div>
    <div class="section-title">📋 Geçmiş</div>
    <div class="gap">
      ${txs.length === 0
        ? `<div style="text-align:center;color:var(--muted);padding:24px">Geçmiş ýok</div>`
        : txs.map(t => `<div class="tx-item">
            <div>
              <div class="tx-desc">${t.desc}</div>
              <div class="tx-date">${new Date(t.at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="tx-amt ${t.amount >= 0 ? 'p' : 'n'}">${t.amount > 0 ? '+' : ''}${t.amount} ¢</div>
          </div>`).join('')}
    </div>
  </div>`;
}

// ==================== PROFILE ====================
const COLORS = ['#D4AF37','#7c3aed','#1d4ed8','#dc2626','#15803d','#ea580c','#db2777','#0e7490'];

function renderProfile() {
  const u = S.user;
  const txs = u.txs || [];
  const games = txs.filter(t => t.src && t.src.startsWith('game')).length;
  const wins = txs.filter(t => t.src && t.src.startsWith('game') && t.amount > 0).length;
  return `<div class="page">
    <div class="section-title">👤 Profil</div>
    <div class="card" style="text-align:center;margin-bottom:12px">
      <div class="avatar" style="background:${u.color || '#1e1e2e'}">${u.username[0].toUpperCase()}</div>
      <div style="font-size:20px;font-weight:800">${u.username}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:3px">CoinHub oýunçy</div>
    </div>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat-card"><div class="stat-val">${u.coins.toLocaleString()}</div><div class="stat-lbl">Balans</div></div>
      <div class="stat-card"><div class="stat-val">${games}</div><div class="stat-lbl">Oýunlar</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#22c55e">${wins}</div><div class="stat-lbl">Ýeňişler</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#ef4444">${games - wins}</div><div class="stat-lbl">Ýeňilişler</div></div>
    </div>
    <div class="section-title" style="margin-bottom:8px">🎨 Avatar reňki</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
      ${COLORS.map(c => `<div class="color-dot ${u.color === c ? 'picked' : ''}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('')}
    </div>
    <button class="btn btn-out" style="width:100%" onclick="doLogout()">Ulgamdan çykmak</button>
  </div>`;
}
function pickColor(c) {
  S.user.color = c;
  saveU();
  go('profile');
}
function doLogout() {
  localStorage.removeItem('ch_user');
  S.user = null;
  go('login');
}

// ==================== BET HELPER ====================
function betBox(id, def) {
  def = def || 100;
  return `<div class="bet-box">
    <div class="bet-lbl">Goýum (${MIN_BET}–${MAX_BET.toLocaleString()} TMT)</div>
    <div class="row">
      <input class="bet-input" id="bet-${id}" type="number" value="${def}" min="${MIN_BET}" max="${MAX_BET}">
    </div>
    <div class="chips">
      <span class="chip" onclick="document.getElementById('bet-${id}').value=25">25</span>
      <span class="chip" onclick="document.getElementById('bet-${id}').value=50">50</span>
      <span class="chip" onclick="document.getElementById('bet-${id}').value=100">100</span>
      <span class="chip" onclick="document.getElementById('bet-${id}').value=500">500</span>
      <span class="chip" onclick="document.getElementById('bet-${id}').value=1000">1 000</span>
      <span class="chip" onclick="document.getElementById('bet-${id}').value=Math.floor(S.user.coins/2)">½</span>
      <span class="chip" onclick="document.getElementById('bet-${id}').value=S.user.coins">Max</span>
    </div>
  </div>`;
}

// ==================== GAME WRAPPER ====================
function renderGameWrap() {
  const g = GAMES.find(x => x.id === S.gameid) || GAMES[0];
  const bodyFn = {
    slot: renderSlot, wheel: renderWheel, boxes: renderBoxes, crash: renderCrash,
    dice: renderDice, mines: renderMines, roulette: renderRoulette, plinko: renderPlinko, hilo: renderHilo
  }[S.gameid] || renderSlot;
  return `<div class="game-page">
    <div class="game-hdr">
      <button class="back-btn" onclick="go('home')">← Yza</button>
      <div style="flex:1">
        <div class="game-title">${g.icon} ${g.name}</div>
        <div class="game-sub-label">Maks ${g.max}</div>
      </div>
      <div class="hdr-bal bal-inline">💰 ${S.user.coins.toLocaleString()} TMT</div>
    </div>
    ${bodyFn()}
  </div>`;
}

// ==================== 1. SLOT ====================
const SYM = ['🍒','🍋','🍊','🍇','⭐','7️⃣','💎','🎰'];
const SMUL = { '🍒':2,'🍋':3,'🍊':4,'🍇':5,'⭐':8,'7️⃣':15,'💎':30,'🎰':150 };
let slotBusy = false;

function renderSlot() {
  return `${betBox('slot', 100)}
    <div class="slot-reels">
      <div class="reel" id="r0">🍒</div>
      <div class="reel" id="r1">🍋</div>
      <div class="reel" id="r2">🍊</div>
    </div>
    <div id="sres"></div>
    <button class="btn btn-gold" style="width:100%" id="sbtn" onclick="doSlot()">🎰 AÝLANMAK</button>`;
}
function doSlot() {
  if (slotBusy) return;
  const bet = getBet('slot');
  if (!checkBal(bet)) return;
  slotBusy = true;
  document.getElementById('sbtn').disabled = true;
  const reels = [0,1,2].map(i => document.getElementById('r' + i));
  reels.forEach(r => r.classList.add('spin'));
  let f = SYM.map(() => SYM[Math.floor(Math.random() * SYM.length)]);
  // house edge ~32% – prevent 3-of-a-kind too often
  if (Math.random() > 0.25) {
    while (f[0] === f[1] && f[1] === f[2]) f[2] = SYM[Math.floor(Math.random() * SYM.length)];
  }
  setTimeout(() => {
    reels.forEach((r, i) => { r.classList.remove('spin'); r.textContent = f[i]; });
    let mult = 0;
    if (f[0] === f[1] && f[1] === f[2]) mult = SMUL[f[0]] || 2;
    else if (f[0] === f[1] || f[1] === f[2] || f[0] === f[2]) mult = 1.5;
    const el = document.getElementById('sres');
    if (mult > 1) {
      const net = Math.round(bet * mult) - bet;
      addTx(`Slot: ${f.join('')} ×${mult}`, net, 'game_slot');
      el.innerHTML = `<div class="res-win"><div class="res-big w">+${net} TMT</div><div class="res-msg">${f.join('')} — ${mult}× !</div></div>`;
    } else {
      addTx(`Slot: ${f.join('')}`, -bet, 'game_slot');
      el.innerHTML = `<div class="res-lose"><div class="res-big l">-${bet} TMT</div><div class="res-msg">Bagtyňyz ýokdy...</div></div>`;
    }
    updateBalDisp();
    slotBusy = false;
    document.getElementById('sbtn').disabled = false;
  }, 1300);
}

// ==================== 2. WHEEL ====================
const WSEGS = [
  {l:'0×',m:0,c:'#dc2626'}, {l:'2×',m:2,c:'#1d4ed8'},   {l:'0×',m:0,c:'#dc2626'},
  {l:'1.5×',m:1.5,c:'#15803d'}, {l:'0×',m:0,c:'#dc2626'}, {l:'3×',m:3,c:'#7c3aed'},
  {l:'1.5×',m:1.5,c:'#15803d'}, {l:'0×',m:0,c:'#dc2626'}, {l:'5×',m:5,c:'#D4AF37'},
  {l:'0×',m:0,c:'#dc2626'}, {l:'10×',m:10,c:'#D4AF37'}, {l:'1.5×',m:1.5,c:'#15803d'},
];
let wAngle = 0, wBusy = false;

function renderWheel() {
  return `${betBox('wheel', 100)}
    <div class="wheel-wrap">
      <div class="wheel-ptr">▼</div>
      <canvas class="wc" id="wc" width="270" height="270"></canvas>
    </div>
    <div id="wres"></div>
    <button class="btn btn-gold" style="width:100%" id="wbtn" onclick="doWheel()">🎡 AÝLANMAK</button>`;
}
function drawW(a) {
  const cv = document.getElementById('wc');
  if (!cv) return;
  const ctx = cv.getContext('2d'), cx = 135, cy = 135, r = 128, n = WSEGS.length, arc = 2 * Math.PI / n;
  ctx.clearRect(0, 0, 270, 270);
  WSEGS.forEach((s, i) => {
    const st = a + i * arc - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, st, st + arc);
    ctx.fillStyle = s.c; ctx.fill();
    ctx.strokeStyle = '#0a0a0f'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(st + arc / 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(s.l, r * 0.65, 5); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#D4AF37'; ctx.fill();
}
function doWheel() {
  if (wBusy) return;
  const bet = getBet('wheel');
  if (!checkBal(bet)) return;
  wBusy = true;
  document.getElementById('wbtn').disabled = true;
  const n = WSEGS.length, arc = 2 * Math.PI / n;
  const idx = Math.floor(Math.random() * n);
  const target = wAngle + Math.PI * 10 - idx * arc;
  const t0 = Date.now(), dur = 3200, s0 = wAngle;
  function fr() {
    const t = Math.min(1, (Date.now() - t0) / dur);
    const e = 1 - Math.pow(1 - t, 4);
    wAngle = s0 + (target - s0) * e;
    drawW(wAngle);
    if (t < 1) { requestAnimationFrame(fr); return; }
    wBusy = false;
    document.getElementById('wbtn').disabled = false;
    const seg = WSEGS[idx];
    const el = document.getElementById('wres');
    if (seg.m > 1) {
      const net = Math.round(bet * seg.m) - bet;
      addTx(`Çarhy: ${seg.l}`, net, 'game_spin');
      el.innerHTML = `<div class="res-win"><div class="res-big w">+${net} TMT</div><div class="res-msg">${seg.l} !</div></div>`;
    } else {
      addTx(`Çarhy: ${seg.l}`, -bet, 'game_spin');
      el.innerHTML = `<div class="res-lose"><div class="res-big l">-${bet} TMT</div><div class="res-msg">Bagtyňyz ýokdy</div></div>`;
    }
    updateBalDisp();
  }
  requestAnimationFrame(fr);
}

// ==================== 3. BOXES ====================
let bPrizes = [], bBet = 0, bActive = false;

function renderBoxes() {
  return `${betBox('boxes', 100)}
    <div class="boxes-grid" id="bxg">
      ${Array.from({length: 9}, (_, i) => `<div class="box" id="bx${i}" onclick="openBox(${i})">🎁</div>`).join('')}
    </div>
    <div id="bres"></div>
    <button class="btn btn-gold" style="width:100%;margin-top:4px" id="bxbtn" onclick="startBoxes()">🎁 BAŞLA</button>`;
}
function startBoxes() {
  const bet = getBet('boxes');
  if (!checkBal(bet)) return;
  bBet = bet; bActive = true;
  const pool = [0, 0, 0, 0, 1.5, 1.5, 2, 3, Math.random() < 0.05 ? 50 : 5];
  bPrizes = pool.sort(() => Math.random() - 0.5);
  document.getElementById('bres').innerHTML = '';
  document.getElementById('bxbtn').disabled = true;
  for (let i = 0; i < 9; i++) {
    const e = document.getElementById('bx' + i);
    e.innerHTML = '🎁'; e.className = 'box'; e.style.borderColor = '';
  }
}
function openBox(i) {
  if (!bActive) return;
  const el = document.getElementById('bx' + i);
  if (el.classList.contains('box-open')) return;
  el.classList.add('box-open'); bActive = false;
  const m = bPrizes[i];
  if (m > 0) {
    el.innerHTML = `💰<div class="box-mul">${m}×</div>`; el.style.borderColor = '#D4AF37';
    const net = Math.round(bBet * m) - bBet;
    addTx(`Guty: ${m}×`, net, 'game_luckybox');
    document.getElementById('bres').innerHTML = `<div class="res-win"><div class="res-big w">+${net} TMT</div><div class="res-msg">${m}× !</div></div>`;
  } else {
    el.innerHTML = '💨<div class="box-mul" style="color:var(--muted)">Boş</div>'; el.style.borderColor = '#6b7280';
    addTx('Guty: Boş', -bBet, 'game_luckybox');
    document.getElementById('bres').innerHTML = `<div class="res-lose"><div class="res-big l">-${bBet} TMT</div><div class="res-msg">Boş guty!</div></div>`;
  }
  for (let j = 0; j < 9; j++) {
    const e = document.getElementById('bx' + j);
    if (!e.classList.contains('box-open')) {
      e.classList.add('box-open');
      const mm = bPrizes[j];
      e.innerHTML = mm > 0 ? `💰<div class="box-mul">${mm}×</div>` : '💨<div class="box-mul" style="color:var(--muted)">Boş</div>';
      if (mm > 0) e.style.borderColor = '#D4AF37';
    }
  }
  updateBalDisp();
  document.getElementById('bxbtn').disabled = false;
}

// ==================== 4. CRASH ====================
let crashInt = null, crashMul = 1, crashTarget = 1, crashBet = 0, crashCO = false, crashRunning = false;

function renderCrash() {
  return `${betBox('crash', 100)}
    <div class="crash-box">
      <div class="crash-mult c-live" id="cm">1.00×</div>
      <div class="crash-lbl" id="cs">Başlamak üçin basyň</div>
    </div>
    <div id="cres"></div>
    <div class="row">
      <button class="btn btn-gold" style="flex:1" id="cbtn" onclick="startCrash()">🚀 BAŞLA</button>
      <button class="btn btn-out" style="flex:1" id="cobtn" onclick="cashCrash()" disabled>💰 AL</button>
    </div>`;
}
function crashGen() {
  const r = Math.random();
  if (r < 0.45) return 1 + Math.random() * 0.6;
  if (r < 0.72) return 1.6 + Math.random() * 1.4;
  if (r < 0.88) return 3 + Math.random() * 5;
  if (r < 0.96) return 8 + Math.random() * 22;
  return 30 + Math.random() * 70;
}
function startCrash() {
  if (crashRunning) return;
  const bet = getBet('crash');
  if (!checkBal(bet)) return;
  crashBet = bet; crashMul = 1.0; crashTarget = crashGen(); crashCO = false; crashRunning = true;
  addTx('Crash: goýum', -bet, 'game_crash');
  updateBalDisp();
  document.getElementById('cbtn').disabled = true;
  document.getElementById('cobtn').disabled = false;
  document.getElementById('cres').innerHTML = '';
  document.getElementById('cm').className = 'crash-mult c-live';
  document.getElementById('cs').textContent = 'Uçuş dowam edýär...';
  crashInt = setInterval(() => {
    crashMul = Math.min(crashTarget, crashMul + crashMul * 0.018);
    const cm = document.getElementById('cm');
    const cs = document.getElementById('cs');
    if (!cm) { clearInterval(crashInt); return; }
    cm.textContent = crashMul.toFixed(2) + '×';
    if (crashMul >= crashTarget) {
      clearInterval(crashInt); crashInt = null; crashRunning = false;
      cm.className = 'crash-mult c-dead';
      cm.textContent = crashTarget.toFixed(2) + '× 💥';
      cs.textContent = 'UÇDY!';
      document.getElementById('cbtn').disabled = false;
      document.getElementById('cobtn').disabled = true;
      if (!crashCO) {
        document.getElementById('cres').innerHTML = `<div class="res-lose"><div class="res-big l">-${crashBet} TMT</div><div class="res-msg">Uçuş tamamlandy!</div></div>`;
      }
    }
  }, 100);
}
function cashCrash() {
  if (!crashRunning || crashCO) return;
  clearInterval(crashInt); crashInt = null; crashRunning = false; crashCO = true;
  const win = Math.round(crashBet * crashMul);
  addTx(`Crash: ${crashMul.toFixed(2)}×`, win, 'game_crash');
  updateBalDisp();
  document.getElementById('cbtn').disabled = false;
  document.getElementById('cobtn').disabled = true;
  document.getElementById('cm').className = 'crash-mult c-cash';
  document.getElementById('cres').innerHTML = `<div class="res-win"><div class="res-big w">+${win} TMT</div><div class="res-msg">${crashMul.toFixed(2)}× çykyş!</div></div>`;
}

// ==================== 5. DICE ====================
let dicePick = 'high';
const DICE_MAP = { high: 'dh', low: 'dl', seven: 'ds', even: 'de', odd: 'do' };

function renderDice() {
  return `${betBox('dice', 100)}
    <div class="dice-row">
      <div class="die" id="d1">🎲</div>
      <div class="die" id="d2">🎲</div>
    </div>
    <div style="margin:8px 0">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:700;text-transform:uppercase">Bahany saýlaň</div>
      <div class="opts">
        <span class="opt on" id="dh" onclick="selDice('high')">Uly (7+) — 1.9×</span>
        <span class="opt" id="dl" onclick="selDice('low')">Kiçi (≤6) — 1.9×</span>
        <span class="opt" id="ds" onclick="selDice('seven')">Edil 7 — 5×</span>
        <span class="opt" id="de" onclick="selDice('even')">Jüft jemi — 1.9×</span>
        <span class="opt" id="do" onclick="selDice('odd')">Täk jemi — 1.9×</span>
      </div>
    </div>
    <div id="dres"></div>
    <button class="btn btn-gold" style="width:100%" onclick="doDice()">🎲 GÖÝBERMEK</button>`;
}
function selDice(v) {
  dicePick = v;
  Object.values(DICE_MAP).forEach(id => { const e = document.getElementById(id); if (e) e.className = 'opt'; });
  const el = document.getElementById(DICE_MAP[v]);
  if (el) el.className = 'opt on';
}
function doDice() {
  const bet = getBet('dice');
  if (!checkBal(bet)) return;
  const d1 = Math.ceil(Math.random() * 6), d2 = Math.ceil(Math.random() * 6), sum = d1 + d2;
  const F = ['','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];
  document.getElementById('d1').textContent = F[d1];
  document.getElementById('d2').textContent = F[d2];
  let win = false, mult = 0;
  if (dicePick === 'high'  && sum >= 7) { win = true; mult = 1.9; }
  if (dicePick === 'low'   && sum <= 6) { win = true; mult = 1.9; }
  if (dicePick === 'seven' && sum === 7) { win = true; mult = 5;   }
  if (dicePick === 'even'  && sum % 2 === 0) { win = true; mult = 1.9; }
  if (dicePick === 'odd'   && sum % 2 === 1) { win = true; mult = 1.9; }
  const el = document.getElementById('dres');
  if (win) {
    const net = Math.round(bet * mult) - bet;
    addTx(`Zar: ${d1}+${d2}=${sum}`, net, 'game_dice');
    el.innerHTML = `<div class="res-win"><div class="res-big w">+${net} TMT</div><div class="res-msg">Jemi ${sum} — Ýeňiş! ${mult}×</div></div>`;
  } else {
    addTx(`Zar: ${d1}+${d2}=${sum}`, -bet, 'game_dice');
    el.innerHTML = `<div class="res-lose"><div class="res-big l">-${bet} TMT</div><div class="res-msg">Jemi ${sum}</div></div>`;
  }
  updateBalDisp();
}

// ==================== 6. MINES ====================
let mGrid = [], mBet = 0, mActive = false, mRev = 0, mMul = 1;
const MCNT = 5, MTOT = 25;

function renderMines() {
  return `${betBox('mines', 100)}
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
      <span style="color:var(--muted)">Häzirki köpeltme:</span>
      <span class="gold" style="font-weight:700;font-size:16px" id="mm">1.00×</span>
    </div>
    <div class="mines-grid" id="mg">
      ${Array.from({length: 25}, (_, i) => `<div class="mc" id="mc${i}" onclick="mClick(${i})">❓</div>`).join('')}
    </div>
    <div id="mres"></div>
    <div class="row">
      <button class="btn btn-gold" style="flex:1" id="mbtn" onclick="startMines()">💣 BAŞLA</button>
      <button class="btn btn-out" style="flex:1" id="mcbtn" onclick="cashMines()" disabled>💰 AL</button>
    </div>`;
}
function startMines() {
  const bet = getBet('mines');
  if (!checkBal(bet)) return;
  mBet = bet; mActive = true; mRev = 0; mMul = 1.0;
  mGrid = Array.from({length: MTOT}, () => false);
  let b = 0;
  while (b < MCNT) { const i = Math.floor(Math.random() * MTOT); if (!mGrid[i]) { mGrid[i] = true; b++; } }
  for (let i = 0; i < MTOT; i++) { const e = document.getElementById('mc' + i); e.textContent = '❓'; e.className = 'mc'; }
  document.getElementById('mres').innerHTML = '';
  document.getElementById('mbtn').disabled = true;
  document.getElementById('mcbtn').disabled = false;
  document.getElementById('mm').textContent = '1.00×';
  addTx('Minalar: goýum', -bet, 'game_mines');
  updateBalDisp();
}
function mClick(i) {
  if (!mActive) return;
  const el = document.getElementById('mc' + i);
  if (el.classList.contains('mc-safe') || el.classList.contains('mc-bomb')) return;
  if (mGrid[i]) {
    el.textContent = '💣'; el.className = 'mc mc-bomb mc-open';
    mActive = false;
    for (let j = 0; j < MTOT; j++) {
      if (mGrid[j] && j !== i) { const e = document.getElementById('mc' + j); e.textContent = '💣'; e.className = 'mc mc-bomb mc-open'; }
    }
    document.getElementById('mres').innerHTML = `<div class="res-lose"><div class="res-big l">-${mBet} TMT</div><div class="res-msg">Mina partlady! 💥</div></div>`;
    document.getElementById('mbtn').disabled = false;
    document.getElementById('mcbtn').disabled = true;
  } else {
    el.textContent = '💎'; el.className = 'mc mc-safe mc-open';
    mRev++;
    mMul = parseFloat((1 + mRev * (MCNT / (MTOT - MCNT)) * 0.85).toFixed(2));
    document.getElementById('mm').textContent = mMul.toFixed(2) + '×';
    if (mRev >= MTOT - MCNT) cashMines();
  }
}
function cashMines() {
  if (!mActive) return; mActive = false;
  const win = Math.round(mBet * mMul);
  addTx(`Minalar: ${mMul.toFixed(2)}×`, win, 'game_mines');
  updateBalDisp();
  document.getElementById('mres').innerHTML = `<div class="res-win"><div class="res-big w">+${win} TMT</div><div class="res-msg">${mRev} öýjük — ${mMul.toFixed(2)}×</div></div>`;
  document.getElementById('mbtn').disabled = false;
  document.getElementById('mcbtn').disabled = true;
}

// ==================== 7. ROULETTE ====================
const RED_NUMS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
let rPick = 'red';

function renderRoulette() {
  return `${betBox('roulette', 100)}
    <div class="opts" style="margin:8px 0">
      <span class="opt on" id="rp-red"   onclick="selRoul('red')">🔴 Gyzyl (2×)</span>
      <span class="opt"    id="rp-black" onclick="selRoul('black')">⚫ Gara (2×)</span>
      <span class="opt"    id="rp-green" onclick="selRoul('green')">🟢 Nol (35×)</span>
      <span class="opt"    id="rp-odd"   onclick="selRoul('odd')">Täk (2×)</span>
      <span class="opt"    id="rp-even"  onclick="selRoul('even')">Jüft (2×)</span>
      <span class="opt"    id="rp-low"   onclick="selRoul('low')">1–18 (2×)</span>
      <span class="opt"    id="rp-high"  onclick="selRoul('high')">19–36 (2×)</span>
    </div>
    <div class="rou-ball" id="rb">🎱</div>
    <div id="rres"></div>
    <button class="btn btn-gold" style="width:100%" onclick="doRoul()">🔴 AÝLANMAK</button>`;
}
function selRoul(v) {
  rPick = v;
  ['red','black','green','odd','even','low','high'].forEach(k => {
    const e = document.getElementById('rp-' + k); if (e) e.className = 'opt';
  });
  const e = document.getElementById('rp-' + v); if (e) e.className = 'opt on';
}
function doRoul() {
  const bet = getBet('roulette');
  if (!checkBal(bet)) return;
  const rb = document.getElementById('rb');
  rb.textContent = '🎱'; rb.style.fontSize = '';
  setTimeout(() => {
    const n = Math.floor(Math.random() * 37);
    const col = n === 0 ? 'green' : RED_NUMS.includes(n) ? 'red' : 'black';
    const emoji = n === 0 ? '🟢' : col === 'red' ? '🔴' : '⚫';
    rb.textContent = `${emoji} ${n}`; rb.style.fontSize = '26px';
    let mult = 0;
    if (rPick === 'red'   && col === 'red')            mult = 2;
    if (rPick === 'black' && col === 'black')          mult = 2;
    if (rPick === 'green' && n === 0)                  mult = 35;
    if (rPick === 'odd'   && n > 0 && n % 2 === 1)    mult = 2;
    if (rPick === 'even'  && n > 0 && n % 2 === 0)    mult = 2;
    if (rPick === 'low'   && n >= 1 && n <= 18)        mult = 2;
    if (rPick === 'high'  && n >= 19)                  mult = 2;
    const el = document.getElementById('rres');
    if (mult > 1) {
      const net = Math.round(bet * mult) - bet;
      addTx(`Ruletka: ${n}(${col})`, net, 'game_roulette');
      el.innerHTML = `<div class="res-win"><div class="res-big w">+${net} TMT</div><div class="res-msg">${n} ${col} — ${mult}×</div></div>`;
    } else {
      addTx(`Ruletka: ${n}(${col})`, -bet, 'game_roulette');
      el.innerHTML = `<div class="res-lose"><div class="res-big l">-${bet} TMT</div><div class="res-msg">${n} ${col}</div></div>`;
    }
    updateBalDisp();
  }, 900);
}

// ==================== 8. PLINKO ====================
const PMULS = [100, 10, 5, 2, 1, 1, 2, 5, 10, 100];
let plBusy = false;

function renderPlinko() {
  return `${betBox('plinko', 100)}
    <canvas id="plinko" width="310" height="320"></canvas>
    <div id="plres"></div>
    <button class="btn btn-gold" style="width:100%" id="plbtn" onclick="doPlinko()">⚡ TAŞLAMAK</button>`;
}
function drawPlinko(bx, by, hlit) {
  const cv = document.getElementById('plinko');
  if (!cv) return;
  const ctx = cv.getContext('2d'), W = 310, H = 320, rows = 8;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#D4AF37';
  for (let r = 0; r < rows; r++) {
    const pegs = r + 3, y = 35 + r * (H - 100) / rows, sx = W / 2 - (pegs - 1) * 17;
    for (let p = 0; p < pegs; p++) { ctx.beginPath(); ctx.arc(sx + p * 34, y, 5, 0, 2 * Math.PI); ctx.fill(); }
  }
  PMULS.forEach((m, i) => {
    const bw = W / PMULS.length;
    ctx.fillStyle = hlit === i ? '#fff' : (m >= 10 ? '#D4AF37' : m >= 5 ? '#22c55e' : m >= 2 ? '#3b82f6' : '#6b7280');
    ctx.fillRect(i * bw + 1, H - 48, bw - 2, 42);
    ctx.fillStyle = hlit === i ? '#000' : '#fff';
    ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(m + '×', i * bw + bw / 2, H - 22);
  });
  if (bx !== null) {
    ctx.beginPath(); ctx.arc(bx, by, 9, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill();
  }
}
function doPlinko() {
  if (plBusy) return;
  const bet = getBet('plinko');
  if (!checkBal(bet)) return;
  plBusy = true;
  document.getElementById('plbtn').disabled = true;
  const W = 310, H = 320, rows = 8;
  let pos = W / 2;
  const path = [pos];
  for (let r = 0; r < rows; r++) {
    pos += (Math.random() < 0.5 ? -1 : 1) * 17;
    pos = Math.max(20, Math.min(W - 20, pos));
    path.push(pos);
  }
  let step = 0;
  function fr() {
    if (step > rows) {
      const bw = W / PMULS.length;
      const fi = path[rows];
      const bi = Math.max(0, Math.min(PMULS.length - 1, Math.floor(fi / bw)));
      const m = PMULS[bi];
      drawPlinko(fi, H - 29, bi);
      const net = Math.round(bet * m) - bet;
      addTx(`Plinko: ${m}×`, net, 'game_plinko');
      updateBalDisp();
      const el = document.getElementById('plres');
      el.innerHTML = net >= 0
        ? `<div class="res-win"><div class="res-big w">+${net} TMT</div><div class="res-msg">${m}×</div></div>`
        : `<div class="res-lose"><div class="res-big l">${net} TMT</div><div class="res-msg">${m}×</div></div>`;
      plBusy = false;
      document.getElementById('plbtn').disabled = false;
      return;
    }
    const y = 35 + step * (H - 100) / rows;
    drawPlinko(path[step] || W / 2, y, null);
    step++;
    setTimeout(fr, 140);
  }
  drawPlinko(W / 2, 18, null);
  setTimeout(fr, 200);
}

// ==================== 9. HI-LO ====================
const HVALS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const HSUITS = ['♠','♥','♦','♣'];
let hCard = null, hBet = 0, hMul = 1, hActive = false;

function hDraw() { return { v: HVALS[Math.floor(Math.random() * 13)], s: HSUITS[Math.floor(Math.random() * 4)] }; }
function hVal(c) { return HVALS.indexOf(c.v); }
function hCol(c) { return (c.s === '♥' || c.s === '♦') ? 'hc-r' : 'hc-b'; }

function renderHilo() {
  hCard = hDraw();
  return `${betBox('hilo', 100)}
    <div style="text-align:center">
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Köpeltme: <span id="hm" class="gold" style="font-weight:700">1.00×</span></div>
      <div class="hilo-card ${hCol(hCard)}" id="hc">${hCard.v}${hCard.s}</div>
    </div>
    <div id="hres"></div>
    <div class="row">
      <button class="btn btn-gold" style="flex:1" id="hhigh" onclick="hGuess('high')" disabled>▲ Ýokary</button>
      <button class="btn btn-out"  style="flex:1" id="hcash" onclick="hCash()" disabled>💰 Al</button>
      <button class="btn btn-red"  style="flex:1" id="hlow"  onclick="hGuess('low')" disabled>▼ Aşak</button>
    </div>
    <button class="btn btn-out" style="width:100%;margin-top:6px" id="hstart" onclick="startHilo()">🃏 BAŞLA</button>`;
}
function startHilo() {
  const bet = getBet('hilo');
  if (!checkBal(bet)) return;
  hBet = bet; hMul = 1.0; hActive = true; hCard = hDraw();
  addTx('HiLo: goýum', -bet, 'game_hilo');
  updateBalDisp();
  document.getElementById('hc').className = 'hilo-card ' + hCol(hCard);
  document.getElementById('hc').textContent = hCard.v + hCard.s;
  document.getElementById('hm').textContent = '1.00×';
  document.getElementById('hres').innerHTML = '';
  document.getElementById('hhigh').disabled = false;
  document.getElementById('hlow').disabled  = false;
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
    document.getElementById('hres').innerHTML = `<div style="text-align:center;color:#22c55e;font-weight:700;padding:8px">✓ Dogry! ${hMul.toFixed(2)}×</div>`;
    document.getElementById('hcash').disabled = false;
  } else {
    hActive = false;
    document.getElementById('hhigh').disabled = true;
    document.getElementById('hlow').disabled  = true;
    document.getElementById('hcash').disabled = true;
    document.getElementById('hstart').disabled = false;
    document.getElementById('hres').innerHTML = `<div class="res-lose"><div class="res-big l">-${hBet} TMT</div><div class="res-msg">Nädogry çaklama!</div></div>`;
  }
}
function hCash() {
  if (!hActive) return; hActive = false;
  const win = Math.round(hBet * hMul);
  addTx(`HiLo: ${hMul.toFixed(2)}×`, win, 'game_hilo');
  updateBalDisp();
  document.getElementById('hhigh').disabled = true;
  document.getElementById('hlow').disabled  = true;
  document.getElementById('hcash').disabled = true;
  document.getElementById('hstart').disabled = false;
  document.getElementById('hres').innerHTML = `<div class="res-win"><div class="res-big w">+${win} TMT</div><div class="res-msg">${hMul.toFixed(2)}× çykyş!</div></div>`;
}

// ==================== AFTER RENDER ====================
function afterRender() {
  setTimeout(() => {
    if (document.getElementById('wc'))     drawW(wAngle);
    if (document.getElementById('plinko')) drawPlinko(155, 18, null);
  }, 40);
}

// ==================== BOOT ====================
loadS();
render();
