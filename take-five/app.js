/* ============================================================
   Take Five — production app
   Data lives in Supabase. Questions live in questions.json, which ships
   with the site, so adding questions is a file change and a deploy.
   Everything you configure is in config.js.
   ============================================================ */
'use strict';

const CFG = window.TAKE_FIVE_CONFIG || {};
const QUESTION_MS       = (CFG.QUESTION_SECONDS  || 15) * 1000;
const POINTS_CORRECT    =  CFG.POINTS_CORRECT    || 200;
const POINTS_PER_SECOND =  CFG.POINTS_PER_SECOND || 5;
const APP_URL     = CFG.APP_URL     || '';
const REPORT_SMS  = CFG.REPORT_SMS  || '';
const REPORT_EMAIL= CFG.REPORT_EMAIL|| '';
const PHOTO_PX = 256;
const SESSION_KEY = 'takefive.session';

/* ---------------- content, loaded from questions.json ---------------- */
let CATEGORIES = [];      // [{id,name,desc,color,colorLight,primary}]
let BANK = {};            // cid -> [question]
let QBYID = {};           // qid -> {id,category,q,answers}

const cat = id => CATEGORIES.find(c => c.id === id);
const catName = id => cat(id)?.name || id;

async function loadContent(){
  const res = await fetch('questions.json', {cache:'no-cache'});
  if(!res.ok) throw new Error('Could not load questions.json');
  const d = await res.json();
  CATEGORIES = d.categories || [];
  BANK = {}; QBYID = {};
  (d.questions||[]).forEach(q=>{
    (BANK[q.category] = BANK[q.category] || []).push(q);
    QBYID[q.id] = q;
  });
  CATEGORIES = CATEGORIES.filter(c => (BANK[c.id]||[]).length > 0);
  /* Category colours are content, not code — they come from the same file. */
  const root = document.documentElement;
  CATEGORIES.forEach(c=>{
    root.style.setProperty('--c-'+c.id, c.color || '#8D93A6');
    root.style.setProperty('--cl-'+c.id, c.colorLight || c.color || '#5A6172');
  });
  applyCategoryColours();
}
/* Light mode wants the darker variant of each category colour. */
function applyCategoryColours(){
  const light = isLightMode();
  const root = document.documentElement;
  CATEGORIES.forEach(c=>{
    root.style.setProperty('--c-'+c.id, light ? (c.colorLight||c.color) : c.color);
  });
}
const catColor = id => 'var(--c-'+id+')';

/* ---------------- Supabase ---------------- */
const API = {
  /* Forgiving about what gets pasted in: the dashboard shows the URL with
     /rest/v1/ on the end, and people paste it with or without a slash. */
  get base(){
    return (CFG.SUPABASE_URL||'').trim()
      .replace(/\/+$/,'').replace(/\/rest\/v1$/,'') + '/rest/v1';
  },
  headers(extra){
    const key = (CFG.SUPABASE_ANON_KEY||'').trim();
    /* Legacy anon keys are JWTs and expect an Authorization header too.
       The newer sb_publishable_ keys are NOT JWTs — sending one as a Bearer
       token makes the platform try to parse it as a JWT and reject the whole
       request with "Invalid JWT". So only send it when it actually is one. */
    const h = { apikey: key, 'Content-Type': 'application/json' };
    if(key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
    return Object.assign(h, extra||{});
  },
  async handle(res){
    if(res.status === 204) return null;
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch(e){ body = text; }
    if(!res.ok){
      const msg = (body && (body.message || body.error_description || body.error)) || ('HTTP '+res.status);
      const err = new Error(msg); err.body = body; err.status = res.status;
      throw err;
    }
    return body;
  },
  async get_(path){
    return this.handle(await fetch(this.base + '/' + path, {headers: this.headers()}));
  },
  async post(path, body, prefer){
    return this.handle(await fetch(this.base + '/' + path, {
      method:'POST', headers:this.headers(prefer?{Prefer:prefer}:null), body:JSON.stringify(body)
    }));
  },
  async patch(path, body){
    return this.handle(await fetch(this.base + '/' + path, {
      method:'PATCH', headers:this.headers({Prefer:'return=representation'}), body:JSON.stringify(body)
    }));
  },
  async rpc(fn, args){
    return this.handle(await fetch(this.base + '/rpc/' + fn, {
      method:'POST', headers:this.headers(), body:JSON.stringify(args||{})
    }));
  }
};

/* Turn the database's raise-exception names into something a person can read. */
const ERRORS = {
  bad_pin:'That PIN does not match this name.',
  pin_format:'PIN must be 4 digits.',
  name_required:'Enter a name.',
  name_taken:'Someone already uses that name.',
  not_admin:'You are not an admin.',
  last_admin:'There has to be at least one admin.',
  cannot_delete_self:'You cannot delete the account you are signed in to.',
  need_one_category:'Pick at least one category.',
  no_user:'That account no longer exists.'
};
function niceError(e){
  const raw = (e && e.message) || '';
  for(const k in ERRORS) if(raw.indexOf(k) >= 0) return ERRORS[k];
  if(/failed to fetch|networkerror|load failed/i.test(raw)) return 'No connection. Try again when you are back online.';
  return raw || 'Something went wrong.';
}

/* ---------------- state ---------------- */
const S = { me:null, users:[], matches:[], daily:null, dailyCategories:['general'] };
const byId = id => S.users.find(u => u.id === id);
let me = null;

async function refresh(){
  const [users, matches, settings] = await Promise.all([
    API.get_('users_public?select=*'),
    API.get_('matches?select=*,match_players(*)&order=created_at.desc'),
    API.get_('settings?key=eq.daily_categories&select=value')
  ]);
  S.users = users || [];
  S.matches = (matches || []).map(m => ({...m, players: m.match_players || []}));
  S.dailyCategories = (settings && settings[0] && settings[0].value) || ['general'];
  if(me) me = byId(me.id) || me;
  await refreshDaily();
}
async function refreshDaily(){
  const rows = await API.get_('daily_rounds?day=eq.'+dateKey()+'&select=*,daily_players(*)');
  S.daily = rows && rows[0] ? {...rows[0], players:(rows[0].daily_players||[]).map(p=>({...p,status:'done'}))} : null;
}

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e;};
const initials = n => (n||'?').trim().slice(0,1).toUpperCase();
function ago(ts){
  const m = Math.round((Date.now() - new Date(ts).getTime())/60000);
  if(m<1) return 'just now'; if(m<60) return m+'m ago';
  const h = Math.round(m/60); if(h<24) return h+'h ago';
  return Math.round(h/24)+'d ago';
}
function shuffle(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function avatar(u,size){
  const d = el('div','av');
  if(!u) { d.textContent='?'; return d; }
  if(u.photo){ d.classList.add('photo'); d.style.backgroundImage='url('+u.photo+')'; }
  else { d.textContent=initials(u.name); d.style.background=u.color||'#8D93A6'; }
  if(size){ d.style.width=d.style.height=size+'px'; d.style.fontSize=(size*.4)+'px'; }
  return d;
}
const addCircle = () => el('div','av add','<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>');
function rankOf(match,userId){
  const done = match.players.filter(p=>p.status==='done').sort((a,b)=>b.score-a.score);
  const i = done.findIndex(p=>p.userId===userId || p.user_id===userId);
  return i<0 ? null : i+1;
}
const ORD = n => ['','1st','2nd','3rd','4th','5th','6th','7th','8th'][n] || n+'th';
const myFriends = () => (me.friends||[]).map(byId).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
const uid = p => p.user_id;

function headToHead(otherId){
  let w=0,l=0,t=0,mySum=0,theirSum=0;
  S.matches.forEach(m=>{
    const a = m.players.find(p=>uid(p)===me.id && p.status==='done');
    const b = m.players.find(p=>uid(p)===otherId && p.status==='done');
    if(!a||!b) return;
    t++; mySum+=a.score; theirSum+=b.score;
    if(a.score>b.score) w++; else if(a.score<b.score) l++;
  });
  return {w,l,t,myAvg:t?Math.round(mySum/t):0,theirAvg:t?Math.round(theirSum/t):0};
}

let bannerTimer=null;
function banner(msg, kind){
  const b = $('#banner');
  clearTimeout(bannerTimer);
  b.className = kind || '';
  b.textContent = msg;
  b.hidden = false;
  bannerTimer = setTimeout(()=>{ b.hidden=true; }, kind==='bad' ? 6000 : 3000);
}
function busy(btn, on, label){
  if(on){ btn.dataset.label = btn.textContent; btn.classList.add('busy'); btn.textContent = label||'Working…'; }
  else { btn.classList.remove('busy'); if(btn.dataset.label) btn.textContent = btn.dataset.label; }
}

/* ---------------- theme ---------------- */
function themeMode(){ try{ return localStorage.getItem('takefive.theme') || 'dark'; }catch(e){ return 'dark'; } }
function isLightMode(){
  const m = themeMode();
  if(m==='light') return true;
  if(m==='dark') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
}
function applyTheme(){
  const m = themeMode();
  document.documentElement.setAttribute('data-mode', m);
  document.querySelectorAll('#theme-seg button').forEach(b=>
    b.setAttribute('aria-pressed', String(b.dataset.mode===m)));
  applyCategoryColours();
}
document.querySelectorAll('#theme-seg button').forEach(b=>b.addEventListener('click',()=>{
  try{ localStorage.setItem('takefive.theme', b.dataset.mode); }catch(e){}
  applyTheme();
}));
if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyCategoryColours);
}

