/* ============================================================
   ASK ME — AI Chat Assistant Widget
   Intent detection + knowledge base + UI action triggers
   (c) 2026 Anamol Raj Singh
   ============================================================ */
(function () {
  'use strict';

  // ==========================================================
  // CONFIG
  // ==========================================================
  var CHAT_PROXY_URL = 'https://solas-6a809f2b.base44.app/functions/chatProxy';
  var LOG_VISIT_URL  = 'https://solene-copy-27be19bd.base44.app/functions/logVisit';
  var MODEL = 'openai/gpt-4o-mini';

  // ==========================================================
  // KNOWLEDGE BASE about Anamol
  // ==========================================================
  var KNOWLEDGE_BASE = [
    {
      keywords: ['who is anamol', 'about anamol', 'tell me about anamol', 'who are you', 'about you', 'about him', 'who is he'],
      response: "Anamol Raj Singh is a student and lifelong learner from Nepal. He's curious about technology, reading, current affairs, design, philosophy, and film — and he believes learning isn't a phase, it's a way of being. This site is his corner of the internet for sharing what he's exploring and building."
    },
    {
      keywords: ['interest', 'interests', 'what does anamol like', 'what does he like', 'hobby', 'hobbies', 'passion'],
      response: "Anamol is interested in six areas: Technology (how things work under the hood), Reading & Ideas (books and essays that challenge perspective), Current Affairs (geopolitics and forces shaping our future), Design (where aesthetics meets function), Philosophy (questioning assumptions and big questions), and Film & Media (cinema and visual storytelling)."
    },
    {
      keywords: ['technology', 'tech', 'programming', 'coding', 'developer', 'software', 'web dev', 'computer'],
      response: "Technology is one of Anamol's main interests. He explores how things work under the hood — from web development to systems thinking. He built this website himself."
    },
    {
      keywords: ['reading', 'books', 'reads', 'essays', 'long-form'],
      response: "Anamol loves reading — books, essays, and long-form articles that challenge his perspective and introduce new ways of thinking. He's drawn to writing that makes him see things differently."
    },
    {
      keywords: ['current affairs', 'politics', 'geopolitics', 'economics', 'news', 'world events'],
      response: "Anamol stays informed about the world — geopolitics, economics, and the conversations shaping our future. He thinks it's important to understand the forces driving change."
    },
    {
      keywords: ['design', 'aesthetics', 'ux', 'ui', 'visual'],
      response: "Anamol is drawn to the intersection of aesthetics and function — how thoughtful design shapes experiences and communicates ideas. This site is a reflection of that interest."
    },
    {
      keywords: ['philosophy', 'big questions', 'meaning', 'values', 'thinking deeply', 'existential'],
      response: "Philosophy is about questioning assumptions, examining values, and exploring the big questions that don't have easy answers. Anamol spends time here — it shapes how he approaches everything else."
    },
    {
      keywords: ['film', 'cinema', 'movies', 'documentary', 'documentaries', 'media', 'visual storytelling'],
      response: "Anamol enjoys cinema, documentaries, and visual storytelling — he's interested in how media reflects and shapes culture."
    },
    {
      keywords: ['contact', 'email', 'reach', 'get in touch', 'connect', 'social', 'social media', 'links'],
      response: "You can reach Anamol at hello@anamolrajsingh.com.np. He's also on GitHub, LinkedIn, Twitter (all @anamolrajsingh), and YouTube (@anamolrajsingh). Scroll to the Contact section for direct links."
    },
    {
      keywords: ['where is anamol from', 'where does anamol live', 'where is he from', 'nepal', 'country'],
      response: "Anamol is from Nepal — you can tell from the .com.np domain on his site."
    },
    {
      keywords: ['project', 'projects', 'what has anamol built', 'portfolio', 'work', 'what did he build', 'what has he built'],
      response: "This website is Anamol's current project — a personal space where he shares what he's exploring and building. He built it from scratch with a focus on clean design and minimal aesthetics."
    },
    {
      keywords: ['student', 'study', 'studying', 'school', 'university', 'college', 'education'],
      response: "Anamol is a student — but he's not racing toward a title or a job. He's here for the learning itself. Some days that means diving into a new programming concept; other days it's reading about history, debating ideas, or thinking deeply about how things connect."
    },
    {
      keywords: ['music', 'playlist', 'spotify', 'youtube music', 'songs', 'listen', 'listening', 'vibes', 'what music'],
      response: "Anamol has a Vibes widget in the header — click the pill button with the green dot. It has his Spotify and YouTube Music playlists."
    },
    {
      keywords: ['site', 'website', 'this site', 'this page', 'this website', 'what is this'],
      response: "This is Anamol Raj Singh's personal website — a space where he shares what he's exploring, what he's building, and what he's becoming. It has sections for About, Interests, an AI chat assistant, and Contact."
    },
    {
      keywords: ['hello', 'hi', 'hey', 'greetings', 'sup', 'yo', 'what\'s up', 'whats up', 'howdy'],
      response: "Hey! I'm the AI assistant on Anamol's site. You can ask me about his interests, navigate the site, toggle the theme, control the music, or just chat. What's on your mind?"
    },
    {
      keywords: ['thank', 'thanks', 'thank you', 'appreciate', 'cool', 'nice', 'awesome', 'great'],
      response: "Glad I could help! Feel free to ask anything else — about Anamol, the site, or try saying 'switch to light mode' or 'play some music'."
    },
    {
      keywords: ['bye', 'goodbye', 'see you', 'later', 'cya', 'farewell'],
      response: "Take care! Feel free to come back anytime. You can reach Anamol directly at hello@anamolrajsingh.com.np."
    }
  ];

  // ==========================================================
  // INTENT DETECTION — UI actions handled client-side
  // ==========================================================

  function matchIntent(text) {
    var t = text.toLowerCase().trim();

    // --- THEME ---
    if (/\b(light mode|switch to light|make it light|light theme|bright mode)\b/.test(t))
      return { action: 'theme', value: 'light' };
    if (/\b(dark mode|switch to dark|make it dark|dark theme)\b/.test(t))
      return { action: 'theme', value: 'dark' };
    if (/\b(toggle theme|switch theme|change theme|flip theme)\b/.test(t))
      return { action: 'theme', value: 'toggle' };

    // --- MUSIC ---
    if (/\b(play (the )?music|play (some )?music|play (a )?song|put on music|start (the )?music)\b/.test(t))
      return { action: 'music', value: 'play' };
    if (/\b(pause|stop (the )?music|pause (the )?music|stop playing)\b/.test(t))
      return { action: 'music', value: 'pause' };
    if (/\b(next|skip( this)?( song| track)?|next track|next song)\b/.test(t))
      return { action: 'music', value: 'next' };
    if (/\b(prev(ious)?|go back|last song|previous track|previous song)\b/.test(t))
      return { action: 'music', value: 'prev' };
    if (/\b(volume (up|higher|louder)|turn (it |the )?(up|louder)|increase volume)\b/.test(t))
      return { action: 'music', value: 'vol_up' };
    if (/\b(volume (down|lower|quieter)|turn (it |the )?(down|quieter)|decrease volume|lower (the )?volume)\b/.test(t))
      return { action: 'music', value: 'vol_down' };
    if (/\b(open (the )?(music|player|vibes)|show (the )?music|open vibes|show (the )?player)\b/.test(t))
      return { action: 'music', value: 'open' };

    // --- TIME ---
    if (/\b(what time|current time|what'?s the time|tell me the time|time (is it|now))\b/.test(t))
      return { action: 'time' };

    // --- LOCATION ---
    if (/\b(where am i|my location|do you know where i am|what'?s my location|where are you|what city am i in)\b/.test(t))
      return { action: 'location' };

    // --- NAVIGATION ---
    var navMatch = t.match(/\b(take me to|show me|go to|scroll to|navigate to|bring me to|jump to)\s+(.*)/);
    if (navMatch) return { action: 'navigate', value: navMatch[2].trim() };

    // Only match bare section names (very short, no question words)
    // Don't treat questions like "What are Anamol's interests?" as navigation
    var isQuestion = /^(what|who|where|when|why|how|tell|explain|describe|can you|do you|are you|is anamol|does anamol)\b/.test(t);
    if (!isQuestion) {
      if (/^about$/.test(t) || /^show (me )?about$/.test(t) || /^about section$/.test(t))
        return { action: 'navigate', value: 'about' };
      if (/^interests?$/.test(t) || /^show (me )?interests?$/.test(t) || /^interests? section$/.test(t))
        return { action: 'navigate', value: 'interests' };
      if (/^contact$/.test(t) || /^show (me )?contact$/.test(t) || /^contact section$/.test(t))
        return { action: 'navigate', value: 'contact' };
      if (/^(home|top|back to top)$/.test(t))
        return { action: 'navigate', value: 'hero' };
    }

    return null;
  }

  // ==========================================================
  // ACTION HANDLERS
  // ==========================================================

  function handleTheme(value) {
    var root = document.documentElement;
    if (value === 'toggle')
      value = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', value);
    try { localStorage.setItem('theme', value); } catch (e) {}
    var themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.className = value === 'dark' ? 'bx bx-moon text-lg' : 'bx bx-sun text-lg';
      themeIcon.style.transform = value === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)';
    }
    return 'Switched to ' + value + ' mode.';
  }

  function handleMusic(value) {
    var drawer = document.getElementById('vibesDrawer');
    var vibesToggle = document.getElementById('vibesToggle');

    function isDrawerOpen() {
      return drawer && !drawer.classList.contains('opacity-0');
    }
    function openDrawer() {
      if (vibesToggle && !isDrawerOpen()) vibesToggle.click();
    }

    switch (value) {
      case 'play':
        openDrawer();
        setTimeout(function () {
          var btn = document.getElementById('ytPlayPauseBtn') || document.getElementById('ytMiniPlayPause');
          if (btn) btn.click();
        }, 600);
        return 'Playing music — enjoy the vibes.';
      case 'pause':
        var pauseBtn = document.getElementById('ytPlayPauseBtn') || document.getElementById('ytMiniPlayPause');
        if (pauseBtn) pauseBtn.click();
        return 'Paused the music.';
      case 'next':
        openDrawer();
        setTimeout(function () {
          var btn = document.getElementById('ytNextBtn') || document.getElementById('ytMiniNext');
          if (btn) btn.click();
        }, 300);
        return 'Skipping to the next track.';
      case 'prev':
        openDrawer();
        setTimeout(function () {
          var btn = document.getElementById('ytPrevBtn') || document.getElementById('ytMiniPrev');
          if (btn) btn.click();
        }, 300);
        return 'Going back to the previous track.';
      case 'vol_up':
        var sUp = document.getElementById('ytVolumeSlider');
        if (sUp) {
          sUp.value = Math.min(100, parseInt(sUp.value, 10) + 15);
          sUp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return 'Turned the volume up.';
      case 'vol_down':
        var sDown = document.getElementById('ytVolumeSlider');
        if (sDown) {
          sDown.value = Math.max(0, parseInt(sDown.value, 10) - 15);
          sDown.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return 'Turned the volume down.';
      case 'open':
        openDrawer();
        return 'Opening the music player.';
    }
    return 'Something went wrong with the music control.';
  }

  function handleTime() {
    var now = new Date();
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your timezone';
    var timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz });
    var dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz });
    return 'Your local time is ' + timeStr + ' on ' + dateStr + ' (' + tz + ').';
  }

  function requestLocation(callback) {
    if (!navigator.geolocation) {
      callback("Geolocation isn't available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (position) {
        var lat = position.coords.latitude.toFixed(2);
        var lon = position.coords.longitude.toFixed(2);
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
              position.coords.latitude + '&lon=' + position.coords.longitude)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var parts = [];
            if (data.address) {
              if (data.address.city) parts.push(data.address.city);
              else if (data.address.town) parts.push(data.address.town);
              else if (data.address.village) parts.push(data.address.village);
              if (data.address.state) parts.push(data.address.state);
              if (data.address.country) parts.push(data.address.country);
            }
            if (parts.length > 0)
              callback("Based on your browser location, you're in " + parts.join(', ') + '.');
            else
              callback("I can see your coordinates (" + lat + ', ' + lon + ") but couldn't determine your city.");
          })
          .catch(function () {
            callback("You're at approximately " + lat + ', ' + lon + ' but I couldn\'t look up your city name.');
          });
      },
      function (err) {
        if (err.code === err.PERMISSION_DENIED)
          callback("Location permission denied — no worries, I won't guess. You can tell me where you are if you'd like.");
        else
          callback("I couldn't determine your location right now.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }

  function handleNavigate(target) {
    var t = (target || '').toLowerCase().trim();
    var sectionMap = {
      'about': 'about', 'who': 'about',
      'interests': 'interests', 'interest': 'interests', 'like': 'interests', 'enjoy': 'interests',
      'contact': 'contact', 'email': 'contact', 'reach': 'contact', 'connect': 'contact', 'touch': 'contact',
      'home': 'hero', 'top': 'hero', 'start': 'hero', 'hero': 'hero',
      'ask': 'ask', 'chat': 'ask',
      'music': 'vibes', 'player': 'vibes', 'vibes': 'vibes'
    };

    var sectionId = null;
    for (var key in sectionMap) {
      if (t.indexOf(key) !== -1) { sectionId = sectionMap[key]; break; }
    }

    if (!sectionId) {
      var sections = ['hero', 'about', 'interests', 'ask', 'contact'];
      for (var i = 0; i < sections.length; i++) {
        if (t.indexOf(sections[i]) !== -1) { sectionId = sections[i]; break; }
      }
    }

    if (sectionId === 'vibes') {
      var vt = document.getElementById('vibesToggle');
      if (vt) vt.click();
      return 'Opening the music player for you.';
    }

    if (!sectionId)
      return "I couldn't figure out which section you mean. Try 'about', 'interests', 'contact', or 'home'.";

    var el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return 'Taking you to the ' + sectionId + ' section.';
    }
    return "I couldn't find that section. Try 'about', 'interests', 'contact', or 'home'.";
  }

  // ==========================================================
  // KNOWLEDGE BASE MATCHING
  // ==========================================================

  function matchKnowledgeBase(text) {
    var t = text.toLowerCase().trim();
    var bestMatch = null;
    var bestScore = 0;
    for (var i = 0; i < KNOWLEDGE_BASE.length; i++) {
      var entry = KNOWLEDGE_BASE[i];
      for (var j = 0; j < entry.keywords.length; j++) {
        var kw = entry.keywords[j].toLowerCase();
        if (t.indexOf(kw) !== -1) {
          var score = kw.length;
          if (score > bestScore) { bestScore = score; bestMatch = entry.response; }
        }
      }
    }
    return bestMatch;
  }

  // ==========================================================
  // AI PROXY FALLBACK
  // ==========================================================

  var SYSTEM_PROMPT =
    "You are the AI assistant on Anamol Raj Singh's personal website (anamolrajsingh.com.np). " +
    "Anamol is a student and lifelong learner from Nepal interested in technology, reading, current affairs, " +
    "design, philosophy, and film. Answer questions about Anamol based on what you know from the site. " +
    "Keep responses short and conversational — 1-3 sentences. Never use Markdown formatting. " +
    "If you don't know something about Anamol specifically, say so honestly. " +
    "You can also discuss general topics in Anamol's interest areas (tech, philosophy, design, books, film).";

  var conversation = [];
  var proxyAvailable = true;

  function tryAIProxy(text, callback) {
    if (!proxyAvailable) { callback(null); return; }
    var messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(conversation);
    messages.push({ role: 'user', content: text });

    var controller;
    try { controller = new AbortController(); } catch (e) { controller = null; }
    var timeout;
    if (controller) { timeout = setTimeout(function () { controller.abort(); }, 8000); }

    fetch(CHAT_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: messages }),
      signal: controller ? controller.signal : undefined
    })
    .then(function (resp) { return resp.json(); })
    .then(function (data) {
      if (timeout) clearTimeout(timeout);
      if (data.error) { proxyAvailable = false; callback(null); return; }
      var reply = data.reply || data.response || data.message || null;
      if (reply && typeof reply === 'string') {
        conversation.push({ role: 'user', content: text });
        conversation.push({ role: 'assistant', content: reply });
        callback(reply);
      } else { proxyAvailable = false; callback(null); }
    })
    .catch(function () {
      if (timeout) clearTimeout(timeout);
      proxyAvailable = false;
      callback(null);
    });
  }

  // ==========================================================
  // MAIN RESPONSE PROCESSOR
  // ==========================================================

  function processMessage(text, callback) {
    // 1. Check for UI action intents
    var intent = matchIntent(text);
    if (intent) {
      switch (intent.action) {
        case 'theme':    callback(handleTheme(intent.value)); return;
        case 'music':    callback(handleMusic(intent.value)); return;
        case 'time':     callback(handleTime()); return;
        case 'location': requestLocation(callback); return;
        case 'navigate': callback(handleNavigate(intent.value)); return;
      }
    }

    // 2. Check knowledge base
    var kbResponse = matchKnowledgeBase(text);
    if (kbResponse) { callback(kbResponse); return; }

    // 3. Try AI proxy for general questions
    tryAIProxy(text, function (aiReply) {
      if (aiReply) { callback(aiReply); }
      else {
        callback("I'm not sure about that one. I can tell you about Anamol's interests, help you navigate the site, toggle the theme, or control the music. Try asking 'What are Anamol's interests?' or say 'play some music'.");
      }
    });
  }

  // ==========================================================
  // FLOATING CHAT WIDGET UI
  // ==========================================================

  function initChatWidget() {
    if (document.getElementById('askmeFloatBtn')) return;

    var floatBtn = document.createElement('button');
    floatBtn.id = 'askmeFloatBtn';
    floatBtn.className = 'askme-float-btn';
    floatBtn.setAttribute('aria-label', 'Open AI chat assistant');
    floatBtn.innerHTML = '<i class="bx bx-message-dots"></i><span class="askme-float-pulse"></span>';

    var panel = document.createElement('div');
    panel.id = 'askmePanel';
    panel.className = 'askme-panel';
    panel.innerHTML = [
      '<div class="askme-panel-header">',
      '  <div class="askme-panel-title">',
      '    <span class="status-dot"></span>',
      '    <span class="font-mono text-xs" style="color:var(--lime);text-transform:uppercase;letter-spacing:0.05em">Ask Me</span>',
      '  </div>',
      '  <button id="askmeClose" class="askme-close-btn" aria-label="Close chat">',
      '    <i class="bx bx-x"></i>',
      '  </button>',
      '</div>',
      '<div id="askmeMessages" class="askme-messages">',
      '  <div class="chat-bubble chat-bubble-ai">',
      '    <p>Hey! I\'m Anamol\'s AI assistant. Ask me about his interests, say "play some music", "switch to light mode", or "take me to contact". What\'s up?</p>',
      '  </div>',
      '</div>',
      '<div id="askmeTyping" class="chat-typing" hidden>',
      '  <div class="chat-bubble chat-bubble-ai">',
      '    <div class="chat-dots"><span></span><span></span><span></span></div>',
      '  </div>',
      '</div>',
      '<div class="askme-input-row">',
      '  <input type="text" id="askmeInput" class="chat-input" placeholder="Type your message..." autocomplete="off" maxlength="500">',
      '  <button id="askmeSend" class="chat-send-btn" aria-label="Send message"><i class="bx bx-send"></i></button>',
      '</div>'
    ].join('');

    document.body.appendChild(floatBtn);
    document.body.appendChild(panel);

    var messages = document.getElementById('askmeMessages');
    var input = document.getElementById('askmeInput');
    var sendBtn = document.getElementById('askmeSend');
    var typing = document.getElementById('askmeTyping');
    var closeBtn = document.getElementById('askmeClose');
    var isOpen = false;
    var isProcessing = false;

    function scrollToBottom() { messages.scrollTop = messages.scrollHeight; }

    function addBubble(text, cls) {
      var div = document.createElement('div');
      div.className = 'chat-bubble ' + cls;
      var p = document.createElement('p');
      p.textContent = text;
      div.appendChild(p);
      messages.appendChild(div);
      scrollToBottom();
      return div;
    }

    function setLoading(on) {
      isProcessing = on;
      sendBtn.disabled = on;
      input.disabled = on;
      typing.hidden = !on;
      if (on) scrollToBottom();
      if (!on) { input.disabled = false; input.focus(); }
    }

    function openPanel() {
      isOpen = true;
      panel.classList.add('open');
      floatBtn.classList.add('hidden');
      setTimeout(function () { input.focus(); }, 300);
    }

    function closePanel() {
      isOpen = false;
      panel.classList.remove('open');
      floatBtn.classList.remove('hidden');
    }

    function send() {
      var text = input.value.trim();
      if (!text || isProcessing) return;
      input.value = '';
      addBubble(text, 'chat-bubble-user');
      setLoading(true);
      var wasIntent = !!matchIntent(text);

      processMessage(text, function (reply) {
        var delay = wasIntent ? 200 : 400;
        setTimeout(function () {
          setLoading(false);
          addBubble(reply, 'chat-bubble-ai');
        }, delay);
      });
    }

    floatBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closePanel();
    });

    var askmeCTA = document.getElementById('askmeCTA');
    if (askmeCTA) {
      askmeCTA.addEventListener('click', function (e) {
        e.preventDefault();
        openPanel();
      });
    }
  }

  // ==========================================================
  // VISITOR TRACKING
  // ==========================================================

  function trackVisitor() {
    try {
      fetch(LOG_VISIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: window.location.pathname })
      }).catch(function () {});
    } catch (e) {}
  }

  // ==========================================================
  // INIT
  // ==========================================================

  function init() {
    initChatWidget();
    trackVisitor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
