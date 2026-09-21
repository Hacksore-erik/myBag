// ============================================================
// myBag — Логика приложения и рендер всех экранов
// Файл: js/app.js
// Версия: 2.8.0
// ============================================================

// ============ УТИЛИТЫ ============
var editingItemIdx = null;
var editingNoteIdx = null;
var achievementsRendered = false;

function attachLongPress(el, onLong, onClick) {
    var timer = null, startX = 0, startY = 0, moved = false, longFired = false, clickHandled = false;
    function clear() { if (timer) { clearTimeout(timer); timer = null; } }
    el.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
        longFired = false;
        clickHandled = false;
        clear();
        timer = setTimeout(function() { longFired = true; vibrate(); if (onLong) onLong(); }, 500);
    }, { passive: true });
    el.addEventListener('touchmove', function(e) {
        if (!timer) return;
        var dx = Math.abs(e.touches[0].clientX - startX);
        var dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 10 || dy > 10) { moved = true; clear(); }
    }, { passive: true });
    el.addEventListener('touchend', function(e) {
        clear();
        if (longFired || moved) return;
        clickHandled = true;
        setTimeout(function() { clickHandled = false; }, 400);
        if (onClick) onClick(e);
    }, { passive: true });
    el.addEventListener('touchcancel', function() { clear(); }, { passive: true });
    el.addEventListener('click', function(e) {
        if (longFired) { longFired = false; return; }
        if (clickHandled) return;
        if (onClick) onClick(e);
    });
}

// ============ FAB ============
var selectedListsToAdd = [];

function toggleFabMenu() {
    var wrap = $('fabWrap');
    if (!wrap) return;
    if (wrap.classList.contains('open')) closeFabMenu();
    else openFabMenu();
}

function openFabMenu() {
    var wrap = $('fabWrap');
    var overlay = $('fabOverlay');
    if (!wrap) return;
    wrap.classList.add('open');
    if (overlay) overlay.classList.add('active');
    vibrate();
    var content = document.querySelector('.checklist-page-content');
    if (content) {
        try { content.scrollBy({ top: 100, behavior: 'smooth' }); } catch (e) { content.scrollTop += 100; }
    }
}

