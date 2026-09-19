// ============================================================
// myBag — Улучшенная система обработки ошибок
// Файл: js/errors.js
// Версия: 2.8.0
// ============================================================

var BB_ERRORS_VERSION = '2.8.0';
var BB_ERROR_LOG_KEY = 'bybag_error_log';
var BB_MAX_LOG = 30;
var BB_LOAD_LOG = [];

// ============ ЛОГ ЗАГРУЗКИ ФАЙЛОВ ============
function bbLogLoad(filename, status, extra) {
    try {
        BB_LOAD_LOG.push({
            file: filename,
            status: status,
            time: Date.now(),
            extra: extra || null
        });
        console.log('[myBag] ' + filename + ' — ' + status + (extra ? ' — ' + extra : ''));
    } catch (e) {}
}

// ============ ПРОВЕРКА ЗАГРУЗКИ ВСЕХ ФАЙЛОВ ============
function bbCheckFiles() {
    var expectedFunctions = {
        'errors.js': ['bbLogError', 'bbGetErrorLog', 'showErrorScreen', 'hardReset'],
        'constants.js': ['DEFAULT_TYPES', 'TIPS_CATEGORIES', 'ONBOARDING_SLIDES', 'EMOJI_CHOICES'],
        'utils.js': ['$', 'escapeHtml', 'plural', 'showToast', 'loadJSON', 'saveJSON', 'loadData', 'getCurrentTrip', 'openModal', 'closeModal'],
        'app.js': ['buildTips', 'renderHome', 'buildWidget', 'renderListsPage', 'renderTypeGrid', 'createTrip', 'renderChecklistPage', 'renderProfile', 'openChecklistPage', 'switchPage'],
        'main.js': ['init', 'bind']
    };

    var results = [];
    var missing = [];

    Object.keys(expectedFunctions).forEach(function(file) {
        var funcs = expectedFunctions[file];
        var missingInFile = [];
        funcs.forEach(function(fn) {
            try {
                var val = window[fn] || eval('typeof ' + fn);
                if (val === 'undefined' || val === undefined) {
                    missingInFile.push(fn);
                }
            } catch (e) {
                try {
                    if (typeof eval(fn) === 'undefined') missingInFile.push(fn);
                } catch (e2) {
                    missingInFile.push(fn + ' (не объявлено)');
                }
            }
        });
        if (missingInFile.length) {
            missing.push({ file: file, missing: missingInFile });
            results.push('❌ ' + file + ' — не хватает: ' + missingInFile.join(', '));
        } else {
            results.push('✅ ' + file + ' — все функции на месте');
        }
    });

    if (typeof window.byBag === 'undefined') {
        results.push('❌ utils.js — window.byBag не создан (обрыв файла!)');
        missing.push({ file: 'utils.js', missing: ['window.byBag'] });
    } else {
        results.push('✅ utils.js — window.byBag создан');
    }

    return { results: results, missing: missing, loadLog: BB_LOAD_LOG };
}

function bbShowDiagnostic() {
    var diag = bbCheckFiles();
    var report = '🔍 ДИАГНОСТИКА myBag v' + BB_ERRORS_VERSION + '\n\n';
    report += '📋 Проверка файлов:\n';
    report += diag.results.join('\n') + '\n\n';
    report += '📥 Лог загрузки:\n';
    diag.loadLog.forEach(function(l) {
        report += '  ' + l.file + ' — ' + l.status + '\n';
    });
    if (diag.missing.length) {
        report += '\n🚨 НАЙДЕНЫ ПРОБЛЕМЫ:\n';
        diag.missing.forEach(function(m) {
            report += '  ' + m.file + ': не найдено — ' + m.missing.join(', ') + '\n';
        });
    }
    return report;
}

