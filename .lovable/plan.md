
## Add Completion Sound Effect

### Overview
Play a short, satisfying sound when a task is checked off to give the user positive feedback. The sound will be synthesized using the Web Audio API -- no external files or API calls needed.

### Changes

**New file: `src/lib/sounds.ts`**
- Create a `playCompletionSound()` function using the Web Audio API
- Synthesize a short two-tone "ding" (ascending notes, ~200ms total) that feels rewarding
- Use an `OscillatorNode` with a sine wave and a `GainNode` for a smooth fade-out
- Gracefully handle cases where `AudioContext` is unavailable (e.g., older browsers)

**`src/components/TodoCard.tsx`**
- Import `playCompletionSound` from the new utility
- In the `onCheckedChange` handler, call `playCompletionSound()` only when the checkbox transitions to checked (not when unchecking)

### Technical Details
- The Web Audio API is used to avoid loading external audio files and to keep the app self-contained
- The sound is a quick ascending two-note chime (e.g., C5 then E5), each ~100ms, with gain envelope for a clean fade
- No user gesture issues since the sound plays in response to a click (checkbox interaction)
- The function is a no-op if the browser doesn't support `AudioContext`
