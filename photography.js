// Animations for falling photographs

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

let triggers = [...document.querySelectorAll(".photo-trigger")];

// Make photos pile up when they overlap on the ground
const numBins = 30;

function getBin(x) {
    return clamp(
        Math.floor((x + 0.5) * numBins),
        0,
        numBins - 1
    );
}

function generatePile() {
    const leafCount = new Uint16Array(numBins);
    triggers.forEach((trigger, index) => {
        const rotationDir = (index % 2 === 0) ? -1 : 1;
        const pos = {
            hidden: null,
            settled: false,
            layoutVersion: -1,
            xInit: clamp(gaussianRandom(0, 0.1), -0.2, 0.2) - 0.2,
            xFinal: clamp(gaussianRandom(0, 0.15), -0.3, 0.3) - 0.1,
            yInit: Math.random() * 0.13 + 0.27,
            yFinal: -0.5,
            rotateXFinal: 70,
            rotateZInit: -rotationDir * 1,
            rotateZ: rotationDir * 1,
            rotateZFinal: rotationDir * 12 + Math.random() * 10,
        };
        const bin = getBin(pos.xFinal);
        pos.layer = leafCount[bin];
        leafCount[bin]++;

        trigger.photoPosition = pos;
        trigger.photo = document.getElementById(trigger.dataset.photo);
    });
}

const tree = document.querySelector(".tree.large");
const pile = document.querySelector(".photo-pile");
const images = [...document.querySelectorAll(".photo img")];

let layoutVersion = 0;
let treeWidth = 0;
let treeHeight = 0;

function updateLayout() {
    const treeRect = tree.getBoundingClientRect();
    const pileRect = pile.getBoundingClientRect();

    treeWidth = treeRect.width;
    treeHeight = treeRect.height;

    const desiredHeight = treeHeight * 0.41;
    const desiredWidth = Math.max(
        0,
        Math.min(
            treeWidth * 0.7,
            window.innerWidth - pileRect.left - 30
        )
    );

    for (const img of images) {
        const imgWidth = Number(img.getAttribute("width"));
        const imgHeight = Number(img.getAttribute("height"));

        const desiredScale = Math.min(
            desiredWidth / imgWidth,
            desiredHeight / imgHeight,
            1
        );

        img.style.width = `${imgWidth * desiredScale}px`;
        img.style.height = `${imgHeight * desiredScale}px`;
    }
}

function calculateProgress(trigger) {
    const rect = trigger.getBoundingClientRect();
    return 1 - rect.top / window.innerHeight;
}

const scaleInit = 0.1;
const scaleFinal = 0.16;
const photoStart = 0.3;
const photoStop = 0.8;
const preloadCount = 5;

let currentPhotoIndex = 0;

