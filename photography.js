function gaussianRandom(mean, stddev) {
    let u = 0;
    let v = 0;

    // Math.random() can technically return 0,
    // which we don't want inside log().
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const z =
        Math.sqrt(-2 * Math.log(u)) *
        Math.cos(2 * Math.PI * v);

    return mean + z * stddev;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function interp(a, b, t) {
    return a + (b - a) * t;
}

const triggers = document.querySelectorAll('.photo-trigger');
const pilePositions = [];

triggers.forEach((_, index) => {
    rotationDir = (index % 2 === 0) ? -1 : 1;
    pilePositions[index] = {
        xInit: clamp(gaussianRandom(0, 0.1), -0.3, 0.3) - 0.27,
        xFinal: clamp(gaussianRandom(0, 0.2), -0.4, 0.4) - 0.15,
        yInit: 0.8 + Math.random() * 0.1,
        yFinal: 0.16,
        rotateXFinal: 72,
        rotateZInit: -rotationDir * 1,
        rotateZ: rotationDir * 1,
        rotateZFinal: rotationDir * 12 + Math.random() * 10
    };
});

const cardScale = 0.16;
const photoStart = 0.2;
const photoStop = 0.8;
const photoX = -0.22;
const photoY = 0.48;

function update() {
    const imgRect = document.querySelector('.container.background').getBoundingClientRect()
    triggers.forEach((trigger, index) => {
        const photo = document.getElementById(trigger.dataset.photo);

        const rect = trigger.getBoundingClientRect();
        const p = 1 - rect.top / window.innerHeight;
        if (p < 0) {
            photo.style.opacity = 0;
            return;
        }

        const opacity = clamp(p / 0.1, 0, 1)
        photo.style.opacity = opacity;

        const p1 = clamp(p / photoStart, 0, 1);
        const p2 = clamp((p - photoStart) / (photoStop - photoStart), 0, 1);
        const p3 = clamp((p - 0.8) / (1 - photoStop), 0, 1);
        photo.querySelector('img').style.filter = `grayscale(${p3 * 100}%)`

        var x, y, z, rotateX, rotateZ, scale;

        const pos = pilePositions[index];
        const xInit = pos.xInit * imgRect.width;
        const xPhoto = photoX * imgRect.width;
        const xFinal = pos.xFinal * imgRect.width;
        const yInit = -pos.yInit * imgRect.height;
        const yPhoto = -photoY * imgRect.height;
        const yFinal = -pos.yFinal * imgRect.height;

        if (p3 > 0) {
            x = interp(xPhoto, xFinal, p3);
            y = interp(yPhoto, yFinal, p3);
            z = interp(0, -20, p3);
            rotateX = interp(0, pos.rotateXFinal, p3);
            rotateZ = interp(pos.rotateZ, pos.rotateZFinal, p3);
            scale = interp(1, cardScale, p3)
        } else if (p2 > 0) {
            x = xPhoto;
            y = yPhoto;
            z = 0;
            rotateX = 0;
            rotateZ = interp(pos.rotateZInit, pos.rotateZ, p2);
            scale = 1
        } else {
            x = interp(xInit, xPhoto, p1);
            y = interp(yInit, yPhoto, p1);
            z = 0
            rotateX = interp(-180, 0, p1);
            rotateZ = pos.rotateZInit;
            scale = interp(cardScale, 1, p1)
        }

        photo.style.transform = `
            translateX(${x}px)
            translateY(${y}px)
            translateZ(${z}px)
            rotateX(${rotateX}deg)
            rotateZ(${rotateZ}deg)
            scale(${scale})
        `;
    });
}

let ticking = false;

function requestUpdate() {
    if (!ticking) {
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });

        ticking = true;
    }
}

addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate);
update();
