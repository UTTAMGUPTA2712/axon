// A small TTL cache for the page, so something fetched once is not fetched again on
// every visit.
//
// The same shape as the server's CacheService, deliberately: get / set / wrap, one
// expiry per key, and a read that trusts the stored timestamp rather than a timer. The
// difference is where it lives — localStorage, so the value survives a reload and a
// second visit, which is the whole point on a page a reader opens, leaves and comes
// back to.
//
// Three things it has to get right, because all three have broken pages before:
//
//   1. **Storage can throw.** Not just be empty — Safari's private mode throws on
//      `setItem`, and a blocked-cookies setting throws on read. Every access is
//      wrapped, and a failure falls back to an in-memory Map so the page works
//      identically, just without persistence.
//   2. **A failed refresh must not blank the page.** An expired entry is kept until
//      something replaces it: if the network is down, serving a price from an hour ago
//      beats serving nothing. `maxStaleMs` bounds how far that goes.
//   3. **A format change must not poison old entries.** Keys carry a version, so
//      changing what is stored under one orphans the old value rather than reading it
//      as the new shape.

window.AxonCache = (function () {
    'use strict';

    var PREFIX = 'axon.cache.v1.';

    // Used when localStorage is unavailable or throws. The page then behaves the same
    // within one pageview and simply re-fetches on the next.
    var memory = {};

    function storage() {
        try {
            var probe = PREFIX + 'probe';
            window.localStorage.setItem(probe, '1');
            window.localStorage.removeItem(probe);
            return window.localStorage;
        } catch (e) {
            return null;
        }
    }

    var store = storage();

    function readRaw(key) {
        if (!store) return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
        try {
            return store.getItem(PREFIX + key);
        } catch (e) {
            return null;
        }
    }

    function writeRaw(key, text) {
        if (!store) {
            memory[key] = text;
            return;
        }
        try {
            store.setItem(PREFIX + key, text);
        } catch (e) {
            // Out of quota, or storage turned off between the probe and now. The value
            // is still worth keeping for this pageview.
            memory[key] = text;
        }
    }

    function removeRaw(key) {
        delete memory[key];
        if (!store) return;
        try {
            store.removeItem(PREFIX + key);
        } catch (e) {
            /* nothing to do: the entry is unreachable either way */
        }
    }

    // { value, expiresAt, storedAt } or null. A malformed entry is treated as absent
    // and cleared, so one bad write cannot wedge a key forever.
    function entry(key) {
        var text = readRaw(key);
        if (!text) return null;

        var parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            removeRaw(key);
            return null;
        }

        if (!parsed || typeof parsed.e !== 'number') {
            removeRaw(key);
            return null;
        }
        return { value: parsed.v, expiresAt: parsed.e, storedAt: parsed.s || parsed.e };
    }

    function set(key, value, ttlMs) {
        var now = Date.now();
        writeRaw(key, JSON.stringify({ v: value, e: now + ttlMs, s: now }));
        return value;
    }

    /** The value if it is still fresh, otherwise undefined. */
    function get(key) {
        var found = entry(key);
        if (!found) return undefined;
        if (found.expiresAt <= Date.now()) return undefined;
        return found.value;
    }

    /** The value even if expired, with how old it is. For a failed refresh. */
    function getStale(key) {
        var found = entry(key);
        if (!found) return null;
        return { value: found.value, ageMs: Date.now() - found.storedAt };
    }

    function forget(key) {
        removeRaw(key);
    }

    /**
     * Read through: the cached value, or `load()`'s result cached for `ttlMs`.
     *
     * `load` returns a promise. When it rejects and a stale entry is on hand, the stale
     * value is resolved instead — unless it is older than `maxStaleMs`, which defaults
     * to a day. A rejection with nothing cached propagates, so the caller can leave its
     * static markup alone.
     */
    function wrap(key, ttlMs, load, options) {
        var opts = options || {};
        var maxStale = typeof opts.maxStaleMs === 'number' ? opts.maxStaleMs : 86400000;

        var fresh = get(key);
        if (fresh !== undefined) return Promise.resolve(fresh);

        return load().then(
            function (value) {
                return set(key, value, ttlMs);
            },
            function (error) {
                var stale = getStale(key);
                if (stale && stale.ageMs <= maxStale) return stale.value;
                throw error;
            }
        );
    }

    /** Every key this module owns. Used by nothing on the page; handy in a console. */
    function clear() {
        memory = {};
        if (!store) return;
        try {
            for (var i = store.length - 1; i >= 0; i--) {
                var key = store.key(i);
                if (key && key.indexOf(PREFIX) === 0) store.removeItem(key);
            }
        } catch (e) {
            /* nothing to do */
        }
    }

    return {
        get: get,
        getStale: getStale,
        set: set,
        wrap: wrap,
        forget: forget,
        clear: clear,
        /** False when values last only for this pageview, which is worth knowing in a console. */
        persistent: Boolean(store)
    };
})();
