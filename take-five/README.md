# Take Five

Five questions, played whenever you get to it. A private async trivia game for
a small group of friends.

- **[SETUP.md](SETUP.md)** — get it running: Supabase, GitHub Pages, iOS home screen
- **[QUESTIONS.md](QUESTIONS.md)** — add questions and categories

## What's in here

| File | What it is |
|---|---|
| `index.html` | The page |
| `app.css` | All styles. Dark by default, full light palette |
| `app.js` | The whole app |
| `config.js` | **The only file you edit.** Keys, app URL, scoring |
| `questions.json` | Categories and questions — the content |
| `schema.sql` | Paste into Supabase once |
| `sw.js` | Service worker. Bump `CACHE` when you deploy app changes |
| `manifest.webmanifest`, `icon-*.png` | Makes it installable on iOS |
| `tools/add-questions.py` | Merges a CSV of questions into `questions.json` |
| `questions-template.csv` | Example of the CSV format |

## How it plays

Pick a category, invite friends, answer five multiple-choice questions against
a 15-second clock. You never find out if you were right until the end. Correct
answers are worth 200; each whole second left on the clock adds 5, but only on
answers you got right — so five slow correct answers still beat two fast ones.

Your friends play whenever they get to it. The leaderboard fills in as they do.

There's also a **Daily Five**: one shared round per day, same five questions for
everyone, one attempt, with a streak.

## Deploying a change

Upload the changed files to the repo. If you changed `app.js`, `app.css` or
`index.html`, also bump the version on the first line of `sw.js` — that's what
clears the old cached copy off everyone's phone.