// ============ ОСНОВНАЯ СИСТЕМА ОШИБОК ============
var BB_ERROR_NAMES = {
    1001:'Ошибка инициализации приложения', 1002:'Не удалось загрузить данные', 1003:'Не удалось применить тему',
    1004:'Не найдены обязательные элементы интерфейса',
    2001:'Ошибка чтения localStorage', 2002:'Ошибка записи в localStorage', 2003:'Повреждённые данные, сброшены',
    2004:'Превышена квота localStorage', 2005:'Не удалось очистить хранилище',
    3001:'Ошибка рендера главной', 3002:'Ошибка рендера списков', 3003:'Ошибка рендера профиля',
    3004:'Ошибка рендера чеклиста', 3005:'Ошибка рендера советов', 3006:'Ошибка рендера истории поездок',
    3007:'Ошибка открытия страницы', 3008:'Ошибка рендера страницы поездки', 3009:'Ошибка рендера настроек',
    4001:'Ошибка открытия модалки', 4002:'Ошибка сохранения формы', 4003:'Ошибка закрытия модалки',
    4004:'Ошибка выбора типа поездки', 4005:'Ошибка выбора списков',
    5001:'Не удалось загрузить погоду', 5002:'Город не найден', 5003:'Погодный сервис недоступен',
    6001:'Ошибка истории поездок', 6002:'Не удалось повторить поездку', 6003:'Ошибка удаления истории',
    7001:'Ошибка отметки вещи', 7002:'Ошибка удаления вещи', 7003:'Ошибка изменения количества',
    7004:'Ошибка добавления вещи', 7005:'Ошибка поиска по списку',
    8001:'Ошибка загрузки аватара', 8002:'Ошибка профиля',
    8004:'Ошибка достижений',
    9001:'Неизвестная ошибка', 9002:'Unhandled Promise Rejection', 9003:'Ошибка загрузки скрипта',
    9004:'Запрещённая конструкция в strict mode', 9005:'Ошибка таймера', 9006:'Ошибка внешнего API',
    9010:'addListToTripModal отсутствует в HTML', 9011:'addListToTripPicker отсутствует в HTML',
    9012:'Ошибка openAddListToTripModal', 9013:'Ошибка renderAddListToTripPicker',
    9014:'Ошибка confirmAddListToTrip',
    9020:'Ошибка клика fabItemList',
    9021:'Ошибка экспорта данных', 9022:'Ошибка парсинга импорта', 9023:'Ошибка импорта',
    9024:'Ошибка сохранения заметки', 9025:'Ошибка сохранения информации о поездке',
    9026:'Ошибка рендера страницы «Поездка»', 9027:'Ошибка карусели поездок',
    9028:'Ошибка переключения поездки', 9029:'Ошибка открытия настроек'
};

function bbGetDeviceInfo() {
    try {
        return {
            ua: navigator.userAgent,
            platform: navigator.platform || 'unknown',
            lang: navigator.language,
            screen: (window.screen ? window.screen.width + 'x' + window.screen.height : '?'),
            dpr: window.devicePixelRatio || 1,
            url: location.href,
            time: new Date().toISOString(),
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
            onboardingOpen: !!(document.getElementById('onboardingViewer') && document.getElementById('onboardingViewer').classList.contains('active')),
            settingsOpen: !!(document.getElementById('settingsPage') && document.getElementById('settingsPage').classList.contains('active'))
        };
        try { st.trips = JSON.parse(localStorage.getItem('bybag_active_trips') || '[]').length; } catch (e) { st.trips = '?'; }
        try { st.history = JSON.parse(localStorage.getItem('bybag_history') || '[]').length; } catch (e) { st.history = '?'; }
        try { st.customTypes = Object.keys(JSON.parse(localStorage.getItem('bybag_custom_types') || '{}')).length; } catch (e) { st.customTypes = '?'; }
        try { st.customTripTypes = Object.keys(JSON.parse(localStorage.getItem('bybag_custom_trip_types') || '{}')).length; } catch (e) { st.customTripTypes = '?'; }
        try { st.lsTotal = (localStorage.length || 0); } catch (e) { st.lsTotal = '?'; }
        return st;
    } catch (e) { return { error: 'data state failed: ' + e.message }; }
}

