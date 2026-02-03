/*
 *
 * ______/\\\\\\\\\\\_________________________________________/\\\\\\\\\\\\\__________________________/\\\_______________________________        
 * _____\/////\\\///_________________________________________\/\\\/////////\\\_______________________\/\\\_______________________________       
 *  _________\/\\\____________________________________________\/\\\_______\/\\\_______________________\/\\\_______________________________      
 *   _________\/\\\_________/\\\\\________/\\\\\\\\____________\/\\\\\\\\\\\\\\___/\\\\\\\\\___________\/\\\______/\\\\\\\\___/\\/\\\\\\\__     
 *    _________\/\\\_______/\\\///\\\____/\\\/////\\\___________\/\\\/////////\\\_\////////\\\_____/\\\\\\\\\____/\\\/////\\\_\/\\\/////\\\_    
 *     _________\/\\\______/\\\__\//\\\__/\\\\\\\\\\\____________\/\\\_______\/\\\___/\\\\\\\\\\___/\\\////\\\___/\\\\\\\\\\\__\/\\\___\///__   
 *      __/\\\___\/\\\_____\//\\\__/\\\__\//\\///////_____________\/\\\_______\/\\\__/\\\/////\\\__\/\\\__\/\\\__\//\\///////___\/\\\_________  
 *       _\//\\\\\\\\\_______\///\\\\\/____\//\\\\\\\\\\___________\/\\\\\\\\\\\\\/__\//\\\\\\\\/\\_\//\\\\\\\/\\__\//\\\\\\\\\\_\/\\\_________ 
 *        __\/////////__________\/////_______\//////////____________\/////////////_____\////////\//___\///////\//____\//////////__\///__________
 *
 *         To reviewers: Thanks for looking. Reach out via the contact form if you'd like to connect.
 *
 * joebader.com - Resume Site
 * Nav, smooth scroll, accordion, form handling, scroll animations, theme toggle
*/

/**
 * IIFE = Immediately Invoked Function Expression. The (function () { ... })() pattern
 * runs the code right away and keeps all variables (const, let, function) inside this
 * scope, so nothing leaks to the global window object. That avoids naming collisions
 * with other scripts. No build step: vanilla JS, runs in any modern browser.
 */
