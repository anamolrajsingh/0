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
       VIBES — YOUTUBE PLAYLIST
       Playlist: PLNyNAs0WPlfU
       ============================================================ */
    var PLAYLIST_ID = 'PLNyNAs0WPlfU';
    var drawer = document.getElementById('vibesDrawer');
    var vibesToggle = document.getElementById('vibesToggle');
    var vibesClose = document.getElementById('vibesClose');
    var host = document.getElementById('ytPlayerHost');
    var player = null;
    var apiLoading = false;
    var pendingPlay = false;
    var progressTimer = null;
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
    var nextBtn = document.getElementById('ytMiniNext');
    var rewindBtn = document.getElementById('ytRewindBtn');
    var forwardBtn = document.getElementById('ytForwardBtn');
    var seekBar = document.getElementById('ytSeekBar');
    var elapsed = document.getElementById('ytTimeElapsed');
    var remaining = document.getElementById('ytTimeRemaining');
    var volumeSlider = document.getElementById('ytVolumeSlider');
    var queueBtn = document.getElementById('ytQueueBtn');
    var queueList = document.getElementById('ytQueueList');
    var collapseBtn = document.getElementById('ytCollapseBtn');
    var isScrubbing = false;

    function fmt(sec) {
        sec = Math.max(0, Math.floor(Number(sec) || 0));
        return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    }
    function text(el, value) { if (el) el.textContent = value || '—'; }
    function setPlaying(playing) {
        if (playIcon) playIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
        if (miniPlayIcon) miniPlayIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
        if (playBtn) playBtn.classList.toggle('is-playing', playing);
    }
    function setTrackMeta(data) {
        if (!data || !data.video_id) return;
        var id = data.video_id;
        var t = data.title || 'Now Playing';
        var a = data.author || 'YouTube';
        var image = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
        [expandedThumb, miniThumb].forEach(function (img) {
            if (img) { img.src = image; img.alt = t; }
        });
        text(expandedTitle, t);
        text(miniTitle, t);
        text(expandedArtist, a + ' — YouTube');
        text(miniArtist, a);
    }
    function refreshMeta() {
        if (!player || !player.getVideoData) return;
        var data = player.getVideoData();
        if (data && data.video_id) setTrackMeta(data);
    }
    function updateProgress() {
        if (!player || !player.getDuration || isScrubbing) return;
        var duration = Number(player.getDuration()) || 0;
        var current = Number(player.getCurrentTime()) || 0;
        if (seekBar && duration) {
            seekBar.max = duration;
            seekBar.value = current;
            seekBar.style.setProperty('--yt-fill', ((current / duration) * 100) + '%');
        }
        text(elapsed, fmt(current));
        text(remaining, '-' + fmt(Math.max(0, duration - current)));
    }
    function startProgress() {
        if (progressTimer) clearInterval(progressTimer);
        progressTimer = setInterval(updateProgress, 500);
    }
    function stopProgress() {
        if (progressTimer) clearInterval(progressTimer);
        progressTimer = null;
    }

    function createPlayer() {
        if (player || !host || !window.YT || !YT.Player) return;
        player = new YT.Player(host, {
            width: '200', height: '200',
            playerVars: {
                listType: 'playlist', list: PLAYLIST_ID, autoplay: 0,
                controls: 0, disablekb: 1, playsinline: 1,
                modestbranding: 1, rel: 0, fs: 0, origin: window.location.origin
            },
            events: {
                onReady: function () {
                    if (volumeSlider) player.setVolume(Number(volumeSlider.value) || 70);
                    player.cuePlaylist({ listType: 'playlist', list: PLAYLIST_ID, index: 0 });
                    setTimeout(refreshMeta, 1200);
                    if (pendingPlay) { pendingPlay = false; player.playVideo(); }
                },
                onStateChange: function (event) {
                    var state = event.data;
                    if (state === YT.PlayerState.CUED || state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED) {
                        setTimeout(refreshMeta, 100);
                    }
                    if (state === YT.PlayerState.PLAYING) { setPlaying(true); startProgress(); }
                    else if (state === YT.PlayerState.PAUSED) { setPlaying(false); stopProgress(); }
                    else if (state === YT.PlayerState.ENDED) { setPlaying(false); stopProgress(); player.nextVideo(); }
                },
                onError: function () {
                    setPlaying(false);
                    text(expandedTitle, 'Unable to play this video');
                    text(expandedArtist, 'YouTube');
                    setTimeout(function () { if (player) player.nextVideo(); }, 600);
                }
            }
        });
    }
    function loadYouTubeApi() {
        if (window.YT && window.YT.Player) { createPlayer(); return; }
        if (apiLoading) return;
        apiLoading = true;
        var previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof previous === 'function') previous();
            createPlayer();
        };
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
    }
    function openVibes() {
        if (!drawer) return;
        drawer.classList.add('active');
        drawer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
        pendingPlay = true;
        loadYouTubeApi();
    }
    function closeVibes() {
        if (!drawer) return;
        drawer.classList.remove('active');
        drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
    }

    if (vibesToggle) vibesToggle.addEventListener('click', openVibes);
    if (vibesClose) vibesClose.addEventListener('click', closeVibes);
    if (collapseBtn) collapseBtn.addEventListener('click', function () {
        var expanded = document.getElementById('ytExpandedPlayer');
        if (expanded) expanded.classList.toggle('collapsed');
    });
    if (playBtn) playBtn.addEventListener('click', function () {
        if (!player) { pendingPlay = true; loadYouTubeApi(); return; }
        player.getPlayerState() === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
    });
    if (miniPlayBtn) miniPlayBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!player) { pendingPlay = true; loadYouTubeApi(); return; }
        player.getPlayerState() === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
    });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (player) player.nextVideo(); });
    if (rewindBtn) rewindBtn.addEventListener('click', function () { if (player) player.seekTo(Math.max(0, player.getCurrentTime() - 10), true); });
    if (forwardBtn) forwardBtn.addEventListener('click', function () { if (player) player.seekTo(player.getCurrentTime() + 10, true); });
    if (volumeSlider) volumeSlider.addEventListener('input', function () {
        volumeSlider.style.setProperty('--yt-fill', volumeSlider.value + '%');
        if (player) player.setVolume(Number(volumeSlider.value));
    });
    if (seekBar) {
        seekBar.addEventListener('pointerdown', function () { isScrubbing = true; });
        seekBar.addEventListener('input', function () {
            var max = Number(seekBar.max) || 1;
            seekBar.style.setProperty('--yt-fill', ((Number(seekBar.value) / max) * 100) + '%');
        });
        seekBar.addEventListener('change', function () {
            if (player && player.getDuration()) player.seekTo(Number(seekBar.value), true);
            isScrubbing = false;
        });
        seekBar.addEventListener('pointerup', function () { isScrubbing = false; });
    }
    if (queueBtn && queueList) queueBtn.addEventListener('click', function () {
        queueList.hidden = !queueList.hidden;
        if (!queueList.hidden && player && player.getPlaylist) {
            var ids = player.getPlaylist() || [];
            queueList.innerHTML = '';
            ids.forEach(function (id, index) {
                var item = document.createElement('div');
                item.className = 'yt-queue-item';
                item.textContent = 'Track ' + (index + 1);
                item.addEventListener('click', function () { player.playVideoAt(index); });
                queueList.appendChild(item);
            });
        }
    });
    if (volumeSlider) volumeSlider.style.setProperty('--yt-fill', volumeSlider.value + '%');
})();
