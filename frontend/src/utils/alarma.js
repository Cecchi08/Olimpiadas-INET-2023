let context;
export function habilitarAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  context ||= new Audio();
  context.resume().catch(() => {});
}
export function sonarAlarma() {
  if (!context || context.state !== 'running') return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain); gain.connect(context.destination);
  const start = context.currentTime;
  oscillator.frequency.setValueAtTime(740, start);
  oscillator.frequency.setValueAtTime(980, start + .2);
  gain.gain.setValueAtTime(.04, start);
  gain.gain.exponentialRampToValueAtTime(.001, start + .7);
  oscillator.start(); oscillator.stop(start + .75);
}
