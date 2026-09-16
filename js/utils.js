// ============================================================
// myBag — Утилиты, storage, состояние, шина window.byBag
// Файл: js/utils.js
// Версия: 2.0.5
// ============================================================

// ============ СОСТОЯНИЕ ============
var customTypes = {};
var customTripTypes = {};
var customCategories = {};
var activeTrips = [], history = [];
var currentTripIndex = 0, selectedType = null, selectedListIds = [];
var profile = { name: 'Эрик', avatar: null };
var settings = { dark: false, notif: true, vibrate: true, hideDone: false };
var achievementsState = {}, viewedTips = {}, viewedWhatsNew = false;
var wiz = { name: '', emoji: '👕', colorIdx: 0, items: [] };
var twiz = { name: '', emoji: '🏖️', colorIdx: 0, items: [] };
var editing = { id: null, name: '', emoji: '👕', colorIdx: 0, items: [] };
var advTarget = 'wizard';
var searchQuery = '', weatherCache = {}, searchDebounceTimer = null, currentOnbSlide = 0;
var currentTipIdx = 0, pendingCategoryTarget = null, categoryParent = null;
var tipsMode = 'cat';
var allCategoriesCache = null;

// ============ УТИЛИТЫ ============
function $(id) { try { return document.getElementById(id); } catch (e) { return null; } }

function escapeHtml(s) {
    try { return String(s).replace(/[&<>"']/g, function(m) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
    catch (e) { return ''; }
}

function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
}

function getType(id) { return DEFAULT_TYPES[id] || customTripTypes[id] || null; }

function getAllCategories() {
    if (allCategoriesCache) return allCategoriesCache;
    var all = {};
    Object.keys(CATEGORIES).forEach(function(k) { all[k] = CATEGORIES[k]; });
    Object.keys(customCategories).forEach(function(k) { all[k] = customCategories[k]; });
    allCategoriesCache = all;
    return all;
}

function invalidateCategoriesCache() { allCategoriesCache = null; }

function normalizeItem(i) {
    if (!i) return { text: 'Без названия', qty: 1, note: '', category: 'other', from: '' };
    if (typeof i === 'string') return { text: i, qty: 1, note: '', category: 'other', from: '' };
    if (typeof i !== 'object') return { text: String(i), qty: 1, note: '', category: 'other', from: '' };
    var allCats = getAllCategories();
    return {
        text: typeof i.text === 'string' ? i.text : String(i.text || 'Без названия'),
        qty: typeof i.qty === 'number' && i.qty > 0 ? i.qty : 1,
        note: typeof i.note === 'string' ? i.note : '',
        category: allCats[i.category] ? i.category : 'other',
        from: typeof i.from === 'string' ? i.from : ''
    };
}

function vibrate() { try { if (settings.vibrate && navigator.vibrate) navigator.vibrate(8); } catch (e) {} }
function vibrateStrong() { try { if (settings.vibrate && navigator.vibrate) navigator.vibrate([10,40,10]); } catch (e) {} }

function showToast(text) {
    var t = $('toast'); if (!t) return;
    t.textContent = text; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.classList.remove('show'); }, 2200);
}

function loadJSON(key, def) {
    try { var v = localStorage.getItem(key); if (!v) return def; var p = JSON.parse(v); return p === null ? def : p; }
    catch (e) {
        try { localStorage.removeItem(key); } catch (e2) {}
        bbLogError(2003, 'Повреждённые данные: ' + key, { stack: e.stack });
        return def;
    }
}

function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) {
        if (e.name === 'QuotaExceededError') bbLogError(2004, 'Превышена квота localStorage: ' + key, { stack: e.stack });
        else bbLogError(2002, 'Ошибка записи localStorage: ' + key, { stack: e.stack });
    }
}

function resetUIBlocks() {
    try { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; } catch (e) {}
}

function closeAllModals() {
    try { document.querySelectorAll('.modal-overlay').forEach(function(m) { m.classList.remove('active'); m.classList.remove('above-checklist'); m.classList.remove('on-top2'); }); } catch (e) {}
}

function getCurrentTrip() {
    if (!activeTrips || !activeTrips.length) return null;
    if (currentTripIndex >= activeTrips.length) return null;
    return activeTrips[currentTripIndex];
}

function openModal(id) { resetUIBlocks(); var el = $(id); if (el) el.classList.add('active'); }
function closeModal(id) { var el = $(id); if (el) { el.classList.remove('active'); el.classList.remove('on-top2'); } resetUIBlocks(); }

