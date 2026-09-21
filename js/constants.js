// ============================================================
// myBag — Все константы приложения
// Файл: js/constants.js
// Версия: 2.8.0
// ============================================================

var BB_VERSION = '2.8.0';

// ============ ЭКРАН-ЗАГЛУШКА ============
// enabled: true  → показать экран, приложение не работает
// enabled: false → всё работает как обычно
var BLOCKED_CONFIG = {
    enabled: false,
    title: 'Уважаемая Полина Деликатная,\nвы заблокированы.',
    subtitle: 'Нам очень жаль, что вам не интересно наше приложение 😭',
    footer: 'myBag © 2026'
};

var MAX_ACTIVE_TRIPS = 3;
var SWIPE_THRESHOLD = 0.2;
var SWIPE_ITEM_THRESHOLD = 70;
var WEATHER_CACHE_TTL = 1800000;
var VIEWED_WHATS_NEW_KEY = 'bybag_viewed_whats_new_version';

// ============ 20 ДОСТИЖЕНИЙ ============
var ACHIEVEMENTS = [
    // ---- Поездки ----
    {
        id: 'first_trip', icon: '🏆', name: 'Первая поездка',
        desc: 'Создана поездка', max: 1, unit: 'поездка',
        fullDesc: 'С первой поездкой! Вы сделали первый шаг в мир путешествий и теперь знаете, как собрать багаж без стресса.',
        getProgress: function(s) { return Math.min(s.totalTrips, 1); },
        check: function(s) { return s.totalTrips >= 1; }
    },
    {
        id: 'five_trips', icon: '🔥', name: 'Опытный',
        desc: '5 поездок', max: 5, unit: 'поездка',
        fullDesc: 'Вы настоящий путешественник! Создайте 5 поездок и докажите, что готовы к любым приключениям.',
        getProgress: function(s) { return Math.min(s.totalTrips, 5); },
        check: function(s) { return s.totalTrips >= 5; }
    },
    {
        id: 'ten_trips', icon: '🚀', name: 'Бывалый',
        desc: '10 поездок', max: 10, unit: 'поездка',
        fullDesc: 'Десять поездок за плечами! Вы — настоящий профессионал сборов.',
        getProgress: function(s) { return Math.min(s.totalTrips, 10); },
        check: function(s) { return s.totalTrips >= 10; }
    },
    {
        id: 'legend', icon: '👑', name: 'Легенда',
        desc: '25 поездок', max: 25, unit: 'поездка',
        fullDesc: 'Двадцать пять поездок! Ваш опыт бесценен, а багаж всегда собран идеально.',
        getProgress: function(s) { return Math.min(s.totalTrips, 25); },
        check: function(s) { return s.totalTrips >= 25; }
    },
    {
        id: 'keeper', icon: '📜', name: 'Хранитель',
        desc: '5 завершённых поездок', max: 5, unit: 'завершённая поездка',
        fullDesc: 'Пять завершённых поездок! Ваша история путешествий растёт и вдохновляет.',
        getProgress: function(s) { return Math.min(s.completedTrips, 5); },
        check: function(s) { return s.completedTrips >= 5; }
    },

    // ---- Идеальные сборы ----
    {
        id: 'perfect', icon: '🎯', name: 'Идеальный сбор',
        desc: 'Собрано 100%', max: 1, unit: 'идеальный сбор',
        fullDesc: 'Все вещи на месте! Соберите 100% вещей в поездке и получите значок педанта.',
        getProgress: function(s) { return Math.min(s.perfectTrips, 1); },
        check: function(s) { return s.perfectTrips >= 1; }
    },
    {
        id: 'three_perfect', icon: '⭐', name: 'Перфекционист',
        desc: '3 идеальных сбора', max: 3, unit: 'идеальный сбор',
        fullDesc: 'Три идеально собранных поездки! Ни одна вещь не забыта, ни один пункт не пропущен.',
        getProgress: function(s) { return Math.min(s.perfectTrips, 3); },
        check: function(s) { return s.perfectTrips >= 3; }
    },

    // ---- Вещи ----
    {
        id: 'hundred_items', icon: '📦', name: 'Сто вещей',
        desc: '100 вещей собрано', max: 100, unit: 'вещь',
        fullDesc: 'Сто вещей собрано! Ваш багаж всегда в порядке, а память не подводит.',
        getProgress: function(s) { return Math.min(s.allDone, 100); },
        check: function(s) { return s.allDone >= 100; }
    },
    {
        id: 'master_bag', icon: '💎', name: 'Мастер багажа',
        desc: '500 вещей собрано', max: 500, unit: 'вещь',
        fullDesc: '500 вещей собрано! Ваш багаж — образец дисциплины и порядка.',
        getProgress: function(s) { return Math.min(s.allDone, 500); },
        check: function(s) { return s.allDone >= 500; }
    },

    // ---- Списки ----
    {
        id: 'custom_list', icon: '🎨', name: 'Дизайнер',
        desc: 'Свой список', max: 1, unit: 'свой список',
        fullDesc: 'Создайте свой собственный список вещей — и путешествуйте по своим правилам.',
        getProgress: function(s) { return Math.min(s.customCount, 1); },
        check: function(s) { return s.customCount >= 1; }
    },
    {
        id: 'five_lists', icon: '🗂', name: 'Коллекционер',
        desc: '5 своих списков', max: 5, unit: 'список',
        fullDesc: 'Пять своих списков! У вас есть готовый набор для любой поездки.',
        getProgress: function(s) { return Math.min(s.customCount, 5); },
        check: function(s) { return s.customCount >= 5; }
    },
    {
        id: 'combined', icon: '🧩', name: 'Комбинатор',
        desc: 'Поездка с 2+ списками', max: 1, unit: 'поездка',
        fullDesc: 'Объедините несколько списков в одной поездке — и получите максимум пользы от myBag.',
        getProgress: function(s) { return Math.min(s.combinedTrips, 1); },
        check: function(s) { return s.combinedTrips >= 1; }
    },

    // ---- География ----
    {
        id: 'geographer', icon: '🗺', name: 'Географ',
        desc: '5 разных городов', max: 5, unit: 'город',
        fullDesc: 'Пять разных городов! Ваша карта путешествий расширяется — вперёд к новым местам!',
        getProgress: function(s) { return Math.min(s.uniqueCities, 5); },
        check: function(s) { return s.uniqueCities >= 5; }
    },
    {
        id: 'cosmopolitan', icon: '🌍', name: 'Космополит',
        desc: '10 разных городов', max: 10, unit: 'город',
        fullDesc: 'Десять городов! Вы — настоящий гражданин мира, всегда в пути.',
        getProgress: function(s) { return Math.min(s.uniqueCities, 10); },
        check: function(s) { return s.uniqueCities >= 10; }
    },

    // ---- Бронь ----
    {
        id: 'booker', icon: '🏨', name: 'Бронировщик',
        desc: 'Сохранена бронь отеля', max: 1, unit: 'бронь',
        fullDesc: 'Сохраните информацию об отеле — чтобы адрес, телефон и бронь всегда были под рукой.',
        getProgress: function(s) { return Math.min(s.hasBooking, 1); },
        check: function(s) { return s.hasBooking >= 1; }
    },
    {
        id: 'pilot', icon: '✈️', name: 'Лётчик',
        desc: 'Сохранён номер рейса', max: 1, unit: 'рейс',
        fullDesc: 'Укажите номер рейса — и будьте готовы к полёту. Небо ждёт!',
        getProgress: function(s) { return Math.min(s.hasFlight, 1); },
        check: function(s) { return s.hasFlight >= 1; }
    },
    {
        id: 'in_touch', icon: '📞', name: 'На связи',
        desc: 'Сохранён телефон отеля', max: 1, unit: 'телефон',
        fullDesc: 'Сохраните телефон отеля. Один тап — и вы всегда на связи.',
        getProgress: function(s) { return Math.min(s.hasPhone, 1); },
        check: function(s) { return s.hasPhone >= 1; }
    },
    {
        id: 'navigator', icon: '📍', name: 'Штурман',
        desc: 'Сохранён адрес отеля', max: 1, unit: 'адрес',
        fullDesc: 'Сохраните адрес отеля. Никогда не заблудитесь в новом городе.',
        getProgress: function(s) { return Math.min(s.hasAddress, 1); },
        check: function(s) { return s.hasAddress >= 1; }
    },
    {
        id: 'planner', icon: '📅', name: 'Планировщик',
        desc: 'Поездка с датами', max: 1, unit: 'поездка',
        fullDesc: 'Укажите даты поездки. Так вы точно ничего не забудете и всё успеете.',
        getProgress: function(s) { return Math.min(s.hasDates, 1); },
        check: function(s) { return s.hasDates >= 1; }
    },

    // ---- Заметки ----
    {
        id: 'note_taker', icon: '📝', name: 'Заметливый',
        desc: '5 заметок', max: 5, unit: 'заметка',
        fullDesc: 'Запишите 5 заметок о поездке — Wi-Fi, коды, важные телефоны. Всё в одном месте.',
        getProgress: function(s) { return Math.min(s.totalNotes, 5); },
        check: function(s) { return s.totalNotes >= 5; }
    },
    {
        id: 'writer', icon: '✍️', name: 'Писатель',
        desc: '20 заметок', max: 20, unit: 'заметка',
        fullDesc: 'Двадцать заметок! Ваш опыт путешественника теперь задокументирован.',
        getProgress: function(s) { return Math.min(s.totalNotes, 20); },
        check: function(s) { return s.totalNotes >= 20; }
    }
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

// ============ ДЕФОЛТНЫЕ СПИСКИ ВЕЩЕЙ ============
// Добавляются при первом запуске, если у пользователя нет своих списков
var DEFAULT_LISTS = [
    {
        key: 'tech',
        name: 'Техника',
        emoji: '📱',
        c1: '#b8a4e8', c2: '#7e5bef', ring: '#7e5bef',
        items: [
            'Зарядки',
            'Планшет',
            'Наушники',
            'Штатив',
            'Фотоаппарат, карта памяти, зарядка'
        ]
    },
    {
        key: 'cosmetics',
        name: 'Косметическое',
        emoji: '🧴',
        c1: '#f8c8d8', c2: '#d97ba0', ring: '#d97ba0',
        items: [
            'Презервативы/смазка/вибратор',
            'Дезодорант',
            'Умывание лица',
            'Шампунь + кондиционер + гель для душа',
            'Расческа',
            'Резинки + ободок + заколки, крабик',
            'Крем для лица',
            'Крем для рук, тела',
            'Зубная щетка',
            'Зубная паста',
            'Гигиеничка',
            'Снятие макияжа',
            'Ватные диски + палочки',
            'Линзы/очки',
            'Духи',
            'Каппы + чехол',
            'Табл очищение капп',
            'Тампоны, прокладки',
            'Пилочка',
            'Зеркало',
            'Салфетки сухие/влажные/интимные',
            'Беруши',
            'Косметика',
            'Жидкий утюг'
        ]
    },
    {
        key: 'clothes',
        name: 'Одежда',
        emoji: '👕',
        c1: '#b8dff0', c2: '#5aa9d6', ring: '#5aa9d6',
        items: [
            'Домашн.одежда',
            'Тапочки кроксы',
            'Трусы',
            'Носки',
            'Пакеты для грязной одежды/белья',
            'Украшения'
        ]
    },
    {
        key: 'extra',
        name: 'Доп.',
        emoji: '➕',
        c1: '#ffe9b8', c2: '#f4c462', ring: '#f4c462',
        items: [
            'Книга',
            'Витамины'
        ]
    },
    {
        key: 'sea',
        name: 'На море',
        emoji: '🏖️',
        c1: '#7ee8fa', c2: '#2c73d2', ring: '#2c73d2',
        items: [
            'Аптечка (таблетки от аллергии)',
            'Очки солнцезащитные',
            'Купальник',
            'Крема от солнца/после солнца',
            'Кепка/панама'
        ]
    },
    {
        key: 'docs',
        name: 'Документы/в сумку',
        emoji: '📄',
        c1: '#ffd3b6', c2: '#ff9a76', ring: '#ff9a76',
        items: [
            'Паспорт',
            'Водительские права',
            'Страховка',
            'Ваучер отель/перелет/поезд',
            'Деньги, ключи, проезд',
            'Антисептик',
            'Матирующие салфетки'
        ]
    },
    {
        key: 'travelbox',
        name: 'Тревел бокс',
        emoji: '🧰',
        c1: '#c5cdd6', c2: '#7d8a99', ring: '#7d8a99',
        items: [
            'Скотч',
            'Нож',
            'Ножницы',
            'Швейный набор',
            'Иголка сим карта',
            'Одноразовые пакеты',
            'Переходники'
        ]
    },
    {
        key: 'ivi',
        name: 'Иви',
        emoji: '🐕',
        c1: '#c9d6a3', c2: '#8ba356', ring: '#8ba356',
        items: [
            'корм',
            'вода бутылка',
            'поводок',
            'шлейка',
            'костюмчик',
            'мяч',
            'лежанка + плед',
            'пеленки',
            'миска для корма'
        ]
    },
    {
        key: 'pregnant',
        name: 'Беременна',
        emoji: '🤰',
        c1: '#e8c8e8', c2: '#c48ec4', ring: '#c48ec4',
        items: [
            'Обменная карта + справка от врача',
            'Чулки компрессионные',
            'Полис страховой',
            'Кардиомагнил'
        ]
    },
    {
        key: 'todo',
        name: 'Дела',
        emoji: '✅',
        c1: '#a0c4ff', c2: '#3a86ff', ring: '#3a86ff',
        items: [
            'скачать фильмы/музыку',
            'AirTag зарядить'
        ]
    }
];

var COLOR_PALETTES = [
    { c1: '#ffb347', c2: '#ff7e5f', ring: '#ff7e5f' },
    { c1: '#c084fc', c2: '#7e5bef', ring: '#7e5bef' },
    { c1: '#4ecb71', c2: '#2f9c53', ring: '#2f9c53' },
    { c1: '#ff6b8a', c2: '#d6336c', ring: '#d6336c' },
    { c1: '#5ec7ff', c2: '#3a86ff', ring: '#3a86ff' },
    { c1: '#ffd166', c2: '#f4a261', ring: '#f4a261' },
    { c1: '#a0e7e5', c2: '#3aafa9', ring: '#3aafa9' },
    { c1: '#ff8fab', c2: '#c94c7a', ring: '#c94c7a' },
    { c1: '#f4a261', c2: '#8b5e3c', ring: '#8b5e3c' },
    { c1: '#b4a0e5', c2: '#6a4c93', ring: '#6a4c93' },
    { c1: '#ff9e7d', c2: '#e63946', ring: '#e63946' },
    { c1: '#7ee8fa', c2: '#2c73d2', ring: '#2c73d2' }
];

var LIST_COLOR_PALETTES = [
    { c1: '#a8e6cf', c2: '#56c596', ring: '#56c596' },
    { c1: '#c8b6e2', c2: '#8b6fc4', ring: '#8b6fc4' },
    { c1: '#ffd3b6', c2: '#ff9a76', ring: '#ff9a76' },
    { c1: '#b8dff0', c2: '#5aa9d6', ring: '#5aa9d6' },
    { c1: '#f8c8d8', c2: '#d97ba0', ring: '#d97ba0' },
    { c1: '#ffe9b8', c2: '#f4c462', ring: '#f4c462' },
    { c1: '#a2d5d5', c2: '#4a9d9d', ring: '#4a9d9d' },
    { c1: '#e8b796', c2: '#c17a4e', ring: '#c17a4e' },
    { c1: '#c9d6a3', c2: '#8ba356', ring: '#8ba356' },
    { c1: '#d5c3e8', c2: '#9b7bc4', ring: '#9b7bc4' },
    { c1: '#e0d5c7', c2: '#b09b82', ring: '#b09b82' },
    { c1: '#c5cdd6', c2: '#7d8a99', ring: '#7d8a99' }
];

var LIST_EMOJI_CHOICES = ['👕','👖','👟','🧥','🎒','📱','💻','🎧','🔌','🧴','🪥','💊','🩹','🛂','📄','💳','📖','✏️','🍫','🧸'];
var EMOJI_CHOICES = ['🎒','🧳','✈️','🚗','🏔️','🌊','🎿','🚴','🎣','🍕','🎉','💼','🏖️','🏕️','🌆','🚢','🐕','🎨','📚','🎵'];

var WEATHER_CODES = {
    0:{icon:'☀️',desc:'Ясно'},
    1:{icon:'🌤️',desc:'Преим. ясно'},
    2:{icon:'⛅',desc:'Переменная облачность'},
    3:{icon:'☁️',desc:'Пасмурно'},
    45:{icon:'🌫️',desc:'Туман'},
    48:{icon:'🌫️',desc:'Туман с инеем'},
    51:{icon:'🌦️',desc:'Слабая морось'},
    53:{icon:'🌦️',desc:'Морось'},
    55:{icon:'🌧️',desc:'Сильная морось'},
    61:{icon:'🌧️',desc:'Небольшой дождь'},
    63:{icon:'🌧️',desc:'Дождь'},
    65:{icon:'🌧️',desc:'Сильный дождь'},
    66:{icon:'🌧️',desc:'Ледяной дождь'},
    67:{icon:'🌧️',desc:'Сильный ледяной дождь'},
    71:{icon:'🌨️',desc:'Небольшой снег'},
    73:{icon:'🌨️',desc:'Снег'},
    75:{icon:'❄️',desc:'Сильный снег'},
    77:{icon:'🌨️',desc:'Снежные зёрна'},
    80:{icon:'🌦️',desc:'Ливень'},
    81:{icon:'🌧️',desc:'Сильный ливень'},
    82:{icon:'⛈️',desc:'Очень сильный ливень'},
    85:{icon:'🌨️',desc:'Снежный ливень'},
    86:{icon:'❄️',desc:'Сильный снежный ливень'},
    95:{icon:'⛈️',desc:'Гроза'},
    96:{icon:'⛈️',desc:'Гроза с градом'},
    99:{icon:'⛈️',desc:'Гроза с сильным градом'}
};

var WHATS_NEW = {
    emoji: '🧭',
    title: 'Что нового',
    subtitle: 'myBag стал помощником в поездке',
    color1: '#4ecb71', color2: '#2f9c53',
    items: [
        { icon: '✈️', title: 'Вкладка «Поездка»', desc: 'Вся информация о поездке собрана в одном месте — ничего не потеряется' },
        { icon: '🏨', title: 'Брони и рейсы', desc: 'Сохраняйте отель и номер рейса, чтобы всё было под рукой' },
        { icon: '📝', title: 'Заметки', desc: 'Wi-Fi, коды, телефоны — записывайте прямо в поездку' },
        { icon: '🌤️', title: 'Умная погода', desc: 'Советы, что взять с собой, в зависимости от температуры' },
        { icon: '🎨', title: 'Обновлённый дизайн', desc: 'Единый стиль, аккуратные карточки, приятно смотреть' },
        { icon: '🎠', title: 'Переключение поездок', desc: 'Листайте активные поездки прямо на вкладке «Поездка»' },
        { icon: '📊', title: 'Компактный виджет', desc: 'Сводка о поездке — прогресс, даты и отсчёт — в одной карточке' },
        { icon: '⚙️', title: 'Настройки отдельно', desc: 'Шестерёнка в профиле — все настройки в одном месте' },
        { icon: '🏆', title: '20 достижений', desc: 'Собирайте награды за поездки, города, брони и заметки' },
        { icon: '🧹', title: 'Стало проще', desc: 'Убрали лишнее — приложение работает быстрее и понятнее' }
    ],
    minor: 'Спасибо, что пользуетесь myBag 💛'
};

var TIPS_CATEGORIES = [
    { id: 'packing', name: 'Упаковка', emoji: '🧳', color1: '#ff9a5a', color2: '#ff6b8a', desc: 'Как упаковать чемодан',
      tips: [
        { icon: '👕', text: '<strong>Скручивайте в рулоны</strong><br>Экономит место и меньше мнётся' },
        { icon: '👟', text: '<strong>Обувь вниз, носки внутрь</strong><br>Заполняет пустоты, держит форму' },
        { icon: '🧴', text: '<strong>Жидкости в зип-пакет</strong><br>Под крышку плёнка, чтобы не протекло' },
        { icon: '👖', text: '<strong>Тяжёлое на дно</strong><br>Чемодан не переворачивается и не падает' },
        { icon: '🎒', text: '<strong>Мелочи по мешочкам</strong><br>Провода по типам, не путаются' },
        { icon: '🪥', text: '<strong>Щётку в колпачок</strong><br>Гигиеничнее и не пачкает сумку' }
      ] },
    { id: 'docs', name: 'Документы', emoji: '📄', color1: '#5ec7ff', color2: '#3a86ff', desc: 'Что взять из документов',
      tips: [
        { icon: '🛂', text: '<strong>Копия паспорта отдельно</strong><br>Плюс фото в облаке, на всякий случай' },
        { icon: '✈️', text: '<strong>Скриншот и распечатка</strong><br>Посадочные и брони даже без сети' },
        { icon: '💳', text: '<strong>Две карты в разных сумках</strong><br>И немного наличных про запас' },
        { icon: '🩺', text: '<strong>Страховка на бумаге</strong><br>Иногда просят печатный вариант' },
        { icon: '🎫', text: '<strong>Билеты офлайн</strong><br>Доступ без интернета, сеть пропадает' },
        { icon: '📱', text: '<strong>Номер посольства</strong><br>Запишите на случай проблем за рубежом' }
      ] },
    { id: 'tech', name: 'Техника', emoji: '📱', color1: '#a06bff', color2: '#6b8cff', desc: 'Про гаджеты в дороге',
      tips: [
        { icon: '🔌', text: '<strong>Powerbank 20000 мАч</strong><br>Хватает на 3-4 дня, один вместо пяти' },
        { icon: '🧵', text: '<strong>Провода в стяжки</strong><br>Не путаются в сумке и не рвутся' },
        { icon: '🎧', text: '<strong>Наушники в кейсе</strong><br>Не поцарапаются в кармане' },
        { icon: '💻', text: '<strong>Ноутбук в чехле</strong><br>Отдельно от жидкостей и обуви' },
        { icon: '🔋', text: '<strong>Авто-синк отключить</strong><br>В роуминге телефон проживёт вдвое дольше' },
        { icon: '🔌', text: '<strong>Универсальный переходник</strong><br>Пригодится в любой стране' }
      ] },
    { id: 'clothes', name: 'Одежда', emoji: '👕', color1: '#4ecb71', color2: '#2f9c53', desc: 'Как собрать гардероб',
      tips: [
        { icon: '🎨', text: '<strong>Правило капсулы</strong><br>3 низа, 3 верха и куртка = 9 образов' },
        { icon: '👖', text: '<strong>Максимум две пары обуви</strong><br>Одна в дорогу, вторая в чемодан' },
        { icon: '🧥', text: '<strong>Слои для холода</strong><br>Термобельё, флиска и куртка' },
        { icon: '🌧️', text: '<strong>Компактный дождевик</strong><br>Складывается до размера кулака' },
        { icon: '👕', text: '<strong>Тёмные цвета практичнее</strong><br>В дороге меньше видны пятна' },
        { icon: '👙', text: '<strong>Запасной комплект носков</strong><br>Пригодится на всякий случай' }
      ] },
    { id: 'security', name: 'Безопасность', emoji: '🔒', color1: '#d6336c', color2: '#ff5e8a', desc: 'Как защитить имущество',
      tips: [
        { icon: '🎒', text: '<strong>Рюкзак на грудь</strong><br>В толпе за спиной легко стать целью' },
        { icon: '💰', text: '<strong>Деньги в 2-3 местах</strong><br>Кошелёк, носки, внутренний карман' },
        { icon: '📷', text: '<strong>Фото чемодана</strong><br>Поможет при потере, сохраните в облако' },
        { icon: '🔐', text: '<strong>Кодовый замок</strong><br>Надёжнее простого навесного' },
        { icon: '📞', text: '<strong>Маршрут близким</strong><br>Отели, рейсы, время прилёта' },
        { icon: '🚕', text: '<strong>Только официальное такси</strong><br>Не соглашайтесь на «быстрее и дешевле»' }
      ] },
    { id: 'lifehacks', name: 'Лайфхаки', emoji: '💡', color1: '#ffd166', color2: '#f4a261', desc: 'Полезные мелочи',
      tips: [
        { icon: '🧊', text: '<strong>Замороженная бутылка</strong><br>И вода, и охлаждение для сумки' },
        { icon: '🧴', text: '<strong>Спрей вместо ролла</strong><br>Дезодорант-спрей не протечёт' },
        { icon: '🧦', text: '<strong>Носки в обувь</strong><br>Заполняют пустоту и экономят место' },
        { icon: '🍫', text: '<strong>Сникерс в кармане</strong><br>Спасёт от голода, если нет кафе' },
        { icon: '💊', text: '<strong>Мини-аптечка</strong><br>Обезболивающее, пластырь, активированный уголь' },
        { icon: '🧴', text: '<strong>Пробники косметики</strong><br>Легче больших флаконов и не жалко выкинуть' },
        { icon: '📌', text: '<strong>Булавка на молнию</strong><br>Быстрый «замок» от воришек в метро' },
        { icon: '🛍️', text: '<strong>Пустой мешок для сувениров</strong><br>Складывается и занимает мало места' }
    ] }
];

var ONBOARDING_SLIDES = [
    {icon:'🧳',bg:'🧳',title:'Добро пожаловать в myBag',text:'Ваш личный помощник для сбора багажа и планирования поездок. Никогда не забудьте важное.'},
    {icon:'✈️',bg:'✈️',title:'Создавайте поездки',text:'Выбирайте базовый тип и свои списки. Объединяйте до 3 активных поездок.'},
    {icon:'👆',bg:'✅',title:'Собирайте багаж',text:'Отмечайте вещи одним касанием.',list:[{icon:'👈',text:'Свайп влево удаляет вещь'},{icon:'👉',text:'Свайп вправо отмечает или сбрасывает'},{icon:'🔍',text:'Поиск по списку вещей'}]},
    {icon:'💡',bg:'💡',title:'Советы по упаковке',text:'Полезное для поездок:',list:[{icon:'🧳',text:'Как упаковать чемодан'},{icon:'📄',text:'Документы и визы'},{icon:'🔒',text:'Безопасность в дороге'},{icon:'💡',text:'Полезные лайфхаки'}]},
    {icon:'🏆',bg:'🏆',title:'Статистика и достижения',text:'Собирайте награды, следите за прогрессом и делайте каждую поездку лучше.',list:[{icon:'🏆',text:'Достижения за поездки'},{icon:'📊',text:'Личная статистика'},{icon:'🎨',text:'Свои списки'}]}
];