# Take Five — setup

Two services, both free, both permanent-free at your size. Supabase stores the
accounts and games. GitHub Pages serves the app. Budget about 25 minutes.

You need nothing installed. All of this happens in a browser.

---

## 1. Create the database (about 10 minutes)

**1.1** Go to **supabase.com** and sign up. Free tier is fine.

**1.2** Click **New project**.
- Name: `take-five`
- Database password: let it generate one. You will not need it again, but save
  it somewhere anyway.
- Region: pick the one closest to you.

Wait for it to finish provisioning — usually a minute or two.

**1.3** In the left sidebar click **SQL Editor**, then **New query**.

**1.4** Open `schema.sql` from this folder, copy **the whole file**, paste it
into the editor, and click **Run**.

You should see *Success. No rows returned.* If you get a red error instead,
copy the message and send it to me — don't try to work around it.

> If the app later says **"permission denied for table ..."**, paste
> `fix-grants.sql` into a new query and run that too. It grants the `anon` role
> access to the game tables. Older Supabase projects did this automatically;
> newer ones don't. Running it twice is harmless.

**1.5** You need two values, and in the current dashboard they live on two
different pages.

**The URL** — sidebar → **Project Settings → Data API**. The **API URL** box
shows something like `https://abcdefghijkl.supabase.co/rest/v1/`. You want the
address **without** the `/rest/v1/` on the end, though the app strips it for you
if you leave it on.

**The key** — sidebar → **Project Settings → API Keys**. Under **Publishable
key**, copy the value starting `sb_publishable_...`.

> Supabase renamed these in 2025. The **publishable** key is the new name for
> what used to be called the **anon public** key — low privilege, safe to ship
> inside a web page, which is exactly what we're doing. If your project is older
> and shows an "anon public" key starting `eyJ...` instead, that works too.
>
> **Do not copy a Secret key.** Those sit right below on the same page, and one
> of them in a public web page would hand a stranger your whole database.

Leave this tab open.

---

## 2. Configure the app (2 minutes)

Open `config.js` in this folder in any text editor and fill in the top two
values:

```js
SUPABASE_URL:      'https://abcdefghijkl.supabase.co',
SUPABASE_ANON_KEY: 'eyJ...',
```

Leave `APP_URL` blank for now — you'll fill it in at step 4, once you know the
address. `REPORT_SMS` and `REPORT_EMAIL` are optional; whichever you fill in
gets a button on the question-report screen.

Save the file.

---

## 3. Put it on GitHub Pages (about 10 minutes)

**3.1** On github.com, create a **new repository**.
- Name: `take-five`
- **Public** (GitHub Pages needs public on the free plan)
- Do not add a README — you want it empty

**3.2** On the new empty repo page, click **uploading an existing file**.

**3.3** Drag in *everything from this folder*:

```
index.html
app.css
app.js
config.js
questions.json
manifest.webmanifest
sw.js
icon-180.png
icon-192.png
icon-512.png
icon-512-maskable.png
```

`SETUP.md`, `QUESTIONS.md`, `schema.sql`, `tools/` and the CSV template can go
in too — they're harmless and it's useful to keep everything together.

Commit the upload.

**3.4** In the repo go to **Settings → Pages**.
- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Save

**3.5** Wait a minute, then reload that page. It will show your address:

```
https://<your-username>.github.io/take-five/
```

Open it. You should see the sign-in screen with the note *"The first account
created becomes the admin."*

If you instead see **"Not configured yet"**, `config.js` didn't get filled in
or didn't upload. If you see **"Could not reach the database"**, the URL or key
is wrong — re-copy both from Supabase.

---

## 4. Claim admin and finish (2 minutes)

**4.1** On the live site, sign up **first**, before telling anyone else about
it. Whoever creates the first account becomes the admin, permanently. Pick your
name and a 4-digit PIN.

**4.2** Go to **Me**. You should see an **Admin** row. That confirms it worked.

**4.3** Back in `config.js`, set `APP_URL` to your address from step 3.5
(include the trailing slash), and re-upload the file to GitHub. This is what
puts a tappable link in the nudge and share messages.

**4.4** Send the address to your friends. They sign up with their own name and
PIN. Once they have, add them under **Friends → Add friend**.

---

## 5. Add it to the iOS home screen

On iPhone, in **Safari** (this does not work in Chrome on iOS):

1. Open the address.
2. Tap the **Share** button.
3. Scroll down, tap **Add to Home Screen**.
4. Tap **Add**.

It gets its own icon and opens without Safari's address bar. It launches
instantly even on a bad connection, because the app itself is cached — though
it still needs a connection to load games and save scores.

Tell your friends to do the same. Each person signs in once and stays signed in
on that device.

---

## Pushing an update

Whenever I hand you new files:

1. Go to your repo on github.com.
2. Click the file you're replacing, click the pencil (edit) icon, paste the new
   contents, and commit. Or use **Add file → Upload files** and drag the new
   version in — it overwrites.
3. Wait about a minute for GitHub Pages to rebuild.
4. Reopen the app. It picks up the new version by itself.

**One important thing when I change `app.js`, `app.css` or `index.html`:** also
edit `sw.js` and bump the version number on the first line, e.g.
`takefive-v1` → `takefive-v2`. That is what tells everyone's phone to throw
away the old cached copy. If you forget, people may keep seeing the old app
until they delete and re-add the icon.

Changing **only `questions.json`** does not need a version bump — new questions
appear on next open automatically.

---

## Where everything lives

| Thing | Where | Changed by |
|---|---|---|
| Accounts, games, scores, daily rounds | Supabase | The app, as people play |
| Questions and categories | `questions.json` in the repo | You deploying a new file |
| Which categories the Daily Five uses | Supabase `settings` table | You, in the app's admin panel |
| Your Supabase keys, app URL, scoring | `config.js` | You, by hand |

Note that question content ships **with the site**, not in the database. That's
deliberate: adding 50 questions is a file change and a deploy, not a database
migration, and the questions get cached on people's phones with the rest of the
app.

---

## Things worth knowing

**The Daily Five resets at each phone's local midnight.** Fine if everyone is
in one timezone. If you ever spread out, this needs to become a fixed timezone
computed server-side — tell me and I'll change it.

**Admin is permanent until reassigned.** The only admin can't be demoted or
deleted, so you can't lock yourself out. To add another admin: Me → Admin →
tap their name → Admin toggle.

**Security, honestly.** The anon key is public, and the policies let anyone
holding it read and write the *game* tables. PINs are hashed with bcrypt inside
Postgres and never leave it — the app can't read them even if it wanted to, and
all account changes go through database functions that check permissions. So
the realistic worst case is a stranger who finds your key messing with game
data, not taking over accounts. For a private game among friends that's a
reasonable trade. If it ever needs to be properly locked down, the upgrade is
Supabase Auth with per-user row-level security, and it's a real piece of work —
worth doing only if the threat model changes.

**Backups.** Supabase's free tier does not keep long backups. If the games
matter to you, the Table Editor has an export-to-CSV button.

---

## If something breaks

| What you see | Usually means |
|---|---|
| "Not configured yet" | `config.js` is blank or didn't upload |
| "Could not reach the database" | Wrong URL or anon key |
| "Could not load questions.json" | The file didn't upload, or is malformed |
| "permission denied for table ..." | Run `fix-grants.sql` in the SQL Editor |
| Sign-in says the PIN doesn't match | It doesn't — use admin to reset it |
| Everyone still sees the old version | You forgot to bump `CACHE` in `sw.js` |
| A red error running `schema.sql` | Send me the message; don't improvise |

Anything unexpected: screenshot it, note what you tapped, and send both over.
