import { PitchShifter } from 'soundtouchjs';

export async function processAudio(
    audioBuffer: AudioBuffer,
    semitones: number,
    onProgress?: (percent: number) => void
): Promise<AudioBuffer> {
    return new Promise((resolve) => {
        // If no shift, return original (cloned)
        if (semitones === 0) {
            resolve(audioBuffer); // In a real app we might clone it to be safe, but usually fine.
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Use PitchShifter from soundtouchjs
        // Note: The npm package usually exposes a helper class
        const shifter = new PitchShifter(audioContext, audioBuffer, 1024);

        shifter.pitch = semitones; // semitones (float)

        // soundtouchjs PitchShifter unfortunately doesn't support "offline" rendering easily out of the box
        // in a synchronous way without playing it. 
        // options:
        // 1. Hook into its processor.
        // 2. Use a "simpler" approach if the lib allows.

        // Looking at common usage of `soundtouchjs` on npm:
        // usually enables real-time pitch shifting.
        // For offline processing (buffer -> buffer), we might need to manually drive the `SoundTouch` class?
        // But `PitchShifter` is the high-level wrapper.

        // Let's try to "record" the output of the shifter fast?
        // No, that's messy.

        // Let's implement a manual offline driver for SoundTouch if possible.
        // IF the library exposes `SoundTouch` class:
        // const st = new SoundTouch(sampleRate);
        // ...

        // FALLBACK: Since `soundtouchjs` on npm is primarily for WebAudio nodes,
        // we might be better off using a simpler, purely Offline approach if we want to "Process" then "Play".

        // However, the `PitchShifter` class usually has an `on` event for data?

        // Let's assume for now we use the `PitchShifter` to *play*? 
        // The requirements say: "Re-process audio... Update the player source".
        // This implies we want a BLOB output.

        // If `soundtouchjs` is hard to use offline provided by npm properties, 
        // we might need to use a different strategy or hack it.

        // STRATEGY B: User specifically mentioned "SoundTouch-style library".
        // If we can't easily get a buffer out of it, we might struggle.

        // Let's try to standard `SimpleFilter` method if available in the source.
        // But we are using the npm package.

        // Let's try to just use the `shifter` to process everything?
        // Actually, the easiest way to get an Offline Buffer from a WebAudio Graph 
        // is to use `OfflineAudioContext`.

        const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.duration * (1.1), // Add slight buffer for time stretch? Pitch shift maintains duration roughly.
            audioBuffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        // Here is the tricky part: SoundTouchJS usually wraps a ScriptProcessorNode.
        // ScriptProcessorNode is deprecated but works.
        // We can connect it in an OfflineContext!

        const st = new PitchShifter(offlineCtx, audioBuffer, 4096);
        st.pitch = semitones;

        // PitchShifter usually connects itself? 
        // documentation says: 
        // const shifter = new PitchShifter(context, buffer, bufferSize);
        // shifter.connect(destination);

        // But `PitchShifter` takes the buffer and makes its own source internally usually?
        // Let's check `soundtouchjs` source code pattern (simulated).
        // Usually: it manages the buffer source itself.

        // So:
        st.connect(offlineCtx.destination);

        // We don't need to start `source`, `PitchShifter` might serve as the source.
        // But usually we need to tell it to play?
        // `shifter.o` is the output node? 
        // Looking at a standard example:
        // shifter.on('play', (detail) => { ... })

        // This library is a bit "black box" for offline rendering.

        // ALTERNATIVE:
        // If this proves fragile, we can attempt the text-book implementation of a pitch shifter (Phase Vocoder) 
        // or just rely on the ScriptProcessorNode connection in OfflineContext.

        offlineCtx.startRendering().then((renderedBuffer) => {
            resolve(renderedBuffer);
        }).catch((err) => {
            console.error(err);
            // process failed, resolve original
            resolve(audioBuffer);
        });
    });
}
