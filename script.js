/* Vibes player — YouTube playlist */
(function () {
    'use strict';

    var PLAYLIST_ID = 'PLNyNAs0WPlfU';
    var player = null;
    var apiReady = false;
    var apiLoading = false;
    var pendingOpen = false;

    var drawer = document.getElementById('vibesDrawer');
    var toggle = document.getElementById('vibesToggle');
    var close = document.getElementById('vibesClose');
    var host = document.getElementById('ytPlayerHost');
    var thumb = document.getElementById('ytExpandedThumb');
    var miniThumb = document.getElementById('ytMiniThumb');
    var title = document.getElementById('ytExpandedTitle');
    var artist = document.getElementById('ytExpandedArtist');
    var miniTitle = document.getElementById('ytMiniTitle');
    var miniArtist = document.getElementById('ytMiniArtist');
    var playBtn = document.getElementById('ytPlayPauseBtn');
    var miniPlayBtn = document.getElementById('ytMiniPlayPause');
    var playIcon = document.getElementById('ytPlayIcon');
    var miniPlayIcon = document.getElementById('ytMiniPlayIcon');
    var nextBtn = document.getElementById('ytMiniNext');
    var seek = document.getElementById('ytSeekBar');
    var elapsed = document.getElementById('ytTimeElapsed');
    var remaining = document.getElementById('ytTimeRemaining');
    var volume = document.getElementById('ytVolumeSlider');
    var rewind = document.getElementById('ytRewindBtn');
    var forward = document.getElementById('ytForwardBtn');

    function setText(el, text) { if (el) el.textContent = text || '—'; }
    function time(s) {
        s = Math.max(0, Math.floor(Number(s) || 0));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function setPlaying(playing) {
        if (playIcon) playIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
        if (miniPlayIcon) miniPlayIcon.className = playing ? 'bx bx-pause' : 'bx bx-play';
    }
    function setMeta(data) {
        if (!data || !data.video_id) return;
        var id = data.video_id;
        var t = data.title || 'Now Playing';
        var a = data.author || 'YouTube';
        var image = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
        [thumb, miniThumb].forEach(function (img) {
            if (img) { img.src = image; img.alt = t; }
        });
        setText(title, t);
        setText(miniTitle, t);
        setText(artist, a + ' — YouTube');
        setText(miniArtist, a);
    }
    function loadMeta() {
        if (player && player.getVideoData) setMeta(player.getVideoData());
    }
    function updateProgress() {
        if (!player || !player.getDuration) return;
        var d = player.getDuration() || 0;
        var c = player.getCurrentTime() || 0;
        if (seek && d) seek.value = (c / d) * 100;
        setText(elapsed, time(c));
        setText(remaining, '-' + time(Math.max(0, d - c)));
    }
    function createPlayer() {
        if (player || !window.YT || !YT.Player || !host) return;
        player = new YT.Player(host, {
            width: '200',
            height: '200',
            playerVars: {
                listType: 'playlist',
                list: PLAYLIST_ID,
                autoplay: 0,
                controls: 0,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
                origin: window.location.origin
            },
            events: {
                onReady: function () {
                    apiReady = true;
                    if (volume) player.setVolume(Number(volume.value) || 70);
                    player.cuePlaylist({ listType: 'playlist', list: PLAYLIST_ID, index: 0 });
                    setTimeout(loadMeta, 1000);
                    if (pendingOpen) { pendingOpen = false; player.playVideo(); }
                },
                onStateChange: function (e) {
                    if (e.data === YT.PlayerState.CUED || e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.PAUSED) loadMeta();
                    setPlaying(e.data === YT.PlayerState.PLAYING);
                    updateProgress();
                },
                onError: function () {
                    setText(title, 'Unable to play this video');
                    setText(artist, 'YouTube');
                }
            }
        });
    }
    function loadApi() {
        if (apiReady && window.YT && YT.Player) return createPlayer();
        if (apiLoading) return;
        apiLoading = true;
        var old = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof old === 'function') old();
            apiReady = true;
            createPlayer();
        };
        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
    }
    function openPlayer() {
        if (!drawer) return;
        drawer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
        pendingOpen = true;
        loadApi();
        if (player && player.playVideo) player.playVideo();
    }
    function closePlayer() {
        if (!drawer) return;
        drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
    }

    if (toggle) toggle.addEventListener('click', openPlayer);
    if (close) close.addEventListener('click', closePlayer);
    if (playBtn) playBtn.addEventListener('click', function () { if (player) player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo(); });
    if (miniPlayBtn) miniPlayBtn.addEventListener('click', function () { if (player) player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (player) player.nextVideo(); });
    if (rewind) rewind.addEventListener('click', function () { if (player) player.seekTo(Math.max(0, player.getCurrentTime() - 10), true); });
    if (forward) forward.addEventListener('click', function () { if (player) player.seekTo(player.getCurrentTime() + 10, true); });
    if (volume) volume.addEventListener('input', function () { if (player) player.setVolume(Number(volume.value)); });
    if (seek) seek.addEventListener('input', function () { if (player && player.getDuration()) player.seekTo((Number(seek.value) / 100) * player.getDuration(), true); });

    setInterval(updateProgress, 500);
})();
