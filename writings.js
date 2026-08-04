/* ================================================================
   writings.js — Blog rendering logic
   Handles: post list, tag filtering, single post view,
   markdown parsing, reading time, routing via URL hash
   ================================================================ */

(function () {
    'use strict';

    // ============================================================
    // MARKDOWN PARSER (lightweight, no dependencies)
    // Supports: ## h2, ### h3, **bold**, *italic*, `inline code`,
    // ```code blocks```, [links](url), > blockquotes, - lists, paragraphs
    // ============================================================
    function parseMarkdown(md) {
        // Escape HTML first for safety
        let html = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Code blocks (```...```)
        html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
            return '<pre><code>' + code.trim() + '</code></pre>';
        });

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, function (m, code) {
            return '<code>' + code + '</code>';
        });

        // Split into lines for block-level parsing
        const lines = html.split('\n');
        let result = '';
        let inList = false;
        let inQuote = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Close list if line doesn't start with -
            if (inList && !line.match(/^\s*-\s/)) {
                result += '</ul>\n';
                inList = false;
            }

            // Close quote if line doesn't start with >
            if (inQuote && !line.match(/^\s*>\s/)) {
                result += '</blockquote>\n';
                inQuote = false;
            }

            // Headings
            if (line.startsWith('## ')) {
                result += '<h2>' + line.slice(3) + '</h2>\n';
            } else if (line.startsWith('### ')) {
                result += '<h3>' + line.slice(4) + '</h3>\n';
            }
            // Blockquote
            else if (line.match(/^\s*>\s(.*)/)) {
                if (!inQuote) {
                    result += '<blockquote>\n';
                    inQuote = true;
                }
                result += line.replace(/^\s*>\s/, '') + '\n';
            }
            // List item
            else if (line.match(/^\s*-\s(.*)/)) {
                if (!inList) {
                    result += '<ul>\n';
                    inList = true;
                }
                result += '<li>' + line.replace(/^\s*-\s/, '') + '</li>\n';
            }
            // Empty line = paragraph break
            else if (line.trim() === '') {
                // Just a spacing line, ignore
            }
            // Regular paragraph
            else {
                result += '<p>' + line + '</p>\n';
            }
        }

        // Close any open blocks
        if (inList) result += '</ul>\n';
        if (inQuote) result += '</blockquote>\n';

        // Now apply inline formatting (bold, italic, links)
        // Bold **text**
        result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Italic *text* (but not inside tags)
        result = result.replace(/(?<![<a-zA-Z])\*([^*]+)\*(?![a-zA-Z])/g, '<em>$1</em>');
        // Links [text](url)
        result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, text, url) {
            return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>';
        });

        return result;
    }

    // ============================================================
    // READING TIME ESTIMATE
    // ============================================================
    function readingTime(text) {
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(words / 220));
        return minutes + ' min read';
    }

    // ============================================================
    // DATE FORMATTER
    // ============================================================
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    // ============================================================
    // TAG COLORS (matching interests section icons)
    // ============================================================
    const TAG_ICONS = {
        'Technology': 'bx-code-alt',
        'Reading & Ideas': 'bx-book-open',
        'Current Affairs': 'bx-planet',
        'Design': 'bx-palette',
        'Philosophy': 'bx-brain',
        'Film & Media': 'bx-movie-play'
    };

    // ============================================================
    // POST LIST RENDERING
    // ============================================================
    function renderTagFilters(activeTag) {
        const container = document.getElementById('tagFilters');
        if (!container) return;

        const tags = ['All', ...Object.keys(TAG_ICONS)];
        let html = '';

        tags.forEach(function (tag) {
            const isActive = (activeTag === tag) || (!activeTag && tag === 'All');
            const classes = isActive
                ? 'tag-filter tag-filter-active'
                : 'tag-filter';
            html += '<button class="' + classes + '" data-tag="' + tag + '">' + tag + '</button>';
        });

        container.innerHTML = html;

        // Attach click handlers
        container.querySelectorAll('.tag-filter').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const tag = this.getAttribute('data-tag');
                renderPostList(tag);
                renderTagFilters(tag);
            });
        });
    }

    function renderPostList(filterTag) {
        const container = document.getElementById('postsContainer');
        if (!container || typeof POSTS === 'undefined') return;

        // Sort newest first
        let posts = POSTS.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        // Filter by tag
        if (filterTag && filterTag !== 'All') {
            posts = posts.filter(function (p) {
                return p.tag === filterTag;
            });
        }

        if (posts.length === 0) {
            container.innerHTML = '<p class="font-mono text-sm nav-dim-text text-center py-12">No writings in this category yet.</p>';
            return;
        }

        let html = '';
        posts.forEach(function (post, idx) {
            const icon = TAG_ICONS[post.tag] || 'bx-note';
            html += '' +
                '<div class="reveal post-item" style="transition-delay:' + (idx * 60) + 'ms">' +
                    '<a href="#post/' + post.slug + '" class="post-link block py-7 group">' +
                        '<div class="flex items-center gap-2 mb-3">' +
                            '<span class="post-tag-badge"><i class="bx ' + icon + ' text-xs"></i> ' + post.tag + '</span>' +
                            '<span class="font-mono text-xs nav-dim-text">·</span>' +
                            '<span class="font-mono text-xs nav-dim-text">' + formatDate(post.date) + '</span>' +
                            '<span class="font-mono text-xs nav-dim-text">·</span>' +
                            '<span class="font-mono text-xs nav-dim-text">' + readingTime(post.content) + '</span>' +
                        '</div>' +
                        '<h2 class="font-display text-xl sm:text-2xl font-bold tracking-tight mb-2 transition-colors group-hover:text-lime-accent">' +
                            post.title +
                        '</h2>' +
                        '<p class="text-sm sm:text-base leading-relaxed about-text">' +
                            post.excerpt +
                        '</p>' +
                    '</a>' +
                '</div>';
        });

        container.innerHTML = html;

        // Re-run scroll reveal on new elements
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

            container.querySelectorAll('.reveal').forEach(function (el) {
                revealObserver.observe(el);
            });
        } else {
            container.querySelectorAll('.reveal').forEach(function (el) {
                el.classList.add('visible');
            });
        }

        // Attach click handlers for post links
        container.querySelectorAll('.post-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const hash = this.getAttribute('href');
                window.location.hash = hash;
            });
        });
    }

    // ============================================================
    // SINGLE POST RENDERING
    // ============================================================
    function renderSinglePost(slug) {
        if (typeof POSTS === 'undefined') return;

        const post = POSTS.find(function (p) { return p.slug === slug; });
        if (!post) {
            // Post not found — show list
            showListView();
            return;
        }

        // Hide list, show post
        document.getElementById('postList').classList.add('hidden');
        document.getElementById('postView').classList.remove('hidden');

        // Fill in meta
        const icon = TAG_ICONS[post.tag] || 'bx-note';
        const meta = document.getElementById('postMeta');
        meta.innerHTML = '' +
            '<div class="flex items-center gap-2">' +
                '<span class="post-tag-badge"><i class="bx ' + icon + ' text-xs"></i> ' + post.tag + '</span>' +
                '<span class="font-mono text-xs nav-dim-text">·</span>' +
                '<span class="font-mono text-xs nav-dim-text">' + formatDate(post.date) + '</span>' +
                '<span class="font-mono text-xs nav-dim-text">·</span>' +
                '<span class="font-mono text-xs nav-dim-text">' + readingTime(post.content) + '</span>' +
            '</div>';

        // Title
        document.getElementById('postTitle').textContent = post.title;

        // Content (parse markdown)
        document.getElementById('postContent').innerHTML = parseMarkdown(post.content);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function showListView() {
        document.getElementById('postView').classList.add('hidden');
        document.getElementById('postList').classList.remove('hidden');
    }

    // ============================================================
    // ROUTING (hash-based)
    // ============================================================
    function handleRoute() {
        const hash = window.location.hash;

        if (hash.startsWith('#post/')) {
            const slug = hash.replace('#post/', '');
            renderSinglePost(slug);
        } else {
            showListView();
        }
    }

    // Back links
    function setupBackLinks() {
        const back1 = document.getElementById('backToPosts');
        const back2 = document.getElementById('backToPostsBottom');
        [back1, back2].forEach(function (link) {
            if (link) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.location.hash = '';
                    showListView();
                });
            }
        });
    }

    // ============================================================
    // INIT
    // ============================================================
    // Only run blog logic on the writings page
    if (document.getElementById('postsContainer')) {
        renderTagFilters(null);
        renderPostList(null);
        setupBackLinks();
        handleRoute();
        window.addEventListener('hashchange', handleRoute);
    }

    // ============================================================
    // MAIN PAGE — Writings section preview
    // (renders latest 3 posts on index.html)
    // ============================================================
    const writingsPreview = document.getElementById('writingsPreview');
    if (writingsPreview && typeof POSTS !== 'undefined') {
        let posts = POSTS.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        }).slice(0, 3);

        let html = '';
        posts.forEach(function (post, idx) {
            const icon = TAG_ICONS[post.tag] || 'bx-note';
            html += '' +
                '<a href="writings.html#post/' + post.slug + '" class="reveal writings-preview-item block py-7 group" style="transition-delay:' + (idx * 80) + 'ms">' +
                    '<div class="flex items-center gap-2 mb-2.5">' +
                        '<span class="post-tag-badge"><i class="bx ' + icon + ' text-xs"></i> ' + post.tag + '</span>' +
                        '<span class="font-mono text-xs nav-dim-text">·</span>' +
                        '<span class="font-mono text-xs nav-dim-text">' + formatDate(post.date) + '</span>' +
                    '</div>' +
                    '<h3 class="font-display text-lg sm:text-xl font-bold tracking-tight mb-1.5 transition-colors group-hover:text-lime-accent">' +
                        post.title +
                    '</h3>' +
                    '<p class="text-sm leading-relaxed about-text line-clamp-2">' +
                        post.excerpt +
                    '</p>' +
                '</a>';
        });

        writingsPreview.innerHTML = html;

        // Reveal observer for preview items
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

            writingsPreview.querySelectorAll('.reveal').forEach(function (el) {
                observer.observe(el);
            });
        } else {
            writingsPreview.querySelectorAll('.reveal').forEach(function (el) {
                el.classList.add('visible');
            });
        }
    }

})();
