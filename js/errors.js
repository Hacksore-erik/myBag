// ============================================================
// byBag — Система обработки ошибок
// Файл: js/errors.js
// Версия: 2.0.4
// ============================================================

var BB_VERSION = '2.0.4';
var BB_ERROR_LOG_KEY = 'bybag_error_log';
var BB_MAX_LOG = 30;

var BB_ERROR_NAMES = {
    1001:'Ошибка инициализации приложения', 1002:'Не удалось загрузить данные', 1003:'Не удалось применить тему',
    1004:'Не найдены обязательные элементы интерфейса',
    2001:'Ошибка чтения localStorage', 2002:'Ошибка записи в localStorage', 2003:'Повреждённые данные, сброшены',
    2004:'Превышена квота localStorage', 2005:'Не удалось очистить хранилище',
    3001:'Ошибка рендера главной', 3002:'Ошибка рендера списков', 3003:'Ошибка рендера профиля',
    3004:'Ошибка рендера чеклиста', 3005:'Ошибка рендера советов', 3006:'Ошибка рендера истории поездок',
    3007:'Ошибка открытия страницы',
    4001:'Ошибка открытия модалки', 4002:'Ошибка сохранения формы', 4003:'Ошибка закрытия модалки',
    4004:'Ошибка выбора типа поездки', 4005:'Ошибка выбора списков',
    5001:'Не удалось загрузить погоду', 5002:'Город не найден', 5003:'Погодный сервис недоступен',
    6001:'Ошибка истории поездок', 6002:'Не удалось повторить поездку', 6003:'Ошибка удаления истории',
    7001:'Ошибка отметки вещи', 7002:'Ошибка удаления вещи', 7003:'Ошибка изменения количества',
    7004:'Ошибка добавления вещи', 7005:'Ошибка поиска по списку',
    8001:'Ошибка загрузки аватара', 8002:'Ошибка профиля', 8003:'Ошибка категории', 8004:'Ошибка достижений',
    9001:'Неизвестная ошибка', 9002:'Unhandled Promise Rejection', 9003:'Ошибка ресурса (img/script)',
    9004:'Запрещённая конструкция в strict mode', 9005:'Ошибка таймера', 9006:'Ошибка внешнего API'
};

