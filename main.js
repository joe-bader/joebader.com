/**
 * joebader.com - Resume Site
 * Nav, smooth scroll, accordion, form handling, scroll animations
 */

(function () {
  'use strict';

  // ============================================
  // Header scroll state
  // ============================================

  const header = document.getElementById('site-header');
  if (header) {
    const updateHeader = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // ============================================
  // Nav highlight for visible section
  // ============================================

  const navSections = ['summary', 'experience', 'technical', 'contact'];
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNav() {
    const headerOffset = 100;
    let activeId = null;

    navSections.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
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
  updateActiveNav();

  // ============================================
  // Smooth scroll for nav links
  // ============================================

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || !href) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================
  // Earlier Career accordion
  // ============================================

  const earlierCareerToggle = document.getElementById('earlier-career-toggle');
  const earlierCareerContent = document.getElementById('earlier-career-content');
  if (earlierCareerToggle && earlierCareerContent) {
    earlierCareerToggle.addEventListener('click', () => {
      const isExpanded = earlierCareerToggle.getAttribute('aria-expanded') === 'true';
      earlierCareerToggle.setAttribute('aria-expanded', !isExpanded);
    });
  }

  // ============================================
  // Contact form (Formspree + reCAPTCHA v3)
  // ============================================

  const form = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  const recaptchaSiteKey = form?.dataset.recaptchaSiteKey;

  if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_SITE_KEY') {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    document.head.appendChild(script);
  }

  async function getRecaptchaToken() {
    if (!recaptchaSiteKey || recaptchaSiteKey === 'YOUR_RECAPTCHA_SITE_KEY' || typeof grecaptcha === 'undefined') {
      return null;
    }
    return new Promise((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then(resolve);
      });
    });
  }

  async function submitForm(retryCount = 0) {
    const data = new FormData(form);
    const token = await getRecaptchaToken();
    if (token) data.set('g-recaptcha-response', token);

    const response = await fetch(form.action, {
      method: form.method,
      body: data,
      headers: { Accept: 'application/json' },
    });

    const json = await response.json();

    if (response.ok) {
      formFeedback.textContent = 'Thanks for your submission!';
      formFeedback.classList.add('success');
      form.reset();
      return;
    }

    const isBrowserError = json.error && /browser-error|error_codes/i.test(json.error);
    if (isBrowserError && retryCount < 2) {
      return submitForm(retryCount + 1);
    }

    if (Object.hasOwn(json, 'errors')) {
      formFeedback.textContent = json.errors.map((err) => err.message).join(', ');
    } else {
      formFeedback.textContent = json.error || 'Oops! There was a problem submitting your form';
    }
    formFeedback.classList.add('error');
  }

  if (form && formFeedback) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('.form-submit');
      if (submitBtn) submitBtn.disabled = true;

      formFeedback.hidden = true;
      formFeedback.classList.remove('success', 'error');

      try {
        await submitForm();
      } catch {
        formFeedback.textContent = 'Oops! There was a problem submitting your form';
        formFeedback.classList.add('error');
      }

      formFeedback.hidden = false;
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  // ============================================
  // Scroll-triggered fade-in
  // ============================================

  const fadeElements = document.querySelectorAll('.section, .hero, .experience-card');
  if (fadeElements.length && 'IntersectionObserver' in window) {
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
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }

  // ============================================
  // Footer year
  // ============================================

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
