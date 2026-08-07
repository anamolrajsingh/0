/* ================================================================
   Anamol Raj Singh — Personal Website
   script.js — Vanilla JavaScript
   Handles: theme toggle, live clock, mobile menu, scroll reveal,
   active nav links, back-to-top, smooth scrolling
   ================================================================ */

(function () {
    'use strict';

    // ============================================================
    // 1. THEME TOGGLE (dark/light with system detection + localStorage)
    // ============================================================
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const STORAGE_KEY = 'ars-theme';

    /**
     * Determine the initial theme:
     * 1. Check localStorage for a saved preference
     * 2. Fall back to system preference (prefers-color-scheme)
     * 3. Default to dark
     */
    function getInitialTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }

    /**
     * Apply a theme and update the toggle icon + meta theme-color
     */
    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
        }
        // Update meta theme-color for browser UI
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'dark' ? '#0a0b0d' : '#f5f5f3');
        }
    }

    // Set initial theme
    applyTheme(getInitialTheme());

    // Toggle on click
    themeToggle.addEventListener('click', function () {
        const current = root.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    });

    // Listen for system theme changes (only if user hasn't manually set a preference)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // ============================================================
    // 2. LIVE CLOCK (updates every second)
    // ============================================================
    const navClock = document.getElementById('navClock');
    const navClockMobile = document.getElementById('navClockMobile');

    function updateClock() {
        const now = new Date();
        // Format: HH:MM:SS (24-hour)
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        if (navClock) navClock.textContent = time;
        if (navClockMobile) navClockMobile.textContent = time;
    }

    updateClock();
    setInterval(updateClock, 1000);

    // ============================================================
    // 3. MOBILE MENU (hamburger toggle)
    // ============================================================
    const menuToggle = document.getElementById('menuToggle');
    const menuIcon = document.getElementById('menuIcon');
    const mobileMenu = document.getElementById('mobileMenu');
    let menuOpen = false;

    function toggleMobileMenu() {
        menuOpen = !menuOpen;
        if (menuOpen) {
            mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
            menuIcon.className = 'bx bx-x';
        } else {
            mobileMenu.style.maxHeight = '0';
            menuIcon.className = 'bx bx-menu';
        }
    }

    menuToggle.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.mobile-link').forEach(function (link) {
        link.addEventListener('click', function () {
            if (menuOpen) toggleMobileMenu();
        });
    });

    // ============================================================
    // 4. SCROLL REVEAL (Intersection Observer)
    // ============================================================
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback: show all elements if IntersectionObserver isn't supported
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    // ============================================================
    // 5. ACTIVE NAV LINK ON SCROLL
    // ============================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    function onScroll() {
        const scrollY = window.scrollY;

        // Add shadow to navbar when scrolled
        if (scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Highlight active section in nav
        let currentSection = '';
        sections.forEach(function (section) {
            const sectionTop = section.offsetTop - 150;
            if (scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ============================================================
    // 6. BACK TO TOP BUTTON
    // ============================================================
    const backToTop = document.getElementById('backToTop');

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Show/hide back-to-top based on scroll position
    function toggleBackToTop() {
        if (window.scrollY > 400) {
            backToTop.style.opacity = '1';
            backToTop.style.pointerEvents = 'auto';
        } else {
            backToTop.style.opacity = '0.4';
            backToTop.style.pointerEvents = 'auto';
        }
    }

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    // ============================================================
    // 7. SMOOTH SCROLL (for browsers that don't support scroll-behavior)
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80; // account for fixed navbar
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================================================
    // 8. INITIALIZE — run onScroll once on load
    // ============================================================
    onScroll();


    // ============================================================
    // 9. VIBES MUSIC WIDGET (lazy-loaded iframes, toggle drawer)
    // ============================================================
    var vibesToggle = document.getElementById('vibesToggle');
    var vibesDrawer = document.getElementById('vibesDrawer');
    var vibesWidget = document.getElementById('vibesWidget');
    var vibesLoaded = { spotify: false, ytmusic: false };

    // Embed URLs (loaded only when drawer opens)
    var vibesUrls = {
        spotify: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
        ytmusic: 'https://www.youtube.com/embed/DWcJFNfaw9c'
    };

    // Load an iframe into a panel (only once)
    function loadVibesIframe(panelName) {
        if (vibesLoaded[panelName]) return;
        var panel = document.getElementById('vibesPanel' + panelName.charAt(0).toUpperCase() + panelName.slice(1));
        if (!panel) return;
        var iframe = document.createElement('iframe');
        iframe.src = vibesUrls[panelName];
        iframe.width = '100%';
        iframe.height = '352';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
        iframe.style.borderRadius = '12px';
        panel.innerHTML = '';
        panel.appendChild(iframe);
        vibesLoaded[panelName] = true;
    }

    // Toggle drawer open/closed
    vibesToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = vibesDrawer.classList.toggle('open');
        vibesToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        vibesDrawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen) {
            // Load the active panel's iframe
            var activeTab = vibesDrawer.querySelector('.vibes-tab.active');
            if (activeTab) {
                loadVibesIframe(activeTab.getAttribute('data-vibes-tab'));
            }
        }
    });

    // Tab switching
    var vibesTabs = vibesDrawer.querySelectorAll('.vibes-tab');
    vibesTabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
            e.stopPropagation();
            var tabName = this.getAttribute('data-vibes-tab');

            // Update tab active states
            vibesTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');

            // Update panel visibility
            var panels = vibesDrawer.querySelectorAll('.vibes-panel');
            panels.forEach(function (p) {
                p.classList.toggle('active', p.getAttribute('data-vibes-panel') === tabName);
            });

            // Lazy load the iframe for this tab
            loadVibesIframe(tabName);
        });
    });

    // Close drawer when clicking outside
    document.addEventListener('click', function (e) {
        if (!vibesWidget.contains(e.target)) {
            vibesDrawer.classList.remove('open');
            vibesToggle.setAttribute('aria-expanded', 'false');
            vibesDrawer.setAttribute('aria-hidden', 'true');
        }
    });

    // Close drawer on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && vibesDrawer.classList.contains('open')) {
            vibesDrawer.classList.remove('open');
            vibesToggle.setAttribute('aria-expanded', 'false');
            vibesDrawer.setAttribute('aria-hidden', 'true');
        }
    });

})();