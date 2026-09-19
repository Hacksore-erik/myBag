// ============================================================
// myBag — Инициализация, обработчики кнопок, запуск приложения
// Файл: js/main.js
// Версия: 2.8.0
// ============================================================

function bind(id, ev, fn) { var el = $(id); if (el) { try { el.addEventListener(ev, fn); } catch (e) {} } }

function init() {
    try {
        // ===== ПРОВЕРКА ЭКРАНА-ЗАГЛУШКИ =====
        if (typeof BLOCKED_CONFIG !== 'undefined' && BLOCKED_CONFIG && BLOCKED_CONFIG.enabled) {
            var bs = document.getElementById('blockedScreen');
            if (bs) {
                var t = document.getElementById('blockedTitle');
                var s = document.getElementById('blockedSubtitle');
                var f = document.getElementById('blockedFooter');
                if (t) t.textContent = BLOCKED_CONFIG.title || '';
                if (s) s.textContent = BLOCKED_CONFIG.subtitle || '';
                if (f) f.textContent = BLOCKED_CONFIG.footer || '';
                bs.classList.add('show');
            }
            return; // ⛔ дальше не идём — приложение не запускается
        }

        loadData();
        applyTheme();

        // Закрытие модалок по кнопке ✕
        document.querySelectorAll('[data-close]').forEach(function(b) {
            b.addEventListener('click', function() {
                var id = b.getAttribute('data-close');
                if (id === 'addItemModal') closeAddItemModal();
                else if (id === 'noteModal') closeNoteModal();
                else closeModal(id);
            });
        });

        // Закрытие модалок по клику на фон
        ['typeModal','editProfileModal','listEditorModal','addItemModal','wizardStep1','wizardStep2','tripWizardStep1','tripWizardStep2','advancedItemModal','advancedItemModal2','errorLogModal','addListToTripModal','tripInfoModal','noteModal'].forEach(function(id) {
            var el = $(id);
            if (el) el.addEventListener('click', function(e) {
                if (e.target === this) {
                    if (id === 'addItemModal') closeAddItemModal();
                    else if (id === 'noteModal') closeNoteModal();
                    else closeModal(id);
                }
            });
        });

        // Нижняя навигация
        document.querySelectorAll('.nav-item').forEach(function(n) {
            n.addEventListener('click', function() { switchPage(n.getAttribute('data-page')); });
        });

        // Основные кнопки
        bind('createBtn', 'click', createTrip);
        bind('checklistBackBtn', 'click', closeChecklistPage);
        bind('checklistShareBtn', 'click', shareActiveTrip);
        bind('confirmAddItemBtn', 'click', confirmAddItem);
        bind('createNewListBtn', 'click', startWizard);

        // FAB (плавающая кнопка добавления)
        bind('fabMainBtn', 'click', toggleFabMenu);
        bind('fabOverlay', 'click', closeFabMenu);
        bind('fabItemItem', 'click', function() {
            closeFabMenu();
            try {
                if (typeof openAddItemModal === 'function') openAddItemModal();
                else showToast('Ошибка: openAddItemModal не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });
        bind('fabItemList', 'click', function() {
            closeFabMenu();
            try {
                if (typeof openAddListToTripModal === 'function') {
                    openAddListToTripModal();
                } else {
                    showToast('Ошибка: openAddListToTripModal не найдена');
                }
            } catch (e) {
                showToast('Ошибка: ' + e.message);
                bbLogError(9020, 'Ошибка клика fabItemList: ' + e.message, { stack: e.stack });
            }
        });
        bind('addListToTripConfirmBtn', 'click', function() {
            try {
                if (typeof confirmAddListToTrip === 'function') confirmAddListToTrip();
                else showToast('Ошибка: confirmAddListToTrip не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });

        // Поиск и скрытие
        bind('searchInput', 'input', function() {
            var v = this.value;
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(function() { searchQuery = v; renderChecklistPage(); }, 150);
        });
        bind('hideDoneToggle', 'click', function() { settings.hideDone = !settings.hideDone; saveSettings(); renderChecklistPage(); });

        // Мастер списка
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

        // Мастер типа
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

        // Advanced Item
        bind('advConfirmBtn', 'click', advConfirm);
        bind('adv2ConfirmBtn', 'click', adv2Confirm);

        // Редактор списка
        bind('addItemBtn', 'click', editorAddQuick);
        bind('newItemInput', 'keypress', function(e) { if (e.key === 'Enter') editorAddQuick(); });
        bind('listName', 'input', updateEditorPreview);
        bind('saveListBtn', 'click', saveEditor);
        bind('deleteListBtn', 'click', deleteEditingList);
        bind('listAdvancedBtn', 'click', function() { openAdvanced('editor'); });

        // Профиль
        bind('editProfileBtn', 'click', openEditProfile);
        bind('profileAvatar', 'click', openEditProfile);
        bind('saveProfileBtn', 'click', saveProfileChanges);
        bind('avatarInput', 'change', handleAvatarUpload);
        bind('editAvatar', 'click', function() { var a = $('avatarInput'); if (a) a.click(); });
        bind('resetAvatarBtn', 'click', resetAvatar);

        // Шестерёнка → настройки
        bind('profileSettingsBtn', 'click', function() {
            try {
                if (typeof openSettingsPage === 'function') openSettingsPage();
                else showToast('Ошибка: openSettingsPage не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });
        bind('settingsBackBtn', 'click', function() {
            try {
                if (typeof closeSettingsPage === 'function') closeSettingsPage();
            } catch (e) {}
        });
        bind('settingsEditProfileBtn', 'click', function() {
            try {
                if (typeof openEditProfile === 'function') openEditProfile();
            } catch (e) {}
        });

        // Заметки о поездке
        bind('noteSaveBtn', 'click', function() {
            try {
                if (typeof saveNote === 'function') saveNote();
                else showToast('Ошибка: saveNote не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });
        bind('noteDeleteBtn', 'click', function() {
            try {
                if (editingNoteIdx !== null && typeof deleteNote === 'function') deleteNote(editingNoteIdx);
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });

        // Информация о поездке
        bind('saveTripInfoBtn', 'click', function() {
            try {
                if (typeof saveTripInfo === 'function') saveTripInfo();
                else showToast('Ошибка: saveTripInfo не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });

        // Экспорт / импорт
        bind('exportDataBtn', 'click', function() {
            try {
                if (typeof exportData === 'function') exportData();
                else showToast('Ошибка: exportData не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });
        bind('importDataBtn', 'click', function() {
            try {
                if (typeof openImportPicker === 'function') openImportPicker();
                else showToast('Ошибка: openImportPicker не найдена');
            } catch (e) { showToast('Ошибка: ' + e.message); }
        });
        bind('importDataFile', 'change', function(e) {
            if (e.target.files && e.target.files[0]) {
                try {
                    if (typeof importData === 'function') importData(e.target.files[0]);
                    else showToast('Ошибка: importData не найдена');
                } catch (err) { showToast('Ошибка: ' + err.message); }
            }
        });

        // Настройки (тоглы)
        bind('darkModeToggleItem', 'click', function() { settings.dark = !settings.dark; saveSettings(); applyTheme(); });
        bind('notifToggleItem', 'click', function() {
            settings.notif = !settings.notif; saveSettings(); applyTheme();
            if (settings.notif && 'Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} }
        });
        bind('vibrateToggleItem', 'click', function() { settings.vibrate = !settings.vibrate; saveSettings(); applyTheme(); vibrate(); });

        // Онбординг
        bind('showOnboardingBtn', 'click', showOnboarding);
        bind('onbNextBtn', 'click', nextOnbSlide);
        bind('onbSkipBtn', 'click', function() {
            hideOnboarding();
            if (!localStorage.getItem('bybag_notif_asked')) setTimeout(showNotifOnboarding, 600);
        });

        // TipViewer
        bind('tipViewerClose', 'click', closeTipViewer);

        // Уведомления
        bind('notifAllowBtn', 'click', handleNotifAllow);
        bind('notifLaterBtn', 'click', handleNotifLater);

        // Журнал ошибок
        bind('viewErrorLogBtn', 'click', function() { openErrorLog(); openModal('errorLogModal'); });
        bind('downloadLogBtn', 'click', downloadErrorLog);
        bind('clearLogBtn', 'click', function() {
            if (confirm('Очистить журнал ошибок?')) { bbClearErrorLog(); openErrorLog(); renderProfile(); }
        });

        // Свайп в tipViewer
        var tv = $('tipViewer');
        if (tv) {
            var tStartX = 0, tStartY = 0, tStartT = 0, tDown = false, tMoved = false, tMovedAt = 0;
            tv.addEventListener('touchstart', function(e) {
                tStartX = e.touches[0].clientX;
                tStartY = e.touches[0].clientY;
                tStartT = Date.now();
                tDown = true;
                tMoved = false;
                tMovedAt = 0;
            }, { passive: true });
            tv.addEventListener('touchmove', function(e) {
                if (!tDown) return;
                var dx = Math.abs(e.touches[0].clientX - tStartX);
                var dy = Math.abs(e.touches[0].clientY - tStartY);
                if (dx > 10 || dy > 10) {
                    if (!tMoved) tMovedAt = Date.now();
                    tMoved = true;
                }
            }, { passive: true });
            tv.addEventListener('touchend', function(e) {
                if (!tDown) return;
                tDown = false;
                if (!tMoved) return;
                var dx = e.changedTouches[0].clientX - tStartX;
                var dy = e.changedTouches[0].clientY - tStartY;
                var dt = Date.now() - tStartT;
                if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 2 && dt < 300) {
                    closeTipViewer();
                    return;
                }
                if (tipsMode !== 'cat') return;
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    if (dx < 0 && currentTipIdx < TIPS_CATEGORIES.length - 1) openTipViewer(currentTipIdx + 1);
                    else if (dx > 0 && currentTipIdx > 0) openTipViewer(currentTipIdx - 1);
                }
            }, { passive: true });
        }

        // Свайп справа налево по странице настроек → назад
        var sp = $('settingsPage');
        if (sp) {
            var spStartX = 0, spStartY = 0, spDown = false, spHoriz = false;
            sp.addEventListener('touchstart', function(e) {
                spStartX = e.touches[0].clientX;
                spStartY = e.touches[0].clientY;
                spDown = true;
                spHoriz = false;
            }, { passive: true });
            sp.addEventListener('touchmove', function(e) {
                if (!spDown) return;
                var dx = e.touches[0].clientX - spStartX;
                var dy = e.touches[0].clientY - spStartY;
                if (!spHoriz && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) spHoriz = true;
            }, { passive: true });
            sp.addEventListener('touchend', function(e) {
                if (!spDown) return;
                spDown = false;
                if (!spHoriz) return;
                var dx = e.changedTouches[0].clientX - spStartX;
                if (dx > 80) {
                    // свайп слева направо = назад
                    try { closeSettingsPage(); } catch (err) {}
                }
            }, { passive: true });
        }

        // Первичный рендер
        renderHome();
        renderProfile();
        renderListsPage();
        renderTripPage();

        // Онбординг и уведомления
        if (!localStorage.getItem('bybag_onboarding_done')) setTimeout(showOnboarding, 800);
        else if (!localStorage.getItem('bybag_notif_asked')) setTimeout(showNotifOnboarding, 1200);

        // Напоминания
        setTimeout(checkReminders, 3000);
        setInterval(checkReminders, 3600000);
    } catch (e) {
        bbLogError(1001, 'Ошибка инициализации приложения', { stack: e.stack });
        showErrorScreen(1001, 'Ошибка инициализации приложения', e);
    }
}

// ============ ЗАПУСК ============
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();