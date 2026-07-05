// ═══════════════════════════════════════════
//  COINHUB — APP.JS  (baş logika + sahypalar)
// ═══════════════════════════════════════════

// ─── SABIT ──────────────────────────────────
const START_COINS   = 1000;
const BONUS_AMOUNT  = 50;
const BONUS_DAYS    = 3;
const NEWS = [
  { title:'🎉 CoinHub täze wersiýa — v4.0!', body:'Täze oýunlar, has çalt, has gowy dizaýn. Ähli ulanyjylara 50 TMT sowgat!', date:'2026-07-01' },
  { title:'💎 HiLo oýny täzelendi', body:'HiLo oýnunda köpeltme täzeden düzüldi — ýeňiş şansy has ýokary!', date:'2026-06-28' },
  { title:'🏆 Liderler tablisasy artdy', body:'Indi ähli oýunçy sanawda görünýär. Iň köp ýeňiş gazanan = sylag.', date:'2026-06-20' },
  { title:'🚀 Crash oýny gowulaşdy', body:'Auto-cashout funksiýasy geldi. Öz çykyş köpeltmäňizi belläň!', date:'2026-06-15' },
  { title:'🎁 Gündelik bonus ulgamy', body:'Her 3 günde bir gezek 50 TMT bonus alyň. Sahypany yzygiderli barlaň!', date:'2026-06-10' },
];

const GAMES = [
  { id:'slot',     name:'Slot Maşyn',  icon:'🎰', max:'150×', color:'#7c3aed' },
  { id:'wheel',    name:'Bagt Çarhy',  icon:'🎡', max:'100×', color:'#1d4ed8' },
  { id:'boxes',    name:'Bagt Gutusy', icon:'🎁', max:'50×',  color:'#b45309' },
  { id:'crash',    name:'Bagt Uçuşy', icon:'🚀', max:'100×', color:'#dc2626' },
  { id:'dice',     name:'Zar',         icon:'🎲', max:'5×',   color:'#15803d' },
  { id:'mines',    name:'Minalar',     icon:'💣', max:'100×', color:'#ea580c' },
  { id:'roulette', name:'Ruletka',     icon:'🔴', max:'35×',  color:'#be123c' },
  { id:'plinko',   name:'Plinko',      icon:'⚡', max:'100×', color:'#0e7490' },
  { id:'hilo',     name:'Hi-Lo',       icon:'🃏', max:'50×',  color:'#ca8a04' },
];

const COLORS = ['#D4AF37','#7c3aed','#1d4ed8','#dc2626','#15803d','#ea580c','#db2777','#0e7490'];
const VIP_TIERS = [
  { name:'Bürünç', min:0,     max:4999,  color:'#b45309' },
  { name:'Kümüş',  min:5000,  max:24999, color:'#9ca3af' },
  { name:'Altyn',  min:25000, max:99999, color:'#D4AF37' },
  { name:'VIP',    min:100000,max:Infinity,color:'#a78bfa' },
];

// ─── STATE ──────────────────────────────────
let S = { page:'login', user:null, gameid:null, tab:'', chatFilter:'all', txFilter:'all' };
let chatPolling = null;

// ─── STORAGE ────────────────────────────────
function allUsers() { try { return JSON.parse(localStorage.getItem('ch_all') || '{}'); } catch(e) { return {}; } }
function saveUser() {
  if (!S.user) return;
  localStorage.setItem('ch_user', JSON.stringify(S.user));
  const a = allUsers(); a[S.user.username] = S.user;
  localStorage.setItem('ch_all', JSON.stringify(a));
}
function loadUser() {
  try { const u = localStorage.getItem('ch_user'); if (u) { S.user = JSON.parse(u); S.page = 'home'; } }
  catch(e) {}
}
function getChat() { try { return JSON.parse(localStorage.getItem('ch_chat') || '[]'); } catch(e) { return []; } }
function saveChat(msgs) { localStorage.setItem('ch_chat', JSON.stringify(msgs.slice(-200))); }

