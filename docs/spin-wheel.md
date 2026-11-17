# Spin wheel

The main screen of the gift exchange. Players sit in a circle with their gifts and watch one shared screen (TV or projector). The host presses the clicker's **Next** button to spin a wheel; wherever it stops is what everyone does next.

## Actions

Each action has two parts:

- **Title:** a short instruction. It's the label on the wheel slice and the large text on the result card.
- **Details:** a longer sentence shown under the title on the result card, to settle any "wait, who does what?" questions. Optional.

Default actions (each is one wheel slice, all equally likely):

| Title | Details |
| --- | --- |
| Everyone Pass Left | Everyone passes their gift one seat to the left. |
| Everyone Pass Right | Everyone passes their gift one seat to the right. |
| Unwrap Your Gift | Open your gift. It stays in play. Already open? Pick someone else to open theirs. |
| Steal Any Gift | Trade your gift for any gift in the room. |
| Swap Two | Pick two people to trade gifts. |
| Pass the Clicker | Hand the clicker to anyone you choose. |
| Lock It | Put a bow on it. No one can steal or swap it. |

Wording rule: details speak directly to the player who spun ("you"), and stay as short as possible. Only say "everyone" when the action involves the whole circle.

The list is editable two ways:

- **In the app:** press `E` (or the ⚙ button) to open the editor. One action per line, written as `Title | Details` (the `|` and details can be left off). Saved to `localStorage` in that browser, so it survives reloads. "Reset to defaults" restores the list above.
- **Defaults:** `js/actions.js` holds the default list as `{ title, details }` entries. Edit it to change what a fresh browser (or "Reset to defaults") gets.

At least one action is required, and every action needs a title. Any number works; labels shrink to fit as slices get narrower.

## Controls

| Input | Effect |
| --- | --- |
| Clicker Next (Page Down, →, ↓, Space, Enter) | Spin. If a result is showing, it closes and the wheel spins again. |
| Clicker Back (Page Up, ←, ↑, Backspace), Esc | Close the result card. |
| `T` | Start / pause the game timer |
| `R` | Reset the game timer (asks first if the game is under way) |
| `F` | Toggle fullscreen |
| `E` | Edit actions |
| `M` | Mute / unmute sound |
| `H` | Hide / show controls (clean display for the audience) |
| Mouse click on the wheel | Spin |

**Clean display:** `H` hides the key hints, the corner buttons and the timer buttons, leaving the title, clock and wheel. A faint `H` tip stays in the bottom-right corner; click it or press `H` to bring the controls back. Going fullscreen turns it on; the setting is remembered across reloads.

Presses during a spin are ignored, and held-down keys don't repeat, so a bumped clicker can't double-spin.

## Behavior

- Each spin picks a slice uniformly at random, then animates 5–7 full turns plus the offset to land there over ~5–6 seconds, easing out.
- The stopping point is somewhere inside the slice, never right on a divider, so there's no ambiguity about the result.
- A tick plays as each divider passes the pointer; a chime plays on the result. Sound is generated in the browser (no audio files).
- On stopping, the winning slice is highlighted and a result card appears with confetti, showing the title in large type and the details below it. Confetti is skipped when the OS has reduced motion turned on.

## Game timer

A countdown sits in a box in the upper-left corner, big enough to read across the room. It sets how long the game lasts.

- **Set minutes:** click the time (or ✎). Whole minutes, 1–600; default 30. Saving resets the clock to the new time.
- **Start / pause:** `T` or the ▶/⏸ button. While paused the time dims and reads "Paused".
- **Reset:** `R` or ↺. Puts the clock back to the full time. If the game is under way it asks first, so a stray key press can't wipe it.
- The last minute turns red; the last 10 seconds pulse, with a beep for each of the final 5.
- The clock (minutes, time left, and whether it's running) is saved in `localStorage`, so a reload picks up where it was. It keeps counting while the page is closed.
- In clean display (`H`, or fullscreen) the time stays visible; only the buttons hide. Use the keys.

**When time runs out, the game is over:** a chime plays and a "Time's up! Game Over" card says all gifts are frozen. The wheel turns icy and won't spin; pressing Next just brings the card back. If a spin is in progress at zero, it finishes but doesn't count. Press `R` (or ↺, or set new minutes) to unfreeze and start a new game.
