// Navbar scroll behavior for all pages
// NOTE: Much of the auth UI update logic (showing/hiding login button vs user profile)
// is now handled directly in auth.js by `updateUIForLoggedInUser` and `updateUIForLoggedOutUser`.
// navbar.js mainly ensures that event listeners for opening modals are set up if not already handled by auth.js.

document.addEventListener('DOMContentLoaded', () => {
  // The setupAuthEventListeners in auth.js should handle modal opening.
  // This file (navbar.js) will primarily focus on its original navbar duties.
  // We ensure that `checkUserSession` from auth.js is called, which also sets up auth listeners.
  if (typeof checkUserSession === 'function') {
    // checkUserSession(); // This is already called in auth.js DOMContentLoaded
  } else {
    console.warn('checkUserSession function from auth.js not found.');
  }

  // Initial check for scroll position
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    // Add scrolled class by default to ensure consistent appearance across all pages
    navbar.classList.add('scrolled');
    
    // Handle scroll events
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        // Only remove the scrolled class on the homepage and other pages with banners
        const isHomePage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html' ||
                          document.querySelector('.banner') !== null;
        
        if (isHomePage) {
          navbar.classList.remove('scrolled');
        }
      }
    });
    
    // Trigger scroll event to set initial state
    window.dispatchEvent(new Event('scroll'));
  }

  // Check for 'open_search' query parameter on page load
  const urlParams = new URLSearchParams(window.location.search);
  const openSearch = urlParams.get('open_search');

  if (openSearch === 'true') {
    // Ensure openSearchModal function exists and is callable
    if (typeof openSearchModal === 'function') {
        // Attempt to open the modal
        try {
            openSearchModal();
            // Optionally, focus the search input if it's a known ID
            // Use the ID of the search input within the main search modal, not the navbar one.
            const searchInputInModal = document.querySelector('#search-modal #search-input'); 
            if (searchInputInModal) {
                searchInputInModal.focus();
            }
        } catch (e) {
            console.error("Error trying to open search modal or focus input: ", e);
        }
    } else {
        console.warn("openSearchModal function not found, cannot open search modal automatically.");
    }
  }

  // Hamburger Menu Toggle
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');

  if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      hamburgerMenu.setAttribute('aria-expanded', isExpanded);
      // Optional: Change hamburger icon to 'X' when menu is open
      const icon = hamburgerMenu.querySelector('i');
      if (icon) {
        if (isExpanded) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times'); // 'X' icon
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu if a link is clicked (optional, good for SPA-like behavior or same-page links)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          hamburgerMenu.setAttribute('aria-expanded', 'false');
          const icon = hamburgerMenu.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        }
      });
    });
  } else {
    if (!hamburgerMenu) console.warn("Hamburger menu button not found.");
    if (!navLinks) console.warn("Nav links container not found for hamburger menu.");
  }

  // Active link highlighting based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navAnchors = document.querySelectorAll('.nav-links > a'); // Target direct children to avoid affecting buttons within auth containers
  navAnchors.forEach(link => {
    // Check if the link is part of the auth UI, if so, skip standard active highlighting
    if (link.closest('#auth-button-container') || link.closest('#user-profile-area')) {
      return;
    }
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage && !link.href.includes('open_search=true')) { // Don't mark search as active unless it's the primary action
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Special handling for search nav link if it's just a trigger
  const searchNavLink = document.querySelector('.search-nav-link');
  if (searchNavLink && searchNavLink.getAttribute('href').includes('open_search=true')) {
    // If the current URL itself triggered the search modal, keep search link active
    if (window.location.search.includes('open_search=true')) {
        // searchNavLink.classList.add('active'); // Decided against this to avoid confusion with page links
    } else {
        searchNavLink.classList.remove('active');
    }
  }
  // Ensure home is active if it's index.html without other specific active links
  const homeLink = document.querySelector('.nav-links a[href="index.html"]');
  if (currentPage === 'index.html' && !document.querySelector('.nav-links a.active') && homeLink) {
    let otherActive = false;
    navAnchors.forEach(a => { if(a.classList.contains('active') && a !== homeLink) otherActive = true; });
    if(!otherActive) homeLink.classList.add('active');
  }

});
