/* ================================================================
   Anamol Raj Singh — Personal Website
   script.js — Vanilla JavaScript + GSAP
   Clean, robust, null-safe. Every getElementById is guarded.
   ================================================================ */

(function () {
    'use strict';
    document.title = 'JS:LOADED';
    var navClockEl = document.getElementById('navClock');
    if (navClockEl) navClockEl.textContent = 'JS:OK';

    // Helper: safe getElementById
    function $(id) { return document.getElementById(id); }
    function $all(sel) { return document.querySelectorAll(sel); }
    function safe(fn) { try { fn(); } catch (e) { if (console && console.warn) console.warn('Section error:', e.message); } }

    var root = document.documentElement;
    var prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================================
    // 0. LENIS SMOOTH SCROLL
    // ============================================================
    var lenis = null;
    safe(function () {
        if (typeof Lenis !== 'undefined' && !prefersReduced) {
            lenis = new Lenis({
                duration: 1.2,
                easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
                smoothWheel: true,
                smoothTouch: false
            });
            function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
            requestAnimationFrame(raf);
            window.__lenis = lenis;
        }
    });

    // ============================================================
    // 1. THEME TOGGLE (dark / light / night) with labels
    // ============================================================
    safe(function () {
        var themeToggle = $('themeToggle');
        var themeIcon = $('themeIcon');
        var STORAGE_KEY = 'ars-theme';
        var THEMES = ['dark', 'light', 'night'];
        var LABELS = { dark: 'Daytime Study', light: 'Late Night Deep Work', night: 'Midnight' };

        function getInitialTheme() {
            var saved;
            try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
            if (saved && THEMES.indexOf(saved) >= 0) return saved;
            if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) return 'light';
            return 'dark';
        }

        function applyTheme(theme) {
            root.setAttribute('data-theme', theme);
            if (themeIcon) {
                if (theme === 'dark') themeIcon.className = 'bx bx-sun';
                else if (theme === 'light') themeIcon.className = 'bx bx-moon';
                else themeIcon.className = 'bx bx-star';
            }
            var metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                var colors = { dark: '#0a0b0d', light: '#f5f5f3', night: '#060608' };
                metaTheme.setAttribute('content', colors[theme] || '#0a0b0d');
            }
            if (themeToggle) themeToggle.setAttribute('data-theme-label', LABELS[theme] || '');
        }

        applyTheme(getInitialTheme());

        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                var current = root.getAttribute('data-theme');
                var idx = THEMES.indexOf(current);
                var next = THEMES[(idx + 1) % THEMES.length];
                applyTheme(next);
                try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
            });
        }

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
                var saved;
                try { saved = localStorage.getItem(STORAGE_KEY); } catch (err) {}
                if (!saved) applyTheme(e.matches ? 'dark' : 'light');
            });
        }
    });

    // ============================================================
    // 2. LIVE CLOCK + SCROLL PROGRESS
    // ============================================================
    safe(function () {
        var navClock = $('navClock');
        var navClockMobile = $('navClockMobile');
        function updateClock() {
            var time = new Date().toLocaleTimeString('en-US', { hour12: false });
            if (navClock) navClock.textContent = time;
            if (navClockMobile) navClockMobile.textContent = time;
        }
        updateClock();
        setInterval(updateClock, 1000);

        var progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            function updateProgress() {
                var h = document.documentElement.scrollHeight - window.innerHeight;
                var scrolled = h > 0 ? (window.scrollY / h) * 100 : 0;
                progressBar.style.width = Math.min(100, scrolled) + '%';
            }
            window.addEventListener('scroll', updateProgress, { passive: true });
            updateProgress();
        }
    });

    // ============================================================
    // 3. MOBILE MENU
    // ============================================================
    safe(function () {
        var menuToggle = $('menuToggle');
        var menuIcon = $('menuIcon');
        var mobileMenu = $('mobileMenu');
        if (!menuToggle || !mobileMenu) return;
        var menuOpen = false;
        function toggle() {
            menuOpen = !menuOpen;
            if (menuOpen) {
                mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
                if (menuIcon) menuIcon.className = 'bx bx-x';
            } else {
                mobileMenu.style.maxHeight = '0';
                if (menuIcon) menuIcon.className = 'bx bx-menu';
            }
        }
        menuToggle.addEventListener('click', toggle);
        $all('.mobile-link').forEach(function (link) {
            link.addEventListener('click', function () { if (menuOpen) toggle(); });
        });
    });

    // ============================================================
    // 4. SCROLL REVEAL (Intersection Observer)
    // ============================================================
    safe(function () {
        var els = $all('.reveal');
        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
            els.forEach(function (el) { obs.observe(el); });
        } else {
            els.forEach(function (el) { el.classList.add('visible'); });
        }
    });

    // ============================================================
    // 5. ACTIVE NAV LINK + NAVBAR SCROLL STATE
    // ============================================================
    safe(function () {
        var sections = $all('section[id]');
        var navLinks = $all('.nav-link');
        var navbar = $('navbar');

        function onScroll() {
            var scrollY = window.scrollY;
            if (navbar) navbar.classList.toggle('scrolled', scrollY > 20);
            var current = '';
            sections.forEach(function (section) {
                if (scrollY >= section.offsetTop - 150) current = section.getAttribute('id');
            });
            navLinks.forEach(function (link) {
                link.classList.toggle('active', link.getAttribute('href') === '#' + current);
            });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    });

    // ============================================================
    // 6. BACK TO TOP
    // ============================================================
    safe(function () {
        var btn = $('backToTop');
        if (!btn) return;
        btn.addEventListener('click', function () {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        function toggle() {
            if (window.scrollY > 400) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
            else { btn.style.opacity = '0.4'; }
        }
        window.addEventListener('scroll', toggle, { passive: true });
        toggle();
    });

    // ============================================================
    // 7. SMOOTH SCROLL (Lenis-aware anchor links)
    // ============================================================
    safe(function () {
        $all('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (!targetId || targetId === '#' || targetId.length < 2) return;
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    if (lenis) lenis.scrollTo(target, { offset: -80 });
                    else {
                        var pos = target.getBoundingClientRect().top + window.scrollY - 80;
                        window.scrollTo({ top: pos, behavior: 'smooth' });
                    }
                }
            });
        });
    });

    // ============================================================
    // 8. CUSTOM MAGNETIC CURSOR
    // ============================================================
    safe(function () {
        var cursorDot = $('cursorDot');
        var cursorRing = $('cursorRing');
        if (!cursorDot || !cursorRing) return;
        if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        var mx = 0, my = 0, rx = 0, ry = 0, dx = 0, dy = 0;
        document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
        document.addEventListener('mouseleave', function () { cursorDot.classList.add('cursor-hidden'); cursorRing.classList.add('cursor-hidden'); });
        document.addEventListener('mouseenter', function () { cursorDot.classList.remove('cursor-hidden'); cursorRing.classList.remove('cursor-hidden'); });

        function loop() {
            dx += (mx - dx) * 0.5; dy += (my - dy) * 0.5;
            rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
            cursorDot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            cursorRing.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
            requestAnimationFrame(loop);
        }
        loop();

        $all('a, button, .glass-card, .interactive-card, .post-link, .tag-filter, input, .terminal-hint, .terminal-close, .thought-item, .vibes-trigger, .vibes-tab').forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursorRing.classList.add('cursor-hover'); cursorDot.classList.add('cursor-hover'); });
            el.addEventListener('mouseleave', function () { cursorRing.classList.remove('cursor-hover'); cursorDot.classList.remove('cursor-hover'); });
        });
    });

    // ============================================================
    // 9. MAGNETIC BUTTONS
    // ============================================================
    safe(function () {
        if (matchMedia('(hover: none) and (pointer: coarse)').matches) return;
        $all('[data-magnetic]').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var rect = el.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                el.style.transform = 'translate(' + x * 0.2 + 'px,' + y * 0.2 + 'px)';
            });
            el.addEventListener('mouseleave', function () { el.style.transform = 'translate(0,0)'; });
        });
    });

    // ============================================================
    // 10. PARTICLE CANVAS
    // ============================================================
    safe(function () {
        var canvas = $('particleCanvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var particles = [];
        var mouseX = -1000, mouseY = -1000;

        function getAccent() {
            return getComputedStyle(root).getPropertyValue('--accent').trim() || '#C6FF00';
        }

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; init(); }
        function init() {
            particles = [];
            var count = Math.min(60, Math.floor(canvas.width / 30));
            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                    r: Math.random() * 1.5 + 0.5
                });
            }
        }
        window.addEventListener('mousemove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });
        window.addEventListener('resize', resize);
        resize();

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var color = getAccent();
            particles.forEach(function (p) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                var dx = p.x - mouseX, dy = p.y - mouseY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) { p.x += dx / dist * 0.8; p.y += dy / dist * 0.8; }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.5;
                ctx.fill();
            });
            ctx.globalAlpha = 0.15;
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var d = Math.sqrt(Math.pow(particles[i].x - particles[j].x, 2) + Math.pow(particles[i].y - particles[j].y, 2));
                    if (d < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(draw);
        }
        draw();
    });

    // ============================================================
    // 11. GSAP SCROLL ANIMATIONS
    // ============================================================
    safe(function () {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || prefersReduced) return;
        gsap.registerPlugin(ScrollTrigger);

        // Breathing headings
        $all('.breathe-heading').forEach(function (h) {
            gsap.fromTo(h, { fontWeight: 300 }, { fontWeight: 600, ease: 'none', scrollTrigger: { trigger: h, start: 'top 90%', end: 'center 50%', scrub: 0.8 } });
            gsap.fromTo(h, { fontWeight: 600 }, { fontWeight: 300, ease: 'none', scrollTrigger: { trigger: h, start: 'center 50%', end: 'bottom 10%', scrub: 0.8 } });
        });

        // Parallax blobs
        var blob1 = $('blob1'), blob2 = $('blob2');
        if (blob1) gsap.to(blob1, { y: -200, ease: 'none', scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 } });
        if (blob2) gsap.to(blob2, { y: 150, ease: 'none', scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.5 } });

        // Staggered grid reveals
        $all('.interests-grid .interest-card').forEach(function (card, idx) {
            gsap.fromTo(card, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%' }, delay: (idx % 3) * 0.1 });
        });

        // Text reveal masks
        $all('.text-reveal-mask').forEach(function (el) {
            var inner = el.querySelector('.reveal-text');
            if (inner) {
                gsap.fromTo(inner, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } });
            }
        });

        // Section atmosphere morphing
        $all('section[id]').forEach(function (section) {
            ScrollTrigger.create({
                trigger: section, start: 'top 50%', end: 'bottom 50%',
                onEnter: function () { setAtmosphere(section.id); },
                onEnterBack: function () { setAtmosphere(section.id); }
            });
        });
        function setAtmosphere(id) {
            var map = { hero: 'warm', about: 'warm', interests: 'cool', now: 'cool', writings: 'deep', thoughts: 'deep', contact: 'warm' };
            document.body.setAttribute('data-atmosphere', map[id] || 'warm');
        }

        // Hero parallax
        var heroName = document.querySelector('.hero-name');
        if (heroName) {
            gsap.to(heroName, { y: -80, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 } });
        }

        // Section numbers
        $all('.section-num').forEach(function (num) {
            gsap.fromTo(num, { y: 20, opacity: 0 }, { y: 0, opacity: 0.15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: num, start: 'top 90%' } });
        });

        // Sync with Lenis
        if (lenis) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        }
    });

    // ============================================================
    // 12. CURSOR-FOLLOWING PREVIEW CARDS
    // ============================================================
    safe(function () {
        var preview = $('cursorPreview');
        if (!preview || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        var labelEl = $('previewLabel');
        var textEl = $('previewText');
        var ambientEl = $('previewAmbient');
        var px = 0, py = 0, tx = 0, ty = 0;

        document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
        function anim() {
            px += (tx - px) * 0.12; py += (ty - py) * 0.12;
            preview.style.left = px + 'px'; preview.style.top = py + 'px';
            requestAnimationFrame(anim);
        }
        anim();

        var gradients = {
            'Technology': 'linear-gradient(135deg, #C6FF00, #00ff88)',
            'Reading & Ideas': 'linear-gradient(135deg, #C6FF00, #ffaa00)',
            'Current Affairs': 'linear-gradient(135deg, #C6FF00, #0088ff)',
            'Design': 'linear-gradient(135deg, #C6FF00, #ff00aa)',
            'Philosophy': 'linear-gradient(135deg, #C6FF00, #aa00ff)',
            'Film & Media': 'linear-gradient(135deg, #C6FF00, #ff4400)'
        };

        $all('[data-preview-label]').forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                if (labelEl) labelEl.textContent = card.getAttribute('data-preview-label');
                if (textEl) textEl.textContent = card.getAttribute('data-preview-text');
                var lbl = card.getAttribute('data-preview-label');
                if (ambientEl) ambientEl.style.background = gradients[lbl] || 'linear-gradient(135deg, #C6FF00, #C6FF00)';
                preview.classList.add('preview-visible');
            });
            card.addEventListener('mouseleave', function () { preview.classList.remove('preview-visible'); });
        });
    });

    // ============================================================
    // 13. PAGE TRANSITIONS (curtain reveal)
    // ============================================================
    safe(function () {
        var pt = $('pageTransition');
        if (!pt) return;
        window.addEventListener('pageshow', function () {
            setTimeout(function () {
                pt.classList.add('curtain-up');
                setTimeout(function () {
                    pt.classList.add('curtain-down');
                    setTimeout(function () { pt.classList.remove('curtain-up', 'curtain-down'); }, 600);
                }, 100);
            }, 50);
        });
        $all('a.page-link, a[href$=".html"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href && !href.startsWith('#') && href.endsWith('.html')) {
                    e.preventDefault();
                    pt.classList.remove('curtain-down');
                    pt.classList.add('curtain-up');
                    setTimeout(function () { window.location.href = href; }, 500);
                }
            });
        });
    });

    // ============================================================
    // 14. NOW WIDGET RENDERING
    // ============================================================
    safe(function () {
        var grid = $('nowGrid');
        var updated = $('nowUpdated');
        if (!grid || typeof NOW_DATA === 'undefined') return;
        var d = NOW_DATA;

        grid.innerHTML =
            '<div class="glass-card now-reading rounded-2xl p-8 reveal">' +
                '<div class="now-label">Reading</div>' +
                '<h3 class="now-title font-serif text-2xl">' + d.reading.title + '</h3>' +
                '<p class="now-author">' + d.reading.author + '</p>' +
                '<div class="now-progress"><div class="now-progress-bar" style="width:0" data-progress="' + d.reading.progress + '"></div></div>' +
                '<blockquote class="now-quote">' + d.reading.quote + '</blockquote>' +
                '<p class="now-note">' + d.reading.note + '</p>' +
            '</div>' +
            '<div class="glass-card rounded-2xl p-7 reveal">' +
                '<div class="now-label">Exploring</div>' +
                '<h3 class="now-title font-serif text-xl">' + d.exploring.title + '</h3>' +
                '<p class="now-note">' + d.exploring.note + '</p>' +
            '</div>' +
            '<div class="glass-card rounded-2xl p-7 reveal">' +
                '<div class="now-label">Watching</div>' +
                '<h3 class="now-title font-serif text-xl">' + d.watching.title + '</h3>' +
                '<p class="now-author">' + d.watching.author + '</p>' +
                '<p class="now-note">' + d.watching.note + '</p>' +
            '</div>' +
            '<div class="glass-card now-thinking rounded-2xl p-8 reveal">' +
                '<div class="now-label">Thinking About</div>' +
                '<p class="now-question font-serif text-xl italic">' + d.thinking.question + '</p>' +
            '</div>';

        if (updated) updated.textContent = 'Last updated: ' + d.lastUpdated;

        setTimeout(function () {
            var bar = grid.querySelector('[data-progress]');
            if (bar) bar.style.width = bar.getAttribute('data-progress') + '%';
        }, 500);

        // Re-observe new reveal elements
        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
                });
            }, { threshold: 0.1 });
            grid.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
        } else {
            grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
        }
    });

    // ============================================================
    // 15. THOUGHT STREAM RENDERING
    // ============================================================
    safe(function () {
        var container = $('thoughtStream');
        if (!container || typeof THOUGHTS === 'undefined') return;
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var html = '';
        THOUGHTS.forEach(function (t) {
            var d = new Date(t.date);
            html += '<div class="thought-item">' +
                '<span class="thought-date">' + months[d.getMonth()] + ' ' + d.getDate() + '</span>' +
                '<span class="thought-text">' + t.text + '</span>' +
            '</div>';
        });
        container.innerHTML = html;
    });

    // ============================================================
    // 16. VIBES MUSIC WIDGET (simple, robust toggle + tabs)
    // ============================================================
    safe(function () {
        var widget = $('vibesWidget');
        var toggle = $('vibesToggle');
        var drawer = $('vibesDrawer');
        if (!widget || !toggle || !drawer) return;

        var open = false;
        function setOpen(state) {
            open = state;
            widget.classList.toggle('open', open);
            drawer.setAttribute('aria-hidden', String(!open));
        }

        // Toggle on trigger click
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            setOpen(!open);
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (open && !widget.contains(e.target)) setOpen(false);
        });

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && open) setOpen(false);
        });

        // Tab switching
        $all('.vibes-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = tab.getAttribute('data-vibes-tab');
                $all('.vibes-tab').forEach(function (t) { t.classList.remove('active'); });
                $all('.vibes-panel').forEach(function (p) { p.classList.remove('active'); });
                tab.classList.add('active');
                var panel = document.querySelector('[data-vibes-panel="' + target + '"]');
                if (panel) panel.classList.add('active');
            });
        });
    });

    // ============================================================
    // 17. AMBIENT AUDIO (Web Audio API)
    // ============================================================
    safe(function () {
        var btn = $('ambientToggle');
        var icon = $('ambientIcon');
        var label = $('ambientLabel');
        if (!btn) return;
        var audioCtx = null, masterGain = null, active = false;

        function init() {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0;
            masterGain.connect(audioCtx.destination);

            // Warm chord drone (A2, E3, A3, C4)
            [110, 164.81, 220, 261.63].forEach(function (freq, i) {
                var osc = audioCtx.createOscillator();
                var g = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.detune.value = (i - 1.5) * 3;
                g.gain.value = 0.15 / (i + 1);
                osc.connect(g); g.connect(masterGain);
                osc.start();
            });

            // LFO breathing
            var lfo = audioCtx.createOscillator();
            var lfoG = audioCtx.createGain();
            lfo.frequency.value = 0.06; lfo.type = 'sine'; lfoG.gain.value = 0.03;
            lfo.connect(lfoG); lfoG.connect(masterGain.gain); lfo.start();

            // Brown noise
            var bufSize = 2 * audioCtx.sampleRate;
            var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
            var data = buf.getChannelData(0);
            var last = 0;
            for (var j = 0; j < bufSize; j++) {
                var white = Math.random() * 2 - 1;
                data[j] = (last + 0.02 * white) / 1.02;
                last = data[j];
                data[j] *= 3.5;
            }
            var noise = audioCtx.createBufferSource();
            noise.buffer = buf; noise.loop = true;
            var nf = audioCtx.createBiquadFilter();
            nf.type = 'lowpass'; nf.frequency.value = 400; nf.Q.value = 0.5;
            var ng = audioCtx.createGain(); ng.gain.value = 0.04;
            noise.connect(nf); nf.connect(ng); ng.connect(masterGain); noise.start();

            // High shimmer
            var sh = audioCtx.createOscillator();
            var shG = audioCtx.createGain();
            sh.type = 'sine'; sh.frequency.value = 880; shG.gain.value = 0.008;
            sh.connect(shG); shG.connect(masterGain); sh.start();

            // Master low-pass
            var mf = audioCtx.createBiquadFilter();
            mf.type = 'lowpass'; mf.frequency.value = 1200; mf.Q.value = 0.3;
            masterGain.disconnect(); masterGain.connect(mf); mf.connect(audioCtx.destination);
        }

        btn.addEventListener('click', function () {
            if (!audioCtx) init();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (!active) {
                masterGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 3);
                active = true;
                if (icon) icon.className = 'bx bx-pause';
                if (label) label.textContent = 'Pause Ambient';
            } else {
                masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
                active = false;
                if (icon) icon.className = 'bx bx-play';
                if (label) label.textContent = 'Play Ambient';
            }
        });
    });

    // ============================================================
    // 18. TERMINAL EASTER EGG
    // ============================================================
    safe(function () {
        var terminal = $('terminal');
        var body = $('terminalBody');
        var input = $('terminalInput');
        var closeBtn = $('terminalClose');
        var hint = $('terminalHint');
        if (!terminal || !input) return;

        var CMDS = {
            help: ['Available commands:', '  help    — show this message', '  about   — who I am', '  quote   — a thought', '  matrix  — enter the matrix', '  coffee  — current status', '  reading — what I\'m reading', '  clear   — clear terminal', '  exit    — close'],
            about: ['Anamol Raj Singh', 'A student and lifelong learner.', 'Curious about technology, philosophy, design, and the spaces in between.'],
            quote: ['"The beginning of infinity is the recognition that problems are soluble." — David Deutsch'],
            matrix: (function () { var c = '01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱｺﾏﾁﾒｦ'; var l = []; for (var i = 0; i < 5; i++) { var s = ''; for (var j = 0; j < 40; j++) s += c[Math.floor(Math.random() * c.length)]; l.push(s); } return l; })(),
            coffee: ['Status: Currently caffeinated and curious.'],
            reading: ['Currently reading:', '  The Beginning of Infinity — David Deutsch'],
            clear: null,
            exit: null
        };

        function open() {
            terminal.classList.remove('hidden'); terminal.classList.add('terminal-open');
            setTimeout(function () { input.focus(); }, 400);
            if (body && body.innerHTML === '') { addLine('Welcome. Type "help" for commands.', 'term-welcome'); addLine(''); }
        }
        function close() { terminal.classList.remove('terminal-open'); setTimeout(function () { terminal.classList.add('hidden'); }, 500); }
        function addLine(text, cls) { if (!body) return; var d = document.createElement('div'); d.className = 'term-line' + (cls ? ' ' + cls : ''); d.textContent = text; body.appendChild(d); body.scrollTop = body.scrollHeight; }
        function addCmd(cmd) { if (!body) return; var d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = '<span class="term-cmd">$ ' + cmd + '</span>'; body.appendChild(d); body.scrollTop = body.scrollHeight; }

        input.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            var cmd = input.value.trim().toLowerCase();
            if (!cmd) return;
            addCmd(cmd); input.value = '';
            if (cmd === 'clear') { body.innerHTML = ''; return; }
            if (cmd === 'exit') { close(); return; }
            var result = CMDS[cmd];
            if (result) { result.forEach(function (l) { addLine(l, 'term-output'); }); }
            else { addLine('Command not found: ' + cmd, 'term-error'); addLine('Type "help" for available commands.', 'term-welcome'); }
        });

        if (closeBtn) closeBtn.addEventListener('click', close);
        if (hint) hint.addEventListener('click', open);
        document.addEventListener('keydown', function (e) {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
            if (e.key === '`' || e.key === '~') { e.preventDefault(); if (terminal.classList.contains('terminal-open')) close(); else open(); }
            if (e.key === 'Escape' && terminal.classList.contains('terminal-open')) close();
        });
    });

    // ============================================================
    // 19. KONAMI CODE
    // ============================================================
    safe(function () {
        var SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        var idx = 0;
        document.addEventListener('keydown', function (e) {
            if (e.key === SEQ[idx] || e.key.toLowerCase() === SEQ[idx].toLowerCase()) {
                idx++;
                if (idx === SEQ.length) {
                    idx = 0;
                    var flash = document.createElement('div');
                    flash.style.cssText = 'position:fixed;inset:0;z-index:9998;background:var(--accent);opacity:0;pointer-events:none;transition:opacity 0.3s';
                    document.body.appendChild(flash);
                    requestAnimationFrame(function () {
                        flash.style.opacity = '0.15';
                        setTimeout(function () { flash.style.opacity = '0'; setTimeout(function () { flash.remove(); }, 500); }, 200);
                    });
                    var terminal = $('terminal');
                    if (terminal) {
                        terminal.classList.remove('hidden'); terminal.classList.add('terminal-open');
                        var body = $('terminalBody');
                        if (body) {
                            setTimeout(function () {
                                var d = document.createElement('div'); d.className = 'term-line term-cmd'; d.textContent = 'Konami code unlocked. Curiosity is its own reward.'; body.appendChild(d);
                                body.scrollTop = body.scrollHeight;
                            }, 400);
                        }
                    }
                }
            } else { idx = 0; }
        });
    });

})();
