/* ================================================================
   Anamol Raj Singh — Personal Website
   script.js — Vanilla JavaScript + GSAP
   Handles: Lenis, theme toggle (3-way), clock, mobile menu, scroll reveal,
   active nav, back-to-top, smooth scroll, magnetic cursor, particle canvas,
   magnetic buttons, terminal, Konami code,
   NEW: GSAP breathing headings, parallax blobs, staggered reveals,
   cursor-following previews, page transitions, Now widget, Thought Stream,
   ambient audio (Web Audio API)
   ================================================================ */

(function () {
    'use strict';

    // ============================================================
    // 0. LENIS SMOOTH SCROLL
    // ============================================================
    let lenis = null;
    if (typeof Lenis !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        lenis = new Lenis({
            duration: 1.2,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true,
            smoothTouch: false,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        window.__lenis = lenis;
    }

    // ============================================================
    // 1. THEME TOGGLE (dark / light / night)
    // ============================================================
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const STORAGE_KEY = 'ars-theme';
    const THEMES = ['dark', 'light', 'night'];

    function getInitialTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && THEMES.includes(saved)) return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        return 'dark';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeIcon) {
            if (theme === 'dark') themeIcon.className = 'bx bx-sun';
            else if (theme === 'light') themeIcon.className = 'bx bx-moon';
            else themeIcon.className = 'bx bx-star';
        }
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            const colors = { dark: '#0a0b0d', light: '#f5f5f3', night: '#060608' };
            metaTheme.setAttribute('content', colors[theme] || '#0a0b0d');
        }
    }

    applyTheme(getInitialTheme());

    themeToggle.addEventListener('click', function () {
        const current = root.getAttribute('data-theme');
        const idx = THEMES.indexOf(current);
        const next = THEMES[(idx + 1) % THEMES.length];
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    });

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem(STORAGE_KEY)) applyTheme(e.matches ? 'dark' : 'light');
        });
    }

    // ============================================================
    // 2. LIVE CLOCK
    // ============================================================
    const navClock = document.getElementById('navClock');
    const navClockMobile = document.getElementById('navClockMobile');

    function updateClock() {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        if (navClock) navClock.textContent = time;
        if (navClockMobile) navClockMobile.textContent = time;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ============================================================
    // 3. MOBILE MENU
    // ============================================================
    const menuToggle = document.getElementById('menuToggle');
    const menuIcon = document.getElementById('menuIcon');
    const mobileMenu = document.getElementById('mobileMenu');
    let menuOpen = false;

    function toggleMobileMenu() {
        menuOpen = !menuOpen;
        if (menuOpen) { mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px'; menuIcon.className = 'bx bx-x'; }
        else { mobileMenu.style.maxHeight = '0'; menuIcon.className = 'bx bx-menu'; }
    }
    menuToggle.addEventListener('click', toggleMobileMenu);
    document.querySelectorAll('.mobile-link').forEach(function (link) {
        link.addEventListener('click', function () { if (menuOpen) toggleMobileMenu(); });
    });

    // ============================================================
    // 4. SCROLL REVEAL (Intersection Observer — fallback if no GSAP)
    // ============================================================
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        revealElements.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealElements.forEach(function (el) { el.classList.add('visible'); });
    }

    // ============================================================
    // 5. ACTIVE NAV LINK ON SCROLL
    // ============================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    function onScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 20) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');

        let currentSection = '';
        sections.forEach(function (section) {
            if (scrollY >= section.offsetTop - 150) currentSection = section.getAttribute('id');
        });
        navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) link.classList.add('active');
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // ============================================================
    // 6. BACK TO TOP
    // ============================================================
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', function () {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        function toggleBackToTop() {
            if (window.scrollY > 400) { backToTop.style.opacity = '1'; backToTop.style.pointerEvents = 'auto'; }
            else { backToTop.style.opacity = '0.4'; backToTop.style.pointerEvents = 'auto'; }
        }
        window.addEventListener('scroll', toggleBackToTop, { passive: true });
        toggleBackToTop();
    }

    // ============================================================
    // 7. SMOOTH SCROLL (Lenis-aware)
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                if (lenis) lenis.scrollTo(target, { offset: -80 });
                else {
                    const pos = target.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top: pos, behavior: 'smooth' });
                }
            }
        });
    });

    // ============================================================
    // 8. CUSTOM MAGNETIC CURSOR
    // ============================================================
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');

    if (cursorDot && cursorRing && matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, dotX = 0, dotY = 0;

        document.addEventListener('mousemove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });
        document.addEventListener('mouseleave', function () { cursorDot.classList.add('cursor-hidden'); cursorRing.classList.add('cursor-hidden'); });
        document.addEventListener('mouseenter', function () { cursorDot.classList.remove('cursor-hidden'); cursorRing.classList.remove('cursor-hidden'); });

        function animateCursor() {
            dotX += (mouseX - dotX) * 0.5; dotY += (mouseY - dotY) * 0.5;
            cursorDot.style.transform = 'translate(' + (dotX - 3) + 'px, ' + (dotY - 3) + 'px)';
            ringX += (mouseX - ringX) * 0.15; ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.transform = 'translate(' + (ringX - 18) + 'px, ' + (ringY - 18) + 'px)';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        document.querySelectorAll('a, button, .glass-card, .interactive-card, .post-link, .tag-filter, input, .terminal-hint, .terminal-close, .thought-item').forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursorRing.classList.add('cursor-hover'); cursorDot.classList.add('cursor-hover'); });
            el.addEventListener('mouseleave', function () { cursorRing.classList.remove('cursor-hover'); cursorDot.classList.remove('cursor-hover'); });
        });
    }

    // ============================================================
    // 9. MAGNETIC BUTTONS
    // ============================================================
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('[data-magnetic]').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                el.style.transform = 'translate(' + (x * 0.25) + 'px, ' + (y * 0.25) + 'px)';
            });
            el.addEventListener('mouseleave', function () { el.style.transform = 'translate(0, 0)'; });
        });
    }

    // ============================================================
    // 10. PARTICLE CANVAS (interactive grid that warps on mouse)
    // ============================================================
    const canvas = document.getElementById('particleCanvas');
    if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const ctx = canvas.getContext('2d');
        let particles = [], mouseCanvasX = -9999, mouseCanvasY = -9999, animFrameId = null;

        function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); }

        function initParticles() {
            particles = [];
            const spacing = 60;
            const cols = Math.ceil(canvas.width / spacing) + 1;
            const rows = Math.ceil(canvas.height / spacing) + 1;
            for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
                particles.push({ baseX: i * spacing, baseY: j * spacing, x: i * spacing, y: j * spacing, vx: 0, vy: 0 });
            }
        }

        function getAccentColor() {
            const theme = root.getAttribute('data-theme');
            if (theme === 'light') return [139, 204, 0];
            return [198, 255, 0];
        }

        window.addEventListener('mousemove', function (e) { mouseCanvasX = e.clientX; mouseCanvasY = e.clientY; });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const [r, g, b] = getAccentColor();
            const warpRadius = 150, warpStrength = 30;

            particles.forEach(function (p) {
                const dx = p.baseX - mouseCanvasX, dy = p.baseY - mouseCanvasY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < warpRadius) {
                    const force = (1 - dist / warpRadius) * warpStrength;
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle) * force * 0.05;
                    p.vy += Math.sin(angle) * force * 0.05;
                }
                p.vx += (p.baseX - p.x) * 0.05; p.vy += (p.baseY - p.y) * 0.05;
                p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx; p.y += p.vy;

                const distFromMouse = Math.sqrt(Math.pow(p.x - mouseCanvasX, 2) + Math.pow(p.y - mouseCanvasY, 2));
                const opacity = distFromMouse < 200 ? 0.5 : 0.2;
                ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')'; ctx.fill();
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + ((1 - dist / 80) * 0.15) + ')';
                        ctx.lineWidth = 0.5; ctx.stroke();
                    }
                }
            }
            animFrameId = requestAnimationFrame(animate);
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { if (animFrameId) cancelAnimationFrame(animFrameId); animFrameId = null; }
            else if (!animFrameId) animate();
        });

        resizeCanvas(); animate();
        window.addEventListener('resize', resizeCanvas);
    }

    // ============================================================
    // 11. GSAP SCROLL ANIMATIONS (breathing headings, parallax, stagger)
    // ============================================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.registerPlugin(ScrollTrigger);

        // Breathing headings — variable font weight shifts as heading centers in viewport
        document.querySelectorAll('.breathe-heading').forEach(function (heading) {
            gsap.fromTo(heading,
                { fontWeight: 300 },
                {
                    fontWeight: 600,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heading,
                        start: 'top 90%',
                        end: 'center 50%',
                        scrub: 0.8
                    }
                }
            );
            gsap.fromTo(heading,
                { fontWeight: 600 },
                {
                    fontWeight: 300,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heading,
                        start: 'center 50%',
                        end: 'bottom 10%',
                        scrub: 0.8
                    }
                }
            );
        });

        // Parallax on background blobs
        const blob1 = document.getElementById('blob1');
        const blob2 = document.getElementById('blob2');
        if (blob1) {
            gsap.to(blob1, {
                y: -200, ease: 'none',
                scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 }
            });
        }
        if (blob2) {
            gsap.to(blob2, {
                y: 150, ease: 'none',
                scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.5 }
            });
        }

        // Staggered reveal for grid items (interest cards, now grid)
        document.querySelectorAll('.interests-grid .interest-card').forEach(function (card, idx) {
            gsap.fromTo(card,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 85%' },
                    delay: (idx % 3) * 0.1
                }
            );
        });

        // Sync ScrollTrigger with Lenis
        if (lenis) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        }
    }

    // ============================================================
    // 12. CURSOR-FOLLOWING PREVIEW CARDS (for Interest cards)
    // ============================================================
    const cursorPreview = document.getElementById('cursorPreview');
    const previewLabel = document.getElementById('previewLabel');
    const previewText = document.getElementById('previewText');
    const previewAmbient = document.getElementById('previewAmbient');

    if (cursorPreview && matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let previewX = 0, previewY = 0, targetX = 0, targetY = 0;

        document.addEventListener('mousemove', function (e) {
            targetX = e.clientX; targetY = e.clientY;
        });

        function animatePreview() {
            previewX += (targetX - previewX) * 0.12;
            previewY += (targetY - previewY) * 0.12;
            cursorPreview.style.left = previewX + 'px';
            cursorPreview.style.top = previewY + 'px';
            requestAnimationFrame(animatePreview);
        }
        animatePreview();

        document.querySelectorAll('[data-preview-label]').forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                previewLabel.textContent = card.getAttribute('data-preview-label');
                previewText.textContent = card.getAttribute('data-preview-text');
                // Set ambient gradient color based on category
                const label = card.getAttribute('data-preview-label');
                const gradients = {
                    'Technology': 'linear-gradient(135deg, #C6FF00, #00ff88)',
                    'Reading & Ideas': 'linear-gradient(135deg, #C6FF00, #ffaa00)',
                    'Current Affairs': 'linear-gradient(135deg, #C6FF00, #0088ff)',
                    'Design': 'linear-gradient(135deg, #C6FF00, #ff00aa)',
                    'Philosophy': 'linear-gradient(135deg, #C6FF00, #aa00ff)',
                    'Film & Media': 'linear-gradient(135deg, #C6FF00, #ff4400)'
                };
                if (previewAmbient) previewAmbient.style.background = gradients[label] || 'linear-gradient(135deg, #C6FF00, #C6FF00)';
                cursorPreview.classList.add('preview-visible');
            });
            card.addEventListener('mouseleave', function () {
                cursorPreview.classList.remove('preview-visible');
            });
        });
    }

    // ============================================================
    // 13. PAGE TRANSITIONS (curtain reveal)
    // ============================================================
    const pageTransition = document.getElementById('pageTransition');

    if (pageTransition) {
        // Animate curtain away on page load
        window.addEventListener('pageshow', function () {
            setTimeout(function () {
                pageTransition.classList.add('curtain-up');
                setTimeout(function () {
                    pageTransition.classList.add('curtain-down');
                    setTimeout(function () {
                        pageTransition.classList.remove('curtain-up', 'curtain-down');
                    }, 600);
                }, 100);
            }, 50);
        });

        // Intercept clicks on page links (writings.html)
        document.querySelectorAll('a.page-link, a[href$=".html"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && !href.startsWith('#') && href.endsWith('.html')) {
                    e.preventDefault();
                    pageTransition.classList.remove('curtain-down');
                    pageTransition.classList.add('curtain-up');
                    setTimeout(function () { window.location.href = href; }, 500);
                }
            });
        });
    }

    // ============================================================
    // 14. NOW WIDGET RENDERING
    // ============================================================
    function renderNowWidget() {
        const grid = document.getElementById('nowGrid');
        const updated = document.getElementById('nowUpdated');
        if (!grid || typeof NOW_DATA === 'undefined') return;

        const d = NOW_DATA;

        grid.innerHTML = '' +
            // Reading card (large)
            '<div class="glass-card now-reading rounded-2xl p-8 reveal">' +
                '<div class="now-label">Reading</div>' +
                '<h3 class="now-title font-serif text-2xl">' + d.reading.title + '</h3>' +
                '<p class="now-author">' + d.reading.author + '</p>' +
                '<div class="now-progress"><div class="now-progress-bar" style="width: 0%" data-progress="' + d.reading.progress + '"></div></div>' +
                '<blockquote class="now-quote">' + d.reading.quote + '</blockquote>' +
                '<p class="now-note">' + d.reading.note + '</p>' +
            '</div>' +
            // Exploring card
            '<div class="glass-card rounded-2xl p-7 reveal">' +
                '<div class="now-label">Exploring</div>' +
                '<h3 class="now-title font-serif text-xl">' + d.exploring.title + '</h3>' +
                '<p class="now-note">' + d.exploring.note + '</p>' +
            '</div>' +
            // Watching card
            '<div class="glass-card rounded-2xl p-7 reveal">' +
                '<div class="now-label">Watching</div>' +
                '<h3 class="now-title font-serif text-xl">' + d.watching.title + '</h3>' +
                '<p class="now-author">' + d.watching.author + '</p>' +
                '<p class="now-note">' + d.watching.note + '</p>' +
            '</div>' +
            // Thinking card (wide)
            '<div class="glass-card now-thinking rounded-2xl p-8 reveal">' +
                '<div class="now-label">Thinking About</div>' +
                '<p class="now-question font-serif text-xl italic">' + d.thinking.question + '</p>' +
            '</div>';

        if (updated) updated.textContent = 'Last updated: ' + d.lastUpdated;

        // Animate progress bar
        setTimeout(function () {
            const bar = grid.querySelector('[data-progress]');
            if (bar) bar.style.width = bar.getAttribute('data-progress') + '%';
        }, 500);

        // Observe new reveal elements
        grid.querySelectorAll('.reveal').forEach(function (el) {
            if ('IntersectionObserver' in window) {
                const obs = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
                    });
                }, { threshold: 0.1 });
                obs.observe(el);
            } else { el.classList.add('visible'); }
        });

        // Register cursor hover for new cards
        if (cursorDot && cursorRing) {
            grid.querySelectorAll('.glass-card').forEach(function (el) {
                el.addEventListener('mouseenter', function () { cursorRing.classList.add('cursor-hover'); cursorDot.classList.add('cursor-hover'); });
                el.addEventListener('mouseleave', function () { cursorRing.classList.remove('cursor-hover'); cursorDot.classList.remove('cursor-hover'); });
            });
        }
    }
    renderNowWidget();

    // ============================================================
    // 15. THOUGHT STREAM RENDERING
    // ============================================================
    function renderThoughtStream() {
        const container = document.getElementById('thoughtStream');
        if (!container || typeof THOUGHTS === 'undefined') return;

        let html = '';
        THOUGHTS.forEach(function (thought) {
            const d = new Date(thought.date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dateStr = months[d.getMonth()] + ' ' + d.getDate();
            html += '<div class="thought-item">' +
                '<span class="thought-date">' + dateStr + '</span>' +
                '<span class="thought-text">' + thought.text + '</span>' +
            '</div>';
        });
        container.innerHTML = html;
    }
    renderThoughtStream();

    // ============================================================
    // 16. AMBIENT AUDIO (Web Audio API — relaxing soundscape)
    // A layered ambient soundscape: warm chord drone + gentle LFO breathing
    // + brown noise "stream" layer. Tuned to A minor for a calming feel.
    // ============================================================
    const audioToggle = document.getElementById('audioToggle');
    const audioIcon = document.getElementById('audioIcon');
    let audioCtx = null, audioMasterGain = null, audioActive = false;
    let audioNodes = [];

    if (audioToggle) {
        audioToggle.addEventListener('click', function () {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                audioMasterGain = audioCtx.createGain();
                audioMasterGain.gain.value = 0;
                audioMasterGain.connect(audioCtx.destination);

                // --- Layer 1: Warm chord drone (A2, E3, A3, C4) ---
                var chordFreqs = [110, 164.81, 220, 261.63]; // A2, E3, A3, C4
                chordFreqs.forEach(function (freq, i) {
                    var osc = audioCtx.createOscillator();
                    var oscGain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    // Slight detune for warmth
                    osc.detune.value = (i - 1.5) * 3;
                    // Each oscillator gets progressively quieter
                    oscGain.gain.value = 0.15 / (i + 1);
                    osc.connect(oscGain);
                    oscGain.connect(audioMasterGain);
                    osc.start();
                    audioNodes.push({ osc: osc, gain: oscGain });
                });

                // --- Layer 2: Gentle LFO for "breathing" volume effect ---
                var lfo = audioCtx.createOscillator();
                var lfoGain = audioCtx.createGain();
                lfo.frequency.value = 0.06; // Very slow: ~10 sec cycle
                lfo.type = 'sine';
                lfoGain.gain.value = 0.03; // Subtle 3% modulation
                lfo.connect(lfoGain);
                // Modulate the master gain slightly (creates a "breathing" feel)
                lfoGain.connect(audioMasterGain.gain);
                lfo.start();
                audioNodes.push({ osc: lfo, gain: lfoGain });

                // --- Layer 3: Brown noise "stream/wind" layer ---
                var bufferSize = 2 * audioCtx.sampleRate;
                var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                var output = noiseBuffer.getChannelData(0);
                var lastOut = 0;
                for (var j = 0; j < bufferSize; j++) {
                    var white = Math.random() * 2 - 1;
                    output[j] = (lastOut + 0.02 * white) / 1.02;
                    lastOut = output[j];
                    output[j] *= 3.5;
                }
                var noise = audioCtx.createBufferSource();
                noise.buffer = noiseBuffer;
                noise.loop = true;
                var noiseFilter = audioCtx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.value = 400;
                noiseFilter.Q.value = 0.5;
                var noiseGain = audioCtx.createGain();
                noiseGain.gain.value = 0.04;
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(audioMasterGain);
                noise.start();
                audioNodes.push({ osc: noise, gain: noiseGain });

                // --- Layer 4: High shimmer (A5, very faint singing bowl) ---
                var shimmer = audioCtx.createOscillator();
                var shimmerGain = audioCtx.createGain();
                shimmer.type = 'sine';
                shimmer.frequency.value = 880; // A5
                shimmerGain.gain.value = 0.008;
                shimmer.connect(shimmerGain);
                shimmerGain.connect(audioMasterGain);
                shimmer.start();
                audioNodes.push({ osc: shimmer, gain: shimmerGain });

                // --- Master low-pass filter for overall warmth ---
                var masterFilter = audioCtx.createBiquadFilter();
                masterFilter.type = 'lowpass';
                masterFilter.frequency.value = 1200;
                masterFilter.Q.value = 0.3;
                // Reconnect everything through the master filter
                audioMasterGain.disconnect();
                audioMasterGain.connect(masterFilter);
                masterFilter.connect(audioCtx.destination);
            }

            if (audioCtx.state === 'suspended') audioCtx.resume();

            if (!audioActive) {
                // Smooth 3-second fade in
                audioMasterGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 3);
                audioActive = true;
                audioToggle.classList.add('audio-active');
                if (audioIcon) audioIcon.className = 'bx bx-volume-full';
            } else {
                // Smooth 2-second fade out
                audioMasterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
                audioActive = false;
                audioToggle.classList.remove('audio-active');
                if (audioIcon) audioIcon.className = 'bx bx-volume-low';
            }
        });
    }

    // ============================================================
    // 17. TERMINAL EASTER EGG
    // ============================================================
    const terminal = document.getElementById('terminal');
    const terminalBody = document.getElementById('terminalBody');
    const terminalInput = document.getElementById('terminalInput');
    const terminalClose = document.getElementById('terminalClose');
    const terminalHint = document.getElementById('terminalHint');

    const TERMINAL_COMMANDS = {
        'help': function () {
            return ['Available commands:', '  help     — show this message', '  about    — who I am', '  quote    — a thought I keep coming back to', '  matrix   — enter the matrix', '  coffee   — current status', '  reading  — what I\'m reading now', '  clear    — clear the terminal', '  exit     — close the terminal'];
        },
        'about': function () {
            return ['Anamol Raj Singh', 'A student and lifelong learner.', 'Curious about technology, philosophy, design, and the spaces in between.', 'This is my personal corner of the internet.'];
        },
        'quote': function () {
            const quotes = [
                '"The only true wisdom is in knowing you know nothing." — Socrates',
                '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Aristotle',
                '"The beginning of infinity is the recognition that problems are soluble." — David Deutsch',
                '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
                '"The unexamined life is not worth living." — Socrates'
            ];
            return [quotes[Math.floor(Math.random() * quotes.length)]];
        },
        'matrix': function () {
            const chars = '01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱｺﾏﾁﾒｦｱｲｳｴｵｶｷｸ';
            let lines = [];
            for (let i = 0; i < 5; i++) { let line = ''; for (let j = 0; j < 40; j++) line += chars[Math.floor(Math.random() * chars.length)]; lines.push(line); }
            return lines;
        },
        'coffee': function () { return ['☕ Status: Currently caffeinated and curious.', 'Reading, thinking, and building — one cup at a time.']; },
        'reading': function () { return ['Currently reading:', '  The Beginning of Infinity — David Deutsch', '  (Dense. Every few pages I stop and reconsider something.)']; },
        'clear': function () { terminalBody.innerHTML = ''; return null; },
        'exit': function () { closeTerminal(); return null; }
    };

    function openTerminal() {
        if (!terminal) return;
        terminal.classList.remove('hidden'); terminal.classList.add('terminal-open');
        setTimeout(function () { if (terminalInput) terminalInput.focus(); }, 400);
        if (terminalBody && terminalBody.innerHTML === '') {
            addTerminalLine('Welcome. Type "help" for commands.', 'term-welcome'); addTerminalLine('');
        }
    }
    function closeTerminal() {
        if (!terminal) return;
        terminal.classList.remove('terminal-open');
        setTimeout(function () { terminal.classList.add('hidden'); }, 500);
    }
    function addTerminalLine(text, className) {
        if (!terminalBody) return;
        const div = document.createElement('div');
        div.className = 'term-line' + (className ? ' ' + className : '');
        div.textContent = text;
        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }
    function addTerminalCommand(cmd) {
        if (!terminalBody) return;
        const div = document.createElement('div');
        div.className = 'term-line';
        div.innerHTML = '<span class="term-cmd">$ ' + cmd + '</span>';
        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }
    function addTerminalOutput(lines) {
        if (!terminalBody || !lines) return;
        lines.forEach(function (line) { const div = document.createElement('div'); div.className = 'term-line term-output'; div.textContent = line; terminalBody.appendChild(div); });
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    if (terminalInput) {
        terminalInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const cmd = terminalInput.value.trim().toLowerCase();
                if (cmd === '') return;
                addTerminalCommand(cmd); terminalInput.value = '';
                if (TERMINAL_COMMANDS[cmd]) { const result = TERMINAL_COMMANDS[cmd](); if (result) addTerminalOutput(result); }
                else addTerminalOutput(['Command not found: ' + cmd + '. Type "help" for available commands.']);
            } else if (e.key === 'Escape') closeTerminal();
        });
    }
    if (terminalClose) terminalClose.addEventListener('click', closeTerminal);
    if (terminalHint) terminalHint.addEventListener('click', openTerminal);

    document.addEventListener('keydown', function (e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (e.key === '`' || e.key === '~') { e.preventDefault(); if (terminal.classList.contains('terminal-open')) closeTerminal(); else openTerminal(); }
        if (e.key === 'Escape' && terminal.classList.contains('terminal-open')) closeTerminal();
    });

    // ============================================================
    // 18. KONAMI CODE
    // ============================================================
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIdx = 0;

    document.addEventListener('keydown', function (e) {
        const key = e.key;
        if (key === KONAMI[konamiIdx] || key.toLowerCase() === KONAMI[konamiIdx].toLowerCase()) {
            konamiIdx++;
            if (konamiIdx === KONAMI.length) { konamiIdx = 0; triggerKonami(); }
        } else { konamiIdx = 0; }
    });

    function triggerKonami() {
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;inset:0;z-index:9998;background:var(--accent);opacity:0;pointer-events:none;transition:opacity 0.3s ease;';
        document.body.appendChild(flash);
        requestAnimationFrame(function () {
            flash.style.opacity = '0.15';
            setTimeout(function () { flash.style.opacity = '0'; setTimeout(function () { flash.remove(); }, 500); }, 200);
        });
        openTerminal();
        setTimeout(function () {
            addTerminalLine(''); addTerminalLine('🔓 Konami code unlocked.', 'term-cmd');
            addTerminalLine('You found a secret. Curiosity is its own reward.', 'term-welcome');
            addTerminalLine('—');
            addTerminalLine('"The illiterate of the 21st century will not be those who cannot read and write,', 'term-welcome');
            addTerminalLine(' but those who cannot learn, unlearn, and relearn." — Alvin Toffler', 'term-welcome');
        }, 600);
    }

    // ============================================================
    // 19. INIT
    // ============================================================
    onScroll();

    }

})();