/* ---------------- navigation ---------------- */
const SCREENS = ['signin','home','play','new','friends','me'];
const RENDER = {home:renderHome, play:renderPlay, friends:renderFriends, me:renderMe};
function show(name){
  SCREENS.forEach(s => $('#s-'+s).hidden = s!==name);
  $('#nav').hidden = (name==='signin');
  document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-current', String(b.dataset.tab===name)));
  const sc = $('#s-'+name); if(sc) sc.scrollTop = 0;
}
document.querySelectorAll('#nav button').forEach(b=>b.addEventListener('click', async ()=>{
  const t = b.dataset.tab;
  show(t);
  try{ if(t==='home'||t==='play'){ await refresh(); } RENDER[t]?.(); }
  catch(e){ RENDER[t]?.(); banner(niceError(e),'bad'); }
}));

/* ---------------- sign in ---------------- */
$('#btn-signin').addEventListener('click', signIn);
$('#in-pin').addEventListener('keydown', e=>{ if(e.key==='Enter') signIn(); });

async function signIn(){
  const name = $('#in-name').value.trim(), pin = $('#in-pin').value.trim(), err = $('#signin-err');
  err.textContent = '';
  if(!name){ err.textContent = 'Enter a name.'; return; }
  if(!/^\d{4}$/.test(pin)){ err.textContent = 'PIN must be 4 digits.'; return; }
  const btn = $('#btn-signin'); busy(btn, true, 'Signing in…');
  try{
    const row = await API.rpc('sign_in', {p_name:name, p_pin:pin});
    me = Array.isArray(row) ? row[0] : row;
    try{ localStorage.setItem(SESSION_KEY, me.id); }catch(e){}
    await refresh();
    me = byId(me.id) || me;
    renderHome(); show('home');
  }catch(e){ err.textContent = niceError(e); }
  finally{ busy(btn, false); }
}

/* ---------------- home ---------------- */
const myMatches = () => S.matches.filter(m => m.players.some(p=>uid(p)===me.id));

function renderHome(){
  const who = $('#home-user'); who.innerHTML='';
  who.append(document.createTextNode(me.name), avatar(me,30));

  const mine = myMatches();
  const yourTurn = mine.filter(m => m.players.find(p=>uid(p)===me.id).status !== 'done').length;
  const played   = mine.filter(m => m.players.find(p=>uid(p)===me.id).status === 'done');
  const wins     = played.filter(m => rankOf(m, me.id) === 1).length;

  const tally = {};
  played.forEach(m => { tally[m.category_id] = (tally[m.category_id]||0)+1; });
  const topCat = Object.keys(tally).sort((a,b)=>tally[b]-tally[a])[0];

  const tiles = [];
  if(yourTurn) tiles.push({v:yourTurn, k:'Waiting on you', cls:'turn'});
  tiles.push({v:played.length, k:'Games played'});
  tiles.push({v:wins, k:'First-place finishes'});
  tiles.push({v: topCat ? catName(topCat) : '—', k:'Most played', word:!!topCat});

  const mw = $('#home-metrics'); mw.innerHTML='';
  tiles.forEach(t=>{
    const d = el('div','metric'+(t.cls?' '+t.cls:''));
    const v = el('div','v'+(t.word?' word':''), String(t.v));
    if(t.word && topCat) v.style.color = catColor(topCat);
    d.append(v, el('div','k',t.k));
    mw.appendChild(d);
  });

  const feed = $('#home-feed'); feed.innerHTML='';
  if(!mine.length){ feed.appendChild(el('div','empty','No games yet.<br>Head to Play to start one.')); return; }
  mine.forEach(m=>{
    const mine_ = m.players.find(p=>uid(p)===me.id);
    const waiting = m.players.filter(p=>p.status!=='done').length;
    const row = el('button','match card');
    const stripe = el('div','stripe'); stripe.style.background = catColor(m.category_id);
    const mid = el('div');
    mid.appendChild(el('div','cat', catName(m.category_id)));
    const starter = m.created_by===me.id ? 'You started' : ((byId(m.created_by)?.name||'Someone')+' started');
    mid.appendChild(el('div','sub', starter+' · '+ago(m.created_at)));
    const sl = el('div'); sl.style.marginTop='7px';
    sl.appendChild(el('span', waiting?'pill wait':'pill done', waiting?'Waiting on '+waiting:'Complete'));
    mid.appendChild(sl);

    const right = el('div','right');
    if(mine_.status === 'done'){
      right.appendChild(el('div','score num', String(mine_.score)));
      right.appendChild(el('div','rank', ORD(rankOf(m,me.id))+' of '+m.players.filter(p=>p.status==='done').length));
    } else {
      right.appendChild(el('div','score','▶'));
      right.appendChild(el('div','rank','Your turn'));
    }
    row.append(stripe, mid, right);
    row.addEventListener('click', ()=> mine_.status==='done'
      ? openResults(m,false,'home')
      : startMatch(m,'home'));
    feed.appendChild(row);
  });
}

