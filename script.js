/* ================================================================
   Anamol Raj Singh — Personal Website
   script.js — Vanilla JavaScript
   
   Handles:
   1. Theme toggle (dark/light with system detection)
   2. Live clock (Nepal timezone)
   3. Music widget (Spotify + YT Music player)
   4. Navbar scroll effect + active link tracking
   5. Mobile menu toggle
   6. Smooth scroll (with navbar offset)
   7. Scroll reveal animations (IntersectionObserver)
   8. Back-to-top button
   
   No external dependencies. Pure vanilla JS.
   ================================================================ */

(function () {
    'use strict';

    /* ============================================================
       1. THEME TOGGLE
       Dark/Light with system preference detection + localStorage
       ============================================================ */
    (function initTheme() {
        var root = document.documentElement;
        var toggle = document.getElementById('themeToggle');
        var icon = document.getElementById('themeIcon');
        
        // Check saved preference, fall back to system preference
        var saved = localStorage.getItem('theme');
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = saved || (systemDark ? 'dark' : 'light');
        
        root.setAttribute('data-theme', theme);
        updateIcon(theme);
        
        function updateIcon(t) {
            icon.className = t === 'dark' ? 'bx bx-moon text-lg' : 'bx bx-sun text-lg';
            icon.style.transform = 'rotate(' + (t === 'dark' ? '0deg' : '180deg') + ')';
        }
        
        toggle.addEventListener('click', function () {
            var current = root.getAttribute('data-theme');
            var next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateIcon(next);
        });
        
        // React to system theme changes if no manual preference saved
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem('theme')) {
                var t = e.matches ? 'dark' : 'light';
                root.setAttribute('data-theme', t);
                updateIcon(t);
            }
        });
    })();

    /* ============================================================
       2. LIVE CLOCK
       Updates every second — displays Nepal time (Asia/Kathmandu)
       ============================================================ */
    (function initClock() {
        var el = document.getElementById('navClock');
        if (!el) return;
        
        function tick() {
            var now = new Date();
            var time = now.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Kathmandu'
            });
            el.textContent = time;
        }
        
        tick();
        setInterval(tick, 1000);
    })();

    /* ============================================================
       3. MUSIC WIDGET
       Toggleable drawer with embedded Spotify + YT Music players
       ============================================================ */
    (function initMusicWidget() {
        var toggle = document.getElementById('vibesToggle');
        var drawer = document.getElementById('vibesDrawer');
        var close = document.getElementById('vibesClose');
        var player = document.getElementById('vibesPlayer');
        var tabs = document.querySelectorAll('.vibes-tab');
        var currentSource = 'spotify';
        var isOpen = false;
        
        // Embed URLs — replace playlist IDs as needed
        var sources = {
            spotify: '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>',
            ytmusic: '<iframe style="border-radius:12px;border:0" src="https://www.youtube.com/embed/videoseries?list=PL5o9a3o2B5o7B5o3B5o7B5o3B5o7B5o3" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media" allowfullscreen="" loading="lazy"></iframe>'
        };
        
        function renderPlayer() {
            player.innerHTML = sources[currentSource];
        }
        
        function open() {
            isOpen = true;
            drawer.classList.add('active');
            renderPlayer();
        }
        
        function close_drawer() {
            isOpen = false;
            drawer.classList.remove('active');
            player.innerHTML = ''; // Stop playback when closed
        }
        
        toggle.addEventListener('click', function () {
            if (isOpen) { close_drawer(); } else { open(); }
        });
        
        close.addEventListener('click', close_drawer);
        
        // Tab switching
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentSource = tab.getAttribute('data-source');
                renderPlayer();
            });
        });
        
        // Close on outside click
        document.addEventListener('click', function (e) {
            if (isOpen && !drawer.contains(e.target) && !toggle.contains(e.target)) {
                close_drawer();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) { close_drawer(); }
        });
    })();

    /* ============================================================
       4. NAVBAR SCROLL EFFECT + ACTIVE LINK
       Adds shadow to nav on scroll, tracks active section
       ============================================================ */
    (function initNavScroll() {
        var navbar = document.getElementById('navbar');
        var sections = document.querySelectorAll('section[id]');
        var navLinks = document.querySelectorAll('.nav-link');
        var backToTop = document.getElementById('backToTop');
        
        function onScroll() {
            var scrollY = window.scrollY;
            
            // Nav shadow
            if (scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // Back-to-top visibility
            if (backToTop) {
                backToTop.style.opacity = scrollY > 400 ? '1' : '0';
                backToTop.style.pointerEvents = scrollY > 400 ? 'auto' : 'none';
            }
            
            // Active nav link based on scroll position
            var current = '';
            sections.forEach(function (section) {
                var top = section.offsetTop - 100;
                if (scrollY >= top) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(function (link) {
                link.classList.toggle('active',
                    link.getAttribute('href') === '#' + current);
            });
        }
        
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        
        // Back-to-top click
        if (backToTop) {
            backToTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    })();

    /* ============================================================
       5. MOBILE MENU TOGGLE
       Hamburger expand/collapse with icon swap
       ============================================================ */
    (function initMobileMenu() {
        var toggle = document.getElementById('menuToggle');
        var menu = document.getElementById('mobileMenu');
        var icon = document.getElementById('menuIcon');
        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', function () {
            var isOpen = menu.style.maxHeight && menu.style.maxHeight !== '0px';
            if (isOpen) {
                menu.style.maxHeight = '0px';
                icon.className = 'bx bx-menu text-lg';
            } else {
                menu.style.maxHeight = menu.scrollHeight + 'px';
                icon.className = 'bx bx-x text-lg';
            }
        });
        
        // Close on link click
        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.style.maxHeight = '0px';
                icon.className = 'bx bx-menu text-lg';
            });
        });
    })();

    /* ============================================================
       6. SMOOTH SCROLL
       Offset for fixed navbar height
       ============================================================ */
    (function initSmoothScroll() {
        var navHeight = 70; // navbar offset in px
        
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    window.scrollTo({
                        top: target.offsetTop - navHeight,
                        behavior: 'smooth'
                    });
                }
            });
        });
    })();

    /* ============================================================
       7. SCROLL REVEAL ANIMATIONS
       IntersectionObserver — staggered fade-in on scroll
       ============================================================ */
    (function initScrollReveal() {
        var reveals = document.querySelectorAll('.reveal');
        
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });
        
        reveals.forEach(function (el) { observer.observe(el); });
    })();

})();