(function () {
  'use strict'; // Catches common mistakes (e.g. typos in variable names) and disallows some unsafe patterns.

  const THEME_KEY = 'theme';

  // ============================================
  // Theme toggle (OS preference + manual override)
  // ============================================
  // Theme is driven by a data-theme attribute on <html>. CSS uses [data-theme="light"]
  // and [data-theme="dark"] to switch variables. Initial theme is set in a blocking
  // script in the HTML head (before paint) to avoid flash of wrong theme.

  function getPreferredTheme() {
    // matchMedia lets us query CSS media features. prefers-color-scheme reflects the
    // user's OS/browser setting (light or dark mode). .matches is true if the query matches.
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    // document.documentElement is the <html> element. We put data-theme there so CSS
    // can target it with [data-theme="light"] etc.
    document.documentElement.setAttribute('data-theme', theme);
    // localStorage persists across page reloads and browser restarts. Key-value store.
    localStorage.setItem(THEME_KEY, theme);
  }

  function useSystemTheme() {
    const theme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.removeItem(THEME_KEY); // Clear our override so we follow system again.
  }

  function toggleTheme(e) {
    // e.detail is 2 for double-click, 1 for single-click. Double-click clears the
    // manual override and reverts to system preference.
    if (e.detail === 2) {
      useSystemTheme();
      return;
    }
    // || 'dark' provides a default if the attribute is missing (e.g. first load).
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // querySelector returns the first element matching the CSS selector, or null.
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // If user hasn't set a manual preference, keep theme in sync when they change
  // system light/dark mode (e.g. in OS settings).
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    }
  });

  // ============================================
  // Header scroll state
  // ============================================
  // Adds a .scrolled class when the user has scrolled past 20px. CSS uses this to
  // slightly increase header opacity for better contrast over content.
  // passive: true tells the browser we won't call preventDefault() on the scroll
  // event. That lets the browser optimize scrolling (e.g. on mobile) because it
  // knows we can't cancel it.

  const header = document.getElementById('site-header');
  if (header) {
    const updateHeader = () => {
      // window.scrollY = how many pixels the page is scrolled down. classList.toggle
      // (name, condition) adds the class if condition is true, removes it if false.
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader(); // Run once on load in case page is already scrolled (e.g. hash link).
  }

  // ============================================
  // Nav highlight for visible section
  // ============================================
  // As the user scrolls, we determine which section is "active" (the topmost one
  // that has crossed a line 100px from the top of the viewport). We iterate in
  // order so the last section that passes the threshold wins. If none have (e.g.
  // at top of page), we default to the first section.
  // aria-current tells screen readers which nav item is current; improves accessibility.

  const navSections = ['summary', 'experience', 'technical', 'contact'];
  // querySelectorAll returns all matching elements. a[href^="#"] = anchors whose href starts with "#".
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNav() {
    const headerOffset = 100; // Pixels from top of viewport. Accounts for sticky header.
    let activeId = null;

    navSections.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      // getBoundingClientRect() returns position/size relative to the viewport.
      // rect.top = distance from top of viewport. Negative means scrolled past.
      const rect = section.getBoundingClientRect();
      if (rect.top <= headerOffset) {
        activeId = id;
      }
    });

    if (!activeId && navSections.length) {
      activeId = navSections[0];
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('nav-link--active', href === `#${activeId}`);
      link.setAttribute('aria-current', href === `#${activeId}` ? 'true' : null);
    });
  }

  window.addEventListener('scroll', () => {
    updateActiveNav();
  }, { passive: true });
  updateActiveNav(); // Initial state.

  // ============================================
  // Smooth scroll for nav links
  // ============================================
  // Intercept clicks on in-page links and use scrollIntoView with behavior: 'smooth'
  // instead of the default jump. We handle all # links (nav + skip link).
  // block: 'start' aligns the target's top with the viewport top. scroll-margin in
  // CSS offsets this so content isn't hidden under the sticky header.

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || !href) return; // Skip empty or placeholder links.
      const target = document.querySelector(href); // href is e.g. "#summary".
      if (target) {
        e.preventDefault(); // Stop the browser's default jump-to-anchor behavior.
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================
  // Earlier Career accordion
  // ============================================
  // An accordion expands/collapses content. We use aria-expanded (true/false) for
  // accessibility; CSS targets [aria-expanded="false"] and hides the content with
  // display:none. We only toggle the attribute. No animation library needed.

  const earlierCareerToggle = document.getElementById('earlier-career-toggle');
  const earlierCareerContent = document.getElementById('earlier-career-content');
  if (earlierCareerToggle && earlierCareerContent) {
    earlierCareerToggle.addEventListener('click', () => {
      // getAttribute returns a string; we compare to 'true' then flip to the opposite.
      const isExpanded = earlierCareerToggle.getAttribute('aria-expanded') === 'true';
      earlierCareerToggle.setAttribute('aria-expanded', !isExpanded);
    });
  }

  // ============================================
  // Contact form (Formspree + reCAPTCHA v3)
  // ============================================
  // Form submits to Formspree, which forwards to email. reCAPTCHA v3 runs invisibly;
  // we lazy-load the script only when the user focuses the form or scrolls near the
  // contact section (IntersectionObserver) to avoid loading it for visitors who never
  // interact. On submit we attach the token; Formspree validates it server-side. We
  // retry up to 2 times on certain browser/network errors that are often transient.

  const form = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  // dataset gives us data-* attributes as camelCase. data-recaptcha-site-key -> recaptchaSiteKey.
  // The ?. (optional chaining) means: if form is null, we get undefined instead of an error.
  const recaptchaSiteKey = form?.dataset.recaptchaSiteKey;
  let recaptchaLoaded = false;

  function loadRecaptcha() {
    if (!recaptchaSiteKey || recaptchaSiteKey === 'YOUR_RECAPTCHA_SITE_KEY' || recaptchaLoaded) return;
    recaptchaLoaded = true; // Guard against double-load if both focusin and IO fire.
    // Dynamically add a <script> tag to load the reCAPTCHA library. We do this on
    // demand (lazy load) instead of in the HTML, so users who never touch the form
    // don't download it.
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    document.head.appendChild(script);
  }

  if (form && recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_SITE_KEY') {
    // focusin fires when any form field gets focus. { once: true } = run at most once.
    form.addEventListener('focusin', loadRecaptcha, { once: true });
    // Also load when contact section comes into view (user scrolling down to it).
    // IntersectionObserver fires a callback when an element enters/leaves the viewport.
    // rootMargin: '100px' = trigger 100px before the element is visible. threshold: 0
    // = fire as soon as any part is visible.
    const contactSection = document.getElementById('contact');
    if (contactSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) loadRecaptcha();
        },
        { rootMargin: '100px', threshold: 0 }
      );
      observer.observe(contactSection);
    }
  }

  async function getRecaptchaToken() {
    if (!recaptchaSiteKey || recaptchaSiteKey === 'YOUR_RECAPTCHA_SITE_KEY' || typeof grecaptcha === 'undefined') {
      return null;
    }
    // grecaptcha.ready() runs our callback when the reCAPTCHA script has finished
    // loading. We wrap this in a Promise so we can await it. resolve is the function
    // we call when we have the token.
    return new Promise((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then(resolve);
      });
    });
  }

  async function submitForm(retryCount = 0) {
    // FormData collects all form fields (name, email, message) into a format we can
    // send in the request body. form.action is the URL from the form's action attribute.
    const data = new FormData(form);
    const token = await getRecaptchaToken();
    if (token) data.set('g-recaptcha-response', token);

    // fetch returns a Response. We await it because it's asynchronous (network I/O).
    const response = await fetch(form.action, {
      method: form.method, // Usually 'POST' from the form.
      body: data,
      headers: { Accept: 'application/json' }, // Ask for JSON response so we can parse errors.
    });

    const json = await response.json();

    // response.ok is true when status is 2xx (e.g. 200). 4xx/5xx = false.
    if (response.ok) {
      formFeedback.setAttribute('aria-live', 'polite'); // Announces success to screen readers.
      formFeedback.textContent = 'Thanks for your submission!';
      formFeedback.classList.add('success');
      form.reset();
      return;
    }

    // Formspree sometimes returns browser-error/error_codes for transient issues; retry.
    // The regex tests if the error string contains those phrases (i = case insensitive).
    const isBrowserError = json.error && /browser-error|error_codes/i.test(json.error);
    if (isBrowserError && retryCount < 2) {
      return submitForm(retryCount + 1);
    }

    formFeedback.setAttribute('aria-live', 'assertive'); // Errors interrupt; polite would wait.
    // Object.hasOwn is safer than json.errors when json might have a prototype. Formspree
    // returns { errors: [...] } for validation errors, or { error: "string" } for others.
    if (Object.hasOwn(json, 'errors')) {
      formFeedback.textContent = json.errors.map((err) => err.message).join(', ');
    } else {
      formFeedback.textContent = json.error || 'Oops! There was a problem submitting your form';
    }
    formFeedback.classList.add('error');
  }

  if (form && formFeedback) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Stop the form from doing a traditional full-page POST.

      const submitBtn = form.querySelector('.form-submit');
      const originalBtnText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true; // Prevent double-submit.
        submitBtn.textContent = 'Sending…';
      }
      form.setAttribute('aria-busy', 'true'); // Screen readers: form is processing.
      formFeedback.hidden = true;
      formFeedback.classList.remove('success', 'error');

      try {
        await submitForm();
      } catch {
        // Network error or similar; submitForm threw. User gets a generic error message.
        formFeedback.setAttribute('aria-live', 'assertive');
        formFeedback.textContent = 'Oops! There was a problem submitting your form';
        formFeedback.classList.add('error');
      }

      formFeedback.hidden = false;
      form.setAttribute('aria-busy', 'false');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText || 'Send Message';
      }
    });
  }

  // ============================================
  // Scroll-triggered fade-in
  // ============================================
  // Elements start with .fade-in (opacity 0, translateY in CSS). When they enter the
  // viewport, we add .visible to trigger the CSS transition. We skip this entirely
  // if the user has prefers-reduced-motion: reduce (accessibility for motion sensitivity).
  // threshold: 0.1 = fire when 10% of the element is visible. rootMargin '0px 0px -40px
  // 0px' shrinks the "visible" area by 40px at the bottom, so elements must be a bit
  // into the viewport before they animate (avoids popping in right at the edge).

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fadeElements = document.querySelectorAll('.section, .hero, .experience-card');
  if (fadeElements.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    fadeElements.forEach((el) => {
      el.classList.add('fade-in'); // Start invisible; CSS handles the initial state.
      observer.observe(el);
    });
  }

  // ============================================
  // Footer year
  // ============================================
  // Keeps the copyright year current without a yearly manual update.

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
