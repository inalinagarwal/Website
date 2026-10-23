(function () {
  'use strict';

  // All sounds are synthesized here. Audio remains off until enable() is called.
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const MASTER_LEVEL = Math.min(0.24, Math.max(0, 0.19));
  const MIN_GAIN = 0.0001;
  const MAX_VOICES = 40;
  const cooldowns = { hover: 120, type: 65, step: 75, roll: 320, page: 150 };
  const lastPlayed = Object.create(null);
  const voices = new Set();
  let context = null;
  let master = null;
  let roomSource = null;
  let noiseBuffer = null;
  let requested = false;
  let revision = 0;
  let suspendTimer = null;

  function clearSuspendTimer() {
    if (suspendTimer !== null) window.clearTimeout(suspendTimer);
    suspendTimer = null;
  }

  function fadeMaster(level, seconds) {
    if (!context || !master || context.state === 'closed') return;
    const now = context.currentTime;
    const gain = master.gain;
    if (typeof gain.cancelAndHoldAtTime === 'function') {
      gain.cancelAndHoldAtTime(now);
    } else {
      const current = gain.value;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(current, now);
    }
    gain.linearRampToValueAtTime(Math.min(MASTER_LEVEL, Math.max(0, level)), now + seconds);
  }

  function stopVoices() {
    voices.forEach(function (source) {
      try { source.stop(); } catch (_) { /* A completed source needs no cleanup. */ }
    });
    voices.clear();
  }

  function keepVoice(source, nodes) {
    voices.add(source);
    source.onended = function () {
      voices.delete(source);
      nodes.forEach(function (node) {
        try { node.disconnect(); } catch (_) { /* Already disconnected. */ }
      });
    };
  }

  function buildContext() {
    if (context && context.state !== 'closed') return;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0;

    // A conservative output level and gentle limiter keep overlapping cues quiet.
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 12;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.15;
    master.connect(limiter);
    limiter.connect(context.destination);

    noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;

    // Very quiet filtered air gives the reading room a little physical presence.
    roomSource = context.createBufferSource();
    roomSource.buffer = noiseBuffer;
    roomSource.loop = true;
    const low = context.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 360;
    low.Q.value = 0.35;
    const high = context.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 70;
    const roomGain = context.createGain();
    roomGain.gain.value = 0.018;
    roomSource.connect(low);
    low.connect(high);
    high.connect(roomGain);
    roomGain.connect(master);
    roomSource.start();
  }

  function quietAndSuspend(token) {
    clearSuspendTimer();
    if (!context || context.state === 'closed') return;
    fadeMaster(0, 0.045);
    const currentContext = context;
    suspendTimer = window.setTimeout(function () {
      suspendTimer = null;
      if (token !== revision || context !== currentContext || (requested && !document.hidden)) return;
      stopVoices();
      currentContext.suspend().then(function () {
        // If enable() raced an in-flight suspend, restore the latest intention.
        if (context === currentContext && requested && !document.hidden) resumeAudio(revision);
      }).catch(function () { /* Closing or background restrictions can reject suspend. */ });
    }, 65);
  }

  async function resumeAudio(token) {
    const currentContext = context;
    if (!currentContext || currentContext.state === 'closed') return false;
    try {
      if (currentContext.state !== 'running') await currentContext.resume();
      if (token !== revision || context !== currentContext || !requested) {
        if (context === currentContext && !requested) quietAndSuspend(revision);
        return context === currentContext && requested;
      }
      if (document.hidden) {
        quietAndSuspend(token);
      } else {
        fadeMaster(MASTER_LEVEL, 0.09);
      }
      return true;
    } catch (_) {
      if (token === revision && context === currentContext) {
        requested = false;
        quietAndSuspend(token);
      }
      return false;
    }
  }

  async function enable() {
    const token = ++revision;
    clearSuspendTimer();
    if (!AudioContextClass) {
      requested = false;
      return false;
    }
    requested = true;
    try {
      // Context creation and resume occur only through this explicit entry point.
      buildContext();
      return await resumeAudio(token);
    } catch (_) {
      if (token === revision) {
        requested = false;
        quietAndSuspend(token);
      }
      return false;
    }
  }

  function disable() {
    requested = false;
    quietAndSuspend(++revision);
  }

  function noise(when, duration, peak, frequency, quality) {
    if (voices.size >= MAX_VOICES) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = quality || 0.55;
    envelope.gain.setValueAtTime(MIN_GAIN, when);
    envelope.gain.linearRampToValueAtTime(Math.min(0.18, peak), when + Math.min(0.008, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, when + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);
    keepVoice(source, [source, filter, envelope]);
    source.start(when, Math.random() * Math.max(0, noiseBuffer.duration - duration));
    source.stop(when + duration + 0.012);
  }

  function tone(when, frequency, duration, peak, endFrequency) {
    if (voices.size >= MAX_VOICES) return;
    const source = context.createOscillator();
    const envelope = context.createGain();
    source.type = 'sine';
    source.frequency.setValueAtTime(frequency, when);
    if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, when + duration);
    envelope.gain.setValueAtTime(MIN_GAIN, when);
    envelope.gain.linearRampToValueAtTime(Math.min(0.18, peak), when + Math.min(0.018, duration * 0.15));
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, when + duration);
    source.connect(envelope);
    envelope.connect(master);
    keepVoice(source, [source, envelope]);
    source.start(when);
    source.stop(when + duration + 0.012);
  }

  function wood(when, weight) {
    tone(when, 155, 0.075, weight, 82);
    noise(when, 0.034, weight * 0.5, 1300, 0.65);
  }

  function play(type) {
    if (!requested || !context || context.state !== 'running' || document.hidden) return;
    const nowMs = performance.now();
    if (cooldowns[type] && lastPlayed[type] !== undefined && nowMs - lastPlayed[type] < cooldowns[type]) return;
    lastPlayed[type] = nowMs;
    const now = context.currentTime + 0.006;
    switch (type) {
      case 'hover':
        noise(now, 0.027, 0.022, 2200);
        break;
      case 'choose':
        wood(now, 0.105);
        break;
      case 'step':
        tone(now, 115, 0.085, 0.085, 65);
        noise(now, 0.048, 0.035, 780);
        break;
      case 'roll':
        for (let i = 0; i < 6; i += 1) {
          const at = now + i * 0.038 + Math.random() * 0.009;
          const weight = 0.1 * (1 - i * 0.105);
          noise(at, 0.035, weight, 1450 + Math.random() * 650, 0.8);
          tone(at, 190 + Math.random() * 45, 0.028, weight * 0.55, 105);
        }
        break;
      case 'success':
        tone(now, 220, 0.36, 0.085);
        tone(now + 0.065, 277.18, 0.38, 0.07);
        tone(now + 0.13, 329.63, 0.44, 0.06);
        break;
      case 'failure':
        tone(now, 146.83, 0.24, 0.09, 130.81);
        tone(now + 0.085, 110, 0.29, 0.065);
        break;
      case 'collect':
        noise(now, 0.035, 0.025, 1700);
        tone(now, 261.63, 0.34, 0.07);
        tone(now + 0.07, 329.63, 0.37, 0.06);
        tone(now + 0.14, 392, 0.4, 0.05);
        break;
      case 'page':
        noise(now, 0.145, 0.085, 1250, 0.35);
        noise(now + 0.048, 0.105, 0.045, 2400, 0.4);
        break;
      case 'type':
        noise(now, 0.019, 0.028, 1900, 0.7);
        break;
      default:
        break;
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (!requested || !context) return;
    const token = ++revision;
    if (document.hidden) {
      quietAndSuspend(token);
    } else {
      clearSuspendTimer();
      resumeAudio(token);
    }
  });

  window.addEventListener('pagehide', function () {
    requested = false;
    revision += 1;
    clearSuspendTimer();
    stopVoices();
    if (roomSource) {
      try { roomSource.stop(); } catch (_) { /* Already stopped. */ }
    }
    const previousContext = context;
    context = null;
    master = null;
    roomSource = null;
    noiseBuffer = null;
    if (previousContext && previousContext.state !== 'closed') {
      previousContext.close().catch(function () { /* Browser may already be closing. */ });
    }
  });

  window.AFTER_HOURS_AUDIO = Object.freeze({
    enable: enable,
    disable: disable,
    play: play,
    get enabled() { return requested; }
  });
})();
