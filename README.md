# 🎁 Holiday Gift Exchange

A spin-the-wheel game for running a gift exchange at your holiday party.

Everyone sits in a circle holding a wrapped gift. The host puts the wheel up on a TV or projector and spins it. Wherever it stops is what happens next: pass your gifts left, steal one, swap two, unwrap yours, and so on. A countdown clock sets how long the game runs, and when it hits zero, all gifts are frozen. Whatever you're holding is yours to keep.

It runs entirely in your web browser from a single folder: no install, no account, no internet connection.

## Features

- **Big, readable wheel** designed for a shared screen across the room
- **Presentation clicker support**: spin with the Next button, dismiss with Back
- **Game timer** with a red final minute, a countdown beep, and a "Game Over" freeze at zero
- **Editable actions**: change the wheel slices right in the app, no coding needed
- **Clean display mode** that hides every control except the wheel and the clock
- **Sound and confetti** (sound is generated in the browser; confetti respects your system's reduced-motion setting)
- **Remembers your setup**: actions, timer, and display settings survive a page reload

## Quick start

1. Download this repository (on GitHub: **Code → Download ZIP**) and unzip it, or clone it with Git.
2. Open `index.html` in a web browser: double-click it, or drag it onto a browser window.
3. Press <kbd>F</kbd> for fullscreen, <kbd>T</kbd> to start the clock, and <kbd>Space</kbd> (or the clicker's Next button) to spin.

That's it. Nothing to install, and it works offline.

## What you'll need

- A computer connected to a TV or projector everyone can see
- One wrapped gift per player
- *Optional:* a wireless presentation clicker, so the host (or whoever has it) can spin from their seat
- *Optional:* a few bows or stickers, for the **Lock It** action

## How to play

1. Everyone sits in a circle with their wrapped gift.
2. Set the game length (default 30 minutes) and start the timer.
3. Spin the wheel. A card pops up with the action and a short explanation. Everyone does it.
4. Spin again. Keep going until time runs out.
5. When the clock hits zero, a **Game Over** card appears and the wheel freezes. Everyone keeps the gift they're holding.

### Default wheel actions

Each slice is equally likely.

| Action | What happens |
| --- | --- |
| **Everyone Pass Left** | Everyone passes their gift one seat to the left. |
| **Everyone Pass Right** | Everyone passes their gift one seat to the right. |
| **Unwrap Your Gift** | Open your gift. It stays in play. Already open? Pick someone else to open theirs. |
| **Steal Any Gift** | Trade your gift for any gift in the room. |
| **Swap Two** | Pick two people to trade gifts. |
| **Pass the Clicker** | Hand the clicker to anyone you choose. |
| **Lock It** | Put a bow on it. No one can steal or swap it. |

"You" means the person who spun. Don't like a rule? Change it (see [Customizing](#customizing)).

## Controls

| Key or button | What it does |
| --- | --- |
| Clicker **Next**, <kbd>Space</kbd>, <kbd>Enter</kbd>, <kbd>→</kbd>, <kbd>↓</kbd>, <kbd>Page Down</kbd> | Spin the wheel (or close the result and spin again) |
| Clicker **Back**, <kbd>Esc</kbd>, <kbd>←</kbd>, <kbd>↑</kbd>, <kbd>Page Up</kbd>, <kbd>Backspace</kbd> | Close the result card |
| Click the wheel | Spin |
| <kbd>T</kbd> | Start / pause the game timer |
| <kbd>R</kbd> | Reset the game timer (asks first if a game is under way) |
| <kbd>F</kbd> | Toggle fullscreen |
| <kbd>H</kbd> | Hide / show controls for a clean audience display |
| <kbd>E</kbd> | Edit the wheel actions |
| <kbd>M</kbd> | Mute / unmute |

Presses during a spin are ignored, so a bumped clicker can't double-spin.

### Game timer

The countdown sits in the upper-left corner.

- **Set the length:** click the time (or ✎) and enter 1–600 minutes.
- **Start / pause:** <kbd>T</kbd> or the ▶ button.
- **Reset:** <kbd>R</kbd> or ↺. Resetting also unfreezes the wheel after a game ends.
- The clock survives a page reload, and keeps counting even while the page is closed.

### Clean display

Press <kbd>H</kbd> (or go fullscreen) to hide the hints and buttons, leaving just the title, clock, and wheel. A small **H** tip stays in the corner. Click it or press <kbd>H</kbd> to bring the controls back.

## Using a presentation clicker

Most wireless clickers send Page Down / Page Up for their Next / Back buttons, which the wheel understands out of the box. Plug in the clicker's USB receiver, open the wheel, and click once anywhere on the page so the browser window has focus.

To check your clicker before the party, open **`clicker-test.html`**. It shows which buttons are detected and logs every key press. It was built around the Logitech R500s, but works with any clicker.

## Customizing

### Change the wheel actions

**In the app (easiest):** press <kbd>E</kbd> or click ⚙. Write one action per line:

```
Short title | Longer explanation
```

The title goes on the wheel and in large type on the result card. The explanation is optional. Add as many actions as you like; slice labels shrink to fit. **Reset to defaults** restores the original list.

Edits made in the app are saved in that browser only. Opening the game in a different browser or on another computer starts with the defaults.

**Change the defaults:** edit `js/actions.js` in any text editor. Each action is a `title` and `details` pair.

### Change any on-screen text

Every label, button, and message (the page title, the "Game Over" card, tooltips, and so on) lives in `js/strings.js`. Open it in a text editor, change the text inside the quotes, save, and reload the page. Instructions are at the top of the file.

## Project structure

```
index.html          The game. Open this.
clicker-test.html   Checks that your presentation clicker is detected.
css/styles.css      Styles
js/actions.js       Default wheel actions
js/strings.js       All on-screen wording
js/app.js           Wheel, timer, controls, and editors
assets/             Images, sounds, fonts (currently empty)
docs/spin-wheel.md  Full behavior spec
LICENSE             MIT License
```

The whole game is plain HTML, CSS, and JavaScript, with no frameworks, build step, or external downloads. It runs straight from the file system (`file://`).

For the full details of how the wheel, timer, and controls behave, see [docs/spin-wheel.md](docs/spin-wheel.md).

## License

Released under the [MIT License](LICENSE). You're free to use, modify, and share it, including for your own parties and events.