// ============ РАБОТА С ДАННЫМИ ============
function migrateListColors() {
    Object.keys(customTypes).forEach(function(k) {
        var t = customTypes[k];
        var found = false;
        for (var i = 0; i < LIST_COLOR_PALETTES.length; i++) {
            if (LIST_COLOR_PALETTES[i].c1 === t.c1 && LIST_COLOR_PALETTES[i].c2 === t.c2) { found = true; break; }
        }
        if (!found) {
            t.c1 = LIST_COLOR_PALETTES[0].c1;
            t.c2 = LIST_COLOR_PALETTES[0].c2;
            t.ring = LIST_COLOR_PALETTES[0].ring;
        }
    });
    saveCustomTypes();
}

function loadData() {
    activeTrips = loadJSON('bybag_active_trips', []);
    if (!Array.isArray(activeTrips)) activeTrips = [];
    history = loadJSON('bybag_history', []);
    customTypes = loadJSON('bybag_custom_types', {});
    customTripTypes = loadJSON('bybag_custom_trip_types', {});
    customCategories = loadJSON('bybag_custom_categories', {});
    profile = loadJSON('bybag_profile', { name: 'Эрик', avatar: null });
    settings = loadJSON('bybag_settings', { dark: false, notif: true, vibrate: true, hideDone: false });
    achievementsState = loadJSON('bybag_achievements', {});
    viewedTips = loadJSON('bybag_viewed_tips', {});
    var viewedVersion = loadJSON(VIEWED_WHATS_NEW_KEY, '');
    viewedWhatsNew = (viewedVersion === BB_VERSION);

    try { localStorage.removeItem('bybag_viewed_whats_new'); } catch (e) {}

    if (!Array.isArray(history)) history = [];
    if (typeof customTypes !== 'object' || customTypes === null || Array.isArray(customTypes)) customTypes = {};
    if (typeof customTripTypes !== 'object' || customTripTypes === null || Array.isArray(customTripTypes)) customTripTypes = {};
    if (typeof customCategories !== 'object' || customCategories === null || Array.isArray(customCategories)) customCategories = {};
    if (typeof profile !== 'object' || profile === null) profile = { name: 'Эрик', avatar: null };
    if (typeof settings !== 'object' || settings === null) settings = { dark: false, notif: true, vibrate: true, hideDone: false };
    if (typeof achievementsState !== 'object' || achievementsState === null) achievementsState = {};
    if (typeof viewedTips !== 'object' || viewedTips === null) viewedTips = {};

    activeTrips = activeTrips.filter(function(t) { return t && typeof t === 'object'; });
    activeTrips.forEach(function(t) {
        if (!Array.isArray(t.items)) t.items = [];
        t.items = t.items.map(normalizeItem);
        if (!t.daysCount) t.daysCount = 3;
    });
    if (activeTrips.length > MAX_ACTIVE_TRIPS) activeTrips = activeTrips.slice(0, MAX_ACTIVE_TRIPS);
    if (currentTripIndex >= activeTrips.length) currentTripIndex = 0;

    Object.keys(customTypes).forEach(function(k) {
        var t = customTypes[k];
        if (!t || typeof t !== 'object') { delete customTypes[k]; return; }
        if (!Array.isArray(t.items)) t.items = [];
        t.items = t.items.map(normalizeItem);
        t.name = t.name || 'Свой список';
        t.emoji = t.emoji || '👕';
        t.c1 = t.c1 || LIST_COLOR_PALETTES[0].c1;
        t.c2 = t.c2 || LIST_COLOR_PALETTES[0].c2;
        t.ring = t.ring || LIST_COLOR_PALETTES[0].ring;
    });
    migrateListColors();

    Object.keys(customTripTypes).forEach(function(k) {
        var t = customTripTypes[k];
        if (!t || typeof t !== 'object') { delete customTripTypes[k]; return; }
        if (!Array.isArray(t.items)) t.items = [];
        t.items = t.items.map(normalizeItem);
        t.name = t.name || 'Свой тип';
        t.emoji = t.emoji || '🏖️';
        t.c1 = t.c1 || '#ffb347';
        t.c2 = t.c2 || '#ff7e5f';
        t.ring = t.ring || '#ff7e5f';
    });

    Object.keys(customCategories).forEach(function(k) {
        var c = customCategories[k];
        if (!c || typeof c !== 'object' || !c.name) { delete customCategories[k]; return; }
        c.icon = c.icon || '📦';
    });
    invalidateCategoriesCache();

    history = history.filter(function(h) { return h && typeof h === 'object'; });
    history.forEach(function(h) { if (h.fullItems && Array.isArray(h.fullItems)) h.fullItems = h.fullItems.map(normalizeItem); });
}

