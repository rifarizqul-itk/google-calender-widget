/**
 * Google Calendar Desktop Widget - Renderer Controller
 */
(function initWidget() {
    'use strict';

    // State
    let allEvents = [];
    let timelineGroups = {};
    let currentMonthDate = new Date();
    let selectedCalendarDate = null;
    let isPinned = false;
    let countdownIntervalId = null;
    let activeDetailEvent = null;

    // DOM Elements
    const authOverlay = document.getElementById('authOverlay');
    const btnLoginGoogle = document.getElementById('btnLoginGoogle');
    const currentDateNumber = document.getElementById('currentDateNumber');
    const syncStatus = document.getElementById('syncStatus');
    const statusDot = syncStatus.querySelector('.status-dot');
    const statusLabel = syncStatus.querySelector('.status-label');

    const btnLangToggle = document.getElementById('btnLangToggle');
    const langIndicator = document.getElementById('langIndicator');
    const btnLangId = document.getElementById('btnLangId');
    const btnLangEn = document.getElementById('btnLangEn');

    const btnFilterCalendars = document.getElementById('btnFilterCalendars');
    const btnPin = document.getElementById('btnPin');
    const btnRefresh = document.getElementById('btnRefresh');
    const btnAddEvent = document.getElementById('btnAddEvent');
    const btnMinimize = document.getElementById('btnMinimize');
    const btnClose = document.getElementById('btnClose');

    const nextEventBanner = document.getElementById('nextEventBanner');
    const nextEventTitle = document.getElementById('nextEventTitle');
    const nextEventTime = document.getElementById('nextEventTime');
    const nextEventCountdown = document.getElementById('nextEventCountdown');

    const tabButtons = document.querySelectorAll('.tab-btn');
    const viewAgenda = document.getElementById('viewAgenda');
    const viewMonth = document.getElementById('viewMonth');
    const eventsTimeline = document.getElementById('eventsTimeline');

    // Calendar Elements
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const monthYearLabel = document.getElementById('monthYearLabel');
    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    const selectedDateTitle = document.getElementById('selectedDateTitle');
    const dayEventsList = document.getElementById('dayEventsList');

    // Quick Add Modal Elements
    const addEventModal = document.getElementById('addEventModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const formAddEvent = document.getElementById('formAddEvent');
    const selectTargetCalendar = document.getElementById('selectTargetCalendar');
    const inputEventTitle = document.getElementById('inputEventTitle');
    const checkboxAllDay = document.getElementById('checkboxAllDay');
    const inputEventStart = document.getElementById('inputEventStart');
    const inputEventEnd = document.getElementById('inputEventEnd');
    const inputEventLocation = document.getElementById('inputEventLocation');
    const inputEventDescription = document.getElementById('inputEventDescription');

    // Event Details Modal Elements
    const eventDetailsModal = document.getElementById('eventDetailsModal');
    const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    const detailCalBadge = document.getElementById('detailCalBadge');
    const btnCopyCalLink = document.getElementById('btnCopyCalLink');
    const detailTitle = document.getElementById('detailTitle');
    const detailTime = document.getElementById('detailTime');
    const detailCountdown = document.getElementById('detailCountdown');
    const detailMeetContainer = document.getElementById('detailMeetContainer');
    const btnDetailJoinMeet = document.getElementById('btnDetailJoinMeet');
    const detailLocationRow = document.getElementById('detailLocationRow');
    const detailLocation = document.getElementById('detailLocation');
    const btnCopyLocation = document.getElementById('btnCopyLocation');
    const detailDescSection = document.getElementById('detailDescSection');
    const detailDescription = document.getElementById('detailDescription');
    const detailAttendeesSection = document.getElementById('detailAttendeesSection');
    const detailAttendeesLabel = document.getElementById('detailAttendeesLabel');
    const detailAttendeesList = document.getElementById('detailAttendeesList');
    const detailCreatorRow = document.getElementById('detailCreatorRow');
    const detailCreator = document.getElementById('detailCreator');
    const btnCopyCreator = document.getElementById('btnCopyCreator');
    const btnDetailDelete = document.getElementById('btnDetailDelete');
    const btnDetailOpenWeb = document.getElementById('btnDetailOpenWeb');

    // Calendar Filter Modal Elements
    const calendarFilterModal = document.getElementById('calendarFilterModal');
    const btnCloseFilterModal = document.getElementById('btnCloseFilterModal');
    const calendarChecklistContainer = document.getElementById('calendarChecklistContainer');
    const btnSelectAllCalendars = document.getElementById('btnSelectAllCalendars');
    const btnDeselectAllCalendars = document.getElementById('btnDeselectAllCalendars');
    const btnApplyCalendarFilter = document.getElementById('btnApplyCalendarFilter');

    // Custom In-App Delete Confirmation Modal Elements
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    const confirmDeleteMsg = document.getElementById('confirmDeleteMsg');
    let pendingDeleteAction = null;

    // Toast Container
    const toastContainer = document.getElementById('toastContainer');

    // Internationalization (i18n) Engine
    const I18N_STRINGS = {
        id: {
            locale: 'id-ID',
            appTitle: 'Calendar',
            synced: 'Tersinkron',
            syncing: 'Menyinkron...',
            offlineCache: 'Offline (Cache)',
            notLoggedIn: 'Belum Login',
            syncFailed: 'Gagal Sinkron',
            themeDark: 'Ganti ke Mode Gelap',
            themeLight: 'Ganti ke Mode Terang',
            langToggle: 'Switch to English',
            filterCal: 'Pilih Kalender (Pengaturan)',
            pinActive: 'Widget dipin (Always on Top)',
            pinInactive: 'Widget dilepas dari layar (Unpinned)',
            pinTitle: 'Pin / Always on Top',
            refreshTitle: 'Refresh Jadwal',
            addEventTitle: 'Tambah Acara Baru',
            minimizeTitle: 'Minimize Window',
            closeTitle: 'Tutup Window',
            
            bannerUpcoming: 'SEGERA',
            bannerNoEvents: 'Tidak ada agenda dekat',
            bannerRelax: 'Santai sejenak',
            
            tabAgenda: 'Agenda',
            tabMonth: 'Kalender',
            
            relToday: 'Hari Ini',
            relTomorrow: 'Besok',
            relYesterday: 'Kemarin',
            allDay: 'Sepanjang Hari',
            
            ongoing: 'Sedang Berlangsung',
            finished: 'Selesai',
            minutesLeft: (m) => `${m} menit lagi`,
            hoursLeft: (h, m) => m > 0 ? `${h} jam ${m} m lagi` : `${h} jam lagi`,
            daysLeft: (d) => `${d} hari lagi`,
            
            joinMeet: 'Join Meet',
            emptyAgendaTitle: 'Tidak Ada Jadwal Mendatang',
            emptyAgendaDesc: 'Semua kegiatan sudah selesai atau belum ada agenda baru yang tersimpan.',
            emptyAddEvent: 'Tambah Acara Baru',
            emptyRefresh: 'Perbarui',
            errorAgendaTitle: 'Gagal Memuat Jadwal',
            errorAgendaDesc: 'Terjadi gangguan saat mengambil data dari Google Calendar. Periksa koneksi internet atau sesi login akun Anda.',
            retrySync: 'Coba Sinkron Ulang',
            
            weekdays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
            selectedDateTitle: 'Jadwal Tanggal Ini',
            noAgendaDate: 'Tidak ada agenda di tanggal ini.',
            quickAddDate: 'Tambah Acara',
            
            modalAddEyebrow: 'AGENDA BARU',
            modalAddTitle: 'Tambah Acara',
            lblTargetCalendar: 'Simpan ke Kalender',
            lblEventTitle: 'Judul Acara',
            phEventTitle: 'Contoh: Diskusi Roadmap Produk',
            lblAllDay: 'Acara Seharian (All Day)',
            lblStart: 'Mulai',
            lblEnd: 'Selesai',
            lblLocation: 'Lokasi (Opsional)',
            phLocation: 'Contoh: Gedung Lab B-204 / Google Meet',
            lblDesc: 'Deskripsi / Catatan (Opsional)',
            phDesc: 'Catatan agenda atau tugas...',
            btnCancel: 'Batal',
            btnSubmitEvent: 'Simpan ke Google',
            btnSubmitting: 'Menyimpan...',
            valEndAfterStart: 'Waktu selesai harus setelah waktu mulai!',
            toastEventSaved: 'Acara berhasil disimpan ke Google Calendar!',
            toastEventSaveFailed: (err) => `Gagal menambah acara: ${err}`,
            
            detailLocation: 'Lokasi',
            detailReminders: 'Pengingat',
            detailDesc: 'Deskripsi / Catatan',
            detailCreator: 'Pembuat Acara',
            detailOrganizer: 'Penyelenggara',
            detailAttendees: (n) => `Peserta (${n}):`,
            btnJoinMeetFull: 'Gabung Google Meet',
            btnDeleteEvent: 'Hapus',
            btnOpenWeb: 'Buka di Web',
            toastCopyCal: 'URL kalender asli berhasil disalin',
            toastCopyLoc: 'Lokasi berhasil disalin ke clipboard',
            toastCopyCreator: 'Info pembuat berhasil disalin ke clipboard',
            toastEventDeleted: 'Acara berhasil dihapus dari Google Calendar',
            toastEventDeleteFailed: (err) => `Gagal menghapus acara: ${err}`,
            
            settingsEyebrow: 'PENGATURAN',
            settingsTitle: 'Pengaturan & Kalender',
            settingsSubtitle: 'Kelola tampilan, bahasa, dan kalender yang aktif',
            selectAll: 'Pilih Semua',
            deselectAll: 'Kosongkan',
            loadingCalendars: 'Memuat kalender...',
            noCalendarsTitle: 'Tidak Ada Kalender',
            noCalendarsDesc: 'Tidak ditemukan kalender yang dapat disinkronkan.',
            failedCalendarsTitle: 'Gagal Memuat Kalender',
            failedCalendarsDesc: 'Terjadi masalah jaringan saat mengambil daftar kalender.',
            btnReload: 'Muat Ulang',
            btnRetry: 'Coba Lagi',
            lblStartup: 'Jalankan otomatis saat Windows dinyalakan',
            lblLanguage: 'Bahasa Antarmuka',
            descLanguage: 'Pilih bahasa antarmuka widget',
            lblDiagnostics: 'Diagnostik Sistem',
            descDiagnostics: 'File log aktivitas & crash dump',
            btnOpenLogs: 'Buka Folder Log',
            lblAccount: 'Akun Google',
            descAccount: 'Terhubung dengan Google Calendar',
            btnLogout: 'Putuskan Akun',
            btnApplySettings: 'Terapkan Pengaturan',
            btnApplying: 'Menerapkan...',
            toastSettingsApplied: 'Pengaturan kalender berhasil diterapkan',
            toastSettingsFailed: (err) => `Gagal menerapkan pengaturan: ${err}`,
            
            confirmDeleteTitle: 'Hapus Acara?',
            confirmDeleteMsg: (s) => `Apakah Anda yakin ingin menghapus acara "${s}" dari Google Calendar?`,
            confirmDeleteBtn: 'Ya, Hapus',
            
            confirmLogoutTitle: 'Putuskan Akun Google?',
            confirmLogoutMsg: 'Apakah Anda yakin ingin memutuskan hubungan akun Google? Widget akan kembali ke layar login awal dan jadwal lokal akan dibersihkan.',
            confirmLogoutBtn: 'Ya, Putuskan Akun',
            
            authTitle: 'Google Calendar Widget',
            authDesc: 'Hubungkan akun Google kamu untuk menampilkan agenda dan jadwal kegiatan harian langsung di desktop.',
            authBtn: 'Masuk dengan Google',
            authOpeningBrowser: 'Membuka Browser...',
            authSuccess: 'Berhasil login dengan akun Google!',
            authFailed: (err) => `Login gagal: ${err}`,
            toastAccountDisconnected: 'Akun Google berhasil diputuskan',
            toastDisconnectFailed: (err) => `Gagal memutuskan akun: ${err}`,
            toastThemeSwitched: (t) => `Mode ${t === 'light' ? 'Terang' : 'Gelap'} diaktifkan`,
            toastLangSwitched: 'Bahasa Indonesia diaktifkan',
            toastOfflineCache: 'Menampilkan agenda offline tersimpan',
            toastSyncOfflineError: 'Gagal menyinkronkan data terbaru. Menampilkan data cache.'
        },
        en: {
            locale: 'en-US',
            appTitle: 'Calendar',
            synced: 'Synced',
            syncing: 'Syncing...',
            offlineCache: 'Offline (Cache)',
            notLoggedIn: 'Not Logged In',
            syncFailed: 'Sync Failed',
            themeDark: 'Switch to Dark Mode',
            themeLight: 'Switch to Light Mode',
            langToggle: 'Ganti ke Bahasa Indonesia',
            filterCal: 'Select Calendars (Settings)',
            pinActive: 'Widget pinned (Always on Top)',
            pinInactive: 'Widget unpinned from top',
            pinTitle: 'Pin / Always on Top',
            refreshTitle: 'Refresh Schedule',
            addEventTitle: 'Add New Event',
            minimizeTitle: 'Minimize Window',
            closeTitle: 'Close Window',
            
            bannerUpcoming: 'UPCOMING',
            bannerNoEvents: 'No upcoming events',
            bannerRelax: 'Relax for a while',
            
            tabAgenda: 'Agenda',
            tabMonth: 'Calendar',
            
            relToday: 'Today',
            relTomorrow: 'Tomorrow',
            relYesterday: 'Yesterday',
            allDay: 'All Day',
            
            ongoing: 'In Progress',
            finished: 'Ended',
            minutesLeft: (m) => `in ${m}m`,
            hoursLeft: (h, m) => m > 0 ? `in ${h}h ${m}m` : `in ${h}h`,
            daysLeft: (d) => `in ${d}d`,
            
            joinMeet: 'Join Meet',
            emptyAgendaTitle: 'No Upcoming Events',
            emptyAgendaDesc: 'All scheduled activities are done or no new events are found.',
            emptyAddEvent: 'Add New Event',
            emptyRefresh: 'Refresh',
            errorAgendaTitle: 'Failed to Load Schedule',
            errorAgendaDesc: 'An issue occurred while fetching data from Google Calendar. Check your internet connection or login status.',
            retrySync: 'Retry Sync',
            
            weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            selectedDateTitle: 'Events for This Date',
            noAgendaDate: 'No events scheduled on this date.',
            quickAddDate: 'Add Event',
            
            modalAddEyebrow: 'NEW EVENT',
            modalAddTitle: 'Add Event',
            lblTargetCalendar: 'Save to Calendar',
            lblEventTitle: 'Event Title',
            phEventTitle: 'e.g. Product Roadmap Discussion',
            lblAllDay: 'All Day Event',
            lblStart: 'Start',
            lblEnd: 'End',
            lblLocation: 'Location (Optional)',
            phLocation: 'e.g. Lab Building B-204 / Google Meet',
            lblDesc: 'Description / Notes (Optional)',
            phDesc: 'Agenda notes or tasks...',
            btnCancel: 'Cancel',
            btnSubmitEvent: 'Save to Google',
            btnSubmitting: 'Saving...',
            valEndAfterStart: 'End time must be after start time!',
            toastEventSaved: 'Event saved to Google Calendar successfully!',
            toastEventSaveFailed: (err) => `Failed to add event: ${err}`,
            
            detailLocation: 'Location',
            detailReminders: 'Reminders',
            detailDesc: 'Description / Notes',
            detailCreator: 'Event Creator',
            detailOrganizer: 'Organizer',
            detailAttendees: (n) => `Attendees (${n}):`,
            btnJoinMeetFull: 'Join Google Meet',
            btnDeleteEvent: 'Delete',
            btnOpenWeb: 'Open in Web',
            toastCopyCal: 'Original calendar URL copied to clipboard',
            toastCopyLoc: 'Location copied to clipboard',
            toastCopyCreator: 'Creator info copied to clipboard',
            toastEventDeleted: 'Event deleted from Google Calendar',
            toastEventDeleteFailed: (err) => `Failed to delete event: ${err}`,
            
            settingsEyebrow: 'SETTINGS',
            settingsTitle: 'Settings & Calendars',
            settingsSubtitle: 'Manage appearance, language, and active calendars',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            loadingCalendars: 'Loading calendars...',
            noCalendarsTitle: 'No Calendars',
            noCalendarsDesc: 'No syncable calendars were found.',
            failedCalendarsTitle: 'Failed to Load Calendars',
            failedCalendarsDesc: 'Network issue occurred while loading calendar list.',
            btnReload: 'Reload',
            btnRetry: 'Retry',
            lblStartup: 'Launch automatically on Windows startup',
            lblLanguage: 'Interface Language',
            descLanguage: 'Choose widget interface language',
            lblDiagnostics: 'System Diagnostics',
            descDiagnostics: 'Activity log files & crash reports',
            btnOpenLogs: 'Open Logs Folder',
            lblAccount: 'Google Account',
            descAccount: 'Connected to Google Calendar',
            btnLogout: 'Disconnect Account',
            btnApplySettings: 'Apply Settings',
            btnApplying: 'Applying...',
            toastSettingsApplied: 'Calendar settings applied successfully',
            toastSettingsFailed: (err) => `Failed to apply settings: ${err}`,
            
            confirmDeleteTitle: 'Delete Event?',
            confirmDeleteMsg: (s) => `Are you sure you want to delete "${s}" from Google Calendar?`,
            confirmDeleteBtn: 'Yes, Delete',
            
            confirmLogoutTitle: 'Disconnect Google Account?',
            confirmLogoutMsg: 'Are you sure you want to disconnect your Google account? The widget will return to the sign-in screen and local cached events will be cleared.',
            confirmLogoutBtn: 'Yes, Disconnect',
            
            authTitle: 'Google Calendar Widget',
            authDesc: 'Connect your Google account to display your daily agenda and schedule directly on your desktop.',
            authBtn: 'Sign in with Google',
            authOpeningBrowser: 'Opening Browser...',
            authSuccess: 'Successfully signed in with Google!',
            authFailed: (err) => `Login failed: ${err}`,
            toastAccountDisconnected: 'Google account disconnected successfully',
            toastDisconnectFailed: (err) => `Failed to disconnect account: ${err}`,
            toastThemeSwitched: (t) => `${t === 'light' ? 'Light' : 'Dark'} mode activated`,
            toastLangSwitched: 'English language activated',
            toastOfflineCache: 'Displaying saved offline schedule',
            toastSyncOfflineError: 'Failed to sync latest data. Showing cached schedule.'
        }
    };

    let currentLang = localStorage.getItem('calendar_widget_lang') || 'en';

    function t(key, ...args) {
        const langObj = I18N_STRINGS[currentLang] || I18N_STRINGS.en;
        const val = langObj[key] !== undefined ? langObj[key] : (I18N_STRINGS.en[key] !== undefined ? I18N_STRINGS.en[key] : key);
        if (typeof val === 'function') {
            return val(...args);
        }
        return val;
    }

    function applyLanguage(lang) {
        currentLang = (lang === 'id' || lang === 'en') ? lang : 'en';
        document.documentElement.setAttribute('lang', currentLang);
        localStorage.setItem('calendar_widget_lang', currentLang);

        if (langIndicator) {
            langIndicator.textContent = currentLang.toUpperCase();
        }

        if (btnLangToggle) {
            btnLangToggle.setAttribute('title', t('langToggle'));
        }

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        if (btnThemeToggle) {
            btnThemeToggle.setAttribute('title', currentTheme === 'light' ? t('themeDark') : t('themeLight'));
        }

        if (btnFilterCalendars) btnFilterCalendars.setAttribute('title', t('filterCal'));
        if (btnPin) btnPin.setAttribute('title', t('pinTitle'));
        if (btnRefresh) btnRefresh.setAttribute('title', t('refreshTitle'));
        if (btnAddEvent) btnAddEvent.setAttribute('title', t('addEventTitle'));
        if (btnMinimize) btnMinimize.setAttribute('title', t('minimizeTitle'));
        if (btnClose) btnClose.setAttribute('title', t('closeTitle'));

        // Update Tab Labels
        const tabSpans = document.querySelectorAll('.tab-btn span');
        if (tabSpans.length >= 2) {
            tabSpans[0].textContent = t('tabAgenda');
            tabSpans[1].textContent = t('tabMonth');
        }

        // Update Banner Badge
        const badgeLabel = nextEventBanner ? nextEventBanner.querySelector('.badge-label') : null;
        if (badgeLabel) badgeLabel.textContent = t('bannerUpcoming');

        // Update Weekdays in Mini Calendar
        const calWeekdays = document.querySelector('.cal-weekdays');
        if (calWeekdays) {
            const days = t('weekdays');
            calWeekdays.innerHTML = days.map(d => `<span>${d}</span>`).join('');
        }

        // Update Quick Add Modal Elements
        const addEyebrow = addEventModal ? addEventModal.querySelector('.modal-eyebrow') : null;
        if (addEyebrow) addEyebrow.textContent = t('modalAddEyebrow');
        const addTitle = document.getElementById('addEventModalTitle');
        if (addTitle) addTitle.textContent = t('modalAddTitle');

        const labelCal = addEventModal ? addEventModal.querySelector('label[for="selectTargetCalendar"]') : null;
        if (labelCal) labelCal.textContent = t('lblTargetCalendar');

        const labelTitle = addEventModal ? addEventModal.querySelector('label[for="inputEventTitle"]') : null;
        if (labelTitle) labelTitle.textContent = t('lblEventTitle');
        if (inputEventTitle) inputEventTitle.placeholder = t('phEventTitle');

        const labelAllDay = addEventModal ? addEventModal.querySelector('.checkbox-label span') : null;
        if (labelAllDay) labelAllDay.textContent = t('lblAllDay');

        const labelStart = addEventModal ? addEventModal.querySelector('label[for="inputEventStart"]') : null;
        if (labelStart) labelStart.textContent = t('lblStart');

        const labelEnd = addEventModal ? addEventModal.querySelector('label[for="inputEventEnd"]') : null;
        if (labelEnd) labelEnd.textContent = t('lblEnd');

        const labelLoc = addEventModal ? addEventModal.querySelector('label[for="inputEventLocation"]') : null;
        if (labelLoc) labelLoc.textContent = t('lblLocation');
        if (inputEventLocation) inputEventLocation.placeholder = t('phLocation');

        const labelDesc = addEventModal ? addEventModal.querySelector('label[for="inputEventDescription"]') : null;
        if (labelDesc) labelDesc.textContent = t('lblDesc');
        if (inputEventDescription) inputEventDescription.placeholder = t('phDesc');

        if (btnCancelModal) btnCancelModal.textContent = t('btnCancel');
        const btnSubmitEvent = document.getElementById('btnSubmitEvent');
        if (btnSubmitEvent) {
            const span = btnSubmitEvent.querySelector('span');
            if (span) span.textContent = t('btnSubmitEvent');
            else btnSubmitEvent.textContent = t('btnSubmitEvent');
        }

        // Update Filter Modal Elements
        const filterEyebrow = calendarFilterModal ? calendarFilterModal.querySelector('.modal-eyebrow') : null;
        if (filterEyebrow) filterEyebrow.textContent = t('settingsEyebrow');
        const filterTitle = document.getElementById('filterModalTitle');
        if (filterTitle) filterTitle.textContent = t('settingsTitle');
        const filterSub = calendarFilterModal ? calendarFilterModal.querySelector('.filter-subtitle') : null;
        if (filterSub) filterSub.textContent = t('settingsSubtitle');

        if (btnSelectAllCalendars) btnSelectAllCalendars.textContent = t('selectAll');
        if (btnDeselectAllCalendars) btnDeselectAllCalendars.textContent = t('deselectAll');

        const lblAutoLaunch = document.getElementById('lblAutoLaunch');
        if (lblAutoLaunch) lblAutoLaunch.textContent = t('lblStartup');

        const lblLanguage = document.getElementById('lblLanguage');
        if (lblLanguage) lblLanguage.textContent = t('lblLanguage');
        const descLanguage = document.getElementById('descLanguage');
        if (descLanguage) descLanguage.textContent = t('descLanguage');

        const lblDiagnostics = document.getElementById('lblDiagnostics');
        if (lblDiagnostics) lblDiagnostics.textContent = t('lblDiagnostics');
        const descDiagnostics = document.getElementById('descDiagnostics');
        if (descDiagnostics) descDiagnostics.textContent = t('descDiagnostics');

        const btnOpenLogsFolder = document.getElementById('btnOpenLogsFolder');
        if (btnOpenLogsFolder) {
            const span = btnOpenLogsFolder.querySelector('span');
            if (span) span.textContent = t('btnOpenLogs');
        }

        const accountLabel = calendarFilterModal ? calendarFilterModal.querySelector('.account-label') : null;
        if (accountLabel) accountLabel.textContent = t('lblAccount');
        const accountDesc = calendarFilterModal ? calendarFilterModal.querySelector('.account-desc') : null;
        if (accountDesc) accountDesc.textContent = t('descAccount');

        const btnLogoutGoogleAccount = document.getElementById('btnLogoutGoogleAccount');
        if (btnLogoutGoogleAccount) {
            const span = btnLogoutGoogleAccount.querySelector('span');
            if (span) span.textContent = t('btnLogout');
        }

        if (btnApplyCalendarFilter) {
            const span = btnApplyCalendarFilter.querySelector('span');
            if (span) span.textContent = t('btnApplySettings');
            else btnApplyCalendarFilter.textContent = t('btnApplySettings');
        }

        // Update Language Pill Buttons in Settings
        if (btnLangId && btnLangEn) {
            btnLangId.classList.toggle('active', currentLang === 'id');
            btnLangEn.classList.toggle('active', currentLang === 'en');
        }

        // Update Details Modal Static Buttons & Labels
        if (btnDetailJoinMeet) {
            const span = btnDetailJoinMeet.querySelector('span');
            if (span) span.textContent = t('btnJoinMeetFull');
        }
        if (btnDetailDelete) {
            const span = btnDetailDelete.querySelector('span');
            if (span) span.textContent = t('btnDeleteEvent');
        }
        if (btnDetailOpenWeb) {
            const span = btnDetailOpenWeb.querySelector('span');
            if (span) span.textContent = t('btnOpenWeb');
        }

        // Update Auth Overlay
        if (authOverlay) {
            const p = authOverlay.querySelector('p');
            if (p) p.textContent = t('authDesc');
            if (btnLoginGoogle) {
                const span = btnLoginGoogle.querySelector('span');
                if (span) span.textContent = t('authBtn');
            }
        }
    }

    // M3 In-App Toast Helper
    function showToast(message, type = 'info', durationMs = 3200) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 220);
        }, durationMs);
    }

    // Modal Dismissal (ESC Key & Backdrop Click)
    function closeAllModals() {
        [addEventModal, eventDetailsModal, calendarFilterModal, confirmDeleteModal].forEach(m => {
            if (m) m.classList.remove('active');
        });
        pendingDeleteAction = null;
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    [addEventModal, eventDetailsModal, calendarFilterModal, confirmDeleteModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    if (modal === confirmDeleteModal) pendingDeleteAction = null;
                }
            });
        }
    });

    // In-App Reusable Confirm Dialog Trigger
    function askConfirmDialog({ title = 'Confirmation', message, confirmText = 'Continue', onConfirm }) {
        pendingDeleteAction = onConfirm;
        const titleEl = document.getElementById('confirmDeleteTitle');
        if (titleEl) titleEl.textContent = title;
        if (confirmDeleteMsg) confirmDeleteMsg.textContent = message;
        if (btnConfirmDelete) btnConfirmDelete.textContent = confirmText;
        if (confirmDeleteModal) confirmDeleteModal.classList.add('active');
    }

    function askConfirmDelete(eventSummary, onConfirm) {
        askConfirmDialog({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMsg', eventSummary),
            confirmText: t('confirmDeleteBtn'),
            onConfirm
        });
    }

    function askConfirmLogout(onConfirm) {
        askConfirmDialog({
            title: t('confirmLogoutTitle'),
            message: t('confirmLogoutMsg'),
            confirmText: t('confirmLogoutBtn'),
            onConfirm
        });
    }

    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => {
            if (confirmDeleteModal) confirmDeleteModal.classList.remove('active');
            pendingDeleteAction = null;
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (confirmDeleteModal) confirmDeleteModal.classList.remove('active');
            if (pendingDeleteAction) {
                const action = pendingDeleteAction;
                pendingDeleteAction = null;
                await action();
            }
        });
    }

    // Initialize Date Header
    function updateDateBadge() {
        const now = new Date();
        currentDateNumber.textContent = now.getDate();
    }

    // Tab Navigation
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const targetTab = btn.dataset.tab;
            if (targetTab === 'agenda') {
                viewAgenda.classList.add('active');
                viewMonth.classList.remove('active');
            } else {
                viewMonth.classList.add('active');
                viewAgenda.classList.remove('active');
                renderMiniCalendar();
            }
        });
    });

    // Theme Management (Dark / Light)
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    const iconMoon = btnThemeToggle ? btnThemeToggle.querySelector('.icon-moon') : null;
    const iconSun = btnThemeToggle ? btnThemeToggle.querySelector('.icon-sun') : null;

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('calendar_widget_theme', theme);
        if (iconMoon && iconSun) {
            if (theme === 'light') {
                iconMoon.style.display = 'none';
                iconSun.style.display = 'block';
                btnThemeToggle.setAttribute('title', t('themeDark'));
            } else {
                iconMoon.style.display = 'block';
                iconSun.style.display = 'none';
                btnThemeToggle.setAttribute('title', t('themeLight'));
            }
        }
    }

    // Initialize saved language and theme
    applyLanguage(currentLang);
    const savedTheme = localStorage.getItem('calendar_widget_theme') || 'dark';
    applyTheme(savedTheme);

    // Language Toggle Listeners
    if (btnLangToggle) {
        btnLangToggle.addEventListener('click', () => {
            const nextLang = currentLang === 'id' ? 'en' : 'id';
            applyLanguage(nextLang);
            renderTimeline(allEvents);
            updateNextEventBanner();
            if (viewMonth.classList.contains('active')) {
                renderMiniCalendar();
            }
            showToast(t('toastLangSwitched'), 'info', 2000);
        });
    }

    if (btnLangId) {
        btnLangId.addEventListener('click', () => {
            if (currentLang !== 'id') {
                applyLanguage('id');
                renderTimeline(allEvents);
                updateNextEventBanner();
                if (viewMonth.classList.contains('active')) {
                    renderMiniCalendar();
                }
                showToast(t('toastLangSwitched'), 'info', 2000);
            }
        });
    }

    if (btnLangEn) {
        btnLangEn.addEventListener('click', () => {
            if (currentLang !== 'en') {
                applyLanguage('en');
                renderTimeline(allEvents);
                updateNextEventBanner();
                if (viewMonth.classList.contains('active')) {
                    renderMiniCalendar();
                }
                showToast(t('toastLangSwitched'), 'info', 2000);
            }
        });
    }

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
            renderTimeline(allEvents);
            if (viewMonth.classList.contains('active')) {
                renderMiniCalendar();
            }
            showToast(t('toastThemeSwitched', newTheme), 'info', 2000);
        });
    }

    // 8-Directional Window Resize Handlers
    const resizeHandles = document.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const classList = Array.from(handle.classList);
            const dirClass = classList.find(c => c.startsWith('resize-') && c !== 'resize-handle');
            if (!dirClass) return;
            const direction = dirClass.replace('resize-', '');

            const startMouseX = e.screenX;
            const startMouseY = e.screenY;
            const startWidth = window.outerWidth;
            const startHeight = window.outerHeight;
            const startWinX = window.screenX;
            const startWinY = window.screenY;

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.screenX - startMouseX;
                const deltaY = moveEvent.screenY - startMouseY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newX = startWinX;
                let newY = startWinY;

                if (direction.includes('right')) {
                    newWidth = Math.max(300, Math.min(1200, startWidth + deltaX));
                }
                if (direction.includes('bottom')) {
                    newHeight = Math.max(400, Math.min(1400, startHeight + deltaY));
                }
                if (direction.includes('left')) {
                    const proposedWidth = startWidth - deltaX;
                    if (proposedWidth >= 300 && proposedWidth <= 1200) {
                        newWidth = proposedWidth;
                        newX = startWinX + deltaX;
                    }
                }
                if (direction.includes('top')) {
                    const proposedHeight = startHeight - deltaY;
                    if (proposedHeight >= 400 && proposedHeight <= 1400) {
                        newHeight = proposedHeight;
                        newY = startWinY + deltaY;
                    }
                }

                if (window.calendarWidgetAPI && window.calendarWidgetAPI.window.resize) {
                    window.calendarWidgetAPI.window.resize({
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight
                    });
                }
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    });

    // Window Controls
    btnPin.addEventListener('click', async () => {
        if (window.calendarWidgetAPI) {
            isPinned = await window.calendarWidgetAPI.window.togglePin();
            btnPin.classList.toggle('active', isPinned);
            showToast(isPinned ? 'Widget dipin (Always on Top)' : 'Widget dilepas dari layar (Unpinned)', 'info', 2000);
        }
    });

    btnRefresh.addEventListener('click', () => {
        refreshEvents();
    });

    btnMinimize.addEventListener('click', () => {
        if (window.calendarWidgetAPI) {
            window.calendarWidgetAPI.window.minimize();
        }
    });

    btnClose.addEventListener('click', () => {
        if (window.calendarWidgetAPI) {
            window.calendarWidgetAPI.window.close();
        }
    });

    btnLoginGoogle.addEventListener('click', async () => {
        btnLoginGoogle.disabled = true;
        btnLoginGoogle.textContent = t('authOpeningBrowser');
        try {
            if (window.calendarWidgetAPI) {
                const res = await window.calendarWidgetAPI.auth.login();
                if (res.success) {
                    authOverlay.classList.add('hidden');
                    showToast(t('authSuccess'), 'success');
                    await refreshEvents();
                } else {
                    showToast(t('authFailed', res.error || 'Unknown error'), 'error');
                }
            }
        } catch (err) {
            showToast(t('authFailed', err.message), 'error');
        } finally {
            btnLoginGoogle.disabled = false;
            btnLoginGoogle.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>${t('authBtn')}</span>
            `;
        }
    });

    // Helper: Relative Day Format
    function getRelativeDayLabel(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('relToday');
        if (diffDays === 1) return t('relTomorrow');
        if (diffDays === -1) return t('relYesterday');

        return date.toLocaleDateString(t('locale'), {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
    }

    // Helper: Time Formatter
    function formatTime(startStr, endStr, isAllDay) {
        if (isAllDay) return t('allDay');
        const start = new Date(startStr);
        const end = new Date(endStr);

        const formatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const startTime = start.toLocaleTimeString(t('locale'), formatOptions);
        const endTime = end.toLocaleTimeString(t('locale'), formatOptions);

        return `${startTime} - ${endTime}`;
    }

    // Helper: Countdown Calculator
    function getEventCountdown(startStr, endStr) {
        const now = new Date().getTime();
        const start = new Date(startStr).getTime();
        const end = new Date(endStr).getTime();

        if (now >= start && now <= end) {
            return t('ongoing');
        }

        const diffMs = start - now;
        if (diffMs < 0) return t('finished');

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 60) {
            return t('minutesLeft', diffMinutes);
        }
        if (diffHours < 24) {
            const remainingMinutes = diffMinutes % 60;
            return t('hoursLeft', diffHours, remainingMinutes);
        }
        return t('daysLeft', diffDays);
    }

    // Helper: Dynamic Hostname / Text Parser (Clean, generic without hardcoding)
    function parseHostOrText(input) {
        if (!input) return { display: '', raw: '', isUrl: false };
        const trimmed = String(input).trim();
        if (/^https?:\/\//i.test(trimmed)) {
            try {
                const parsed = new URL(trimmed);
                return {
                    display: parsed.hostname || trimmed,
                    raw: trimmed,
                    isUrl: true
                };
            } catch {
                const host = trimmed.replace(/^https?:\/\//i, '').split('/')[0];
                return {
                    display: host || trimmed,
                    raw: trimmed,
                    isUrl: true
                };
            }
        }
        return {
            display: trimmed,
            raw: trimmed,
            isUrl: false
        };
    }

    // Helper: Smart Contrast Color Resolver for Light/Dark Mode
    function resolveEventColors(hexColor, isLightMode) {
        const defaultColor = isLightMode ? '#1d4ed8' : '#38bdf8';
        if (!hexColor || typeof hexColor !== 'string') {
            return {
                accent: defaultColor,
                badgeText: defaultColor,
                badgeBg: isLightMode ? 'rgba(29, 78, 216, 0.08)' : 'rgba(56, 189, 248, 0.12)',
                badgeBorder: isLightMode ? 'rgba(29, 78, 216, 0.25)' : 'rgba(56, 189, 248, 0.35)'
            };
        }

        let c = hexColor.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;

        // Relative Luminance (ITU-R BT.709)
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

        if (isLightMode) {
            if (lum > 0.45) {
                // Tone down high-luminance colors (e.g. gold, yellow, lime, bright amber) for crisp text legibility
                const darkR = Math.max(0, Math.floor(r * 0.42));
                const darkG = Math.max(0, Math.floor(g * 0.42));
                const darkB = Math.max(0, Math.floor(b * 0.42));
                const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
                return {
                    accent: hexColor,
                    badgeText: darkHex,
                    badgeBg: `rgba(${r}, ${g}, ${b}, 0.15)`,
                    badgeBorder: `rgba(${r}, ${g}, ${b}, 0.40)`
                };
            }
            return {
                accent: hexColor,
                badgeText: hexColor,
                badgeBg: `rgba(${r}, ${g}, ${b}, 0.09)`,
                badgeBorder: `rgba(${r}, ${g}, ${b}, 0.28)`
            };
        }

        return {
            accent: hexColor,
            badgeText: hexColor,
            badgeBg: `rgba(${r}, ${g}, ${b}, 0.15)`,
            badgeBorder: `rgba(${r}, ${g}, ${b}, 0.35)`
        };
    }

    // Helper: Safe Rich HTML Description Formatter
    function formatDescriptionHtml(raw) {
        if (!raw) return '';
        if (/<[a-z][\s\S]*>/i.test(raw)) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(raw, 'text/html');
                doc.querySelectorAll('script, iframe, style, object, embed').forEach(el => el.remove());
                return doc.body.innerHTML;
            } catch {
                return raw;
            }
        } else {
            return raw
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
                .replace(/\n/g, '<br>');
        }
    }

    // Update Banner with Live Next Event Countdown
    function updateNextEventBanner() {
        const now = new Date().getTime();
        const futureEvents = allEvents.filter(ev => new Date(ev.end).getTime() > now);

        if (futureEvents.length === 0) {
            nextEventTitle.textContent = t('bannerNoEvents');
            nextEventTime.textContent = '--:--';
            nextEventCountdown.textContent = t('bannerRelax');
            nextEventBanner.onclick = null;
            return;
        }

        const nextEv = futureEvents[0];
        nextEventTitle.textContent = nextEv.summary;
        nextEventTime.textContent = formatTime(nextEv.start, nextEv.end, nextEv.isAllDay);
        nextEventCountdown.textContent = getEventCountdown(nextEv.start, nextEv.end);

        nextEventBanner.style.cursor = 'pointer';
        nextEventBanner.onclick = () => showEventDetails(nextEv);
    }

    // Show In-App Event Details Modal
    function showEventDetails(ev) {
        activeDetailEvent = ev;

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const colorInfo = resolveEventColors(ev.calendarColor, isLight);
        const calParse = parseHostOrText(ev.calendarName || t('appTitle'));

        detailCalBadge.textContent = calParse.display;
        detailCalBadge.title = calParse.raw;
        detailCalBadge.style.setProperty('--event-badge-bg', colorInfo.badgeBg);
        detailCalBadge.style.setProperty('--event-badge-text', colorInfo.badgeText);
        detailCalBadge.style.setProperty('--event-badge-border', colorInfo.badgeBorder);

        if (calParse.isUrl) {
            btnCopyCalLink.style.display = 'inline-flex';
            btnCopyCalLink.onclick = () => {
                navigator.clipboard.writeText(calParse.raw);
                btnCopyCalLink.classList.add('copied');
                showToast(t('toastCopyCal'), 'info', 2000);
                setTimeout(() => { btnCopyCalLink.classList.remove('copied'); }, 2000);
            };
        } else {
            btnCopyCalLink.style.display = 'none';
        }

        detailTitle.textContent = ev.summary;

        const dateObj = new Date(ev.start);
        const dateFormatted = dateObj.toLocaleDateString(t('locale'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const timeFormatted = formatTime(ev.start, ev.end, ev.isAllDay);
        detailTime.textContent = `${dateFormatted} • ${timeFormatted}`;
        detailCountdown.textContent = getEventCountdown(ev.start, ev.end);

        // Google Meet
        if (ev.hangoutLink) {
            detailMeetContainer.style.display = 'block';
            btnDetailJoinMeet.onclick = () => {
                if (window.calendarWidgetAPI) {
                    window.calendarWidgetAPI.system.openExternal(ev.hangoutLink);
                }
            };
        } else {
            detailMeetContainer.style.display = 'none';
        }

        // Location
        if (ev.location && ev.location.trim()) {
            detailLocationRow.style.display = 'flex';
            detailLocation.textContent = ev.location;
            btnCopyLocation.onclick = () => {
                navigator.clipboard.writeText(ev.location);
                btnCopyLocation.classList.add('copied');
                showToast(t('toastCopyLoc'), 'info', 2000);
                setTimeout(() => { btnCopyLocation.classList.remove('copied'); }, 2000);
            };
        } else {
            detailLocationRow.style.display = 'none';
        }

        // Reminders / Notification
        const detailRemindersRow = document.getElementById('detailRemindersRow');
        const detailReminders = document.getElementById('detailReminders');
        if (ev.reminders && ev.reminders.length > 0) {
            detailRemindersRow.style.display = 'flex';
            detailReminders.textContent = ev.reminders.join(', ');
        } else {
            detailRemindersRow.style.display = 'none';
        }

        // Description / Notes (Rich HTML formatting)
        if (ev.description && ev.description.trim()) {
            detailDescSection.style.display = 'flex';
            detailDescription.innerHTML = formatDescriptionHtml(ev.description);

            // Wire any embedded links to open in external browser
            detailDescription.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = a.getAttribute('href');
                    if (href && window.calendarWidgetAPI) {
                        window.calendarWidgetAPI.system.openExternal(href);
                    }
                });
            });
        } else {
            detailDescSection.style.display = 'none';
        }

        // Creator / Organizer
        const creatorName = ev.creator?.displayName || ev.creator?.email || ev.organizer?.displayName || ev.organizer?.email;
        if (creatorName) {
            const creatorParse = parseHostOrText(creatorName);
            detailCreatorRow.style.display = 'flex';
            detailCreator.textContent = creatorParse.display;
            detailCreator.title = creatorParse.raw;
            btnCopyCreator.onclick = () => {
                navigator.clipboard.writeText(creatorParse.raw);
                btnCopyCreator.classList.add('copied');
                showToast(t('toastCopyCreator'), 'info', 2000);
                setTimeout(() => { btnCopyCreator.classList.remove('copied'); }, 2000);
            };
        } else {
            detailCreatorRow.style.display = 'none';
        }

        // Attendees
        if (ev.attendees && ev.attendees.length > 0) {
            detailAttendeesSection.style.display = 'flex';
            detailAttendeesLabel.textContent = t('detailAttendees', ev.attendees.length);
            let attendeesHtml = '';
            ev.attendees.forEach(a => {
                const statusClass = a.responseStatus === 'accepted' ? 'accepted' : (a.responseStatus === 'declined' ? 'declined' : 'tentative');
                attendeesHtml += `
                    <div class="attendee-item ${statusClass}">
                        <span class="status-dot-sm"></span>
                        <span>${a.displayName || a.email}</span>
                    </div>
                `;
            });
            detailAttendeesList.innerHTML = attendeesHtml;
        } else {
            detailAttendeesSection.style.display = 'none';
        }

        // Action: Open in Web
        btnDetailOpenWeb.onclick = () => {
            if (ev.htmlLink && window.calendarWidgetAPI) {
                window.calendarWidgetAPI.system.openExternal(ev.htmlLink);
            }
        };

        // Action: Delete Event
        btnDetailDelete.onclick = () => {
            askConfirmDelete(ev.summary, async () => {
                try {
                    btnDetailDelete.disabled = true;
                    await window.calendarWidgetAPI.calendar.deleteEvent({
                        calendarId: ev.calendarId || 'primary',
                        eventId: ev.id
                    });
                    eventDetailsModal.classList.remove('active');
                    showToast(t('toastEventDeleted'), 'success');
                    await refreshEvents();
                } catch (err) {
                    showToast(t('toastEventDeleteFailed', err.message), 'error');
                } finally {
                    btnDetailDelete.disabled = false;
                }
            });
        };

        eventDetailsModal.classList.add('active');
    }

    btnCloseDetailModal.addEventListener('click', () => {
        eventDetailsModal.classList.remove('active');
    });

    // Feedback States for Timeline (Skeleton, Empty, Error)
    function renderTimelineSkeleton() {
        eventsTimeline.innerHTML = `
            <div class="skeleton-timeline" aria-busy="true" aria-label="${t('syncing')}">
                <div class="skeleton-date-header">
                    <div class="skeleton-pill" style="width: 70px;"></div>
                    <div class="skeleton-pill" style="width: 22px;"></div>
                </div>
                <div class="skeleton-event-card">
                    <div class="skeleton-strip"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line" style="width: 65%; margin-bottom: 8px;"></div>
                        <div class="skeleton-line" style="width: 40%;"></div>
                    </div>
                </div>
                <div class="skeleton-event-card">
                    <div class="skeleton-strip"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line" style="width: 80%; margin-bottom: 8px;"></div>
                        <div class="skeleton-line" style="width: 50%;"></div>
                    </div>
                </div>
                <div class="skeleton-date-header" style="margin-top: 14px;">
                    <div class="skeleton-pill" style="width: 85px;"></div>
                    <div class="skeleton-pill" style="width: 22px;"></div>
                </div>
                <div class="skeleton-event-card">
                    <div class="skeleton-strip"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line" style="width: 70%; margin-bottom: 8px;"></div>
                        <div class="skeleton-line" style="width: 35%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderTimelineEmpty() {
        eventsTimeline.innerHTML = `
            <div class="empty-state-card" role="status">
                <div class="empty-icon-wrap">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <h4 class="empty-title">${t('emptyAgendaTitle')}</h4>
                <p class="empty-desc">${t('emptyAgendaDesc')}</p>
                <div class="empty-actions">
                    <button type="button" class="btn-empty-add" id="btnEmptyAddEvent">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>${t('emptyAddEvent')}</span>
                    </button>
                    <button type="button" class="btn-empty-refresh" id="btnEmptyRefresh">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        <span>${t('emptyRefresh')}</span>
                    </button>
                </div>
            </div>
        `;

        const btnEmptyAddEvent = document.getElementById('btnEmptyAddEvent');
        if (btnEmptyAddEvent) {
            btnEmptyAddEvent.addEventListener('click', () => btnAddEvent.click());
        }
        const btnEmptyRefresh = document.getElementById('btnEmptyRefresh');
        if (btnEmptyRefresh) {
            btnEmptyRefresh.addEventListener('click', () => refreshEvents());
        }
    }

    function renderTimelineError(errorMsg) {
        eventsTimeline.innerHTML = `
            <div class="error-state-card" role="alert">
                <div class="error-icon-wrap">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h4 class="error-title">${t('errorAgendaTitle')}</h4>
                <p class="error-desc">${errorMsg || t('errorAgendaDesc')}</p>
                <div class="error-actions">
                    <button type="button" class="btn-retry-sync" id="btnRetrySync">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        <span>${t('retrySync')}</span>
                    </button>
                </div>
            </div>
        `;

        const btnRetrySync = document.getElementById('btnRetrySync');
        if (btnRetrySync) {
            btnRetrySync.addEventListener('click', () => refreshEvents());
        }
    }

    // Render Agenda Timeline
    function renderTimeline(events) {
        if (!events || events.length === 0) {
            renderTimelineEmpty();
            return;
        }

        // Group by Date string
        const groups = {};
        events.forEach(ev => {
            const dateObj = new Date(ev.start);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    dateObj,
                    items: []
                };
            }
            groups[dateKey].items.push(ev);
        });

        let html = '';
        let overallCardIdx = 0;

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        Object.keys(groups).sort().forEach(dateKey => {
            const group = groups[dateKey];
            const headerLabel = getRelativeDayLabel(group.dateObj);

            html += `
                <div class="timeline-date-group">
                    <div class="date-group-header">
                        <span class="header-label">${headerLabel}</span>
                        <span class="header-badge">${group.items.length}</span>
                    </div>
            `;

            group.items.forEach((ev, idx) => {
                overallCardIdx++;
                const colorInfo = resolveEventColors(ev.calendarColor, isLight);
                const timeStr = formatTime(ev.start, ev.end, ev.isAllDay);
                const calParse = parseHostOrText(ev.calendarName);
                const meetBtn = ev.hangoutLink ? `
                    <a href="#" class="event-meet-btn" data-event-idx="${idx}" data-date-key="${dateKey}" title="${t('joinMeet')}">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        <span>${t('joinMeet')}</span>
                        <span class="meet-btn-arrow">↗</span>
                    </a>
                ` : '';

                const locationStr = ev.location ? `
                    <div class="event-location" title="${ev.location}">
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${ev.location}</span>
                    </div>
                ` : '';

                const calBadge = calParse.display && calParse.display !== 'Primary' ? `
                    <span class="event-cal-badge" title="${calParse.raw}" style="--event-badge-bg: ${colorInfo.badgeBg}; --event-badge-text: ${colorInfo.badgeText}; --event-badge-border: ${colorInfo.badgeBorder};">${calParse.display}</span>
                ` : '';

                html += `
                    <div class="event-card" data-event-idx="${idx}" data-date-key="${dateKey}" style="--card-index: ${overallCardIdx}; --event-accent: ${colorInfo.accent};">
                        <div class="event-color-strip" style="background-color: ${colorInfo.accent};"></div>
                        <div class="event-body">
                            <div class="event-title-row">
                                <span class="event-title">${ev.summary}</span>
                                ${calBadge}
                            </div>
                            <div class="event-time-row">
                                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="time-clock-icon">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span>${timeStr}</span>
                            </div>
                            ${locationStr}
                            ${meetBtn}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        timelineGroups = groups;
        eventsTimeline.innerHTML = html;
    }

    // Persistent Event Delegation for Timeline
    eventsTimeline.addEventListener('click', (e) => {
        const meetBtn = e.target.closest('.event-meet-btn');
        if (meetBtn) {
            e.preventDefault();
            e.stopPropagation();
            const dKey = meetBtn.dataset.dateKey;
            const eIdx = parseInt(meetBtn.dataset.eventIdx, 10);
            if (timelineGroups[dKey] && timelineGroups[dKey].items[eIdx] && timelineGroups[dKey].items[eIdx].hangoutLink) {
                window.calendarWidgetAPI.system.openExternal(timelineGroups[dKey].items[eIdx].hangoutLink);
            }
            return;
        }

        const card = e.target.closest('.event-card');
        if (card) {
            const dKey = card.dataset.dateKey;
            const eIdx = parseInt(card.dataset.eventIdx, 10);
            if (timelineGroups[dKey] && timelineGroups[dKey].items[eIdx]) {
                showEventDetails(timelineGroups[dKey].items[eIdx]);
            }
        }
    });

    // Mini Month Calendar
    function renderMiniCalendar() {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();

        monthYearLabel.textContent = currentMonthDate.toLocaleDateString(t('locale'), { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();

        const today = new Date();
        let gridHtml = '';

        // Previous month filler days
        for (let i = firstDay - 1; i >= 0; i--) {
            gridHtml += `<div class="cal-day-cell other-month"><span>${prevDays - i}</span></div>`;
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
            const isSelected = selectedCalendarDate === dateStr;

            // Check if events exist on this day
            const dayEvents = allEvents.filter(ev => {
                const evDate = new Date(ev.start);
                return evDate.getFullYear() === year && evDate.getMonth() === month && evDate.getDate() === d;
            });
            const hasEvents = dayEvents.length > 0;
            let dotsHtml = '';
            if (hasEvents) {
                const uniqueColors = [...new Set(dayEvents.map(e => e.calendarColor || '#38bdf8'))].slice(0, 3);
                dotsHtml = `<div class="cal-dots-wrap">${uniqueColors.map(c => `<span class="cal-day-dot" style="background-color: ${c};"></span>`).join('')}</div>`;
            }

            gridHtml += `
                <div class="cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}" data-date="${dateStr}">
                    <span class="day-num">${d}</span>
                    ${dotsHtml}
                </div>
            `;
        }

        calendarDaysGrid.innerHTML = gridHtml;

        // Default to today if not selected
        if (!selectedCalendarDate) {
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            renderSelectedDayEvents(todayStr);
        } else {
            renderSelectedDayEvents(selectedCalendarDate);
        }
    }

    calendarDaysGrid.addEventListener('click', (e) => {
        const cell = e.target.closest('.cal-day-cell:not(.other-month)');
        if (cell) {
            const dateStr = cell.dataset.date;
            selectedCalendarDate = dateStr;
            renderMiniCalendar();
            renderSelectedDayEvents(dateStr);
        }
    });

    let currentDayMatches = [];

    function renderSelectedDayEvents(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const selDate = new Date(year, month - 1, day);

        selectedDateTitle.textContent = selDate.toLocaleDateString(t('locale'), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        currentDayMatches = allEvents.filter(ev => {
            const evDate = new Date(ev.start);
            return evDate.getFullYear() === year && (evDate.getMonth() + 1) === month && evDate.getDate() === day;
        });

        if (currentDayMatches.length === 0) {
            dayEventsList.innerHTML = `
                <div class="empty-day-state">
                    <span>${t('noAgendaDate')}</span>
                    <button type="button" class="btn-quick-add-day" id="btnQuickAddDay">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>${t('quickAddDate')}</span>
                    </button>
                </div>
            `;
            const btnQuickAddDay = document.getElementById('btnQuickAddDay');
            if (btnQuickAddDay) {
                btnQuickAddDay.addEventListener('click', () => {
                    btnAddEvent.click();
                    inputEventStart.value = `${dateStr}T09:00`;
                    inputEventEnd.value = `${dateStr}T10:00`;
                    inputEventEnd.min = `${dateStr}T09:00`;
                });
            }
            return;
        }

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        let html = '';
        currentDayMatches.forEach((ev, idx) => {
            const colorInfo = resolveEventColors(ev.calendarColor, isLight);
            const calParse = parseHostOrText(ev.calendarName);
            const calBadge = calParse.display && calParse.display !== 'Primary' ? `
                <span class="event-cal-badge" title="${calParse.raw}" style="--event-badge-bg: ${colorInfo.badgeBg}; --event-badge-text: ${colorInfo.badgeText}; --event-badge-border: ${colorInfo.badgeBorder}; font-size: 9px; padding: 1px 6px;">${calParse.display}</span>
            ` : '';

            html += `
                <div class="event-card" style="margin-bottom: 6px; --card-index: ${idx + 1}; --event-accent: ${colorInfo.accent};" data-idx="${idx}">
                    <div class="event-color-strip" style="background-color: ${colorInfo.accent};"></div>
                    <div class="event-body">
                        <div class="event-title-row">
                            <span class="event-title" style="font-size: 12px;">${ev.summary}</span>
                            ${calBadge}
                        </div>
                        <div class="event-time-row" style="font-size: 11px;">
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="time-clock-icon">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span>${formatTime(ev.start, ev.end, ev.isAllDay)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        dayEventsList.innerHTML = html;
    }

    dayEventsList.addEventListener('click', (e) => {
        const card = e.target.closest('.event-card');
        if (card) {
            const idx = parseInt(card.dataset.idx, 10);
            if (currentDayMatches[idx]) {
                showEventDetails(currentDayMatches[idx]);
            }
        }
    });

    monthYearLabel.addEventListener('click', () => {
        currentMonthDate = new Date();
        renderMiniCalendar();
    });

    prevMonthBtn.addEventListener('click', () => {
        currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
        renderMiniCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
        renderMiniCalendar();
    });

    // Calendar Filter Checklist Logic (with Skeleton, Empty, and Error states)
    btnFilterCalendars.addEventListener('click', async () => {
        calendarFilterModal.classList.add('active');
        
        // Show realistic Skeleton Checklist
        calendarChecklistContainer.innerHTML = `
            <div class="skeleton-checklist" aria-busy="true" aria-label="${t('loadingCalendars')}">
                <div class="skeleton-checklist-item">
                    <div class="skeleton-box" style="width: 16px; height: 16px; border-radius: 4px;"></div>
                    <div class="skeleton-box" style="width: 10px; height: 10px; border-radius: 9999px;"></div>
                    <div class="skeleton-body" style="flex: 1;">
                        <div class="skeleton-line" style="width: 55%; height: 11px; margin-bottom: 5px;"></div>
                        <div class="skeleton-line" style="width: 35%; height: 9px;"></div>
                    </div>
                </div>
                <div class="skeleton-checklist-item">
                    <div class="skeleton-box" style="width: 16px; height: 16px; border-radius: 4px;"></div>
                    <div class="skeleton-box" style="width: 10px; height: 10px; border-radius: 9999px;"></div>
                    <div class="skeleton-body" style="flex: 1;">
                        <div class="skeleton-line" style="width: 70%; height: 11px; margin-bottom: 5px;"></div>
                        <div class="skeleton-line" style="width: 45%; height: 9px;"></div>
                    </div>
                </div>
                <div class="skeleton-checklist-item">
                    <div class="skeleton-box" style="width: 16px; height: 16px; border-radius: 4px;"></div>
                    <div class="skeleton-box" style="width: 10px; height: 10px; border-radius: 9999px;"></div>
                    <div class="skeleton-body" style="flex: 1;">
                        <div class="skeleton-line" style="width: 48%; height: 11px; margin-bottom: 5px;"></div>
                        <div class="skeleton-line" style="width: 30%; height: 9px;"></div>
                    </div>
                </div>
            </div>
        `;

        // Load auto-launch status
        if (window.calendarWidgetAPI) {
            try {
                const isAuto = await window.calendarWidgetAPI.system.getAutoLaunch();
                const checkboxAutoLaunch = document.getElementById('checkboxAutoLaunch');
                if (checkboxAutoLaunch) checkboxAutoLaunch.checked = isAuto;
            } catch {}
        }

        async function loadCalendarList() {
            try {
                const listRes = await window.calendarWidgetAPI.calendar.getCalendarList();
                if (!listRes || !listRes.calendars || listRes.calendars.length === 0) {
                    calendarChecklistContainer.innerHTML = `
                        <div class="empty-state-card" style="padding: 24px 12px;">
                            <div class="empty-icon-wrap" style="width: 36px; height: 36px;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <h4 class="empty-title" style="font-size: 13px;">${t('noCalendarsTitle')}</h4>
                            <p class="empty-desc" style="font-size: 11px;">${t('noCalendarsDesc')}</p>
                            <div class="empty-actions">
                                <button type="button" class="btn-retry-sync" id="btnRetryLoadCal" style="height: 32px; font-size: 11px;">
                                    <span>${t('btnReload')}</span>
                                </button>
                            </div>
                        </div>
                    `;
                    const btnRetry = document.getElementById('btnRetryLoadCal');
                    if (btnRetry) btnRetry.onclick = () => loadCalendarList();
                    return;
                }

                const { calendars, selectedIds } = listRes;
                let html = '';

                calendars.forEach(cal => {
                    const isChecked = selectedIds.includes(cal.id);
                    const primaryLabel = currentLang === 'en' ? 'Primary Calendar' : 'Kalender Utama';
                    const googleLabel = currentLang === 'en' ? 'Google Calendar' : 'Kalender Google';
                    const desc = cal.primary ? primaryLabel : (cal.description || googleLabel);
                    html += `
                        <label class="calendar-checklist-item" data-id="${cal.id}">
                            <input type="checkbox" class="cal-checkbox" value="${cal.id}" ${isChecked ? 'checked' : ''}>
                            <span class="cal-chip" style="background-color: ${cal.backgroundColor || '#38bdf8'};"></span>
                            <div class="cal-item-info">
                                <span class="cal-item-title">${cal.summary}</span>
                                <span class="cal-item-desc">${desc}</span>
                            </div>
                        </label>
                    `;
                });

                calendarChecklistContainer.innerHTML = html;
            } catch (err) {
                calendarChecklistContainer.innerHTML = `
                    <div class="error-state-card" style="padding: 20px 12px;">
                        <div class="error-icon-wrap" style="width: 36px; height: 36px; margin-bottom: 8px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <h4 class="error-title" style="font-size: 13px;">${t('failedCalendarsTitle')}</h4>
                        <p class="error-desc" style="font-size: 11px;">${err.message || t('failedCalendarsDesc')}</p>
                        <div class="error-actions">
                            <button type="button" class="btn-retry-sync" id="btnRetryLoadCal" style="height: 32px; font-size: 11px;">
                                <span>${t('btnRetry')}</span>
                            </button>
                        </div>
                    </div>
                `;
                const btnRetry = document.getElementById('btnRetryLoadCal');
                if (btnRetry) btnRetry.onclick = () => loadCalendarList();
            }
        }

        await loadCalendarList();
    });

    btnCloseFilterModal.addEventListener('click', () => {
        calendarFilterModal.classList.remove('active');
    });

    btnSelectAllCalendars.addEventListener('click', () => {
        calendarChecklistContainer.querySelectorAll('.cal-checkbox').forEach(cb => cb.checked = true);
    });

    btnDeselectAllCalendars.addEventListener('click', () => {
        calendarChecklistContainer.querySelectorAll('.cal-checkbox').forEach(cb => cb.checked = false);
    });

    const btnOpenLogsFolder = document.getElementById('btnOpenLogsFolder');
    if (btnOpenLogsFolder) {
        btnOpenLogsFolder.addEventListener('click', () => {
            if (window.calendarWidgetAPI) {
                window.calendarWidgetAPI.system.openLogs();
            }
        });
    }

    const btnLogoutGoogleAccount = document.getElementById('btnLogoutGoogleAccount');
    if (btnLogoutGoogleAccount) {
        btnLogoutGoogleAccount.addEventListener('click', () => {
            askConfirmLogout(async () => {
                try {
                    btnLogoutGoogleAccount.disabled = true;
                    if (window.calendarWidgetAPI) {
                        await window.calendarWidgetAPI.auth.logout();
                    }
                    calendarFilterModal.classList.remove('active');
                    allEvents = [];
                    timelineGroups = {};
                    eventsTimeline.innerHTML = '';
                    authOverlay.classList.remove('hidden');
                    updateNextEventBanner();
                    showToast(t('toastAccountDisconnected'), 'info', 3000);
                } catch (err) {
                    showToast(t('toastDisconnectFailed', err.message), 'error');
                } finally {
                    btnLogoutGoogleAccount.disabled = false;
                }
            });
        });
    }

    btnApplyCalendarFilter.addEventListener('click', async () => {
        const checkedBoxes = calendarChecklistContainer.querySelectorAll('.cal-checkbox:checked');
        const checkedIds = Array.from(checkedBoxes).map(cb => cb.value);
        const checkboxAutoLaunch = document.getElementById('checkboxAutoLaunch');

        btnApplyCalendarFilter.disabled = true;
        btnApplyCalendarFilter.textContent = t('btnApplying');

        try {
            if (window.calendarWidgetAPI) {
                await window.calendarWidgetAPI.calendar.setSelectedCalendars(checkedIds);
                if (checkboxAutoLaunch) {
                    await window.calendarWidgetAPI.system.setAutoLaunch(checkboxAutoLaunch.checked);
                }
            }
            calendarFilterModal.classList.remove('active');
            showToast(t('toastSettingsApplied'), 'success');
            await refreshEvents();
        } catch (err) {
            showToast(t('toastSettingsFailed', err.message), 'error');
        } finally {
            btnApplyCalendarFilter.disabled = false;
            btnApplyCalendarFilter.textContent = t('btnApplySettings');
        }
    });

    // Quick Add Event Modal & Calendar Target Selector
    btnAddEvent.addEventListener('click', async () => {
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

        // Format to YYYY-MM-DDTHH:mm
        const pad = n => String(n).padStart(2, '0');
        const formatLocal = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

        checkboxAllDay.checked = false;
        inputEventStart.type = 'datetime-local';
        inputEventEnd.type = 'datetime-local';
        inputEventStart.value = formatLocal(now);
        inputEventEnd.value = formatLocal(inOneHour);
        inputEventEnd.min = inputEventStart.value;
        inputEventTitle.value = '';
        inputEventLocation.value = '';
        inputEventDescription.value = '';

        // Load calendars into dropdown
        try {
            const listRes = await window.calendarWidgetAPI.calendar.getCalendarList();
            if (listRes && listRes.calendars) {
                let optionsHtml = '';
                listRes.calendars.forEach(c => {
                    const primarySuffix = c.primary ? (currentLang === 'en' ? ' (Primary)' : ' (Utama)') : '';
                    optionsHtml += `<option value="${c.id}">${c.summary}${primarySuffix}</option>`;
                });
                selectTargetCalendar.innerHTML = optionsHtml;
            }
        } catch {}

        addEventModal.classList.add('active');
        const card = addEventModal.querySelector('.modal-card');
        if (card) card.scrollTop = 0;
        const widgetApp = document.getElementById('widgetApp');
        if (widgetApp) {
            widgetApp.scrollTop = 0;
            widgetApp.scrollLeft = 0;
        }
        window.scrollTo(0, 0);
        setTimeout(() => {
            inputEventTitle.focus({ preventScroll: true });
        }, 180);
    });

    // Smart Temporal Validation & Auto Offset on Start Time Change
    inputEventStart.addEventListener('change', () => {
        if (!inputEventStart.value) return;
        inputEventEnd.min = inputEventStart.value;

        if (!checkboxAllDay.checked) {
            const startVal = new Date(inputEventStart.value);
            if (!isNaN(startVal.getTime())) {
                const endVal = new Date(startVal.getTime() + 60 * 60 * 1000);
                const pad = n => String(n).padStart(2, '0');
                inputEventEnd.value = `${endVal.getFullYear()}-${pad(endVal.getMonth()+1)}-${pad(endVal.getDate())}T${pad(endVal.getHours())}:${pad(endVal.getMinutes())}`;
            }
        }
    });

    checkboxAllDay.addEventListener('change', () => {
        const isAllDay = checkboxAllDay.checked;
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const formatLocalDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

        if (isAllDay) {
            inputEventStart.type = 'date';
            inputEventEnd.type = 'date';
            inputEventStart.value = formatLocalDate(now);
            inputEventEnd.value = formatLocalDate(now);
            inputEventEnd.min = inputEventStart.value;
        } else {
            const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
            const formatLocal = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            inputEventStart.type = 'datetime-local';
            inputEventEnd.type = 'datetime-local';
            inputEventStart.value = formatLocal(now);
            inputEventEnd.value = formatLocal(inOneHour);
            inputEventEnd.min = inputEventStart.value;
        }
    });

    btnCloseModal.addEventListener('click', () => {
        addEventModal.classList.remove('active');
        const widgetApp = document.getElementById('widgetApp');
        if (widgetApp) {
            widgetApp.scrollTop = 0;
            widgetApp.scrollLeft = 0;
        }
        window.scrollTo(0, 0);
    });

    btnCancelModal.addEventListener('click', () => {
        addEventModal.classList.remove('active');
        const widgetApp = document.getElementById('widgetApp');
        if (widgetApp) {
            widgetApp.scrollTop = 0;
            widgetApp.scrollLeft = 0;
        }
        window.scrollTo(0, 0);
    });

    formAddEvent.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isAllDay = checkboxAllDay.checked;
        const startVal = inputEventStart.value;
        const endVal = inputEventEnd.value;

        // Front-end Temporal Validation
        if (!isAllDay) {
            const startTime = new Date(startVal).getTime();
            const endTime = new Date(endVal).getTime();
            if (endTime <= startTime) {
                showToast(t('valEndAfterStart'), 'error');
                inputEventEnd.focus();
                return;
            }
        }

        const payload = {
            calendarId: selectTargetCalendar.value || 'primary',
            summary: inputEventTitle.value.trim(),
            startDateTime: startVal,
            endDateTime: endVal,
            location: inputEventLocation.value.trim(),
            description: inputEventDescription.value.trim(),
            isAllDay
        };

        const btn = document.getElementById('btnSubmitEvent');
        try {
            if (btn) {
                btn.disabled = true;
                btn.textContent = t('btnSubmitting');
            }

            await window.calendarWidgetAPI.calendar.createQuickEvent(payload);
            addEventModal.classList.remove('active');
            showToast(t('toastEventSaved'), 'success');
            await refreshEvents();
        } catch (err) {
            showToast(t('toastEventSaveFailed', err.message), 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = t('btnSubmitEvent');
            }
        }
    });

    // Data Refreshing
    async function refreshEvents() {
        const icon = btnRefresh.querySelector('.icon-refresh');
        if (icon) icon.classList.add('spinning');
        statusDot.className = 'status-dot syncing';
        statusLabel.textContent = t('syncing');

        // If timeline is completely blank (e.g. initial start), render skeleton
        if (allEvents.length === 0 && !eventsTimeline.querySelector('.skeleton-timeline')) {
            renderTimelineSkeleton();
        }

        try {
            const res = await window.calendarWidgetAPI.calendar.refreshEvents();
            if (!res.authenticated) {
                authOverlay.classList.remove('hidden');
                statusDot.className = 'status-dot offline';
                statusLabel.textContent = t('notLoggedIn');
                return;
            }

            authOverlay.classList.add('hidden');
            allEvents = res.events || [];

            statusDot.className = res.fromCache ? 'status-dot offline' : 'status-dot';
            statusLabel.textContent = res.fromCache ? t('offlineCache') : t('synced');

            if (res.fromCache) {
                showToast(t('toastOfflineCache'), 'info', 2500);
            }

            renderTimeline(allEvents);
            updateNextEventBanner();
            if (viewMonth.classList.contains('active')) {
                renderMiniCalendar();
            }
        } catch (error) {
            console.error('Error refreshing events:', error);
            statusDot.className = 'status-dot offline';
            statusLabel.textContent = t('syncFailed');

            if (allEvents.length === 0) {
                renderTimelineError(t('errorAgendaDesc'));
            } else {
                showToast(t('toastSyncOfflineError'), 'error', 3500);
            }
        } finally {
            if (icon) icon.classList.remove('spinning');
        }
    }

    // App Bootstrap
    async function init() {
        window.scrollTo(0, 0);
        const widgetApp = document.getElementById('widgetApp');
        if (widgetApp) {
            widgetApp.scrollTop = 0;
            widgetApp.scrollLeft = 0;
            widgetApp.addEventListener('scroll', () => {
                if (widgetApp.scrollTop !== 0 || widgetApp.scrollLeft !== 0) {
                    widgetApp.scrollTop = 0;
                    widgetApp.scrollLeft = 0;
                }
            }, { passive: true });
        }
        updateDateBadge();

        if (window.calendarWidgetAPI) {
            isPinned = await window.calendarWidgetAPI.window.isPinned();
            btnPin.classList.toggle('active', isPinned);

            const authStatus = await window.calendarWidgetAPI.auth.checkStatus();
            if (!authStatus.authenticated) {
                authOverlay.classList.remove('hidden');
            } else {
                authOverlay.classList.add('hidden');
                await refreshEvents();
            }

            // Listen to IPC updates
            window.calendarWidgetAPI.onEventsUpdated((data) => {
                allEvents = data.events || [];
                renderTimeline(allEvents);
                updateNextEventBanner();
                if (viewMonth.classList.contains('active')) {
                    renderMiniCalendar();
                }
            });
        }

        // Background-Aware Live Countdown Ticker (Zero CPU usage when minimized/hidden)
        function startTicker() {
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            countdownIntervalId = setInterval(() => {
                const anyModalActive = document.querySelector('.modal-backdrop.active');
                if (!document.hidden && !anyModalActive) {
                    updateNextEventBanner();
                }
            }, 20000);
        }

        function stopTicker() {
            if (countdownIntervalId) {
                clearInterval(countdownIntervalId);
                countdownIntervalId = null;
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopTicker();
            } else {
                updateDateBadge();
                updateNextEventBanner();
                startTicker();
            }
        });

        startTicker();
    }

    // Launch
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