/* ---------------- friends ---------------- */
function renderFriends(){
  const list = $('#friends-list'); list.innerHTML='';
  const fr = myFriends();
  fr.forEach(u=>{
    const h = headToHead(u.id);
    const b = el('button','person');
    b.append(avatar(u), el('div','nm',u.name), el('div','meta', h.t ? h.w+'–'+h.l : 'No games yet'));
    const chev = document.createElementNS('http://www.w3.org/2000/svg','svg');
    chev.setAttribute('viewBox','0 0 24 24'); chev.setAttribute('class','chev');
    chev.innerHTML = '<path d="M9 5l7 7-7 7"/>';
    b.append(chev);
    b.addEventListener('click', ()=>openFriend(u.id));
    list.appendChild(b);
  });
  if(!fr.length) list.appendChild(el('div','empty','No friends added yet.'));
  const add = el('button','person');
  add.append(addCircle(), el('div','nm','Add friend'));
  add.addEventListener('click', ()=>openPicker('friend'));
  list.appendChild(add);
}

let fsUser = null;
function openFriend(id){
  fsUser = byId(id);
  const h = headToHead(id);
  const av = $('#fs-av'); av.innerHTML='';
  const a = avatar(fsUser,64); a.style.margin='0 auto'; av.appendChild(a);
  $('#fs-name').textContent = fsUser.name;
  $('#fs-sub').textContent = h.t
    ? 'Rating '+h.w+'–'+h.l+(h.t-h.w-h.l ? ' ('+(h.t-h.w-h.l)+' tied)' : '')
    : 'You have not played a game together';
  $('#fs-w').textContent=h.w; $('#fs-l').textContent=h.l; $('#fs-t').textContent=h.t;
  $('#fs-avg').textContent = h.t ? 'Average score — you '+h.myAvg+', '+fsUser.name+' '+h.theirAvg : '';
  $('#friendsheet').hidden = false;
}
$('#fs-close').addEventListener('click', ()=>{ $('#friendsheet').hidden = true; });
$('#fs-challenge').addEventListener('click', ()=>{ $('#friendsheet').hidden=true; renderNew(fsUser.id); show('new'); });
$('#fs-remove').addEventListener('click', async ()=>{
  const btn = $('#fs-remove'); busy(btn,true,'Removing…');
  try{
    const next = (me.friends||[]).filter(x=>x!==fsUser.id);
    me = await saveProfile({p_friends: next});
    $('#friendsheet').hidden = true; renderFriends();
  }catch(e){ banner(niceError(e),'bad'); }
  finally{ busy(btn,false); }
});

async function saveProfile(patch){
  const row = await API.rpc('update_profile', Object.assign(
    {p_user: me.id, p_name:null, p_photo:null, p_friends:null}, patch));
  const u = Array.isArray(row) ? row[0] : row;
  const i = S.users.findIndex(x=>x.id===u.id);
  if(i>=0) S.users[i]=u; else S.users.push(u);
  return u;
}

/* ---------------- user picker ---------------- */
let pkMode = 'friend';
function openPicker(mode){
  pkMode = mode;
  $('#pk-title').textContent = mode==='friend' ? 'Add friend' : 'Add players';
  $('#pk-search').value=''; $('#picker').hidden=false;
  renderPicker(''); setTimeout(()=>$('#pk-search').focus(), 60);
}
function pickerPool(){
  const exclude = new Set([me.id]);
  if(pkMode==='friend') (me.friends||[]).forEach(id=>exclude.add(id));
  else draft.pool.forEach(id=>exclude.add(id));
  return S.users.filter(u=>!exclude.has(u.id)).sort((a,b)=>a.name.localeCompare(b.name));
}
function renderPicker(q){
  const list = $('#pk-list'); list.innerHTML='';
  const hits = pickerPool().filter(u=>u.name.toLowerCase().includes(q.trim().toLowerCase()));
  $('#pk-empty').hidden = hits.length>0;
  hits.forEach(u=>{
    const b = el('button','person');
    b.append(avatar(u), el('div','nm',u.name),
      el('div','chk','<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'));
    b.addEventListener('click', async ()=>{
      try{
        const next = (me.friends||[]).slice();
        if(!next.includes(u.id)) next.push(u.id);
        me = await saveProfile({p_friends: next});
        if(pkMode==='invite'){
          if(!draft.pool.includes(u.id)) draft.pool.push(u.id);
          draft.invited.add(u.id);
          $('#picker').hidden = true; renderInvite();
        } else { renderPicker($('#pk-search').value); renderFriends(); }
      }catch(e){ banner(niceError(e),'bad'); }
    });
    list.appendChild(b);
  });
}
$('#pk-search').addEventListener('input', e=>renderPicker(e.target.value));
$('#pk-close').addEventListener('click', ()=>{ $('#picker').hidden = true; });

/* ---------------- new game ---------------- */
$('#tile-online').addEventListener('click', ()=>{ renderNew(); show('new'); });
$('#new-cancel').addEventListener('click', ()=>{ renderPlay(); show('play'); });

