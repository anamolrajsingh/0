/* ================================================================
   Anamol Raj Singh — Personal Website
   script.js — Vanilla JavaScript
   Handles: Lenis smooth scroll, theme toggle, live clock, mobile menu,
   scroll reveal, active nav links, back-to-top, custom magnetic cursor,
   particle canvas, magnetic buttons, terminal easter egg, Konami code
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
            easing: function (t) {
                return Math.min(1, 1.001 - Math.pow(2, -10 * t));
            },
            smoothWheel: true,
            smoothTouch: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Expose for smooth scroll to anchors
        window.__lenis = lenis;
    }

    // ============================================================
    // 1. THEME TOGGLE (dark / light / night with system detection + localStorage)
    // ============================================================
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const STORAGE_KEY = 'ars-theme';

    const THEMES = ['dark', 'light', 'night'];

    function getInitialTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && THEMES.includes(saved)) return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        // Cycle icon: dark → sun (switch to light), light → moon (switch to night), night → stars (switch to dark)
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

        if (scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

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

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });

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
                const offset = 80;
                if (lenis) {
                    lenis.scrollTo(target, { offset: -offset });
                } else {
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
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
        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;
        let dotX = 0, dotY = 0;

        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        document.addEventListener('mouseleave', function () {
            cursorDot.classList.add('cursor-hidden');
            cursorRing.classList.add('cursor-hidden');
        });

        document.addEventListener('mouseenter', function () {
            cursorDot.classList.remove('cursor-hidden');
            cursorRing.classList.remove('cursor-hidden');
        });

        function animateCursor() {
            // Dot follows exactly
            dotX += (mouseX - dotX) * 0.5;
            dotY += (mouseY - dotY) * 0.5;
            cursorDot.style.transform = 'translate(' + (dotX - 3) + 'px, ' + (dotY - 3) + 'px)';

            // Ring trails with easing
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.transform = 'translate(' + (ringX - 18) + 'px, ' + (ringY - 18) + 'px)';

            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Expand cursor on hover over interactive elements
        document.querySelectorAll('a, button, .glass-card, .interactive-card, .post-link, .tag-filter, input, .terminal-hint, .terminal-close').forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                cursorRing.classList.add('cursor-hover');
                cursorDot.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', function () {
                cursorRing.classList.remove('cursor-hover');
                cursorDot.classList.remove('cursor-hover');
            });
        });
    }

    // ============================================================
    // 9. MAGNETIC BUTTONS / ELEMENTS
    // ============================================================
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('[data-magnetic]').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const strength = 0.25;
                el.style.transform = 'translate(' + (x * strength) + 'px, ' + (y * strength) + 'px)';
            });

            el.addEventListener('mouseleave', function () {
                el.style.transform = 'translate(0, 0)';
            });
        });
    }

    // ============================================================
    // 10. PARTICLE CANVAS (interactive grid that warps on mouse move)
    // ============================================================
    const canvas = document.getElementById('particleCanvas');
    if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouseCanvasX = -9999, mouseCanvasY = -9999;
        let animFrameId = null;
        let canvasVisible = true;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        }

        function initParticles() {
            particles = [];
            const spacing = 60;
            const cols = Math.ceil(canvas.width / spacing) + 1;
            const rows = Math.ceil(canvas.height / spacing) + 1;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    particles.push({
                        baseX: i * spacing,
                        baseY: j * spacing,
                        x: i * spacing,
                        y: j * spacing,
                        vx: 0, vy: 0
                    });
                }
            }
        }

        function getAccentColor() {
            const theme = root.getAttribute('data-theme');
            if (theme === 'light') return [139, 204, 0];
            if (theme === 'night') return [198, 255, 0];
            return [198, 255, 0]; // dark
        }

        window.addEventListener('mousemove', function (e) {
            mouseCanvasX = e.clientX;
            mouseCanvasY = e.clientY;
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const [r, g, b] = getAccentColor();

            const warpRadius = 150;
            const warpStrength = 30;

            particles.forEach(function (p) {
                // Mouse warp effect
                const dx = p.baseX - mouseCanvasX;
                const dy = p.baseY - mouseCanvasY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < warpRadius) {
                    const force = (1 - dist / warpRadius) * warpStrength;
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle) * force * 0.05;
                    p.vy += Math.sin(angle) * force * 0.05;
                }

                // Spring back to base position
                p.vx += (p.baseX - p.x) * 0.05;
                p.vy += (p.baseY - p.y) * 0.05;
                p.vx *= 0.85;
                p.vy *= 0.85;
                p.x += p.vx;
                p.y += p.vy;

                // Draw particle
                const distFromMouse = Math.sqrt(
                    Math.pow(p.x - mouseCanvasX, 2) + Math.pow(p.y - mouseCanvasY, 2)
                );
                const opacity = distFromMouse < 200 ? 0.5 : 0.2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
                ctx.fill();
            });

            // Draw connections between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        const opacity = (1 - dist / 80) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animFrameId = requestAnimationFrame(animate);
        }

        // Pause when tab not visible (performance)
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                if (animFrameId) cancelAnimationFrame(animFrameId);
                animFrameId = null;
            } else if (!animFrameId) {
                animate();
            }
        });

        resizeCanvas();
        animate();
        window.addEventListener('resize', resizeCanvas);
    }

    // ============================================================
    // 11. TERMINAL EASTER EGG
    // ============================================================
    const terminal = document.getElementById('terminal');
    const terminalBody = document.getElementById('terminalBody');
    const terminalInput = document.getElementById('terminalInput');
    const terminalClose = document.getElementById('terminalClose');
    const terminalHint = document.getElementById('terminalHint');

    const TERMINAL_COMMANDS = {
        'help': function () {
            return [
                'Available commands:',
                '  help     — show this message',
                '  about    — who I am',
                '  quote    — a thought I keep coming back to',
                '  matrix   — enter the matrix',
                '  coffee   — current status',
                '  reading  — what I\'m reading now',
                '  clear    — clear the terminal',
                '  exit     — close the terminal'
            ];
        },
        'about': function () {
            return [
                'Anamol Raj Singh',
                'A student and lifelong learner.',
                'Curious about technology, philosophy, design, and the spaces in between.',
                'This is my personal corner of the internet.'
            ];
        },
        'quote': function () {
            const quotes = [
                '"The only true wisdom is in knowing you know nothing." — Socrates',
                '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Aristotle',
                '"The beginning of infinity is the recognition that problems are soluble." — David Deutsch',
                '"You can\'t go back and change the beginning, but you can start where you are and change the ending." — C.S. Lewis',
                '"The unexamined life is not worth living." — Socrates',
                '"Simplicity is the ultimate sophistication." — Leonardo da Vinci'
            ];
            return [quotes[Math.floor(Math.random() * quotes.length)]];
        },
        'matrix': function () {
            const chars = '01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱｺﾏﾁﾒｦｱｲｳｴｵｶｷｸ';
            let lines = [];
            for (let i = 0; i < 5; i++) {
                let line = '';
                for (let j = 0; j < 40; j++) {
                    line += chars[Math.floor(Math.random() * chars.length)];
                }
                lines.push(line);
            }
            return lines;
        },
        'coffee': function () {
            return [
                '☕ Status: Currently caffeinated and curious.',
                'Reading, thinking, and building — one cup at a time.',
                'Current brew: whatever keeps the momentum going.'
            ];
        },
        'reading': function () {
            return [
                'Currently reading:',
                '  The Beginning of Infinity — David Deutsch',
                '  (Dense. Every few pages I stop and reconsider something.)',
                '',
                'Recently finished:',
                '  Tokyo Story (film) — Yasujirō Ozu',
                '  On Writing — Stephen King'
            ];
        },
        'clear': function () {
            terminalBody.innerHTML = '';
            return null;
        },
        'exit': function () {
            closeTerminal();
            return null;
        }
    };

    function openTerminal() {
        if (!terminal) return;
        terminal.classList.remove('hidden');
        terminal.classList.add('terminal-open');
        setTimeout(function () {
            if (terminalInput) terminalInput.focus();
        }, 400);
        printWelcome();
    }

    function closeTerminal() {
        if (!terminal) return;
        terminal.classList.remove('terminal-open');
        setTimeout(function () {
            terminal.classList.add('hidden');
        }, 500);
    }

    function printWelcome() {
        if (!terminalBody) return;
        if (terminalBody.innerHTML === '') {
            addTerminalLine('Welcome. Type "help" for commands.', 'term-welcome');
            addTerminalLine('');
        }
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
        lines.forEach(function (line) {
            const div = document.createElement('div');
            div.className = 'term-line term-output';
            div.textContent = line;
            terminalBody.appendChild(div);
        });
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    if (terminalInput) {
        terminalInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const cmd = terminalInput.value.trim().toLowerCase();
                if (cmd === '') return;

                addTerminalCommand(cmd);
                terminalInput.value = '';

                if (TERMINAL_COMMANDS[cmd]) {
                    const result = TERMINAL_COMMANDS[cmd]();
                    if (result) addTerminalOutput(result);
                } else {
                    addTerminalOutput(['Command not found: ' + cmd + '. Type "help" for available commands.']);
                }
            } else if (e.key === 'Escape') {
                closeTerminal();
            }
        });
    }

    if (terminalClose) {
        terminalClose.addEventListener('click', closeTerminal);
    }

    if (terminalHint) {
        terminalHint.addEventListener('click', openTerminal);
    }

    // Open terminal with ~ or ` key
    document.addEventListener('keydown', function (e) {
        // Don't trigger if already typing in an input
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
        }

        if (e.key === '`' || e.key === '~') {
            e.preventDefault();
            if (terminal.classList.contains('terminal-open')) {
                closeTerminal();
            } else {
                openTerminal();
            }
        }
        if (e.key === 'Escape' && terminal.classList.contains('terminal-open')) {
            closeTerminal();
        }
    });

    // ============================================================
    // 12. KONAMI CODE EASTER EGG
    // ============================================================
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                    'b', 'a'];
    let konamiIdx = 0;

    document.addEventListener('keydown', function (e) {
        const key = e.key;

        if (key === KONAMI[konamiIdx] || key.toLowerCase() === KONAMI[konamiIdx].toLowerCase()) {
            konamiIdx++;
            if (konamiIdx === KONAMI.length) {
                konamiIdx = 0;
                triggerKonami();
            }
        } else {
            konamiIdx = 0;
        }
    });

    function triggerKonami() {
        // Flash accent color across the screen
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;inset:0;z-index:9998;background:var(--accent);opacity:0;pointer-events:none;transition:opacity 0.3s ease;';
        document.body.appendChild(flash);
        requestAnimationFrame(function () {
            flash.style.opacity = '0.15';
            setTimeout(function () {
                flash.style.opacity = '0';
                setTimeout(function () {
                    flash.remove();
                }, 500);
            }, 200);
        });

        // Print a hidden message in the terminal
        openTerminal();
        setTimeout(function () {
            addTerminalLine('');
            addTerminalLine('🔓 Konami code unlocked.', 'term-cmd');
            addTerminalLine('You found a secret. Curiosity is its own reward.', 'term-welcome');
            addTerminalLine('—');
            addTerminalLine('"The illiterate of the 21st century will not be those who cannot read and write,', 'term-welcome');
            addTerminalLine(' but those who cannot learn, unlearn, and relearn." — Alvin Toffler', 'term-welcome');
        }, 600);
    }

    // ============================================================
    // 13. INITIALIZE — run onScroll once on load
    // ============================================================
    onScroll();

})();
