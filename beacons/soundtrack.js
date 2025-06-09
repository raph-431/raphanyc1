// shortcuts
let rand = Math.random

// audio context
// Create an AudioContext
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Create a master gain node
export const masterGain = audioCtx.createGain();
// set an initial volume of 0 (no sound)
masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
// Connect the master gain node to the AudioContext's destination
masterGain.connect(audioCtx.destination);

audioCtx.suspend()

// Function to create a white noise buffer
function createWhiteNoiseBuffer(context, duration = 4) {
    const sampleRate = context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = rand() * 2 - 1;
    }
    return buffer;
}

// Set up the noise source
export const noiseSource = audioCtx.createBufferSource();
noiseSource.buffer = createWhiteNoiseBuffer(audioCtx);
console.log(noiseSource)
noiseSource.loop = true;

const gainNode = audioCtx.createGain();
gainNode.gain.setValueAtTime(1, audioCtx.currentTime);

// Filter the noise for a softer, ambient tone
const noiseFilter = audioCtx.createBiquadFilter();
noiseFilter.type = 'lowpass';
noiseFilter.frequency.setValueAtTime(120, audioCtx.currentTime);

noiseSource.connect(noiseFilter);
noiseFilter.connect(gainNode);
gainNode.connect(masterGain);
noiseSource.start();

const cMajorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];

// Function to get a random note from a scale
function getRandomNoteFromScale(scale) {
    return scale[Math.floor(Math.random() * scale.length)];
}



function playDataTransmissionNoise() {
    // Define the duration of the noise burst (in seconds)
    const burstDuration = rand() * 1.0 + 0.5;
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = sampleRate * burstDuration;

    // Create a buffer and fill it with white noise
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    // Create a BufferSource to play the noise
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Use a bandpass filter to shape the noise, emphasizing a "techy" midrange tone
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    const frequency = 8000 + rand() * 2000
    filter.frequency.value = frequency; // Center frequency, tweak as desired
    filter.Q.value = 20;          // Quality factor to control bandwidth

    // Create a gain node for the amplitude envelope
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    // Quick envelope: fast attack and rapid decay to simulate a transmission burst
    gainNode.gain.linearRampToValueAtTime(.3, audioCtx.currentTime + 0.01);
    // gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + burstDuration);

    // Connect the nodes: noise -> filter -> gain -> destination
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);


    // Start and stop the noise burst
    noiseSource.start();
    noiseSource.stop(audioCtx.currentTime + burstDuration);
}

function playFullSynthWave(duration = 10, frequency = 440) {
    // Create a master gain node to combine oscillators
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.connect(masterGain);
    const harmonics = [1.5, 1.333, 2, 1.25, 1.2]
    let harmonic = harmonics[Math.floor(Math.random() * harmonics.length)]
    // First oscillator with a sawtooth wave
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Second oscillator with a triangle wave, slightly detuned
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency / harmonic, audioCtx.currentTime);
    osc2.detune.setValueAtTime(detuneFactor, audioCtx.currentTime); // Slight detune

    // // Connect oscillators to the master gain node
    // osc1.connect(masterGain);
    // osc2.connect(masterGain);

    // Create a smooth volume envelope (fade in and out)
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + duration / 2);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    // Create a PannerNode for spatial positioning
    const panner1 = audioCtx.createPanner();
    const panner2 = audioCtx.createPanner();
    // Set the panning model (HRTF gives a more realistic effect)
    panner1.panningModel = 'equalpower';
    panner2.panningModel = 'equalpower';
    // Initial position
    let pan = (rand() * 2) - 2
    panner1.positionX.setValueAtTime(pan, audioCtx.currentTime);
    panner1.positionY.setValueAtTime(0, audioCtx.currentTime);
    panner1.positionZ.setValueAtTime(0, audioCtx.currentTime);
    panner2.positionX.setValueAtTime(pan, audioCtx.currentTime);
    panner2.positionY.setValueAtTime(0, audioCtx.currentTime);
    panner2.positionZ.setValueAtTime(0, audioCtx.currentTime);

    // Create a lowpass filter to remove harsh overtones
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    // Start with a higher cutoff and gently lower it for a warmer effect
    filter.frequency.setValueAtTime(1500, audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + duration);


    // Connect the nodes: oscillator -> gain -> panner -> destination
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(panner1);
    gainNode.connect(panner2);
    panner1.connect(filter);
    panner2.connect(filter);
    filter.connect(masterGain);



    // Animate the panner's X position from -1 (left) to 1 (right) over the duration
    // panner1.positionX.linearRampToValueAtTime(-pan, audioCtx.currentTime + duration);
    // panner2.positionX.linearRampToValueAtTime(-pan, audioCtx.currentTime + duration);
    // Start and stop the oscillators
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
}