function closeFabMenu() {
    var wrap = $('fabWrap');
    var overlay = $('fabOverlay');
    if (!wrap) return;
    wrap.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ============ ДОБАВЛЕНИЕ СПИСКА В ПОЕЗДКУ ============
function openAddListToTripModal() {
    try {
        var trip = getCurrentTrip();
        if (!trip) { showToast('Нет активной поездки'); return; }
        var keys = Object.keys(customTypes);
        if (!keys.length) {
            showToast('Сначала создайте список в разделе «Списки»');
            return;
        }
        var modal = $('addListToTripModal');
        if (!modal) {
            showToast('Ошибка: модалка addListToTripModal не найдена в HTML');
            bbLogError(9010, 'addListToTripModal отсутствует в HTML');
            return;
        }
        var picker = $('addListToTripPicker');
        if (!picker) {
            showToast('Ошибка: addListToTripPicker не найден в HTML');
            bbLogError(9011, 'addListToTripPicker отсутствует в HTML');
            return;
        }
        selectedListsToAdd = [];
        renderAddListToTripPicker();
        openModal('addListToTripModal');
    } catch (e) {
        bbLogError(9012, 'Ошибка openAddListToTripModal: ' + e.message, { stack: e.stack });
        showToast('Ошибка: ' + e.message);
    }
}

function renderAddListToTripPicker() {
    try {
        var p = $('addListToTripPicker'); if (!p) return;
        p.innerHTML = '';
        var trip = getCurrentTrip();
        if (!trip) return;
        var inTrip = {};
        if (trip.sources && Array.isArray(trip.sources)) {
            trip.sources.forEach(function(s) { if (s && s.id) inTrip[s.id] = true; });
        }
        if (trip.items && Array.isArray(trip.items)) {
            trip.items.forEach(function(it) {
                if (it.listIds && Array.isArray(it.listIds)) {
                    it.listIds.forEach(function(id) { inTrip[id] = true; });
                }
            });
        }

        var keys = Object.keys(customTypes);
        var availableCount = 0;

        keys.forEach(function(key) {
            var t = customTypes[key];
            var tItems = t.items || [];
            var alreadyIn = !!inTrip[key];
            var isSel = selectedListsToAdd.indexOf(key) !== -1;

            var item = document.createElement('div');
            item.className = 'list-picker-item' + (isSel ? ' selected' : '') + (alreadyIn ? ' disabled' : '');
            item.innerHTML =
                '<div class="lp-emoji">' + (t.emoji || '👕') + '</div>' +
                '<div class="lp-body">' +
                    '<div class="lp-name">' + escapeHtml(t.name || 'Список') + '</div>' +
                    '<div class="lp-meta">' + tItems.length + ' ' + plural(tItems.length, 'вещь', 'вещи', 'вещей') + (alreadyIn ? ' · уже в поездке' : '') + '</div>' +
                '</div>' +
                '<div class="lp-check">✓</div>';

            if (!alreadyIn) {
                availableCount++;
                item.addEventListener('click', function() {
                    var i = selectedListsToAdd.indexOf(key);
                    if (i === -1) selectedListsToAdd.push(key);
                    else selectedListsToAdd.splice(i, 1);
                    renderAddListToTripPicker();
                });
            } else {
                item.style.opacity = '.4';
                item.style.pointerEvents = 'none';
            }
            p.appendChild(item);
        });

        if (!availableCount) {
            var emp = document.createElement('div');
            emp.style.cssText = 'text-align:center;padding:20px;color:var(--text-3);font-size:13.5px;font-weight:500';
            emp.textContent = 'Все списки уже в поездке';
            p.appendChild(emp);
        }

        var btn = $('addListToTripConfirmBtn');
        if (btn) {
            btn.disabled = !selectedListsToAdd.length;
            btn.textContent = selectedListsToAdd.length ? 'Добавить (' + selectedListsToAdd.length + ')' : 'Добавить в поездку';
        }
    } catch (e) {
        bbLogError(9013, 'Ошибка renderAddListToTripPicker: ' + e.message, { stack: e.stack });
        showToast('Ошибка рендера: ' + e.message);
    }
}

function confirmAddListToTrip() {
    try {
        var trip = getCurrentTrip();
        if (!trip) return;
        if (!selectedListsToAdd.length) { showToast('Выберите список'); return; }

        if (!trip.sources) trip.sources = [];
        if (!trip.items) trip.items = [];

        var added = 0;
        selectedListsToAdd.forEach(function(listId) {
            var t = customTypes[listId];
            if (!t || !t.items) return;

            if (!trip.sources.some(function(s) { return s.id === listId; })) {
                trip.sources.push({
                    id: listId,
                    name: t.name,
                    emoji: t.emoji || '📋',
                    c1: t.c1 || '#a8e6cf',
                    c2: t.c2 || '#56c596',
                    kind: 'list'
                });
            }

            t.items.forEach(function(raw) {
                var it = normalizeItem(raw);
                var key = it.text.toLowerCase().trim();
                var existing = null;
                for (var i = 0; i < trip.items.length; i++) {
                    if (trip.items[i].text.toLowerCase().trim() === key) { existing = trip.items[i]; break; }
                }
                if (existing) {
                    if (!existing.listIds) existing.listIds = [];
                    if (existing.listIds.indexOf(listId) === -1) existing.listIds.push(listId);
                    existing.qty += it.qty;
                } else {
                    trip.items.push({
                        text: it.text,
                        qty: it.qty,
                        note: it.note,
                        from: t.name || '',
                        listIds: [listId],
                        done: false
                    });
                }
            });
            added++;
        });

        saveActive();
        closeModal('addListToTripModal');
        renderChecklistPage();
        renderTripPage();
        vibrate();
        showToast(added + ' ' + plural(added, 'список добавлен', 'списка добавлено', 'списков добавлено'));
    } catch (e) {
        bbLogError(9014, 'Ошибка confirmAddListToTrip: ' + e.message, { stack: e.stack });
        showToast('Ошибка добавления: ' + e.message);
    }
}

// ============ ЗАМЕТКИ О ПОЕЗДКЕ ============
function renderNotesSection(container) {
    var trip = getCurrentTrip();
    if (!trip) return;
    if (!trip.notes) trip.notes = [];

    var sec = document.createElement('div');
    sec.className = 'notes-section';

    var header = document.createElement('div');
    header.className = 'list-header';
    header.innerHTML = '<span class="list-header-emoji">📝</span>' +
                       '<span class="list-header-name">Заметки</span>' +
                       '<span class="list-header-count">' + trip.notes.length + '</span>';
    sec.appendChild(header);

    trip.notes.forEach(function(note, i) {
        var item = document.createElement('div');
        item.className = 'note-item';
        item.innerHTML = '<div class="note-icon">' + (note.emoji || '📝') + '</div>' +
                         '<div class="note-text">' + escapeHtml(note.text) + '</div>';
        attachLongPress(item,
            function() { openNoteModal(i); },
            function() { openNoteModal(i); }
        );
        sec.appendChild(item);
    });

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'note-add-btn';
    addBtn.innerHTML = '<span>+</span> Добавить заметку';
    addBtn.addEventListener('click', function() { openNoteModal(null); });
    sec.appendChild(addBtn);

    container.appendChild(sec);
}

function openNoteModal(idx) {
    editingNoteIdx = idx;
    var trip = getCurrentTrip();
    if (!trip) return;
    if (!trip.notes) trip.notes = [];

    var title = $('noteModalTitle');
    var textInput = $('noteText');
    var saveBtn = $('noteSaveBtn');
    var delBtn = $('noteDeleteBtn');

    var picker = $('noteEmojiPicker');
    if (picker) {
        picker.innerHTML = '';
        var choices = ['📝','📶','🚕','🔐','🍽️','🏨','🔗','💳','📞','⭐'];
        var current = (idx !== null && trip.notes[idx]) ? (trip.notes[idx].emoji || '📝') : '📝';
        choices.forEach(function(em) {
            var d = document.createElement('div');
            d.className = 'emoji-choice' + (em === current ? ' selected' : '');
            d.textContent = em;
            d.dataset.emoji = em;
            d.addEventListener('click', function() {
                picker.querySelectorAll('.emoji-choice').forEach(function(x) { x.classList.remove('selected'); });
                d.classList.add('selected');
            });
            picker.appendChild(d);
        });
    }

    if (idx !== null && trip.notes[idx]) {
        if (title) title.textContent = 'Править заметку';
        if (textInput) textInput.value = trip.notes[idx].text || '';
        if (saveBtn) saveBtn.textContent = 'Сохранить';
        if (delBtn) delBtn.style.display = 'block';
    } else {
        if (title) title.textContent = 'Новая заметка';
        if (textInput) textInput.value = '';
        if (saveBtn) saveBtn.textContent = 'Добавить';
        if (delBtn) delBtn.style.display = 'none';
    }

    openModal('noteModal');
}

function saveNote() {
    try {
        var trip = getCurrentTrip();
        if (!trip) return;
        if (!trip.notes) trip.notes = [];

        var textInput = $('noteText');
        var text = (textInput ? textInput.value : '').trim();
        if (!text) { showToast('Введите текст'); return; }

        var picker = $('noteEmojiPicker');
        var selected = picker ? picker.querySelector('.emoji-choice.selected') : null;
        var emoji = selected ? (selected.dataset.emoji || '📝') : '📝';

        if (editingNoteIdx !== null && trip.notes[editingNoteIdx]) {
            trip.notes[editingNoteIdx].text = text;
            trip.notes[editingNoteIdx].emoji = emoji;
            showToast('Сохранено');
        } else {
            trip.notes.push({ emoji: emoji, text: text });
            showToast('Заметка добавлена');
        }

        saveActive();
        closeNoteModal();
        renderTripPage();
        if ($('checklistPage') && $('checklistPage').classList.contains('active')) renderChecklistPage();
        vibrate();
    } catch (e) {
        bbLogError(9024, 'Ошибка сохранения заметки: ' + e.message, { stack: e.stack });
        showToast('Ошибка сохранения');
    }
}

function deleteNote(idx) {
    var trip = getCurrentTrip();
    if (!trip || !trip.notes || !trip.notes[idx]) return;
    if (!confirm('Удалить заметку?')) return;
    trip.notes.splice(idx, 1);
    saveActive();
    closeNoteModal();
    renderTripPage();
    if ($('checklistPage') && $('checklistPage').classList.contains('active')) renderChecklistPage();
    showToast('Удалено');
}

function closeNoteModal() {
    editingNoteIdx = null;
    var title = $('noteModalTitle'); if (title) title.textContent = 'Новая заметка';
    var textInput = $('noteText'); if (textInput) textInput.value = '';
    var saveBtn = $('noteSaveBtn'); if (saveBtn) saveBtn.textContent = 'Добавить';
    var delBtn = $('noteDeleteBtn'); if (delBtn) delBtn.style.display = 'none';
    closeModal('noteModal');
}

// ============ ИНФОРМАЦИЯ О ПОЕЗДКЕ ============
function openTripInfoModal() {
    var trip = getCurrentTrip();
    if (!trip) { showToast('Нет активной поездки'); return; }
    var info = trip.info || {};
    var fields = {
        'infoHotelName': info.hotelName || '',
        'infoHotelAddress': info.hotelAddress || '',
        'infoHotelBooking': info.hotelBooking || '',
        'infoHotelPhone': info.hotelPhone || '',
        'infoFlightNumber': info.flightNumber || '',
        'infoFlightFrom': info.flightFrom || '',
        'infoFlightTo': info.flightTo || '',
        'infoFlightTime': info.flightTime || ''
    };
    Object.keys(fields).forEach(function(id) {
        var el = $(id); if (el) el.value = fields[id];
    });
    openModal('tripInfoModal');
}

function saveTripInfo() {
    try {
        var trip = getCurrentTrip();
        if (!trip) return;
        if (!trip.info) trip.info = {};

        trip.info.hotelName = (($('infoHotelName') || {}).value || '').trim();
        trip.info.hotelAddress = (($('infoHotelAddress') || {}).value || '').trim();
        trip.info.hotelBooking = (($('infoHotelBooking') || {}).value || '').trim();
        trip.info.hotelPhone = (($('infoHotelPhone') || {}).value || '').trim();
        trip.info.flightNumber = (($('infoFlightNumber') || {}).value || '').trim();
        trip.info.flightFrom = (($('infoFlightFrom') || {}).value || '').trim();
        trip.info.flightTo = (($('infoFlightTo') || {}).value || '').trim();
        trip.info.flightTime = (($('infoFlightTime') || {}).value || '').trim();

        saveActive();
        closeModal('tripInfoModal');
        vibrate();
        showToast('Информация сохранена');
        renderTripPage();
    } catch (e) {
        bbLogError(9025, 'Ошибка сохранения информации: ' + e.message, { stack: e.stack });
        showToast('Ошибка сохранения');
    }
}

// ============ СТРАНИЦА «ПОЕЗДКА» ============
function renderTripPage() {
    try {
        var cont = $('tripPageContent'); if (!cont) return;
        cont.innerHTML = '';

        var trip = getCurrentTrip();

        if (!trip) {
            var empty = document.createElement('div');
            empty.className = 'empty-hero';
            empty.style.marginTop = '40px';
            empty.innerHTML = '<div class="empty-icon">✈️</div><h2>Нет активных поездок</h2><p>Создайте поездку, чтобы увидеть здесь всю информацию</p><div class="empty-cta"><span class="plus">+</span> Создать поездку</div>';
            empty.addEventListener('click', openTypeModal);
            cont.appendChild(empty);
            return;
        }

        cont.appendChild(buildTripPageCarousel());

        if (trip.city) {
            var weatherTitle = document.createElement('div');
            weatherTitle.className = 'stats-title';
            weatherTitle.style.marginTop = '16px';
            weatherTitle.textContent = 'Погода';
            cont.appendChild(weatherTitle);

            var weatherBox = document.createElement('div');
            weatherBox.className = 'weather-card show';
            weatherBox.id = 'tripWeatherCard';
            weatherBox.innerHTML = '<div class="weather-head" id="tripWeatherHead"><div class="weather-icon" id="tripWeatherIcon">☀️</div><div class="weather-temp" id="tripWeatherTemp">--</div><div class="weather-info"><div class="weather-city" id="tripWeatherCity">' + escapeHtml(trip.city) + '</div><div class="weather-desc" id="tripWeatherDesc">Загрузка...</div></div><div class="weather-arrow">›</div></div><div class="weather-forecast" id="tripWeatherForecast"></div>';
            cont.appendChild(weatherBox);
            loadWeather();
        }

        var openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'btn-primary';
        openBtn.style.marginTop = '16px';
        openBtn.style.marginBottom = '20px';
        openBtn.innerHTML = '📦 Открыть список вещей';
        openBtn.addEventListener('click', function() {
            var i = activeTrips.indexOf(trip);
            if (i !== -1) currentTripIndex = i;
            openChecklistPage();
        });
        cont.appendChild(openBtn);

        var infoTitle = document.createElement('div');
        infoTitle.className = 'stats-title';
        infoTitle.textContent = 'Информация';
        cont.appendChild(infoTitle);

        var info = trip.info || {};
        var hasHotel = info.hotelName || info.hotelAddress || info.hotelBooking || info.hotelPhone;
        var hasFlight = info.flightNumber || info.flightFrom || info.flightTo || info.flightTime;

        var infoMenu = document.createElement('div');
        infoMenu.className = 'profile-menu';

        if (hasFlight) {
            var flightItem = document.createElement('div');
            flightItem.className = 'profile-item';
            flightItem.style.cursor = 'default';
            var flightRoute = [info.flightFrom, info.flightTo].filter(Boolean).join(' → ');
            flightItem.innerHTML = '<div class="pi-icon">✈️</div><div class="pi-label">Рейс ' + escapeHtml(info.flightNumber || '') + (flightRoute ? ' · ' + escapeHtml(flightRoute) : '') + (info.flightTime ? ' · ' + escapeHtml(info.flightTime) : '') + '</div>';
            infoMenu.appendChild(flightItem);
        }

        if (hasHotel) {
            var hotelItem = document.createElement('div');
            hotelItem.className = 'profile-item';
            hotelItem.style.cursor = 'default';
            hotelItem.innerHTML = '<div class="pi-icon">🏨</div><div class="pi-label">' + escapeHtml(info.hotelName || 'Отель') + (info.hotelBooking ? ' · ' + escapeHtml(info.hotelBooking) : '') + '</div>';
            infoMenu.appendChild(hotelItem);
        }

        var editInfoItem = document.createElement('div');
        editInfoItem.className = 'profile-item';
        editInfoItem.innerHTML = '<div class="pi-icon">✏️</div><div class="pi-label">' + (hasHotel || hasFlight ? 'Изменить информацию' : 'Добавить информацию') + '</div><div class="pi-arrow">›</div>';
        editInfoItem.addEventListener('click', openTripInfoModal);
        infoMenu.appendChild(editInfoItem);

        cont.appendChild(infoMenu);

        var notesTitle = document.createElement('div');
        notesTitle.className = 'stats-title';
        notesTitle.style.marginTop = '20px';
        notesTitle.textContent = 'Заметки';
        cont.appendChild(notesTitle);

        renderNotesSection(cont);
    } catch (e) {
        bbLogError(9026, 'Ошибка рендера страницы «Поездка»: ' + e.message, { stack: e.stack });
    }
}

// ============ КАРУСЕЛЬ ПОЕЗДОК НА TRIPPAGE ============
function buildTripPageCarousel() {
    var wrap = document.createElement('div');
    wrap.className = 'trip-page-carousel-wrap';

    var total = activeTrips.length;

    if (total <= 1) {
        var single = buildTripCompactWidget(activeTrips[0]);
        wrap.appendChild(single);
        return wrap;
    }

    var row = document.createElement('div');
    row.className = 'trip-page-carousel-row';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'tc-arrow tc-prev';
    prevBtn.innerHTML = '‹';
    prevBtn.disabled = (currentTripIndex === 0);
    prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        goToTripPage(currentTripIndex - 1);
    });
    row.appendChild(prevBtn);

    var carousel = document.createElement('div');
    carousel.className = 'trip-page-carousel';
    var track = document.createElement('div');
    track.className = 'trip-page-track';
    track.id = 'tripPageTrack';
    activeTrips.forEach(function(trip) { track.appendChild(buildTripCompactWidget(trip)); });
    carousel.appendChild(track);
    row.appendChild(carousel);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'tc-arrow tc-next';
    nextBtn.innerHTML = '›';
    nextBtn.disabled = (currentTripIndex >= total - 1);
    nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        goToTripPage(currentTripIndex + 1);
    });
    row.appendChild(nextBtn);

    wrap.appendChild(row);

    var dots = document.createElement('div');
    dots.className = 'trip-page-dots';
    for (var i = 0; i < total; i++) {
        (function(i) {
            var d = document.createElement('div');
            d.className = 'tpdot' + (i === currentTripIndex ? ' active' : '');
            d.addEventListener('click', function() { goToTripPage(i); });
            dots.appendChild(d);
        })(i);
    }
    wrap.appendChild(dots);

    setTimeout(function() {
        var tr = $('tripPageTrack');
        if (tr) tr.style.transform = 'translateX(-' + (currentTripIndex * 100) + '%)';
    }, 0);

    bindTripPageSwipe(carousel);

    return wrap;
}