// ─── ECONOMY ────────────────────────────────
function addTx(desc, amount, src) {
  if (!S.user) return;
  S.user.coins = Math.max(0, S.user.coins + amount);
  const tx = { id: Date.now() + Math.random(), desc, amount, src, at: new Date().toISOString() };
  S.user.txs = [tx, ...(S.user.txs || [])].slice(0, 300);
  saveUser();
}

function canClaimBonus() {
  if (!S.user) return false;
  const last = S.user.lastBonus;
  if (!last) return true;
  const diff = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
  return diff >= BONUS_DAYS;
}
function bonusTimer() {
  if (!S.user || !S.user.lastBonus) return '';
  const elapsed = (Date.now() - new Date(S.user.lastBonus).getTime()) / 1000;
  const rem = BONUS_DAYS * 86400 - elapsed;
  if (rem <= 0) return 'Häzir alyp bilersiňiz!';
  const h = Math.floor(rem / 3600), m = Math.floor((rem % 3600) / 60);
  return `${h} sagat ${m} minut`;
}

function claimBonus() {
  if (!canClaimBonus()) return;
  S.user.lastBonus = new Date().toISOString();
  addTx(`Bonus (+${BONUS_AMOUNT} TMT)`, BONUS_AMOUNT, 'bonus');
  toast(`+${BONUS_AMOUNT} TMT bonus alyndy! 🎉`);
  render();
}

// ─── VIP ────────────────────────────────────
function vipTier(coins) {
  return VIP_TIERS.find(t => coins >= t.min && coins <= t.max) || VIP_TIERS[0];
}
function vipPct(coins) {
  const t = vipTier(coins);
  if (t.max === Infinity) return 100;
  return Math.min(100, Math.round((coins - t.min) / (t.max - t.min) * 100));
}

// ─── UI UTILS ───────────────────────────────
function toast(msg, dur=2800) {
  document.querySelectorAll('.toast').forEach(n => n.remove());
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur);
}

function updBal() {
  if (!S.user) return;
  const c = '💰 ' + S.user.coins.toLocaleString() + ' TMT';
  document.querySelectorAll('.hdr-bal,.bal-inline,.g-bal').forEach(el => el.textContent = c);
}

// ─── ROUTER ─────────────────────────────────
function go(page, arg) {
  if (crashRunning && page !== 'game') { cashCrash && cashCrash(); }
  if (crashInt) { clearInterval(crashInt); crashInt = null; crashRunning = false; }
  if (chatPolling) { clearInterval(chatPolling); chatPolling = null; }
  S.page = page; S.gameid = (page === 'game' ? arg : null);
  S.tab = (page === 'wallet' || page === 'profile' || page === 'leaderboard' || page === 'news') ? arg || '' : '';
  render();
  window.scrollTo(0, 0);
}

// ─── RENDER ─────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (!app) return;
  if (S.page === 'login') { app.innerHTML = renderLogin(); return; }
  const inner = {
    home:        renderHome,
    wallet:      renderWallet,
    leaderboard: renderLeaderboard,
    chat:        renderChat,
    news:        renderNews,
    settings:    renderSettings,
    profile:     renderProfile,
    game:        renderGameWrap,
  }[S.page];
  app.innerHTML = renderHdr() + `<div class="fade">${inner ? inner() : ''}</div>` + renderNav();
  afterRender();
}

// ─── HDR ────────────────────────────────────
function renderHdr() {
  const c = S.user ? S.user.coins.toLocaleString() : '0';
  const tier = S.user ? vipTier(S.user.coins) : VIP_TIERS[0];
  const hasBonus = canClaimBonus();
  return `<div class="hdr">
    <div class="hdr-logo">💎 CoinHub</div>
    <div class="hdr-right">
      ${hasBonus ? `<div class="hdr-notif" onclick="claimBonus()" title="Bonus almak"><span>🎁</span></div>` : ''}
      <div class="hdr-bal" onclick="go('wallet')">💰 ${c} TMT</div>
    </div>
  </div>`;
}