let draft = {categoryId:null, invited:new Set(), pool:[]};
function catButton(c){
  const b = el('button','catbtn');
  b.setAttribute('aria-pressed', String(draft.categoryId===c.id));
  b.style.color = catColor(c.id);
  const d = el('span','dot'); d.style.background = catColor(c.id);
  b.append(d, el('span','nm',c.name), el('span','ct', c.desc||''));
  b.dataset.cat = c.id;
  b.addEventListener('click', ()=>{
    draft.categoryId = draft.categoryId===c.id ? null : c.id;
    document.querySelectorAll('.catbtn').forEach(x=>
      x.setAttribute('aria-pressed', String(x.dataset.cat===draft.categoryId)));
    refreshStart();
  });
  return b;
}
function renderNew(preselectId){
  draft = {categoryId:null, invited:new Set(), pool: myFriends().map(u=>u.id)};
  if(preselectId){
    if(!draft.pool.includes(preselectId)) draft.pool.push(preselectId);
    draft.invited.add(preselectId);
  }
  const g = $('#cat-grid'); g.innerHTML='';
  CATEGORIES.filter(c=>c.primary).forEach(c=>g.appendChild(catButton(c)));
  const more = $('#cat-more'); more.innerHTML='';
  CATEGORIES.filter(c=>!c.primary).sort((a,b)=>a.name.localeCompare(b.name))
    .forEach(c=>more.appendChild(catButton(c)));
  more.hidden = true;
  $('#cat-toggle').setAttribute('aria-expanded','false');
  $('#cat-toggle-label').textContent = 'More categories';
  renderInvite();
}
$('#cat-toggle').addEventListener('click', ()=>{
  const t = $('#cat-toggle'), open = t.getAttribute('aria-expanded')==='true';
  t.setAttribute('aria-expanded', String(!open));
  $('#cat-more').hidden = open;
  $('#cat-toggle-label').textContent = open ? 'More categories' : 'Fewer categories';
});
function renderInvite(){
  const list = $('#invite-list'); list.innerHTML='';
  const people = draft.pool.map(byId).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
  people.forEach(u=>{
    const b = el('button','person');
    b.setAttribute('aria-pressed', String(draft.invited.has(u.id)));
    b.append(avatar(u), el('div','nm',u.name),
      el('div','chk','<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'));
    b.addEventListener('click', ()=>{
      draft.invited.has(u.id) ? draft.invited.delete(u.id) : draft.invited.add(u.id);
      b.setAttribute('aria-pressed', String(draft.invited.has(u.id)));
      refreshStart();
    });
    list.appendChild(b);
  });
  if(!people.length) list.appendChild(el('div','empty','No friends yet — add someone below.'));
  const add = el('button','person');
  add.append(addCircle(), el('div','nm','Add someone else'));
  add.addEventListener('click', ()=>openPicker('invite'));
  list.appendChild(add);
  refreshStart();
}
function refreshStart(){
  const ok = draft.categoryId && draft.invited.size>0;
  $('#btn-start').disabled = !ok;
  $('#btn-start').textContent = ok ? 'Start · '+draft.invited.size+' invited' : 'Start';
}
$('#btn-start').addEventListener('click', async ()=>{
  const btn = $('#btn-start'); busy(btn,true,'Starting…');
  try{
    const qids = shuffle(BANK[draft.categoryId].map(q=>q.id)).slice(0,5);
    const rows = await API.post('matches',
      {category_id:draft.categoryId, created_by:me.id, question_ids:qids}, 'return=representation');
    const m = rows[0];
    const players = [{match_id:m.id, user_id:me.id}]
      .concat([...draft.invited].map(id=>({match_id:m.id, user_id:id})));
    await API.post('match_players', players);
    const match = {...m, players: players.map(p=>({...p, status:'waiting'}))};
    S.matches.unshift(match);
    startMatch(match, 'play');
  }catch(e){ banner(niceError(e),'bad'); }
  finally{ busy(btn,false); }
});

/* ---------------- daily five ---------------- */
function dateKey(d){
  const t = d || new Date();
  return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
}
function seededRand(seed){
  let h = 2166136261;
  for(let i=0;i<seed.length;i++){ h ^= seed.charCodeAt(i); h = Math.imul(h,16777619); }
  return ()=>{ h += 0x6D2B79F5; let t=h; t = Math.imul(t^t>>>15, t|1); t ^= t + Math.imul(t^t>>>7, t|61);
    return ((t^t>>>14)>>>0)/4294967296; };
}
function dailyCategories(){
  const ids = (S.dailyCategories||['general']).filter(id => (BANK[id]||[]).length);
  return ids.length ? ids : (CATEGORIES[0] ? [CATEGORIES[0].id] : []);
}
/* The first person to play each day writes the round; everyone else reads it.
   Seeding from the date means two people racing produce the same five anyway. */
async function ensureDaily(){
  if(S.daily) return S.daily;
  const day = dateKey();
  const cats = dailyCategories().slice().sort();
  const pool = [];
  cats.forEach(cid => BANK[cid].forEach(q => pool.push(q.id)));
  pool.sort();
  const rnd = seededRand('takefive|'+day+'|'+cats.join(','));
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  try{
    await API.post('daily_rounds',
      {day, categories:cats, question_ids:pool.slice(0,5)},
      'resolution=ignore-duplicates,return=minimal');
  }catch(e){ /* someone else got there first, which is fine */ }
  await refreshDaily();
  return S.daily;
}
const myDailyToday = () => (S.daily?.players||[]).find(p=>uid(p)===me.id);
function dailyRoster(){
  const circle = [me.id, ...(me.friends||[])];
  return circle.map(id=>{
    const p = (S.daily?.players||[]).find(x=>uid(x)===id);
    return p || {user_id:id, status:'waiting'};
  }).filter(p => byId(uid(p)));
}
function openDailyResults(animate, from){
  const p = myDailyToday(); if(!p) return;
  showResults({kind:'daily', player:p, title:'Daily Five', roster:dailyRoster(), animate, from});
}

/* ---------------- play screen ---------------- */
async function renderPlay(){
  const tile = $('#tile-daily');
  tile.innerHTML = '';
  tile.appendChild(el('span','tag','Today'));
  tile.appendChild(el('h3','','Daily Five'));
  tile.appendChild(el('p','','Loading…'));
  try{
    await ensureDaily();
  }catch(e){
    tile.lastChild.textContent = 'Could not load today’s round.';
    return;
  }
  const mine = myDailyToday();
  const names = (S.daily?.categories||[]).map(catName).join(' · ');
  const streak = await loadStreak();
  tile.innerHTML = '';
  tile.appendChild(el('span','tag', streak > 1 ? streak+'-day streak' : (mine ? 'Played' : 'Today')));
  tile.appendChild(el('h3','','Daily Five'));
  if(mine){
    const done = dailyRoster().filter(p=>p.status==='done').sort((a,b)=>b.score-a.score);
    const rank = done.findIndex(p=>uid(p)===me.id)+1;
    tile.appendChild(el('p','','You scored '+mine.score+' — '+ORD(rank)+' of '+done.length+' so far. Resets at midnight.'));
  } else {
    tile.appendChild(el('p','','Same five questions for everyone today, from '+names+'. One go only.'));
  }
  tile.classList.toggle('played', !!mine);
}
$('#tile-daily').addEventListener('click', ()=>{
  if(!S.daily) return;
  myDailyToday() ? openDailyResults(false,'play') : startDaily('play');
});

/* ---------------- game engine ---------------- */
let G = null, returnTo = 'home';