function buildTripCompactWidget(trip) {
    var s = getTripStats(trip);
    var cdText = trip.startDate ? countdown(trip.startDate) : '';
    var dateText = formatTripDate(trip);

    var widget = document.createElement('div');
    widget.className = 'trip-compact-widget';

    var row1 = document.createElement('div');
    row1.className = 'trip-compact-row';
    row1.innerHTML =
        '<div class="trip-compact-emoji">' + (trip.emoji || '🎒') + '</div>' +
        '<div class="trip-compact-info">' +
            '<div class="trip-compact-name">' + escapeHtml(trip.name || 'Поездка') + '</div>' +
            '<div class="trip-compact-meta">' + (dateText ? '📅 ' + escapeHtml(dateText) : '') + (trip.city ? ' · 📍 ' + escapeHtml(trip.city) : '') + '</div>' +
        '</div>' +
        (cdText ? '<div class="trip-compact-countdown">' + escapeHtml(cdText) + '</div>' : '');
    widget.appendChild(row1);

    var row2 = document.createElement('div');
    row2.className = 'trip-compact-progress';
    row2.innerHTML =
        '<div class="trip-compact-bar"><div class="trip-compact-fill" style="width:' + s.percent + '%;background:linear-gradient(90deg,' + (trip.c1 || '#ffb347') + ',' + (trip.c2 || '#ff7e5f') + ')"></div></div>' +
        '<div class="trip-compact-count">' + s.done + '/' + s.total + '</div>' +
        '<div class="trip-compact-percent">' + s.percent + '%</div>';
    widget.appendChild(row2);

    widget.addEventListener('click', function() {
        var i = activeTrips.indexOf(trip);
        if (i !== -1) currentTripIndex = i;
        openChecklistPage();
    });

    return widget;
}

function goToTripPage(idx) {
    var total = activeTrips.length;
    if (idx < 0 || idx >= total) return;
    currentTripIndex = idx;
    saveCurrentTripIndex();
    var tr = $('tripPageTrack');
    if (tr) tr.style.transform = 'translateX(-' + (idx * 100) + '%)';
    document.querySelectorAll('.trip-page-dots .tpdot').forEach(function(d, i) { d.classList.toggle('active', i === idx); });
    var prevBtn = document.querySelector('.tc-prev');
    var nextBtn = document.querySelector('.tc-next');
    if (prevBtn) prevBtn.disabled = (idx === 0);
    if (nextBtn) nextBtn.disabled = (idx >= total - 1);
    vibrate();
    updateTripPageWeatherAndInfo();
}