function playBellSound() {
    // Define a base frequency for the bell (adjust as desired)
    const baseFrequency = cMajorScale[Math.floor(Math.random() * cMajorScale.length)]; // A5, for instance

    // Create a carrier oscillator (the main tone)
    const carrier = audioCtx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(baseFrequency, audioCtx.currentTime);

    // Create a modulator oscillator (this will modulate the carrier to create a bell timbre)
    const modulator = audioCtx.createOscillator();
    modulator.type = 'sine';
    // Set a low frequency for slow modulation
    modulator.frequency.setValueAtTime(800, audioCtx.currentTime);

    // Create a gain node to control the modulation index (depth)
    const modGain = audioCtx.createGain();
    // A higher value increases the intensity of the modulation,
    // which in turn produces more pronounced inharmonic overtones.
    modGain.gain.setValueAtTime(150, audioCtx.currentTime);

    // Connect the modulator to modGain, then use that to modulate the carrier frequency
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // Create a gain node for the overall amplitude envelope
    const envelope = audioCtx.createGain();
    // Start silent
    envelope.gain.setValueAtTime(0, audioCtx.currentTime);

    // Connect carrier output through the envelope
    carrier.connect(envelope);
    envelope.connect(gainNode);
    gainNode.connect(masterGain);

    // Define the envelope: quick attack and long decay
    const now = audioCtx.currentTime;
    envelope.gain.linearRampToValueAtTime(0.5, now + 0.01); // almost immediate attack
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 8); // long, resonant decay over 4 seconds

    // Start both oscillators
    modulator.start(now);
    carrier.start(now);

    // Stop both oscillators after the duration of the bell
    carrier.stop(now + 4);
    modulator.stop(now + 4);
}

// A function to play a synth wave note using the scale
function playSynthWaveNote(duration = 10) {
    const noteFrequency = getRandomNoteFromScale(cMajorScale);
    playFullSynthWave(duration, noteFrequency);
}

// Optionally, you can schedule these notes at random intervals:
function scheduleSynthWaveNote() {
    if (audioCtx.state !== 'running') return; // Only schedule if running
    // Choose a random delay between 5 and 15 seconds
    const minDelay = 10000;
    const maxDelay = 20000;
    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    const duration = Math.random() * 15 + 10;
    playSynthWaveNote(duration); // Play a synth wave note for 10 seconds

    setTimeout(scheduleSynthWaveNote, randomDelay);
}

const detuneFactor = 5 + rand() * 5;


// Example usage: play a synth wave that lasts 10 seconds at 440 Hz
function scheduleDataTransmission() {
    if (audioCtx.state !== 'running') return; // Only schedule if running
    // Set a random delay between 3 and 8 seconds
    const minDelay = 10000;
    const maxDelay = 20000;
    const randomDelay = rand() * (maxDelay - minDelay) + minDelay;

    playDataTransmissionNoise();
    setTimeout(scheduleDataTransmission, randomDelay);
}


function scheduleBellSound() {
    if (audioCtx.state !== 'running') return; // Only schedule if running
    const minDelay = 15000;
    const maxDelay = 30000;
    const randomDelay = rand() * (maxDelay - minDelay) + minDelay;

    playBellSound();
    setTimeout(scheduleBellSound, randomDelay);
}


function playViolinWave(duration = 3, frequency = 440) {
    const now = audioCtx.currentTime;

    // Main oscillator: using sawtooth for rich harmonics
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, now);

    // Vibrato: an LFO to modulate the frequency for a natural pitch variation
    const vibratoOsc = audioCtx.createOscillator();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(6, now); // Vibrato rate (Hz)

    // Control vibrato depth (in Hz)
    const vibratoGain = audioCtx.createGain();
    vibratoGain.gain.setValueAtTime(10, now); // Adjust depth as needed

    // Connect vibrato oscillator to the main oscillator's frequency
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Create a gain node to shape the amplitude envelope
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);

    // Slow attack (fade in) and long decay for a sustained, resonant tone
    gain.gain.linearRampToValueAtTime(0.8, now + 0.5);  // Fade in over 0.5 sec
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Slow decay

    // Optional: Use a bandpass filter to refine the violin-like timbre
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.setValueAtTime(5, now);

    // Chain the nodes: oscillator -> filter -> gain -> destination
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    // Start both the main oscillator and the vibrato LFO
    osc.start(now);
    vibratoOsc.start(now);

    // Stop them after the duration
    osc.stop(now + duration);
    vibratoOsc.stop(now + duration);
}


