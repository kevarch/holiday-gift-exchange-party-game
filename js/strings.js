// All on-screen wording for the app. Edit the text on the right of each line.
//
// - Keep the quotes around each piece of text. If your text needs an apostrophe,
//   either keep the double quotes "like this" or write it as \' inside single quotes.
// - Words in {braces} are filled in by the app (e.g. {minutes}). Keep them as-is.
// - Lines marked (HTML) may use simple tags like <strong>bold</strong>.
// - Wheel actions themselves live in js/actions.js.
window.TEXT = {
  // ---------- page ----------
  pageTitle: 'Holiday Gift Exchange',      // browser tab
  heading: 'Holiday Gift Exchange',        // big title at the top
  wheelLabel: 'Gift exchange wheel',       // screen-reader label for the wheel

  // ---------- keyboard hints (bottom bar) ----------
  hintSpin: 'Spin',
  hintDismiss: 'Dismiss',
  hintFullscreen: 'Fullscreen',
  hintTimer: 'Start/pause timer',
  hintReset: 'Reset timer',
  hintEdit: 'Edit actions',
  hintSound: 'Sound',

  // ---------- corner buttons (hover tooltips) ----------
  soundOn: 'Sound on (M)',
  soundOff: 'Sound off (M)',
  editActionsButton: 'Edit actions (E)',
  showHideControlsButton: 'Show / hide controls (H)',
  hideControls: 'Hide controls',
  showControls: 'Show controls',
  versionLabel: 'v{version}',              // lower-left corner; the number lives in js/version.js

  // ---------- timer ----------
  timerSetMinutes: 'Set minutes',          // tooltip on the clock and ✎ button
  timerStart: 'Start timer (T)',
  timerPause: 'Pause timer (T)',
  timerResetButton: 'Reset timer (R)',
  timerPaused: 'Paused',
  timerOver: '❄ Game over · gifts frozen',
  timerResetConfirm: 'Reset the timer to {minutes} minutes?',

  // ---------- spin result card ----------
  resultKicker: '🎁  Everybody, listen up!  🎁',
  resultNext: 'Press ▶ to spin again',

  // ---------- game over card ----------
  gameoverKicker: '⏰  Time\'s up!  ⏰',
  gameoverTitle: 'Game Over',
  gameoverDetails: 'All gifts are frozen. The gift you\'re holding is yours!',
  gameoverNext: 'Press R to reset the timer',

  // ---------- timer settings popup ----------
  timerEditorTitle: 'Game timer',
  timerEditorHelp: 'How many minutes to play. Saving resets the clock to this time.',
  timerEditorUnit: 'minutes',
  timerEditorError: 'Enter a whole number of minutes, 1 to {max}.',

  // ---------- wheel actions popup ----------
  actionsEditorTitle: 'Wheel actions',
  // (HTML)
  actionsEditorHelp: 'One action per line: <strong>Short title | Longer details</strong>. The title goes on the wheel and in big type; the details appear under it. Details are optional.',
  actionsEditorReset: 'Reset to defaults',
  actionsEditorErrorEmpty: 'Add at least one action.',
  actionsEditorErrorTitle: 'Every line needs a short title before the "|".',

  // ---------- shared buttons ----------
  cancel: 'Cancel',
  save: 'Save'
};
