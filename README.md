# Swiss Chess Tournament Manager

A simple app for running a chess tournament using the **Swiss system** — the
format used in most club and open tournaments, where players are paired each
round based on their score so far (instead of everyone playing everyone, like
a round-robin, or a single-elimination bracket).

This app runs **on your own laptop** — nothing is uploaded to the internet,
and you don't need an account or a login. You (the arbiter/organizer) are the
only person who uses it, from one computer.

This guide assumes you have **never used a terminal or installed developer
tools before**. Follow the steps in order and you'll be running the app in
about 10 minutes.

---

## Part 1 — One-time setup

You only need to do this once per computer. After that, see [Part
2](#part-2---running-the-app-every-time-you-use-it) for how to start it
again.

### Step 1: Install Node.js

This app needs a free program called **Node.js** to run.

1. Go to **[https://nodejs.org](https://nodejs.org)**.
2. Click the big green button that says **LTS** (it will say something like
   "22.x.x LTS" — that's fine, any LTS version works).
3. Open the file you downloaded and click through the installer
   (Next/Continue/Agree, using all the default options is fine).
4. Once it's done, **restart your computer** (this makes sure everything is
   set up correctly).

### Step 2: Open a terminal

A terminal is a text window where you type commands instead of clicking
buttons. You only need a few commands, all given below — just copy and paste
them exactly.

- **On Mac:** Press `Cmd + Space`, type `Terminal`, press Enter.
- **On Windows:** Press the `Windows key`, type `PowerShell`, press Enter.

A plain window with text will open. That's the terminal.

### Step 3: Get the project folder onto your computer

You should have received this project as a folder (or a `.zip` file — if so,
double-click it to unzip it first). Make a note of **where that folder is**,
for example on your Desktop.

In the terminal, type `cd ` (with a space after it), then drag the project
folder from Finder/Explorer directly into the terminal window — this fills in
the folder's path for you — then press Enter. For example, it will look
something like:

```
cd /Users/yourname/Desktop/swiss-chess
```

### Step 4: Install the app's dependencies

Still in the terminal, type this exactly and press Enter:

```
npm install
```

You'll see a bunch of text scroll by — that's normal. It may take a minute or
two. When it's done, you'll see your cursor blinking on a new line, ready for
the next command. (You can ignore any lines that say "vulnerabilities" — they
don't affect you running this locally.)

**You only need to do Steps 1–4 once.** From now on, skip straight to Part 2.

---

## Part 2 — Running the app every time you use it

1. Open a terminal (see Step 2 above).
2. Navigate into the project folder, the same way as Step 3 above (type
   `cd ` and drag the folder in, or if the terminal is already in that
   folder, you can skip this).
3. Type:

   ```
   npm run dev
   ```

4. Wait a few seconds until you see a line like:

   ```
   ✓ Ready in ...ms
   ```

5. Open your web browser (Chrome, Safari, Edge — whatever you normally use)
   and go to:

   ```
   http://localhost:3000
   ```

   (The terminal also prints this address itself, next to the word
   "Local:" — if your screen shows a different number than 3000, use the
   address shown there instead.)

You should see the **Tournaments** page. You're ready to go.

### Stopping the app

When you're done for the day, go back to the terminal window and press
`Ctrl + C`. It's safe to close the terminal window after that. **Your
tournament data is saved automatically** — closing the app does not lose any
data (see [Where your data is stored](#where-your-data-is-stored) below).

### Starting it again later

Repeat Part 2: open a terminal, `cd` into the folder, run `npm run dev`, open
the browser. Your tournaments, players, and results will all still be there,
exactly as you left them.

### Switching the app to Turkish

The app can display everything — buttons, labels, messages, printed PDFs,
exported spreadsheets — in **Turkish** instead of English. This is a
one-time setting for the computer the app runs on; it isn't something you
switch back and forth inside the app itself.

1. In the project folder, create a new file named exactly `.env.local`
   (there's no need to unzip or install anything extra — just a plain text
   file).
2. Open it in any plain text editor (TextEdit, Notepad) and put this single
   line inside it:

   ```
   NEXT_PUBLIC_LOCALE=tr
   ```
3. Save the file, then stop the app if it's running (`Ctrl + C` in the
   terminal) and start it again with `npm run dev` (see [Part
   2](#part-2---running-the-app-every-time-you-use-it)).

The whole app — including exported CSV files and printed PDFs — will now be
in Turkish. To switch back to English, either delete the `.env.local` file
or change the line to `NEXT_PUBLIC_LOCALE=en`, then restart the app the same
way.

### If something goes wrong

- **"command not found: npm"** — Node.js isn't installed correctly. Go back
  to Step 1 and make sure you restarted your computer afterward.
- **The browser says "This site can't be reached"** — make sure the terminal
  is still open and still running (you should see `npm run dev` and some
  text below it, not just a blank cursor). If you closed that terminal
  window, the app has stopped — open a new terminal and run `npm run dev`
  again.
- **"Port 3000 is already in use"** (or similar) — the app is probably
  already running in another terminal window somewhere. Look for it, or
  just restart your computer and try again.

### Where your data is stored

Everything you enter — tournaments, players, results — is saved in a single
file inside the project folder, at:

```
data/swiss-chess.db
```

To back up your tournament data, copy this one file somewhere safe (a USB
drive, cloud storage, etc.). To restore it, put the copy back in the same
`data` folder, replacing the current one, before starting the app.

---

## Part 3 — How a tournament works in this app

This section explains the tournament rules this app follows, so you know
what to expect at each step.

### The Swiss system, in plain terms

In a Swiss tournament, players are **not** eliminated, and they don't all
play each other. Instead, each round:

- Players are grouped by their current score (all players with the same
  number of points are in the same "score group").
- Within a score group, players are paired against each other, trying to
  give higher-rated players tougher opponents and avoiding rematches.
- Winners tend to face other winners in the next round, and so on — so by
  the final round, the players at the top of the standings have usually
  played each other and the field has sorted itself out, without needing
  everyone to play everyone.

This app uses the official **FIDE Dutch System** (the standard algorithm
used by most Swiss tournaments worldwide) to generate pairings. It
automatically handles:

- **Never pairing the same two players twice** in the same tournament.
- **Balancing colors** — trying to give each player an equal mix of White
  and Black games over the course of the tournament, and alternating colors
  round to round where possible.
- **Grouping by score** so pairings stay as fair as possible as the
  tournament progresses.

### Setting up a tournament

When you create a tournament, you choose:

- **A name** (e.g. "Spring Club Championship 2026").
- **The number of rounds.** This is fixed when you create the tournament.
  As a rule of thumb, FIDE recommends enough rounds that the field can sort
  itself out — roughly: for *N* players, you want at least enough rounds
  that 2^(rounds) ≥ N. In practice, 5–7 rounds is typical for 20–60
  players; smaller club events often use 4–5.

This app runs **one section per tournament** — if you want to run, say, an
Open section and a U1800 section at the same time, create them as two
separate tournaments.

### Adding players

On the **Players** tab, paste in your player list, one per line, either as
just a name or as `Name, Rating`:

```
Magnus Carlsen, 2830
Hikaru Nakamura, 2802
Unrated Player
```

A rating is optional — unrated players are treated as having no rating for
pairing purposes, which is perfectly normal.

Once Round 1 has been paired, you can no longer add new players (this keeps
the field fixed, as a real tournament requires) — but you can still
**withdraw** a player at any time (see below).

### Withdrawing a player

If a player drops out mid-tournament, click **Withdraw** next to their name.
They will:

- No longer be included in future round pairings.
- **Keep** all the points and results they've already earned, which still
  count in the final standings and in other players' tiebreak calculations.

### Generating a round and byes

Click **Generate next round** to create that round's pairings. Two kinds of
"bye" (a round where a player has no opponent) can happen:

- **Forced bye** (odd number of players): if there's an odd number of
  players available to pair, the system automatically gives one player a
  bye for that round — worth a **full point (1)** — and makes sure no
  player receives more than one bye for the whole tournament.
- **Requested bye**: if a player can't make it to a particular round, the
  arbiter can mark them for a voluntary bye, worth either a **half point
  (0.5)** or **zero points (0)**, depending on your tournament's rules.
  That player is simply left out of the pairing process for that round.

### Entering results

For each board, click the result: **1 – 0** (White won), **½ – ½** (draw), or
**0 – 1** (Black won). You can change a result at any time.

### Editing a result from an earlier round

If you discover a mistake in a result from a previous round — and later
rounds have *already* been generated — the app will show a warning before
letting you proceed:

> Editing an earlier round **invalidates every round generated after it**
> (since those pairings may have been based on the incorrect score). You'll
> need to re-generate those rounds from scratch once the correction is made.

This is by design — it's the same reasoning a human arbiter would apply: you
can't trust pairings that were calculated from a wrong result. The app keeps
a record of what was changed and when, so nothing is silently lost.

### Standings and tiebreaks

The **Standings** tab shows every player ranked by score. When two or more
players have the same score, the app breaks the tie using these criteria, in
this order (this is a standard FIDE tiebreak sequence):

1. **Buchholz Cut 1** (`Bu-1`) — the sum of your opponents' final scores,
   dropping your weakest opponent's score. Rewards players who faced a
   tougher field overall.
2. **Sonneborn-Berger** (`SB`) — similar, but weights it by *how* you did
   against each opponent: beating a strong opponent counts more than
   beating a weak one.
3. **Direct Encounter** (`DE`) — if the tied players played each other
   directly, whoever won that game ranks higher.
4. **Number of wins** (`Wins`) — whoever won more games outright (as
   opposed to drawing) ranks higher.
5. **Games played with Black** (`Blk`) — as a last resort, the player who
   played Black more often (generally considered the harder color to play
   with) ranks higher.

If players are still tied after all five criteria, they officially share the
same rank — this does happen occasionally and is normal.

### Exporting results

From the Standings page (and from each round's pairing page), you can
export:

- **Players (CSV)**, **Results (CSV)**, **Standings (CSV)** — spreadsheet
  files you can open in Excel, Google Sheets, or Numbers.
- **Pairing sheet (PDF)** — a printable sheet of a single round's pairings,
  to post at the venue.
- **Standings (PDF)** — a printable final standings sheet.

---

## Technical details (for developers)

If you're a developer picking this project up, see below for the stack and
how to work on it.

- **Stack:** Next.js (App Router, TypeScript), SQLite via Drizzle ORM and
  `better-sqlite3`, pairing/tiebreak logic from the `@echecs/*` npm
  packages (FIDE-compliant Dutch system + Buchholz/Sonneborn-Berger/Direct
  Encounter/Number-of-wins), `@react-pdf/renderer` for PDF export.
- **Run tests:** `npm test`
- **Type-check:** `npx tsc --noEmit`
- **Production build:** `npm run build`, then `npm start`
- **Database schema changes:** edit `src/server/db/schema.ts`, then run
  `npm run db:generate` to create a migration.
- **Architecture notes:** the domain layer (`src/server/domain/`) is
  framework-free and DB-free — pairing and tiebreak logic can be tested in
  isolation. The `@echecs/tournament` package is intentionally **not**
  used; see the code comments in `src/server/domain/tournament-engine.ts`
  for why.
- **Localization:** every user-visible string lives in `locales/en.json` and
  `locales/tr.json` as flat `"some.key": "text"` pairs (supports `{name}`
  placeholders, e.g. `"{count} rounds"`). The active locale is resolved once
  from `NEXT_PUBLIC_LOCALE` in `src/lib/i18n.ts` and is fixed for the life of
  the running app — there's no in-app language switcher. Next.js Server
  Components, server actions, and the PDF documents under
  `src/components/pdf/` can't use React context, so they import the plain
  `t(key, vars?)` function from `src/lib/i18n.ts` directly; Client Components
  use the `useLocale()` hook (`src/hooks/useLocale.ts`), backed by
  `LocaleProvider` (`src/components/LocaleProvider.tsx`, mounted once in
  `src/app/layout.tsx`) — both resolve to the exact same dictionary. To add a
  new piece of UI text, add its key to **both** JSON files, then call
  `t('your.key')` (or `useLocale()`'s returned function) where it's rendered.