// ─── NAV ────────────────────────────────────
function renderNav() {
  const p = S.page;
  const on = (...pages) => pages.includes(p) ? 'on' : '';
  const chatMsgs = getChat();
  const unread = chatMsgs.filter(m => m.u !== (S.user?.username) && !m.seen).length;
  return `<div class="nav">
    <button class="nav-btn ${on('home','game')}"   onclick="go('home')"><span class="nav-ico">🏠</span>Baş</button>
    <button class="nav-btn ${on('leaderboard')}"   onclick="go('leaderboard')"><span class="nav-ico">🏆</span>Liderler</button>
    <button class="nav-btn ${on('chat')}"          onclick="go('chat')">${unread?`<span class="nav-badge">${unread}</span>`:''}
      <span class="nav-ico">💬</span>Çat</button>
    <button class="nav-btn ${on('news')}"          onclick="go('news')"><span class="nav-ico">📰</span>Habar</button>
    <button class="nav-btn ${on('wallet')}"        onclick="go('wallet')"><span class="nav-ico">💼</span>Gapjyk</button>
    <button class="nav-btn ${on('profile','settings')}" onclick="go('profile')"><span class="nav-ico">👤</span>Profil</button>
  </div>`;
}

// ═══════════════════════════════════════════
//  LOGIN / REGISTER
// ═══════════════════════════════════════════
function renderLogin() {
  return `<div class="splash">
    <div style="text-align:center">
      <div class="splash-logo shimmer">💎 CoinHub</div>
      <div class="splash-sub" style="margin-top:6px">Iň gowy wirtual kazino platformasy</div>
      <div style="margin-top:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
        ${GAMES.map(g=>`<span style="font-size:20px" title="${g.name}">${g.icon}</span>`).join('')}
      </div>
    </div>
    <div class="splash-form">
      <div class="tabs">
        <button class="tab on" id="t-in" onclick="swTab('in')">Giriş</button>
        <button class="tab"    id="t-up" onclick="swTab('up')">Hasap açmak</button>
      </div>
      <div id="pane-in" style="display:flex;flex-direction:column;gap:10px">
        <input id="lu" type="text"     placeholder="Ulanyjy ady"  autocomplete="username">
        <input id="lp" type="password" placeholder="Açar sözi"    autocomplete="current-password">
        <button class="btn btn-gold w100" onclick="doLogin()">Giriş etmek →</button>
      </div>
      <div id="pane-up" style="display:none;flex-direction:column;gap:10px">
        <input id="ru" type="text"     placeholder="Ulanyjy ady (3–24 harp)" autocomplete="username">
        <input id="rp" type="password" placeholder="Açar sözi (min 4)"       autocomplete="new-password">
        <button class="btn btn-gold w100" onclick="doReg()">Hasap açmak →</button>
      </div>
      <div class="splash-hint">Täze hasap: <span class="gold bold">${START_COINS.toLocaleString()} TMT</span> başlangyjy berilýär</div>
    </div>
  </div>`;
}

function swTab(t) {
  document.getElementById('t-in').className = 'tab' + (t==='in'?' on':'');
  document.getElementById('t-up').className = 'tab' + (t==='up'?' on':'');
  document.getElementById('pane-in').style.display = t==='in' ? 'flex' : 'none';
  document.getElementById('pane-up').style.display = t==='up' ? 'flex' : 'none';
}

function doLogin() {
  const u = document.getElementById('lu').value.trim();
  const p = document.getElementById('lp').value;
  if (!u || !p) return toast('Maglumatlary doldyryň');
  const a = allUsers();
  if (!a[u] || a[u].pass !== btoa(p)) return toast('Ulanyjy ady ýa-da açar sözi nädogry');
  S.user = { ...a[u] };
  saveUser(); go('home');
}

function doReg() {
  const u = document.getElementById('ru').value.trim().replace(/[^a-zA-Z0-9_]/g,'');
  const p = document.getElementById('rp').value;
  if (u.length < 3 || u.length > 24) return toast('Ulanyjy ady 3–24 harp bolmaly');
  if (p.length < 4) return toast('Açar sözi iň az 4 harp bolmaly');
  const a = allUsers();
  if (a[u]) return toast('Bu ulanyjy ady eýýäm bar');
  S.user = { username:u, pass:btoa(p), coins:START_COINS, txs:[], color:COLORS[Math.floor(Math.random()*COLORS.length)], created:new Date().toISOString() };
  a[u] = S.user;
  localStorage.setItem('ch_all', JSON.stringify(a));
  saveUser(); go('home');
}