function updateTripPageWeatherAndInfo() {
    try {
        var trip = getCurrentTrip();
        if (!trip) return;
        var cont = $('tripPageContent');
        if (!cont) return;
        var wrap = cont.querySelector('.trip-page-carousel-wrap');
        if (!wrap) { renderTripPage(); return; }

        var next = wrap.nextSibling;
        while (next) {
            var toRemove = next;
            next = next.nextSibling;
            cont.removeChild(toRemove);
        }
        renderTripPageTail(cont, trip);
    } catch (e) {
        bbLogError(9028, 'Ошибка переключения поездки: ' + e.message, { stack: e.stack });
        renderTripPage();
    }
}

function renderTripPageTail(cont, trip) {
    if (trip.city) {
        var weatherTitle = document.createElement('div');
        weatherTitle.className = 'stats-title';
        weatherTitle.style.marginTop = '16px';
        weatherTitle.textContent = 'Погода';
        cont.appendChild(weatherTitle);

        var weatherBox = document.createElement('div');
        weatherBox.className = 'weather-card show';
        weatherBox.id = 'tripWeatherCard';
        weatherBox.innerHTML = '<div class="weather-head" id="tripWeatherHead"><div class="weather-icon" id="tripWeatherIcon">☀️</div><div class="weather-temp" id="tripWeatherTemp">--</div><div class="weather-info"><div class="weather-city" id="tripWeatherCity">' + escapeHtml(trip.city) + '</div><div class="weather-desc" id="tripWeatherDesc">Загрузка...</div></div><div class="weather-arrow">›</div></div><div class="weather-forecast" id="tripWeatherForecast"></div>';
        cont.appendChild(weatherBox);
        loadWeather();
    }

    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'btn-primary';
    openBtn.style.marginTop = '16px';
    openBtn.style.marginBottom = '20px';
    openBtn.innerHTML = '📦 Открыть список вещей';
    openBtn.addEventListener('click', function() {
        var i = activeTrips.indexOf(trip);
        if (i !== -1) currentTripIndex = i;
        openChecklistPage();
    });
    cont.appendChild(openBtn);

    var infoTitle = document.createElement('div');
    infoTitle.className = 'stats-title';
    infoTitle.textContent = 'Информация';
    cont.appendChild(infoTitle);

    var info = trip.info || {};
    var hasHotel = info.hotelName || info.hotelAddress || info.hotelBooking || info.hotelPhone;
    var hasFlight = info.flightNumber || info.flightFrom || info.flightTo || info.flightTime;

    var infoMenu = document.createElement('div');
    infoMenu.className = 'profile-menu';

    if (hasFlight) {
        var flightItem = document.createElement('div');
        flightItem.className = 'profile-item';
        flightItem.style.cursor = 'default';
        var flightRoute = [info.flightFrom, info.flightTo].filter(Boolean).join(' → ');
        flightItem.innerHTML = '<div class="pi-icon">✈️</div><div class="pi-label">Рейс ' + escapeHtml(info.flightNumber || '') + (flightRoute ? ' · ' + escapeHtml(flightRoute) : '') + (info.flightTime ? ' · ' + escapeHtml(info.flightTime) : '') + '</div>';
        infoMenu.appendChild(flightItem);
    }

    if (hasHotel) {
        var hotelItem = document.createElement('div');
        hotelItem.className = 'profile-item';
        hotelItem.style.cursor = 'default';
        hotelItem.innerHTML = '<div class="pi-icon">🏨</div><div class="pi-label">' + escapeHtml(info.hotelName || 'Отель') + (info.hotelBooking ? ' · ' + escapeHtml(info.hotelBooking) : '') + '</div>';
        infoMenu.appendChild(hotelItem);
    }

    var editInfoItem = document.createElement('div');
    editInfoItem.className = 'profile-item';
    editInfoItem.innerHTML = '<div class="pi-icon">✏️</div><div class="pi-label">' + (hasHotel || hasFlight ? 'Изменить информацию' : 'Добавить информацию') + '</div><div class="pi-arrow">›</div>';
    editInfoItem.addEventListener('click', openTripInfoModal);
    infoMenu.appendChild(editInfoItem);

    cont.appendChild(infoMenu);

    var notesTitle = document.createElement('div');
    notesTitle.className = 'stats-title';
    notesTitle.style.marginTop = '20px';
    notesTitle.textContent = 'Заметки';
    cont.appendChild(notesTitle);

    renderNotesSection(cont);
}

function bindTripPageSwipe(el) {
    var total = activeTrips.length;
    if (total < 2) return;
    var startX = 0, startY = 0, isDown = false, isHoriz = false, track = null;
    el.addEventListener('touchstart', function(e) {
        if (e.target.closest('.tc-arrow')) return;
        if (e.target.closest('.tpdot')) return;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        isDown = true; isHoriz = false;
        track = $('tripPageTrack');
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
            if (dx < 0 && currentTripIndex < total - 1) goToTripPage(currentTripIndex + 1);
            else if (dx > 0 && currentTripIndex > 0) goToTripPage(currentTripIndex - 1);
            else goToTripPage(currentTripIndex);
        } else goToTripPage(currentTripIndex);
    }, { passive: true });
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
    if (!viewedWhatsNew) ring.style.background = 'conic-gradient(from 180deg,#4ecb71,#2f9c53,#5ec7ff,#4ecb71)';
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
    saveCurrentTripIndex();
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
    shareTrip({ name: trip.name, date: trip.date, total: s.total, done: s.done, fullItems: trip.items.map(function(i) { return { text: i.text, qty: i.qty, note: i.note, done: i.done }; }) });
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
        items: items.map(function(i) { var n = normalizeItem(i); n.done = false; return n; }),
        sources: [], notes: [], info: {}
    });
    currentTripIndex = activeTrips.length - 1;
    saveActive(); saveCurrentTripIndex(); renderHome(); vibrate();
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
        if (type && type.items && type.items.length) sources.push({ id: selectedType, name: type.name, emoji: type.emoji, c1: type.c1, c2: type.c2, items: type.items, kind: 'type' });
    }
    selectedListIds.forEach(function(listId) {
        var t = customTypes[listId];
        if (t && t.items && t.items.length) sources.push({ id: listId, name: t.name, emoji: t.emoji, c1: t.c1, c2: t.c2, items: t.items, kind: 'list' });
    });

    var merged = {}, order = [];
    sources.forEach(function(src) {
        src.items.forEach(function(raw) {
            var it = normalizeItem(raw);
            var key = it.text.toLowerCase().trim();
            if (merged[key]) {
                merged[key].qty += it.qty;
                if (merged[key].listIds.indexOf(src.id) === -1) merged[key].listIds.push(src.id);
                if (src.name && merged[key].from.indexOf(src.name) === -1) {
                    merged[key].from += (merged[key].from ? ', ' : '') + src.name;
                }
            } else {
                merged[key] = {
                    text: it.text, qty: it.qty, note: it.note,
                    from: src.name || '',
                    listIds: [src.id],
                    done: false
                };
                order.push(key);
            }
        });
    });

    var sourceMeta = sources.map(function(s) {
        return { id: s.id, name: s.name, emoji: s.emoji || '📋', c1: s.c1 || '#a8e6cf', c2: s.c2 || '#56c596', kind: s.kind };
    });

    return { items: order.map(function(k) { return merged[k]; }), sources: sourceMeta };
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
        if (t) { visual = { emoji: t.emoji, c1: t.c1, c2: t.c2, ring: t.ring }; defaultName = t.name; }
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
        if (selectedType) {
            finalName = defaultName || 'Поездка';
        } else if (selectedListIds.length === 1) {
            finalName = (customTypes[selectedListIds[0]] || {}).name || 'Поездка';
        } else {
            finalName = 'Поездка';
        }
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
        items: combined.items,
        sources: combined.sources,
        notes: [],
        info: {}
    });
    currentTripIndex = activeTrips.length - 1;
    saveActive();
    saveCurrentTripIndex();
    closeModal('typeModal');
    renderHome(); renderProfile(); renderTripPage(); vibrate();
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
    wiz.items.push({ text: v, qty: 1, note: '' });
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
    twiz.items.push({ text: v, qty: 1, note: '' });
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
    vibrate();
    showToast('Тип «' + twiz.name + '» создан!');
    openTypeModal();
}

