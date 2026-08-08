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
       Apple-Music-style YouTube player with REAL playback control
       via the YouTube IFrame Player API.
       ============================================================ */
    (function initMusicWidget() {
        var toggle = document.getElementById('vibesToggle');
        var drawer = document.getElementById('vibesDrawer');
        var closeBtn = document.getElementById('vibesClose');
        var ytPane = document.getElementById('ytPane');

        if (!toggle || !drawer) return; // guard: widget not present on this page

        var isOpen = false;

        /* --------------------------------------------------------
           PLAYLIST DATA
           Swap these out any time — just objects with:
           { title, artist, youtubeVideoId, thumbnailUrl }
           -------------------------------------------------------- */
        var defaultTracks = [
            {
                title: 'Never Gonna Give You Up',
                artist: 'Rick Astley',
                youtubeVideoId: 'dQw4w9WgXcQ',
                thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            },
            {
                title: 'Uptown Funk',
                artist: 'Mark Ronson ft. Bruno Mars',
                youtubeVideoId: 'OPf0YbXqDm0',
                thumbnailUrl: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg'
            },
            {
                title: 'Shape of You',
                artist: 'Ed Sheeran',
                youtubeVideoId: 'JGwWNGJdvx8',
                thumbnailUrl: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg'
            },
            {
                title: 'Faded',
                artist: 'Alan Walker',
                youtubeVideoId: '60ItHLz5WEA',
                thumbnailUrl: 'https://img.youtube.com/vi/60ItHLz5WEA/hqdefault.jpg'
            }
        ];
        var tracks = Array.isArray(window.VIBES_TRACKS) && window.VIBES_TRACKS.length
            ? window.VIBES_TRACKS
            : defaultTracks;
        var trackIndex = 0;

        /* --------------------------------------------------------
           DOM REFS
           -------------------------------------------------------- */
        var views = document.getElementById('ytPlayerViews');

        var miniPlayer = document.getElementById('ytMiniPlayer');
        var miniThumb = document.getElementById('ytMiniThumb');
        var miniTitle = document.getElementById('ytMiniTitle');
        var miniArtist = document.getElementById('ytMiniArtist');
        var miniPlayBtn = document.getElementById('ytMiniPlayPause');
        var miniPlayIcon = document.getElementById('ytMiniPlayIcon');
        var miniNextBtn = document.getElementById('ytMiniNext');

        var expandedThumb = document.getElementById('ytExpandedThumb');
        var expandedTitle = document.getElementById('ytExpandedTitle');
        var expandedArtist = document.getElementById('ytExpandedArtist');
        var collapseBtn = document.getElementById('ytCollapseBtn');
        var favBtn = document.getElementById('ytFavBtn');

        var seekBar = document.getElementById('ytSeekBar');
        var timeElapsed = document.getElementById('ytTimeElapsed');
        var timeRemaining = document.getElementById('ytTimeRemaining');
        var rewindBtn = document.getElementById('ytRewindBtn');
        var playPauseBtn = document.getElementById('ytPlayPauseBtn');
        var playIcon = document.getElementById('ytPlayIcon');
        var forwardBtn = document.getElementById('ytForwardBtn');
        var volumeSlider = document.getElementById('ytVolumeSlider');
        var queueBtn = document.getElementById('ytQueueBtn');
        var queueList = document.getElementById('ytQueueList');

        /* --------------------------------------------------------
           PLAYER STATE
           -------------------------------------------------------- */
        var ytPlayer = null;
        var ytApiReady = !!(window.YT && window.YT.Player);
        var ytApiLoading = false;
        var ytApiCallbacks = [];
        var isPlayerReady = false;
        var pendingAutoplay = false;
        var progressTimer = null;
        var isScrubbing = false;

        function fmtTime(sec) {
            if (!isFinite(sec) || sec < 0) sec = 0;
            var m = Math.floor(sec / 60);
            var s = Math.floor(sec % 60);
            return m + ':' + (s < 10 ? '0' : '') + s;
        }

        function setPlayIcons(playing) {
            playIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
            miniPlayIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
            playPauseBtn.classList.toggle('is-playing', playing);
        }

        function renderTrackMeta() {
            var t = tracks[trackIndex];
            if (!t) return;
            miniThumb.src = t.thumbnailUrl;
            miniThumb.alt = t.title;
            miniTitle.textContent = t.title;
            miniArtist.textContent = t.artist;
            expandedThumb.src = t.thumbnailUrl;
            expandedThumb.alt = t.title;
            expandedTitle.textContent = t.title;
            expandedArtist.textContent = t.artist + ' — YouTube';
        }

        function renderQueue() {
            if (!queueList) return;
            queueList.innerHTML = '';
            tracks.forEach(function (t, i) {
                var item = document.createElement('button');
                item.type = 'button';
                item.className = 'yt-queue-item' + (i === trackIndex ? ' active' : '');
                item.innerHTML =
                    '<img src="' + t.thumbnailUrl + '" alt="">' +
                    '<span><strong>' + t.title + '</strong><small>' + t.artist + '</small></span>';
                item.addEventListener('click', function () { loadTrack(i, true); });
                queueList.appendChild(item);
            });
        }

        /* --------------------------------------------------------
           YOUTUBE IFRAME API — lazy-loaded on first use
           -------------------------------------------------------- */
        function ensureYouTubeApi(callback) {
            if (ytApiReady && window.YT && window.YT.Player) { callback(); return; }

            ytApiCallbacks.push(callback);

            if (!ytApiLoading) {
                ytApiLoading = true;
                var previousReady = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = function () {
                    if (typeof previousReady === 'function') previousReady();
                    ytApiReady = true;
                    ytApiCallbacks.splice(0).forEach(function (cb) { cb(); });
                };
                var tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                tag.async = true;
                document.head.appendChild(tag);
            }
        }

        function createPlayer() {
            ytPlayer = new YT.Player('ytPlayerHost', {
                height: '1',
                width: '1',
                videoId: tracks[trackIndex].youtubeVideoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    playsinline: 1,
                    modestbranding: 1,
                    rel: 0,
                    fs: 0
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError
                }
            });
        }

        function onPlayerReady() {
            isPlayerReady = true;
            ytPlayer.setVolume(parseInt(volumeSlider.value, 10));
            if (pendingAutoplay) {
                ytPlayer.playVideo();
                pendingAutoplay = false;
            }
        }

        function onPlayerStateChange(e) {
            if (e.data === YT.PlayerState.PLAYING) {
                setPlayIcons(true);
                startProgressTimer();
                skipAttempts = 0; // reset — this track loaded fine
            } else if (e.data === YT.PlayerState.PAUSED) {
                setPlayIcons(false);
                stopProgressTimer();
            } else if (e.data === YT.PlayerState.ENDED) {
                setPlayIcons(false);
                stopProgressTimer();
                nextTrack();
            }
        }

        // Some videos disable embedding on third-party sites (a permission
        // the uploader/label sets, not something the player controls) —
        // error codes 101/150 mean "embedding not allowed". Skip forward
        // automatically instead of getting stuck on a dead track. Guarded
        // so we don't infinite-loop if every track in the list is broken.
        var skipAttempts = 0;
        function onPlayerError(e) {
            stopProgressTimer();
            setPlayIcons(false);
            skipAttempts++;
            if (skipAttempts < tracks.length) {
                nextTrack();
            } else {
                skipAttempts = 0;
            }
        }

        /* --------------------------------------------------------
           PROGRESS / TIME TRACKING
           -------------------------------------------------------- */
        function startProgressTimer() {
            stopProgressTimer();
            progressTimer = setInterval(updateProgress, 500);
            updateProgress();
        }

        function stopProgressTimer() {
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
        }

        function updateProgress() {
            if (!ytPlayer || isScrubbing || typeof ytPlayer.getCurrentTime !== 'function') return;
            var cur = ytPlayer.getCurrentTime() || 0;
            var dur = ytPlayer.getDuration() || 0;
            seekBar.max = dur || 100;
            seekBar.value = cur;
            timeElapsed.textContent = fmtTime(cur);
            timeRemaining.textContent = '-' + fmtTime(Math.max(dur - cur, 0));
            var pct = dur ? (cur / dur) * 100 : 0;
            seekBar.style.setProperty('--yt-fill', pct + '%');
        }

        /* --------------------------------------------------------
           PLAYBACK CONTROLS
           -------------------------------------------------------- */
        function togglePlayPause() {
            if (!ytPlayer || !isPlayerReady) {
                pendingAutoplay = true;
                ensureYouTubeApi(function () {
                    if (!ytPlayer) createPlayer();
                });
                return;
            }
            var state = ytPlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                ytPlayer.pauseVideo();
            } else {
                ytPlayer.playVideo();
            }
        }

        function loadTrack(index, autoplay) {
            trackIndex = (index + tracks.length) % tracks.length;
            renderTrackMeta();
            renderQueue();
            seekBar.value = 0;
            seekBar.style.setProperty('--yt-fill', '0%');
            timeElapsed.textContent = '0:00';
            timeRemaining.textContent = '-0:00';
            setPlayIcons(false);

            if (ytPlayer && isPlayerReady) {
                if (autoplay) {
                    ytPlayer.loadVideoById(tracks[trackIndex].youtubeVideoId);
                } else {
                    ytPlayer.cueVideoById(tracks[trackIndex].youtubeVideoId);
                }
            } else {
                pendingAutoplay = !!autoplay;
                ensureYouTubeApi(function () {
                    if (!ytPlayer) createPlayer();
                });
            }
        }

        function nextTrack() { loadTrack(trackIndex + 1, true); }
        function prevTrack() { loadTrack(trackIndex - 1, true); }

        function seekRelative(delta) {
            if (!ytPlayer || !isPlayerReady) return;
            var cur = ytPlayer.getCurrentTime() || 0;
            var dur = ytPlayer.getDuration() || 0;
            var next = Math.min(Math.max(cur + delta, 0), dur);
            ytPlayer.seekTo(next, true);
            updateProgress();
        }

        /* --------------------------------------------------------
           WIRE UP CONTROLS
           -------------------------------------------------------- */
        playPauseBtn.addEventListener('click', togglePlayPause);
        miniPlayBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePlayPause(); });
        miniNextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextTrack(); });
        rewindBtn.addEventListener('click', function () { seekRelative(-10); });
        forwardBtn.addEventListener('click', function () { seekRelative(10); });

        // Volume — updates player + fill visual in real time
        volumeSlider.style.setProperty('--yt-fill', volumeSlider.value + '%');
        volumeSlider.addEventListener('input', function () {
            var v = parseInt(volumeSlider.value, 10);
            volumeSlider.style.setProperty('--yt-fill', v + '%');
            if (ytPlayer && isPlayerReady) ytPlayer.setVolume(v);
        });

        // Seek bar — drag to scrub, release to commit seekTo()
        seekBar.addEventListener('pointerdown', function () { isScrubbing = true; });
        seekBar.addEventListener('input', function () {
            var max = parseFloat(seekBar.max) || 100;
            var val = parseFloat(seekBar.value) || 0;
            var pct = max ? (val / max) * 100 : 0;
            seekBar.style.setProperty('--yt-fill', pct + '%');
            timeElapsed.textContent = fmtTime(val);
            var dur = (ytPlayer && isPlayerReady && ytPlayer.getDuration) ? ytPlayer.getDuration() : max;
            timeRemaining.textContent = '-' + fmtTime(Math.max(dur - val, 0));
        });
        seekBar.addEventListener('change', function () {
            if (ytPlayer && isPlayerReady) {
                ytPlayer.seekTo(parseFloat(seekBar.value), true);
            }
            isScrubbing = false;
        });

        // Favorite toggle (visual only)
        if (favBtn) {
            favBtn.addEventListener('click', function () {
                favBtn.classList.toggle('active');
                var icon = favBtn.querySelector('i');
                icon.className = favBtn.classList.contains('active') ? 'bx bxs-star' : 'bx bx-star';
            });
        }

        // Queue toggle
        if (queueBtn && queueList) {
            queueBtn.addEventListener('click', function () {
                queueList.hidden = !queueList.hidden;
            });
        }

        // Expand / collapse between mini and full player
        miniPlayer.addEventListener('click', function () {
            views.classList.add('expanded');
        });
        collapseBtn.addEventListener('click', function () {
            views.classList.remove('expanded');
        });

        /* --------------------------------------------------------
           DRAWER OPEN / CLOSE
           -------------------------------------------------------- */
        function openDrawer() {
            isOpen = true;
            drawer.classList.add('active');
            ensureYouTubeApi(function () {
                if (!ytPlayer) createPlayer();
            });
        }

        function closeDrawer() {
            isOpen = false;
            drawer.classList.remove('active');
            // Playback continues in the background when the drawer closes.
            // Uncomment to pause instead:
            // if (ytPlayer && isPlayerReady) ytPlayer.pauseVideo();
        }

        toggle.addEventListener('click', function () {
            if (isOpen) { closeDrawer(); } else { openDrawer(); }
        });

        closeBtn.addEventListener('click', closeDrawer);

        document.addEventListener('click', function (e) {
            if (isOpen && !drawer.contains(e.target) && !toggle.contains(e.target)) {
                closeDrawer();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) { closeDrawer(); }
        });

        // Expose a tiny hook for future playlist swaps without editing the widget internals.
        window.setVibesTracks = function (nextTracks) {
            if (!Array.isArray(nextTracks) || !nextTracks.length) return;
            tracks = nextTracks;
            loadTrack(0, false);
        };

        // Render initial meta so the mini player shows something before first open
        renderTrackMeta();
        renderQueue();
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
