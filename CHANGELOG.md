# Changelog

All notable changes to the Holiday Gift Exchange. Versions follow [Semantic Versioning](https://semver.org): **patch** for fixes and wording tweaks, **minor** for new features, **major** for big changes. The current version is set in `js/version.js` and shows in the lower-left corner of the game while the controls are visible.

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
