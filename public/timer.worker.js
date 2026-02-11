/* eslint-disable no-restricted-globals */
let timerInterval = null;
let expected = 0;
let drift = 0;

self.onmessage = function (e) {
    const { action, interval } = e.data;

    if (action === 'START') {
        expected = Date.now() + 1000;
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setTimeout(step, 1000);
    } else if (action === 'PAUSE' || action === 'RESET') {
        if (timerInterval) clearTimeout(timerInterval);
        timerInterval = null;
    }
};

function step() {
    const dt = Date.now() - expected; // the drift (positive for overshooting)
    if (dt > 1000) {
        // confusing, maybe browser slept? Recover.
        expected += 1000;
    }

    // Broadcast tick
    self.postMessage('TICK');

    expected += 1000;
    timerInterval = setTimeout(step, Math.max(0, 1000 - dt)); // compensate
}
