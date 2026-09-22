/* ============================================================
   Take Five — the only file you need to edit to go live.
   ============================================================ */

window.TAKE_FIVE_CONFIG = {

  /* From Supabase.
     URL — Project Settings -> Data API -> API URL. Paste the project address;
     the trailing /rest/v1/ is stripped automatically if you leave it on.
     KEY — Project Settings -> API Keys -> "Publishable key" (sb_publishable_...).
     Older projects call this the "anon public" key (eyJ...); either works.
     NEVER paste a secret key here — it ships inside this page. */
  SUPABASE_URL:      '',   // e.g. 'https://abcdefghijkl.supabase.co'
  SUPABASE_ANON_KEY: '',   // e.g. 'sb_publishable_...'  (or a legacy eyJ... anon key)

  /* Where the app lives once it is deployed. Gets added to nudge and share
     messages so people can tap straight through. Leave blank to omit it. */
  APP_URL: '',             // e.g. 'https://yourname.github.io/take-five/'

  /* Where question reports go. Fill in either, both, or neither —
     a blank one hides its button, and "Copy report" always works. */
  REPORT_SMS:   '',        // e.g. '+15551234567'
  REPORT_EMAIL: '',        // e.g. 'you@example.com'

  /* Seconds per question, and how scoring works.
     Correct answers are worth far more than speed on purpose: someone who
     gets all five right slowly should still beat someone who got two fast. */
  QUESTION_SECONDS:  15,
  POINTS_CORRECT:    200,
  POINTS_PER_SECOND: 5
};
