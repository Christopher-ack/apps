#!/usr/bin/env python3
"""
Merge a CSV of questions into questions.json.

    python3 tools/add-questions.py new-questions.csv

Expected columns (header row required, order does not matter, case-insensitive):

    category, question, correct, wrong1, wrong2, wrong3

Optional columns:

    desc   — description for a NEW category (ignored for existing ones)
    color  — dark-mode hex for a NEW category
    id     — force a specific question id (normally left blank)

Behaviour:
  * A category name that already exists is matched case-insensitively.
  * A category name that does not exist is created, appended to the
    "More categories" list. Promoting it to the primary four is a manual
    edit of the "primary" flag in questions.json.
  * Question ids are assigned as <category>-NNN, continuing from the highest
    existing number. Ids are never reused or renumbered, so reports and saved
    games keep pointing at the right question.
  * Exact-duplicate question text within a category is skipped, and reported.
  * Nothing is written unless every row validates.
"""

import csv, json, re, sys, os, shutil

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(HERE, 'questions.json')

# Used when a new category arrives without a colour. Chosen to stay distinct
# from the categories already shipped.
FALLBACK_COLORS = [
    ('#C86FD0', '#8E3F96'), ('#5AA9E6', '#2A6FA8'), ('#D9793F', '#9C4F1F'),
    ('#6FC4A8', '#357E66'), ('#B58AD6', '#6E4A93'), ('#D4B23F', '#8E7418'),
]

def slug(name):
    s = re.sub(r'[^a-z0-9]+', '', name.lower())
    return s or 'category'

def norm(row):
    return { (k or '').strip().lower(): (v or '').strip() for k, v in row.items() }

def main(csv_path):
    with open(TARGET, encoding='utf-8') as f:
        doc = json.load(f)

    cats = doc['categories']
    qs   = doc['questions']
    by_name = { c['name'].lower(): c for c in cats }
    by_id   = { c['id']: c for c in cats }

    existing_text = {}
    for q in qs:
        existing_text.setdefault(q['category'], set()).add(q['q'].strip().lower())

    def next_num(cid):
        nums = [int(q['id'].rsplit('-', 1)[1]) for q in qs
                if q['category'] == cid and re.search(r'-\d+$', q['id'])]
        return max(nums) + 1 if nums else 1

    added, skipped, new_cats, errors = [], [], [], []

    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        for n, raw in enumerate(csv.DictReader(f), start=2):
            r = norm(raw)
            cat_name = r.get('category', '')
            question = r.get('question', '')
            answers  = [r.get('correct',''), r.get('wrong1',''), r.get('wrong2',''), r.get('wrong3','')]

            if not cat_name:                    errors.append(f'row {n}: no category');  continue
            if not question:                    errors.append(f'row {n}: no question');  continue
            if not all(answers):                errors.append(f'row {n}: needs a correct answer and three wrong ones'); continue
            if len({a.lower() for a in answers}) != 4:
                errors.append(f'row {n}: the four answers are not all different'); continue

            cat = by_name.get(cat_name.lower())
            if not cat:
                cid = slug(cat_name)
                base, i = cid, 2
                while cid in by_id:
                    cid = f'{base}{i}'; i += 1
                dark, light = FALLBACK_COLORS[len(new_cats) % len(FALLBACK_COLORS)]
                cat = {
                    'id': cid, 'name': cat_name,
                    'desc': r.get('desc') or '',
                    'primary': False,
                    'color': r.get('color') or dark,
                    'colorLight': light,
                }
                cats.append(cat); by_name[cat_name.lower()] = cat; by_id[cid] = cat
                new_cats.append(cat_name)
                existing_text.setdefault(cid, set())

            cid = cat['id']
            if question.strip().lower() in existing_text[cid]:
                skipped.append(f'{cat_name}: {question[:60]}')
                continue

            qid = r.get('id') or f'{cid}-{next_num(cid):03d}'
            qs.append({'id': qid, 'category': cid, 'q': question, 'answers': answers})
            existing_text[cid].add(question.strip().lower())
            added.append(qid)

    if errors:
        print('Nothing was written. Fix these rows first:\n  ' + '\n  '.join(errors))
        return 1

    # keep a copy of the previous file, in case a merge goes wrong
    shutil.copy(TARGET, TARGET + '.bak')
    doc['categories'] = cats
    doc['questions']  = qs
    with open(TARGET, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)

    print(f'Added {len(added)} question(s).')
    if new_cats: print('New categories: ' + ', '.join(new_cats))
    if skipped:
        print(f'Skipped {len(skipped)} duplicate(s):')
        for s in skipped[:10]: print('  ' + s)
    print('\nPer category now:')
    for c in sorted(cats, key=lambda c: c['name']):
        n = sum(1 for q in qs if q['category'] == c['id'])
        print(f'  {c["name"]}: {n}')
    print('\nPrevious version saved as questions.json.bak')
    return 0

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    sys.exit(main(sys.argv[1]))