function scheduleViolinWave() {
    if (audioCtx.state !== 'running') return; // Only schedule if running
    // Choose a random delay between 8 and 20 seconds
    const minDelay = 10000;
    const maxDelay = 20000;
    const randomDelay = rand() * (maxDelay - minDelay) + minDelay;
    const frequency = cMajorScale[Math.floor(rand() * cMajorScale.length)];
    const duration = rand() * 5 + 4;
    playViolinWave(6, frequency); // Play a violin wave note (duration 3 sec at 440Hz)
    setTimeout(scheduleViolinWave, randomDelay);
}


// Function to play a single Morse beep
function playMorseBeep(duration) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine'; // clean tone
    osc.frequency.setValueAtTime(900, now); // fixed pitch for all beeps

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);

    osc.connect(gain);
    gain.connect(masterGain);

    // Quick attack and then decay over the specified duration
    gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gain.gain.linearRampToValueAtTime(0.1, now + duration);
    gain.gain.linearRampToValueAtTime(0, now + duration+0.01);

    osc.start(now);
    osc.stop(now + duration);
}


// Morse look‑up
const TO_MORSE = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
    G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
    M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
    S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..",
    "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
    "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----."
};

/**
 * text  →  Base‑64 string
 * -----------------------------------
 *  • “.” ⇒ 00   (dot)
 *  • “–” ⇒ 01   (dash)
 *  • end‑of‑letter ⇒ 10
 *  • end‑of‑word   ⇒ 11
 *  • sentinel “1”  (single bit)  + 0‑padding to the next byte
//  */
// function encodeHaiku(raw) {
//     // -- 1 ‧ Normalise --------------------------------------------------------
//     const txt = raw
//         .normalize("NFD")        // de‑accent
//         .replace(/[\u0300-\u036f]/g, "")
//         .toUpperCase()
//         .replace(/[^A-Z0-9 ]/g, " ")
//         .replace(/\s+/g, " ")
//         .trim();

//     // -- 2 ‧ Text → bit string -----------------------------------------------
//     let bits = "";
//     const words = txt.split(" ");
//     words.forEach((word, wi) => {
//         [...word].forEach((ch, ci) => {
//             const m = TO_MORSE[ch];
//             if (!m) return;
//             for (const s of m) bits += s === "." ? "00" : "01";
//             if (ci < word.length - 1) bits += "10";      // letter gap
//         });
//         if (wi < words.length - 1) bits += "11";        // word gap
//     });

//     bits += "1";                                      // sentinel
//     const pad = (8 - bits.length % 8) % 8;
//     bits += "0".repeat(pad);

//     // -- 3 ‧ Bits → bytes → Base‑64 ------------------------------------------
//     const bytes = Uint8Array.from({ length: bits.length / 8 },
//         (_, i) => parseInt(bits.slice(i * 8, i * 8 + 8), 2));
//     return typeof btoa === "function"
//         ? btoa(String.fromCharCode(...bytes))      // browser
//         : Buffer.from(bytes).toString("base64");   // Node
// }



// Morse reverse look‑up
const FROM_MORSE = Object.fromEntries(
    Object.entries(TO_MORSE).map(([k, v]) => [v, k])
);

/**
 * Base‑64 string  →  original text (upper‑case, accent‑stripped)
 */