// ============ ADVANCED ROW ============
function buildAdvancedRow(item, idx, target) {
    var row = document.createElement('div');
    row.className = 'advanced-item-row';
    var head = document.createElement('div');
    head.className = 'advanced-item-head';
    var td = document.createElement('div');
    td.className = 'item-text';
    td.innerHTML = escapeHtml(item.text) + (item.qty > 1 ? ' <span style="font-size:11.5px;color:var(--text-3);font-weight:600">· ×' + item.qty + '</span>' : '');
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
    var ni = document.createElement('input');
    ni.type = 'text'; ni.className = 'mini-field full'; ni.value = item.note || '';
    ni.placeholder = 'Заметка'; ni.maxLength = 60;
    ni.addEventListener('input', function() { item.note = ni.value; });
    fields.appendChild(ni);
    row.appendChild(fields);
    return row;
}

function openAdvanced(target) {
    advTarget = target;
    var p = (target === 'wizard' || target === 'twiz') ? 'adv' : 'adv2';
    ['Name','Qty','Note'].forEach(function(f) {
        var el = $(p + f);
        if (el) el.value = f === 'Qty' ? '1' : '';
    });
    if (target === 'wizard') { closeModal('wizardStep2'); openModal('advancedItemModal'); }
    else if (target === 'twiz') { closeModal('tripWizardStep2'); openModal('advancedItemModal'); }
    else { closeModal('listEditorModal'); openModal('advancedItemModal2'); }
}
function advConfirm() {
    var n = (($('advName') || {}).value || '').trim();
    if (!n) { showToast('Введите название'); return; }
    var newItem = {
        text: n, qty: parseInt($('advQty').value) || 1,
        note: (($('advNote') || {}).value || '').trim()
    };
    closeModal('advancedItemModal');
    if (advTarget === 'twiz') { twiz.items.push(newItem); openTwiz2(); }
    else { wiz.items.push(newItem); openWiz2(); }
}
function adv2Confirm() {
    var n = (($('adv2Name') || {}).value || '').trim();
    if (!n) { showToast('Введите название'); return; }
    editing.items.push({ text: n, qty: parseInt($('adv2Qty').value) || 1, note: (($('adv2Note') || {}).value || '').trim() });
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
    editing.items.push({ text: v, qty: 1, note: '' });
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
        fullItems: trip.items.map(function(i) { return { text: i.text, qty: i.qty, note: i.note, done: i.done }; }),
        info: trip.info ? JSON.parse(JSON.stringify(trip.info)) : {},
        notes: Array.isArray(trip.notes) ? trip.notes.map(function(n) { return { emoji: n.emoji, text: n.text }; }) : []
    });
    activeTrips.splice(currentTripIndex, 1);
    if (currentTripIndex >= activeTrips.length) currentTripIndex = Math.max(0, activeTrips.length - 1);
    saveActive(); saveCurrentTripIndex(); saveHistory();
    renderHome(); renderProfile(); renderTripPage();
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
    closeFabMenu();
    var pg = $('checklistPage');
    if (pg) pg.classList.add('active');
    resetUIBlocks();
    renderChecklistPage();
    loadWeather();
}
function closeChecklistPage() {
    closeAllModals();
    closeFabMenu();
    var pg = $('checklistPage'); if (pg) pg.classList.remove('active');
    resetUIBlocks();
    renderHome();
    renderTripPage();
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

        var cb = $('collapseAllBtn'); if (cb) cb.style.display = 'none';

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

        var hasSources = trip.sources && trip.sources.length > 0;

        if (!hasSources) {
            vis.forEach(function(v) { cont.appendChild(buildSwipeItem(v.item, v.idx)); });
            return;
        }

        var grouped = {};
        trip.sources.forEach(function(src) { grouped[src.id] = []; });

        vis.forEach(function(v) {
            var lids = v.item.listIds;
            if (!lids || !lids.length) {
                if (!grouped['__other__']) grouped['__other__'] = [];
                grouped['__other__'].push(v);
            } else {
                lids.forEach(function(sid) {
                    if (grouped[sid]) grouped[sid].push(v);
                });
            }
        });

        trip.sources.forEach(function(src) {
            var groupItems = grouped[src.id] || [];
            if (!groupItems.length) return;

            var sec = document.createElement('div');
            sec.className = 'list-section';

            var totalIn = trip.items.filter(function(i) {
                return i.listIds && i.listIds.indexOf(src.id) !== -1;
            }).length;
            var doneIn = trip.items.filter(function(i) {
                return i.listIds && i.listIds.indexOf(src.id) !== -1 && i.done;
            }).length;

            var hd = document.createElement('div');
            hd.className = 'list-header';
            hd.innerHTML = '<span class="list-header-emoji">' + (src.emoji || '📋') + '</span>' +
                           '<span class="list-header-name">' + escapeHtml(src.name || 'Список') + '</span>' +
                           '<span class="list-header-count">' + doneIn + '/' + totalIn + '</span>' +
                           '<button type="button" class="list-header-remove" title="Удалить список">✕</button>';
            sec.appendChild(hd);

            var removeBtn = hd.querySelector('.list-header-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    removeListFromTrip(src.id);
                });
            }

            attachLongPress(hd, function() {
                showListHeaderMenu(src.id);
            }, function() {});

            groupItems.forEach(function(v) { sec.appendChild(buildSwipeItem(v.item, v.idx)); });
            cont.appendChild(sec);
        });

        if (grouped['__other__'] && grouped['__other__'].length) {
            grouped['__other__'].forEach(function(v) {
                cont.appendChild(buildSwipeItem(v.item, v.idx));
            });
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

    ra.style.opacity = '0';
    la.style.opacity = '0';
    ra.style.transition = 'opacity .1s ease';
    la.style.transition = 'opacity .1s ease';

    wrap.appendChild(ra);
    wrap.appendChild(la);

    var el = buildCheckItem(item, idx);
    wrap.appendChild(el);

    var sx = 0, cx = 0, sw = false, hz = false;

    el.addEventListener('touchstart', function(e) {
        sx = e.touches[0].clientX;
        cx = 0;
        sw = true;
        hz = false;
        el.style.transition = 'none';
    }, { passive: true });

    el.addEventListener('touchmove', function(e) {
        if (!sw) return;
        var dx = e.touches[0].clientX - sx;
        if (!hz && Math.abs(dx) > 8) hz = true;
        if (!hz) return;
        cx = dx;
        if (dx > SWIPE_ITEM_THRESHOLD * 1.5) dx = SWIPE_ITEM_THRESHOLD * 1.5;
        if (dx < -SWIPE_ITEM_THRESHOLD * 1.5) dx = -SWIPE_ITEM_THRESHOLD * 1.5;
        el.style.transform = 'translateX(' + dx + 'px)';
        if (dx > 8) { ra.style.opacity = '1'; la.style.opacity = '0'; }
        else if (dx < -8) { ra.style.opacity = '0'; la.style.opacity = '1'; }
        else { ra.style.opacity = '0'; la.style.opacity = '0'; }
    }, { passive: true });

    el.addEventListener('touchend', function() {
        if (!sw) return;
        sw = false;
        el.style.transition = 'transform .25s cubic-bezier(.4,0,.2,1)';

        if (cx > SWIPE_ITEM_THRESHOLD) {
            el.style.transform = 'translateX(0)';
            ra.style.opacity = '0';
            la.style.opacity = '0';
            toggleItem(idx);
        }
        else if (cx < -SWIPE_ITEM_THRESHOLD) {
            el.style.transform = 'translateX(-100%)';
            ra.style.opacity = '0';
            setTimeout(function() {
                la.style.opacity = '0';
                wrap.style.background = 'transparent';
                deleteActiveItem(idx);
            }, 150);
        }
        else {
            el.style.transform = 'translateX(0)';
            ra.style.opacity = '0';
            la.style.opacity = '0';
        }
        cx = 0;
    }, { passive: true });

    el.addEventListener('touchcancel', function() {
        sw = false;
        el.style.transform = 'translateX(0)';
        ra.style.opacity = '0';
        la.style.opacity = '0';
    }, { passive: true });

    return wrap;
}