function buildQ(qid){
  const q = QBYID[qid];
  if(!q) return null;
  return {qid, cid:q.category, text:q.q, options:shuffle(q.answers), correct:q.answers[0]};
}
function beginGame({title, qs, onFinish, from}){
  returnTo = from || 'home';
  G = {qs, idx:0, answers:[], raf:null, startedAt:0, onFinish};
  $('#gcat').textContent = title;
  $('#qstage').innerHTML = '';
  $('#game').hidden = false; $('#results').hidden = true; $('#nav').hidden = true;
  countdown(title, ()=>renderQuestion(0));
}
function startMatch(match, from){
  const qs = (match.question_ids||[]).map(buildQ).filter(Boolean);
  if(!qs.length){ banner('These questions are no longer in the question bank.','bad'); return; }
  beginGame({
    title: catName(match.category_id), qs, from,
    onFinish: async r => {
      try{
        await API.patch('match_players?match_id=eq.'+match.id+'&user_id=eq.'+me.id,
          {status:'done', correct:r.correct, base:r.base, bonus:r.bonus, score:r.score,
           answers:r.answers, played_at:new Date().toISOString()});
        const p = match.players.find(x=>uid(x)===me.id);
        Object.assign(p, {status:'done', ...r});
      }catch(e){ banner('Score saved on this device only — '+niceError(e),'bad');
        Object.assign(match.players.find(x=>uid(x)===me.id), {status:'done', ...r}); }
      showResults({kind:'match', match, player:match.players.find(x=>uid(x)===me.id),
        title:catName(match.category_id), roster:match.players, animate:true});
    }
  });
}
function startDaily(from){
  const qs = (S.daily?.question_ids||[]).map(buildQ).filter(Boolean);
  if(!qs.length){ banner('Today’s round could not be built.','bad'); return; }
  beginGame({
    title:'Daily Five', qs, from,
    onFinish: async r => {
      const row = {day:dateKey(), user_id:me.id, correct:r.correct, base:r.base,
                   bonus:r.bonus, score:r.score, answers:r.answers};
      try{ await API.post('daily_players', [row], 'return=minimal'); }
      catch(e){ banner('Score saved on this device only — '+niceError(e),'bad'); }
      S.daily.players.push({...row, status:'done'});
      openDailyResults(true);
    }
  });
}
function countdown(title, done){
  const ov = $('#countdown'), t = $('#cd-text');
  ov.hidden = false; ov.classList.remove('fade');
  const beats = [[title,1100],['Ready',750],['Go',600]];
  let i = 0;
  (function step(){
    if(i>=beats.length){
      ov.classList.add('fade');
      setTimeout(()=>{ ov.hidden=true; ov.classList.remove('fade'); done(); }, 360);
      return;
    }
    t.textContent = beats[i][0];
    t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
    setTimeout(()=>{ i++; step(); }, beats[i][1]);
  })();
}
function renderQuestion(i){
  const q = G.qs[i];
  $('#gprog').textContent = 'Q'+(i+1)+' / '+G.qs.length;
  const card = el('div','qcard in');
  card.appendChild(el('div','qtext', q.text));
  const wrap = el('div','answers');
  q.options.forEach(opt=>{
    const b = el('button','ans'); b.textContent = opt;
    b.addEventListener('click', ()=>{
      if(wrap.classList.contains('locked')) return;
      wrap.classList.add('locked'); b.classList.add('picked'); commit(opt);
    });
    wrap.appendChild(b);
  });
  card.appendChild(wrap);
  const old = $('#qstage').firstElementChild;
  if(old){ old.classList.remove('in'); old.classList.add('out'); setTimeout(()=>old.remove(), 360); }
  $('#qstage').appendChild(card);
  startTimer();
}
function startTimer(){
  cancelAnimationFrame(G.raf);
  G.startedAt = performance.now();
  const bar = $('#tbar'), num = $('#tnum');
  bar.classList.remove('low');
  (function tick(now){
    const left = Math.max(0, QUESTION_MS - ((now||performance.now()) - G.startedAt));
    bar.style.transform = 'scaleX('+(left/QUESTION_MS)+')';
    num.textContent = (left/1000).toFixed(1);
    if(left <= 5000) bar.classList.add('low');
    if(left <= 0){ commit(null); return; }
    G.raf = requestAnimationFrame(tick);
  })();
}
function commit(choice){
  cancelAnimationFrame(G.raf);
  const leftMs = Math.max(0, QUESTION_MS - (performance.now() - G.startedAt));
  const q = G.qs[G.idx];
  const right = choice != null && choice === q.correct;
  const secs = right ? Math.min(CFG.QUESTION_SECONDS||15, Math.ceil(leftMs/1000)) : 0;
  G.answers.push({qid:q.qid, picked:choice, right, bonus:secs*POINTS_PER_SECOND});
  G.idx++;
  setTimeout(()=>{ G.idx < G.qs.length ? renderQuestion(G.idx) : finish(); }, choice!=null ? 280 : 120);
}
function finish(){
  const correct = G.answers.filter(a=>a.right).length;
  const base = correct * POINTS_CORRECT;
  const bonus = G.answers.reduce((s,a)=>s+a.bonus, 0);
  const result = {correct, base, bonus, score: base+bonus,
    answers: G.answers.map(a=>({qid:a.qid, picked:a.picked, right:a.right}))};
  const done = G.onFinish;
  $('#game').hidden = true;
  done(result);
}

/* ---------------- results ---------------- */
let reviewCtx = null;
function showResults({kind, match, player, title, roster, animate, from}){
  if(from) returnTo = from;
  $('#r-cat').textContent = title;
  $('#r-total').textContent = player.score;
  $('#r-outof-t').textContent = player.correct+' out of '+(player.answers?.length||5)+' correct';
  reviewCtx = {player};
  $('#r-outof').disabled = !(player.answers && player.answers.length);
  $('#r-correct').textContent = '+'+player.base;
  $('#r-bonus').textContent = '+'+player.bonus;
  $('#r-sum').textContent = player.score;
  renderLeaderboard(roster);
  if(kind==='match'){ renderNudge(match); $('#daily-share').hidden = true; }
  else { $('#nudge-wrap').hidden = true; nudgeCtx = null; $('#daily-share').hidden = false; }
  $('#results').hidden = false; $('#results').scrollTop = 0; $('#nav').hidden = true;
  const ov = $('#r-ovl');
  if(animate){
    ov.hidden = false; ov.classList.remove('fade');
    setTimeout(()=>{ ov.classList.add('fade');
      setTimeout(()=>{ ov.hidden=true; ov.classList.remove('fade'); }, 400); }, 1400);
  } else ov.hidden = true;
}
function openResults(match, animate, from){
  showResults({kind:'match', match, player:match.players.find(x=>uid(x)===me.id),
    title:catName(match.category_id), roster:match.players, animate, from});
}
function ribbon(place){
  const v = ['var(--rib1)','var(--rib2)','var(--rib3)'][place-1];
  const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('class','ribbon');
  s.innerHTML = '<path d="M8.6 13.4 6.2 21l5.8-2.6 5.8 2.6-2.4-7.6" style="fill:'+v+';opacity:.55"/>'+
                '<circle cx="12" cy="9" r="6.2" style="fill:'+v+'"/>'+
                '<text x="12" y="12.1" text-anchor="middle" font-family="DM Mono, monospace" font-size="7.2" style="fill:var(--ribink)">'+place+'</text>';
  return s;
}
function renderLeaderboard(roster){
  const lb = $('#r-lb'); lb.innerHTML='';
  const done = roster.filter(p=>p.status==='done').sort((a,b)=>b.score-a.score);
  const wait = roster.filter(p=>p.status!=='done')
    .sort((a,b)=>(byId(uid(a))?.name||'').localeCompare(byId(uid(b))?.name||''));
  done.forEach((p,i)=>{
    const u = byId(uid(p));
    const row = el('div','lbrow'+(uid(p)===me.id?' me':''));
    row.appendChild(i<3 ? ribbon(i+1) : el('div','pos',String(i+1)));
    row.append(avatar(u,30), el('div','nm',(u?.name||'Someone')+(uid(p)===me.id?' (you)':'')),
      el('div','sc', String(p.score)));
    lb.appendChild(row);
  });
  wait.forEach(p=>{
    const u = byId(uid(p));
    const row = el('div','lbrow waiting');
    row.append(el('div','pos','–'), avatar(u,30), el('div','nm', u?.name||'Someone'),
      el('div','sc w','Waiting'));
    lb.appendChild(row);
  });
}
$('#r-close').addEventListener('click', async ()=>{
  $('#results').hidden = true; G = null;
  show(returnTo);
  try{ await refresh(); }catch(e){}
  RENDER[returnTo]?.();
});