export function decodeHaiku(b64) {
    const bytes = typeof atob === "function"
        ? Uint8Array.from(atob(b64), c => c.charCodeAt(0))   // browser
        : Uint8Array.from(Buffer.from(b64, "base64"));      // Node

    // -- 1 ‧ bytes → bit string ----------------------------------------------
    let bits = [...bytes].map(b => b.toString(2).padStart(8, "0")).join("");

    bits = bits.replace(/0+$/, "");         // remove byte padding
    if (!bits.endsWith("1")) return null;  // no sentinel? corrupt
    bits = bits.slice(0, -1);               // drop sentinel

    // -- 2 ‧ bit stream → words ----------------------------------------------
    const tokens = bits.match(/.{2}/g) || [];
    const words = [];
    let letter = "";
    let word = [];

    for (const t of tokens) {
        if (t === "00") letter += ".";
        else if (t === "01") letter += "-";
        else if (t === "10") {               // end‑letter
            word.push(letter); letter = "";
        }
        else if (t === "11") {               // end‑word
            if (letter) { word.push(letter); letter = ""; }
            words.push(word); word = [];
        }
    }
    if (letter) word.push(letter);
    if (word.length) words.push(word);

    // -- 3 ‧ Morse → ASCII ----------------------------------------------------
    return words.map(ws => ws.join(" "))//.join(" ");
}

const codedhaikus = ['YAjFIYQl2EiMAlYGAjAhCIhSAwZJCITYAjAiHGSQxkCVgGNgCMCYYSAg', 'YWV2GCEIDWGSRcUhhYDWCAgIJJTYAjAghCJJEjCTYAjQIJTQIQgYwCVgYCI=', 'BISCJJCAxSEIZFgklNWBmAgkI2AIxYJJCVhYDEIgSdWFIkiQx2EgYwCIYQgklMCIYCVkgA==', 'FgCCRIAwJhmMWGAw0WVgdIgGITAhhdYxYhkcZJDFISVgZDWRcAiGQxlIYJICdgCVgIxYYQhCAg==', 'FIJJHRISIZcZJDAllZGMEhCVhYhIDVk2AI0IJIJJTYZAhCMWCEJgklMCVwIQlYWEJFxYAghCNgCMQglIAnQggIYUhSIYSAg=', 'YJYgNWBMWGEwJlYSCIDBkmVhCQ0CElZgCISAxCVgJwIkSEiYDBJWEiAYhIA=', 'FIQhkWCSU2AI1IZY0CGEiEJF0CIJJTFIQhkWJDAlZYmCWIDEJWAiEgMWCSSISA1YTQJWYAg=', 'EiWJZAiE0WVgcWISNAlYSTWVkgJiExkkNAiGBmRcZ2AIwJhhJ1YExhCENgCCSUgI', 'DRJWBhCQk3BIiENZF1YWTAkYJNIGWQJIgIDBISVl2AIxSCEIQgNCGRcYEmITQhkXVgTAgYSAYIBhhCA=',
    'AkSJJ1YE2AIxSCSNhIgIDElYZCAgkIxhIhwSCEIQiQxYJgDAgZIQglIAnYAjJJDVgTHEJWSUxWVgYSSJFg==', 'BIiEIJJTEJWAnCTYAhnEiQ0CEiGYAgklMCEJWFhCRdgCElYGUgDRYhCEJWF0CEIGMAhkNYwIGEhIkkIhIA==', 'DXYAjAhYhCYhIJJTGFIYSZYknVgYTQJWQgiAxCCRjRIliScGSYIQ2AI0iQZwCBklIhI=', 'GTVkSIZMBgiFyQYUhkkIJJTBISVlwJlYU2VwJlYU0CEiGYAgklNgCMCIcZJDYAjAhhCY', 'BIISAnYAjBkhIhkIZAhCMCRIZNAhCGRJHGSQwIhSCHEIJIgNWTBIIQl0CBnRZWBxYhIwJXBkgIUiGRhkCEJFxIhhCA==', 'GWGUIJJTYAjFiCUgCdWBNFlYGExCCWQIDGZWFNYxCCRjYAjFhkXVgTEJWAYg', 'FgCCY0IGAnGSQwJhhIDAkZF1IQhgICIDJYUmRdIkGcGAwSCEiFlYSRgNAiGRIAg=', 'UhIiTJFiAxSCSR0lYCNSAJWAnGSQ0SGchmCSUxSVhSRJWEkwSElZcUhCGAmCRNEgYUgI', 'GSRIIknRJWBIEiIAlYGAjFIYSR1ISIk0SAIYISAwIGEhJWBkkIkNAkXYSIgNFlYHWRcEhIIkkMEhJWXQiRIZCICA',
    'RZWBwIJmCSUwkwSElZJ1YEwJEhIiTFhmRIAgklNFlZSHAYJCJWAwIGRIA2CWIDFghCENIgGITEiYGEkg', 'EJWAnCTFlZWQgMElYQhCVhYJJTQIhmA1IZgCISCSU1YGdWBNgliA', 'QImFiJMBghCEIZSMZJDBJWEiAnRiRdWFIkgklMCGRISJDEIZJDFgCISMUhgJxCCAYgNElZY2VxIgJg==',
    'JYUmRcUhhJGCSUxCVmA0CVhJCITFgmANgCNWRIhk0WIQhCVhcQgkiAxIGSSCSUxSGEhhCEIhCA==', 'AkZFhCCSNZWAYJJTBIYCdYZJCGZWEkXFIAlZlZSEhhSAMVgYCdAiBJWEjYAjGCEhSVhJgA==', 'RZWBhMCWCEI1YBiExIYJJAlYWAwJiFIDCSZXQIQgYxSVlYQxIZCCGSRI1YEwIGWWISA=', 'WVgJwJWBmAIhJMUlYJJwSGRjCAhCGSQ2EgYxCVgGNQlZWWCSUxhJWBkkNWTQIJGICA==', 'WGUgkTUhhJCJMEhIZSEhkkSMQiWVkwIhgIJCNlYWTEIIQhCCIDVkxSVkkIA=', 'FicCGSQwJgkSRgklNldFlYHAJWBhIDVgTUhliAg=', 'SCUgCcWGEJHJJDVgTGBlIGAnGEJZWAnEJWAnQJWGYDVk2AIwCVhIJQlZNZWBkmGCTYSGCEI='];


