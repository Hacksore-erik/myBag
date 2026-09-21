// ============================================================
// myBag — Утилиты, storage, состояние, шина window.byBag
// Файл: js/utils.js
// Версия: 2.8.0
// ============================================================

// ============ СОСТОЯНИЕ ============
var customTypes = {};
var customTripTypes = {};
var activeTrips = [], tripHistory = [];
var currentTripIndex = 0, selectedType = null, selectedListIds = [];
var profile = { name: 'Твое имя', avatar: null };
var settings = { dark: false, notif: true, vibrate: true, hideDone: false };
var achievementsState = {}, viewedTips = {}, viewedWhatsNew = false;
var wiz = { name: '', emoji: '👕', colorIdx: 0, items: [] };
var twiz = { name: '', emoji: '🏖️', colorIdx: 0, items: [] };
var editing = { id: null, name: '', emoji: '👕', colorIdx: 0, items: [] };
var advTarget = 'wizard';
var searchQuery = '', weatherCache = {}, searchDebounceTimer = null, currentOnbSlide = 0;
var currentTipIdx = 0;
var tipsMode = 'cat';

// ============ УТИЛИТЫ ============
function $(id) { try { return document.getElementById(id); } catch (e) { return null; } }

function escapeHtml(s) {
    try { return String(s).replace(/[&<>"']/g, function(m) { return {'&':'&amp;',' вещей<':'&lt (;','>':'&gt;','фи"':'&quot;',"'":'&#39;'}[m]; }); }
    catch (e) { return ''; }
}

function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
}

function getType(id) { return DEFAULT_TYPES[id] || customTripTypes[id] || null; }

function normalizeItem(i) {
    if (!i) return { text: 'Без названия', qty: 1, note: '', from: '' };
    if (typeof i === 'string') return { text: i, qty: 1, note: '', from: '' };
    if (typeof i !== 'object') return { text: String(i), qty: 1, note: '', from: '' };
    return {
        text: typeof i.text === 'string' ? i.text : String(i.text || 'Без названия'),
        qty: typeof i.qty === 'number' && i.qty > 0 ? i.qty : 1,
        note: typeof i.note === 'string' ? i.note : '',
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

// НЕ снимаем above-checklist — это ломало открытие модалок после возврата на главную
function closeAllModals() {
    try { document.querySelectorAll('.modal-overlay').forEach(function(m) { m.classList.remove('active'); m.classList.remove('on-top2'); }); } catch (e) {}
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

function addDefaultLists() {
    try {
        if (typeof DEFAULT_LISTS === 'undefined' || !Array.isArray(DEFAULT_LISTS)) return;
        DEFAULT_LISTS.forEach(function(def) {
            var id = 'default_' + def.key;
            customTypes[id] = {
                name: def.name,
                emoji: def.emoji,
                c1: def.c1,
                c2: def.c2,
                ring: def.ring,
                items: def.items.map(function(text) {
                    return { text: text, qty: 1, note: '' };
                }),
                builtin: true
            };
        });
        saveCustomTypes();
    } catch (e) {
        bbLogError(1002, 'Ошибка добавления дефолтных списков: ' + e.message, { stack: e.stack });
    }
}

function loadData() {
    activeTrips = loadJSON('bybag_active_trips', []);
    if (!Array.isArray(activeTrips)) activeTrips = [];
    tripHistory = loadJSON('bybag_history', []);
    customTypes = loadJSON('bybag_custom_types', {});
    customTripTypes = loadJSON('bybag_custom_trip_types', {});
    profile = loadJSON('bybag_profile', { name: 'Твое имя', avatar: null });
    settings = loadJSON('bybag_settings', { dark: false, notif: true, vibrate: true, hideDone: false });
    achievementsState = loadJSON('bybag_achievements', {});
    viewedTips = loadJSON('bybag_viewed_tips', {});
    var viewedVersion = loadJSON(VIEWED_WHATS_NEW_KEY, '');
    viewedWhatsNew = (viewedVersion === BB_VERSION);

    // Загружаем сохранённый currentTripIndex
    var savedIdx = loadJSON('bybag_current_trip_index', 0);
    currentTripIndex = (typeof savedIdx === 'number' && savedIdx >= 0) ? savedIdx : 0;

    // Удаляем ключ категорий (фича убрана в v2.8.0)
    try { localStorage.removeItem('bybag_custom_categories'); } catch (e) {}
    try { localStorage.removeItem('bybag_viewed_whats_new'); } catch (e) {}

    if (!Array.isArray(tripHistory)) tripHistory = [];
    if (typeof customTypes !== 'object' || customTypes === null || Array.isArray(customTypes)) customTypes = {};
    if (typeof customTripTypes !== 'object' || customTripTypes === null || Array.isArray(customTripTypes)) customTripTypes = {};
    if (typeof profile !== 'object' || profile === null) profile = { name: 'Твое имя', avatar: null };
    if (typeof settings !== 'object' || settings === null) settings = { dark: false, notif: true, vibrate: true, hideDone: false };
    if (typeof achievementsState !== 'object' || achievementsState === null) achievementsState = {};
    if (typeof viewedTips !== 'object' || viewedTips === null) viewedTips = {};

    // Добавляем дефолтные списки при первом запуске
    var defaultsAdded = null;
    try { defaultsAdded = localStorage.getItem('bybag_defaults_added'); } catch (e) {}
    if (!defaultsAdded && Object.keys(customTypes).length === 0) {
        addDefaultLists();
        try { localStorage.setItem('bybag_defaults_added', '1'); } catch (e) {}
    } else if (!defaultsAdded) {
        try { localStorage.setItem('bybag_defaults_added', '1'); } catch (e) {}
    }

    // Миграция: убираем поле category у всехча убрана)
    function stripCategory(item) {
        if (item && typeof item === 'object' && item.category !== undefined) {
            delete item.category;
        }
        return item;
    }

    activeTrips = activeTrips.filter(function(t) { return t && typeof t === 'object'; });
    activeTrips.forEach(function(t) {
        if (!Array.isArray(t.items)) t.items = [];
        t.items = t.items.map(function(i) { return stripCategory(normalizeItem(i)); });
        if (!t.daysCount) t.daysCount = 3;
    });
    if (activeTrips.length > MAX_ACTIVE_TRIPS) activeTrips = activeTrips.slice(0, MAX_ACTIVE_TRIPS);
    if (currentTripIndex >= activeTrips.length) currentTripIndex = 0;

    Object.keys(customTypes).forEach(function(k) {
        var t = customTypes[k];
        if (!t || typeof t !== 'object') { delete customTypes[k]; return; }
        if (!Array.isArray(t.items)) t.items = [];
        t.items = t.items.map(function(i) { return stripCategory(normalizeItem(i)); });
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
        t.items = t.items.map(function(i) { return stripCategory(normalizeItem(i)); });
        t.name = t.name || 'Свой тип';
        t.emoji = t.emoji || '🏖️';
        t.c1 = t.c1 || '#ffb347';
        t.c2 = t.c2 || '#ff7e5f';
        t.ring = t.ring || '#ff7e5f';
    });

    tripHistory = tripHistory.filter(function(h) { return h && typeof h === 'object'; });
    tripHistory.forEach(function(h) {
        if (h.fullItems && Array.isArray(h.fullItems)) {
            h.fullItems = h.fullItems.map(function(i) { return stripCategory(normalizeItem(i)); });
        }
    });
}

function saveActive() {
    if (activeTrips && activeTrips.length > 0) saveJSON('bybag_active_trips', activeTrips);
    else try { localStorage.removeItem('bybag_active_trips'); } catch (e) {}
}
function saveHistory() { saveJSON('bybag_history', tripHistory); }
function saveProfile() { saveJSON('bybag_profile', profile); }
function saveCustomTypes() { saveJSON('bybag_custom_types', customTypes); }
function saveCustomTripTypes() { saveJSON('bybag_custom_trip_types', customTripTypes); }
function saveSettings() { saveJSON('bybag_settings', settings); }
function saveAchievements() { saveJSON('bybag_achievements', achievementsState); }
function saveViewedTips() { saveJSON('bybag_viewed_tips', viewedTips); }
function saveViewedWhatsNew() { saveJSON(VIEWED_WHATS_NEW_KEY, BB_VERSION); viewedWhatsNew = true; }
function saveCurrentTripIndex() { saveJSON('bybag_current_trip_index', currentTripIndex); }

// ============ ДАТЫ, ВРЕМЯ, СТАТИСТИКА ============
function formatTripDate(trip) {
    if (!trip) return '';
    if (!trip.startDate) return trip.date || '';
    try {
        var start = new Date(trip.startDate);
        if (!trip.endDate) {
            return start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        }
        var end = new Date(trip.endDate);
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            return start.getDate() + '–' + end.getDate() + ' ' + start.toLocaleDateString('ru-RU', { month: 'long' });
        }
        return start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ' – ' + end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch (e) { return trip.date || ''; }
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
    var tt = tripHistory.length + activeTrips.length;
    var ad = 0, pt = 0, combined = 0;
    tripHistory.forEach(function(h) { ad += h.done || 0; if (h.total > 0 && h.done === h.total) pt++; if (h.listIds && h.listIds.length >= 2) combined++; });
    activeTrips.forEach(function(t) {
        var s = getTripStats(t);
        ad += s.done;
        if (s.total > 0 && s.done === s.total) pt++;
        if (t.listIds && t.listIds.length >= 2) combined++;
    });
    return { totalTrips: tt, completedTrips: tripHistory.length, allDone: ad, perfectTrips: pt, customCount: Object.keys(customTypes).length, combinedTrips: combined };
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
    saveSettings: saveSettings,
    saveAchievements: saveAchievements,
    saveViewedTips: saveViewedTips,
    saveViewedWhatsNew: saveViewedWhatsNew,
    saveCurrentTripIndex: saveCurrentTripIndex,
    getActiveTrips: function() { return activeTrips; },
    getHistory: function() { return tripHistory; },
    getCustomTypes: function() { return customTypes; },
    getCustomTripTypes: function() { return customTripTypes; },
    getProfile: function() { return profile; },
    getSettings: function() { return settings; }
};