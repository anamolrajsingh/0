/* ================================================================
   Anamol Raj Singh — Personal Website
   script.js — Vanilla JavaScript
   Handles: theme toggle, live clock, mobile menu, scroll reveal,
   active nav links, back-to-top, smooth scrolling
   ================================================================ */

(function () {
    'use strict';

    // ============================================================
    // 0. GSAP SETUP + REDUCED MOTION CHECK
    // ============================================================
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGSAP = typeof gsap !== 'undefined';
    if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

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
    // 9. VIBES MUSIC WIDGET (YouTube IFrame Player + Spotify link-out)
    // ============================================================

    // --- TRACK PLAYLIST (edit this array to update your playlist) ---
    var tracks = [
        { title: 'Secret Forest 🍃 Chill Lofi Beats', artist: 'the bootleg boy', youtubeVideoId: 'NvftPSb5Xtw' },
        { title: 'Oxygen', artist: 'Krisu', youtubeVideoId: '1Vd_JEBOkkY' },
        { title: 'Rainy Streets', artist: 'Purrple Cat', youtubeVideoId: 'ikbFbkkLfZo' },
        { title: 'I\'m Yours', artist: 'Lofi Fruits Music', youtubeVideoId: 'N-v8uJOnEIs' },
        { title: 'Here Comes A Thought (From "Steven Universe")', artist: 'Lofi Lia', youtubeVideoId: 'KMMdnQA3GWs' },
        { title: 'Blankets', artist: 'Aso', youtubeVideoId: 'HdXrkgZP438' },
        { title: 'clear my thoughts', artist: 'Jhove', youtubeVideoId: '2FD5g9koBgk' },
        { title: 'Starlight', artist: 'Tøsaki', youtubeVideoId: '8INMXGTs7H8' },
        { title: 'Je Te Laisserai Des Mots Sad War Piano', artist: 'Lucas King', youtubeVideoId: 'u7J561Q-flE' },
        { title: 'Be Free (Original Mix)', artist: 'Jonathan Beats', youtubeVideoId: 'TPyJ4srJeP8' },
        { title: 'Lunar Drive', artist: 'Mondo Loops', youtubeVideoId: 'WryLH9_cRkM' },
        { title: 'Unbridled', artist: 'Joseph Jacobs', youtubeVideoId: 'mhovhC6zuaI' },
        { title: 'Ocarina of Time', artist: 'Mikel', youtubeVideoId: 'H-N08B6k-Sg' },
        { title: 'Long Road', artist: 'Kind Puppy', youtubeVideoId: '33AejIvbG3g' },
        { title: 'slow breaths', artist: 'No Spirit', youtubeVideoId: '_zm2rl7kzyo' },
        { title: 'Velocities', artist: 'Sleepy Fish', youtubeVideoId: 'JgI6z6aQhEA' },
        { title: 'Feeling', artist: 'Pacific', youtubeVideoId: 'W9zGxWSfYsA' },
        { title: 'Mellow Skies', artist: 'Hakaisu', youtubeVideoId: 'YOafXZoYKwE' },
        { title: 'Maybe sometime', artist: 'The Muun Lofi', youtubeVideoId: 'q2EDwz6Begk' },
        { title: 'never', artist: 'Austin Chen', youtubeVideoId: 'Kttxm3joDls' },
        { title: 'Mental Acupuncture', artist: 'Jazzinuf', youtubeVideoId: 'Fk6P2zVQeKo' },
        { title: 'Hanging Lanterns', artist: 'Kalaido', youtubeVideoId: 'cukiBQ18NgE' },
        { title: 'No Lyrics Gaming Music For Streaming', artist: 'Lofi Sleep Chill & Study', youtubeVideoId: '1dC4F1f-EY0' },
        { title: 'seeing you', artist: 'idealism', youtubeVideoId: 'Lzc7s6R8-Gc' },
        { title: 'Frosty Morning Studies', artist: 'Lofi Beat Study', youtubeVideoId: '2eCKz7038KY' },
        { title: 'Moon', artist: 'Prod VKS', youtubeVideoId: 'ZScsZoy9ujI' },
        { title: 'Mirror Universe', artist: 'Kupla', youtubeVideoId: 'QKYN0pLq1ew' },
        { title: 'Rêverie', artist: 'ØDYSSEE', youtubeVideoId: 'z5CH4Q7yWYw' },
        { title: 'Lofi Chillhop Break', artist: 'Study Music For Deep Focus', youtubeVideoId: 'mm8xnN_UrsM' },
        { title: 'please, just be real', artist: 'lyrλmbient', youtubeVideoId: 'O9js2VCD0TY' },
        { title: 'Silhouettes', artist: 'Blue Wednesday', youtubeVideoId: '9mX2Hy7ReNc' },
        { title: 'Fukashigi no Carte but is it okay if it\'s lofi?', artist: 'Kijugo', youtubeVideoId: 'BTZPC1zgk9A' },
        { title: 'Chill Beat Chillhop', artist: 'Release', youtubeVideoId: 'i0vwfJG4WvA' },
        { title: 'Boba Tea', artist: 'Lukrembo', youtubeVideoId: 'hZ3DFgJppZs' },
        { title: 'Sentimental Mood', artist: 'Yusei', youtubeVideoId: 'r2hnhd6Z-Pc' },
        { title: 'Kaviar', artist: 'paris91', youtubeVideoId: 'YWSdt-sGrNU' },
        { title: 'blackguyrandi - paradise', artist: 'Dreamwave', youtubeVideoId: 'e-XkUTXl33Q' },
        { title: 'Touch ID', artist: 'MokkaMusic', youtubeVideoId: 'ZyNZpFS27Po' },
        { title: 'back when it all made sense', artist: 'Middle School', youtubeVideoId: '0INDcc0H4Y8' },
        { title: 'Ashes', artist: 'Saib', youtubeVideoId: 'urGLy3Y8vCA' },
        { title: 'Love Lasts', artist: 'Kudasaibeats', youtubeVideoId: 'nsOLUjap1j4' },
        { title: 'Lush Meadows of Stone', artist: 'City Girl', youtubeVideoId: 'ZU_zXqcE-h0' },
        { title: 'the garden (Instrumental)', artist: 'Khamir Music', youtubeVideoId: 'ew7pBNOSOJo' },
        { title: 'i wish u were here', artist: 'Hawys', youtubeVideoId: 'w0uOY5uvla0' },
        { title: 'By Your Side', artist: 'Tenno', youtubeVideoId: 'MZUdxZSwB0Q' },
        { title: 'comfy vibes', artist: 'Lilypichu', youtubeVideoId: 'pLs0Ogt66eQ' },
        { title: 'Melvin', artist: 'Boukas', youtubeVideoId: 'wsOsX-4JIO4' },
        { title: 'Prayer', artist: 'Psalm Trees', youtubeVideoId: 'Jqs5o5CR2lg' },
        { title: 'Childish Gambino - Redbone | Lofi cover | Instrumental | AKAIA Music', artist: 'AKAIA Music', youtubeVideoId: 'CWUxKMF2w2U' },
        { title: 'spirited away made lofi', artist: 'Hetalia', youtubeVideoId: 'QpXq0E_ZnP4' },
        { title: 'Snowman', artist: 'WYS', youtubeVideoId: '3lUtzMrRV04' },
        { title: 'strange calamity', artist: 'Towerz', youtubeVideoId: 'MeSOXuPYSHo' },
        { title: 'blueberries', artist: 'rosarummet', youtubeVideoId: 'NjjMprtE004' },
        { title: 'Opening', artist: 'Infraction Music', youtubeVideoId: 'feXa7TYudf8' },
        { title: 'Your Favorite Place', artist: 'Joey Pecoraro', youtubeVideoId: 'xaVAPmR6JMg' },
        { title: 'Route 209 (GlitchxCity Lo-Fi Remix)', artist: 'GlitchxCity', youtubeVideoId: 'xkpKyEXf2B4' },
        { title: 'Song For The Sun', artist: 'Stan Forebee', youtubeVideoId: '8huTQu-uPkc' },
        { title: 'Take Me Away', artist: 'Kiyoi', youtubeVideoId: 'gQn11yRqLh8' },
        { title: 'Lunar', artist: 'Anthemics', youtubeVideoId: 'deOgmhuPYpA' },
        { title: 'VIRGO "The Perfectionist"', artist: 'Tony Ann', youtubeVideoId: 'en4v-oWDNUU' },
        { title: 'Reign of the Septims (lofi Version)', artist: 'bits & hits', youtubeVideoId: '6AndsK2JJfg' },
        { title: 'lean back and look at the stars', artist: 'Sweeps', youtubeVideoId: 'sAY0TvB0sUU' },
        { title: 'Moon', artist: 'Lee', youtubeVideoId: '7z4mcZnQaoQ' },
        { title: 'Somewhere', artist: 'Khaim', youtubeVideoId: 'VH-zXTxhR5c' },
        { title: 'Northern Lights', artist: 'Koresma', youtubeVideoId: 'DqXwPuzfXP4' },
        { title: 'øneheart x reidenshi - snowfall | Slowed Down', artist: 'Stretched Harmonics', youtubeVideoId: '_7breslx57I' },
        { title: 'You Are In Somewhere On My Mind', artist: 'meomeo', youtubeVideoId: '_a1g1n75LNE' },
        { title: 'All About You', artist: 'Vyvxn', youtubeVideoId: 'BF52KRapf90' },
        { title: 'fuck it all', artist: 'Kevin WiRE', youtubeVideoId: 'ASIzolbFZvM' },
        { title: 'Colorful Flowers', artist: 'Tokyo Music Walker', youtubeVideoId: 'QSQZeG9zv4U' },
        { title: 'Neon Nights', artist: 'Big Reed', youtubeVideoId: '-ZuPdNjuxck' },
        { title: 'gemini', artist: 'Snail\'s House', youtubeVideoId: 'sckHN082KEk' },
        { title: 'Dreaming', artist: 'Difrent', youtubeVideoId: '78ALoYgjQo0' }
    ];

    function getThumbUrl(videoId) {
        return 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg';
    }

    // --- State ---
    var currentTrack = 0;
    var ytPlayer = null;
    var ytApiLoaded = false;
    var ytApiLoading = false;
    var isPlaying = false;
    var isSeeking = false;

    // --- DOM refs ---
    var vibesToggle = document.getElementById('vibesToggle');
    var vibesDrawer = document.getElementById('vibesDrawer');
    var vibesWidget = document.getElementById('vibesWidget');

    var mpMini = document.getElementById('mpMini');
    var mpMiniThumb = document.getElementById('mpMiniThumb');
    var mpMiniTitle = document.getElementById('mpMiniTitle');
    var mpMiniArtist = document.getElementById('mpMiniArtist');
    var mpMiniPlay = document.getElementById('mpMiniPlay');

    var mpExpanded = document.getElementById('mpExpanded');
    var mpChevron = document.getElementById('mpChevron');
    var mpArt = document.getElementById('mpArt');
    var mpTitle = document.getElementById('mpTitle');
    var mpArtist = document.getElementById('mpArtist');
    var mpFav = document.getElementById('mpFav');
    var mpPlay = document.getElementById('mpPlay');
    var mpPrev = document.getElementById('mpPrev');
    var mpNext = document.getElementById('mpNext');
    var mpRewind = document.getElementById('mpRewind');
    var mpForward = document.getElementById('mpForward');
    var mpSeek = document.getElementById('mpSeek');
    var mpSeekFill = document.getElementById('mpSeekFill');
    var mpSeekHandle = document.getElementById('mpSeekHandle');
    var mpElapsed = document.getElementById('mpElapsed');
    var mpRemaining = document.getElementById('mpRemaining');
    var mpVolume = document.getElementById('mpVolume');
    var mpQueueBtn = document.getElementById('mpQueueBtn');

    // --- Load YouTube IFrame API (lazy) ---
    function loadYouTubeAPI() {
        if (ytApiLoaded || ytApiLoading) return;
        ytApiLoading = true;
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }

    // --- API Ready callback ---
    window.onYouTubeIframeAPIReady = function () {
        ytApiLoaded = true;
        initYTPlayer();
    };

    // --- Initialize hidden YouTube player ---
    function initYTPlayer() {
        var container = document.getElementById('ytPlayerHidden');
        if (!container) return;
        var playerDiv = document.createElement('div');
        container.appendChild(playerDiv);

        ytPlayer = new YT.Player(playerDiv, {
            height: '1',
            width: '1',
            videoId: tracks[currentTrack].youtubeVideoId,
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'modestbranding': 1,
                'rel': 0,
                'playsinline': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    function onPlayerReady(e) {
        ytPlayer.setVolume(parseInt(mpVolume.value));
        updateTrackInfo();
    }

    function onPlayerStateChange(e) {
        if (e.data === YT.PlayerState.PLAYING) {
            isPlaying = true;
            updatePlayIcons();
            startProgressLoop();
        } else if (e.data === YT.PlayerState.PAUSED) {
            isPlaying = false;
            updatePlayIcons();
            stopProgressLoop();
        } else if (e.data === YT.PlayerState.ENDED) {
            isPlaying = false;
            updatePlayIcons();
            stopProgressLoop();
            nextTrack();
        }
    }

    // --- Progress loop ---
    var progressInterval = null;
    function startProgressLoop() {
        stopProgressLoop();
        progressInterval = setInterval(updateProgress, 250);
    }
    function stopProgressLoop() {
        if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
    }
    function updateProgress() {
        if (!ytPlayer || !ytPlayer.getDuration || isSeeking) return;
        var duration = ytPlayer.getDuration();
        var current = ytPlayer.getCurrentTime();
        if (!duration || isNaN(duration)) return;
        var pct = (current / duration) * 100;
        mpSeekFill.style.width = pct + '%';
        mpSeekHandle.style.left = pct + '%';
        mpElapsed.textContent = formatTime(current);
        mpRemaining.textContent = '-' + formatTime(duration - current);
    }
    function formatTime(seconds) {
        seconds = Math.floor(seconds);
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + ':' + (s < 10 ? '0' + s : s);
    }

    // --- Play/Pause ---
    function togglePlay() {
        if (!ytPlayer || !ytPlayer.playVideo) return;
        if (isPlaying) { ytPlayer.pauseVideo(); } else { ytPlayer.playVideo(); }
    }
    function updatePlayIcons() {
        var cls = isPlaying ? 'bx bx-pause' : 'bx bx-play';
        if (mpPlay.querySelector('i')) mpPlay.querySelector('i').className = cls;
        if (mpMiniPlay.querySelector('i')) mpMiniPlay.querySelector('i').className = cls;
    }

    // --- Track navigation ---
    function loadTrack(index) {
        currentTrack = index;
        if (ytPlayer && ytPlayer.loadVideoById) {
            ytPlayer.loadVideoById(tracks[currentTrack].youtubeVideoId);
        }
        updateTrackInfo();
    }
    function nextTrack() {
        loadTrack((currentTrack + 1) % tracks.length);
    }
    function prevTrack() {
        loadTrack((currentTrack - 1 + tracks.length) % tracks.length);
    }
    function updateTrackInfo() {
        var track = tracks[currentTrack];
        var thumb = track.thumbnailUrl || getThumbUrl(track.youtubeVideoId);
        mpMiniThumb.src = thumb;
        mpMiniTitle.textContent = track.title;
        mpMiniArtist.textContent = track.artist;
        mpArt.src = thumb;
        mpTitle.textContent = track.title;
        mpArtist.textContent = track.artist;
        mpSeekFill.style.width = '0%';
        mpSeekHandle.style.left = '0%';
        mpElapsed.textContent = '0:00';
        mpRemaining.textContent = '-0:00';
    }

    // --- Skip +/-10s ---
    function skipTime(seconds) {
        if (!ytPlayer || !ytPlayer.getCurrentTime) return;
        var current = ytPlayer.getCurrentTime();
        var duration = ytPlayer.getDuration();
        var target = Math.max(0, Math.min(duration, current + seconds));
        ytPlayer.seekTo(target, true);
    }

    // --- Seek bar (draggable) ---
    function setupSeekBar() {
        var isDragging = false;
        function getSeekPct(e) {
            var rect = mpSeek.getBoundingClientRect();
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            var x = clientX - rect.left;
            return Math.max(0, Math.min(100, (x / rect.width) * 100));
        }
        function applyPct(pct) {
            mpSeekFill.style.width = pct + '%';
            mpSeekHandle.style.left = pct + '%';
            if (ytPlayer && ytPlayer.getDuration) {
                var dur = ytPlayer.getDuration();
                if (dur && !isNaN(dur)) {
                    var t = (pct / 100) * dur;
                    mpElapsed.textContent = formatTime(t);
                    mpRemaining.textContent = '-' + formatTime(dur - t);
                }
            }
        }
        function doSeek() {
            var pct = parseFloat(mpSeekFill.style.width) || 0;
            if (ytPlayer && ytPlayer.getDuration) {
                var dur = ytPlayer.getDuration();
                ytPlayer.seekTo((pct / 100) * dur, true);
            }
        }
        mpSeek.addEventListener('mousedown', function (e) {
            e.preventDefault();
            isDragging = true; isSeeking = true;
            applyPct(getSeekPct(e));
        });
        mpSeek.addEventListener('touchstart', function (e) {
            e.preventDefault();
            isDragging = true; isSeeking = true;
            applyPct(getSeekPct(e));
        }, { passive: false });
        document.addEventListener('mousemove', function (e) {
            if (isDragging) { e.preventDefault(); applyPct(getSeekPct(e)); }
        });
        document.addEventListener('touchmove', function (e) {
            if (isDragging) { e.preventDefault(); applyPct(getSeekPct(e)); }
        }, { passive: false });
        document.addEventListener('mouseup', function () {
            if (isDragging) { isDragging = false; isSeeking = false; doSeek(); }
        });
        document.addEventListener('touchend', function () {
            if (isDragging) { isDragging = false; isSeeking = false; doSeek(); }
        });
    }

    // --- Volume ---
    mpVolume.addEventListener('input', function () {
        if (ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(parseInt(this.value));
    });

    // --- Mini/Expanded toggle ---
    mpMini.addEventListener('click', function () {
        mpMini.style.display = 'none';
        mpExpanded.style.display = 'flex';
    });
    mpChevron.addEventListener('click', function () {
        mpExpanded.style.display = 'none';
        mpMini.style.display = 'flex';
    });

    // --- Button wiring ---
    mpPlay.addEventListener('click', togglePlay);
    mpMiniPlay.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
    mpNext.addEventListener('click', nextTrack);
    mpPrev.addEventListener('click', prevTrack);
    mpRewind.addEventListener('click', function () { skipTime(-10); });
    mpForward.addEventListener('click', function () { skipTime(10); });

    // --- Favorite toggle ---
    mpFav.addEventListener('click', function () {
        this.classList.toggle('active');
        var icon = this.querySelector('i');
        icon.className = this.classList.contains('active') ? 'bx bxs-heart' : 'bx bx-heart';
    });

    // --- Initialize ---
    setupSeekBar();
    updateTrackInfo();

    // --- Drawer toggle ---
    vibesToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = vibesDrawer.classList.toggle('open');
        vibesToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        vibesDrawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen) {
            var activeTab = vibesDrawer.querySelector('.vibes-tab.active');
            if (activeTab && activeTab.getAttribute('data-vibes-tab') === 'youtube') {
                loadYouTubeAPI();
            }
        }
    });

    // --- Tab switching ---
    var vibesTabs = vibesDrawer.querySelectorAll('.vibes-tab');
    vibesTabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
            e.stopPropagation();
            var tabName = this.getAttribute('data-vibes-tab');
            vibesTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            var panels = vibesDrawer.querySelectorAll('.vibes-panel');
            panels.forEach(function (p) {
                p.classList.toggle('active', p.getAttribute('data-vibes-panel') === tabName);
            });
            if (tabName === 'youtube') loadYouTubeAPI();
        });
    });

    // --- Close drawer ---
    document.addEventListener('click', function (e) {
        if (!vibesWidget.contains(e.target)) {
            vibesDrawer.classList.remove('open');
            vibesToggle.setAttribute('aria-expanded', 'false');
            vibesDrawer.setAttribute('aria-hidden', 'true');
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && vibesDrawer.classList.contains('open')) {
            vibesDrawer.classList.remove('open');
            vibesToggle.setAttribute('aria-expanded', 'false');
            vibesDrawer.setAttribute('aria-hidden', 'true');
        }
    });


    // ============================================================
    // 10. CUSTOM CURSOR (desktop only)
    // Two-part cursor: 8px dot (fast lerp) + 40px ring (slow lerp)
    // Uses requestAnimationFrame for smooth interpolation
    // ============================================================
    (function initCursor() {
        // Skip on touch devices
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        var dot = document.getElementById('cursorDot');
        var ring = document.getElementById('cursorRing');
        if (!dot || !ring) return;

        // Target positions (where the mouse actually is)
        var mouseX = 0, mouseY = 0;
        // Current rendered positions (lerped toward target)
        var dotX = 0, dotY = 0;
        var ringX = 0, ringY = 0;

        // Lerp factor — higher = snappier, lower = smoother/more lag
        // Dot follows faster (0.5), ring trails more (0.15)
        var dotLerp = 0.5;
        var ringLerp = 0.15;

        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Elements that trigger the hover state on the ring
        var hoverSelector = 'a, button, .glass-card, .interest-item, .vibes-trigger, input, [role="button"]';

        document.addEventListener('mouseover', function (e) {
            if (e.target.closest(hoverSelector)) {
                ring.classList.add('cursor-hover');
            }
        });
        document.addEventListener('mouseout', function (e) {
            if (e.target.closest(hoverSelector)) {
                ring.classList.remove('cursor-hover');
            }
        });

        // Hide cursor when mouse leaves window
        document.addEventListener('mouseleave', function () {
            dot.style.opacity = '0';
            ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', function () {
            dot.style.opacity = '1';
            ring.style.opacity = '1';
        });

        function animateCursor() {
            // Lerp current position toward mouse position
            dotX += (mouseX - dotX) * dotLerp;
            dotY += (mouseY - dotY) * dotLerp;
            ringX += (mouseX - ringX) * ringLerp;
            ringY += (mouseY - ringY) * ringLerp;

            dot.style.transform = 'translate(' + dotX + 'px, ' + dotY + 'px)';
            ring.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px)';

            requestAnimationFrame(animateCursor);
        }
        requestAnimationFrame(animateCursor);
    })();

    // ============================================================
    // 11. SCROLL-DRIVEN TEXT REVEAL
    // Splits text into word spans, animates with stagger on scroll
    // ============================================================
    (function initTextReveal() {
        // --- Text splitting: wrap each word in a <span class="reveal-word"> ---
        function splitText(el) {
            var nodes = Array.from(el.childNodes);
            nodes.forEach(function (node) {
                if (node.nodeType === 3) { // Text node only
                    var words = node.textContent.split(/(\s+)/);
                    var frag = document.createDocumentFragment();
                    words.forEach(function (word) {
                        if (word.trim()) {
                            var span = document.createElement('span');
                            span.className = 'reveal-word';
                            span.textContent = word;
                            frag.appendChild(span);
                        } else {
                            // Preserve whitespace
                            frag.appendChild(document.createTextNode(word));
                        }
                    });
                    el.replaceChild(frag, node);
                }
            });
        }

        // --- Skip animations for reduced-motion users ---
        if (prefersReducedMotion) {
            // Just show everything immediately
            document.querySelectorAll('.reveal-word').forEach(function (w) {
                w.style.opacity = '1';
                w.style.transform = 'none';
                w.style.filter = 'none';
            });
            document.querySelectorAll('[data-reveal]').forEach(function (el) {
                el.classList.add('is-visible');
            });
            return;
        }

        // --- Split all text in [data-split-text] elements ---
        document.querySelectorAll('[data-split-text]').forEach(splitText);

        // --- Animate split words with GSAP ScrollTrigger ---
        if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
            // Word-level stagger animation
            document.querySelectorAll('[data-split-text]').forEach(function (el) {
                var words = el.querySelectorAll('.reveal-word');
                if (!words.length) return;
                gsap.fromTo(words,
                    { opacity: 0, y: 20, filter: 'blur(8px)' },
                    {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: 0.8,
                        stagger: 0.04, // 40ms per word
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            once: true,
                        }
                    }
                );
            });

            // Card/item-level reveal via [data-reveal]
            document.querySelectorAll('[data-reveal]').forEach(function (el, i) {
                // Add stagger index for interest items
                if (el.classList.contains('interest-item')) {
                    var siblings = el.parentElement.querySelectorAll('.interest-item');
                    siblings.forEach(function (s, idx) {
                        s.style.setProperty('--reveal-index', idx);
                    });
                }
                gsap.fromTo(el,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 88%',
                            once: true,
                        }
                    }
                );
            });
        } else {
            // Fallback: IntersectionObserver if GSAP not loaded
            var revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('[data-reveal]').forEach(function (el) {
                revealObserver.observe(el);
            });

            // Word animation fallback with CSS transition
            document.querySelectorAll('[data-split-text]').forEach(function (el) {
                var words = el.querySelectorAll('.reveal-word');
                var wordObserver = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            words.forEach(function (word, idx) {
                                setTimeout(function () {
                                    word.style.transition = 'opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease';
                                    word.style.opacity = '1';
                                    word.style.transform = 'translateY(0)';
                                    word.style.filter = 'blur(0)';
                                }, idx * 40);
                            });
                            wordObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
                wordObserver.observe(el);
            });
        }
    })();

    // ============================================================
    // 12. QUOTE ROTATOR (Reading & Ideas card)
    // Cycles through quotes every 5 seconds with a fade transition
    // ============================================================
    (function initQuoteRotator() {
        var quotes = [
            { text: '"The reading of all good books is like a conversation with the finest minds of past centuries."', author: '\u2014 Descartes' },
            { text: '"A reader lives a thousand lives before he dies. The man who never reads lives only one."', author: '\u2014 George R.R. Martin' },
            { text: '"Books are a uniquely portable magic."', author: '\u2014 Stephen King' },
            { text: '"We read to know we\'re not alone."', author: '\u2014 C.S. Lewis' }
        ];

        var quoteText = document.getElementById('quoteText');
        var quoteAuthor = document.getElementById('quoteAuthor');
        var rotator = document.getElementById('quoteRotator');
        if (!quoteText || !quoteAuthor || !rotator) return;

        var currentIdx = 0;

        function cycleQuote() {
            rotator.classList.add('quote-fading');

            setTimeout(function () {
                currentIdx = (currentIdx + 1) % quotes.length;
                quoteText.textContent = quotes[currentIdx].text;
                quoteAuthor.textContent = quotes[currentIdx].author;
                rotator.classList.remove('quote-fading');
            }, 400); // matches CSS transition duration
        }

        // Cycle every 5 seconds
        setInterval(cycleQuote, 5000);
    })();

})();