function bbGetDeviceInfo() {
    try {
        return {
            ua: navigator.userAgent, platform: navigator.platform || 'unknown', lang: navigator.language,
            screen: (window.screen ? window.screen.width + 'x' + window.screen.height : '?'),
            dpr: window.devicePixelRatio || 1, url: location.href, time: new Date().toISOString(),
            tz: (typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown'),
            online: navigator.onLine
        };
    } catch (e) { return { error: 'device info failed: ' + e.message }; }
}

function bbGetDataState() {
    try {
        var st = {
            currentPage: (document.querySelector('.page.active') || {}).id || '?',
            modalsOpen: document.querySelectorAll('.modal-overlay.active').length,
            checklistOpen: !!(document.getElementById('checklistPage') && document.getElementById('checklistPage').classList.contains('active')),
            tipViewerOpen: !!(document.getElementById('tipViewer') && document.getElementById('tipViewer').classList.contains('active')),
            onboardingOpen: !!(document.getElementById('onboardingViewer') && document.getElementById('onboardingViewer').classList.contains('active'))
        };
        try { st.trips = JSON.parse(localStorage.getItem('bybag_active_trips') || '[]').length; } catch (e) { st.trips = '?'; }
        try { st.history = JSON.parse(localStorage.getItem('bybag_history') || '[]').length; } catch (e) { st.history = '?'; }
        try { st.customTypes = Object.keys(JSON.parse(localStorage.getItem('bybag_custom_types') || '{}')).length; } catch (e) { st.customTypes = '?'; }
        try { st.customTripTypes = Object.keys(JSON.parse(localStorage.getItem('bybag_custom_trip_types') || '{}')).length; } catch (e) { st.customTripTypes = '?'; }
        try { st.customCats = Object.keys(JSON.parse(localStorage.getItem('bybag_custom_categories') || '{}')).length; } catch (e) { st.customCats = '?'; }
        try { st.lsTotal = (localStorage.length || 0); } catch (e) { st.lsTotal = '?'; }
        return st;
    } catch (e) { return { error: 'data state failed: ' + e.message }; }
}

function bbLogError(code, message, extra) {
    try {
        var entry = {
            code: code, name: BB_ERROR_NAMES[code] || 'Ошибка', message: String(message || ''),
            stack: (extra && extra.stack) ? String(extra.stack).slice(0, 2000) : '',
            device: bbGetDeviceInfo(), data: bbGetDataState(), version: BB_VERSION, ts: Date.now()
        };
        var log = [];
        try { log = JSON.parse(localStorage.getItem(BB_ERROR_LOG_KEY) || '[]'); } catch (e) { log = []; }
        if (!Array.isArray(log)) log = [];
        log.unshift(entry);
        if (log.length > BB_MAX_LOG) log = log.slice(0, BB_MAX_LOG);
        try { localStorage.setItem(BB_ERROR_LOG_KEY, JSON.stringify(log)); } catch (e) {}
        try { var lbl = document.getElementById('errorCountLabel'); if (lbl) lbl.textContent = log.length; } catch (e) {}
        return entry;
    } catch (e) { return null; }
}

function bbGetErrorLog() {
    try { return JSON.parse(localStorage.getItem(BB_ERROR_LOG_KEY) || '[]'); } catch (e) { return []; }
}
function bbClearErrorLog() {
    try { localStorage.removeItem(BB_ERROR_LOG_KEY); } catch (e) { bbLogError(2005, 'Не удалось очистить журнал'); }
    try { var lbl = document.getElementById('errorCountLabel'); if (lbl) lbl.textContent = '0'; } catch (e) {}
}

function bbBuildErrorReport(code, message, err) {
    var entry = bbLogError(code, message, { stack: err && err.stack });
    var lines = [];
    lines.push('🐛 byBag v' + BB_VERSION + ' — отчёт об ошибке');
    lines.push('');
    lines.push('Код: BB-' + code);
    lines.push('Название: ' + (BB_ERROR_NAMES[code] || '?'));
    lines.push('Сообщение: ' + message);
    if (err && err.message && err.message !== message) lines.push('Технически: ' + err.message);
    lines.push('');
    lines.push('📱 Устройство:');
    var d = entry ? entry.device : bbGetDeviceInfo();
    Object.keys(d).forEach(function(k) { lines.push('  ' + k + ': ' + d[k]); });
    lines.push('');
    lines.push('💾 Состояние:');
    var s = entry ? entry.data : bbGetDataState();
    Object.keys(s).forEach(function(k) { lines.push('  ' + k + ': ' + s[k]); });
    if (err && err.stack) {
        lines.push('');
        lines.push('📚 Stack trace:');
        lines.push(err.stack);
    }
    return lines.join('\n');
}

function showErrorScreen(code, message, err) {
    try {
        var es = document.getElementById('errorScreen');
        var em = document.getElementById('errMsg');
        var ec = document.getElementById('errCode');
        var et = document.getElementById('errTitle');
        var report = bbBuildErrorReport(code, message, err);
        if (!es) { console.error('BB-' + code, message, err); return; }
        if (em) em.textContent = report;
        if (ec) ec.textContent = 'Код: BB-' + code + ' · ' + (BB_ERROR_NAMES[code] || '');
        if (et) et.textContent = message || (BB_ERROR_NAMES[code] || 'Что-то пошло не так');
        es.classList.add('show');
        var copyBtn = document.getElementById('errCopyBtn');
        if (copyBtn) {
            copyBtn.onclick = function() {
                try {
                    if (navigator.share) { navigator.share({ title: 'byBag error', text: report }).catch(function() {}); return; }
                    var ta = document.createElement('textarea');
                    ta.value = report; document.body.appendChild(ta); ta.select();
                    document.execCommand('copy'); document.body.removeChild(ta);
                    copyBtn.textContent = '✓ Скопировано';
                    setTimeout(function() { copyBtn.textContent = '📋 Скопировать отчёт'; }, 1500);
                } catch (e) { copyBtn.textContent = '✗ Не удалось'; }
            };
        }
    } catch (e) { console.error('showErrorScreen failed', e); }
}

function bbDetectErrorCode(msg, stack) {
    msg = String(msg || ''); stack = String(stack || '');
    if (msg.indexOf('arguments.callee') !== -1 || stack.indexOf('callee') !== -1) return 9004;
    if (msg.indexOf('QuotaExceeded') !== -1) return 2004;
    if (stack.indexOf('localStorage') !== -1 || msg.indexOf('localStorage') !== -1) return 2001;
    if (stack.indexOf('renderHome') !== -1) return 3001;
    if (stack.indexOf('renderListsPage') !== -1) return 3002;
    if (stack.indexOf('renderProfile') !== -1) return 3003;
    if (stack.indexOf('renderChecklist') !== -1) return 3004;
    if (stack.indexOf('renderTips') !== -1 || stack.indexOf('buildTips') !== -1) return 3005;
    if (stack.indexOf('renderHistory') !== -1) return 3006;
    if (stack.indexOf('loadWeather') !== -1 || stack.indexOf('renderWeather') !== -1) return 5001;
    if (stack.indexOf('toggleItem') !== -1) return 7001;
    if (stack.indexOf('deleteActiveItem') !== -1) return 7002;
    if (stack.indexOf('init') !== -1 || msg.indexOf('init') !== -1) return 1001;
    return 9001;
}

window.addEventListener('error', function(e) {
    var msg = e.message || 'Неизвестная ошибка';
    var stack = (e.error && e.error.stack) || '';
    var code = 9001;
    if (e.target && e.target.tagName === 'IMG') code = 9003;
    else code = bbDetectErrorCode(msg, stack);
    showErrorScreen(code, msg, e.error || { message: msg, stack: stack });
}, true);

window.addEventListener('unhandledrejection', function(e) {
    var reason = e.reason || {};
    var msg = reason.message || String(reason) || 'Unhandled promise rejection';
    var code = bbDetectErrorCode(msg, reason.stack || '');
    if (code === 9001) code = 9002;
    showErrorScreen(code, msg, reason);
});

function hardReset() {
    try {
        if (!confirm('Сбросить ВСЕ данные приложения? Это нельзя отменить.')) return;
        localStorage.clear();
    } catch (e) { bbLogError(2005, 'Не удалось очистить хранилище', { stack: e.stack }); }
    location.reload();
}

function downloadErrorLog() {
    try {
        var log = bbGetErrorLog();
        if (!log.length) { alert('Журнал пуст'); return; }
        var text = JSON.stringify(log, null, 2);
        var blob = new Blob([text], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bybag-errors-' + Date.now() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    } catch (e) { alert('Не удалось скачать журнал: ' + e.message); }
}