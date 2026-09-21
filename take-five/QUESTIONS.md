# Adding questions and categories

Questions live in `questions.json`, which ships with the site. Adding content
is: hand me a file → I give you a new `questions.json` → you upload it →
everyone sees it the next time they open the app. No database work.

---

## Handing me questions

Send me a **CSV or spreadsheet** with these columns. `questions-template.csv`
in this folder is a working example you can open in Excel or Google Sheets.

| Column | Required | What goes in it |
|---|---|---|
| `category` | yes | Category name, e.g. `Music`. Matches an existing one by name, or creates a new one. |
| `question` | yes | The question, as the player reads it. |
| `correct` | yes | The right answer. |
| `wrong1` | yes | A wrong answer. |
| `wrong2` | yes | A wrong answer. |
| `wrong3` | yes | A wrong answer. |
| `desc` | no | Only used when creating a *new* category — the one-line description under its name. |
| `color` | no | Only used for a new category — a hex colour like `#C86FD0`. I'll pick one if you don't. |

Example:

```csv
category,question,correct,wrong1,wrong2,wrong3
Music,Which band released the album "Abbey Road"?,The Beatles,The Rolling Stones,The Who,The Kinks
Music,Which instrument does a luthier build?,Guitar,Drum,Trumpet,Flute
The Office,What does Dwight grow on his farm?,Beets,Corn,Wheat,Potatoes
```

Two things the format cares about:

- **The correct answer goes in its own column.** The app shuffles all four
  before showing them, so their order in the file doesn't matter.
- **All four answers must be different.** A row with a repeated answer is
  rejected rather than quietly shipped.

If a spreadsheet is more work than it's worth, just paste the questions in a
message however they come out and I'll structure them. The CSV just removes
any chance of me misreading which answer is the right one.

---

## What I'll send back

A new `questions.json`. You upload it to the repo, replacing the old one, and
that's the whole deployment. No `sw.js` version bump needed for a
questions-only change — new questions appear on next open.

---

## Doing it yourself

There's a script if you'd rather not wait on me:

```bash
python3 tools/add-questions.py my-new-questions.csv
```

It merges the CSV into `questions.json` in place, saves the previous version as
`questions.json.bak`, and prints a per-category count so you can sanity-check
the result. It refuses to write anything if any row is malformed, and skips
questions whose text already exists in that category.

---

## How IDs work, and why it matters

Every question gets a permanent id like `general-003` or `music-011`. It shows
on the answer-review screen and in question reports, so `MUSIC-011` is enough
for me to find exactly what someone is complaining about.

**IDs are never reused or renumbered.** New questions continue from the highest
number in that category. This matters because finished games store the ids of
the questions that were asked — renumbering would silently rewrite history and
make old reports point at the wrong question.

Practical consequences:

- **Adding** questions is always safe.
- **Editing** a question's wording or fixing a wrong answer is safe — keep the
  id, change the text.
- **Deleting** a question is safe but leaves a hole: any finished game that
  used it shows "This question has since been removed" on the review screen.
  Nobody's score changes.

So: prefer fixing a bad question over deleting it.

---

## Categories

The New game screen shows exactly **four primary categories** in a fixed grid,
with everything else behind **More categories**, sorted alphabetically.

In `questions.json`, each category looks like:

```json
{
  "id": "movies",
  "name": "Movies",
  "desc": "A century of the big screen",
  "primary": true,
  "color": "#C94F8C",
  "colorLight": "#A33B6F"
}
```

- `primary: true` puts it in the top four. Exactly four should have it — to
  promote one, demote another.
- `color` is used in dark mode, `colorLight` in light mode. The light one needs
  to be noticeably darker, or it disappears against a white card.
- New categories default to `primary: false`, so they land under More.

A category with no questions is hidden automatically, so a half-written one
won't show up until it has content.

---

## A note on what makes a good category here

Worth keeping the mix balanced. Right now it's three shows/franchises (Star
Wars, Parks and Rec, The Office) against seven general ones. When a category
is about a show, the same person tends to win it every time — which is fun
once and tedious as a habit.

The single best category for a group this size would be **"Us"** — questions
about the players themselves. Who's scared of heights, whose first car was
what, who has never seen Star Wars. It needs people to submit questions, but
it's the one everybody will still be talking about the next day.