let i = Math.floor(Math.random() * codedhaikus.length);
const b64 = codedhaikus[i]
const haikumorse = decodeHaiku(b64);
let haikuwordindex = 0;
const haikulength = haikumorse.length;





// Function to generate a random Morse word (an array of '.' and '-')
// Adjust probabilities as needed (here, 70% chance for dot, 30% for dash)
function generateNextMorseWord() {
    // const word = [];
    // for (let i = 0; i < length; i++) {
    //     word.push(Math.random() < 0.6 ? '.' : '-');
    // }
    const word = haikumorse[haikuwordindex];
    haikuwordindex++;
    if (haikuwordindex >= haikulength) {
        haikuwordindex = 0;
    }
    console.log(word)
    return word;
}

// Function to play a sequence of Morse beeps from a given array of symbols
function playMorseSequence(sequence, index = 0) {
    if (index >= sequence.length) return;
    // Inter-element gap (e.g., 0.1 sec) after each beep
    let interElementGap = 0.05;
    const symbol = sequence[index];
    let beepDuration=0;
    if (symbol === '.') {
        beepDuration = 0.1; // dot: 0.1 sec, dash: 0.3 sec
    } else if (symbol === '-') {
        beepDuration = 0.3; // dot: 0.1 sec, dash: 0.3 sec
    } 
    if (symbol === ' ') {
        interElementGap = 0.3;
    } else {
        playMorseBeep(beepDuration);
    }
    

   

    setTimeout(() => playMorseSequence(sequence, index + 1), (beepDuration + interElementGap) * 1000);
}

// Function to simulate one Morse word transmission
function simulateMorseWord() {
    // Random word length between 3 and 6 symbols
    // const wordLength = Math.floor(Math.random() * 10) + 3;
    const morseWord = generateNextMorseWord();
    // console.log(morseWord)
    playMorseSequence(morseWord);
}

// Function to schedule periodic Morse word transmissions
export function scheduleMorseTransmission() {
    if (audioCtx.state !== 'running') return; // Only schedule if running
    simulateMorseWord();

    // Inter-word gap (e.g., 1 second) plus a random delay (between 1 and 3 sec)
    const interWordGap = 1.0; // fixed gap
    const randomDelay = Math.random() * 30000 + 15000; // in milliseconds

    setTimeout(scheduleMorseTransmission, interWordGap * 1000 + randomDelay);
}

export function scheduleSoundtrack() {
    // Start scheduling the synth waves
    scheduleSynthWaveNote();
    // Start scheduling
    scheduleDataTransmission();
    setTimeout(scheduleBellSound, rand() * 10000 + 5000);
    // Start scheduling the violin sound
    setTimeout(scheduleViolinWave, rand() * 10000 + 5000);
    // Start the transmission
    setTimeout(scheduleMorseTransmission, rand() * 10000 + 5000);
}

export function playChime(frequency = 110) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    osc.connect(gain);
    gain.connect(masterGain);
    

    osc.start();
    osc.stop(now + 3);
}