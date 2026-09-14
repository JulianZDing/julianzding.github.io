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
    // Fallback: If path is just "/" (homepage root), highlight the home link
    else if (currentPath === "/" && linkHref === "index.html") {
      link.classList.add("active");
    }
  });
});

// Scroll back up instead of reloading if clicking on the same page in header
document.addEventListener("DOMContentLoaded", () => {
  // 1. Select all links inside the header (logo + navigation links)
  const headerLinks = document.querySelectorAll("header a");

  headerLinks.forEach(link => {
    link.addEventListener("click", (event) => {
      // 2. Get the current URL path (e.g., "/my-project/page2.html")
      const currentPath = window.location.pathname;
      
      // 3. Extract the target file name from the clicked link (e.g., "page2.html")
      const targetHref = link.getAttribute("href");

      // 4. Determine if the user is clicking a link to the page they are currently reading
      let isSamePage = false;

      // Handle homepage paths (catches root folder "/", "index.html", or repository names)
      if (targetHref === "index.html" || targetHref === "/") {
        const isAtRoot = currentPath.endsWith("/");
        const isAtIndex = currentPath.endsWith("index.html");
        if (isAtRoot || isAtIndex) isSamePage = true;
      } 
      // Handle all other standard pages (e.g., page2.html, about.html)
      else if (currentPath.endsWith(targetHref)) {
        isSamePage = true;
      }

      // 5. If it's the same page, intercept the click and scroll to top smoothly
      if (isSamePage) {
        event.preventDefault(); // ⚡ Stops the browser from reloading the page
        
        window.scrollTo({
          top: 0,
          behavior: "smooth" // ⚡ Glides back to the top of the viewport
        });
      }
    });
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
