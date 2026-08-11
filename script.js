/* ================================================================
   Anamol Raj Singh — Personal Website
   Core interactions + Vibes YouTube playlist player
   ================================================================ */
(function () {
    'use strict';

    /* ---------------- PRELOADER ---------------- */
    (function preloader() {
        var el = document.getElementById('preloader');
        if (!el) return;

        var countEl = document.getElementById('preloaderCount');
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* Lock scroll while preloader is visible */
        document.documentElement.style.overflow = 'hidden';

        function done() {
            el.classList.add('is-hidden');
            document.documentElement.style.overflow = '';
            el.addEventListener('transitionend', function handler(e) {
                if (e.propertyName !== 'opacity') return;
                el.removeEventListener('transitionend', handler);
                el.style.display = 'none';
            });
        }

        if (reduced) {
            /* Skip counting, fade out quickly */
            if (countEl) countEl.textContent = '100%';
            setTimeout(done, 150);
            return;
        }

        /* requestAnimationFrame ease-out counter 0 → 100 */
        var duration = 1200 + Math.random() * 600; /* 1.2–1.8s */
        var startTs = null;

        function tick(ts) {
            if (startTs === null) startTs = ts;
            var elapsed = ts - startTs;
            var progress = Math.min(elapsed / duration, 1);
            /* ease-out cubic */
            var eased = 1 - Math.pow(1 - progress, 3);
            var pct = Math.round(eased * 100);
            if (countEl) countEl.textContent = pct + '%';
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                setTimeout(done, 200);
            }
        }
        requestAnimationFrame(tick);
    })();

    /* ---------------- THEME ---------------- */
    var root = document.documentElement;
    var themeToggle = document.getElementById('themeToggle');
    var themeIcon = document.getElementById('themeIcon');
    var savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'bx bx-moon text-lg' : 'bx bx-sun text-lg';
            themeIcon.style.transform = theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
    applyTheme(initialTheme);
    if (themeToggle) themeToggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) {}
    });

    /* ---------------- CLOCK ---------------- */
    var clock = document.getElementById('navClock');
    function updateClock() {
        if (!clock) return;
        clock.textContent = new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kathmandu'
        });
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ---------------- MOBILE MENU ---------------- */
    var menuToggle = document.getElementById('menuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    var menuIcon = document.getElementById('menuIcon');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function () {
            var open = mobileMenu.style.maxHeight !== '0px' && mobileMenu.style.maxHeight !== '';
            mobileMenu.style.maxHeight = open ? '0px' : mobileMenu.scrollHeight + 'px';
            if (menuIcon) menuIcon.className = open ? 'bx bx-menu text-lg' : 'bx bx-x text-lg';
        });
        mobileMenu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                mobileMenu.style.maxHeight = '0px';
                if (menuIcon) menuIcon.className = 'bx bx-menu text-lg';
            });
        });
    }

    /* ---------------- NAVBAR / ACTIVE LINKS ---------------- */
    var navbar = document.getElementById('navbar');
    var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    function updateNav() {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
        var sections = document.querySelectorAll('section[id]');
        var current = '';
        sections.forEach(function (section) {
            if (window.scrollY >= section.offsetTop - 180) current = section.id;
        });
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    /* ---------------- SCROLL REVEAL ---------------- */
    var revealItems = document.querySelectorAll('.reveal');
    function revealAll() {
        revealItems.forEach(function (el) { el.classList.add('visible'); });
    }
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        revealItems.forEach(function (el) { observer.observe(el); });
        /* Safety fallback: never leave the entire page hidden if the observer is blocked. */
        setTimeout(revealAll, 1500);
    } else {
        revealAll();
    }

    /* ---------------- SMOOTH SCROLL ---------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var id = link.getAttribute('href');
            if (!id || id === '#') return;
            var target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            var offset = navbar ? navbar.offsetHeight : 0;
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        });
    });

    /* ---------------- BACK TO TOP ---------------- */
    var backTop = document.getElementById('backToTop');
    if (backTop) {
        backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        window.addEventListener('scroll', function () {
            backTop.classList.toggle('visible', window.scrollY > 500);
        }, { passive: true });
    }

    /* ============================================================
       3. MUSIC WIDGET
       Apple-Music-style YouTube player with REAL playback control
       via the YouTube IFrame Player API.

       Edit this tracks array to change your playlist.
       Each track: { title, artist, youtubeVideoId, thumbnailUrl? }
       thumbnailUrl is optional — falls back to YouTube's thumbnail.
       ============================================================ */
    (function initMusicWidget() {
        'use strict';

        /* --------------------------------------------------------
           TRACK DATA — edit freely
           { title, artist, youtubeVideoId, thumbnailUrl? }
           -------------------------------------------------------- */
        var tracks = [
            { title: 'Oxygen', artist: 'YouTube', youtubeVideoId: '1Vd_JEBOkkY' },
            { title: 'Rainy Streets', artist: 'YouTube', youtubeVideoId: 'ikbFbkkLfZo' },
            { title: 'I\'m Yours', artist: 'YouTube', youtubeVideoId: 'N-v8uJOnEIs' },
            { title: 'Here Comes A Thought (From "Steven Universe")', artist: 'YouTube', youtubeVideoId: 'KMMdnQA3GWs' },
            { title: 'Blankets', artist: 'YouTube', youtubeVideoId: 'HdXrkgZP438' },
            { title: 'clear my thoughts', artist: 'YouTube', youtubeVideoId: '2FD5g9koBgk' },
            { title: 'Starlight', artist: 'YouTube', youtubeVideoId: '8INMXGTs7H8' },
            { title: 'Je Te Laisserai Des Mots Sad War Piano', artist: 'YouTube', youtubeVideoId: 'u7J561Q-flE' },
            { title: 'Be Free (Original Mix)', artist: 'YouTube', youtubeVideoId: 'TPyJ4srJeP8' },
            { title: 'Lunar Drive', artist: 'YouTube', youtubeVideoId: 'WryLH9_cRkM' },
            { title: 'Unbridled', artist: 'YouTube', youtubeVideoId: 'mhovhC6zuaI' },
            { title: 'Ocarina of Time', artist: 'YouTube', youtubeVideoId: 'H-N08B6k-Sg' },
            { title: 'Long Road', artist: 'YouTube', youtubeVideoId: '33AejIvbG3g' },
            { title: 'slow breaths', artist: 'YouTube', youtubeVideoId: '_zm2rl7kzyo' },
            { title: 'Velocities', artist: 'YouTube', youtubeVideoId: 'JgI6z6aQhEA' },
            { title: 'Feeling', artist: 'YouTube', youtubeVideoId: 'W9zGxWSfYsA' },
            { title: 'Mellow Skies', artist: 'YouTube', youtubeVideoId: 'YOafXZoYKwE' },
            { title: 'Maybe sometime', artist: 'YouTube', youtubeVideoId: 'q2EDwz6Begk' },
            { title: 'never', artist: 'YouTube', youtubeVideoId: 'Kttxm3joDls' },
            { title: 'Mental Acupuncture', artist: 'YouTube', youtubeVideoId: 'Fk6P2zVQeKo' },
            { title: 'Hanging Lanterns', artist: 'YouTube', youtubeVideoId: 'cukiBQ18NgE' },
            { title: 'No Lyrics Gaming Music For Streaming', artist: 'YouTube', youtubeVideoId: '1dC4F1f-EY0' },
            { title: 'seeing you', artist: 'YouTube', youtubeVideoId: 'Lzc7s6R8-Gc' },
            { title: 'Frosty Morning Studies', artist: 'YouTube', youtubeVideoId: '2eCKz7038KY' },
            { title: 'Moon', artist: 'YouTube', youtubeVideoId: 'ZScsZoy9ujI' },
            { title: 'Mirror Universe', artist: 'YouTube', youtubeVideoId: 'QKYN0pLq1ew' },
            { title: 'Rêverie', artist: 'YouTube', youtubeVideoId: 'z5CH4Q7yWYw' },
            { title: 'Lofi Chillhop Break', artist: 'YouTube', youtubeVideoId: 'mm8xnN_UrsM' },
            { title: 'please, just be real', artist: 'YouTube', youtubeVideoId: 'O9js2VCD0TY' },
            { title: 'Silhouettes', artist: 'YouTube', youtubeVideoId: '9mX2Hy7ReNc' },
            { title: 'Fukashigi no Carte but is it okay if it\'s lofi?', artist: 'YouTube', youtubeVideoId: 'BTZPC1zgk9A' },
            { title: 'Chill Beat Chillhop', artist: 'YouTube', youtubeVideoId: 'i0vwfJG4WvA' },
            { title: 'Boba Tea', artist: 'YouTube', youtubeVideoId: 'hZ3DFgJppZs' },
            { title: 'Sentimental Mood', artist: 'YouTube', youtubeVideoId: 'r2hnhd6Z-Pc' },
            { title: 'Kaviar', artist: 'YouTube', youtubeVideoId: 'YWSdt-sGrNU' },
            { title: 'blackguyrandi - paradise', artist: 'YouTube', youtubeVideoId: 'e-XkUTXl33Q' },
            { title: 'Touch ID', artist: 'YouTube', youtubeVideoId: 'ZyNZpFS27Po' },
            { title: 'back when it all made sense', artist: 'YouTube', youtubeVideoId: '0INDcc0H4Y8' },
            { title: 'Ashes', artist: 'YouTube', youtubeVideoId: 'urGLy3Y8vCA' },
            { title: 'Love Lasts', artist: 'YouTube', youtubeVideoId: 'nsOLUjap1j4' },
            { title: 'Lush Meadows of Stone', artist: 'YouTube', youtubeVideoId: 'ZU_zXqcE-h0' },
            { title: 'the garden (Instrumental)', artist: 'YouTube', youtubeVideoId: 'ew7pBNOSOJo' },
            { title: 'i wish u were here', artist: 'YouTube', youtubeVideoId: 'w0uOY5uvla0' },
            { title: 'By Your Side', artist: 'YouTube', youtubeVideoId: 'MZUdxZSwB0Q' },
            { title: 'comfy vibes', artist: 'YouTube', youtubeVideoId: 'pLs0Ogt66eQ' },
            { title: 'Melvin', artist: 'YouTube', youtubeVideoId: 'wsOsX-4JIO4' },
            { title: 'Prayer', artist: 'YouTube', youtubeVideoId: 'Jqs5o5CR2lg' },
            { title: 'Childish Gambino - Redbone | Lofi cover | Instrumental | AKAIA Music', artist: 'YouTube', youtubeVideoId: 'CWUxKMF2w2U' },
            { title: 'spirited away made lofi', artist: 'YouTube', youtubeVideoId: 'QpXq0E_ZnP4' },
            { title: 'Snowman', artist: 'YouTube', youtubeVideoId: '3lUtzMrRV04' },
            { title: 'strange calamity', artist: 'YouTube', youtubeVideoId: 'MeSOXuPYSHo' },
            { title: 'blueberries', artist: 'YouTube', youtubeVideoId: 'NjjMprtE004' },
            { title: 'Opening', artist: 'YouTube', youtubeVideoId: 'feXa7TYudf8' },
            { title: 'Your Favorite Place', artist: 'YouTube', youtubeVideoId: 'xaVAPmR6JMg' },
            { title: 'Route 209 (GlitchxCity Lo-Fi Remix)', artist: 'YouTube', youtubeVideoId: 'xkpKyEXf2B4' },
            { title: 'Song For The Sun', artist: 'YouTube', youtubeVideoId: '8huTQu-uPkc' },
            { title: 'Take Me Away', artist: 'YouTube', youtubeVideoId: 'gQn11yRqLh8' },
            { title: 'Lunar', artist: 'YouTube', youtubeVideoId: 'deOgmhuPYpA' },
            { title: 'VIRGO "The Perfectionist"', artist: 'YouTube', youtubeVideoId: 'en4v-oWDNUU' },
            { title: 'Reign of the Septims (lofi Version)', artist: 'YouTube', youtubeVideoId: '6AndsK2JJfg' },
            { title: 'lean back and look at the stars', artist: 'YouTube', youtubeVideoId: 'sAY0TvB0sUU' },
            { title: 'Moon', artist: 'YouTube', youtubeVideoId: '7z4mcZnQaoQ' },
            { title: 'Somewhere', artist: 'YouTube', youtubeVideoId: 'VH-zXTxhR5c' },
            { title: 'Northern Lights', artist: 'YouTube', youtubeVideoId: 'DqXwPuzfXP4' },
            { title: 'øneheart x reidenshi - snowfall | Slowed Down', artist: 'YouTube', youtubeVideoId: '_7breslx57I' },
            { title: 'You Are In Somewhere On My Mind', artist: 'YouTube', youtubeVideoId: '_a1g1n75LNE' },
            { title: 'All About You', artist: 'YouTube', youtubeVideoId: 'BF52KRapf90' },
            { title: 'fuck it all', artist: 'YouTube', youtubeVideoId: 'ASIzolbFZvM' },
            { title: 'Colorful Flowers', artist: 'YouTube', youtubeVideoId: 'QSQZeG9zv4U' },
            { title: 'Neon Nights', artist: 'YouTube', youtubeVideoId: '-ZuPdNjuxck' },
            { title: 'gemini', artist: 'YouTube', youtubeVideoId: 'sckHN082KEk' },
            { title: 'Dreaming', artist: 'YouTube', youtubeVideoId: '78ALoYgjQo0' },
            { title: 'String Rapsody', artist: 'YouTube', youtubeVideoId: '3_94JBaF3kY' },
            { title: 'Gumpen', artist: 'YouTube', youtubeVideoId: '7MrEt15sVas' },
            { title: 'back to the gates', artist: 'YouTube', youtubeVideoId: 'g2oZ6FSl9TU' },
            { title: 'faces', artist: 'YouTube', youtubeVideoId: 'S8p0crahq3A' },
            { title: 'Saudade', artist: 'YouTube', youtubeVideoId: 'EcHhTnHOzAk' },
            { title: 'Tokyo Music Walker - Way Home', artist: 'YouTube', youtubeVideoId: 'DDmCxcLdzqQ' },
            { title: 'Music For Lo Fi Gaming', artist: 'YouTube', youtubeVideoId: 'YXldjL9Ll-k' },
            { title: 'Inspirational Cinematic Romantic by Infraction [No Copyright Music] / Your Dream', artist: 'YouTube', youtubeVideoId: '2y48T5b4cJ4' },
            { title: 'Calm', artist: 'YouTube', youtubeVideoId: 'ZTEwgVmCCwY' },
            { title: 'Ruck P - Soul Food', artist: 'YouTube', youtubeVideoId: 'vSyPzZ_wsgg' },
            { title: 'Eyes On The Prize', artist: 'YouTube', youtubeVideoId: 'dB8dlcZdSIE' },
            { title: 'TWO LANES - Transcend (Official Music Video)', artist: 'YouTube', youtubeVideoId: 'Xv01XtyS07k' },
            { title: 'bird', artist: 'YouTube', youtubeVideoId: 'mdLHiPX0hDs' },
            { title: 'Vanilla - Star', artist: 'YouTube', youtubeVideoId: 'N0C-snrKr-0' },
            { title: 'LoFi Study Success', artist: 'YouTube', youtubeVideoId: 'p1S1YHmVXoQ' },
            { title: 'MAISON ROYALE - Let Your Body Fly (visual)', artist: 'YouTube', youtubeVideoId: 'z930vGyT5LI' },
            { title: 'Coffee Break', artist: 'YouTube', youtubeVideoId: 'CUEHRYaTM1k' },
            { title: '[no copyright music] \'In Dreamland \' background music', artist: 'YouTube', youtubeVideoId: 'DSWYAclv2I8' },
            { title: 'Cinematic Dramatic Documentary by Infraction [No Copyright Music] / A New Dawn', artist: 'YouTube', youtubeVideoId: 'B0KD2ESTsOI' },
            { title: 'Vanilla - Coffee', artist: 'YouTube', youtubeVideoId: '8U7ewTH0npo' },
            { title: 'RŮDE - Eternal Youth', artist: 'YouTube', youtubeVideoId: 'W6hasdx4a1I' },
            { title: 'Fireplace', artist: 'YouTube', youtubeVideoId: 'IsLFK8TkaVw' },
            { title: 'lukrembo - butter', artist: 'YouTube', youtubeVideoId: 'Ua7Qfc1xu90' },
            { title: 'Styles Davis, Venuz Beats - Pivot', artist: 'YouTube', youtubeVideoId: 'DQF0Mat3hQc' },
            { title: '"Far Away" - Vibey Guitar Beat (Prod. Pacific)', artist: 'YouTube', youtubeVideoId: 'rPEhdesY6uw' },
            { title: 'lonnex - losing', artist: 'YouTube', youtubeVideoId: 'BgBNLX_3afs' },
            { title: 'loop.holes - Hold On', artist: 'YouTube', youtubeVideoId: 'o0E25elhZe8' },
            { title: 'star - it\'s_cold_here', artist: 'YouTube', youtubeVideoId: 'KXGiwLhsASc' }
        ];

        var drawer = document.getElementById('vibesDrawer');
        var vibesToggle = document.getElementById('vibesToggle');
        var vibesClose = document.getElementById('vibesClose');
        if (!vibesToggle || !drawer) return; // guard: widget not present on this page

        var isOpen = false;
        var player = null;
        var apiLoading = false;
        var pendingPlay = false;
        var trackIndex = 0;
        var progressTimer = null;
        var isScrubbing = false;
        var errorRetryCount = 0;
        var MAX_ERROR_RETRIES = 3;

        /* --- DOM refs --- */
        var host = document.getElementById('ytPlayerHost');
        var views = document.getElementById('ytPlayerViews');
        var miniPlayer = document.getElementById('ytMiniPlayer');
        var expandedPlayer = document.getElementById('ytExpandedPlayer');
        var collapseBtn = document.getElementById('ytCollapseBtn');
        var expandedThumb = document.getElementById('ytExpandedThumb');
        var miniThumb = document.getElementById('ytMiniThumb');
        var expandedTitle = document.getElementById('ytExpandedTitle');
        var expandedArtist = document.getElementById('ytExpandedArtist');
        var miniTitle = document.getElementById('ytMiniTitle');
        var miniArtist = document.getElementById('ytMiniArtist');
        var playBtn = document.getElementById('ytPlayPauseBtn');
        var miniPlayBtn = document.getElementById('ytMiniPlayPause');
        var playIcon = document.getElementById('ytPlayIcon');
        var miniPlayIcon = document.getElementById('ytMiniPlayIcon');
        var prevBtn = document.getElementById('ytPrevBtn');
        var miniPrevBtn = document.getElementById('ytMiniPrev');
        var nextBtn = document.getElementById('ytNextBtn');
        var miniNextBtn = document.getElementById('ytMiniNext');
        var rewindBtn = document.getElementById('ytRewindBtn');
        var forwardBtn = document.getElementById('ytForwardBtn');
        var seekBar = document.getElementById('ytSeekBar');
        var elapsed = document.getElementById('ytTimeElapsed');
        var remaining = document.getElementById('ytTimeRemaining');
        var volumeSlider = document.getElementById('ytVolumeSlider');
        var queueBtn = document.getElementById('ytQueueBtn');
        var queueList = document.getElementById('ytQueueList');

        /* --------------------------------------------------------
           HELPERS
           -------------------------------------------------------- */
        function fmt(sec) {
            sec = Math.max(0, Math.floor(Number(sec) || 0));
            return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
        }
        function setText(el, val) { if (el) el.textContent = val || '—'; }
        function thumbUrl(videoId) {
            return 'https://i.ytimg.com/vi/' + encodeURIComponent(videoId) + '/hqdefault.jpg';
        }

        /* --- Update play/pause icon based on state --- */
        function setPlaying(playing) {
            if (playIcon) playIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
            if (miniPlayIcon) miniPlayIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
            if (playBtn) playBtn.classList.toggle('is-playing', playing);
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
            }
        }

        /* --- Display track metadata from our tracks array --- */
        function showTrack(index) {
            var t = tracks[index];
            if (!t) return;
            var img = t.thumbnailUrl || thumbUrl(t.youtubeVideoId);
            [expandedThumb, miniThumb].forEach(function (el) {
                if (!el) return;
                el.classList.remove('is-loaded');
                el.onload = function () { el.classList.add('is-loaded'); };
                el.onerror = function () { el.classList.remove('is-loaded'); };
                el.src = img;
                el.alt = t.title;
            });
            setText(expandedTitle, t.title);
            setText(miniTitle, t.title);
            setText(expandedArtist, t.artist + ' — YouTube');
            setText(miniArtist, t.artist);

            /* Register Media Session metadata for lock-screen / notification controls */
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: t.title,
                    artist: t.artist,
                    album: 'anamolrajsingh.com.np',
                    artwork: [
                        { src: thumbUrl(t.youtubeVideoId), sizes: '480x360', type: 'image/jpeg' }
                    ]
                });
            }
        }

        /* --- Update seek bar + time labels --- */
        function updateProgress() {
            if (!player || !player.getDuration || isScrubbing) return;
            var dur = Number(player.getDuration()) || 0;
            var cur = Number(player.getCurrentTime()) || 0;
            if (seekBar && dur) {
                seekBar.max = dur;
                seekBar.value = cur;
                seekBar.style.setProperty('--yt-fill', ((cur / dur) * 100) + '%');
            }
            setText(elapsed, fmt(cur));
            setText(remaining, '-' + fmt(Math.max(0, dur - cur)));
        }
        function startProgress() {
            if (progressTimer) clearInterval(progressTimer);
            progressTimer = setInterval(updateProgress, 500);
        }
        function stopProgress() {
            if (progressTimer) clearInterval(progressTimer);
            progressTimer = null;
        }

        /* --------------------------------------------------------
           YOUTUBE IFRAME API
           -------------------------------------------------------- */
        /* --------------------------------------------------------
           MEDIA SESSION API
           Registers OS-level media controls (lock-screen, notification,
           Bluetooth, headset) so playback survives backgrounding.
           -------------------------------------------------------- */
        function setupMediaSession() {
            if (!('mediaSession' in navigator) || !player) return;
            navigator.mediaSession.setActionHandler('play', function () { player.playVideo(); });
            navigator.mediaSession.setActionHandler('pause', function () { player.pauseVideo(); });
            navigator.mediaSession.setActionHandler('previoustrack', function () {
                player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
            });
            navigator.mediaSession.setActionHandler('nexttrack', function () { player.nextVideo(); });
            navigator.mediaSession.setActionHandler('seekbackward', function () {
                player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
            });
            navigator.mediaSession.setActionHandler('seekforward', function () {
                player.seekTo(player.getCurrentTime() + 10, true);
            });
        }

        function createPlayer() {
            if (player || !host || !window.YT || !YT.Player) return;
            var first = tracks[trackIndex] || {};
            player = new YT.Player(host, {
                width: '200', height: '200',
                videoId: first.youtubeVideoId,
                playerVars: {
                    autoplay: 0, controls: 0, disablekb: 1,
                    playsinline: 1, modestbranding: 1, rel: 0, fs: 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: function () {
                        if (volumeSlider) player.setVolume(Number(volumeSlider.value) || 70);
                        player.cueVideoById(first.youtubeVideoId);
                        showTrack(trackIndex);
                        setupMediaSession();
                        if (pendingPlay) { pendingPlay = false; player.playVideo(); }
                    },
                    onStateChange: function (e) {
                        var s = e.data;
                        if (s === YT.PlayerState.PLAYING) {
                            setPlaying(true); startProgress();
                            errorRetryCount = 0;
                        } else if (s === YT.PlayerState.PAUSED) {
                            setPlaying(false); stopProgress();
                        } else if (s === YT.PlayerState.ENDED) {
                            setPlaying(false); stopProgress();
                            nextTrack();
                        }
                    },
                    onError: function () {
                        setPlaying(false);
                        errorRetryCount++;
                        if (errorRetryCount > MAX_ERROR_RETRIES) {
                            setText(expandedTitle, 'Playback error');
                            setText(expandedArtist, 'Please try again later');
                            setText(miniTitle, 'Playback error');
                            setText(miniArtist, 'Error');
                            stopProgress();
                            return;
                        }
                        setText(expandedTitle, 'Skipping unavailable track…');
                        setTimeout(function () { if (player) nextTrack(true); }, 600);
                    }
                }
            });
        }

        function loadYouTubeApi() {
            if (window.YT && window.YT.Player) { createPlayer(); return; }
            if (apiLoading) return;
            apiLoading = true;
            var prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function () {
                if (typeof prev === 'function') prev();
                createPlayer();
            };
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            document.head.appendChild(tag);
        }

        /* --------------------------------------------------------
           TRACK NAVIGATION
           -------------------------------------------------------- */
        function loadTrack(index, autoplay) {
            trackIndex = (index + tracks.length) % tracks.length;
            var t = tracks[trackIndex];
            if (!t) return;
            showTrack(trackIndex);
            if (player && player.loadVideoById) {
                if (autoplay) player.loadVideoById(t.youtubeVideoId);
                else player.cueVideoById(t.youtubeVideoId);
            }
            updateQueueHighlight();
        }
        function nextTrack(force) {
            loadTrack(trackIndex + 1, true);
        }
        function prevTrack() {
            loadTrack(trackIndex - 1, true);
        }

        /* --------------------------------------------------------
           QUEUE
           -------------------------------------------------------- */
        function buildQueue() {
            if (!queueList) return;
            queueList.innerHTML = '';
            tracks.forEach(function (t, i) {
                var item = document.createElement('div');
                item.className = 'yt-queue-item' + (i === trackIndex ? ' active' : '');
                item.setAttribute('data-index', i);
                var img = document.createElement('img');
                img.alt = t.title;
                img.loading = 'lazy';
                img.classList.add('yt-queue-img');
                img.onload = function () { this.classList.add('is-loaded'); };
                img.src = t.thumbnailUrl || thumbUrl(t.youtubeVideoId);
                var span = document.createElement('span');
                var strong = document.createElement('strong');
                strong.textContent = t.title;
                var small = document.createElement('small');
                small.textContent = t.artist;
                span.appendChild(strong);
                span.appendChild(small);
                item.appendChild(img);
                item.appendChild(span);
                item.addEventListener('click', function () {
                    loadTrack(i, true);
                    if (!isOpen) openDrawer();
                });
                queueList.appendChild(item);
            });
        }
        function updateQueueHighlight() {
            if (!queueList) return;
            queueList.querySelectorAll('.yt-queue-item').forEach(function (el) {
                el.classList.toggle('active', Number(el.getAttribute('data-index')) === trackIndex);
            });
        }

        /* --------------------------------------------------------
           DRAWER OPEN / CLOSE
           -------------------------------------------------------- */
        function openDrawer() {
            if (!drawer) return;
            isOpen = true;
            drawer.classList.add('active');
            drawer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
            pendingPlay = true;
            loadYouTubeApi();
        }
        function closeDrawer() {
            if (!drawer) return;
            isOpen = false;
            drawer.classList.remove('active');
            drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
            if (player) { try { player.pauseVideo(); } catch (e) {} }
        }

        /* --------------------------------------------------------
           EXPAND / COLLAPSE (mini <-> expanded)
           -------------------------------------------------------- */
        function setExpanded(expanded) {
            if (!views) return;
            views.classList.toggle('expanded', expanded);
        }

        /* --------------------------------------------------------
           EVENT WIRING
           -------------------------------------------------------- */
        if (vibesToggle) vibesToggle.addEventListener('click', openDrawer);
        if (vibesClose) vibesClose.addEventListener('click', closeDrawer);

        if (collapseBtn) collapseBtn.addEventListener('click', function () {
            setExpanded(!views.classList.contains('expanded'));
        });
        if (miniPlayer) miniPlayer.addEventListener('click', function (e) {
            // Don't expand when clicking buttons inside the mini player
            if (e.target.closest('button')) return;
            setExpanded(true);
        });

        /* Play / pause */
        function togglePlay() {
            if (!player) { pendingPlay = true; loadYouTubeApi(); return; }
            if (player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
        if (playBtn) playBtn.addEventListener('click', togglePlay);
        if (miniPlayBtn) miniPlayBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });

        /* Next / prev track */
        if (nextBtn) nextBtn.addEventListener('click', nextTrack);
        if (prevBtn) prevBtn.addEventListener('click', prevTrack);
        if (miniNextBtn) miniNextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextTrack(); });
        if (miniPrevBtn) miniPrevBtn.addEventListener('click', function (e) { e.stopPropagation(); prevTrack(); });

        /* Rewind / forward 10s */
        if (rewindBtn) rewindBtn.addEventListener('click', function () {
            if (player && player.seekTo) player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
        });
        if (forwardBtn) forwardBtn.addEventListener('click', function () {
            if (player && player.seekTo) player.seekTo(player.getCurrentTime() + 10, true);
        });

        /* Volume */
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function () {
                volumeSlider.style.setProperty('--yt-fill', volumeSlider.value + '%');
                if (player) player.setVolume(Number(volumeSlider.value));
            });
            volumeSlider.style.setProperty('--yt-fill', volumeSlider.value + '%');
        }

        /* Seek bar */
        if (seekBar) {
            seekBar.addEventListener('pointerdown', function () { isScrubbing = true; });
            seekBar.addEventListener('input', function () {
                var max = Number(seekBar.max) || 1;
                seekBar.style.setProperty('--yt-fill', ((Number(seekBar.value) / max) * 100) + '%');
            });
            seekBar.addEventListener('change', function () {
                if (player && player.getDuration) player.seekTo(Number(seekBar.value), true);
                isScrubbing = false;
            });
            seekBar.addEventListener('pointerup', function () { isScrubbing = false; });
        }

        /* Queue toggle */
        if (queueBtn && queueList) queueBtn.addEventListener('click', function () {
            queueList.hidden = !queueList.hidden;
            if (!queueList.hidden) buildQueue();
        });

        /* Initialise first track display */
        showTrack(0);
    })();


    /* ============================================================
       CHAT WIDGET — Landing page redesign
       AI chat assistant with landing page UI (orb, greeting,
       example cards) that transitions to conversation mode.
       Powered by Gemini via Cloudflare Worker proxy.
       ============================================================ */
    (function chatWidget() {
        var chatLanding      = document.getElementById('chatLanding');
        var chatConversation = document.getElementById('chatConversation');
        var chatMessages     = document.getElementById('chatMessages');
        var chatInput        = document.getElementById('chatInput');
        var chatSend         = document.getElementById('chatSend');
        var chatTyping       = document.getElementById('chatTyping');
        var chatRateNotice   = document.getElementById('chatRateNotice');
        var chatExamples     = document.getElementById('chatExamples');
        var greetingText     = document.getElementById('greetingText');
        var exampleCards     = document.querySelectorAll('.chat-example-card');

        if (!chatInput || !chatSend) return;

        /* ---- CONFIG ---- */
        var CHAT_PROXY_URL = 'https://chat.anamolrajsingh.com.np';
        var PROVIDER = 'gemini';
        var MODEL    = 'gemini-flash-latest';

        var SYSTEM_PROMPT =
            'You are the AI assistant featured on Anamol Raj Singh\'s personal ' +
            'site — a multi-purpose assistant built to think and converse ' +
            'broadly, not a narrow FAQ bot. You can discuss technology, ' +
            'current events, philosophy, design, books, film, and general ' +
            'knowledge, while reflecting Anamol\'s own curiosity and areas ' +
            'of interest.\n\n' +
            'SCOPE: Engage with any reasonable topic the visitor brings up. ' +
            'Draw on Anamol\'s interests (technology, reading, current affairs, ' +
            'design, philosophy, film) when relevant. Still answer questions ' +
            'about Anamol specifically as one topic among many. Say so if ' +
            'unsure about something that may have changed recently. Decline ' +
            'only genuinely inappropriate topics.\n\n' +
            'TONE & DEPTH: Be conversational and clear, like a well-read, ' +
            'curious person talking with a friend. Default to concise answers, ' +
            'go deeper only when asked. Present multiple perspectives fairly.\n\n' +
            'FORMATTING: Never use Markdown symbols in your output — no ** for ' +
            'bold, no ## for headers, no numbered lists with periods, no dashes ' +
            'for bullets. Write every answer as plain prose sentences, even ' +
            'when listing multiple items. For example, instead of a bulleted ' +
            'list, write items separated by commas in a flowing sentence. If ' +
            'you are about to output a symbol like * or #, replace it with ' +
            'plain words instead.\n\n' +
            'PERSONA: A capable, thoughtful assistant — curious and ' +
            'well-informed, shaped by Anamol\'s interests, able to hold a ' +
            'real conversation on essentially anything.';

        var conversation = [];
        var isSending = false;
        var hasStarted = false;

        /* ---- Time-based greeting ---- */
        function setGreeting() {
            if (!greetingText) return;
            var h = new Date().getHours();
            var greeting;
            if (h >= 5 && h < 12) greeting = 'Good Morning';
            else if (h >= 12 && h < 17) greeting = 'Good Afternoon';
            else if (h >= 17 && h < 21) greeting = 'Good Evening';
            else greeting = 'Good Night';
            greetingText.textContent = greeting;
        }
        setGreeting();

        /* ---- Example card click → fill input ---- */
        exampleCards.forEach(function(card) {
            card.addEventListener('click', function() {
                chatInput.value = card.getAttribute('data-prompt');
                chatInput.focus();
            });
        });

        /* ---- Transition from landing to chat mode ---- */
        function startChat() {
            if (hasStarted) return;
            hasStarted = true;
            if (chatLanding) chatLanding.classList.add('chat-hidden');
            if (chatExamples) chatExamples.classList.add('chat-hidden');
            if (chatConversation) chatConversation.hidden = false;
        }

        /* ---- Helpers ---- */
        function scrollToBottom() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function addBubble(text, cls) {
            var div = document.createElement('div');
            div.className = 'chat-bubble ' + cls;
            var p = document.createElement('p');
            p.textContent = text;
            div.appendChild(p);
            chatMessages.appendChild(div);
            scrollToBottom();
            return div;
        }

        function setError(msg) {
            addBubble(msg, 'chat-bubble-error');
        }

        function setLoading(on) {
            isSending = on;
            chatSend.disabled = on;
            chatInput.disabled = on;
            if (chatTyping) chatTyping.hidden = !on;
            if (on) scrollToBottom();
            if (!on) {
                chatInput.disabled = false;
                chatInput.focus();
            }
        }

        /* ---- Send message ---- */
        function send() {
            var text = chatInput.value.trim();
            if (!text || isSending) return;

            startChat();

            if (chatRateNotice) chatRateNotice.hidden = true;
            chatInput.value = '';

            addBubble(text, 'chat-bubble-user');
            conversation.push({ role: 'user', content: text });
            setLoading(true);

            fetch(CHAT_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: PROVIDER,
                    model: MODEL,
                    messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(conversation)
                })
            })
            .then(function(resp) {
                return resp.json().then(function(data) {
                    return { status: resp.status, data: data };
                });
            })
            .then(function(result) {
                var data = result.data;

                if (result.status === 429 || data.rateLimited) {
                    if (chatRateNotice) {
                        chatRateNotice.textContent = data.error || 'Rate limit reached. Try again later.';
                        chatRateNotice.hidden = false;
                    }
                    setError(data.error || 'Rate limit reached. Try again later.');
                    conversation.pop();
                    return;
                }

                if (data.error) {
                    setError(data.error);
                    conversation.pop();
                    return;
                }

                var reply = data.reply || 'No response received.';
                addBubble(reply, 'chat-bubble-ai');
                conversation.push({ role: 'assistant', content: reply });

                if (chatRateNotice && typeof data.rateRemaining === 'number' && data.rateRemaining <= 3) {
                    chatRateNotice.textContent = data.rateRemaining + ' messages remaining this hour.';
                    chatRateNotice.hidden = false;
                }
            })
            .catch(function(err) {
                setError('Network error — could not reach the chat server. Please try again.');
                conversation.pop();
            })
            .finally(function() {
                setLoading(false);
            });
        }

        /* ---- Event listeners ---- */
        chatSend.addEventListener('click', send);
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });
    })();

})();

