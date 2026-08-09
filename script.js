/* ================================================================
   Anamol Raj Singh — Personal Website
   Core interactions + Vibes YouTube playlist player
   ================================================================ */
(function () {
    'use strict';

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
        }

        /* --- Display track metadata from our tracks array --- */
        function showTrack(index) {
            var t = tracks[index];
            if (!t) return;
            var img = t.thumbnailUrl || thumbUrl(t.youtubeVideoId);
            if (expandedThumb) { expandedThumb.src = img; expandedThumb.alt = t.title; }
            if (miniThumb) { miniThumb.src = img; miniThumb.alt = t.title; }
            setText(expandedTitle, t.title);
            setText(miniTitle, t.title);
            setText(expandedArtist, t.artist + ' — YouTube');
            setText(miniArtist, t.artist);
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
                img.src = t.thumbnailUrl || thumbUrl(t.youtubeVideoId);
                img.alt = t.title;
                img.loading = 'lazy';
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


})();