/* ---------------- nudge / share ---------------- */
let nudgeCtx = null;
function listNames(a){
  if(a.length===1) return a[0];
  if(a.length===2) return a[0]+' and '+a[1];
  return a.slice(0,-1).join(', ')+' and '+a[a.length-1];
}
function renderNudge(match){
  const waiting = match.players.filter(p=>p.status!=='done' && uid(p)!==me.id)
    .map(p=>byId(uid(p))).filter(Boolean);
  const wrap = $('#nudge-wrap');
  $('#nudge-status').textContent='';
  if(!waiting.length){ wrap.hidden = true; nudgeCtx = null; return; }
  const names = waiting.map(u=>u.name).sort();
  nudgeCtx = {match, names};
  $('#btn-nudge').textContent = 'Nudge '+listNames(names);
  wrap.hidden = false;
}
function nudgeText(){
  const {match, names} = nudgeCtx;
  const lines = [
    'I just played the '+catName(match.category_id)+' round on Take Five — you\'re up.',
    names.length>1 ? 'Still waiting on '+listNames(names)+'.' : ''
  ].filter(Boolean);
  if(APP_URL) lines.push(APP_URL);
  return lines.join('\n');
}
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
async function handOff(txt, statusEl){
  if(navigator.share){
    try{ await navigator.share({text:txt}); return; }
    catch(e){ if(e && e.name==='AbortError') return; }
  }
  const sep = isIOS ? '&' : '?';
  try{ window.location.href = 'sms:'+sep+'body='+encodeURIComponent(txt); return; }catch(e){}
  try{ await navigator.clipboard.writeText(txt); statusEl.textContent = 'Copied — paste it into a message.'; }
  catch(e){ statusEl.textContent = 'Could not open Messages on this device.'; }
}
$('#btn-nudge').addEventListener('click', ()=>handOff(nudgeText(), $('#nudge-status')));
$('#daily-share').addEventListener('click', ()=>{
  const p = myDailyToday(); if(!p) return;
  const grid = (p.answers||[]).map(a=>a.right?'●':'○').join(' ');
  const txt = 'Take Five — Daily '+dateKey()+'\n'+grid+'\n'+p.correct+'/5 · '+p.score+' points'+(APP_URL?'\n'+APP_URL:'');
  handOff(txt, $('#nudge-status'));
});

/* ---------------- answer review ---------------- */
const TICK  = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

$('#r-outof').addEventListener('click', ()=>{
  if(!reviewCtx) return;
  renderReview(); $('#reviewsheet').hidden = false; $('#reviewsheet .sheetbody').scrollTop = 0;
});
$('#rv-close').addEventListener('click', ()=>{ $('#reviewsheet').hidden = true; });

function renderReview(){
  const {player} = reviewCtx;
  const list = $('#rv-list'); list.innerHTML='';
  (player.answers||[]).forEach((a,n)=>{
    const q = QBYID[a.qid];
    const item = el('div','rvitem');
    const top = el('div','rvtop');
    top.appendChild(el('div','rvmark '+(a.right?'ok':'no'), a.right?TICK:CROSS));
    top.appendChild(el('div','rvq', (n+1)+'. '+(q ? q.q : 'This question has since been removed.')));
    item.appendChild(top);

    if(q){
      const correctAns = q.answers[0];
      const ans = el('div','rvans');
      if(a.right){
        const l = el('div','rvline ok');
        l.append(el('div','lab','Answer'), el('div','val', correctAns));
        ans.appendChild(l);
      } else {
        const y = el('div','rvline '+(a.picked?'no':'miss'));
        y.append(el('div','lab','You'), el('div','val', a.picked || 'Ran out of time'));
        const c = el('div','rvline ok');
        c.append(el('div','lab','Correct'), el('div','val', correctAns));
        ans.append(y,c);
      }
      item.appendChild(ans);

      const foot = el('div','rvfoot');
      foot.appendChild(el('div','qid', a.qid.toUpperCase()));
      const rb = el('button','reportbtn','Report');
      rb.addEventListener('click', ()=>openReport(a.qid));
      foot.appendChild(rb);
      item.appendChild(foot);
    }
    list.appendChild(item);
  });
}

/* ---------------- report a question ---------------- */
let rpCtx = null;
function reportText(){
  const q = QBYID[rpCtx.qid];
  return ['Take Five — question report',
    'ID: '+rpCtx.qid,
    'Category: '+catName(q.category),
    'Question: '+q.q,
    'Stored correct answer: '+q.answers[0],
    'Reported by: '+me.name,
    '',
    'Comments: '+(rpCtx.note||'(none)')].join('\n');
}
function openReport(qid){
  rpCtx = {qid, note:''};
  const q = QBYID[qid];
  $('#rp-id').textContent = qid.toUpperCase();
  $('#rp-q').textContent = q.q;
  $('#rp-note').value=''; $('#rp-status').textContent='';
  $('#rp-text').hidden = !REPORT_SMS;
  $('#rp-mail').hidden = !REPORT_EMAIL;
  $('#reportsheet').hidden = false;
  setTimeout(()=>$('#rp-note').focus(), 60);
}
$('#rp-close').addEventListener('click', ()=>{ $('#reportsheet').hidden = true; });
$('#rp-note').addEventListener('input', e=>{ if(rpCtx) rpCtx.note = e.target.value; });
function openLink(href, label){
  try{ window.location.href = href; }
  catch(e){ $('#rp-status').textContent = 'Could not open '+label+'. Use Copy report instead.'; }
}
$('#rp-text').addEventListener('click', ()=>{
  const sep = isIOS ? '&' : '?';
  openLink('sms:'+REPORT_SMS+sep+'body='+encodeURIComponent(reportText()), 'Messages');
});
$('#rp-mail').addEventListener('click', ()=>{
  openLink('mailto:'+REPORT_EMAIL+'?subject='+encodeURIComponent('Take Five report '+rpCtx.qid)
           +'&body='+encodeURIComponent(reportText()), 'Mail');
});
$('#rp-copy').addEventListener('click', async ()=>{
  const txt = reportText(), st = $('#rp-status');
  try{ await navigator.clipboard.writeText(txt); st.textContent = 'Copied. Paste it into a message.'; }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    st.textContent = ok ? 'Copied. Paste it into a message.'
                        : 'Could not copy automatically — select the text above and copy it.';
  }
});

