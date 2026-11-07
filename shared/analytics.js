/* Web Apps visit and play tracking. Every page loads it after shared/config.js (and after
   shared/account.js when the page has sign-in):
     <script src="../shared/analytics.js" defer></script>
   It records page views, time on the page, sign-ins and, when an app asks, screens and games.
   Rows go to the analytics_events table; only the site admin can read them, and the site
   admin's own use is never recorded (this browser stops counting once an admin signs in here).
   No IP address is stored: "where" is the browser's time zone and language.
   Apps can call:  WAStats.screen(name)            a screen inside the app was opened
                   WAStats.gameStart(name)          a game began (ends any game still running)
                   WAStats.gameEnd()                the game finished or was left; sends the time played */
(function () {
  'use strict';
  const noop = () => {};
  window.WAStats = { screen: noop, gameStart: noop, gameEnd: noop };
  const CFG = window.WEBAPPS_CONFIG || {};
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY || /YOUR-PROJECT/.test(CFG.SUPABASE_URL)) return;
  if (navigator.webdriver && !window.__STATS_TEST) return;            // automated browsers don't count

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };
  if (store.get('wa.stats.off') === '1') return;                        // a site admin uses this browser

  const rid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 24);
  let vid = store.get('wa.vid');
  if (!vid) { vid = rid(); store.set('wa.vid', vid); }
  const sid = rid();

  // which app: the folder after /apps/ (the home page is "home")
  const parts = location.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('apps');
  const app = ((at >= 0 ? parts[at + 1] : parts[0]) || 'home').replace(/\.html$/, '').replace(/^index$/, 'home').slice(0, 40) || 'home';

  // what the browser says about itself
  const ua = navigator.userAgent || '';
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;          // iPads report as a Mac
  const device = /iPad|Tablet/.test(ua) || touchMac || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet'
               : /Mobi|iPhone|iPod|Android/.test(ua) ? 'phone' : 'computer';
  const os = /iPhone|iPod/.test(ua) ? 'iOS' : (/iPad/.test(ua) || touchMac) ? 'iPadOS' : /Android/.test(ua) ? 'Android'
           : /CrOS/.test(ua) ? 'ChromeOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
           : /Linux/.test(ua) ? 'Linux' : 'Other';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
                : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
                : /Safari\//.test(ua) ? 'Safari' : /AppleWebKit/.test(ua) ? 'App browser' : 'Other';
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
  const standalone = !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone);
  let ref = '';
  try { if (document.referrer) { const r = new URL(document.referrer); if (r.host !== location.host) ref = r.host; } } catch (_) {}

  const WA = window.WebApps;
  let userId = null, token = null, off = false;
  const url = CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/analytics_events';

  function stopForAdmin() { off = true; store.set('wa.stats.off', '1'); }

  function send(kind, extra, keep) {
    if (off) return;
    const row = Object.assign({ vid, sid, app, kind, user_id: userId, device, browser, os, tz: tz.slice(0, 60),
      lang: (navigator.language || '').slice(0, 20), standalone }, extra || {});
    if (kind === 'view' && ref) row.ref = ref.slice(0, 200);
    try {
      fetch(url, { method: 'POST', keepalive: !!keep, headers: {
          apikey: CFG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + (token || CFG.SUPABASE_ANON_KEY),
          'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row) }).catch(noop);
    } catch (_) {}
  }

  // time on the page: counted only while it's on screen, sent each time it goes out of view
  let shownAt = document.visibilityState === 'visible' ? Date.now() : 0;
  function flushTime() {
    if (!shownAt) return;
    const secs = Math.round((Date.now() - shownAt) / 1000); shownAt = 0;
    if (secs >= 2) send('time', { secs: Math.min(secs, 86400) }, true);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { flushTime(); flushGame(true); }
    else { shownAt = Date.now(); if (game) game.at = Date.now(); }
  });
  addEventListener('pagehide', () => { flushTime(); flushGame(true); });

  // games: time is counted while the game is on screen
  let game = null;   // {name, at, secs}
  function flushGame(pause) {
    if (!game) return;
    if (game.at) { game.secs += (Date.now() - game.at) / 1000; game.at = 0; }
    if (!pause) return;
    // the page is going away or out of view: send what we have so far, keep counting if it comes back
    if (game.secs >= 2) send('game_end', { name: game.name, secs: Math.round(Math.min(game.secs, 86400)) }, true);
    game.secs = 0;
  }
  window.WAStats = {
    screen(name) { if (name) send('screen', { name: String(name).slice(0, 80) }); },
    gameStart(name) { if (game) this.gameEnd(); game = { name: String(name || 'game').slice(0, 80), at: Date.now(), secs: 0 };
      send('game_start', { name: game.name }); },
    gameEnd() { if (!game) return; flushGame(false);
      if (game.secs >= 1) send('game_end', { name: game.name, secs: Math.round(Math.min(game.secs, 86400)) }); game = null; },
  };

  async function readToken() {
    try { const r = await WA.client.auth.getSession(); token = r && r.data && r.data.session ? r.data.session.access_token : null; }
    catch (_) { token = null; }
  }

  async function start() {
    if (WA && WA.ready) {
      try { await Promise.race([WA.ready, new Promise(r => setTimeout(r, 4000))]); } catch (_) {}
      const me = WA.me;
      if (me && me.is_admin) return stopForAdmin();
      if (me && WA.client) { userId = me.id; await readToken(); }
      let last = userId;
      WA.onChange(async m => {
        const id = m ? m.id : null;
        if (m && m.is_admin) return stopForAdmin();
        if (id === last) { if (id && WA.client) await readToken(); return; }      // profile refresh, new token
        if (!id) { send('signout'); userId = null; token = null; }
        else { userId = id; if (WA.client) await readToken(); send('signin'); }
        last = id;
      });
    }
    send('view');
  }
  start();
})();