function deleteActiveItem(idx) {
    try {
        var trip = getCurrentTrip();
        if (!trip || !trip.items[idx]) return;
        trip.items.splice(idx, 1);
        saveActive(); vibrate();
        renderChecklistPage(); renderHome(); renderProfile(); renderTripPage();
        showToast('Удалено');
    } catch (e) { bbLogError(7002, 'Ошибка удаления вещи', { stack: e.stack }); }
}

function buildCheckItem(item, idx) {
    var div = document.createElement('div');
    div.className = 'check-item' + (item.done ? ' checked' : '');

    var c = document.createElement('div');
    c.className = 'check-circle'; c.textContent = '✓';
    c.addEventListener('click', function(e) { e.stopPropagation(); toggleItem(idx); });
    div.appendChild(c);

    var b = document.createElement('div');
    b.className = 'check-body';
    var qtyBadge = (item.qty && item.qty > 1) ? '<span class="check-qty">×' + item.qty + '</span>' : '';
    var noteLine = item.note ? '<div class="check-note">' + escapeHtml(item.note) + '</div>' : '';
    b.innerHTML =
        '<div class="check-row-main">' +
            '<span class="check-text">' + highlight(item.text) + '</span>' +
            qtyBadge +
        '</div>' +
        noteLine;

    attachLongPress(b,
        function() { openEditItemModal(idx); },
        function() { toggleItem(idx); }
    );

    div.appendChild(b);
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
        renderChecklistPage(); renderHome(); renderProfile(); renderTripPage();
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

// ============ УДАЛЕНИЕ СПИСКА ИЗ ПОЕЗДКИ ============
function removeListFromTrip(listId) {
    var trip = getCurrentTrip();
    if (!trip) return;
    var itemsToRemove = trip.items.filter(function(i) {
        if (!i.listIds) return false;
        return i.listIds.length === 1 && i.listIds.indexOf(listId) !== -1;
    }).length;
    var srcName = '';
    if (trip.sources) {
        trip.sources.forEach(function(s) { if (s.id === listId) srcName = s.name; });
    }
    var msg = 'Удалить список "' + srcName + '" из поездки?\nБудет удалено ' + itemsToRemove + ' ' + plural(itemsToRemove, 'вещь', 'вещи', 'вещей') + '.';
    if (!confirm(msg)) return;

    if (trip.sources) {
        trip.sources = trip.sources.filter(function(s) { return s.id !== listId; });
    }

    trip.items = trip.items.filter(function(i) {
        if (!i.listIds) return true;
        var others = i.listIds.filter(function(x) { return x !== listId; });
        if (others.length === 0) return false;
        i.listIds = others;
        return true;
    });

    saveActive();
    renderChecklistPage();
    renderHome();
    renderTripPage();
    vibrate();
    showToast('Список удалён');
}

function showListHeaderMenu(listId) {
    var trip = getCurrentTrip();
    if (!trip) return;
    var srcName = '';
    if (trip.sources) {
        trip.sources.forEach(function(s) { if (s.id === listId) srcName = s.name; });
    }
    var action = confirm('Список "' + srcName + '"\n\nOK — удалить список\nОтмена — закрыть');
    if (action) removeListFromTrip(listId);
}

// ============ ПОГОДА ============
function loadWeather() {
    var trip = getCurrentTrip();
    if (!trip || !trip.city) {
        var card = $('weatherCard'); if (card) card.classList.remove('show');
        var tripCard = $('tripWeatherCard'); if (tripCard) tripCard.style.display = 'none';
        return;
    }
    var ck = 'weather_' + trip.city.toLowerCase();
    var cached = weatherCache[ck];
    if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL) { renderWeather(cached.data); return; }

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
        });
}

function renderWeather(data) {
    var cur = data.current || {}, code = cur.weather_code || 0;
    var w = WEATHER_CODES[code] || { icon: '🌡️', desc: 'Погода' };
    var trip = getCurrentTrip() || {};

    var hint = w.desc;
    if (cur.temperature_2m !== undefined) {
        if (cur.temperature_2m < 0) hint += ' · Возьми тёплые вещи 🧥';
        else if (cur.temperature_2m < 10) hint += ' · Нужна куртка';
        else if (cur.temperature_2m < 18) hint += ' · Лёгкая кофта';
        else if (cur.temperature_2m > 28) hint += ' · Очень жарко 🥵';
    }
    if (code >= 51 && code <= 82) hint += ' · Не забудь зонт ☔';
    if (code >= 71 && code <= 75) hint += ' · Снег ❄️';

    var daily = data.daily || {};
    var days = daily.time || [], codes = daily.weather_code || [], mx = daily.temperature_2m_max || [], mn = daily.temperature_2m_min || [];
    var dn = ['вс','пн','вт','ср','чт','пт','сб'];

    renderWeatherToCard('weatherCard', 'weatherIcon', 'weatherTemp', 'weatherCity', 'weatherDesc', 'weatherForecast', data, w, hint, trip, days, codes, mx, mn, dn);
    renderWeatherToCard('tripWeatherCard', 'tripWeatherIcon', 'tripWeatherTemp', 'tripWeatherCity', 'tripWeatherDesc', 'tripWeatherForecast', data, w, hint, trip, days, codes, mx, mn, dn);
}

function renderWeatherToCard(cardId, iconId, tempId, cityId, descId, forecastId, data, w, hint, trip, days, codes, mx, mn, dn) {
    var card = $(cardId); if (!card) return;
    card.classList.add('show');
    if (cardId === 'tripWeatherCard') card.style.display = '';

    var cur = data.current || {};

    var ie = $(iconId); if (ie) ie.textContent = w.icon;
    var te = $(tempId); if (te) te.textContent = Math.round(cur.temperature_2m) + '°';
    var ce = $(cityId); if (ce) ce.textContent = data._cityName || trip.city || '';
    var de = $(descId); if (de) de.textContent = hint;

    var fe = $(forecastId); if (!fe) return;
    fe.innerHTML = '';
    for (var i = 0; i < Math.min(5, days.length); i++) {
        var d = new Date(days[i]);
        var ww = WEATHER_CODES[codes[i]] || { icon: '🌡️' };
        var dayEl = document.createElement('div');
        dayEl.className = 'forecast-day';
        dayEl.innerHTML = '<div class="fd-name">' + dn[d.getDay()] + '</div>' +
                          '<div class="fd-icon">' + ww.icon + '</div>' +
                          '<div class="fd-temps"><div class="fd-max">' + Math.round(mx[i]) + '°</div>' +
                          '<div class="fd-min">' + Math.round(mn[i]) + '°</div></div>';
        fe.appendChild(dayEl);
    }

    attachWeatherTapToCard(cardId);
}

function attachWeatherTapToCard(cardId) {
    var card = $(cardId); if (!card) return;
    var head = card.querySelector('.weather-head'); if (!head) return;
    if (card._weatherHandler) head.removeEventListener('click', card._weatherHandler);
    card._weatherHandler = function() {
        card.classList.toggle('expanded');
        vibrate();
    };
    head.addEventListener('click', card._weatherHandler);
}

