// Bold current page in header
document.addEventListener("DOMContentLoaded", () => {
  // 1. Get the current page URL path (e.g., "/about.html")
  const currentPath = window.location.pathname;

  // 2. Select all navigation links
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    // 3. Extract the href attribute from the link
    const linkHref = link.getAttribute("href");

    // 4. Check if the current URL ends with or includes this link's href
    if (currentPath.endsWith(linkHref)) {
      link.classList.add("active");
    }
  });
});


// Fade in reveal scrolling elements
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
