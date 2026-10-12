// Animations for falling leaves

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

const linear = t => t;

const easeInCubic = t =>
    t * t * t;

const easeOutCubic = t =>
    1 - Math.pow(1 - t, 3);

const easeInOutCubic = t =>
    t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

function interp(a, b, t, ease) {
    return a + (b - a) * ease(t);
}

const triggers = document.querySelectorAll('.photo-trigger');
const pilePositions = [];

triggers.forEach((_, index) => {
    rotationDir = (index % 2 === 0) ? -1 : 1;
    pilePositions[index] = {
        xInit: clamp(gaussianRandom(0, 0.1), -0.2, 0.2) - 0.2,
        xFinal: clamp(gaussianRandom(0, 0.15), -0.3, 0.3) - 0.1,
        yInit: Math.random() * 0.18 + 0.35,
        yFinal: + Math.random() * 0.005 - 0.54,
        rotateXFinal: 70,
        rotateZInit: -rotationDir * 1,
        rotateZ: rotationDir * 1,
        rotateZFinal: rotationDir * 12 + Math.random() * 10
    };
});

const scaleInit = 0.1;
const scaleFinal = 0.16;
const photoStart = 0.2;
const photoStop = 0.8;

function update() {
    const treeRect = document.querySelector('.tree.large').getBoundingClientRect()
    const treeMinDim = Math.min(treeRect.width, treeRect.height)
    triggers.forEach((trigger, index) => {
        const photo = document.getElementById(trigger.dataset.photo);

        const rect = trigger.getBoundingClientRect();
        const p = 1 - rect.top / window.innerHeight;
        if (p < 0) {
            photo.style.setProperty("--photo-opacity", 0);
            photo.style.pointerEvents = "none";
            return;
        }

        const p1 = clamp(p / photoStart, 0, 1);
        const p2 = clamp((p - photoStart) / (photoStop - photoStart), 0, 1);
        const p3 = clamp((p - 0.8) / (1 - photoStop), 0, 1);
        photo.querySelector('img').style.filter = `grayscale(${p3 * 100}%)`

        var x, y, z, rotateX, rotateZ, scale;

        const pos = pilePositions[index];
        const xInit = pos.xInit * treeMinDim;
        const xPhoto = 0;
        const xFinal = pos.xFinal * treeMinDim;
        const yInit = -pos.yInit * treeMinDim;
        const yPhoto = 0;
        const yFinal = -pos.yFinal * treeMinDim;

        if (p3 > 0) {
            x = interp(xPhoto, xFinal, p3, easeInOutCubic);
            y = interp(yPhoto, yFinal, p3, easeInOutCubic);
            z = interp(0, -20, p3, easeInOutCubic);
            rotateX = interp(0, pos.rotateXFinal, p3, easeInOutCubic);
            rotateZ = interp(pos.rotateZ, pos.rotateZFinal, p3, easeInOutCubic);
            scale = interp(1, scaleFinal, p3, easeInOutCubic)
        } else if (p2 > 0) {
            x = xPhoto;
            y = yPhoto;
            z = 0;
            rotateX = 0;
            rotateZ = interp(pos.rotateZInit, pos.rotateZ, p2, linear);
            scale = 1
        } else {
            x = interp(xInit, xPhoto, p1, linear);
            y = interp(yInit, yPhoto, p1, easeOutCubic);
            z = 0
            rotateX = interp(-180, 0, p1, linear);
            rotateZ = pos.rotateZInit;
            scale = interp(scaleInit, 1, p1, easeInCubic)
        }

        const opacity = clamp(p / 0.1, 0, 1)
        const frontOpacity = rotateX > -90 ? opacity : 0;
        photo.style.setProperty("--photo-opacity", frontOpacity);
        const backOpacity  = rotateX <= -90 ? opacity : 0;
        photo.style.setProperty("--back-opacity", backOpacity);

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

// Scroll hint

const scrollHint = document.querySelector(".scroll-hint");

if (scrollHint) {
    let hasScrolled = window.scrollY > 0;

    const hintTimer = setTimeout(() => {
        if (!hasScrolled) {
            scrollHint.classList.add("visible");
        }
    }, 10000);

    function dismissHint() {
        hasScrolled = true;
        clearTimeout(hintTimer);
        scrollHint.classList.remove("visible");
    }

    window.addEventListener("scroll", dismissHint, {
        passive: true,
        once: true
    });
}