// ============ ДОБАВЛЕНИЕ ВЕЩИ ============
function openAddItemModal() {
    editingItemIdx = null;
    var trip = getCurrentTrip();
    if (!trip) { showToast('Нет активной поездки'); return; }
    ['Name','Note'].forEach(function(f) { var el = $('addItem' + f); if (el) el.value = ''; });
    var q = $('addItemQty'); if (q) q.value = '1';
    var t = $('addItemModalTitle'); if (t) t.textContent = 'Новая вещь';
    var btn = $('confirmAddItemBtn'); if (btn) btn.textContent = 'Добавить';
    openModal('addItemModal');
}

function openEditItemModal(idx) {
    var trip = getCurrentTrip();
    if (!trip || !trip.items[idx]) return;
    var item = trip.items[idx];
    editingItemIdx = idx;
    var n = $('addItemName'); if (n) n.value = item.text || '';
    var q = $('addItemQty'); if (q) q.value = item.qty || 1;
    var no = $('addItemNote'); if (no) no.value = item.note || '';
    var t = $('addItemModalTitle'); if (t) t.textContent = 'Править вещь';
    var btn = $('confirmAddItemBtn'); if (btn) btn.textContent = 'Сохранить';
    openModal('addItemModal');
}

function confirmAddItem() {
    try {
        var trip = getCurrentTrip();
        if (!trip) return;
        var n = (($('addItemName') || {}).value || '').trim();
        if (!n) { showToast('Введите название'); return; }
        var data = {
            text: n,
            qty: parseInt($('addItemQty').value) || 1,
            note: (($('addItemNote') || {}).value || '').trim()
        };
        if (editingItemIdx !== null && trip.items[editingItemIdx]) {
            var old = trip.items[editingItemIdx];
            old.text = data.text;
            old.qty = data.qty;
            old.note = data.note;
            saveActive();
            closeAddItemModal();
            renderChecklistPage(); renderHome(); renderTripPage(); vibrate();
            showToast('Сохранено');
        } else {
            data.done = false;
            data.from = '';
            data.listIds = [];
            trip.items.push(data);
            saveActive();
            closeAddItemModal();
            renderChecklistPage(); renderHome(); renderTripPage(); vibrate();
            showToast('Вещь добавлена!');
        }
    } catch (e) { bbLogError(7004, 'Ошибка добавления/правки вещи', { stack: e.stack }); }
}

function closeAddItemModal() {
    editingItemIdx = null;
    var t = $('addItemModalTitle'); if (t) t.textContent = 'Новая вещь';
    var btn = $('confirmAddItemBtn'); if (btn) btn.textContent = 'Добавить';
    closeModal('addItemModal');
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
function renderProfile() {
    try {
        var s = calcStats();
        var e;
        e = $('profileTotalTrips'); if (e) e.textContent = s.totalTrips;
        e = $('profileCompletedTrips'); if (e) e.textContent = s.completedTrips;
        e = $('profileItemsPacked'); if (e) e.textContent = s.allDone;
        e = $('profileName'); if (e) e.textContent = profile.name || 'Эрик';
        e = $('errorCountLabel'); if (e) e.textContent = bbGetErrorLog().length;
        var av = $('profileAvatar'), lt = $('profileAvatarLetter');
        if (av && lt) {
            if (profile.avatar) { av.style.backgroundImage = 'url(' + profile.avatar + ')'; av.classList.add('has-photo'); lt.textContent = ''; }
            else { av.style.backgroundImage = ''; av.classList.remove('has-photo'); lt.textContent = (profile.name || 'Э').charAt(0).toUpperCase(); }
        }
        var navAv = $('navAvatar'), navLt = $('navAvatarLetter');
        if (navAv && navLt) {
            if (profile.avatar) {
                navAv.style.backgroundImage = 'url(' + profile.avatar + ')';
                navAv.classList.add('has-photo');
                navLt.textContent = '';
            } else {
                navAv.style.backgroundImage = '';
                navAv.classList.remove('has-photo');
                navLt.textContent = (profile.name || 'Э').charAt(0).toUpperCase();
            }
        }
        renderAchievements(s);
    } catch (e) { bbLogError(3003, 'Ошибка рендера профиля', { stack: e.stack }); }
}

// ============ ДОСТИЖЕНИЯ ============
function renderAchievements(s) {
    var g = $('achievementsGrid'); if (!g) return;
    g.innerHTML = '';

    var isFirstRender = !achievementsRendered;
    achievementsRendered = true;

    // Считаем прогресс для каждой
    var items = ACHIEVEMENTS.map(function(a) {
        var progress = 0, max = a.max || 1, unlocked = false;
        try { progress = a.getProgress ? a.getProgress(s) : 0; } catch (e) { progress = 0; }
        try { unlocked = a.check(s); } catch (e) { unlocked = false; }
        if (unlocked && !achievementsState[a.id]) achievementsState[a.id] = Date.now();
        return { a: a, progress: progress, max: max, unlocked: unlocked };
    });

    // Сортировка: разблокированные (свежие сверху) → в процессе (по % убыв) → не начатые
    items.sort(function(x, y) {
        if (x.unlocked !== y.unlocked) return x.unlocked ? -1 : 1;
        if (x.unlocked && y.unlocked) {
            var dx = achievementsState[x.a.id] || 0;
            var dy = achievementsState[y.a.id] || 0;
            return dy - dx;
        }
        var px = x.max > 0 ? x.progress / x.max : 0;
        var py = y.max > 0 ? y.progress / y.max : 0;
        return py - px;
    });

    var unlockedCount = items.filter(function(it) { return it.unlocked; }).length;

    // Счётчик в шапке — обновим, если есть элемент
    var counter = $('achCounter');
    if (counter) counter.textContent = unlockedCount + ' из ' + ACHIEVEMENTS.length;

    // Рендер карточек
    items.forEach(function(it, idx) {
        var a = it.a;
        var pct = it.max > 0 ? Math.min(100, Math.round((it.progress / it.max) * 100)) : 0;

        var card = document.createElement('div');
        card.className = 'achievement-row' + (it.unlocked ? ' unlocked' : '');

        if (isFirstRender) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(8px)';
            card.style.animation = 'achFadeIn .35s ease ' + (idx * 0.04) + 's forwards';
        }

        var barColor = it.unlocked
            ? 'linear-gradient(90deg,#4ecb71,#2f9c53)'
            : 'linear-gradient(90deg,var(--accent-1),var(--accent-2))';

        card.innerHTML =
            '<div class="ach-row-top">' +
                '<div class="ach-row-icon">' + a.icon + '</div>' +
                '<div class="ach-row-name">' + escapeHtml(a.name) + '</div>' +
            '</div>' +
            '<div class="ach-row-bar">' +
                '<div class="ach-row-fill" style="width:' + pct + '%;background:' + barColor + '"></div>' +
            '</div>';

        card.addEventListener('click', function() { openAchievementSheet(a.id); });
        g.appendChild(card);
    });

    saveAchievements();

    // Тост о новом достижении
    if (isFirstRender) {
        var justUnlocked = [];
        ACHIEVEMENTS.forEach(function(a) {
            if (achievementsState[a.id] && Date.now() - achievementsState[a.id] < 3000) justUnlocked.push(a);
        });
        if (justUnlocked.length) {
            setTimeout(function() { showToast('🏆 ' + justUnlocked[0].name); }, 500);
        }
    }
}