/* ---------------- me ---------------- */
/* Consecutive days played, counting back from today — or from yesterday if
   today is still open, so an unplayed morning doesn't read as a broken run. */
let streakCache = 0;
async function loadStreak(){
  try{
    const rows = await API.get_('daily_players?user_id=eq.'+me.id+'&select=day&order=day.desc&limit=90');
    const days = new Set((rows||[]).map(r=>r.day));
    let n = 0, cursor = new Date();
    if(!days.has(dateKey())) cursor = new Date(Date.now() - 86400000);
    while(days.has(dateKey(cursor))){ n++; cursor = new Date(cursor.getTime() - 86400000); }
    streakCache = n;
  }catch(e){ streakCache = 0; }
  return streakCache;
}

function renderMe(){
  const av = $('#me-av'); av.innerHTML=''; av.appendChild(avatar(me,52));
  $('#me-name').textContent = me.name;
  $('#row-name-v').textContent = me.name;
  $('#row-removephoto').hidden = !me.photo;
  const played = S.matches.filter(m=>m.players.some(p=>uid(p)===me.id && p.status==='done')).length;
  const wins = S.matches.filter(m=>rankOf(m, me.id)===1).length;
  $('#me-stats').textContent = played+' games played · '+wins+' first-place finishes'
    + (streakCache ? ' · '+streakCache+'-day daily streak' : '');
  $('#row-admin').hidden = !me.is_admin;
  applyTheme();
  loadStreak().then(n=>{
    $('#me-stats').textContent = played+' games played · '+wins+' first-place finishes'
      + (n ? ' · '+n+'-day daily streak' : '');
  });
}

$('#me-photo').addEventListener('click', ()=>$('#photo-input').click());
$('#photo-input').addEventListener('change', e=>{
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if(!file) return;
  const err = $('#photo-err'); err.textContent='';
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = async ()=>{
    URL.revokeObjectURL(url);
    const side = Math.min(img.width, img.height);
    const cv = document.createElement('canvas');
    cv.width = cv.height = PHOTO_PX;
    cv.getContext('2d').drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,PHOTO_PX,PHOTO_PX);
    try{
      me = await saveProfile({p_photo: cv.toDataURL('image/jpeg', 0.82)});
      renderMe(); renderHome();
    }catch(e2){ err.textContent = niceError(e2); }
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); err.textContent = 'That file could not be read as an image.'; };
  img.src = url;
});
$('#row-removephoto').addEventListener('click', async ()=>{
  try{ me = await saveProfile({p_photo:''}); renderMe(); renderHome(); }
  catch(e){ banner(niceError(e),'bad'); }
});

/* edit sheet: name / PIN */
let edMode = 'name';
function openEdit(mode){
  edMode = mode;
  $('#ed-err').textContent = '';
  $('#ed-f2').hidden = true; $('#ed-f3').hidden = true;
  $('#ed-i1').value=''; $('#ed-i2').value=''; $('#ed-i3').value='';
  if(mode==='name'){
    $('#ed-title').textContent = 'Display name';
    $('#ed-l1').textContent = 'Name'; $('#ed-i1').type='text'; $('#ed-i1').value = me.name;
  } else {
    $('#ed-title').textContent = 'Change PIN';
    $('#ed-l1').textContent = 'Current PIN'; $('#ed-i1').type='password';
    $('#ed-l2').textContent = 'New PIN'; $('#ed-f2').hidden = false;
    $('#ed-l3').textContent = 'Confirm new PIN'; $('#ed-f3').hidden = false;
  }
  $('#editsheet').hidden = false;
  setTimeout(()=>$('#ed-i1').focus(), 60);
}
$('#row-name').addEventListener('click', ()=>openEdit('name'));
$('#row-pin').addEventListener('click', ()=>openEdit('pin'));
$('#ed-close').addEventListener('click', ()=>{ $('#editsheet').hidden = true; });
$('#ed-save').addEventListener('click', async ()=>{
  const err = $('#ed-err'), btn = $('#ed-save');
  busy(btn, true, 'Saving…');
  try{
    if(edMode==='name'){
      const n = $('#ed-i1').value.trim();
      if(!n){ err.textContent='Enter a name.'; return; }
      me = await saveProfile({p_name:n});
    } else {
      const cur = $('#ed-i1').value.trim(), a = $('#ed-i2').value.trim(), b = $('#ed-i3').value.trim();
      if(!/^\d{4}$/.test(a)){ err.textContent='New PIN must be 4 digits.'; return; }
      if(a!==b){ err.textContent='The two new PINs do not match.'; return; }
      await API.rpc('change_pin', {p_user:me.id, p_current:cur, p_new:a});
    }
    $('#editsheet').hidden = true; renderMe(); renderHome(); renderFriends();
  }catch(e){ err.textContent = niceError(e); }
  finally{ busy(btn, false); }
});

$('#dev-signout').addEventListener('click', ()=>{
  try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
  me = null;
  $('#in-name').value=''; $('#in-pin').value=''; show('signin');
});

/* ---------------- admin ---------------- */
$('#row-admin').addEventListener('click', ()=>{ if(me.is_admin) openAdmin(); });
$('#ad-close').addEventListener('click', ()=>{ $('#adminsheet').hidden = true; });
function openAdmin(){ renderAdmin(); $('#adminsheet').hidden = false; $('#adminsheet .sheetbody').scrollTop = 0; }

