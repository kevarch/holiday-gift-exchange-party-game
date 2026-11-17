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

- **In the app:** press `E` (or the sliders button in the top-right corner) to open the editor. One action per line, written as `Title | Details` (the `|` and details can be left off). Saved to `localStorage` in that browser, so it survives reloads. "Reset to defaults" restores the list above.
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

**Clean display:** `H` hides the key hints, the corner buttons, the timer buttons and the version number, leaving the title, clock and wheel. A faint `H` tip stays in the bottom-right corner; click it or press `H` to bring the controls back. Going fullscreen turns it on; the setting is remembered across reloads.

Presses during a spin are ignored, and held-down keys don't repeat, so a bumped clicker can't double-spin.

**Version:** while the controls are visible, the app version (e.g. `v1.0.0`) shows small and faint in the bottom-left corner next to a GitHub icon; clicking it opens the project's GitHub page in a new tab. It's set in `js/version.js`; `CHANGELOG.md` lists what changed in each version.

## Behavior

- Each spin picks a slice uniformly at random, then animates 5–7 full turns plus the offset to land there over ~5–6 seconds, easing out.
- The stopping point is somewhere inside the slice, never right on a divider, so there's no ambiguity about the result.
- A tick plays as each divider passes the pointer; a chime plays on the result. Sound is generated in the browser (no audio files).
- While it spins, the marquee lights on the rim chase each other.
- On stopping, the other slices dim, the winning slice is outlined, and a result card appears with confetti, showing the title in large type and the details below it. Confetti is skipped when the OS has reduced motion turned on.

## Game timer

A countdown sits in a box in the upper-left corner, big enough to read across the room. It sets how long the game lasts. It's the top-most item on screen: the result card, game-over card, and editors all open underneath it, so the clock never disappears. (On phone-size screens, where the box sits under the title and the cards fill the screen, the cards cover it.)

- **Set minutes:** click the time (or the pencil button). Whole minutes, 1–600; default 30. Saving resets the clock to the new time.
- **Start / pause:** `T` or the play / pause button. While paused the time dims and reads "Paused".
- **Reset:** `R` or the reset (circular arrow) button. Puts the clock back to the full time. If the game is under way it asks first, so a stray key press can't wipe it.
- The last minute turns red; the last 10 seconds pulse, with a beep each second (the final 3 are higher).
- The clock (minutes, time left, and whether it's running) is saved in `localStorage`, so a reload picks up where it was. It keeps counting while the page is closed.
- In clean display (`H`, or fullscreen) the time stays visible; only the buttons hide. Use the keys.

**When time runs out, the game is over:** a holiday jingle plays (bells, sleigh bells, and a big final chord) and a "Time's up! Game Over" card says all gifts are frozen, with a flurry of snowflakes instead of confetti. The wheel turns icy and won't spin; pressing Next just brings the card back. If a spin is in progress at zero, it finishes but doesn't count. Press `R` (or the reset button, or set new minutes) to unfreeze and start a new game.

## Look

A night-time holiday scene in midnight pine, brass, and cranberry, built to read across a room on a TV.

- **Scenery:** a string of colored lights along the top (they twinkle), gently falling snow, and pine trees in the bottom corners.
- **Title:** gold Fraunces serif between two holly sprigs.
- **Wheel:** a brass rim with 24 marquee lights, slices in cranberry, pine, gold, and cream (repeating in that order), gold dividers, and a cream hub with a wrapped gift that stays upright as the wheel turns. Labels are Figtree, sized to fit, with the lines evened out. The pointer is cream with a gold star.
- **Result card:** a cream gift tag with a stitched edge, a red bow on top, and a gold-and-red border.
- **Game over card:** an icy blue card with a snowflake medallion on top and icicles hanging from the bottom.
- **Controls:** drawn line icons (no emoji), keyboard hints styled as keys on a dark bar.

Fonts are bundled in `assets/fonts/` (embedded in `fonts.css` so they load from `file://` in every browser). With reduced motion turned on in the OS, the snow and lights hold still and there's no confetti.

The design was made as a Claude Design canvas (main screen, spin result, game over, actions editor, and a style kit with every color, font, and control).
