# 2026 Holiday Gift Exchange

A browser-based interface for running a holiday gift exchange game.

## Run it

Double-click `index.html` (or drag it into a browser). No server, no install, no internet connection needed.

Press the clicker's Next button (or Space / → / Page Down) to spin the wheel. Press `T` to start/pause the game timer and `R` to reset it (click the time to set minutes); when it hits zero the game is over and all gifts are frozen. Press `F` for fullscreen, `E` to edit the wheel's actions, `M` to mute, `H` to hide the controls for a clean audience display. Default actions live in `js/actions.js`; all on-screen wording lives in `js/strings.js`. Full details: [docs/spin-wheel.md](docs/spin-wheel.md).

## Layout

- `index.html` — app shell
- `clicker-test.html` — checks that the Logitech R500s clicker is detected (open it and press each button)
- `css/` — styles
- `js/actions.js` — default list of wheel actions
- `js/strings.js` — all on-screen wording (edit to change any UI text)
- `js/app.js` — wheel, game timer, controls, editor
- `assets/` — images, sounds, fonts
- `docs/` — specs and notes
