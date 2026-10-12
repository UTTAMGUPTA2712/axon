// The page is the demo: the docked panel answers a question about whichever chapter the
// reader is currently in, and the sentence it drew that answer from is marked in the
// document. That link between the two columns is the only piece of motion on the page,
// because it is the only one that carries information.
//
// Everything here is an enhancement. The document is fully readable, and the panel shows
// its first exchange, before this file runs or if it never does.

(function () {
    'use strict';

    // One exchange per chapter. The answers describe the chapter beside them, so the
    // panel is always demonstrably reading the page rather than replaying a script.
    var TRANSCRIPT = {
        intro: {
            q: 'What is this page about?',
            a: '<p>It introduces <b>Axon</b>, a Chrome extension that reads the page you have open and answers questions about it.</p>' +
               '<p>The page says it can summarize long pages, describe what is on screen, and fill forms from details you have saved.</p>' +
               '<div class="meta">read 412 words · chat · llama-3.3-70b</div>'
        },
        does: {
            q: 'What are the three things it does?',
            a: '<p>Reading the current page, filling forms, and remembering details you tell it.</p>' +
               '<p>On forms it matches by meaning rather than by field name, so a field labelled <span class="chip">Mobile number</span> is filled from a fact saved as <span class="chip">Phone</span>.</p>' +
               '<div class="meta">read this section · chat · llama-3.3-70b</div>'
        },
        keys: {
            q: 'Where does my API key actually go?',
            a: '<p>Into <span class="chip">chrome.storage.sync</span> in your own browser, and from there only to the provider you configured.</p>' +
               '<p>This section states there is no Axon server in the request path, and no analytics or third-party scripts.</p>' +
               '<div class="meta">read this section · chat · llama-3.3-70b</div>'
        },
        setup: {
            q: 'How long does setup take?',
            a: '<p>About a minute: install, paste a key, optionally pick models.</p>' +
               '<p>Gemini is suggested first because it has a free tier. If you would rather nothing left your machine, the custom provider points at Ollama or LM Studio.</p>' +
               '<div class="meta">read this section · chat · llama-3.3-70b</div>'
        },
        questions: {
            q: 'Does it track my browsing?',
            a: '<p>No. By this page\'s account Axon reads a page only when you invoke it, and asks for no browsing-history permission.</p>' +
               '<p>Chrome grants it access to a page for that visit only, and takes the access back when you navigate.</p>' +
               '<div class="meta">read 4 answers · chat · llama-3.3-70b</div>'
        }
    };

    var turn = document.getElementById('turn');
    var turnQ = document.getElementById('turn-q');
    var turnA = document.getElementById('turn-a');
    var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter[data-turn]'));
    if (!turn || !turnQ || !turnA || !chapters.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = null;

    function paint(key) {
        var entry = TRANSCRIPT[key];
        if (!entry) return;
        turnQ.textContent = entry.q;
        turnA.innerHTML = entry.a;
    }

    function show(key) {
        if (key === current) return;
        current = key;

        chapters.forEach(function (chapter) {
            chapter.classList.toggle('is-current', chapter.dataset.turn === key);
        });

        if (reduced) {
            paint(key);
            return;
        }

        // Crossfade, so the two columns visibly belong to one another.
        turn.classList.add('is-swapping');
        window.setTimeout(function () {
            paint(key);
            turn.classList.remove('is-swapping');
        }, 180);
    }

    // First exchange is painted immediately: the panel is never empty.
    paint('intro');
    chapters[0].classList.add('is-current');
    current = 'intro';

    // Which chapter is the reader on? The last one whose start has crossed a reading
    // line a little above the middle of the viewport.
    //
    // This reads live geometry on each frame rather than trusting an
    // IntersectionObserver entry's boundingClientRect, which is a snapshot taken when
    // the observation fired and is stale by the time it is compared. Doing that let the
    // very tall opening chapter — still intersecting, with an ever more negative top —
    // win every comparison, so the panel never moved off its first answer.
    function pick() {
        var line = window.innerHeight * 0.38;
        var active = chapters[0];

        for (var i = 0; i < chapters.length; i++) {
            if (chapters[i].getBoundingClientRect().top <= line) active = chapters[i];
        }

        show(active.dataset.turn);
    }

    var queued = false;

    function onScroll() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
            queued = false;
            pick();
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    pick();
})();

// ─── Masthead ────────────────────────────────────────────────────────────────
// Reachable without being in the way: present at the top of the page, tucked away only
// while the reader is moving down the document, and back the moment they move up, point
// at the top edge, or tab into it. Without JS it is simply always visible, because the
// tucking is driven entirely by a class this adds.
(function () {
    'use strict';

    var masthead = document.querySelector('.masthead');
    if (!masthead) return;

    // Publish the real height so the docked panel and anchor targets clear it.
    function measure() {
        document.documentElement.style.setProperty('--masthead-h', masthead.offsetHeight + 'px');
    }

    measure();
    window.addEventListener('resize', measure, { passive: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Below this the masthead always shows: at the top of a document there is nothing
    // to get out of the way of.
    var SETTLE = 140;
    // Ignore the small jitter a trackpad produces while reading.
    var JITTER = 6;
    // How close the pointer has to come to the top edge to call it back.
    var REVEAL_BAND = 80;

    var lastY = window.scrollY;
    var queued = false;

    function tuck(on) {
        masthead.classList.toggle('is-tucked', on);
    }

    function update() {
        var y = window.scrollY;
        var delta = y - lastY;

        if (Math.abs(delta) < JITTER) return;
        lastY = y;

        if (y <= SETTLE) {
            tuck(false);
            return;
        }

        tuck(delta > 0);
    }

    window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
            queued = false;
            update();
        });
    }, { passive: true });

    // "Hover up": reaching for the top of the window brings it back.
    window.addEventListener('mousemove', function (event) {
        if (event.clientY <= REVEAL_BAND) tuck(false);
    }, { passive: true });

    // Keyboard users reach it by tabbing, which must also reveal it.
    masthead.addEventListener('focusin', function () {
        tuck(false);
    });
})();
