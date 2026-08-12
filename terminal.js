/* ================================================================
   terminal.js — "Awwwards meets Bloomberg Terminal" micro-interactions
   Loaded AFTER script.js and askme.js.
   Adds: text-scramble reveal on headings, custom cursor dot,
   and terminal-style hover effects on grid cells.
   ================================================================ */
(function () {
    'use strict';

    /* ---------------- TEXT SCRAMBLE EFFECT ---------------- */
    var CHARS = '!<>-_\\/[]{}—=+*^?#________';

    function ScrambleText(el) {
        this.el = el;
        this.original = el.textContent;
        this.scrambling = false;
    }

    ScrambleText.prototype.scramble = function () {
        if (this.scrambling) return;
        this.scrambling = true;
        var self = this;
        var target = this.original;
        var oldText = '';
        var length = target.length;
        var queue = [];
        var i = 0;

        for (; i < length; i++) {
            var from = oldText[i] || '';
            var to = target[i] || '';
            var start = Math.floor(Math.random() * 40);
            var end = start + Math.floor(Math.random() * 40);
            queue.push({ from: from, to: to, start: start, end: end, char: Math.random() < 0.5 ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)] });
        }

        var frame = 0;
        var update = function () {
            var output = '';
            var complete = 0;
            for (var j = 0; j < queue.length; j++) {
                var item = queue[j];
                if (frame >= item.end) {
                    complete++;
                    output += item.to;
                } else if (frame >= item.start) {
                    if (!item.char || Math.random() < 0.28) {
                        item.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                    }
                    output += '<span style="opacity:0.7">' + item.char + '</span>';
                } else {
                    output += item.from;
                }
            }
            self.el.innerHTML = output;
            if (complete === queue.length) {
                self.scrambling = false;
                self.el.textContent = self.original;
                return;
            }
            frame++;
            requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    };

    // Apply scramble to headings with .scramble-text class on reveal
    var scrambleTargets = document.querySelectorAll('.scramble-text');
    var scrambleObjects = [];

    scrambleTargets.forEach(function (el) {
        scrambleObjects.push(new ScrambleText(el));
    });

    // Scramble on scroll reveal (when .visible is added)
    if ('IntersectionObserver' in window) {
        var scrambleObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var obj = scrambleObjects.find(function (o) { return o.el === el; });
                    if (obj && !el.dataset.scrambled) {
                        el.dataset.scrambled = '1';
                        setTimeout(function () { obj.scramble(); }, 100);
                    }
                }
            });
        }, { threshold: 0.5 });

        scrambleTargets.forEach(function (el) { scrambleObserver.observe(el); });
    }

    // Also scramble all headings on initial load (after preloader)
    window.addEventListener('load', function () {
        setTimeout(function () {
            scrambleObjects.forEach(function (obj) {
                if (obj.el.getBoundingClientRect().top < window.innerHeight) {
                    obj.scramble();
                }
            });
        }, 600);
    });

    /* ---------------- CUSTOM CURSOR DOT ---------------- */
    var cursorDot = document.createElement('div');
    cursorDot.className = 'term-cursor-dot';
    document.body.appendChild(cursorDot);

    var cursorX = 0, cursorY = 0;
    var targetX = 0, targetY = 0;

    document.addEventListener('mousemove', function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
        cursorDot.classList.add('visible');
    });

    document.addEventListener('mouseleave', function () {
        cursorDot.classList.remove('visible');
    });

    // Smooth follow with lerp
    function updateCursor() {
        cursorX += (targetX - cursorX) * 0.2;
        cursorY += (targetY - cursorY) * 0.2;
        cursorDot.style.transform = 'translate(' + (cursorX - 3) + 'px, ' + (cursorY - 3) + 'px)';
        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Expand cursor on interactive elements
    var interactiveSelectors = 'a, button, .terminal-cell, .nav-link, .btn-primary, .btn-secondary, .footer-social, .glass-pill';
    document.querySelectorAll(interactiveSelectors).forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursorDot.classList.add('hovering'); });
        el.addEventListener('mouseleave', function () { cursorDot.classList.remove('hovering'); });
    });

    /* ---------------- TERMINAL CELL HOVER — SCRAMBLE HEADER ---------------- */
    var cells = document.querySelectorAll('.terminal-cell');
    cells.forEach(function (cell) {
        var header = cell.querySelector('.terminal-cell-id');
        if (!header) return;
        var originalText = header.textContent;
        var scrambling = false;

        cell.addEventListener('mouseenter', function () {
            if (scrambling) return;
            scrambling = true;
            var iteration = 0;
            var interval = setInterval(function () {
                header.textContent = originalText.split('').map(function (letter, idx) {
                    if (idx < iteration) return originalText[idx];
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                }).join('');
                if (iteration >= originalText.length) {
                    clearInterval(interval);
                    header.textContent = originalText;
                    scrambling = false;
                }
                iteration += 1 / 2;
            }, 30);
        });
    });

    /* ---------------- HERO BOOT SEQUENCE TYPING ---------------- */
    var bootLines = document.querySelectorAll('.term-boot-line');
    if (bootLines.length > 0) {
        bootLines.forEach(function (line, index) {
            var original = line.textContent;
            line.textContent = '';
            var delay = index * 200;

            setTimeout(function () {
                var i = 0;
                var typeInterval = setInterval(function () {
                    line.textContent = original.slice(0, i + 1);
                    i++;
                    if (i >= original.length) {
                        clearInterval(typeInterval);
                    }
                }, 20);
            }, delay);
        });
    }

    /* ---------------- REDUCED MOTION FALLBACK ---------------- */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Skip all animations — just show content
        scrambleTargets.forEach(function (el) { el.textContent = el.textContent; });
        cursorDot.style.display = 'none';
        bootLines.forEach(function (line) { line.textContent = line.dataset.text || line.textContent; });
    }
})();