function bbLogError(code, message, extra) {
    try {
        var entry = {
            code: code,
            name: BB_ERROR_NAMES[code] || 'Ошибка',
            message: String(message || ''),
            stack: (extra && extra.stack) ? String(extra.stack).slice(0, 2000) : '',
            device: bbGetDeviceInfo(),
            data: bbGetDataState(),
            version: BB_ERRORS_VERSION,
            ts: Date.now()
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
    lines.push('🐛 myBag v' + BB_ERRORS_VERSION + ' — отчёт об ошибке');
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
    lines.push('');
    lines.push('📥 Лог загрузки:');
    if (BB_LOAD_LOG.length) {
        BB_LOAD_LOG.forEach(function(l) {
            lines.push('  ' + l.file + ' — ' + l.status);
        });
    } else {
        lines.push('  (пусто)');
    }
    try {
        var diag = bbCheckFiles();
        lines.push('');
        lines.push('🔍 Проверка функций:');
        diag.results.forEach(function(r) { lines.push('  ' + r); });
    } catch (e) {}
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
                    if (navigator.share) { navigator.share({ title: 'myBag error', text: report }).catch(function() {}); return; }
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
    if (stack.indexOf('renderTripPage') !== -1) return 3008;
    if (stack.indexOf('renderSettings') !== -1) return 3009;
    if (stack.indexOf('loadWeather') !== -1 || stack.indexOf('renderWeather') !== -1) return 5001;
    if (stack.indexOf('toggleItem') !== -1) return 7001;
    if (stack.indexOf('deleteActiveItem') !== -1) return 7002;
    if (stack.indexOf('init') !== -1 || msg.indexOf('init') !== -1) return 1001;
    return 9001;
}

// ============ ГЛОБАЛЬНЫЙ ПЕРЕХВАТ ОШИБОК (единый) ============
window.addEventListener('error', function(e) {
    // Ошибка загрузки скрипта — особый случай
    if (e.target && e.target.tagName === 'SCRIPT') {
        var src = e.target.src || 'unknown';
        bbLogLoad(src, 'FAILED TO LOAD');
        var report = '🐛 myBag — Ошибка загрузки скрипта\n\n' +
            'Файл: ' + src + '\n' +
            'Время: ' + new Date().toISOString() + '\n' +
            'URL: ' + location.href + '\n\n' +
            'Загруженные до этого файлы:\n' +
            BB_LOAD_LOG.map(function(l) { return '  ' + l.file + ' — ' + l.status; }).join('\n');
        try { console.error(report); } catch (ex) {}
        var es = document.getElementById('errorScreen');
        var em = document.getElementById('errMsg');
        var ec = document.getElementById('errCode');
        var et = document.getElementById('errTitle');
        if (es) {
            if (ec) ec.textContent = 'Код: BB-9003 · Ошибка загрузки скрипта';
            if (et) et.textContent = 'Не загрузился скрипт: ' + src.split('/').pop();
            if (em) em.textContent = report;
            es.classList.add('show');
        }
        return true;
    }

    // Обычная JS-ошибка
    var msg = e.message || 'Неизвестная ошибка';
    var stack = (e.error && e.error.stack) || '';
    bbLogLoad('window.error', msg, stack.slice(0, 200));
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

// ============ СЛУЖЕБНЫЕ ============
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
        a.download = 'mybag-errors-' + Date.now() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    } catch (e) { alert('Не удалось скачать журнал: ' + e.message); }
}

function bbShowDiagAlert() {
    var report = bbShowDiagnostic();
    try { console.log(report); } catch (e) {}
    alert(report);
}

// Автодиагностика через 2 секунды
setTimeout(function() {
    try {
        var diag = bbCheckFiles();
        var hasProblems = diag.missing.length > 0;
        if (hasProblems) {
            bbLogLoad('DIAGNOSTIC', 'PROBLEMS FOUND', JSON.stringify(diag.missing));
            var report = bbShowDiagnostic();
            var es = document.getElementById('errorScreen');
            var em = document.getElementById('errMsg');
            var ec = document.getElementById('errCode');
            var et = document.getElementById('errTitle');
            if (es) {
                if (ec) ec.textContent = 'Диагностика: проблемы с файлами';
                if (et) et.textContent = 'Найдены проблемы с загрузкой файлов';
                if (em) em.textContent = report;
                es.classList.add('show');
            }
        } else {
            bbLogLoad('DIAGNOSTIC', 'ALL OK');
        }
    } catch (e) {
        console.error('diagnostic failed', e);
    }
}, 2000);