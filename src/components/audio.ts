import { gsap } from 'gsap';
import { $ } from '../lib/dom';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneOn = false;
let controlsBound = false;
const droneSources: AudioScheduledSourceNode[] = [];

function audioInit(): void {
  if (audioContext) return;
  if (!('AudioContext' in window)) return;
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);
}

function stopDrone(): void {
  droneSources.splice(0).forEach((source) => {
    try {
      source.stop();
    } catch {
      // Sources that have already ended cannot be stopped again.
    }
    source.disconnect();
  });
}

/** Play a tiny UI tone only after the visitor has enabled sound. */
export function beep(frequency = 660, duration = .04, volume = .05): void {
  if (!audioContext || !masterGain || !droneOn) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + .006);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + .02);
}

export function blip(): void {
  if (!audioContext || !droneOn || Math.random() > .35) return;
  beep(1100 + Math.random() * 700, .014, .014);
}

function startDrone(): void {
  const context = audioContext;
  const output = masterGain;
  if (!context || !output || droneSources.length > 0) return;
  [55, 82.5, 110.3].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    oscillator.type = index === 2 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = index === 2 ? .05 : .11;
    lfo.frequency.value = .04 + index * .021;
    lfoGain.gain.value = .035;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start();
    lfo.start();
    droneSources.push(oscillator, lfo);
  });
  const bufferSize = 2 * context.sampleRate;
  const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) data[index] = (Math.random() * 2 - 1) * .4;
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  const bandPass = context.createBiquadFilter();
  bandPass.type = 'bandpass';
  bandPass.frequency.value = 1400;
  bandPass.Q.value = .6;
  const noiseGain = context.createGain();
  noiseGain.gain.value = .012;
  source.connect(bandPass);
  bandPass.connect(noiseGain);
  noiseGain.connect(output);
  source.start();
  droneSources.push(source);
}

/** Bind the opt-in audio control once. Sources are cleaned on every toggle-off. */
export function initAudioControls(): void {
  if (controlsBound) return;
  controlsBound = true;
  const button = $<HTMLButtonElement>('#soundBtn');
  button.addEventListener('click', () => {
    audioInit();
    if (!audioContext || !masterGain) return;
    if (audioContext.state === 'suspended') void audioContext.resume();
    droneOn = !droneOn;
    button.classList.toggle('on', droneOn);
    button.setAttribute('aria-pressed', String(droneOn));
    gsap.to(masterGain.gain, { value: droneOn ? .6 : 0, duration: 1.2 });
    if (droneOn) {
      startDrone();
      beep(880, .08, .06);
    } else {
      stopDrone();
    }
  });
}