function saveActive() {
    if (activeTrips && activeTrips.length > 0) saveJSON('bybag_active_trips', activeTrips);
    else try { localStorage.removeItem('bybag_active_trips'); } catch (e) {}
}
function saveHistory() { saveJSON('bybag_history', history); }
function saveProfile() { saveJSON('bybag_profile', profile); }
function saveCustomTypes() { saveJSON('bybag_custom_types', customTypes); }
function saveCustomTripTypes() { saveJSON('bybag_custom_trip_types', customTripTypes); }
function saveCustomCategories() { saveJSON('bybag_custom_categories', customCategories); invalidateCategoriesCache(); }
function saveSettings() { saveJSON('bybag_settings', settings); }
function saveAchievements() { saveJSON('bybag_achievements', achievementsState); }
function saveViewedTips() { saveJSON('bybag_viewed_tips', viewedTips); }
function saveViewedWhatsNew() { saveJSON(VIEWED_WHATS_NEW_KEY, BB_VERSION); viewedWhatsNew = true; }

// ============ ДАТЫ, ВРЕМЯ, СТАТИСТИКА ============
function formatTripDate(trip) {
    if (!trip.startDate) return trip.date || '';
    try { return new Date(trip.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); } catch (e) { return trip.date || ''; }
}

function countdown(startDate) {
    if (!startDate) return '';
    try {
        var now = new Date(); now.setHours(0,0,0,0);
        var t = new Date(startDate); t.setHours(0,0,0,0);
        var diff = Math.round((t - now) / 86400000);
        if (diff === 0) return 'сегодня';
        if (diff === 1) return 'завтра';
        if (diff === -1) return 'вчера';
        if (diff > 1) return 'через ' + diff + ' ' + plural(diff, 'день', 'дня', 'дней');
        return Math.abs(diff) + ' ' + plural(Math.abs(diff), 'день', 'дня', 'дней') + ' назад';
    } catch (e) { return ''; }
}

function getTripStats(trip) {
    var done = 0;
    var items = (trip && trip.items) ? trip.items : [];
    items.forEach(function(i) { if (i.done) done++; });
    return { done: done, total: items.length, percent: items.length > 0 ? Math.round((done / items.length) * 100) : 0 };
}

function calcStats() {
    var tt = history.length + activeTrips.length;
    var ad = 0, pt = 0, combined = 0;
    history.forEach(function(h) { ad += h.done || 0; if (h.total > 0 && h.done === h.total) pt++; if (h.listIds && h.listIds.length >= 2) combined++; });
    activeTrips.forEach(function(t) {
        var s = getTripStats(t);
        ad += s.done;
        if (s.total > 0 && s.done === s.total) pt++;
        if (t.listIds && t.listIds.length >= 2) combined++;
    });
    return { totalTrips: tt, completedTrips: history.length, allDone: ad, perfectTrips: pt, customCount: Object.keys(customTypes).length, combinedTrips: combined };
}

function applyTheme() {
    try {
        document.documentElement.style.backgroundColor = settings.dark ? '#0d1220' : '#faf6f0';
        document.body.classList.toggle('dark', !!settings.dark);
        ['darkToggle','notifToggle','vibrateToggle'].forEach(function(id) {
            var el = $(id);
            if (el) el.classList.toggle('on', !!(id === 'darkToggle' ? settings.dark : id === 'notifToggle' ? settings.notif : settings.vibrate));
        });
    } catch (e) { bbLogError(1003, 'Ошибка темы', { stack: e.stack }); }
}

// ============ ШИНА window.byBag ============
window.byBag = {
    $: $,
    escapeHtml: escapeHtml,
    plural: plural,
    showToast: showToast,
    vibrate: vibrate,
    vibrateStrong: vibrateStrong,
    loadJSON: loadJSON,
    saveJSON: saveJSON,
    openModal: openModal,
    closeModal: closeModal,
    resetUIBlocks: resetUIBlocks,
    closeAllModals: closeAllModals,
    getType: getType,
    getAllCategories: getAllCategories,
    normalizeItem: normalizeItem,
    getCurrentTrip: getCurrentTrip,
    getTripStats: getTripStats,
    calcStats: calcStats,
    formatTripDate: formatTripDate,
    countdown: countdown,
    applyTheme: applyTheme,
    saveActive: saveActive,
    saveHistory: saveHistory,
    saveProfile: saveProfile,
    saveCustomTypes: saveCustomTypes,
    saveCustomTripTypes: saveCustomTripTypes,
    saveCustomCategories: saveCustomCategories,
    saveSettings: saveSettings,
    saveAchievements: saveAchievements,
    saveViewedTips: saveViewedTips,
    saveViewedWhatsNew: saveViewedWhatsNew,
    getActiveTrips: function() { return activeTrips; },
    getHistory: function() { return history; },
    getCustomTypes: function() { return customTypes; },
    getCustomTripTypes: function() { return customTripTypes; },
    getCustomCategories: function() { return customCategories; },
    getProfile: function() { return profile; },
    getSettings: function() { return settings; }
};