function update() {
    currentPhotoIndex = triggers.findIndex(trigger => {
        const p = calculateProgress(trigger);
        return p >= 0 && p < 1;
    });
    const loadToThisIndex = currentPhotoIndex + preloadCount + 1;

    triggers.forEach((trigger, index) => {
        const pos = trigger.photoPosition;
        const photo = trigger.photo;

        // Pre-load thumbnails up to the next N triggers to enter the viewport
        if (currentPhotoIndex === -1 || index < loadToThisIndex) {
            const img = photo.querySelector("img");
            if (!img.hasAttribute("src")) {
                img.addEventListener("load", () => {
                    img.classList.add("loaded");
                }, { once: true });

                img.src = img.dataset.src;
            }
        }

        const p = calculateProgress(trigger);

        if (p < 0) {
            if (pos.hidden) return;

            photo.style.setProperty("--photo-opacity", 0);
            photo.style.setProperty("--back-opacity", 0);
            photo.style.visibility = "hidden";
            pos.hidden = true;
            return;
        }
        photo.style.visibility = "visible";
        pos.hidden = false;

        const p1 = clamp(p / photoStart, 0, 1);
        const p2 = clamp((p - photoStart) / (photoStop - photoStart), 0, 1);
        const p3 = clamp((p - photoStop) / (1 - photoStop), 0, 1);

        var x, y, z, rotateX, rotateZ, scale;

        const xInit = pos.xInit * treeWidth;
        const xPhoto = 0;
        const xFinal = pos.xFinal * treeWidth;
        const yInit = -pos.yInit * treeHeight;
        const yPhoto = 0;
        const yFinal = -pos.yFinal * treeHeight - pos.layer * treeHeight * 0.005;
        const zFinal = -20;

        if (p >= 1) {
            if (pos.settled && pos.layoutVersion === layoutVersion) return;
            
            photo.style.setProperty("--photo-opacity", 1);
            photo.style.setProperty("--back-opacity", 0);
            photo.style.transformOrigin = "center top";
            photo.style.transform = `
                translateX(${xFinal}px)
                translateY(${yFinal}px)
                translateZ(${zFinal}px)
                rotateX(${pos.rotateXFinal}deg)
                rotateZ(${pos.rotateZFinal}deg)
                scale(${scaleFinal})
            `;
            pos.settled = true;
            pos.layoutVersion = layoutVersion;
            return;
        }
        pos.settled = false;

        if (p3 > 0) {
            photo.style.transformOrigin = "center top";
            x = interp(xPhoto, xFinal, p3, easeInOutCubic);
            y = interp(yPhoto, yFinal, p3, easeInOutCubic);
            z = interp(0, zFinal, p3, easeInOutCubic);
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
            photo.style.transformOrigin = "center";
            x = interp(xInit, xPhoto, p1, linear);
            y = interp(yInit, yPhoto, p1, easeOutCubic);
            z = 0
            rotateX = interp(-180, 0, p1, linear);
            rotateZ = pos.rotateZInit;
            scale = interp(scaleInit, 1, p1, easeInCubic);
        }

        const opacity = clamp(p / 0.1, 0, 1)
        const frontOpacity = rotateX > -90 ? opacity : 0;
        photo.style.setProperty("--photo-opacity", frontOpacity);
        const backOpacity = rotateX <= -90 ? opacity : 0;
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

// Trigger updates as appropriate
let updateTick = false;

function requestUpdate() {
    if (!updateTick) {
            requestAnimationFrame(() => {
                update();
                updateTick = false;
            });

        updateTick = true;
    }
}

let layoutTick = false;

function requestUpdateLayout() {
    if (!layoutTick) {
            requestAnimationFrame(() => {
                updateLayout();
                layoutVersion++;
                layoutTick = false;

                requestUpdate();
            });

        layoutTick = true;
    }
}

const sceneWrapper = document.querySelector(".scene-wrapper");
const resizeObserver = new ResizeObserver(requestUpdateLayout);
resizeObserver.observe(sceneWrapper);
addEventListener("scroll", requestUpdate, { passive: true });
addEventListener("resize", requestUpdate)

generatePile();
updateLayout();
update();

// Handle photo shuffling

let swapCandidates = [];
let swapVersion = -1;

function swapCurrentPhoto() {
    const n = triggers.length;
    const i = currentPhotoIndex;

    if (i < 0 || i >= n - 1) return;

    // Collect all unseen photos ahead of current scroll position
    if (swapVersion !== i || swapCandidates.length === 0) {
        swapVersion = i;
        swapCandidates = triggers.slice(i + 1).map(trigger => trigger.photo);
    }

    // Swap one random photo from unseen list
    const k = Math.floor(Math.random() * swapCandidates.length);
    const selectedPhoto = swapCandidates.splice(k, 1)[0];

    const a = triggers[i];
    const b = triggers.slice(i + 1).find(trigger =>
        trigger.photo === selectedPhoto
    );

    [a.photo, b.photo] = [b.photo, a.photo];

    // Reset cached state of swapped triggers
    for (const trigger of [a, b]) {
        trigger.photoPosition.hidden = null;
        trigger.photoPosition.settled = false;
    }

    // Center the current photograph's scroll progress
    const targetScrollY =
        window.scrollY
        + a.getBoundingClientRect().top
        - window.innerHeight * 0.5;

    window.scrollTo({
        top: targetScrollY,
        behavior: "smooth"
    });

    requestUpdate();
}

const trunk = document.querySelector(".tree.large #Trunk");
trunk.addEventListener("click", swapCurrentPhoto);

// Delayed hints

const scrollHint = document.querySelector(".scroll-hint");
const shuffleHint = document.querySelector(".shuffle-hint");

let hasScrolled = window.scrollY > 0;

const hintTimer = setTimeout(() => {
    if (!hasScrolled) {
        scrollHint.classList.add("visible");
    }
}, 7000);

function dismissHint() {
    hasScrolled = true;
    clearTimeout(hintTimer);
    scrollHint?.classList.remove("visible");
    // Show shuffle hint only after the user has scrolled
    setTimeout(() => shuffleHint?.classList.add("visible"), 5000);
}

window.addEventListener("scroll", dismissHint, {
    passive: true,
    once: true
});
