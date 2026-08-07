/* ================================================================
   Anamol Raj Singh — Personal Terminal
   script.js — Vanilla JS
   Handles: live clock, ticker, stat counter, scroll reveal,
   active nav, mobile menu, smooth scroll, form, back-to-top
   ================================================================ */

(function () {
    'use strict';

    // ============================================================
    // 1. LIVE CLOCK (Nepal timezone — Asia/Kathmandu)
    // ============================================================
    function updateClock() {
        var now = new Date();
        var opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kathmandu' };
        var time = now.toLocaleTimeString('en-GB', opts);
        var el = document.getElementById('navClock');
        if (el) el.textContent = time + ' NPT';
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ============================================================
    // 2. ATTENTION TICKER — live metrics banner
    // ============================================================
    (function initTicker() {
        var items = [
            { label: 'Study Hours', value: '1,247' },
            { label: 'Experiments', value: '38' },
            { label: 'Concepts', value: '156' },
            { label: 'Curiosity Index', value: '94%' },
            { label: 'Books', value: '42' },
            { label: 'Puzzles', value: '215' },
            { label: 'Projects', value: '12' },
            { label: 'Retention', value: '87%' },
        ];

        var track = document.getElementById('tickerTrack');
        if (!track) return;

        // Build ticker items with separators — duplicated for seamless loop
        function buildTicker() {
            var html = '';
            // Render twice for seamless scrolling
            for (var dup = 0; dup < 2; dup++) {
                items.forEach(function (item, i) {
                    html += '<span class="ticker-item">';
                    html += '<span class="ticker-item-value">' + item.value + '</span>';
                    html += '<span class="ticker-item-label">' + item.label + '</span>';
                    html += '</span>';
                    if (i < items.length - 1) {
                        html += '<span class="ticker-sep">/</span>';
                    }
                });
                html += '<span class="ticker-sep">/</span>';
            }
            track.innerHTML = html;
        }
        buildTicker();
    })();

    // ============================================================
    // 3. STAT COUNTER ANIMATION (count up on scroll)
    // ============================================================
    (function initStatCounters() {
        var counters = document.querySelectorAll('[data-target]');
        var animated = false;

        function animateCounter(el) {
            var target = parseInt(el.getAttribute('data-target'));
            var suffix = el.getAttribute('data-suffix') || '';
            var duration = 1800; // ms — adjust to speed up/slow down
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                // easeOutCubic for a satisfying deceleration
                var eased = 1 - Math.pow(1 - progress, 3);
                var value = Math.floor(eased * target);
                el.textContent = value.toLocaleString() + suffix;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target.toLocaleString() + suffix;
                }
            }
            requestAnimationFrame(step);
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    counters.forEach(function (el) {
                        animateCounter(el);
                    });
                    observer.disconnect();
                }
            });
        }, { threshold: 0.2 });

        if (counters.length > 0) {
            observer.observe(counters[0].closest('.stats-grid'));
        }
    })();

    // ============================================================
    // 4. SCROLL REVEAL (IntersectionObserver)
    // ============================================================
    (function initScrollReveal() {
        var reveals = document.querySelectorAll('.reveal');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry, idx) {
                if (entry.isIntersecting) {
                    // Stagger items in the same container slightly
                    var siblings = entry.target.parentElement.querySelectorAll('.reveal');
                    var index = Array.from(siblings).indexOf(entry.target);
                    setTimeout(function () {
                        entry.target.classList.add('visible');
                    }, Math.min(index, 6) * 80); // max 6-item stagger, 80ms each
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        reveals.forEach(function (el) { observer.observe(el); });
    })();

    // ============================================================
    // 5. NAVBAR SCROLL EFFECT + ACTIVE LINK
    // ============================================================
    (function initNavScroll() {
        var navbar = document.getElementById('navbar');
        var sections = document.querySelectorAll('section[id]');
        var navLinks = document.querySelectorAll('.nav-link');
        var backToTop = document.getElementById('backToTop');

        function onScroll() {
            var scrollY = window.scrollY;

            // Navbar shadow on scroll
            if (scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Back to top button visibility
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

        // Back to top click
        if (backToTop) {
            backToTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    })();

    // ============================================================
    // 6. MOBILE MENU TOGGLE
    // ============================================================
    (function initMobileMenu() {
        var toggle = document.getElementById('menuToggle');
        var menu = document.getElementById('mobileMenu');
        var icon = document.getElementById('menuIcon');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', function () {
            var isOpen = menu.style.maxHeight && menu.style.maxHeight !== '0px';
            if (isOpen) {
                menu.style.maxHeight = '0px';
                icon.className = 'bx bx-menu';
            } else {
                menu.style.maxHeight = menu.scrollHeight + 'px';
                icon.className = 'bx bx-x';
            }
        });

        // Close on link click
        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.style.maxHeight = '0px';
                icon.className = 'bx bx-menu';
            });
        });
    })();

    // ============================================================
    // 7. SMOOTH SCROLL (offset for fixed navbar)
    // ============================================================
    (function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    var offset = 80; // navbar height
                    window.scrollTo({
                        top: target.offsetTop - offset,
                        behavior: 'smooth'
                    });
                }
            });
        });
    })();

    // ============================================================
    // 8. CONTACT FORM (client-side validation + feedback)
    // ============================================================
    (function initContactForm() {
        var form = document.getElementById('contactForm');
        var status = document.getElementById('formStatus');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('name').value.trim();
            var email = document.getElementById('email').value.trim();
            var message = document.getElementById('message').value.trim();

            if (!name || !email || !message) {
                status.textContent = '> All fields required.';
                status.style.color = '#ef4444';
                return;
            }

            // Simulate send (replace with real endpoint later)
            status.textContent = '> Transmitting...';
            status.style.color = 'var(--accent)';

            setTimeout(function () {
                status.textContent = '> Message sent. I\'ll get back to you soon.';
                form.reset();
            }, 1200);
        });
    })();

})();