// ═══════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════
let liveItems = [];
function genLive() {
  const names = ['Aýgül','Merdan','Döwlet','Maral','Şamil','Leýla','Hasan','Güljeren','Batyr','Ogulsapar'];
  const g = GAMES[Math.floor(Math.random()*GAMES.length)];
  const w = Math.random() > .45;
  const amt = Math.floor(Math.random()*4900+100);
  const nm = names[Math.floor(Math.random()*names.length)];
  return w
    ? `<div class="live-item">${g.icon} <b class="lw">${nm}</b> ${g.name}da <span class="lw">+${amt} TMT</span> gazandy</div>`
    : `<div class="live-item">${g.icon} <b class="ll">${nm}</b> ${g.name}da <span class="ll">-${amt} TMT</span> ýitirdi</div>`;
}

function renderHome() {
  const u = S.user;
  const tier = vipTier(u.coins);
  const pct  = vipPct(u.coins);
  const txs = u.txs || [];
  const gameCount = txs.filter(t=>t.src&&t.src.startsWith('game')).length;
  const winCount  = txs.filter(t=>t.src&&t.src.startsWith('game')&&t.amount>0).length;
  const bonus = canClaimBonus();

  liveItems = [genLive(),genLive(),genLive()];

  return `<div class="page">
    ${bonus ? `<div class="bonus-card" onclick="claimBonus()">
      <div class="bonus-ttl">🎁 Bonus Alyň!</div>
      <div class="bonus-sub">Her 3 günde bir gezek <span class="gold bold">+${BONUS_AMOUNT} TMT</span> bonus</div>
      <button class="btn btn-gold" style="margin-top:8px;padding:7px 20px;font-size:13px">ALYP BERIŇ</button>
    </div>` : `<div class="bonus-card claimed">
      <div class="bonus-ttl">🎁 Indiki bonus</div>
      <div class="bonus-sub">Galdy: <span class="gold bold" id="bonus-t">${bonusTimer()}</span></div>
    </div>`}

    <div class="balance-hero">
      <div class="bal-label">Balansyňyz</div>
      <div class="bal-amount shimmer">${u.coins.toLocaleString()} TMT</div>
      <div style="margin-top:6px">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
          <span style="color:${tier.color};font-weight:800">${tier.name}</span>
          <span style="color:var(--muted)">${pct}%</span>
        </div>
        <div class="vip-bar"><div class="vip-fill" style="width:${pct}%;background:${tier.color}"></div></div>
      </div>
      <div class="bal-sub" style="margin-top:8px">${gameCount} oýun · ${winCount} ýeňiş</div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="sec-title" style="margin-bottom:6px">📡 JANLY WAKALAR</div>
      <div id="live-feed">${liveItems.join('')}</div>
    </div>

    <div class="sec-title">🎮 OÝUNLAR</div>
    <div class="games-grid">
      ${GAMES.map(g=>`<div class="game-card" onclick="go('game','${g.id}')" style="--gc:${g.color}">
        <div class="game-emoji">${g.icon}</div>
        <div class="game-name">${g.name}</div>
        <div class="game-max">Maks: ${g.max}</div>
        <button class="play-btn">OÝNA</button>
      </div>`).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
//  WALLET
// ═══════════════════════════════════════════
function renderWallet() {
  const txs = S.user.txs || [];
  const earned = txs.filter(t=>t.amount>0).reduce((a,t)=>a+t.amount,0);
  const spent   = txs.filter(t=>t.amount<0).reduce((a,t)=>a+Math.abs(t.amount),0);
  const gameT   = txs.filter(t=>t.src&&t.src.startsWith('game')).length;
  let f = S.txFilter || 'all';
  const filtered = txs.filter(t=>
    f==='all'    ? true :
    f==='wins'   ? t.amount > 0 :
    f==='losses' ? t.amount < 0 :
    f==='bonus'  ? t.src==='bonus' : true
  );
  function srcBadge(src) {
    if (!src) return '';
    if (src.startsWith('game'))  return `<span class="tx-src src-game">oýun</span>`;
    if (src === 'bonus')         return `<span class="tx-src src-bonus">bonus</span>`;
    if (src === 'transfer')      return `<span class="tx-src src-transfer">transfer</span>`;
    return '';
  }
  return `<div class="page">
    <div class="page-title">💼 Gapjyk</div>
    <div class="wallet-hero">
      <div class="bal-label">Häzirki balans</div>
      <div class="bal-amount shimmer">${S.user.coins.toLocaleString()} TMT</div>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val green">+${earned.toLocaleString()}</div><div class="stat-lbl">Gazanylan</div></div>
      <div class="stat-card"><div class="stat-val red">-${spent.toLocaleString()}</div><div class="stat-lbl">Harçlanan</div></div>
      <div class="stat-card"><div class="stat-val">${gameT}</div><div class="stat-lbl">Oýunlar</div></div>
      <div class="stat-card"><div class="stat-val gold">${txs.length}</div><div class="stat-lbl">Jemi amaly</div></div>
    </div>
    <div class="filter-row">
      ${[['all','Hemmesi'],['wins','Ýeňişler'],['losses','Ýeňilişler'],['bonus','Bonuslar']].map(
        ([v,l])=>`<div class="filter-btn ${f===v?'on':''}" onclick="S.txFilter='${v}';render()">${l}</div>`
      ).join('')}
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${filtered.length === 0
        ? `<div style="text-align:center;color:var(--muted);padding:32px">Geçmiş ýok</div>`
        : filtered.map(t=>`<div class="tx-item">
            <div class="tx-left">
              <div class="tx-desc">${t.desc}${srcBadge(t.src)}</div>
              <div class="tx-date">${fmtDate(t.at)}</div>
            </div>
            <div class="tx-amt ${t.amount>=0?'p':'n'}">${t.amount>0?'+':''}${t.amount.toLocaleString()} ¢</div>
          </div>`).join('')}
    </div>
  </div>`;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  } catch(e) { return iso; }
}

// ═══════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════
function renderLeaderboard() {
  const users = Object.values(allUsers()).sort((a,b)=>b.coins-a.coins).slice(0,20);
  function av(u) {
    return `<div class="lb-av" style="background:${u.color||'#1e1e2e'};color:#fff">${u.username[0].toUpperCase()}</div>`;
  }
  function podAv(u, size) {
    return `<div class="pod-avatar" style="background:${u.color||'#1e1e2e'};color:#fff;width:${size}px;height:${size}px;font-size:${Math.round(size*.4)}px">${u.username[0].toUpperCase()}</div>`;
  }
  const top3 = users.slice(0,3);
  const rest  = users.slice(3);
  const medals = ['🥇','🥈','🥉'];
  const order  = [1,0,2]; // 2nd left, 1st center, 3rd right
  const podHtml = top3.length >= 1 ? `<div class="podium">
    ${order.filter(i=>top3[i]).map(i=>{
      const u = top3[i];
      const tier = vipTier(u.coins);
      return `<div class="pod pod-${i+1}">
        <div class="pod-crown">${i===0?'👑':''}</div>
        ${podAv(u, i===0?60:48)}
        <div class="pod-name">${u.username}</div>
        <div class="pod-coins">${u.coins.toLocaleString()}</div>
        <div class="pod-block"></div>
        <div style="font-size:20px;margin-top:4px">${medals[i]}</div>
      </div>`;
    }).join('')}
  </div>` : '';

  return `<div class="page">
    <div class="page-title">🏆 Liderler Tablisasy</div>
    <div class="page-sub">${users.length} oýunçy</div>
    ${podHtml}
    <div class="sec-title">📋 DOLY SANAW</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${users.length===0
        ? `<div style="text-align:center;color:var(--muted);padding:32px">Heniz oýunçy ýok</div>`
        : users.map((u,i)=>{
          const mine = u.username===S.user?.username;
          const tier = vipTier(u.coins);
          return `<div class="lb-row" style="${mine?'border-color:var(--gold)':''}">
            <div class="lb-rank">${i<3?medals[i]:'#'+(i+1)}</div>
            ${av(u)}
            <div class="lb-name">${u.username}${mine?' <span class="gold bold">(Siz)</span>':''}<br>
              <span style="font-size:10px;color:${tier.color};font-weight:700">${tier.name}</span>
            </div>
            <div class="lb-coins">${u.coins.toLocaleString()}<div style="font-size:9px;color:var(--muted);text-align:right;font-weight:400">${(u.txs||[]).filter(t=>t.src&&t.src.startsWith('game')).length} oýun</div></div>
          </div>`;
        }).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════
function renderChat() {
  const msgs = getChat();
  return `<div class="page">
    <div class="page-title">💬 Global Çat</div>
    <div class="page-sub">200 harp limit · hemme oýunçy görýär</div>
    <div class="card" style="margin-bottom:10px">
      <div class="chat-msgs" id="chat-msgs">
        ${msgs.length===0
          ? `<div style="text-align:center;color:var(--muted);padding:24px">Heniz habar ýok</div>`
          : msgs.map(m=>{
            const mine = m.u === S.user?.username;
            const col  = m.c || '#D4AF37';
            return `<div class="chat-bubble ${mine?'mine':''}">
              <div class="chat-av" style="background:${col};color:#fff">${m.u[0].toUpperCase()}</div>
              <div class="chat-body">
                <div class="chat-name">${m.u} · ${fmtDate(m.at)}</div>
                <div class="chat-msg">${escHtml(m.msg)}</div>
              </div>
            </div>`;
          }).join('')}
      </div>
    </div>
    <div class="chat-input-row">
      <input id="chat-inp" type="text" placeholder="Habar ýazyň..." maxlength="200" onkeydown="if(event.key==='Enter')sendChat()">
      <button class="chat-send" onclick="sendChat()">↑</button>
    </div>
    <div style="font-size:10px;color:var(--muted);margin-top:5px;text-align:right" id="chat-len">0/200</div>
  </div>`;
}

function sendChat() {
  const inp = document.getElementById('chat-inp');
  if (!inp) return;
  const msg = inp.value.trim().slice(0,200);
  if (!msg) return;
  const msgs = getChat();
  msgs.push({ u: S.user.username, c: S.user.color||'#D4AF37', msg, at: new Date().toISOString() });
  saveChat(msgs);
  inp.value = '';
  renderChatMsgs();
}

function renderChatMsgs() {
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  const msgs = getChat();
  el.innerHTML = msgs.length===0
    ? `<div style="text-align:center;color:var(--muted);padding:24px">Heniz habar ýok</div>`
    : msgs.map(m=>{
      const mine = m.u===S.user?.username;
      const col  = m.c||'#D4AF37';
      return `<div class="chat-bubble ${mine?'mine':''}">
        <div class="chat-av" style="background:${col};color:#fff">${m.u[0].toUpperCase()}</div>
        <div class="chat-body">
          <div class="chat-name">${m.u} · ${fmtDate(m.at)}</div>
          <div class="chat-msg">${escHtml(m.msg)}</div>
        </div>
      </div>`;
    }).join('');
  el.scrollTop = el.scrollHeight;
}

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════
//  NEWS
// ═══════════════════════════════════════════
function renderNews() {
  return `<div class="page">
    <div class="page-title">📰 Habarlar</div>
    <div class="page-sub">CoinHub täzelikler we ýagdaýlar</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${NEWS.map(n=>`<div class="news-card">
        <div class="news-title">${n.title}</div>
        <div class="news-body">${n.body}</div>
        <div class="news-date">📅 ${n.date}</div>
      </div>`).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════
function renderProfile() {
  const u = S.user;
  const tier = vipTier(u.coins);
  const pct  = vipPct(u.coins);
  const txs  = u.txs || [];
  const games = txs.filter(t=>t.src&&t.src.startsWith('game')).length;
  const wins  = txs.filter(t=>t.src&&t.src.startsWith('game')&&t.amount>0).length;
  const losses= games - wins;
  const maxWin = txs.filter(t=>t.amount>0).reduce((a,t)=>Math.max(a,t.amount),0);
  const daysJoined = Math.floor((Date.now()-new Date(u.created||Date.now()).getTime())/(1000*60*60*24));

  return `<div class="page">
    <div class="page-title">👤 Profil</div>

    <div class="card" style="text-align:center;margin-bottom:12px">
      <div class="profile-av" style="background:${u.color||'#1e1e2e'}">${u.username[0].toUpperCase()}</div>
      <div style="font-size:20px;font-weight:900">${u.username}</div>
      <div style="font-size:13px;color:${tier.color};font-weight:800;margin-top:4px">${tier.name} 🏅</div>
      <div style="margin:10px 0 4px">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
          <span class="muted">VIP derejesi</span>
          <span class="muted">${pct}%</span>
        </div>
        <div class="vip-bar"><div class="vip-fill" style="width:${pct}%;background:${tier.color}"></div></div>
        ${tier.max!==Infinity?`<div style="font-size:10px;color:var(--muted);margin-top:3px">Indiki derejä: ${(tier.max-u.coins).toLocaleString()} TMT</div>`:'<div style="font-size:10px;color:var(--gold);margin-top:3px">Iň ýokary dereje 👑</div>'}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">${daysJoined} gün bäri agza</div>
    </div>

    <div class="stat-grid" style="margin-bottom:12px">
      <div class="stat-card"><div class="stat-val shimmer">${u.coins.toLocaleString()}</div><div class="stat-lbl">Balans</div></div>
      <div class="stat-card"><div class="stat-val">${games}</div><div class="stat-lbl">Oýunlar</div></div>
      <div class="stat-card"><div class="stat-val green">${wins}</div><div class="stat-lbl">Ýeňişler</div></div>
      <div class="stat-card"><div class="stat-val red">${losses}</div><div class="stat-lbl">Ýeňilişler</div></div>
      <div class="stat-card"><div class="stat-val gold">${maxWin>0?'+'+maxWin.toLocaleString():'-'}</div><div class="stat-lbl">Iň uly ýeňiş</div></div>
      <div class="stat-card"><div class="stat-val">${games>0?Math.round(wins/games*100):0}%</div><div class="stat-lbl">Ýeňiş %</div></div>
    </div>

    <div class="sec-title">🎨 AVATAR REŇKI</div>
    <div class="color-picker" style="margin-bottom:14px">
      ${COLORS.map(c=>`<div class="c-dot ${u.color===c?'on':''}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('')}
    </div>

    <div class="sec-title">⚙️ HASAP</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-gray w100" onclick="go('settings')">⚙️ Sazlamalar</button>
      <button class="btn btn-out w100"  onclick="doLogout()">🔓 Ulgamdan çykmak</button>
    </div>
  </div>`;
}

function pickColor(c) {
  S.user.color = c; saveUser();
  document.querySelectorAll('.c-dot').forEach(el => el.classList.remove('on'));
  document.querySelectorAll('.c-dot').forEach(el => {
    if (el.style.background === c) el.classList.add('on');
  });
  toast('Reňk üýtgedildi ✓');
}

function doLogout() {
  if (!confirm('Çykmak isleýärsiňizmi?')) return;
  localStorage.removeItem('ch_user');
  S.user = null; go('login');
}

// ═══════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════
function renderSettings() {
  const u = S.user;
  return `<div class="page">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="back-btn" onclick="go('profile')">← Yza</button>
      <div class="page-title" style="margin:0">⚙️ Sazlamalar</div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title">HASAP MAGLUMATY</div>
      <div class="setting-row">
        <div class="setting-lbl">Ulanyjy ady</div>
        <div class="setting-val">${u.username}</div>
      </div>
      <div class="setting-row">
        <div class="setting-lbl">Balans</div>
        <div class="setting-val gold bold">${u.coins.toLocaleString()} TMT</div>
      </div>
      <div class="setting-row">
        <div class="setting-lbl">VIP derejesi</div>
        <div class="setting-val" style="color:${vipTier(u.coins).color}">${vipTier(u.coins).name}</div>
      </div>
      <div class="setting-row">
        <div class="setting-lbl">Agza boldy</div>
        <div class="setting-val">${u.created ? new Date(u.created).toLocaleDateString('ru-RU') : 'Näbelli'}</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title">AÇAR SÖZ ÜÝTGETMEK</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
        <input type="password" id="old-pass" placeholder="Köne açar sözi">
        <input type="password" id="new-pass" placeholder="Täze açar sözi (min 4)">
        <button class="btn btn-gold w100" onclick="changePass()">Açar sözi üýtgetmek</button>
      </div>
    </div>
    <div class="card">
      <div class="sec-title">HOWPLY ZONA</div>
      <button class="btn btn-red w100" onclick="resetAcc()">⚠️ Hasaby nollama (1000 TMT başlangyjy)</button>
    </div>
  </div>`;
}

function changePass() {
  const oldp = document.getElementById('old-pass').value;
  const newp = document.getElementById('new-pass').value;
  if (!oldp || !newp) return toast('Maglumatlary doldyryň');
  if (S.user.pass !== btoa(oldp)) return toast('Köne açar söz nädogry');
  if (newp.length < 4) return toast('Täze açar söz iň az 4 harp bolmaly');
  S.user.pass = btoa(newp); saveUser();
  toast('Açar söz üýtgedildi ✓'); go('profile');
}

function resetAcc() {
  if (!confirm('Hasabyňyz nollanar we 1000 TMT berilýär. Razymysyňyz?')) return;
  S.user.coins = 1000; S.user.txs = []; saveUser();
  toast('Hasap nollandy. Başlangyjy: 1000 TMT'); go('home');
}

// ═══════════════════════════════════════════
//  GAME WRAPPER
// ═══════════════════════════════════════════
const GAME_RENDERS = {
  slot: renderSlot, wheel: renderWheel, boxes: renderBoxes, crash: renderCrash,
  dice: renderDice, mines: renderMines, roulette: renderRoulette, plinko: renderPlinko, hilo: renderHilo
};

function renderGameWrap() {
  const g = GAMES.find(x=>x.id===S.gameid) || GAMES[0];
  const fn = GAME_RENDERS[S.gameid] || renderSlot;
  return `<div class="game-page">
    <div class="game-hdr">
      <button class="back-btn" onclick="go('home')">← Yza</button>
      <div style="flex:1">
        <div class="g-title">${g.icon} ${g.name}</div>
        <div class="g-sub">Maks: ${g.max}</div>
      </div>
      <div class="g-bal">💰 ${S.user.coins.toLocaleString()} TMT</div>
    </div>
    ${fn()}
  </div>`;
}

// ═══════════════════════════════════════════
//  AFTER RENDER
// ═══════════════════════════════════════════
function afterRender() {
  // games canvas init
  if (typeof gamesAfterRender === 'function') gamesAfterRender();

  // chat scroll
  const cm = document.getElementById('chat-msgs');
  if (cm) {
    cm.scrollTop = cm.scrollHeight;
    // char counter
    const inp = document.getElementById('chat-inp');
    const len = document.getElementById('chat-len');
    if (inp && len) {
      inp.addEventListener('input', () => { len.textContent = inp.value.length + '/200'; });
    }
    // poll every 2.5s (same browser)
    chatPolling = setInterval(() => { if (S.page==='chat') renderChatMsgs(); }, 2500);
  }

  // live feed rotation
  if (S.page === 'home') {
    setInterval(() => {
      const el = document.getElementById('live-feed');
      if (!el) return;
      liveItems.shift(); liveItems.push(genLive());
      el.innerHTML = liveItems.join('');
    }, 3000);
    // bonus timer countdown
    const bt = document.getElementById('bonus-t');
    if (bt) {
      setInterval(() => { if (bt.isConnected) bt.textContent = bonusTimer(); }, 60000);
    }
  }
}

// ═══════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════
loadUser();
render();
