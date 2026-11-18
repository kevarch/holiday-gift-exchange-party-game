# Changelog

All notable changes to the Holiday Gift Exchange. Versions follow [Semantic Versioning](https://semver.org): **patch** for fixes and wording tweaks, **minor** for new features, **major** for big changes. The current version is set in `js/version.js` and shows in the lower-left corner of the game while the controls are visible.

## 2.3.0 (2026-11-17)

- New title slide: the game now opens on a welcome screen with a wrapped gift, the title, and two big buttons, **Start the game** and **How to play**. It shows whenever no game is under way (a reload mid-game goes straight back to the wheel).
- Host buttons on the title slide: game length (top left) plus How to play, sound and wheel actions (top right). They hide with <kbd>H</kbd> along with the key hints.
- **How to play** card: sit in a circle, take turns spinning clockwise, do what the wheel says (with the current wheel actions listed), and gifts freeze when the clock runs out. Open it with ◀ or <kbd>I</kbd> on the title slide, and with <kbd>I</kbd> or the new **?** corner button during the game.
- **Start the game** (or the clicker's ▶) plays a new welcome jingle while the title glides up into place, the gift drops into the wheel's hub as the wheel spins in, and the clock slides in. The clock starts as the jingle lands, with a burst of confetti. With reduced motion turned on, it's a simple cross-fade.
- Key hints gain <kbd>I</kbd> How to play

## 2.2.0 (2026-11-17)

- The game timer now stays on top of everything: the result card, game-over card, and editors open underneath it, so the clock is always visible (phone-size screens keep the old layout)

## 2.1.0 (2026-11-17)

- The version number in the lower-left corner now has a GitHub icon and links to the project on GitHub (opens in a new tab)

## 2.0.0 (2026-11-17)

A full holiday makeover.

- New look: midnight pine, brass, and cranberry, with a string of twinkling lights, falling snow, and pine trees
- Wheel redrawn with a brass rim and marquee lights (they chase while it spins), gold dividers, rounded shading, and a wrapped gift in the hub
- Wheel labels use evened-out lines ("Everyone / Pass Left")
- Gift-tag result card with a red bow; icy game-over card with a snowflake medallion, icicles, and a flurry of snowflakes
- New star-topped pointer, framed timer, and line icons in place of emoji
- Restyled editors, key hints, and buttons
- Bundled fonts: Fraunces and Figtree (SIL Open Font License), embedded so they work offline from `file://`

## 1.0.0 (2026-11-17)

First versioned release. Includes:

- Spin wheel with seven default actions, a result card, sound, and confetti
- Presentation clicker support (Next to spin, Back to dismiss)
- Game timer: red final minute, a beep each of the last 10 seconds, a holiday jingle and "Game Over" freeze at zero
- In-app editor for wheel actions; all on-screen wording in `js/strings.js`
- Clean display mode (<kbd>H</kbd>, or fullscreen)
- Settings, actions, and the clock survive a page reload
- Version number shown in the lower-left corner
