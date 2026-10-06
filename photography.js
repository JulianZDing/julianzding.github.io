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
const width = window.innerWidth;

triggers.forEach((_, index) => {
    pilePositions[index] = {
        xInit: clamp(gaussianRandom(0, width/12), -width/6, width/6),
        xFinal: clamp(gaussianRandom(0, width/6), -width/3, width/3),
        yInit: window.innerHeight * 0.55,
        yFinal: Math.random() * 20 + 15,
        rotateZ: (Math.random() - 0.5) * 12
    };
});

function update() {
    triggers.forEach((trigger, index) => {
        const photo = document.getElementById(trigger.dataset.photo);
        const rect = trigger.getBoundingClientRect();
        const pos = pilePositions[index];

        const cardScale = 0.18;
        const photoStart = 0.2;
        const photoStop = 0.8;
        const photoX = 0;
        const photoY = 0.38 * window.innerHeight;

        const p = clamp(1 - rect.top / window.innerHeight, 0, 1);
        const p1 = p / photoStart;
        const p2 = (p - photoStart) / (photoStop - photoStart);
        const p3 = (p - 0.8) / (1 - photoStop);

        var x, y, z, rotateX, rotateZ, scale;
        photo.style.opacity = 1;

        if (p3 > 0) {
            x = interp(photoX, pos.xFinal, p3);
            y = interp(photoY, pos.yFinal, p3);
            z = interp(0, -20, p3);
            rotateX = interp(0, 70, p3);
            rotateZ = interp(0, pos.rotateZ, p3)
            scale = interp(1, cardScale, p3)
        } else if (p2 > 0) {
            x = photoX;
            y = photoY;
            z = 0;
            rotateX = 0;
            rotateZ = 0;
            scale = 1
        } else {
            photo.style.opacity = p1;
            x = interp(pos.xInit, photoX, p1);
            y = interp(pos.yInit, photoY, p1);
            z = 0
            rotateX = interp(-180, 0, p1);
            rotateZ = 0;
            scale = interp(cardScale, 1, p1)
        }

        photo.style.transform = `
            translateX(calc(${x}px - 45%))
            translateY(calc(90% - ${y}px))
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