function renderAdmin(){
  const chips = $('#ad-cats'); chips.innerHTML='';
  const picked = new Set(dailyCategories());
  CATEGORIES.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(c=>{
    const b = el('button','chip');
    b.setAttribute('aria-pressed', String(picked.has(c.id)));
    b.style.color = catColor(c.id);
    const d = el('span','dot'); d.style.background = catColor(c.id);
    b.append(d, document.createTextNode(c.name));
    b.addEventListener('click', async ()=>{
      const cur = new Set(dailyCategories());
      if(cur.has(c.id)){ if(cur.size===1) return; cur.delete(c.id); } else cur.add(c.id);
      try{
        await API.rpc('admin_set_daily_categories', {p_actor:me.id, p_categories:[...cur]});
        S.dailyCategories = [...cur];
        renderAdmin();
      }catch(e){ banner(niceError(e),'bad'); }
    });
    chips.appendChild(b);
  });

  const list = $('#ad-users'); list.innerHTML='';
  S.users.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(u=>{
    const b = el('button','person');
    b.append(avatar(u), el('div','nm', u.name+(u.id===me.id?' (you)':'')));
    if(u.is_admin) b.appendChild(el('span','badge','Admin'));
    const chev = document.createElementNS('http://www.w3.org/2000/svg','svg');
    chev.setAttribute('viewBox','0 0 24 24'); chev.setAttribute('class','chev');
    chev.innerHTML = '<path d="M9 5l7 7-7 7"/>';
    b.append(chev);
    b.addEventListener('click', ()=>openUser(u.id));
    list.appendChild(b);
  });

  $('#ad-bank').innerHTML = CATEGORIES.slice().sort((a,b)=>a.name.localeCompare(b.name))
    .map(c=>c.name+' — '+BANK[c.id].length).join('<br>');
}

/* ---------------- manage one account ---------------- */
let adminTarget = null, delArmed = false, delTimer = null;
const adminCount = () => S.users.filter(u=>u.is_admin).length;

function openUser(id){
  adminTarget = id; renderUserSheet();
  $('#adminsheet').hidden = true; $('#usersheet').hidden = false;
  $('#usersheet .sheetbody').scrollTop = 0;
}
function disarmDelete(){
  clearTimeout(delTimer); delArmed = false;
  const b = $('#us-delete'); b.classList.remove('armed'); b.textContent = 'Delete account';
}
function renderUserSheet(){
  const u = byId(adminTarget); if(!u) return;
  $('#us-title').textContent = u.name;
  const av = $('#us-av'); av.innerHTML='';
  const a = avatar(u,64); a.style.margin='0 auto'; av.appendChild(a);
  $('#us-name').textContent = u.name;
  const played = S.matches.filter(m=>m.players.some(p=>uid(p)===u.id && p.status==='done')).length;
  $('#us-meta').textContent = played+' games played'+(u.is_admin?' · admin':'');

  const sw = $('#us-admin');
  sw.setAttribute('aria-pressed', String(!!u.is_admin));
  const lastAdmin = u.is_admin && adminCount()===1;
  sw.disabled = lastAdmin;
  $('#us-adminnote').textContent = lastAdmin
    ? 'This is the only admin. Make someone else an admin before removing this one.'
    : 'Admins can reset PINs, manage accounts and set the Daily Five categories.';

  $('#us-p1').value=''; $('#us-p2').value=''; $('#us-pinmsg').textContent='';
  $('#us-pinmsg').style.color = 'var(--ink3)';

  const isMe = u.id === me.id;
  $('#us-delete').disabled = isMe || lastAdmin;
  $('#us-delnote').textContent = isMe
    ? 'You cannot delete the account you are signed in to.'
    : lastAdmin ? 'You cannot delete the only admin.'
    : 'Removes '+u.name+' from every game, leaderboard and friends list. This cannot be undone.';
  disarmDelete();
}
$('#us-close').addEventListener('click', ()=>{ disarmDelete(); $('#usersheet').hidden = true; openAdmin(); });

$('#us-admin').addEventListener('click', async ()=>{
  const u = byId(adminTarget); if(!u) return;
  try{
    await API.rpc('admin_set_role', {p_actor:me.id, p_target:u.id, p_is_admin: !u.is_admin});
    u.is_admin = !u.is_admin;
    if(u.id===me.id && !u.is_admin){
      me = u; $('#usersheet').hidden = true; renderMe(); show('me'); return;
    }
    renderUserSheet();
  }catch(e){ banner(niceError(e),'bad'); }
});
$('#us-savepin').addEventListener('click', async ()=>{
  const u = byId(adminTarget); if(!u) return;
  const a = $('#us-p1').value.trim(), b = $('#us-p2').value.trim(), msg = $('#us-pinmsg');
  if(!/^\d{4}$/.test(a)){ msg.style.color='var(--bad)'; msg.textContent='PIN must be 4 digits.'; return; }
  if(a!==b){ msg.style.color='var(--bad)'; msg.textContent='The two PINs do not match.'; return; }
  const btn = $('#us-savepin'); busy(btn,true,'Saving…');
  try{
    await API.rpc('admin_set_pin', {p_actor:me.id, p_target:u.id, p_new:a});
    $('#us-p1').value=''; $('#us-p2').value='';
    msg.style.color='var(--acc)'; msg.textContent='PIN updated for '+u.name+'.';
  }catch(e){ msg.style.color='var(--bad)'; msg.textContent = niceError(e); }
  finally{ busy(btn,false); }
});
/* Two-tap delete: the first tap arms it for 5 seconds, the second commits. */
$('#us-delete').addEventListener('click', async ()=>{
  const u = byId(adminTarget); if(!u) return;
  const b = $('#us-delete');
  if(!delArmed){
    delArmed = true; b.classList.add('armed'); b.textContent = 'Tap again to delete '+u.name;
    delTimer = setTimeout(disarmDelete, 5000);
    return;
  }
  clearTimeout(delTimer); delArmed = false;
  busy(b, true, 'Deleting…');
  try{
    await API.rpc('admin_delete_user', {p_actor:me.id, p_target:u.id});
    await refresh();
    $('#usersheet').hidden = true; openAdmin();
  }catch(e){ banner(niceError(e),'bad'); }
  finally{ busy(b,false); disarmDelete(); }
});

/* ---------------- boot ---------------- */
function bootFail(msg){
  $('#boot-msg').innerHTML = msg;
}
async function boot(){
  applyTheme();
  if(!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY){
    bootFail('<strong>Not configured yet.</strong><br>Open <code>config.js</code> and fill in your Supabase URL and anon key.');
    return;
  }
  try{
    await loadContent();
  }catch(e){
    bootFail('Could not load <code>questions.json</code>.<br>'+niceError(e));
    return;
  }
  let sessionId = null;
  try{ sessionId = localStorage.getItem(SESSION_KEY); }catch(e){}
  try{
    await refresh();
  }catch(e){
    bootFail('Could not reach the database.<br>'+niceError(e)+
      '<br><br>Check the URL and anon key in <code>config.js</code>.');
    return;
  }
  $('#boot').hidden = true;
  if(sessionId && byId(sessionId)){
    me = byId(sessionId);
    renderHome(); show('home');
  } else {
    if(!S.users.length) $('#signin-note').textContent = 'The first account created becomes the admin.';
    else $('#signin-note').hidden = true;
    show('signin');
  }
}
boot();

/* Service worker: caches the shell so the app opens instantly and survives a
   dropped connection, and picks up a new deploy the next time it is opened. */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
