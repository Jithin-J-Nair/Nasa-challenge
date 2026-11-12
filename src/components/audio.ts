import { gsap } from 'gsap';
import { $ } from '../lib/dom';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneOn = false;
let activeRelease: (() => void) | null = null;
let gainTween: gsap.core.Tween | null = null;
const droneSources: AudioScheduledSourceNode[] = [];
const droneNodes: AudioNode[] = [];

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
  });
  droneNodes.splice(0).forEach((node) => node.disconnect());
}

function resetAudioGraph(): void {
  gainTween?.kill();
  gainTween = null;
  stopDrone();
  droneOn = false;
  masterGain?.disconnect();
  const context = audioContext;
  audioContext = null;
  masterGain = null;
  if (context && context.state !== 'closed') void context.close();
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
    droneNodes.push(oscillator, gain, lfo, lfoGain);
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
  droneNodes.push(source, bandPass, noiseGain);
}

/** Bind the opt-in audio control and fully release its graph on host disposal. */
export function initAudioControls(): () => void {
  if (activeRelease) return activeRelease;
  const button = $<HTMLButtonElement>('#soundBtn');
  const onToggle = (): void => {
    audioInit();
    if (!audioContext || !masterGain) return;
    if (audioContext.state === 'suspended') void audioContext.resume();
    droneOn = !droneOn;
    button.classList.toggle('on', droneOn);
    button.setAttribute('aria-pressed', String(droneOn));
    gainTween?.kill();
    gainTween = gsap.to(masterGain.gain, { value: droneOn ? .6 : 0, duration: 1.2 });
    if (droneOn) {
      startDrone();
      beep(880, .08, .06);
    } else {
      stopDrone();
    }
  };
  button.addEventListener('click', onToggle);
  const release = (): void => {
    button.removeEventListener('click', onToggle);
    button.classList.remove('on');
    button.setAttribute('aria-pressed', 'false');
    resetAudioGraph();
    if (activeRelease === release) activeRelease = null;
  };
  activeRelease = release;
  return release;
}
