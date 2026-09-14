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

// Adjust viewport scale if screen is too narrow
function adjustViewport() {
  const minWidth = 360; // Minimum width before resizing
  const screenWidth = window.screen.width;
  const viewportMeta = document.getElementById('viewport');

  // Prevent errors if the viewport element is missing
  if (!viewportMeta) return; 

  if (screenWidth < minWidth) {
    const scale = screenWidth / minWidth;
    viewportMeta.setAttribute('content', `width=${minWidth}, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no`);
  } else {
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
  }
}

// Run the script on window resize and initial load
window.addEventListener('resize', adjustViewport);
window.addEventListener('DOMContentLoaded', adjustViewport);
