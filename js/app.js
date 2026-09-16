// ============================================================
// byBag — Основная логика приложения
// Файл: js/app.js
// Версия: 2.0.4
// ============================================================

(function() {
    'use strict';

    var MAX_ACTIVE_TRIPS = 2;
    var SWIPE_THRESHOLD = 0.2;
    var SWIPE_ITEM_THRESHOLD = 70;
    var WEATHER_CACHE_TTL = 1800000;
    var VIEWED_WHATS_NEW_KEY = 'bybag_viewed_whats_new_version';

    var CATEGORIES = {
        clothes: { name: 'Одежда', icon: '👕' }, documents: { name: 'Документы', icon: '📄' },
        tech: { name: 'Техника', icon: '📱' }, hygiene: { name: 'Гигиена', icon: '🧴' },
        meds: { name: 'Аптека', icon: '💊' }, other: { name: 'Прочее', icon: '📦' }
    };

    var ACHIEVEMENTS = [
        { id: 'first_trip', icon: '🏆', name: 'Первая поездка', desc: 'Создана поездка', check: function(s) { return s.totalTrips >= 1; } },
        { id: 'perfect', icon: '🎯', name: 'Идеальный сбор', desc: 'Собрано 100%', check: function(s) { return s.perfectTrips >= 1; } },
        { id: 'five_trips', icon: '🔥', name: 'Опытный', desc: '5 поездок', check: function(s) { return s.totalTrips >= 5; } },
        { id: 'hundred_items', icon: '📦', name: 'Сто вещей', desc: '100 вещей собрано', check: function(s) { return s.allDone >= 100; } },
        { id: 'custom_list', icon: '🎨', name: 'Дизайнер', desc: 'Свой список', check: function(s) { return s.customCount >= 1; } },
        { id: 'three_perfect', icon: '⭐', name: 'Перфекционист', desc: '3 идеальных', check: function(s) { return s.perfectTrips >= 3; } },
        { id: 'combined', icon: '🧩', name: 'Комбинатор', desc: 'Поездка с 2+ списками', check: function(s) { return s.combinedTrips >= 1; } }
    ];

    var DEFAULT_TYPES = {
        rest: { name: 'Отдых', emoji: '🏖️', c1: '#ffb347', c2: '#ff7e5f', ring: '#ff7e5f',
            items: ['Купальник / плавки','Солнцезащитный крем','Солнечные очки','Пляжное полотенце','Шлёпки / сандалии','Панама / кепка','Аптечка','Powerbank','Наушники','Худи на вечер'] },
        business: { name: 'Деловая', emoji: '💼', c1: '#c084fc', c2: '#7e5bef', ring: '#7e5bef',
            items: ['Деловой костюм','Рубашки (2 шт.)','Ноутбук + зарядка','Визитки','Документы / паспорт','Блокнот и ручка','Туфли','Ремень','Презентация на флешке','Гель для бритья'] },
        camping: { name: 'Поход', emoji: '🏕️', c1: '#4ecb71', c2: '#2f9c53', ring: '#2f9c53',
            items: ['Палатка','Спальный мешок','Коврик (пенка)','Фонарик','Спички / зажигалка','Термос','Нож','Репеллент от насекомых','Дождевик','Треккинговые ботинки','Аптечка','Запас еды'] },
        city: { name: 'Город', emoji: '🌆', c1: '#ff6b8a', c2: '#d6336c', ring: '#d6336c',
            items: ['Удобная обувь','Рюкзак / сумка','Карта / навигатор','Powerbank','Зарядка для телефона','Дождевик / зонт','Бутылка для воды','Наушники','Аптечка','Документы'] }
    };

    var COLOR_PALETTES = [
        { c1: '#ffb347', c2: '#ff7e5f', ring: '#ff7e5f' }, { c1: '#c084fc', c2: '#7e5bef', ring: '#7e5bef' },
        { c1: '#4ecb71', c2: '#2f9c53', ring: '#2f9c53' }, { c1: '#ff6b8a', c2: '#d6336c', ring: '#d6336c' },
        { c1: '#5ec7ff', c2: '#3a86ff', ring: '#3a86ff' }, { c1: '#ffd166', c2: '#f4a261', ring: '#f4a261' },
        { c1: '#a0e7e5', c2: '#3aafa9', ring: '#3aafa9' }, { c1: '#ff8fab', c2: '#c94c7a', ring: '#c94c7a' },
        { c1: '#f4a261', c2: '#8b5e3c', ring: '#8b5e3c' }, { c1: '#b4a0e5', c2: '#6a4c93', ring: '#6a4c93' },
        { c1: '#ff9e7d', c2: '#e63946', ring: '#e63946' }, { c1: '#7ee8fa', c2: '#2c73d2', ring: '#2c73d2' }
    ];

    var LIST_COLOR_PALETTES = [
        { c1: '#a8e6cf', c2: '#56c596', ring: '#56c596' }, { c1: '#c8b6e2', c2: '#8b6fc4', ring: '#8b6fc4' },
        { c1: '#ffd3b6', c2: '#ff9a76', ring: '#ff9a76' }, { c1: '#b8dff0', c2: '#5aa9d6', ring: '#5aa9d6' },
        { c1: '#f8c8d8', c2: '#d97ba0', ring: '#d97ba0' }, { c1: '#ffe9b8', c2: '#f4c462', ring: '#f4c462' },
        { c1: '#a2d5d5', c2: '#4a9d9d', ring: '#4a9d9d' }, { c1: '#e8b796', c2: '#c17a4e', ring: '#c17a4e' },
        { c1: '#c9d6a3', c2: '#8ba356', ring: '#8ba356' }, { c1: '#d5c3e8', c2: '#9b7bc4', ring: '#9b7bc4' },
        { c1: '#e0d5c7', c2: '#b09b82', ring: '#b09b82' }, { c1: '#c5cdd6', c2: '#7d8a99', ring: '#7d8a99' }
    ];

    var LIST_EMOJI_CHOICES = ['👕','👖','👟','🧥','🎒','📱','💻','🎧','🔌','🧴','🪥','💊','🩹','🛂','📄','💳','📖','✏️','🍫','🧸'];
    var EMOJI_CHOICES = ['🎒','🧳','✈️','🚗','🏔️','🌊','🎿','🚴','🎣','🍕','🎉','💼','🏖️','🏕️','🌆','🚢','🐕','🎨','📚','🎵'];
    var CAT_EMOJI = ['📦','🍔','🎮','⚽','🎸','🐕','👶','💊','💻','🎨','📚','🚲','🎁','🧸','🛠️','🌱'];

    var WEATHER_CODES = {
        0:{icon:'☀️',desc:'Ясно'},1:{icon:'🌤️',desc:'Преим. ясно'},2:{icon:'⛅',desc:'Переменная облачность'},3:{icon:'☁️',desc:'Пасмурно'},
        45:{icon:'🌫️',desc:'Туман'},48:{icon:'🌫️',desc:'Туман с инеем'},51:{icon:'🌦️',desc:'Слабая морось'},53:{icon:'🌦️',desc:'Морось'},
        55:{icon:'🌧️',desc:'Сильная морось'},61:{icon:'🌧️',desc:'Небольшой дождь'},63:{icon:'🌧️',desc:'Дождь'},65:{icon:'🌧️',desc:'Сильный дождь'},
        71:{icon:'🌨️',desc:'Небольшой снег'},73:{icon:'🌨️',desc:'Снег'},75:{icon:'❄️',desc:'Сильный снег'},80:{icon:'🌦️',desc:'Ливень'},
        81:{icon:'🌧️',desc:'Сильный ливень'},82:{icon:'⛈️',desc:'Очень сильный ливень'},95:{icon:'⛈️',desc:'Гроза'},96:{icon:'⛈️',desc:'Гроза с градом'}
    };

    var WHATS_NEW = {
        emoji: '✨',
        title: 'Что нового',
        subtitle: 'Обновление v2.0.4',
        color1: '#ff9a5a', color2: '#ff6b8a',
        items: [
            { icon: '🔄', title: 'Что нового — теперь по версиям', desc: 'Карточка появляется при каждом обновлении приложения' },
            { icon: '✈️', title: 'Создание своего типа поездки', desc: 'Свои названия, яркие иконки и цвета — отдельно от списков' },
            { icon: '📋', title: 'Списки и типы разделены', desc: 'Списки — во вкладке «Списки», типы — при создании поездки' },
            { icon: '🎨', title: 'Разные иконки и цвета', desc: 'Типы — яркие, списки — пастельные. Не запутаешься' }
        ],
        minor: 'Мелкие исправления и оптимизации'
    };

    var TIPS_CATEGORIES = [
        { id: 'packing', name: 'Упаковка', emoji: '🧳', color1: '#ff9a5a', color2: '#ff6b8a', desc: 'Как упаковать чемодан',
          tips: [
            { icon: '👕', text: '<strong>Скручивайте одежду в рулоны</strong> — экономит место и меньше мнётся' },
            { icon: '👟', text: '<strong>Обувь — вниз, носки внутрь.</strong> Так они не деформируются и заполняют пустоты' },
            { icon: '🧴', text: 'Жидкости <strong>в отдельный зип-пакет</strong> + пищевая плёнка под крышку' },
            { icon: '👖', text: '<strong>Тяжёлое — на дно</strong> (у колесиков). Так чемодан устойчив и не переворачивается' },
            { icon: '🎒', text: 'Мелочи и провода — в <strong>маленькие мешочки</strong> по типам, чтобы не путались' },
            { icon: '🪥', text: '<strong>Зубную щётку в колпачок</strong> — гигиеничнее и не пачкает сумку' }
          ] },
        { id: 'docs', name: 'Документы', emoji: '📄', color1: '#5ec7ff', color2: '#3a86ff', desc: 'Что взять из документов',
          tips: [
            { icon: '🛂', text: 'Паспорт + <strong>копия в отдельном месте</strong> (и фото в облаке)' },
            { icon: '✈️', text: 'Посадочные и брони — <strong>скриншот + распечатка</strong>, в аэропорту пригодится' },
            { icon: '💳', text: '<strong>2 разные карты</strong> в разных сумках + немного наличных' },
            { icon: '🩺', text: 'Медстраховка для заграницы — <strong>распечатайте</strong>, иногда просят бумажный вариант' },
            { icon: '🎫', text: 'Билеты на поезд/автобус <strong>в офлайн-доступе</strong> — сеть может пропасть' },
            { icon: '📱', text: 'Запишите <strong>номер посольства</strong> на случай проблем за рубежом' }
          ] },
        { id: 'tech', name: 'Техника', emoji: '📱', color1: '#a06bff', color2: '#6b8cff', desc: 'Про гаджеты в дороге',
          tips: [
            { icon: '🔌', text: '<strong>Один powerbank вместо пяти зарядок.</strong> 20000 мАч хватает на 3–4 дня' },
            { icon: '🧵', text: 'Провода <strong>скрепите резинками</strong> или в стяжки — не запутаются в сумке' },
            { icon: '🎧', text: 'Наушники <strong>в отдельном кейсе</strong>, чтобы не поцарапать в кармане' },
            { icon: '💻', text: 'Ноутбук — <strong>в мягкий чехол</strong>, отдельно от жидкостей и обуви' },
            { icon: '🔋', text: '<strong>Отключите авто-синк</strong> в роуминге: телефон проживёт вдвое дольше' },
            { icon: '🔌', text: '<strong>Универсальный переходник</strong> пригодится в любой стране' }
          ] },
        { id: 'clothes', name: 'Одежда', emoji: '👕', color1: '#4ecb71', color2: '#2f9c53', desc: 'Как собрать гардероб',
          tips: [
            { icon: '🎨', text: '<strong>Правило капсулы:</strong> 3 низа + 3 верха + 1 куртка = 9 образов' },
            { icon: '👖', text: 'Возьмите <strong>2 пары обуви максимум</strong>: одна в дорогу, вторая в чемодан' },
            { icon: '🧥', text: 'В холодный климат — <strong>слоями</strong>: термобельё + флиска + куртка' },
            { icon: '🌧️', text: 'В дождь спасает <strong>компактный дождевик</strong> размером с кулак' },
            { icon: '👕', text: 'Тёмные цвета <strong>практичнее в дороге</strong>: меньше видны пятна' },
            { icon: '👙', text: 'Носки и нижнее бельё — <strong>+1 запасной комплект</strong> на всякий случай' }
          ] },
        { id: 'security', name: 'Безопасность', emoji: '🔒', color1: '#d6336c', color2: '#ff5e8a', desc: 'Как защитить имущество',
          tips: [
            { icon: '🎒', text: 'Рюкзак — <strong>на грудь в толпе</strong>. За спиной легко стать целью' },
            { icon: '💰', text: 'Деньги — <strong>в 2-3 местах</strong>: кошелёк, носки, внутренний карман' },
            { icon: '📷', text: 'Фото содержимого чемодана <strong>поможет при потере</strong> — сохраните в облако' },
            { icon: '🔐', text: 'На чемодане — <strong>кодовый замок</strong>, не простой навесной' },
            { icon: '📞', text: '<strong>Скиньте маршрут близким</strong>: отели, рейсы, время прилёта' },
            { icon: '🚕', text: 'Такси только <strong>официальное</strong>, не соглашайтесь на «быстрее и дешевле»' }
          ] },
        { id: 'lifehacks', name: 'Лайфхаки', emoji: '💡', color1: '#ffd166', color2: '#f4a261', desc: 'Полезные мелочи',
          tips: [
            { icon: '🧊', text: 'Замороженная бутылка воды = <strong>и еда, и охлаждение</strong> для сумки' },
            { icon: '🧴', text: 'Дезодорант-спрей <strong>не протечёт</strong> в отличие от роликового' },
            { icon: '🧦', text: 'В обувь положите <strong>носки или бельё</strong> — экономия места' },
            { icon: '🍫', text: 'Сникерс в кармане спасёт <strong>от голода в дороге</strong>, если нет кафе' },
            { icon: '💊', text: 'Мини-аптечка: <strong>обезболивающее, пластырь, активированный уголь</strong>' },
            { icon: '🧴', text: 'Пробники косметики <strong>вместо больших флаконов</strong>: легче и не жалко выкинуть' },
            { icon: '📌', text: 'Булавка на молнии — <strong>быстрый «замок»</strong> от воришек в метро' },
            { icon: '🛍️', text: 'Пустой складной мешок <strong>для сувениров</strong> занимает мало места' }
          ] }
    ];

    var ONBOARDING_SLIDES = [
        {icon:'🧳',bg:'🧳',title:'Добро пожаловать в byBag',text:'Ваш личный помощник для сбора багажа и планирования поездок. Никогда не забудьте важное.'},
        {icon:'✈️',bg:'✈️',title:'Создавайте поездки',text:'Выбирайте базовый тип + свои списки. Объединяйте до 2 активных поездок.'},
        {icon:'👆',bg:'✅',title:'Собирайте багаж',text:'Отмечайте вещи одним касанием.',list:[{icon:'👈',text:'Свайп влево — удалить вещь'},{icon:'👉',text:'Свайп вправо — отметить или сбросить'},{icon:'🔍',text:'Поиск по списку вещей'}]},
        {icon:'💡',bg:'💡',title:'Советы по упаковке',text:'Полезное для поездок:',list:[{icon:'🧳',text:'Как упаковать чемодан'},{icon:'📄',text:'Документы и визы'},{icon:'🔒',text:'Безопасность в дороге'},{icon:'💡',text:'Полезные лайфхаки'}]},
        {icon:'🏆',bg:'🏆',title:'Статистика и достижения',text:'Собирайте награды, следите за прогрессом и делайте каждую поездку лучше.',list:[{icon:'🏆',text:'Достижения за поездки'},{icon:'📊',text:'Личная статистика'},{icon:'🎨',text:'Свои списки и категории'}]}
    ];

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

    // ============ ДАННЫЕ ============
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

    // ============ СОВЕТЫ ============
    function buildTips() {
        try {
            var slot = $('tipsSlot'); if (!slot) return;
            slot.innerHTML = '';
            var wrap = document.createElement('div');
            wrap.className = 'tips-wrap';
            wrap.innerHTML = '<div class="tips-title">Советы</div>';
            var row = document.createElement('div');
            row.className = 'tips-row';

            if (!viewedWhatsNew) row.appendChild(buildWhatsNewTipItem());

            TIPS_CATEGORIES.forEach(function(cat, idx) {
                var item = document.createElement('div');
                item.className = 'tip-item';
                var ring = document.createElement('div');
                ring.className = 'tip-ring';
                var inner = document.createElement('div');
                inner.className = 'tip-inner';
                inner.style.background = 'linear-gradient(135deg,' + cat.color1 + ',' + cat.color2 + ')';
                inner.textContent = cat.emoji;
                ring.appendChild(inner);
                var label = document.createElement('div');
                label.className = 'tip-label';
                label.textContent = cat.name;
                item.appendChild(ring);
                item.appendChild(label);
                item.addEventListener('click', function() { openTipViewer(idx); });
                row.appendChild(item);
            });

            if (viewedWhatsNew) row.appendChild(buildWhatsNewTipItem());

            wrap.appendChild(row);
            slot.appendChild(wrap);
        } catch (e) { bbLogError(3005, 'Ошибка рендера советов', { stack: e.stack }); }
    }

    function buildWhatsNewTipItem() {
        var item = document.createElement('div');
        item.className = 'tip-item' + (!viewedWhatsNew ? ' whats-new-active' : '');
        var ring = document.createElement('div');
        ring.className = 'tip-ring' + (!viewedWhatsNew ? ' whats-new' : '');
        if (!viewedWhatsNew) ring.style.background = 'conic-gradient(from 180deg,#ff9a5a,#ff6b8a,#c084fc,#ff9a5a)';
        var inner = document.createElement('div');
        inner.className = 'tip-inner';
        inner.style.background = 'linear-gradient(135deg,' + WHATS_NEW.color1 + ',' + WHATS_NEW.color2 + ')';
        inner.textContent = '🧳';
        ring.appendChild(inner);
        if (!viewedWhatsNew) {
            var badge = document.createElement('div');
            badge.className = 'tip-badge-new';
            badge.textContent = 'NEW';
            item.appendChild(badge);
        }
        var label = document.createElement('div');
        label.className = 'tip-label';
        label.textContent = 'Что нового';
        item.appendChild(ring);
        item.appendChild(label);
        item.addEventListener('click', function() { openWhatsNewViewer(); });
        return item;
    }

    function openWhatsNewViewer() {
        tipsMode = 'whats-new';
        var v = $('tipViewer'); if (!v) return;
        v.classList.add('active');
        resetUIBlocks();
        var bg = $('tipViewerBg'); if (bg) bg.style.background = 'linear-gradient(135deg,' + WHATS_NEW.color1 + ',' + WHATS_NEW.color2 + ')';
        var deco = $('tipViewerDeco'); if (deco) deco.textContent = WHATS_NEW.emoji;
        var avatar = $('tipViewerAvatar'); if (avatar) avatar.textContent = WHATS_NEW.emoji;
        var title = $('tipViewerTitle'); if (title) title.textContent = WHATS_NEW.title;
        var sub = $('tipViewerSub'); if (sub) sub.textContent = WHATS_NEW.subtitle;
        renderWhatsNewContent();
    }

    function renderWhatsNewContent() {
        var content = $('tipViewerContent'); if (!content) return;
        content.innerHTML = '';
        var hero = document.createElement('div');
        hero.className = 'tip-hero';
        hero.innerHTML = '<div class="tip-hero-emoji">' + WHATS_NEW.emoji + '</div><h2>' + escapeHtml(WHATS_NEW.title) + '</h2><p>' + escapeHtml(WHATS_NEW.subtitle) + '</p>';
        content.appendChild(hero);
        var cards = document.createElement('div');
        cards.className = 'tip-cards';
        WHATS_NEW.items.forEach(function(it) {
            var c = document.createElement('div');
            c.className = 'tip-card';
            c.innerHTML = '<div class="tip-card-icon">' + it.icon + '</div><div class="tip-card-text"><strong>' + escapeHtml(it.title) + '</strong>' + escapeHtml(it.desc) + '</div>';
            cards.appendChild(c);
        });
        if (WHATS_NEW.minor) {
            var minor = document.createElement('div');
            minor.style.cssText = 'text-align:center;color:rgba(255,255,255,.7);font-size:12px;font-weight:600;padding:16px 20px 0';
            minor.textContent = WHATS_NEW.minor;
            cards.appendChild(minor);
        }
        content.appendChild(cards);
    }

    function openTipViewer(idx) {
        tipsMode = 'cat';
        currentTipIdx = idx;
        var cat = TIPS_CATEGORIES[idx]; if (!cat) return;
        var v = $('tipViewer'); if (!v) return;
        v.classList.add('active');
        resetUIBlocks();
        var bg = $('tipViewerBg'); if (bg) bg.style.background = 'linear-gradient(135deg,' + cat.color1 + ',' + cat.color2 + ')';
        var deco = $('tipViewerDeco'); if (deco) deco.textContent = cat.emoji;
        var avatar = $('tipViewerAvatar'); if (avatar) avatar.textContent = cat.emoji;
        var title = $('tipViewerTitle'); if (title) title.textContent = cat.name;
        var sub = $('tipViewerSub'); if (sub) sub.textContent = cat.desc;
        renderTipContent(cat, idx);
        var nav = document.createElement('div');
        nav.className = 'tip-nav';
        TIPS_CATEGORIES.forEach(function(c, i) {
            var d = document.createElement('div');
            d.className = 'tip-nav-dot' + (i === idx ? ' active' : '');
            d.addEventListener('click', function() { openTipViewer(i); });
            nav.appendChild(d);
        });
        var content = $('tipViewerContent');
        if (content) content.appendChild(nav);
        viewedTips[cat.id] = Date.now();
        saveViewedTips();
    }

    function renderTipContent(cat, idx) {
        var content = $('tipViewerContent'); if (!content) return;
        content.innerHTML = '';
        var hero = document.createElement('div');
        hero.className = 'tip-hero';
        hero.innerHTML = '<div class="tip-hero-emoji">' + cat.emoji + '</div><h2>' + escapeHtml(cat.name) + '</h2><p>' + escapeHtml(cat.desc) + '</p>';
        content.appendChild(hero);
        var cards = document.createElement('div');
        cards.className = 'tip-cards';
        cat.tips.forEach(function(tip) {
            var c = document.createElement('div');
            c.className = 'tip-card';
            c.innerHTML = '<div class="tip-card-icon">' + tip.icon + '</div><div class="tip-card-text">' + tip.text + '</div>';
            cards.appendChild(c);
        });
        content.appendChild(cards);
    }

    function closeTipViewer() {
        var v = $('tipViewer'); if (v) v.classList.remove('active');
        if (tipsMode === 'whats-new' && !viewedWhatsNew) saveViewedWhatsNew();
        tipsMode = 'cat';
        resetUIBlocks();
        buildTips();
    }

    // ============ ГЛАВНАЯ ============
    function renderHome() {
        try {
            buildTips();
            var ws = $('widgetSlot'); if (!ws) return;
            ws.innerHTML = '';
            if (activeTrips.length === 0) ws.appendChild(buildEmptyState());
            else ws.appendChild(buildTripsCarousel());
            renderHistory();
        } catch (e) { bbLogError(3001, 'Ошибка рендера главной', { stack: e.stack }); }
    }

    function buildEmptyState() {
        var div = document.createElement('div');
        div.className = 'empty-hero';
        div.innerHTML = '<div class="empty-icon">🧳</div><h2>Ещё нет поездок</h2><p>Создайте первую поездку и соберите багаж без хлопот</p><div class="empty-cta"><span class="plus">+</span> Создать поездку</div>';
        div.addEventListener('click', openTypeModal);
        return div;
    }

    function buildTripsCarousel() {
        var wrap = document.createElement('div');
        wrap.className = 'trips-carousel';
        var track = document.createElement('div');
        track.className = 'trips-track';
        track.id = 'tripsTrack';
        activeTrips.forEach(function(trip) { track.appendChild(buildWidget(trip)); });
        var canAdd = activeTrips.length < MAX_ACTIVE_TRIPS;
        if (canAdd) {
            var addSlide = document.createElement('div');
            addSlide.className = 'main-widget add-trip-slide';
            addSlide.innerHTML = '<div class="add-trip-circle">+</div><div class="add-trip-title">Добавить поездку</div><div class="add-trip-desc">Можно вести до ' + MAX_ACTIVE_TRIPS + ' поездок</div>';
            addSlide.addEventListener('click', function() { openTypeModal(); });
            track.appendChild(addSlide);
        }
        wrap.appendChild(track);

        var totalSlides = activeTrips.length + (canAdd ? 1 : 0);
        if (totalSlides > 1) {
            var dots = document.createElement('div');
            dots.className = 'trips-dots';
            for (var i = 0; i < totalSlides; i++) {
                (function(i) {
                    var d = document.createElement('div');
                    d.className = 'tdot' + (i === currentTripIndex ? ' active' : '');
                    d.addEventListener('click', function() { goToTrip(i); });
                    dots.appendChild(d);
                })(i);
            }
            wrap.appendChild(dots);
            if (!localStorage.getItem('bybag_swipe_hint_shown')) {
                var hint = document.createElement('div');
                hint.className = 'swipe-hint';
                hint.textContent = '👈 Свайп для переключения 👉';
                wrap.appendChild(hint);
                try { localStorage.setItem('bybag_swipe_hint_shown', '1'); } catch (e) {}
            }
        }
        setTimeout(function() {
            var tr = $('tripsTrack');
            if (tr) tr.style.transform = 'translateX(-' + (currentTripIndex * 100) + '%)';
        }, 0);
        bindCarouselSwipe(wrap);
        return wrap;
    }

    function goToTrip(idx) {
        var canAdd = activeTrips.length < MAX_ACTIVE_TRIPS;
        var total = activeTrips.length + (canAdd ? 1 : 0);
        if (idx < 0 || idx >= total) return;
        currentTripIndex = idx;
        var tr = $('tripsTrack');
        if (tr) tr.style.transform = 'translateX(-' + (idx * 100) + '%)';
        document.querySelectorAll('.trips-dots .tdot').forEach(function(d, i) { d.classList.toggle('active', i === idx); });
        vibrate();
    }

    function bindCarouselSwipe(el) {
        var canAdd = activeTrips.length < MAX_ACTIVE_TRIPS;
        var total = activeTrips.length + (canAdd ? 1 : 0);
        if (total < 2) return;
        var startX = 0, startY = 0, isDown = false, isHoriz = false, track = null;
        el.addEventListener('touchstart', function(e) {
            if (e.target.closest('.hero-close')) return;
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
            isDown = true; isHoriz = false;
            track = $('tripsTrack');
            if (track) track.style.transition = 'none';
        }, { passive: true });
        el.addEventListener('touchmove', function(e) {
            if (!isDown || !track) return;
            var dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
            if (!isHoriz && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) isHoriz = true;
            if (!isHoriz) return;
            track.style.transform = 'translateX(calc(' + (-currentTripIndex * 100) + '% + ' + dx + 'px))';
        }, { passive: true });
        el.addEventListener('touchend', function(e) {
            if (!isDown || !track) return;
            isDown = false;
            var dx = e.changedTouches[0].clientX - startX;
            var threshold = el.offsetWidth * SWIPE_THRESHOLD;
            track.style.transition = '';
            if (isHoriz && Math.abs(dx) > threshold) {
                if (dx < 0 && currentTripIndex < total - 1) goToTrip(currentTripIndex + 1);
                else if (dx > 0 && currentTripIndex > 0) goToTrip(currentTripIndex - 1);
                else goToTrip(currentTripIndex);
            } else goToTrip(currentTripIndex);
        }, { passive: true });
    }

    function buildWidget(trip) {
        var s = getTripStats(trip);
        var remaining = s.total - s.done;
        var complete = s.percent === 100 && s.total > 0;
        var radius = 40, circ = 2 * Math.PI * radius;
        var offset = circ - (s.percent / 100) * circ;
        var ringColor = complete ? '#2f9c53' : (trip.ring || '#ff7e5f');
        var cdText = trip.startDate ? countdown(trip.startDate) : '';
        var widget = document.createElement('div');
        widget.className = 'main-widget';
        widget.style.setProperty('--c1', trip.c1 || '#ffb347');
        widget.style.setProperty('--c2', trip.c2 || '#ff7e5f');
        widget.innerHTML =
            '<div class="widget-hero"><div class="bg-emoji">' + (trip.emoji || '🎒') + '</div>' +
                '<div class="hero-top"><div class="hero-label"><span class="dot"></span>Активная поездка</div><button type="button" class="hero-close">✕</button></div>' +
                '<div class="hero-title">' + (complete ? '<div class="complete-badge">✓ Всё собрано</div>' : '') +
                    '<h2>' + escapeHtml(trip.name || 'Поездка') + '</h2>' +
                    '<div class="hero-date">📅 ' + formatTripDate(trip) + (cdText ? '<span class="hero-countdown">' + cdText + '</span>' : '') + '</div>' +
                '</div></div>' +
            '<div class="widget-body"><div class="ring-wrap"><svg viewBox="0 0 100 100"><circle class="ring-track" cx="50" cy="50" r="' + radius + '"></circle><circle class="ring-fill" cx="50" cy="50" r="' + radius + '" stroke="' + ringColor + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"></circle></svg>' +
                '<div class="ring-center"><div class="ring-percent">' + s.percent + '<span class="sign">%</span></div></div></div>' +
                '<div class="widget-meta"><div class="meta-row"><span class="meta-key">Собрано</span><span class="meta-val done">' + s.done + ' / ' + s.total + '</span></div>' +
                '<div class="meta-row"><span class="meta-key">Осталось</span><span class="meta-val left">' + remaining + '</span></div></div></div>' +
            '<div class="widget-footer"><div class="mini-bar"><div class="fill" style="width:' + s.percent + '%;background:' + (complete ? 'linear-gradient(90deg,#4ecb71,#2f9c53)' : 'linear-gradient(90deg,' + (trip.c1 || '#ffb347') + ',' + (trip.c2 || '#ff7e5f') + ')') + '"></div></div>' +
                '<div class="tap-hint"><span>' + (complete ? 'Готово к отправлению 🎉' : 'Открыть список вещей') + '</span><span class="arrow">→</span></div></div>';
        widget.addEventListener('click', function(e) {
            if (e.target.closest('.hero-close')) return;
            var i = activeTrips.indexOf(trip);
            if (i !== -1) currentTripIndex = i;
            openChecklistPage();
        });
        var closeBtn = widget.querySelector('.hero-close');
        if (closeBtn) closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var i = activeTrips.indexOf(trip);
            if (i !== -1) currentTripIndex = i;
            if (confirm('Завершить поездку и перенести в статистику?')) completeActiveTrip();
        });
        return widget;
    }

    // ============ СПИСКИ ============
    function renderListsPage() {
        try {
            var cont = $('listsPageContent'); if (!cont) return;
            cont.innerHTML = '';
            var keys = Object.keys(customTypes);
            var header = document.createElement('div');
            header.className = 'lists-page-header';
            header.innerHTML = '<div class="lph-title">Мои списки</div><div class="lph-count">' + keys.length + ' ' + plural(keys.length, 'список', 'списка', 'списков') + '</div>';
            cont.appendChild(header);

            if (!keys.length) {
                var empty = document.createElement('div');
                empty.className = 'empty-hero';
                empty.style.marginTop = '0';
                empty.innerHTML = '<div class="empty-icon">📋</div><h2>Пока нет списков</h2><p>Создайте свой список вещей для быстрого добавления в поездки</p><div class="empty-cta"><span class="plus">+</span> Создать список</div>';
                empty.addEventListener('click', function() { startWizard(); });
                cont.appendChild(empty);
                return;
            }

            var grid = document.createElement('div');
            grid.className = 'lists-grid';
            keys.forEach(function(key) {
                var t = customTypes[key];
                var card = document.createElement('div');
                card.className = 'list-card';
                var head = document.createElement('div');
                head.className = 'list-card-head';
                head.style.background = 'linear-gradient(135deg,' + (t.c1 || '#a8e6cf') + ',' + (t.c2 || '#56c596') + ')';
                head.innerHTML = '<div class="lch-emoji">' + (t.emoji || '👕') + '</div><div class="lch-deco">' + (t.emoji || '👕') + '</div>';
                var body = document.createElement('div');
                body.className = 'list-card-body';
                body.innerHTML = '<div class="lcb-name">' + escapeHtml(t.name || 'Список') + '</div><div class="lcb-meta">' + t.items.length + ' ' + plural(t.items.length, 'вещь', 'вещи', 'вещей') + '</div>';
                var actions = document.createElement('div');
                actions.className = 'list-card-actions';
                var editBtn = document.createElement('button');
                editBtn.type = 'button'; editBtn.className = 'lca-btn edit';
                editBtn.innerHTML = '<span>✎</span> Изменить';
                editBtn.addEventListener('click', function(e) { e.stopPropagation(); openEditor(key); });
                var delBtn = document.createElement('button');
                delBtn.type = 'button'; delBtn.className = 'lca-btn del';
                delBtn.innerHTML = '🗑';
                delBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('Удалить список "' + t.name + '"?')) deleteCustomType(key);
                });
                actions.appendChild(editBtn); actions.appendChild(delBtn);
                card.appendChild(head); card.appendChild(body); card.appendChild(actions);
                card.addEventListener('click', function() { openEditor(key); });
                grid.appendChild(card);
            });
            cont.appendChild(grid);
        } catch (e) { bbLogError(3002, 'Ошибка рендера списков', { stack: e.stack }); }
    }

    function renderHistory() {
        try {
            var slot = $('historySlot'); if (!slot) return;
            slot.innerHTML = '';
            if (!history.length) return;
            var section = document.createElement('div');
            section.className = 'stats-section';
            section.innerHTML = '<div class="stats-title">История поездок</div>';
            history.forEach(function(h) {
                if (!h) return;
                var percent = h.total > 0 ? Math.round((h.done / h.total) * 100) : 0;
                var item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = '<div class="h-emoji">' + (h.emoji || '🎒') + '</div><div class="h-body"><div class="h-name">' + escapeHtml(h.name || 'Поездка') + '</div><div class="h-meta">' + (h.date || '') + ' · ' + (h.done || 0) + ' из ' + (h.total || 0) + ' вещей</div></div><div class="h-badge">' + percent + '%</div>';
                [['📤', function() { shareTrip(h); }], ['↻', function() { repeatTrip(h); }], ['✕', function() { deleteHistory(h.id); }]].forEach(function(pair) {
                    var b = document.createElement('button');
                    b.type = 'button'; b.className = 'icon-btn'; b.textContent = pair[0];
                    b.addEventListener('click', function(e) { e.stopPropagation(); pair[1](); });
                    item.appendChild(b);
                });
                section.appendChild(item);
            });
            slot.appendChild(section);
        } catch (e) { bbLogError(3006, 'Ошибка рендера истории', { stack: e.stack }); }
    }

    function shareTrip(trip) {
        var lines = ['🧳 ' + (trip.name || 'Поездка')];
        if (trip.date) lines.push('📅 ' + trip.date);
        lines.push('');
        var items = trip.fullItems || [];
        if (!items.length) lines.push('(нет списка вещей)');
        else {
            items.forEach(function(i) { var n = normalizeItem(i); lines.push((n.done ? '✅' : '☐') + ' ' + n.text + (n.qty > 1 ? ' ×' + n.qty : '')); });
            var dc = items.filter(function(i) { return normalizeItem(i).done; }).length;
            lines.push(''); lines.push('Собрано: ' + dc + ' из ' + items.length);
        }
        var text = lines.join('\n');
        if (navigator.share) navigator.share({ title: trip.name || 'byBag', text: text }).catch(function() {});
        else {
            try {
                var ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
                showToast('Скопировано');
            } catch (e) { showToast('Не удалось'); }
        }
    }

    function shareActiveTrip() {
        var trip = getCurrentTrip();
        if (!trip) return;
        var s = getTripStats(trip);
        shareTrip({ name: trip.name, date: trip.date, total: s.total, done: s.done, fullItems: trip.items.map(function(i) { return { text: i.text, qty: i.qty, note: i.note, category: i.category, done: i.done }; }) });
    }

    function repeatTrip(h) {
        if (activeTrips.length >= MAX_ACTIVE_TRIPS) { showToast('Сначала завершите одну из поездок'); return; }
        var type = getType(h.type);
        var items = (h.fullItems && h.fullItems.length) ? h.fullItems : (type ? type.items : null);
        if (!items || !items.length) { showToast('Не удалось восстановить'); return; }
        activeTrips.push({
            id: Date.now(), type: h.type || 'rest', name: h.name || 'Поездка',
            emoji: h.emoji || (type ? type.emoji : '🎒'),
            c1: type ? type.c1 : '#ffb347', c2: type ? type.c2 : '#ff7e5f', ring: type ? type.ring : '#ff7e5f',
            date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
            startDate: null, endDate: null, daysCount: 3, city: '',
            items: items.map(function(i) { var n = normalizeItem(i); n.done = false; return n; })
        });
        currentTripIndex = activeTrips.length - 1;
        saveActive(); renderHome(); vibrate();
        showToast('Поездка создана заново!');
    }

    // ============ ТИП ПОЕЗДКИ ============
    function renderTypeGrid() {
        var grid = $('typeGrid'); if (!grid) return;
        grid.innerHTML = '';
        function makeOption(key, t) {
            var div = document.createElement('div');
            div.className = 'type-option' + (selectedType === key ? ' selected' : '');
            div.innerHTML = '<span class="checkmark">✓</span><span class="emoji">' + (t.emoji || '🎒') + '</span><span class="name">' + escapeHtml(t.name || 'Тип') + '</span>';
            div.addEventListener('click', function(e) {
                e.stopPropagation();
                if (selectedType === key) { selectedType = null; }
                else { selectedType = key; }
                renderTypeGrid();
                updateCreateBtn();
            });
            grid.appendChild(div);
        }
        Object.keys(DEFAULT_TYPES).forEach(function(k) { makeOption(k, DEFAULT_TYPES[k]); });
        Object.keys(customTripTypes).forEach(function(k) { makeOption(k, customTripTypes[k]); });
        var createDiv = document.createElement('div');
        createDiv.className = 'type-option create-new';
        createDiv.innerHTML = '<span class="emoji">➕</span><span class="name">Создать свой</span>';
        createDiv.addEventListener('click', function() { closeModal('typeModal'); startTripWizard(); });
        grid.appendChild(createDiv);
    }

    function renderListPicker() {
        var p = $('listPicker'); if (!p) return;
        p.innerHTML = '';
        var keys = Object.keys(customTypes);
        if (!keys.length) {
            p.innerHTML = '<div class="list-picker-empty">Нет своих списков. Создайте в разделе «Списки» или нажмите «Создать свой» выше.</div>';
            return;
        }
        keys.forEach(function(key) {
            var t = customTypes[key];
            var isSel = selectedListIds.indexOf(key) !== -1;
            var item = document.createElement('div');
            item.className = 'list-picker-item' + (isSel ? ' selected' : '');
            item.innerHTML =
                '<div class="lp-emoji">' + (t.emoji || '👕') + '</div>' +
                '<div class="lp-body"><div class="lp-name">' + escapeHtml(t.name || 'Список') + '</div><div class="lp-meta">' + t.items.length + ' ' + plural(t.items.length, 'вещь', 'вещи', 'вещей') + '</div></div>' +
                '<div class="lp-check">✓</div>';
            item.addEventListener('click', function() {
                var i = selectedListIds.indexOf(key);
                if (i === -1) selectedListIds.push(key);
                else selectedListIds.splice(i, 1);
                renderListPicker();
                updateCreateBtn();
            });
            p.appendChild(item);
        });
    }

    function updateCreateBtn() {
        var cb = $('createBtn'); if (!cb) return;
        cb.disabled = (!selectedType && !selectedListIds.length);
    }

    function openTypeModal() {
        if (activeTrips.length >= MAX_ACTIVE_TRIPS) { showToast('Максимум ' + MAX_ACTIVE_TRIPS + ' активные поездки'); return; }
        selectedType = null;
        selectedListIds = [];
        ['tripName','tripStartDate','tripEndDate','tripCity'].forEach(function(id) { var el = $(id); if (el) el.value = ''; });
        updateCreateBtn();
        renderTypeGrid();
        renderListPicker();
        openModal('typeModal');
    }

    function buildCombinedItems() {
        var sources = [];
        if (selectedType) {
            var type = getType(selectedType);
            if (type && type.items && type.items.length) sources.push({ id: selectedType, name: type.name, emoji: type.emoji, items: type.items });
        }
        selectedListIds.forEach(function(listId) {
            var t = customTypes[listId];
            if (t && t.items && t.items.length) sources.push({ id: listId, name: t.name, emoji: t.emoji, items: t.items });
        });

        var merged = {}, order = [];
        sources.forEach(function(src) {
            src.items.forEach(function(raw) {
                var it = normalizeItem(raw);
                var key = it.text.toLowerCase().trim();
                if (merged[key]) {
                    merged[key].qty += it.qty;
                    if (src.name && merged[key].from.indexOf(src.name) === -1) {
                        merged[key].from += (merged[key].from ? ', ' : '') + src.name;
                    }
                } else {
                    merged[key] = { text: it.text, qty: it.qty, note: it.note, category: it.category, from: src.name || '', done: false };
                    order.push(key);
                }
            });
        });
        return { items: order.map(function(k) { return merged[k]; }), sources: sources };
    }

    function createTrip() {
        if (activeTrips.length >= MAX_ACTIVE_TRIPS) return;
        if (!selectedType && !selectedListIds.length) { showToast('Выберите тип или список'); return; }
        var combined = buildCombinedItems();
        if (!combined.items.length) { showToast('В выбранных источниках нет вещей'); return; }

        var visual = { emoji: '🎒', c1: '#ffb347', c2: '#ff7e5f', ring: '#ff7e5f' };
        var defaultName = '';
        if (selectedType) {
            var t = getType(selectedType);
            if (t) {
                visual = { emoji: t.emoji, c1: t.c1, c2: t.c2, ring: t.ring };
                defaultName = t.name;
            }
        } else {
            var firstList = customTypes[selectedListIds[0]];
            if (firstList) {
                visual = { emoji: firstList.emoji || '👕', c1: firstList.c1 || '#a8e6cf', c2: firstList.c2 || '#56c596', ring: firstList.ring || '#56c596' };
                defaultName = firstList.name;
            }
        }

        var userInputName = (($('tripName') || {}).value || '').trim();
        var finalName = userInputName;
        if (!finalName) {
            if (selectedListIds.length > 1) finalName = defaultName + ' +' + (selectedListIds.length - 1);
            else if (selectedType && selectedListIds.length === 1) finalName = defaultName + ' + ' + customTypes[selectedListIds[0]].name;
            else if (selectedListIds.length === 1 && !selectedType) finalName = customTypes[selectedListIds[0]].name;
            else finalName = defaultName || 'Поездка';
        }

        var startDate = ($('tripStartDate') || {}).value || null;
        var endDate = ($('tripEndDate') || {}).value || null;
        var daysCount = 3;
        if (startDate && endDate) {
            try {
                var d1 = new Date(startDate), d2 = new Date(endDate);
                daysCount = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
            } catch (e) {}
        }

        activeTrips.push({
            id: Date.now(), type: selectedType || null, listIds: selectedListIds.slice(),
            name: finalName, emoji: visual.emoji, c1: visual.c1, c2: visual.c2, ring: visual.ring,
            date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
            startDate: startDate, endDate: endDate, daysCount: daysCount,
            city: (($('tripCity') || {}).value || '').trim(),
            items: combined.items
        });
        currentTripIndex = activeTrips.length - 1;
        saveActive();
        closeModal('typeModal');
        renderHome(); renderProfile(); vibrate();
        showToast('Поездка создана!');
    }

    // ============ ПИКЕРЫ ============
    function renderEmojiPicker(pickerId, current, choices, onSelect) {
        var p = $(pickerId); if (!p) return;
        p.innerHTML = '';
        choices.forEach(function(em) {
            var d = document.createElement('div');
            d.className = 'emoji-choice' + (current === em ? ' selected' : '');
            d.textContent = em;
            d.addEventListener('click', function() { onSelect(em); });
            p.appendChild(d);
        });
    }
    function renderColorPicker(pickerId, currentIdx, palettes, onSelect) {
        var p = $(pickerId); if (!p) return;
        p.innerHTML = '';
        palettes.forEach(function(c, i) {
            var d = document.createElement('div');
            d.className = 'color-choice' + (currentIdx === i ? ' selected' : '');
            d.style.background = 'linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ')';
            d.addEventListener('click', function() { onSelect(i); });
            p.appendChild(d);
        });
    }

    // ============ МАСТЕР СПИСКА ============
    function pickWizEmoji(em) { wiz.emoji = em; renderEmojiPicker('wiz1EmojiPicker', wiz.emoji, LIST_EMOJI_CHOICES, pickWizEmoji); updateWiz1Preview(); }
    function pickWizColor(i) { wiz.colorIdx = i; renderColorPicker('wiz1ColorPicker', wiz.colorIdx, LIST_COLOR_PALETTES, pickWizColor); updateWiz1Preview(); }
    function startWizard() {
        wiz = { name: '', emoji: '👕', colorIdx: 0, items: [] };
        var ni = $('wiz1NameInput'); if (ni) ni.value = '';
        var nb = $('wiz1NextBtn'); if (nb) nb.disabled = true;
        renderEmojiPicker('wiz1EmojiPicker', wiz.emoji, LIST_EMOJI_CHOICES, pickWizEmoji);
        renderColorPicker('wiz1ColorPicker', wiz.colorIdx, LIST_COLOR_PALETTES, pickWizColor);
        updateWiz1Preview();
        openModal('wizardStep1');
    }
    function updateWiz1Preview() {
        var c = LIST_COLOR_PALETTES[wiz.colorIdx];
        var name = (($('wiz1NameInput') || {}).value || '').trim() || 'Название списка';
        var pr = $('wiz1Preview'); if (pr) pr.style.background = 'linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ')';
        var e = $('wiz1Emoji'); if (e) e.textContent = wiz.emoji;
        var n = $('wiz1Name'); if (n) n.textContent = name;
        var cn = $('wiz1Count'); if (cn) cn.textContent = wiz.items.length + ' ' + plural(wiz.items.length, 'вещь', 'вещи', 'вещей');
    }
    function wiz1Next() {
        var name = (($('wiz1NameInput') || {}).value || '').trim();
        if (!name) { showToast('Введите название'); return; }
        wiz.name = name;
        closeModal('wizardStep1');
        openWiz2();
    }
    function openWiz2() {
        var c = LIST_COLOR_PALETTES[wiz.colorIdx];
        var pr = $('wiz2Preview'); if (pr) pr.style.background = 'linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ')';
        var e = $('wiz2Emoji'); if (e) e.textContent = wiz.emoji;
        var n = $('wiz2Name'); if (n) n.textContent = wiz.name;
        var ni = $('wiz2NewItem'); if (ni) ni.value = '';
        renderWiz2Items();
        openModal('wizardStep2');
    }
    function renderWiz2Items() {
        var ed = $('wiz2ItemsEditor'); if (!ed) return;
        ed.innerHTML = '';
        if (!wiz.items.length) {
            var emp = document.createElement('div');
            emp.style.cssText = 'text-align:center;padding:20px;color:var(--text-3);font-size:13.5px;font-weight:500';
            emp.textContent = 'Пока пусто. Добавьте вещи ниже.';
            ed.appendChild(emp);
        } else wiz.items.forEach(function(it, i) { ed.appendChild(buildAdvancedRow(it, i, 'wizard')); });
        var cn = $('wiz2Count'); if (cn) cn.textContent = wiz.items.length + ' ' + plural(wiz.items.length, 'вещь', 'вещи', 'вещей');
    }
    function wiz2AddQuick() {
        var v = (($('wiz2NewItem') || {}).value || '').trim();
        if (!v) return;
        wiz.items.push({ text: v, qty: 1, note: '', category: 'other' });
        $('wiz2NewItem').value = '';
        renderWiz2Items();
        $('wiz2NewItem').focus();
    }
    function wiz2Save() {
        if (!wiz.items.length) { showToast('Добавьте хотя бы одну вещь'); return; }
        var c = LIST_COLOR_PALETTES[wiz.colorIdx];
        var id = 'custom_' + Date.now();
        customTypes[id] = { name: wiz.name, emoji: wiz.emoji, c1: c.c1, c2: c.c2, ring: c.ring, items: wiz.items.slice(), builtin: false };
        saveCustomTypes();
        closeModal('wizardStep2');
        renderHome(); renderProfile(); renderListsPage(); vibrate();
        showToast('Список "' + wiz.name + '" создан!');
    }

    // ============ МАСТЕР ТИПА ============
    function pickTwizEmoji(em) { twiz.emoji = em; renderEmojiPicker('twiz1EmojiPicker', twiz.emoji, EMOJI_CHOICES, pickTwizEmoji); updateTwiz1Preview(); }
    function pickTwizColor(i) { twiz.colorIdx = i; renderColorPicker('twiz1ColorPicker', twiz.colorIdx, COLOR_PALETTES, pickTwizColor); updateTwiz1Preview(); }
    function startTripWizard() {
        twiz = { name: '', emoji: '🏖️', colorIdx: 0, items: [] };
        var ni = $('twiz1NameInput'); if (ni) ni.value = '';
        var nb = $('twiz1NextBtn'); if (nb) nb.disabled = true;
        renderEmojiPicker('twiz1EmojiPicker', twiz.emoji, EMOJI_CHOICES, pickTwizEmoji);
        renderColorPicker('twiz1ColorPicker', twiz.colorIdx, COLOR_PALETTES, pickTwizColor);
        updateTwiz1Preview();
        openModal('tripWizardStep1');
    }
    function updateTwiz1Preview() {
        var c = COLOR_PALETTES[twiz.colorIdx];
        var name = (($('twiz1NameInput') || {}).value || '').trim() || 'Название типа';
        var pr = $('twiz1Preview'); if (pr) pr.style.background = 'linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ')';
        var e = $('twiz1Emoji'); if (e) e.textContent = twiz.emoji;
        var n = $('twiz1Name'); if (n) n.textContent = name;
        var cn = $('twiz1Count'); if (cn) cn.textContent = twiz.items.length + ' ' + plural(twiz.items.length, 'вещь', 'вещи', 'вещей');
    }
    function twiz1Next() {
        var name = (($('twiz1NameInput') || {}).value || '').trim();
        if (!name) { showToast('Введите название'); return; }
        twiz.name = name;
        closeModal('tripWizardStep1');
        openTwiz2();
    }
    function openTwiz2() {
        var c = COLOR_PALETTES[twiz.colorIdx];
        var pr = $('twiz2Preview'); if (pr) pr.style.background = 'linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ')';
        var e = $('twiz2Emoji'); if (e) e.textContent = twiz.emoji;
        var n = $('twiz2Name'); if (n) n.textContent = twiz.name;
        var ni = $('twiz2NewItem'); if (ni) ni.value = '';
        renderTwiz2Items();
        openModal('tripWizardStep2');
    }
    function renderTwiz2Items() {
        var ed = $('twiz2ItemsEditor'); if (!ed) return;
        ed.innerHTML = '';
        if (!twiz.items.length) {
            var emp = document.createElement('div');
            emp.style.cssText = 'text-align:center;padding:20px;color:var(--text-3);font-size:13.5px;font-weight:500';
            emp.textContent = 'Можно оставить пустым — вещи добавите позже.';
            ed.appendChild(emp);
        } else twiz.items.forEach(function(it, i) { ed.appendChild(buildAdvancedRow(it, i, 'twiz')); });
        var cn = $('twiz2Count'); if (cn) cn.textContent = twiz.items.length + ' ' + plural(twiz.items.length, 'вещь', 'вещи', 'вещей');
    }
    function twiz2AddQuick() {
        var v = (($('twiz2NewItem') || {}).value || '').trim();
        if (!v) return;
        twiz.items.push({ text: v, qty: 1, note: '', category: 'other' });
        $('twiz2NewItem').value = '';
        renderTwiz2Items();
        $('twiz2NewItem').focus();
    }
    function twiz2Save() {
        if (!twiz.name) { showToast('Введите название'); return; }
        var c = COLOR_PALETTES[twiz.colorIdx];
        var id = 'trip_' + Date.now();
        customTripTypes[id] = {
            name: twiz.name, emoji: twiz.emoji,
            c1: c.c1, c2: c.c2, ring: c.ring,
            items: twiz.items.slice(), builtin: false
        };
        saveCustomTripTypes();
        closeModal('tripWizardStep2');
        renderHome(); renderProfile(); vibrate();
        showToast('Тип «' + twiz.name + '» создан!');
    }

    // ============ ADVANCED ROW ============
    function buildAdvancedRow(item, idx, target) {
        var row = document.createElement('div');
        row.className = 'advanced-item-row';
        var allCats = getAllCategories();
        var cat = allCats[item.category] || allCats.other || { icon: '📦' };
        var head = document.createElement('div');
        head.className = 'advanced-item-head';
        var td = document.createElement('div');
        td.className = 'item-text';
        td.innerHTML = cat.icon + ' ' + escapeHtml(item.text) + (item.qty > 1 ? ' <span style="font-size:11.5px;color:var(--text-3);font-weight:600">· ×' + item.qty + '</span>' : '');
        if (item.note) {
            var nd = document.createElement('div');
            nd.style.cssText = 'font-size:11.5px;color:var(--text-3);font-style:italic;margin-top:2px;font-weight:500';
            nd.textContent = item.note;
            td.appendChild(nd);
        }
        head.appendChild(td);
        var rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'item-remove'; rm.textContent = '✕';
        rm.addEventListener('click', function() {
            if (target === 'wizard') { wiz.items.splice(idx, 1); renderWiz2Items(); }
            else if (target === 'twiz') { twiz.items.splice(idx, 1); renderTwiz2Items(); }
            else { editing.items.splice(idx, 1); renderEditorItems(); updateEditorPreview(); }
        });
        head.appendChild(rm); row.appendChild(head);
        var fields = document.createElement('div');
        fields.className = 'advanced-item-fields';
        var qi = document.createElement('input');
        qi.type = 'number'; qi.className = 'mini-field'; qi.value = item.qty || 1;
        qi.min = '1'; qi.max = '99'; qi.placeholder = 'Кол-во';
        qi.addEventListener('input', function() { item.qty = parseInt(qi.value) || 1; });
        fields.appendChild(qi);
        var cs = document.createElement('select');
        cs.className = 'mini-field full';
        fillCategorySelect(cs, item.category);
        cs.addEventListener('change', function() { if (cs.value !== '__new__') item.category = cs.value; });
        fields.appendChild(cs);
        var ni = document.createElement('input');
        ni.type = 'text'; ni.className = 'mini-field full'; ni.value = item.note || '';
        ni.placeholder = 'Заметка'; ni.maxLength = 60;
        ni.addEventListener('input', function() { item.note = ni.value; });
        fields.appendChild(ni);
        row.appendChild(fields);
        return row;
    }

    function fillCategorySelect(selectEl, selected) {
        selectEl.innerHTML = '';
        var all = getAllCategories();
        Object.keys(all).forEach(function(k) {
            var o = document.createElement('option');
            o.value = k; o.textContent = all[k].icon + ' ' + all[k].name;
            if (k === selected) o.selected = true;
            selectEl.appendChild(o);
        });
        var addOpt = document.createElement('option');
        addOpt.value = '__new__';
        addOpt.textContent = '➕ Создать категорию...';
        selectEl.appendChild(addOpt);
    }

    function handleCategoryChange(selectEl, fallback, parentModalId) {
        if (selectEl.value === '__new__') {
            selectEl.value = fallback;
            openCategoryModal(selectEl, parentModalId);
        }
    }

    function openAdvanced(target) {
        advTarget = target;
        var p = (target === 'wizard' || target === 'twiz') ? 'adv' : 'adv2';
        ['Name','Qty','Note'].forEach(function(f) {
            var el = $(p + f);
            if (el) el.value = f === 'Qty' ? '1' : '';
        });
        var s = $(p + 'Cat');
        if (s) fillCategorySelect(s, 'other');
        if (target === 'wizard') { closeModal('wizardStep2'); openModal('advancedItemModal'); }
        else if (target === 'twiz') { closeModal('tripWizardStep2'); openModal('advancedItemModal'); }
        else { closeModal('listEditorModal'); openModal('advancedItemModal2'); }
    }
    function advConfirm() {
        var n = (($('advName') || {}).value || '').trim();
        if (!n) { showToast('Введите название'); return; }
        var newItem = {
            text: n, qty: parseInt($('advQty').value) || 1,
            note: (($('advNote') || {}).value || '').trim(),
            category: ($('advCat') || {}).value || 'other'
        };
        closeModal('advancedItemModal');
        if (advTarget === 'twiz') {
            twiz.items.push(newItem);
            openTwiz2();
        } else {
            wiz.items.push(newItem);
            openWiz2();
        }
    }
    function adv2Confirm() {
        var n = (($('adv2Name') || {}).value || '').trim();
        if (!n) { showToast('Введите название'); return; }
        editing.items.push({ text: n, qty: parseInt($('adv2Qty').value) || 1, note: (($('adv2Note') || {}).value || '').trim(), category: ($('adv2Cat') || {}).value || 'other' });
        closeModal('advancedItemModal2');
        openEditorById(editing.id);
    }

    // ============ РЕДАКТОР СПИСКА ============
    function pickEditorEmoji(em) { editing.emoji = em; renderEmojiPicker('emojiPicker', editing.emoji, LIST_EMOJI_CHOICES, pickEditorEmoji); updateEditorPreview(); }
    function pickEditorColor(i) { editing.colorIdx = i; renderColorPicker('colorPicker', editing.colorIdx, LIST_COLOR_PALETTES, pickEditorColor); updateEditorPreview(); }

    function openEditor(id) {
        if (!customTypes[id]) return;
        var t = customTypes[id];
        editing.id = id; editing.name = t.name; editing.emoji = t.emoji;
        editing.items = t.items.map(normalizeItem);
        editing.colorIdx = 0;
        for (var i = 0; i < LIST_COLOR_PALETTES.length; i++) {
            if (LIST_COLOR_PALETTES[i].c1 === t.c1 && LIST_COLOR_PALETTES[i].c2 === t.c2) { editing.colorIdx = i; break; }
        }
        openEditorById(id);
    }
    function openEditorById() {
        var ti = $('listEditorTitle'); if (ti) ti.textContent = 'Редактировать список';
        var ln = $('listName'); if (ln) ln.value = editing.name;
        var db = $('deleteListBtn'); if (db) db.style.display = 'block';
        var ni = $('newItemInput'); if (ni) ni.value = '';
        renderEmojiPicker('emojiPicker', editing.emoji, LIST_EMOJI_CHOICES, pickEditorEmoji);
        renderColorPicker('colorPicker', editing.colorIdx, LIST_COLOR_PALETTES, pickEditorColor);
        renderEditorItems(); updateEditorPreview();
        openModal('listEditorModal');
    }
    function updateEditorPreview() {
        var c = LIST_COLOR_PALETTES[editing.colorIdx];
        var name = (($('listName') || {}).value || '').trim() || 'Название списка';
        var pr = $('previewCard'); if (pr) pr.style.background = 'linear-gradient(135deg,' + c.c1 + ',' + c.c2 + ')';
        var e = $('previewEmoji'); if (e) e.textContent = editing.emoji;
        var n = $('previewName'); if (n) n.textContent = name;
        var cn = $('previewCount'); if (cn) cn.textContent = editing.items.length + ' ' + plural(editing.items.length, 'вещь', 'вещи', 'вещей');
    }
    function renderEditorItems() {
        var ed = $('itemsEditor'); if (!ed) return;
        ed.innerHTML = '';
        if (!editing.items.length) {
            var emp = document.createElement('div');
            emp.style.cssText = 'text-align:center;padding:20px;color:var(--text-3);font-size:13.5px;font-weight:500';
            emp.textContent = 'Пока пусто. Добавьте первую вещь ниже.';
            ed.appendChild(emp);
            return;
        }
        editing.items.forEach(function(it, i) { ed.appendChild(buildAdvancedRow(it, i, 'editor')); });
    }
    function editorAddQuick() {
        var v = (($('newItemInput') || {}).value || '').trim();
        if (!v) return;
        editing.items.push({ text: v, qty: 1, note: '', category: 'other' });
        $('newItemInput').value = '';
        renderEditorItems(); updateEditorPreview();
        $('newItemInput').focus();
    }
    function saveEditor() {
        var name = (($('listName') || {}).value || '').trim();
        if (!name) { showToast('Введите название'); return; }
        if (!editing.items.length) { showToast('Добавьте вещи'); return; }
        var c = LIST_COLOR_PALETTES[editing.colorIdx];
        customTypes[editing.id] = { name: name, emoji: editing.emoji, c1: c.c1, c2: c.c2, ring: c.ring, items: editing.items.slice(), builtin: false };
        saveCustomTypes();
        closeModal('listEditorModal');
        renderHome(); renderListsPage(); vibrate();
        showToast('Сохранено!');
    }
    function deleteCustomType(id) {
        if (!customTypes[id]) return;
        delete customTypes[id];
        saveCustomTypes();
        renderHome(); renderProfile(); renderListsPage();
        if ($('typeModal') && $('typeModal').classList.contains('active')) {
            var idx = selectedListIds.indexOf(id);
            if (idx !== -1) selectedListIds.splice(idx, 1);
            renderListPicker();
        }
    }
    function deleteEditingList() {
        if (!editing.id) return;
        if (confirm('Удалить этот список?')) { deleteCustomType(editing.id); closeModal('listEditorModal'); }
    }
    function completeActiveTrip() {
        var trip = getCurrentTrip();
        if (!trip) return;
        var s = getTripStats(trip);
        history.unshift({
            id: trip.id, type: trip.type, name: trip.name, emoji: trip.emoji, date: trip.date,
            city: trip.city || '', startDate: trip.startDate || null,
            total: s.total, done: s.done, listIds: trip.listIds || [],
            fullItems: trip.items.map(function(i) { return { text: i.text, qty: i.qty, note: i.note, category: i.category }; })
        });
        activeTrips.splice(currentTripIndex, 1);
        if (currentTripIndex >= activeTrips.length) currentTripIndex = Math.max(0, activeTrips.length - 1);
        saveActive(); saveHistory(); renderHome(); renderProfile();
    }
    function deleteHistory(id) {
        history = history.filter(function(h) { return h.id !== id; });
        saveHistory(); renderHome(); renderProfile();
    }

    // ============ ЧЕК-ЛИСТ ============
    function openChecklistPage() {
        var trip = getCurrentTrip();
        if (!trip) return;
        searchQuery = '';
        var si = $('searchInput'); if (si) si.value = '';
        var pg = $('checklistPage');
        if (pg) pg.classList.add('active');
        resetUIBlocks();
        renderChecklistPage();
        loadWeather();
    }
    function closeChecklistPage() {
        closeAllModals();
        var pg = $('checklistPage'); if (pg) pg.classList.remove('active');
        resetUIBlocks();
        renderHome();
    }
    function renderChecklistPage() {
        try {
            var trip = getCurrentTrip();
            if (!trip) { closeChecklistPage(); return; }
            var tEl = $('checklistPageTitle');
            if (tEl) tEl.textContent = (trip.emoji || '🎒') + ' ' + (trip.name || '');
            var sEl = $('checklistPageSubtitle');
            if (sEl) {
                var cd = trip.startDate ? countdown(trip.startDate) : '';
                var parts = [];
                if (trip.date) parts.push(formatTripDate(trip));
                if (cd) parts.push(cd);
                if (trip.city) parts.push('📍 ' + trip.city);
                sEl.textContent = parts.join(' · ');
            }
            var s = getTripStats(trip);
            var pt = $('tripProgressText'); if (pt) pt.textContent = s.done + ' / ' + s.total;
            var f = $('tripProgressFill');
            if (f) { f.style.width = s.percent + '%'; f.classList.toggle('complete', s.percent === 100 && s.total > 0); }
            var tg = $('hideDoneToggle'); if (tg) tg.classList.toggle('active', !!settings.hideDone);
            var cont = $('checklistContainer'); if (!cont) return;
            cont.innerHTML = '';
            var q = searchQuery.toLowerCase().trim();
            var vis = [];
            trip.items.forEach(function(it, i) {
                if (settings.hideDone && it.done) return;
                if (q && it.text.toLowerCase().indexOf(q) === -1) return;
                vis.push({ item: it, idx: i });
            });
            if (!vis.length) {
                var em = document.createElement('div');
                em.className = 'empty-search';
                if (q) em.textContent = 'Ничего не найдено по "' + searchQuery + '"';
                else if (settings.hideDone && s.done === s.total && s.total > 0) em.textContent = '🎉 Всё собрано!';
                else em.textContent = 'Пока пусто';
                cont.appendChild(em);
                return;
            }
            var groups = {};
            vis.forEach(function(v) { var c = v.item.category || 'other'; (groups[c] = groups[c] || []).push(v); });
            var allCats = getAllCategories();
            Object.keys(allCats).forEach(function(k) {
                if (!groups[k] || !groups[k].length) return;
                var cat = allCats[k];
                var sec = document.createElement('div');
                sec.className = 'cat-section';
                var allIn = trip.items.filter(function(i) { return (i.category || 'other') === k; });
                var doneIn = allIn.filter(function(i) { return i.done; }).length;
                var hd = document.createElement('div');
                hd.className = 'cat-header';
                hd.innerHTML = '<span class="cat-icon">' + cat.icon + '</span><span>' + escapeHtml(cat.name) + '</span><span class="cat-count">' + doneIn + '/' + allIn.length + '</span>';
                sec.appendChild(hd);
                groups[k].forEach(function(v) { sec.appendChild(buildSwipeItem(v.item, v.idx)); });
                cont.appendChild(sec);
            });
        } catch (e) { bbLogError(3004, 'Ошибка рендера чеклиста', { stack: e.stack }); }
    }
    function buildSwipeItem(item, idx) {
        var wrap = document.createElement('div');
        wrap.className = 'check-item-wrap';
        var ra = document.createElement('div');
        ra.className = 'check-item-actions right';
        ra.innerHTML = '<span>' + (item.done ? '↺' : '✓') + '</span><span>' + (item.done ? 'Сбросить' : 'Готово') + '</span>';
        var la = document.createElement('div');
        la.className = 'check-item-actions left';
        la.innerHTML = '<span>Удалить</span><span>🗑</span>';
        wrap.appendChild(ra); wrap.appendChild(la);
        var el = buildCheckItem(item, idx);
        wrap.appendChild(el);
        var sx = 0, cx = 0, sw = false, hz = false;
        el.addEventListener('touchstart', function(e) { sx = e.touches[0].clientX; cx = 0; sw = true; hz = false; el.style.transition = 'none'; }, { passive: true });
        el.addEventListener('touchmove', function(e) {
            if (!sw) return;
            var dx = e.touches[0].clientX - sx;
            if (!hz && Math.abs(dx) > 8) hz = true;
            if (!hz) return;
            cx = dx;
            if (dx > SWIPE_ITEM_THRESHOLD * 1.5) dx = SWIPE_ITEM_THRESHOLD * 1.5;
            if (dx < -SWIPE_ITEM_THRESHOLD * 1.5) dx = -SWIPE_ITEM_THRESHOLD * 1.5;
            el.style.transform = 'translateX(' + dx + 'px)';
        }, { passive: true });
        el.addEventListener('touchend', function() {
            if (!sw) return;
            sw = false;
            el.style.transition = 'transform .25s cubic-bezier(.4,0,.2,1)';
            if (cx > SWIPE_ITEM_THRESHOLD) { el.style.transform = 'translateX(0)'; toggleItem(idx); }
            else if (cx < -SWIPE_ITEM_THRESHOLD) { el.style.transform = 'translateX(-100%)'; setTimeout(function() { deleteActiveItem(idx); }, 200); }
            else el.style.transform = 'translateX(0)';
            cx = 0;
        }, { passive: true });
        return wrap;
    }
    function deleteActiveItem(idx) {
        try {
            var trip = getCurrentTrip();
            if (!trip || !trip.items[idx]) return;
            trip.items.splice(idx, 1);
            saveActive(); vibrate();
            renderChecklistPage(); renderHome(); renderProfile();
            showToast('Удалено');
        } catch (e) { bbLogError(7002, 'Ошибка удаления вещи', { stack: e.stack }); }
    }
    function buildCheckItem(item, idx) {
        var div = document.createElement('div');
        div.className = 'check-item' + (item.done ? ' checked' : '');
        var c = document.createElement('div');
        c.className = 'check-circle'; c.textContent = '✓';
        c.addEventListener('click', function(e) { e.stopPropagation(); toggleItem(idx); });
        var b = document.createElement('div');
        b.className = 'check-body';
        var fromLine = item.from ? '<div class="check-from">из «' + escapeHtml(item.from) + '»</div>' : '';
        b.innerHTML = '<div class="check-text">' + highlight(item.text) + '</div>' + (item.note ? '<div class="check-note">' + escapeHtml(item.note) + '</div>' : '') + fromLine;
        b.addEventListener('click', function() { toggleItem(idx); });
        div.appendChild(c); div.appendChild(b);
        var st = document.createElement('div');
        st.className = 'qty-stepper';
        var m = document.createElement('button');
        m.type = 'button'; m.className = 'qty-btn'; m.textContent = '−';
        m.addEventListener('click', function(e) {
            e.stopPropagation();
            if (item.qty > 1) { item.qty--; saveActive(); renderChecklistPage(); renderHome(); }
        });
        var v = document.createElement('div');
        v.className = 'qty-val'; v.textContent = item.qty || 1;
        var p = document.createElement('button');
        p.type = 'button'; p.className = 'qty-btn'; p.textContent = '+';
        p.addEventListener('click', function(e) { e.stopPropagation(); item.qty = (item.qty || 1) + 1; saveActive(); renderChecklistPage(); renderHome(); });
        st.appendChild(m); st.appendChild(v); st.appendChild(p);
        div.appendChild(st);
        return div;
    }
    function highlight(text) {
        if (!searchQuery) return escapeHtml(text);
        var esc = escapeHtml(text);
        var q = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try { return esc.replace(new RegExp('(' + q + ')', 'gi'), '<span class="search-highlight">$1</span>'); }
        catch (e) { return esc; }
    }
    function toggleItem(idx) {
        try {
            var trip = getCurrentTrip();
            if (!trip || !trip.items[idx]) return;
            var was = trip.items[idx].done;
            trip.items[idx].done = !was;
            if (!was) {
                vibrate();
                var r = document.querySelector('.ring-wrap');
                if (r) { var rc = r.getBoundingClientRect(); spawnPlusOne(rc.left + rc.width / 2, rc.top + rc.height / 2); }
            }
            var all = trip.items.every(function(i) { return i.done; });
            if (!was && all) { fireConfetti(); vibrateStrong(); }
            saveActive();
            renderChecklistPage(); renderHome(); renderProfile();
        } catch (e) { bbLogError(7001, 'Ошибка отметки вещи', { stack: e.stack }); }
    }
    function spawnPlusOne(x, y) {
        var el = document.createElement('div');
        el.className = 'plus-one'; el.textContent = '+1';
        el.style.left = (x - 15) + 'px';
        el.style.top = (y - 10) + 'px';
        document.body.appendChild(el);
        setTimeout(function() { el.remove(); }, 1100);
    }

    // ============ ПОГОДА ============
    function loadWeather() {
        var card = $('weatherCard'); if (!card) return;
        var trip = getCurrentTrip();
        if (!trip || !trip.city) { card.classList.remove('show'); return; }
        var ck = 'weather_' + trip.city.toLowerCase();
        var cached = weatherCache[ck];
        if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL) { renderWeather(cached.data); return; }
        card.classList.add('show');
        var ce = $('weatherCity'); if (ce) ce.textContent = trip.city;
        var de = $('weatherDesc'); if (de) de.textContent = 'Загрузка...';
        var ie = $('weatherIcon'); if (ie) ie.textContent = '🌍';
        var te = $('weatherTemp'); if (te) te.textContent = '--';
        var fe = $('weatherForecast'); if (fe) fe.innerHTML = '';
        fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(trip.city) + '&count=1&language=ru&format=json')
            .then(function(r) { return r.json(); })
            .then(function(g) {
                if (!g.results || !g.results.length) { bbLogError(5002, 'Город не найден: ' + trip.city); throw new Error('nf'); }
                var loc = g.results[0];
                return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5')
                    .then(function(r) { return r.json(); })
                    .then(function(d) { d._cityName = loc.name; weatherCache[ck] = { ts: Date.now(), data: d }; renderWeather(d); });
            })
            .catch(function(e) {
                bbLogError(5001, 'Не удалось загрузить погоду', { stack: e.stack });
                var de = $('weatherDesc'); if (de) de.textContent = 'Не удалось загрузить погоду';
                var ie = $('weatherIcon'); if (ie) ie.textContent = '❓';
            });
    }
    function renderWeather(data) {
        var card = $('weatherCard'); if (!card) return;
        card.classList.add('show');
        var cur = data.current || {}, code = cur.weather_code || 0;
        var w = WEATHER_CODES[code] || { icon: '🌡️', desc: 'Погода' };
        var ce = $('weatherCity'); if (ce) ce.textContent = data._cityName || (getCurrentTrip() || {}).city || '';
        var te = $('weatherTemp'); if (te) te.textContent = Math.round(cur.temperature_2m) + '°';
        var ie = $('weatherIcon'); if (ie) ie.textContent = w.icon;
        var de = $('weatherDesc');
        var hint = w.desc;
        if (cur.temperature_2m !== undefined) {
            if (cur.temperature_2m < 0) hint += ' · Возьми тёплые вещи 🧥';
            else if (cur.temperature_2m < 10) hint += ' · Нужна куртка';
            else if (cur.temperature_2m < 18) hint += ' · Лёгкая кофта';
            else if (cur.temperature_2m > 28) hint += ' · Очень жарко 🥵';
        }
        if (code >= 51 && code <= 82) hint += ' · Не забудь зонт ☔';
        if (code >= 71 && code <= 75) hint += ' · Снег ❄️';
        if (de) de.textContent = hint;
        var fe = $('weatherForecast'); if (!fe) return;
        fe.innerHTML = '';
        var daily = data.daily || {};
        var days = daily.time || [], codes = daily.weather_code || [], mx = daily.temperature_2m_max || [], mn = daily.temperature_2m_min || [];
        var dn = ['вс','пн','вт','ср','чт','пт','сб'];
        for (var i = 0; i < Math.min(5, days.length); i++) {
            var d = new Date(days[i]);
            var ww = WEATHER_CODES[codes[i]] || { icon: '🌡️' };
            var dayEl = document.createElement('div');
            dayEl.className = 'forecast-day';
            dayEl.innerHTML = '<div class="fd-name">' + dn[d.getDay()] + '</div><div class="fd-icon">' + ww.icon + '</div><div class="fd-temp">' + Math.round(mx[i]) + '° / ' + Math.round(mn[i]) + '°</div>';
            fe.appendChild(dayEl);
        }
    }

    // ============ ДОБАВЛЕНИЕ ВЕЩИ ============
    function openAddItemModal() {
        var trip = getCurrentTrip();
        if (!trip) { showToast('Нет активной поездки'); return; }
        ['Name','Note'].forEach(function(f) { var el = $('addItem' + f); if (el) el.value = ''; });
        var q = $('addItemQty'); if (q) q.value = '1';
        var s = $('addItemCat');
        if (s) fillCategorySelect(s, 'other');
        var overlay = $('addItemModal'); if (overlay) overlay.classList.add('above-checklist');
        openModal('addItemModal');
    }
    function confirmAddItem() {
        try {
            var trip = getCurrentTrip();
            if (!trip) return;
            var n = (($('addItemName') || {}).value || '').trim();
            if (!n) { showToast('Введите название'); return; }
            trip.items.push({
                text: n, done: false,
                qty: parseInt($('addItemQty').value) || 1,
                note: (($('addItemNote') || {}).value || '').trim(),
                category: ($('addItemCat') || {}).value || 'other', from: ''
            });
            saveActive();
            closeAddItemModal();
            renderChecklistPage(); renderHome(); vibrate();
            showToast('Вещь добавлена!');
        } catch (e) { bbLogError(7004, 'Ошибка добавления вещи', { stack: e.stack }); }
    }
    function closeAddItemModal() {
        closeModal('addItemModal');
        var overlay = $('addItemModal'); if (overlay) overlay.classList.remove('above-checklist');
    }

    // ============ КОНФЕТТИ ============
    function fireConfetti() {
        var colors = settings.dark ? ['#6b8cff','#a06bff','#3ddc84','#ff6bcb','#ffd166'] : ['#ff9a5a','#ff6b8a','#4ecb71','#c084fc','#ffd166'];
        for (var i = 0; i < 60; i++) {
            (function() {
                var c = document.createElement('div');
                c.className = 'confetti';
                c.style.left = Math.random() * 100 + 'vw';
                c.style.background = colors[Math.floor(Math.random() * colors.length)];
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                var sz = Math.random() * 8 + 6;
                c.style.width = sz + 'px'; c.style.height = sz + 'px';
                c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
                document.body.appendChild(c);
                setTimeout(function() { c.remove(); }, 3500);
            })();
        }
    }

    // ============ ПРОФИЛЬ ============
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

    function renderProfile() {
        try {
            var s = calcStats();
            var e;
            e = $('profileTotalTrips'); if (e) e.textContent = s.totalTrips;
            e = $('profileCompletedTrips'); if (e) e.textContent = s.completedTrips;
            e = $('profileItemsPacked'); if (e) e.textContent = s.allDone;
            e = $('profileName'); if (e) e.textContent = profile.name || 'Эрик';
            e = $('catCountLabel'); if (e) e.textContent = Object.keys(customCategories).length;
            e = $('errorCountLabel'); if (e) e.textContent = bbGetErrorLog().length;
            var av = $('profileAvatar'), lt = $('profileAvatarLetter');
            if (av && lt) {
                if (profile.avatar) { av.style.backgroundImage = 'url(' + profile.avatar + ')'; av.classList.add('has-photo'); lt.textContent = ''; }
                else { av.style.backgroundImage = ''; av.classList.remove('has-photo'); lt.textContent = (profile.name || 'Э').charAt(0).toUpperCase(); }
            }
            renderAchievements(s);
        } catch (e) { bbLogError(3003, 'Ошибка рендера профиля', { stack: e.stack }); }
    }

    function renderAchievements(s) {
        var g = $('achievementsGrid'); if (!g) return;
        g.innerHTML = '';
        var un = [];
        ACHIEVEMENTS.forEach(function(a) {
            var is = false;
            try { is = a.check(s); } catch (e) {}
            if (is && !achievementsState[a.id]) { achievementsState[a.id] = Date.now(); un.push(a); }
            var d = document.createElement('div');
            d.className = 'achievement' + (is ? ' unlocked' : '');
            d.innerHTML = '<div class="ach-icon">' + a.icon + '</div><div class="ach-name">' + a.name + '</div><div class="ach-desc">' + a.desc + '</div>';
            g.appendChild(d);
        });
        saveAchievements();
        if (un.length) setTimeout(function() { showToast('🏆 ' + un[0].name); }, 500);
    }

    function openEditProfile() {
        var n = $('editName'); if (n) n.value = profile.name || '';
        var ea = $('editAvatar'), el = $('editAvatarLetter');
        if (ea && el) {
            if (profile.avatar) { ea.style.backgroundImage = 'url(' + profile.avatar + ')'; el.textContent = ''; }
            else { ea.style.backgroundImage = ''; el.textContent = (profile.name || 'Э').charAt(0).toUpperCase(); }
        }
        openModal('editProfileModal');
    }
    function saveProfileChanges() {
        profile.name = (($('editName') || {}).value || '').trim() || 'Эрик';
        saveProfile(); closeModal('editProfileModal'); renderProfile();
    }
    function handleAvatarUpload(e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function(ev) {
            var img = new Image();
            img.onload = function() {
                try {
                    var c = document.createElement('canvas');
                    c.width = 200; c.height = 200;
                    var x = c.getContext('2d');
                    var mn = Math.min(img.width, img.height);
                    x.drawImage(img, (img.width - mn) / 2, (img.height - mn) / 2, mn, mn, 0, 0, 200, 200);
                    var d = c.toDataURL('image/jpeg', .85);
                    profile.avatar = d;
                    var ea = $('editAvatar'); if (ea) ea.style.backgroundImage = 'url(' + d + ')';
                    var el = $('editAvatarLetter'); if (el) el.textContent = '';
                    saveProfile(); renderProfile();
                } catch (ex) { bbLogError(8001, 'Ошибка обработки аватара', { stack: ex.stack }); }
            };
            img.onerror = function() { bbLogError(8001, 'Не удалось загрузить изображение'); };
            img.src = ev.target.result;
        };
        rd.readAsDataURL(f);
    }
    function resetAvatar() {
        profile.avatar = null;
        saveProfile();
        var ea = $('editAvatar'); if (ea) ea.style.backgroundImage = '';
        var el = $('editAvatarLetter'); if (el) el.textContent = ((($('editName') || {}).value || '') || 'Э').charAt(0).toUpperCase();
        renderProfile();
    }

    // ============ КАТЕГОРИИ ============
    function openCategoryModal(targetSelect, parentModalId) {
        pendingCategoryTarget = targetSelect || null;
        categoryParent = parentModalId || null;
        var ni = $('newCatName'); if (ni) ni.value = '';
        var p = $('catEmojiPicker'); if (!p) return;
        p.innerHTML = '';
        CAT_EMOJI.forEach(function(em) {
            var d = document.createElement('div');
            d.className = 'emoji-choice' + (em === '📦' ? ' selected' : '');
            d.textContent = em;
            d.dataset.emoji = em;
            d.addEventListener('click', function() {
                p.querySelectorAll('.emoji-choice').forEach(function(x) { x.classList.remove('selected'); });
                d.classList.add('selected');
            });
            p.appendChild(d);
        });
        if (categoryParent) {
            var parent = $(categoryParent);
            if (parent) { parent.classList.remove('active'); parent.style.display = 'none'; }
        }
        var cm = $('categoryModal');
        if (cm) { cm.classList.add('active'); cm.classList.add('on-top2'); cm.style.display = ''; }
        resetUIBlocks();
    }
    function cancelCategoryCreation() {
        var cm = $('categoryModal');
        if (cm) { cm.classList.remove('active'); cm.classList.remove('on-top2'); cm.style.display = ''; }
        if (categoryParent) {
            var parent = $(categoryParent);
            if (parent) {
                parent.classList.add('active'); parent.style.display = '';
                if (categoryParent === 'manageCategoriesModal') renderCatList();
            }
            categoryParent = null;
        }
        pendingCategoryTarget = null;
        resetUIBlocks();
    }
    function saveNewCategory() {
        try {
            var name = (($('newCatName') || {}).value || '').trim();
            if (!name) { showToast('Введите название'); return; }
            var emojiEl = document.querySelector('#catEmojiPicker .emoji-choice.selected');
            var emoji = emojiEl ? emojiEl.dataset.emoji : '📦';
            var id = 'custcat_' + Date.now();
            customCategories[id] = { name: name, icon: emoji };
            saveCustomCategories();
            var cm = $('categoryModal');
            if (cm) { cm.classList.remove('active'); cm.classList.remove('on-top2'); cm.style.display = ''; }
            var target = pendingCategoryTarget;
            if (target) { fillCategorySelect(target, id); target.value = id; }
            if (categoryParent) {
                var parent = $(categoryParent);
                if (parent) {
                    parent.classList.add('active'); parent.style.display = '';
                    if (categoryParent === 'manageCategoriesModal') renderCatList();
                }
                categoryParent = null;
            }
            pendingCategoryTarget = null;
            renderProfile();
            showToast('Категория создана!');
        } catch (e) { bbLogError(8003, 'Ошибка сохранения категории', { stack: e.stack }); }
    }
    function openManageCategories() { renderCatList(); openModal('manageCategoriesModal'); }
    function renderCatList() {
        var cont = $('catListContainer'); if (!cont) return;
        cont.innerHTML = '';
        var keys = Object.keys(customCategories);
        if (!keys.length) {
            var emp = document.createElement('div');
            emp.style.cssText = 'text-align:center;padding:24px;color:var(--text-3);font-size:13.5px;font-weight:500';
            emp.textContent = 'Пока нет своих категорий. Создайте первую!';
            cont.appendChild(emp);
            return;
        }
        keys.forEach(function(k) {
            var c = customCategories[k];
            var item = document.createElement('div');
            item.className = 'cat-list-item';
            item.innerHTML = '<div class="cli-emoji">' + c.icon + '</div><div class="cli-name">' + escapeHtml(c.name) + '</div>';
            var del = document.createElement('button');
            del.type = 'button'; del.className = 'cli-del'; del.textContent = '✕';
            del.addEventListener('click', function() {
                if (confirm('Удалить категорию "' + c.name + '"?')) {
                    delete customCategories[k];
                    saveCustomCategories();
                    renderCatList(); renderProfile();
                    if ($('checklistPage') && $('checklistPage').classList.contains('active')) renderChecklistPage();
                    showToast('Удалено');
                }
            });
            item.appendChild(del);
            cont.appendChild(item);
        });
    }

    // ============ ЖУРНАЛ ОШИБОК ============
    function openErrorLog() {
        var cont = $('errorLogContainer'); if (!cont) return;
        cont.innerHTML = '';
        var log = bbGetErrorLog();
        if (!log.length) {
            var emp = document.createElement('div');
            emp.style.cssText = 'text-align:center;padding:24px;color:var(--text-3);font-size:13.5px;font-weight:500';
            emp.textContent = '🎉 Ошибок нет!';
            cont.appendChild(emp);
            return;
        }
        log.forEach(function(entry) {
            var item = document.createElement('div');
            item.style.cssText = 'padding:12px;background:var(--card);border:1px solid var(--border-soft);border-radius:12px;margin-bottom:8px;font-family:\'SF Mono\',Menlo,monospace;font-size:11px;line-height:1.5;word-break:break-word';
            var dateStr = new Date(entry.ts).toLocaleString('ru-RU');
            item.innerHTML = '<div style="font-weight:800;color:var(--danger);margin-bottom:4px">BB-' + entry.code + ' · ' + escapeHtml(entry.name || '') + '</div>' +
                '<div style="color:var(--text-2);margin-bottom:4px">' + dateStr + '</div>' +
                '<div style="color:var(--text);margin-bottom:4px">' + escapeHtml(entry.message || '') + '</div>' +
                (entry.stack ? '<details style="margin-top:6px"><summary style="cursor:pointer;color:var(--text-3);font-weight:600">Stack</summary><div style="margin-top:6px;color:var(--text-3);white-space:pre-wrap">' + escapeHtml(entry.stack.slice(0, 500)) + '</div></details>' : '');
            cont.appendChild(item);
        });
    }

    // ============ ОНБОРДИНГ ============
    function showOnboarding() {
        currentOnbSlide = 0;
        var viewer = $('onboardingViewer'); if (!viewer) return;
        viewer.classList.add('active');
        resetUIBlocks();
        renderOnbSlide(); renderOnbDots();
    }
    function hideOnboarding() {
        var viewer = $('onboardingViewer'); if (viewer) viewer.classList.remove('active');
        resetUIBlocks();
        try { localStorage.setItem('bybag_onboarding_done', '1'); } catch (e) {}
    }
    function renderOnbSlide() {
        var slide = ONBOARDING_SLIDES[currentOnbSlide];
        var content = $('onbContent'), bgEmoji = $('onbBgEmoji');
        if (!content || !slide) return;
        if (bgEmoji) bgEmoji.textContent = slide.bg || slide.icon;
        var html = '<div class="onb-icon">' + slide.icon + '</div><h2>' + escapeHtml(slide.title) + '</h2><p>' + escapeHtml(slide.text) + '</p>';
        if (slide.list && slide.list.length) {
            html += '<ul class="onb-list">';
            slide.list.forEach(function(li) { html += '<li><span class="onb-li-icon">' + li.icon + '</span>' + escapeHtml(li.text) + '</li>'; });
            html += '</ul>';
        }
        content.innerHTML = html;
        content.style.animation = 'none';
        setTimeout(function() { content.style.animation = ''; }, 10);
        var nextBtn = $('onbNextBtn'); if (nextBtn) nextBtn.textContent = currentOnbSlide === ONBOARDING_SLIDES.length - 1 ? 'Начать!' : 'Далее →';
        var skipBtn = $('onbSkipBtn'); if (skipBtn) skipBtn.style.display = currentOnbSlide === ONBOARDING_SLIDES.length - 1 ? 'none' : 'block';
    }
    function renderOnbDots() {
        var dots = $('onbDots'); if (!dots) return;
        dots.innerHTML = '';
        ONBOARDING_SLIDES.forEach(function(s, i) {
            var d = document.createElement('div');
            d.className = 'onb-dot' + (i === currentOnbSlide ? ' active' : '');
            dots.appendChild(d);
        });
    }
    function nextOnbSlide() {
        if (currentOnbSlide >= ONBOARDING_SLIDES.length - 1) {
            hideOnboarding();
            if (!localStorage.getItem('bybag_notif_asked')) setTimeout(showNotifOnboarding, 600);
            return;
        }
        currentOnbSlide++; renderOnbSlide(); renderOnbDots();
    }

    // ============ НАВИГАЦИЯ ============
    function switchPage(page) {
        document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.toggle('active', n.getAttribute('data-page') === page); });
        document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
        var t = $('page-' + page); if (t) t.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (page === 'profile') renderProfile();
        if (page === 'lists') renderListsPage();
    }

    // ============ НАПОМИНАНИЯ ============
    function checkReminders() {
        try {
            if (!settings.notif || !('Notification' in window) || Notification.permission !== 'granted') return;
            activeTrips.forEach(function(trip) {
                if (!trip.startDate) return;
                var d = countdown(trip.startDate);
                if (d === 'завтра' || d === 'сегодня') {
                    var k = 'bybag_rem_' + trip.id + '_' + d;
                    if (!localStorage.getItem(k)) {
                        new Notification('byBag', { body: trip.name + ': поездка ' + d + '! Проверь багаж 🧳' });
                        localStorage.setItem(k, '1');
                    }
                }
            });
        } catch (e) {}
    }
    function showNotifOnboarding() { openModal('notifOnboardModal'); }
    function handleNotifAllow() {
        closeModal('notifOnboardModal');
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(function(p) { if (p === 'granted') showToast('Уведомления включены ✅'); });
            }
        } catch (e) {}
        settings.notif = true; saveSettings(); applyTheme();
        try { localStorage.setItem('bybag_notif_asked', '1'); } catch (e) {}
    }
    function handleNotifLater() {
        closeModal('notifOnboardModal');
        try { localStorage.setItem('bybag_notif_asked', '1'); } catch (e) {}
    }

    function bind(id, ev, fn) { var el = $(id); if (el) { try { el.addEventListener(ev, fn); } catch (e) {} } }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        try {
            loadData();
            applyTheme();

            document.querySelectorAll('[data-close]').forEach(function(b) {
                b.addEventListener('click', function() {
                    var id = b.getAttribute('data-close');
                    if (id === 'addItemModal') closeAddItemModal(); else closeModal(id);
                });
            });
            ['typeModal','editProfileModal','listEditorModal','addItemModal','wizardStep1','wizardStep2','tripWizardStep1','tripWizardStep2','advancedItemModal','advancedItemModal2','manageCategoriesModal','errorLogModal'].forEach(function(id) {
                var el = $(id);
                if (el) el.addEventListener('click', function(e) {
                    if (e.target === this) { if (id === 'addItemModal') closeAddItemModal(); else closeModal(id); }
                });
            });
            var catOverlay = $('categoryModal');
            if (catOverlay) catOverlay.addEventListener('click', function(e) { if (e.target === this) cancelCategoryCreation(); });
            bind('categoryCloseBtn', 'click', cancelCategoryCreation);

            document.querySelectorAll('.nav-item').forEach(function(n) {
                n.addEventListener('click', function() { switchPage(n.getAttribute('data-page')); });
            });

            bind('createBtn', 'click', createTrip);
            bind('checklistBackBtn', 'click', closeChecklistPage);
            bind('checklistShareBtn', 'click', shareActiveTrip);
            bind('addToActiveBtn', 'click', openAddItemModal);
            bind('confirmAddItemBtn', 'click', confirmAddItem);
            bind('createNewListBtn', 'click', startWizard);

            bind('searchInput', 'input', function() {
                var v = this.value;
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(function() { searchQuery = v; renderChecklistPage(); }, 150);
            });
            bind('hideDoneToggle', 'click', function() { settings.hideDone = !settings.hideDone; saveSettings(); renderChecklistPage(); });

            bind('wiz1NameInput', 'input', function() {
                var nb = $('wiz1NextBtn'); if (nb) nb.disabled = !this.value.trim();
                updateWiz1Preview();
            });
            bind('wiz1NextBtn', 'click', wiz1Next);
            bind('wiz2AddBtn', 'click', wiz2AddQuick);
            bind('wiz2NewItem', 'keypress', function(e) { if (e.key === 'Enter') wiz2AddQuick(); });
            bind('wiz2AdvancedBtn', 'click', function() { openAdvanced('wizard'); });
            bind('wiz2SaveBtn', 'click', wiz2Save);
            bind('wiz2BackBtn', 'click', function() { closeModal('wizardStep2'); openModal('wizardStep1'); });

            bind('twiz1NameInput', 'input', function() {
                var nb = $('twiz1NextBtn'); if (nb) nb.disabled = !this.value.trim();
                updateTwiz1Preview();
            });
            bind('twiz1NextBtn', 'click', twiz1Next);
            bind('twiz2AddBtn', 'click', twiz2AddQuick);
            bind('twiz2NewItem', 'keypress', function(e) { if (e.key === 'Enter') twiz2AddQuick(); });
            bind('twiz2AdvancedBtn', 'click', function() { openAdvanced('twiz'); });
            bind('twiz2SaveBtn', 'click', twiz2Save);
            bind('twiz2BackBtn', 'click', function() { closeModal('tripWizardStep2'); openModal('tripWizardStep1'); });

            bind('advConfirmBtn', 'click', advConfirm);
            bind('adv2ConfirmBtn', 'click', adv2Confirm);
            bind('addItemBtn', 'click', editorAddQuick);
            bind('newItemInput', 'keypress', function(e) { if (e.key === 'Enter') editorAddQuick(); });
            bind('listName', 'input', updateEditorPreview);
            bind('saveListBtn', 'click', saveEditor);
            bind('deleteListBtn', 'click', deleteEditingList);
            bind('listAdvancedBtn', 'click', function() { openAdvanced('editor'); });
            bind('editProfileBtn', 'click', openEditProfile);
            bind('profileAvatar', 'click', openEditProfile);
            bind('saveProfileBtn', 'click', saveProfileChanges);
            bind('avatarInput', 'change', handleAvatarUpload);
            bind('editAvatar', 'click', function() { var a = $('avatarInput'); if (a) a.click(); });
            bind('resetAvatarBtn', 'click', resetAvatar);
            bind('darkModeToggleItem', 'click', function() { settings.dark = !settings.dark; saveSettings(); applyTheme(); });
            bind('notifToggleItem', 'click', function() {
                settings.notif = !settings.notif; saveSettings(); applyTheme();
                if (settings.notif && 'Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} }
            });
            bind('vibrateToggleItem', 'click', function() { settings.vibrate = !settings.vibrate; saveSettings(); applyTheme(); vibrate(); });
            bind('showOnboardingBtn', 'click', showOnboarding);
            bind('onbNextBtn', 'click', nextOnbSlide);
            bind('onbSkipBtn', 'click', function() {
                hideOnboarding();
                if (!localStorage.getItem('bybag_notif_asked')) setTimeout(showNotifOnboarding, 600);
            });
            bind('tipViewerClose', 'click', closeTipViewer);
            bind('notifAllowBtn', 'click', handleNotifAllow);
            bind('notifLaterBtn', 'click', handleNotifLater);
            bind('manageCategoriesBtn', 'click', openManageCategories);
            bind('addNewCatFromList', 'click', function() { openCategoryModal(null, 'manageCategoriesModal'); });
            bind('saveCatBtn', 'click', saveNewCategory);
            bind('viewErrorLogBtn', 'click', function() { openErrorLog(); openModal('errorLogModal'); });
            bind('downloadLogBtn', 'click', downloadErrorLog);
            bind('clearLogBtn', 'click', function() {
                if (confirm('Очистить журнал ошибок?')) { bbClearErrorLog(); openErrorLog(); renderProfile(); }
            });

            ['advCat','adv2Cat'].forEach(function(selId) {
                var sel = $(selId);
                if (sel) sel.addEventListener('change', function() {
                    var fallback = sel.value === '__new__' ? 'other' : sel.value;
                    var parent = selId === 'advCat' ? 'advancedItemModal' : 'advancedItemModal2';
                    handleCategoryChange(sel, fallback, parent);
                });
            });
            var addCat = $('addItemCat');
            if (addCat) addCat.addEventListener('change', function() {
                var fallback = addCat.value === '__new__' ? 'other' : addCat.value;
                handleCategoryChange(addCat, fallback, 'addItemModal');
            });

            var tv = $('tipViewer');
            if (tv) {
                var tStartX = 0, tStartY = 0, tDown = false;
                tv.addEventListener('touchstart', function(e) { tStartX = e.touches[0].clientX; tStartY = e.touches[0].clientY; tDown = true; }, { passive: true });
                tv.addEventListener('touchend', function(e) {
                    if (!tDown) return;
                    tDown = false;
                    var dx = e.changedTouches[0].clientX - tStartX;
                    var dy = e.changedTouches[0].clientY - tStartY;
                    if (Math.abs(dy) > 100 && Math.abs(dy) > Math.abs(dx)) { closeTipViewer(); return; }
                    if (tipsMode !== 'cat') return;
                    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
                        if (dx < 0 && currentTipIdx < TIPS_CATEGORIES.length - 1) openTipViewer(currentTipIdx + 1);
                        else if (dx > 0 && currentTipIdx > 0) openTipViewer(currentTipIdx - 1);
                    }
                }, { passive: true });
            }

            renderHome();
            renderProfile();
            renderListsPage();

            if (!localStorage.getItem('bybag_onboarding_done')) setTimeout(showOnboarding, 800);
            else if (!localStorage.getItem('bybag_notif_asked')) setTimeout(showNotifOnboarding, 1200);

            setTimeout(checkReminders, 3000);
            setInterval(checkReminders, 3600000);
        } catch (e) {
            bbLogError(1001, 'Ошибка инициализации приложения', { stack: e.stack });
            showErrorScreen(1001, 'Ошибка инициализации приложения', e);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();