const canvas = document.getElementById('ring-canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('audio-upload');
const moodLabel = document.getElementById('mood-label');

let audioCtx, analyser, dataArray, source;
let animationId;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const MOODS = {
        energetic: { color: [255, 80, 0], speed: 0.05, roughness: 2 },
        chill: { color: [0, 200, 255], speed: 0.01, roughness: 0.5 },
        tense: { color: [150, 0, 255], speed: 0.08, roughness: 4 },
        melancholy: { color: [100, 100, 120], speed: 0.005, roughness: 0.2 }
};

fileInput.addEventListener('change', function() {
        if (audioCtx) audioCtx.close();
        setupAudio(this.files[0]);
});

function setupAudio(file) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);

        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        audio.play();
        renderError();
}

function getMood(data) {
        const lowEnd = data.slice(0, 10).reduce((a, b) => a + b) / 10;
        const highEnd = data.slice(80, 120).reduce((a, b) => a + b) / 40;

        if (lowEnd > 180) return MOODS.energetic;
        if (highEnd > 100) return MOODS.tense;
        if (lowEnd < 80) return MOODS.melancholy;
        return MOODS.chill;
}

function drawRing(mood, volume) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = 150 + (volume * 0.5);

        ctx.beginPath();
        for (let i = 0; i <= 360; i += 2) {
                const angle = (i * Math.PI) / 180;
                const offset = Math.sin(angle * 10 + Date.now() * mood.speed) * (volume * mood.roughness * 0.2);
                const r = baseRadius + offset;
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.strokeStyle = `rgb(${mood.color[0]}, ${mood.color[1]}, ${mood.color[2]})`;
        ctx.lineWidth = 5 + (volume / 50);
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
}

function render() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        analyser.getByteFrequencyData(dataArray);
        const avgVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const currentMood = getMood(dataArray);

        drawRing(currentMood, avgVolume);
        animationId = requestAnimationFrame(render);
}

window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
});
