# Title slide and How to play

The screen the game opens on, the rules card, and the start of the game. The wheel itself is in [spin-wheel.md](spin-wheel.md).

## When it shows

On load, whenever no game is under way: the clock is at its full time and not running. A reload mid-game (clock running or paused partway) or after time's up goes straight to the game screen.

## Title slide

The same night scene as the game (lights, snow, trees), with in the middle:

- A wrapped gift (the same one as in the wheel's hub), gently bobbing with a few sparkles
- The game's title, large, between the holly sprigs
- "Grab a gift and find a seat"
- Two big buttons: **▶ Start the game** (cranberry with a gold ring) and **◀ How to play**

Host controls, all hidden by clean display (`H`, or fullscreen):

- **Game length** (top left, where the clock will appear): shows the minutes; click it to change them (same popup as clicking the clock)
- **How to play**, **sound** and **wheel actions** buttons (top right)
- A key-hint bar along the bottom, plus the version number and the `H` tip as usual

The two big buttons stay in clean display, since they tell the room what the clicker's ▶ and ◀ do.

### Controls on the title slide

| Input | Effect |
| --- | --- |
| Clicker Next (Page Down, →, ↓, Space, Enter), `T` | Start the game |
| Clicker Back (Page Up, ←, ↑, Backspace), `I` | Open How to play |
| `F`, `E`, `M`, `H` | Same as in the game |

## How to play card

A cream gift tag (like the spin result card) with a holly sprig on top and four numbered steps:

1. **Sit in a circle,** each holding one wrapped gift.
2. **Take turns spinning the wheel,** going clockwise around the circle.
3. **Do what the wheel says.** Followed by the wheel's current actions as small tags, so edits show up.
4. **When the {minutes}-minute clock runs out,** gifts freeze. The one you're holding is yours!

Buttons: **◀ Close**, and on the title slide **▶ Start the game**.

| Input | Effect |
| --- | --- |
| Clicker Next | On the title slide: start the game. During the game: close the card. |
| Clicker Back, `Esc`, `I` | Close the card |
| Click outside the card | Close the card |

During the game, open it with `I` or the **?** button in the top-right corner. Opening it closes any result card. All of its wording is in `js/strings.js`.

## Starting the game

One press of Start does it all, in about 2 seconds:

1. The buttons, subtitle and host controls drop away. (Start doesn't change fullscreen; press `F` before or after.)
2. The **welcome jingle** starts: a rising bell tune over sleigh bells and an oom-pah bass (C, F, G7, C), about 2 seconds, then a ringing chord. The string of lights chases in time with it.
3. The title glides up into the game's header.
4. The gift shrinks and drops into the wheel's hub (passing behind the title) while the wheel grows and spins into place, its marquee lights chasing.
5. The pointer drops onto the wheel and the clock slides in from the left.
6. As the jingle lands on its final chord, the gift settles into the hub, confetti bursts, and the clock starts.

The scenery never moves, so it reads as one scene. With reduced motion turned on in the OS, it's a plain cross-fade (the jingle still plays, with no confetti). Muted, it's silent.

Keys are ignored while it plays, except `M` and `H`.

## How it's built

- The title slide (`#splash`) lies over the game screen, whose clock, wheel and key hints are hidden (`visibility`) but still laid out, so the start can animate into their real positions.
- The big title is the game's own heading (`.top`), moved and scaled into an empty slot on the slide with a transform; starting the game animates that transform away.
- The gift is the same drawing as the hub's, in the same units, so it shrinks exactly onto it.
- Animations use the Web Animations API; the wheel's spin-in is drawn on the canvas, so the hub's gift stays upright.

## Design

The design is a Claude Design canvas, *Gift Exchange Title Slide*: title slide (host view and clean display), How to play, and a storyboard of the start.
