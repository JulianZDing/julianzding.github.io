document.addEventListener("DOMContentLoaded", () => {
  // 1. Select all elements you want to reveal
  const revealElements = document.querySelectorAll(".reveal");

  // 2. Define the observer configuration options
  const observerOptions = {
    root: null,         // Use the browser viewport as the container
    rootMargin: "0px",  // No extra margin expansion around the root
    threshold: 0.15     // Trigger when 15% of the element is visible
  };

  // 3. Create the observer callback function
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      // Check if the element has entered the viewport
      if (entry.isIntersecting) {
        entry.target.classList.add("active"); // Add the CSS trigger class
        observer.unobserve(entry.target);     // Stop tracking once revealed
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