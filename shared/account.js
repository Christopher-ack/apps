/* Web Apps shared account code (Brick Builds, GameRoom, the kids video app, ...). Every app loads:
     <script src="../shared/config.js"></script>
     <script src="../shared/vendor/supabase.js"></script>
     <script src="../shared/account.js"></script>
   then uses window.WebApps. All apps live on the same site, so one sign-in covers them all.
   With no Supabase settings in config.js it runs in "this browser only" mode, which is handy
   for trying things out. */
(function () {
  'use strict';
  const CFG = window.WEBAPPS_CONFIG || {};
  const ACCOUNT_EMAIL_DOMAIN = 'users.webapps.invalid';   // must match EMAIL_DOMAIN in the accounts function
  const emailFor = u => `${String(u).trim().toLowerCase().replace(/^@/, '')}@${ACCOUNT_EMAIL_DOMAIN}`;
  const USERNAME = /^[a-z0-9._-]{3,20}$/;
  const REMOTE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !/YOUR-PROJECT/.test(CFG.SUPABASE_URL) && window.supabase);

  class WAError extends Error { constructor(msg, code) { super(msg); this.code = code; } }
  const MESSAGES = {
    'wa:not_member': "They aren't in that app.",
    'wa:not_signed_in': 'Sign in first.', 'wa:no_such_app': "That app doesn't exist.",
    'wa:not_admin': 'Only an admin can do that.', 'wa:not_allowed': "You can't change that.",
  };
  const friendly = e => {
    const m = (e && (e.message || e.error_description || e.error)) || String(e || '');
    const code = (m.match(/wa:\w+/) || [])[0];
    if (code) return new WAError(MESSAGES[code] || m, code);
    if (/invalid login|invalid credentials/i.test(m)) return new WAError("That username and password don't match.", 'bad_login');
    if (/failed to fetch|network/i.test(m)) return new WAError("Couldn't reach the server. Check your connection.", 'offline');
    return new WAError(m || 'Something went wrong.', 'error');
  };

  // ---------------------------------------------------------------- Supabase
  function remoteBackend() {
    const sb = window.supabase.createClient(CFG.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, ''), CFG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'webapps-auth' },
    });
    const ok = r => { if (r.error) throw friendly(r.error); return r.data; };
    async function fn(body) {
      const { data, error } = await sb.functions.invoke('accounts', { body });
      if (error) {
        let msg = error.message;
        try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (_) {}
        throw friendly({ message: msg });
      }
      if (data && data.error) throw friendly({ message: data.error });
      return data;
    }
    const uid = async () => (await sb.auth.getSession()).data.session?.user?.id || null;
    return {
      sb,
      async session() { return uid(); },
      async signIn(u, p) { ok(await sb.auth.signInWithPassword({ email: emailFor(u), password: p })); },
      async signUp(o) { await fn({ action: 'signup', ...o }); await this.signIn(o.username, o.password); },
      async createAccount(o) { return (await fn({ action: 'signup', ...o })).user_id; },   // an admin making an account for someone else
      async signOut() { await sb.auth.signOut(); },
      async account(id) { return ok(await sb.from('accounts').select('id,username,display_name,avatar,is_admin,created_at').eq('id', id).maybeSingle()); },
      async apps() { return ok(await sb.from('apps').select('*').order('sort')); },
      async memberships(id) { return ok(await sb.from('app_members').select('*').eq('user_id', id)); },
      async join(app) { return ok(await sb.rpc('join_app', { p_app: app })); },
      async leave(app) { ok(await sb.rpc('leave_app', { p_app: app })); },
      async updateProfile(id, fields) { ok(await sb.from('accounts').update(fields).eq('id', id)); },
      async changePassword(username, current, next) {
        const r = await sb.auth.signInWithPassword({ email: emailFor(username), password: current });
        if (r.error) throw new WAError("Your current password isn't right.", 'bad_login');
        ok(await sb.auth.updateUser({ password: next }));
      },
      async rename(id, username) { await fn({ action: 'rename', user_id: id, username }); },
      async signupsAllowed() { const d = ok(await sb.from('site_settings').select('allow_signups').eq('id', 1).maybeSingle()); return d ? d.allow_signups : true; },
      async setSignupsAllowed(on) { ok(await sb.rpc('set_allow_signups', { p_on: on })); },
      async listAccounts() { return ok(await sb.from('accounts').select('id,username,display_name,avatar,is_admin,created_at').order('username')); },
      async listMembers() { return ok(await sb.from('app_members').select('*')); },
      async setMember(app, user, status, role) { ok(await sb.rpc('set_member', { p_app: app, p_user: user, p_status: status ?? null, p_role: role ?? null })); },
      async removeMember(app, user) { ok(await sb.rpc('remove_member', { p_app: app, p_user: user })); },
      async setMemberSettings(app, user, settings) { ok(await sb.rpc('set_member_settings', { p_app: app, p_user: user, p_settings: settings })); },
      async setPassword(user, password) { await fn({ action: 'set_password', user_id: user, password }); },
      async setAdmin(user, value) { await fn({ action: 'set_admin', user_id: user, value }); },
      async deleteAccount(user) { await fn({ action: 'delete', user_id: user }); },
      onAuth(cb) { sb.auth.onAuthStateChange(() => cb()); },
    };
  }

  // ---------------------------------------------------------------- this browser only
  function localBackend() {
    const KEY = 'webapps.local.v1';
    const APPS = [{ slug: 'brick-builds', name: 'Brick Builds', join_mode: 'open', sort: 1 },
                  { slug: 'gameroom', name: 'GameRoom', join_mode: 'open', sort: 2 },
                  { slug: 'remix', name: 'Remix', join_mode: 'request', sort: 3 }];
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (_) { return null; } };
    const db = () => load() || { accounts: [], members: [], settings: { allow_signups: true }, session: null };
    const save = d => localStorage.setItem(KEY, JSON.stringify(d));
    const pub = a => a && ({ id: a.id, username: a.username, display_name: a.display_name, avatar: a.avatar || null, is_admin: !!a.is_admin, created_at: a.created_at });
    const need = d => { const a = d.accounts.find(x => x.id === d.session); if (!a) throw new WAError('Sign in first.', 'wa:not_signed_in'); return a; };
    const isAppAdmin = (d, a, app) => a.is_admin || d.members.some(m => m.user_id === a.id && m.app === app && m.status === 'active' && m.role === 'admin');
    let listeners = [];
    const fire = () => listeners.forEach(f => f());
    return {
      async session() { return db().session; },
      async signIn(u, p) {
        const d = db(); const a = d.accounts.find(x => x.username === String(u).trim().toLowerCase().replace(/^@/, ''));
        if (!a || a.password !== p) throw new WAError("That username and password don't match.", 'bad_login');
        d.session = a.id; save(d); fire();
      },
      async signUp(o) {
        const d = db(); const username = String(o.username || '').trim().toLowerCase().replace(/^@/, '');
        if (!USERNAME.test(username)) throw new WAError('Usernames are 3 to 20 letters, numbers, dots, dashes or underscores.');
        if (String(o.password || '').length < 6) throw new WAError('Passwords need at least 6 characters.');
        const name = String(o.display_name || '').trim().slice(0, 40); if (!name) throw new WAError('Enter your name.');
        const me = d.accounts.find(x => x.id === d.session);
        if (d.accounts.length && !d.settings.allow_signups && !(me && me.is_admin)) throw new WAError('New accounts are turned off. Ask an admin to make one for you.');
        if (d.accounts.some(x => x.username === username)) throw new WAError('That username is taken.');
        const a = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), username, display_name: name, password: o.password,
                    avatar: null, is_admin: !d.accounts.length, created_at: new Date().toISOString() };
        d.accounts.push(a); if (!me) d.session = a.id; save(d); fire();
        return a.id;
      },
      async signOut() { const d = db(); d.session = null; save(d); fire(); },
      async createAccount(o) { return this.signUp(o); },   // signUp keeps the admin signed in when someone is already signed in
      async account(id) { return pub(db().accounts.find(x => x.id === id)); },
      async apps() { return APPS.slice(); },
      async memberships(id) { return db().members.filter(m => m.user_id === id); },
      async join(app) {
        const d = db(); const a = need(d); const ap = APPS.find(x => x.slug === app); if (!ap) throw new WAError("That app doesn't exist.");
        const m = d.members.find(x => x.user_id === a.id && x.app === app); if (m) return m.status;
        const status = ap.join_mode === 'open' || a.is_admin ? 'active' : 'pending';
        d.members.push({ user_id: a.id, app, status, role: 'member', settings: {}, created_at: new Date().toISOString() }); save(d); return status;
      },
      async leave(app) { const d = db(); const a = need(d); d.members = d.members.filter(m => !(m.user_id === a.id && m.app === app)); save(d); },
      async updateProfile(id, f) { const d = db(); const a = need(d); if (a.id !== id && !a.is_admin) throw new WAError("You can't change that.");
        const t = d.accounts.find(x => x.id === id); if ('display_name' in f) t.display_name = String(f.display_name).trim().slice(0, 40); if ('avatar' in f) t.avatar = f.avatar; save(d); },
      async changePassword(u, cur, next) { const d = db(); const a = need(d); if (a.password !== cur) throw new WAError("Your current password isn't right.", 'bad_login'); a.password = next; save(d); },
      async rename(id, username) { const d = db(); const a = need(d); username = String(username).trim().toLowerCase().replace(/^@/, '');
        if (a.id !== id && !a.is_admin) throw new WAError('You can only change your own username.');
        if (!USERNAME.test(username)) throw new WAError('Usernames are 3 to 20 letters, numbers, dots, dashes or underscores.');
        if (d.accounts.some(x => x.username === username && x.id !== id)) throw new WAError('That username is taken.');
        d.accounts.find(x => x.id === id).username = username; save(d); },
      async signupsAllowed() { return db().settings.allow_signups; },
      async setSignupsAllowed(on) { const d = db(); if (!need(d).is_admin) throw new WAError('Only an admin can do that.'); d.settings.allow_signups = !!on; save(d); },
      async listAccounts() { return db().accounts.map(pub).sort((a, b) => a.username.localeCompare(b.username)); },
      async listMembers() { const d = db(); const a = need(d); return d.members.filter(m => m.user_id === a.id || isAppAdmin(d, a, m.app)); },
      async setMember(app, user, status, role) { const d = db(); const a = need(d); if (!isAppAdmin(d, a, app)) throw new WAError('Only an admin can do that.');
        let m = d.members.find(x => x.user_id === user && x.app === app);
        if (!m) { m = { user_id: user, app, status: 'active', role: 'member', settings: {}, created_at: new Date().toISOString() }; d.members.push(m); }
        if (status) m.status = status; if (role) m.role = role; save(d); },
      async setMemberSettings(app, user, settings) { const d = db(); const a = need(d); if (!isAppAdmin(d, a, app)) throw new WAError('Only an admin can do that.');
        const m = d.members.find(x => x.user_id === user && x.app === app); if (!m) throw new WAError("They aren't in that app.");
        m.settings = Object.assign({}, m.settings || {}, settings || {}); save(d); },
      async removeMember(app, user) { const d = db(); const a = need(d); if (!isAppAdmin(d, a, app)) throw new WAError('Only an admin can do that.');
        d.members = d.members.filter(m => !(m.user_id === user && m.app === app)); save(d); },
      async setPassword(user, pw) { const d = db(); if (!need(d).is_admin) throw new WAError('Only an admin can set someone\'s password.');
        if (String(pw).length < 6) throw new WAError('Passwords need at least 6 characters.'); d.accounts.find(x => x.id === user).password = pw; save(d); },
      async setAdmin(user, value) { const d = db(); if (!need(d).is_admin) throw new WAError('Only an admin can do that.');
        if (!value && d.accounts.filter(x => x.is_admin).length <= 1) throw new WAError('Keep at least one site admin.');
        d.accounts.find(x => x.id === user).is_admin = !!value; save(d); },
      async deleteAccount(user) { const d = db(); const a = need(d); if (a.id !== user && !a.is_admin) throw new WAError('You can only delete your own account.');
        const t = d.accounts.find(x => x.id === user); if (t && t.is_admin && d.accounts.filter(x => x.is_admin).length <= 1) throw new WAError('Make someone else a site admin first.');
        d.accounts = d.accounts.filter(x => x.id !== user); d.members = d.members.filter(m => m.user_id !== user); if (d.session === user) d.session = null; save(d); fire(); },
      onAuth(cb) { listeners.push(cb); addEventListener('storage', e => { if (e.key === KEY) cb(); }); },
    };
  }

  // ---------------------------------------------------------------- public API
  const B = REMOTE ? remoteBackend() : localBackend();
  const subs = [];
  const WA = {
    mode: REMOTE ? 'supabase' : 'local', me: null, error: null, USERNAME,
    client: B.sb || null,                               // the Supabase client, for each app's own tables
    onChange(cb) { subs.push(cb); return () => subs.splice(subs.indexOf(cb), 1); },
    async refresh() {
      try { const id = await B.session(); WA.me = id ? await B.account(id) : null; WA.error = null; }
      catch (e) { WA.error = friendly(e); }
      subs.forEach(f => { try { f(WA.me); } catch (_) {} });
      return WA.me;
    },
    async signIn(username, password) { try { await B.signIn(username, password); } catch (e) { throw friendly(e); } return WA.refresh(); },
    async signUp(o) { try { await B.signUp(o); } catch (e) { throw friendly(e); } return WA.refresh(); },
    async signOut() { await B.signOut(); return WA.refresh(); },
    async apps() {
      const [apps, mine] = await Promise.all([B.apps(), WA.me ? B.memberships(WA.me.id) : []]);
      return apps.map(a => { const m = mine.find(x => x.app === a.slug); return { ...a, status: m ? m.status : null, role: m ? m.role : null, settings: (m && m.settings) || {} }; });
    },
    async join(app) { try { return await B.join(app); } catch (e) { throw friendly(e); } },
    async leave(app) { try { await B.leave(app); } catch (e) { throw friendly(e); } },
    /** Use at the top of an app: makes sure someone is signed in and a member. Returns the account, or null. */
    async requireApp(app) { const me = WA.me || await WA.refresh(); if (!me) return null; const a = (await WA.apps()).find(x => x.slug === app);
      return a && a.status === 'active' ? me : null; },
    async updateProfile(fields) { try { await B.updateProfile(WA.me.id, fields); } catch (e) { throw friendly(e); } return WA.refresh(); },
    async changePassword(current, next) { if (String(next).length < 6) throw new WAError('Passwords need at least 6 characters.');
      try { await B.changePassword(WA.me.username, current, next); } catch (e) { throw friendly(e); } },
    async rename(username) { try { await B.rename(WA.me.id, username); } catch (e) { throw friendly(e); } return WA.refresh(); },
    async signupsAllowed() { try { return await B.signupsAllowed(); } catch (_) { return true; } },
    admin: {
      setSignupsAllowed: on => B.setSignupsAllowed(on).catch(e => { throw friendly(e); }),
      accounts: () => B.listAccounts().catch(e => { throw friendly(e); }),
      members: () => B.listMembers().catch(e => { throw friendly(e); }),
      setMember: (app, user, status, role) => B.setMember(app, user, status, role).catch(e => { throw friendly(e); }),
      removeMember: (app, user) => B.removeMember(app, user).catch(e => { throw friendly(e); }),
      setMemberSettings: (app, user, settings) => B.setMemberSettings(app, user, settings).catch(e => { throw friendly(e); }),
      setPassword: (user, pw) => B.setPassword(user, pw).catch(e => { throw friendly(e); }),
      setAdmin: (user, v) => B.setAdmin(user, v).catch(e => { throw friendly(e); }),
      deleteAccount: user => B.deleteAccount(user).catch(e => { throw friendly(e); }).then(() => WA.refresh()),
      createAccount: o => B.createAccount(o).catch(e => { throw friendly(e); }),
    },
    // ---------- avatars ----------
    COLORS: ['#E8B04B', '#FF5C62', '#4ED08E', '#3FC4D8', '#9B8CFF', '#D9822B', '#4FA3FF', '#FF8FB1'],
    colorFor(name) { let x = 0; for (const c of String(name)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return WA.COLORS[x % WA.COLORS.length]; },
    avatarHTML(acc, cls = '') {
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      if (!acc) return `<span class="wa-av ${cls} wa-anon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="4.2"/><path d="M3.8 20.4c.9-4.1 4.2-6.4 8.2-6.4s7.3 2.3 8.2 6.4c.1.5-.3.9-.8.9H4.6c-.5 0-.9-.4-.8-.9z"/></svg></span>`;
      if (acc.avatar) return `<span class="wa-av ${cls}"><img src="${esc(acc.avatar)}" alt=""></span>`;
      return `<span class="wa-av ${cls}" style="--h:${WA.colorFor(acc.display_name || acc.username)}">${esc(([...String(acc.display_name || acc.username).trim()][0] || '?').toUpperCase())}</span>`;
    },
    readAvatar(file) {
      return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => {
        const m = 256, s = Math.min(im.width, im.height), cv = document.createElement('canvas'); cv.width = cv.height = m;
        cv.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, m, m); res(cv.toDataURL('image/jpeg', 0.82)); };
        im.onerror = rej; im.src = fr.result; }; fr.onerror = rej; fr.readAsDataURL(file); });
    },
  };
  B.onAuth(() => WA.refresh());
  WA.ready = WA.refresh();
  window.WebApps = WA;
})();
