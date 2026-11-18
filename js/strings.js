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
  hintRules: 'How to play',
  hintStart: 'Start',                      // title slide only

  // ---------- title slide (shown before the game starts) ----------
  splashSubtitle: 'Grab a gift and find a seat',
  startButton: 'Start the game',           // also on the How to play card
  rulesButton: 'How to play',
  splashLengthLabel: 'Game length',        // button in the top-left corner
  splashLengthValue: '{minutes} min',

  // ---------- How to play card ----------
  rulesTitle: 'How to play',               // gold stars are added on each side
  // (HTML) Steps 1 to 4. Step 3 is followed by the list of wheel actions.
  rulesStep1: '<strong>Sit in a circle,</strong> each holding one wrapped gift.',
  rulesStep2: '<strong>Take turns spinning the wheel,</strong> going clockwise around the circle.',
  rulesStep3: '<strong>Do what the wheel says.</strong>',
  rulesStep4: '<strong>When the {minutes}-minute clock runs out,</strong> gifts freeze. The one you\'re holding is yours!',
  rulesClose: 'Close',

  // ---------- corner buttons (hover tooltips) ----------
  rulesButtonTip: 'How to play (I)',
  soundOn: 'Sound on (M)',
  soundOff: 'Sound off (M)',
  editActionsButton: 'Edit actions (E)',
  showHideControlsButton: 'Show / hide controls (H)',
  hideControls: 'Hide controls',
  showControls: 'Show controls',
  versionLabel: 'v{version}',              // lower-left corner; the number lives in js/version.js
  versionLink: 'View on GitHub',           // tooltip on the version number

  // ---------- timer ----------
  timerSetMinutes: 'Set minutes',          // tooltip on the clock and the pencil button
  timerStart: 'Start timer (T)',
  timerPause: 'Pause timer (T)',
  timerResetButton: 'Reset timer (R)',
  timerPaused: 'Paused',
  timerOver: 'Game over · gifts frozen',
  timerResetConfirm: 'Reset the timer to {minutes} minutes?',

  // ---------- spin result card ----------
  resultKicker: 'Everybody, listen up!',   // gold stars are added on each side
  resultNext: 'Press ▶ to spin again',

  // ---------- game over card ----------
  gameoverKicker: 'Time\'s up!',           // stars are added on each side
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
