// ============================================================
// myBag — Инициализация, обработчики кнопок, запуск приложения
// Файл: js/main.js
// Версия: 2.5.0
// ============================================================

function bind(id, ev, fn) { var el = $(id); if (el) { try { el.addEventListener(ev, fn); } catch (e) {} } }

function init() {
    try {
        loadData();
        applyTheme();

        // Закрытие модалок по кнопке ✕
        document.querySelectorAll('[data-close]').forEach(function(b) {
            b.addEventListener('click', function() {
                var id = b.getAttribute('data-close');
                if (id === 'addItemModal') closeAddItemModal(); else closeModal(id);
            });
        });

        // Закрытие модалок по клику на фон
        ['typeModal','editProfileModal','listEditorModal','addItemModal','wizardStep1','wizardStep2','tripWizardStep1','tripWizardStep2','advancedItemModal','advancedItemModal2','manageCategoriesModal','errorLogModal'].forEach(function(id) {
            var el = $(id);
            if (el) el.addEventListener('click', function(e) {
                if (e.target === this) { if (id === 'addItemModal') closeAddItemModal(); else closeModal(id); }
            });
        });

        // Category modal — отдельная логика возврата родителя
        var catOverlay = $('categoryModal');
        if (catOverlay) catOverlay.addEventListener('click', function(e) { if (e.target === this) cancelCategoryCreation(); });
        bind('categoryCloseBtn', 'click', cancelCategoryCreation);

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
            openAddItemModal();
        });
        bind('fabItemList', 'click', function() {
            closeFabMenu();
            openAddListToTripModal();
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

        // Advanced Item (добавить вещь подробно)
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

        // Настройки
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

        // TipViewer (советы / что нового)
        bind('tipViewerClose', 'click', closeTipViewer);

        // Уведомления onboarding
        bind('notifAllowBtn', 'click', handleNotifAllow);
        bind('notifLaterBtn', 'click', handleNotifLater);

        // Категории
        bind('manageCategoriesBtn', 'click', openManageCategories);
        bind('addNewCatFromList', 'click', function() { openCategoryModal(null, 'manageCategoriesModal'); });
        bind('saveCatBtn', 'click', saveNewCategory);

        // Журнал ошибок
        bind('viewErrorLogBtn', 'click', function() { openErrorLog(); openModal('errorLogModal'); });
        bind('downloadLogBtn', 'click', downloadErrorLog);
        bind('clearLogBtn', 'click', function() {
            if (confirm('Очистить журнал ошибок?')) { bbClearErrorLog(); openErrorLog(); renderProfile(); }
        });

        // Категории в модалках — change обрабатывается глобально
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

        // Свайп в tipViewer (советы)
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

        // Первичный рендер
        renderHome();
        renderProfile();
        renderListsPage();

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