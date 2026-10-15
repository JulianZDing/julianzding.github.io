function pxToRem(pxValue) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return pxValue / rootFontSize;
}

// Fade in reveal scrolling elements
document.addEventListener("DOMContentLoaded", () => {
    // 1. Select all elements you want to reveal
    const revealElements = document.querySelectorAll(".reveal");

    // 2. Define the observer configuration options
    const observerOptions = {
        root: null,
        rootMargin: "0px 0px -4% 0px",
        threshold: 0
    };

    // 3. Create the observer callback function
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            // Check if the element has entered the viewport
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    };

    // 4. Initialize the IntersectionObserver
    const revealObserver = new IntersectionObserver(revealCallback, observerOptions);

    // 5. Attach the observer to each targeted element
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
});

// Add dynamic spacing to right column to reveal labels on left column when shrinking
const rows = document.querySelectorAll('.timeline-era');
rows.forEach(row => {
    const topDiv = row.querySelector('.timeline-era-label');
    const bottomDiv = row.querySelector('.timeline-era-img')
    const targetDiv = row.querySelector('.timeline-event-right-container');
    const PADDING_REM = 2

    function calcPaddingRem(entry) {
        const currentHeightPx = entry.contentRect.height;
        return pxToRem(currentHeightPx) + PADDING_REM;
    }

    if (topDiv && targetDiv) {
        const rowObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                targetDiv.style.setProperty(
                    '--dynamic-padding-top',
                    `${calcPaddingRem(entry)}rem`
                );
            }
        });
        // Start tracking this specific left element
        rowObserver.observe(topDiv);
    } 
    
    if (bottomDiv && targetDiv) {
        const rowObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                targetDiv.style.setProperty(
                    '--dynamic-padding-bottom',
                    `${calcPaddingRem(entry)}rem`
                );
            }
        });
        // Start tracking this specific left element
        rowObserver.observe(bottomDiv);
    }
});