// ============ BOTTOM SHEET ДОСТИЖЕНИЯ ============
function openAchievementSheet(id) {
    try {
        var a = null;
        for (var i = 0; i < ACHIEVEMENTS.length; i++) {
            if (ACHIEVEMENTS[i].id === id) { a = ACHIEVEMENTS[i]; break; }
        }
        if (!a) return;

        var s = calcStats();
        var progress = 0, max = a.max || 1, unlocked = false;
        try { progress = a.getProgress ? a.getProgress(s) : 0; } catch (e) { progress = 0; }
        try { unlocked = a.check(s); } catch (e) { unlocked = false; }

        var pct = max > 0 ? Math.min(100, Math.round((progress / max) * 100)) : 0;
        var remaining = Math.max(0, max - progress);

        var sheet = $('achievementSheet');
        if (!sheet) return;

        var iconEl = $('achSheetIcon'); if (iconEl) iconEl.textContent = a.icon;
        var nameEl = $('achSheetName'); if (nameEl) nameEl.textContent = a.name;
        var descEl = $('achSheetDesc');
        if (descEl) {
            var text = a.fullDesc || a.desc || '';
            if (unlocked) {
                var dateStr = '';
                if (achievementsState[a.id]) {
                    try {
                        var d = new Date(achievementsState[a.id]);
                        dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                    } catch (e) {}
                }
                if (dateStr) {
                    text += '\n\n✨ Получено ' + dateStr;
                } else {
                    text += '\n\n✨ Получено!';
                }
            }
            descEl.textContent = text;
        }
        var progressEl = $('achSheetProgress');
        if (progressEl) {
            progressEl.textContent = 'Сейчас: ' + progress + ' из ' + max;
        }
        var barEl = $('achSheetBar');
        if (barEl) {
            barEl.style.width = pct + '%';
            barEl.style.background = unlocked
                ? 'linear-gradient(90deg,#4ecb71,#2f9c53)'
                : 'linear-gradient(90deg,var(--accent-1),var(--accent-2))';
        }
        var remainEl = $('achSheetRemain');
        if (remainEl) {
            if (unlocked) {
                remainEl.textContent = 'Достижение получено';
                remainEl.style.color = 'var(--success)';
            } else {
                remainEl.textContent = 'Осталось: ' + remaining + ' ' + plural(remaining, a.unit || 'шаг', a.unit ? a.unit + 'а' : 'шага', a.unit ? a.unit + 'ов' : 'шагов');
                remainEl.style.color = '';
            }
        }

        sheet.classList.add('show');
        resetUIBlocks();
        vibrate();
    } catch (e) {
        bbLogError(9029, 'Ошибка открытия достижения: ' + e.message, { stack: e.stack });
    }
}

function closeAchievementSheet() {
    var sheet = $('achievementSheet');
    if (sheet) sheet.classList.remove('show');
    resetUIBlocks();
}

// ============ ЭКСПОРТ / ИМПОРТ ============
function exportData() {
    try {
        var data = {
            version: BB_VERSION,
            exportDate: new Date().toISOString(),
            activeTrips: activeTrips,
            tripHistory: tripHistory,
            customTypes: customTypes,
            customTripTypes: customTripTypes,
            profile: profile,
            settings: settings,
            achievementsState: achievementsState
        };
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'mybag-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        vibrate();
        showToast('Файл сохранён');
    } catch (e) {
        bbLogError(9021, 'Ошибка экспорта: ' + e.message, { stack: e.stack });
        showToast('Ошибка экспорта');
    }
}

function openImportPicker() {
    var fileInput = $('importDataFile');
    if (fileInput) {
        fileInput.value = '';
        fileInput.click();
    }
}

function importData(file) {
    if (!file) return;
    try {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!data || typeof data !== 'object' || !data.version) {
                    showToast('Неверный формат файла');
                    return;
                }
                var stats = [];
                if (data.activeTrips && Array.isArray(data.activeTrips)) stats.push(data.activeTrips.length + ' поездок');
                if (data.customTypes && typeof data.customTypes === 'object') stats.push(Object.keys(data.customTypes).length + ' списков');
                if (data.tripHistory && Array.isArray(data.tripHistory)) stats.push(data.tripHistory.length + ' в истории');
                var preview = stats.length ? 'В файле: ' + stats.join(', ') + '.\n\n' : '';
                var msg = preview + 'Заменить все текущие данные? Это действие нельзя отменить.';
                if (!confirm(msg)) return;

                try { localStorage.clear(); } catch (er) {}

                saveJSON('bybag_active_trips', data.activeTrips || []);
                saveJSON('bybag_history', data.tripHistory || []);
                saveJSON('bybag_custom_types', data.customTypes || {});
                saveJSON('bybag_custom_trip_types', data.customTripTypes || {});
                saveJSON('bybag_profile', data.profile || { name: 'Эрик', avatar: null });
                saveJSON('bybag_settings', data.settings || { dark: false, notif: true, vibrate: true, hideDone: false });
                saveJSON('bybag_achievements', data.achievementsState || {});

                vibrate();
                showToast('Данные восстановлены');
                setTimeout(function() { location.reload(); }, 700);
            } catch (err) {
                bbLogError(9022, 'Ошибка парсинга импорта: ' + err.message, { stack: err.stack });
                showToast('Ошибка чтения файла');
            }
        };
        reader.onerror = function() {
            showToast('Ошибка чтения файла');
        };
        reader.readAsText(file);
    } catch (e) {
        bbLogError(9023, 'Ошибка импорта: ' + e.message, { stack: e.stack });
        showToast('Ошибка импорта');
    }
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

// ============ НАСТРОЙКИ ============
function openSettingsPage() {
    try {
        var sp = $('settingsPage');
        if (!sp) {
            showToast('Ошибка: settingsPage не найдена в HTML');
            bbLogError(9029, 'settingsPage отсутствует в HTML');
            return;
        }
        var e = $('errorCountLabel'); if (e) e.textContent = bbGetErrorLog().length;
        applyTheme();
        sp.classList.add('active');
        resetUIBlocks();
        var bn = document.querySelector('.bottom-nav');
        if (bn) bn.style.display = 'none';
        vibrate();
    } catch (err) {
        bbLogError(9029, 'Ошибка открытия настроек: ' + err.message, { stack: err.stack });
        showToast('Ошибка открытия настроек: ' + err.message);
    }
}

function closeSettingsPage() {
    try {
        var sp = $('settingsPage');
        if (sp) sp.classList.remove('active');
        resetUIBlocks();
        var bn = document.querySelector('.bottom-nav');
        if (bn) bn.style.display = '';
        renderProfile();
    } catch (e) {
        bbLogError(9029, 'Ошибка закрытия настроек: ' + e.message, { stack: e.stack });
    }
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
    if (page === 'trip') renderTripPage();
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

// ============ РЕДАКТИРОВАНИЕ ПРОФИЛЯ ============
function openEditProfile() {
    try {
        var n = $('editName'); if (n) n.value = profile.name || '';
        var ea = $('editAvatar'), el = $('editAvatarLetter');
        if (ea && el) {
            if (profile.avatar) {
                ea.style.backgroundImage = 'url(' + profile.avatar + ')';
                el.textContent = '';
            } else {
                ea.style.backgroundImage = '';
                el.textContent = (profile.name || 'Э').charAt(0).toUpperCase();
            }
        }
        openModal('editProfileModal');
    } catch (e) {
        bbLogError(8002, 'Ошибка открытия редактирования профиля: ' + e.message, { stack: e.stack });
        showToast('Ошибка: ' + e.message);
    }
}

function saveProfileChanges() {
    try {
        profile.name = (($('editName') || {}).value || '').trim() || 'Эрик';
        saveProfile();
        closeModal('editProfileModal');
        renderProfile();
        showToast('Профиль сохранён');
    } catch (e) {
        bbLogError(8002, 'Ошибка сохранения профиля: ' + e.message, { stack: e.stack });
        showToast('Ошибка сохранения');
    }
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
                saveProfile();
                renderProfile();
            } catch (ex) {
                bbLogError(8001, 'Ошибка обработки аватара', { stack: ex.stack });
                showToast('Ошибка загрузки фото');
            }
        };
        img.onerror = function() {
            bbLogError(8001, 'Не удалось загрузить изображение');
            showToast('Не удалось загрузить фото');
        };
        img.src = ev.target.result;
    };
    rd.readAsDataURL(f);
}

function resetAvatar() {
    try {
        profile.avatar = null;
        saveProfile();
        var ea = $('editAvatar'); if (ea) ea.style.backgroundImage = '';
        var el = $('editAvatarLetter');
        if (el) el.textContent = ((($('editName') || {}).value || '') || 'Э').charAt(0).toUpperCase();
        renderProfile();
        showToast('Фото удалено');
    } catch (e) {
        bbLogError(8001, 'Ошибка сброса аватара: ' + e.message, { stack: e.stack });
    }
}