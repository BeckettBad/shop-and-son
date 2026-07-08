# &son "now playing" — in-store test-day checklist

Print this. Do it once, in the shop, during open hours, on the real iPad.
You need: the store iPad (playing to the speakers as normal), your phone, and
the site open in a browser on any device — the MUSIC section on screen.

Worker: `https://shop-and-son-now-playing.shop-and-son.workers.dev`
Site MUSIC section: open the site, tap **MUSIC**, watch the "NOW PLAYING · IN
STORE" block.

---

## Before you start
- [ ] On the iPad, run the **Radio On** shortcut (or open the toggle-on link).
      Check `…workers.dev/status` shows `"toggle":"on"` and `"auth":"ok"`.
- [ ] Start a normal song playing on the iPad through the shop speakers.
- [ ] Open the site, tap MUSIC. Give it a few seconds.

## The seven checks
1. **It shows the song.**
   - [ ] The block shows the real song + artist now playing, album art, a
         moving progress bar, and a green dot. PASS if it matches the room.
2. **Skip lands fast.**
   - [ ] Skip to the next track on the iPad. Within ~20-30s (sooner if you
         reopen MUSIC) the site updates to the new song. PASS.
3. **Pause hides it.**
   - [ ] Pause on the iPad. The site drops back to the plain playlist look
         (no "now playing" song). PASS. Un-pause — it comes back.
4. **A phone playing privately does NOT show.**
   - [ ] On your phone, play a DIFFERENT song in Spotify (same store account,
         playing on the phone itself). The site must NOT show the phone's song
         — it shows nothing / the playlist look. PASS. (This is the gate: only
         the iPad counts.) Stop the phone playback after.
5. **Controlling the iPad from your phone STILL shows.**
   - [ ] Put music back on the iPad. On your phone's Spotify, use it as a
         remote to change the iPad's track (Spotify "Connect to a device" →
         Benjamin's iPad). The site keeps showing the song, because the iPad is
         still the device playing. PASS.
6. **Toggle off / on.**
   - [ ] Run **Radio Off** (or the toggle-off link). Site drops to the
         playlist look within ~30s. PASS.
   - [ ] Run **Radio On** again. The song returns. PASS. (Leave it ON.)
7. **After closing time.**
   - [ ] At/after 7pm, with a song still on the iPad, the site shows the
         playlist look, not a live song (the site respects store hours). PASS.
         You can confirm the same effect any time via the site — it uses the
         same hours as the open/closed clock.

## If something fails
- Nothing ever shows, even at check 1: open `…workers.dev/status`.
  - `"toggle":"off"` → run Radio On.
  - `"auth":"error"` → the Spotify connection died; re-run the handshake
    (`worker/README.md` → "Re-authorize"). This is the one thing that can rot
    over months.
  - `"auth":"ok"` + `"toggle":"on"` but still nothing → the iPad's Spotify
    device name may have changed. Check the exact name in Spotify (Connect
    menu) against `ALLOWED_DEVICES` in `worker/README.md` → "If the iPad is
    renamed."
- The phone's private song DOES show (check 4 fails): stop — tell Beckett, the
  device gate needs a look before go-live.

## When all seven pass
Text Beckett "now playing passed test day" and it's ready to ship live.
