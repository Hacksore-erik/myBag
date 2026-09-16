// ============================================================
// myBag — Логика приложения и рендер всех экранов
// Файл: js/app.js
// Версия: 2.0.5
// ============================================================

// ============ CSS для пасхалки ============
(function injectHeartCSS() {
    if (document.getElementById('heartCSS')) return;
    var style = document.createElement('style');
    style.id = 'heartCSS';
    style.textContent = '@keyframes heartFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; } }';
    document.head.appendChild(style);
})();

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
        if (!tripHistory.length) return;
        var section = document.createElement('div');
        section.className = 'stats-section';
        section.innerHTML = '<div class="stats-title">История поездок</div>';
        tripHistory.forEach(function(h) {
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
    if (navigator.share) navigator.share({ title: trip.name || 'myBag', text: text }).catch(function() {});
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
    tripHistory.unshift({
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
    tripHistory = tripHistory.filter(function(h) { return h.id !== id; });
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

        // ============ ПАСХАЛКА: ЛЮБОВЬ ============
        if (q === 'любовь' || q === 'love' || q === 'люблю' || q === 'love you') {
            if (!window._loveTriggered) {
                window._loveTriggered = true;
                setTimeout(function() { fireHearts(); }, 100);
                setTimeout(function() { window._loveTriggered = false; }, 8000);
            }
        }
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

// ============ КОНФЕТТИ И ПАСХАЛКА ============
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

function fireHearts() {
    var hearts = ['❤️','💖','💕','💗','💓','💞','💘','💝','🩷','💜','🧡','💛'];
    var count = 120;
    for (var i = 0; i < count; i++) {
        (function(i) {
            var delay = i * 30;
            setTimeout(function() {
                var h = document.createElement('div');
                h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                h.style.position = 'fixed';
                h.style.zIndex = '9999';
                h.style.pointerEvents = 'none';
                h.style.userSelect = 'none';
                h.style.left = (Math.random() * 100) + 'vw';
                h.style.top = '-60px';
                h.style.fontSize = (Math.random() * 30 + 22) + 'px';
                h.style.animation = 'heartFall ' + (3 + Math.random() * 2) + 's linear forwards';
                document.body.appendChild(h);
                setTimeout(function() { h.remove(); }, 5500);
            }, delay);
        })(i);
    }
    vibrateStrong();
    showToast('❤️ Любовь повсюду! ❤️');
}

// ============ ПРОФИЛЬ ============
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
                    new Notification('myBag', { body: trip.name + ': поездка ' + d + '! Проверь багаж 🧳' });
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