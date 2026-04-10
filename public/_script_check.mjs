
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getDatabase, ref, onValue, get, set, update, remove } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

    const firebaseConfig = {
      apiKey: 'AIzaSyCujF2OSUSxNfEeEWEBe02EoPZUVB5ZVAs',
      authDomain: 'cua-caro-token.firebaseapp.com',
      databaseURL: 'https://cua-caro-token-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: 'cua-caro-token',
      storageBucket: 'cua-caro-token.appspot.com',
      messagingSenderId: '468029803156',
      appId: '1:468029803156:web:d6a8a0e1692690b07b0281',
      measurementId: 'G-VNS2V6YDF1'
    };

    const db = getDatabase(initializeApp(firebaseConfig));

    const els = {
      globalSubtitle: document.getElementById('globalSubtitle'),
      currentBotBadge: document.getElementById('currentBotBadge'),
      selectedHero: document.getElementById('selectedHero'),
      topStats: document.getElementById('topStats'),
      homeMonthLabel: document.getElementById('homeMonthLabel'),
      topLeaders: document.getElementById('topLeaders'),
      rankMetricHint: document.getElementById('rankMetricHint'),
      rankTabs: Array.from(document.querySelectorAll('[data-rank]')),
      filterSummary: document.getElementById('filterSummary'),
      homeBotList: document.getElementById('homeBotList'),
      botList: document.getElementById('botList'),
      botCount: document.getElementById('botCount'),
      botCountBottom: document.getElementById('botCountBottom'),
      searchInput: document.getElementById('searchInput'),
      sortSelect: document.getElementById('sortSelect'),
      filterSelect: document.getElementById('filterSelect'),
      btnRefresh: document.getElementById('btnRefresh'),
      btnToday: document.getElementById('btnToday'),
      btnPrevMonth: document.getElementById('btnPrevMonth'),
      btnNextMonth: document.getElementById('btnNextMonth'),
      monthLabel: document.getElementById('monthLabel'),
      profitOverview: document.getElementById('profitOverview'),
      profitMonthSummary: document.getElementById('profitMonthSummary'),
      calendarHead: document.getElementById('calendarHead'),
      calendarBody: document.getElementById('calendarBody'),
      detailEmpty: document.getElementById('detailEmpty'),
      detailContent: document.getElementById('detailContent'),
      detailBotTitle: document.getElementById('detailBotTitle'),
      detailBotMeta: document.getElementById('detailBotMeta'),
      detailStateDot: document.getElementById('detailStateDot'),
      detailStateText: document.getElementById('detailStateText'),
      detailKpis: document.getElementById('detailKpis'),
      detailMini: document.getElementById('detailMini'),
      detailBanner: document.getElementById('detailBanner'),
      detailFullGrid: document.getElementById('detailFullGrid'),
      detailInfoGrid: document.getElementById('detailInfoGrid'),
      controlLocked: document.getElementById('controlLocked'),
      controlActions: document.getElementById('controlActions'),
      adminStatePill: document.getElementById('adminStatePill'),
      btnAdminToggle: document.getElementById('btnAdminToggle'),
      adminPin: document.getElementById('adminPin'),
      btnUnlock: document.getElementById('btnUnlock'),
      btnLock: document.getElementById('btnLock'),
      adminContent: document.getElementById('adminContent'),
      editAlias: document.getElementById('editAlias'),
      editNote: document.getElementById('editNote'),
      editStartBalance: document.getElementById('editStartBalance'),
      editRealProfit: document.getElementById('editRealProfit'),
      editRealPct: document.getElementById('editRealPct'),
      editDayTotal: document.getElementById('editDayTotal'),
      editAction: document.getElementById('editAction'),
      btnSaveOverride: document.getElementById('btnSaveOverride'),
      btnClearOverride: document.getElementById('btnClearOverride'),
      btnHideBot: document.getElementById('btnHideBot'),
      btnDeleteBot: document.getElementById('btnDeleteBot'),
      btnExportJson: document.getElementById('btnExportJson'),
      btnTogglePin: document.getElementById('btnTogglePin'),
      btnInstallPwa: document.getElementById('btnInstallPwa'),
      settingsSelectedBot: document.getElementById('settingsSelectedBot'),
      toastStack: document.getElementById('toastStack'),
      appModal: document.getElementById('appModal'),
      modalTitle: document.getElementById('modalTitle'),
      modalBody: document.getElementById('modalBody'),
      modalActions: document.getElementById('modalActions'),
      modalClose: document.getElementById('modalClose'),
      pages: Array.from(document.querySelectorAll('.page')),
      navBtns: Array.from(document.querySelectorAll('.nav-btn')),
      appLoader: document.getElementById('appLoader'),
    };

    const state = {
      botsMap: {},
      bots: [],
      selectedBotKey: '',
      selectedMonth: new Date(),
      adminUnlocked: false,
      panelToken: '',
      manualMap: {},
      ignoredMap: {},
      fixedOrderMap: JSON.parse(localStorage.getItem('jcfx_fixed_order_map') || '{}'),
      activeTab: localStorage.getItem('jcfx_active_tab') || 'home',
      rankMetric: localStorage.getItem('jcfx_rank_metric') || 'realProfit',
      modalActionHandlers: [],
      lastDataAt: 0,
      daySnapshots: JSON.parse(localStorage.getItem('jcfx_day_snapshots') || '{}'),
      monthJsonCache: {},
      monthJsonLoading: {},
      installPrompt: null,
      firstSyncDone: false,
    };

    const weekdayLabels = ['CN','2','3','4','5','6','7'];
    els.calendarHead.innerHTML = weekdayLabels.map(d => `<div>${d}</div>`).join('');

    function fmtNum(v, digits = 2) {
      const n = Number(v || 0);
      return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }
    function fmtSigned(v, digits = 2, pct = false) {
      const n = Number(v || 0);
      const sign = n > 0 ? '+' : '';
      return `${sign}${fmtNum(n, digits)}${pct ? '%' : ''}`;
    }
    function safe(v, fallback = '-') {
      return v === undefined || v === null || v === '' ? fallback : v;
    }
    function colorClassByValue(n) {
      n = Number(n || 0);
      if (n > 0) return 'good';
      if (n < 0) return 'bad';
      return 'muted';
    }
    function openOrdersValue(item) {
      return Number(item?.orders ?? item?.ordersOpen ?? item?.pairOpen ?? 0);
    }
    function lotsOpenValue(item) {
      return Number(item?.lotsOpen ?? 0);
    }
    function hasTargetHit(item) {
      return Number(item?.targetHit || 0) === 1 || String(item?.targetReached || '').toUpperCase() === 'YES';
    }
    function stateLabel(item) {
      return safe(item?.statusVi || item?.state || item?.status, 'NO STATE');
    }
    function reasonLabel(item) {
      return safe(item?.statusReason || item?.reason || item?.action, 'NO REASON');
    }
    function timeModeLabel(item) {
      const raw = String(item?.timeMode || '').toLowerCase();
      if (!raw) return '-';
      if (raw === 'mode_247' || raw === '24/7' || raw === 'free') return '24/7';
      if (raw === 'time' || raw === 'theo giờ') return 'THEO GIỜ';
      return safe(item?.timeMode);
    }
    function pingText(item) {
      const n = Number(item?.pingMs || 0);
      return n > 0 ? `${fmtNum(n,0)}ms` : '-';
    }
    function heartbeatAgeSec(item) {
      const updatedTs = Number(item?.updatedTs || item?.heartbeatAt || 0);
      if (!updatedTs) return 999999;
      return Math.max(0, Math.floor((Date.now() - updatedTs) / 1000));
    }
    function connectionState(item) {
      const age = heartbeatAgeSec(item);
      if (age <= 10) return 'online';
      if (age <= 30) return 'stale';
      return 'dead';
    }
    function isLive(item) {
      return connectionState(item) === 'online';
    }
    function connectionText(item) {
      const age = heartbeatAgeSec(item);
      if (age <= 10) return `Online · ${age}s`;
      if (age <= 30) return `Chậm nhịp · ${age}s`;
      if (age < 3600) return `Mất kết nối · ${Math.floor(age / 60)}m`;
      return `Mất kết nối · ${Math.floor(age / 3600)}h`;
    }
    function lastSeenText(item) {
      const ts = Number(item?.updatedTs || item?.heartbeatAt || 0);
      if (!ts) return 'Chưa có heartbeat';
      return `${timeLabel(ts)} · ${connectionText(item)}`;
    }
    function monthName(date) {
      return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
    }

    function ymd(date) {
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }
    function monthFileName(date) {
      return `lich_thang_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2,'0')}.json`;
    }
    function inSelectedMonth(dateKey, date = state.selectedMonth) {
      const d = new Date(`${dateKey}T00:00:00`);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    }
    async function ensureMonthJson(date = state.selectedMonth) {
      const file = monthFileName(date);
      if (state.monthJsonCache[file]) return state.monthJsonCache[file];
      if (state.monthJsonLoading[file]) return state.monthJsonLoading[file];
      state.monthJsonLoading[file] = fetch(`/calendar/${encodeURIComponent(file)}`)
        .then(res => res.json().catch(() => ({})))
        .then(json => {
          state.monthJsonCache[file] = json && json.ok ? json : { ok: true, file, bots: {}, meta: {} };
          delete state.monthJsonLoading[file];
          renderAll();
          return state.monthJsonCache[file];
        })
        .catch(() => {
          delete state.monthJsonLoading[file];
          const fallback = { ok: true, file, bots: {}, meta: {} };
          state.monthJsonCache[file] = fallback;
          return fallback;
        });
      return state.monthJsonLoading[file];
    }
    function getSavedMonthDays(botKey, date = state.selectedMonth) {
      const file = monthFileName(date);
      const payload = state.monthJsonCache[file] || {};
      return payload?.bots?.[botKey]?.days || {};
    }
    function mergedMonthDays(bot, date = state.selectedMonth) {
      const liveDays = bot?.days || {};
      const savedDays = getSavedMonthDays(bot?.botKey, date);
      const todayKey = ymd(new Date());
      const out = {};
      Object.entries(savedDays).forEach(([key, val]) => {
        if (!inSelectedMonth(key, date)) return;
        out[key] = { ...val, __source: 'saved_json' };
      });
      Object.entries(liveDays).forEach(([key, val]) => {
        if (!inSelectedMonth(key, date)) return;
        if (key >= todayKey || !out[key]) out[key] = { ...(out[key] || {}), ...val, __source: key >= todayKey ? 'live' : (out[key] ? out[key].__source : 'live') };
      });
      return out;
    }
    function pickFinite(...values) {
      for (const value of values) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
      }
      return null;
    }
    function daySnapshotKey(botKey, dateKey) {
      return `${botKey}__${dateKey}`;
    }
    function persistDaySnapshots() {
      localStorage.setItem('jcfx_day_snapshots', JSON.stringify(state.daySnapshots || {}));
    }
    function normalizeDayData(botKey, dateKey, rawItem = {}) {
      const cache = state.daySnapshots[daySnapshotKey(botKey, dateKey)] || {};
      const todayKey = ymd(new Date());
      const isPast = dateKey < todayKey;
      const startBal = pickFinite(rawItem.dayStartBalance, rawItem.firstBalance, rawItem.startBalance, rawItem.balance, cache.startBal) ?? 0;
      const endEq = pickFinite(rawItem.stopEquity, rawItem.endEquity, rawItem.finalEquity, rawItem.latestEquity, rawItem.equity, cache.endEq) ?? 0;
      const lockedProfit = pickFinite(
        rawItem.actualDayProfitEquity,
        rawItem.uiFrozenProfit,
        rawItem.finalProfit,
        rawItem.frozenProfit,
        rawItem.dayProfit,
        rawItem.profit
      );
      const lockedPct = pickFinite(
        rawItem.actualDayPctEquity,
        rawItem.uiFrozenPct,
        rawItem.finalPct,
        rawItem.frozenPct,
        rawItem.dayPct,
        rawItem.pct
      );
      const cacheProfit = pickFinite(cache.profit);
      const cachePct = pickFinite(cache.pct);
      let profit = lockedProfit;
      if (!Number.isFinite(profit)) {
        if (isPast && Number.isFinite(cacheProfit)) profit = cacheProfit;
        else if (Number.isFinite(startBal) && Number.isFinite(endEq)) profit = endEq - startBal;
      }
      let pct = lockedPct;
      if (!Number.isFinite(pct)) {
        if (isPast && Number.isFinite(cachePct)) pct = cachePct;
        else if (startBal > 0 && Number.isFinite(profit)) pct = (profit / startBal) * 100;
      }
      return {
        startBal,
        endEq,
        profit: Number.isFinite(profit) ? profit : 0,
        pct: Number.isFinite(pct) ? pct : 0,
        isPast,
        hasLockedProfit: Number.isFinite(lockedProfit),
        hasLockedPct: Number.isFinite(lockedPct),
      };
    }
    function freezeSeenDaySnapshots() {
      let changed = false;
      for (const bot of state.bots) {
        const daysMap = bot?.days || {};
        for (const [dateKey, rawItem] of Object.entries(daysMap)) {
          const norm = normalizeDayData(bot.botKey, dateKey, rawItem);
          const key = daySnapshotKey(bot.botKey, dateKey);
          const prev = state.daySnapshots[key] || {};
          const next = {
            profit: norm.profit,
            pct: norm.pct,
            startBal: norm.startBal,
            endEq: norm.endEq,
            savedAt: Date.now(),
          };
          const shouldUpdate =
            !Number.isFinite(Number(prev.profit)) ||
            norm.isPast ||
            norm.hasLockedProfit ||
            norm.hasLockedPct;
          if (!shouldUpdate) continue;
          if (JSON.stringify(prev) !== JSON.stringify(next)) {
            state.daySnapshots[key] = next;
            changed = true;
          }
        }
      }
      if (changed) persistDaySnapshots();
    }
    function timeLabel(ts) {
      if (!ts) return '--:--:--';
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ts));
    }
    function esc(str) {
      return String(str ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }
    function showToast(message, type = 'info', title = '') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <div class="toast-dot"></div>
        <div>
          <strong>${esc(title || (type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : type === 'warn' ? 'Lưu ý' : 'Thông báo'))}</strong>
          <span>${esc(message)}</span>
        </div>
      `;
      els.toastStack.appendChild(toast);
      const close = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 180);
      };
      setTimeout(close, 2600);
      toast.addEventListener('click', close);
    }
    function closeModal() {
      els.appModal.classList.add('hide');
      els.appModal.setAttribute('aria-hidden', 'true');
      els.modalBody.innerHTML = '';
      els.modalActions.innerHTML = '';
      state.modalActionHandlers = [];
    }
    function openModal({ title = 'Thông báo', html = '', actions = [] }) {
      els.modalTitle.textContent = title;
      els.modalBody.innerHTML = html;
      els.modalActions.innerHTML = actions.map((action, idx) => `<button class="${action.className || 'ghost'}" data-modal-action="${idx}">${esc(action.label || 'OK')}</button>`).join('');
      state.modalActionHandlers = actions.map(action => action.onClick || (() => {}));
      els.appModal.classList.remove('hide');
      els.appModal.setAttribute('aria-hidden', 'false');
      Array.from(els.modalActions.querySelectorAll('[data-modal-action]')).forEach(btn => {
        btn.addEventListener('click', async () => {
          const fn = state.modalActionHandlers[Number(btn.dataset.modalAction)];
          if (fn) await fn();
        });
      });
    }
    function showConfirm({ title = 'Xác nhận', text = '', confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false }) {
      return new Promise(resolve => {
        openModal({
          title,
          html: `<div class="modal-text">${esc(text)}</div>`,
          actions: [
            { label: cancelText, className: 'ghost', onClick: () => { closeModal(); resolve(false); } },
            { label: confirmText, className: danger ? 'danger' : 'primary', onClick: () => { closeModal(); resolve(true); } }
          ]
        });
      });
    }
    function openBotModal(bot) {
      if (!bot) return;
      const pairs = fullInfoPairs(bot);
      openModal({
        title: bot.alias || bot.bot || 'Bot',
        html: `
          <div class="modal-kpis">
            <div class="modal-metric"><div class="label">Balance</div><div class="value">$${fmtNum(bot.balance)}</div></div>
            <div class="modal-metric"><div class="label">Equity</div><div class="value">$${fmtNum(bot.equity)}</div></div>
            <div class="modal-metric"><div class="label">Lãi thực</div><div class="value ${colorClassByValue(bot.realProfit)}">$${fmtSigned(bot.realProfit)}</div></div>
            <div class="modal-metric"><div class="label">Tổng ngày</div><div class="value ${colorClassByValue(bot.dayTotal)}">$${fmtSigned(bot.dayTotal)}</div></div>
          </div>
          <div class="small-card"><div class="label">Kết nối</div><div class="value">${connectionText(bot)} · ${esc(stateLabel(bot))} · ${esc(reasonLabel(bot))}</div></div>
          <div class="modal-list">
            ${pairs.map(([label,value]) => `<div class="small-card"><div class="label">${esc(label)}</div><div class="value">${value}</div></div>`).join('')}
          </div>
        `,
        actions: [
          { label: 'Đóng', className: 'ghost', onClick: closeModal },
          { label: 'Mở tab Bots', className: 'primary', onClick: () => { closeModal(); switchTab('bots'); } }
        ]
      });
    }
    function openDayModal(dateKey, rawItem) {
      const bot = selectedBot();
      if (!rawItem || !bot) return;
      const norm = normalizeDayData(bot.botKey, dateKey, rawItem);
      const startBal = norm.startBal;
      const endEq = norm.endEq;
      const profit = norm.profit;
      const pct = norm.pct;
      openModal({
        title: `Chi tiết ngày ${dateKey}`,
        html: `
          <div class="modal-kpis">
            <div class="modal-metric"><div class="label">Lãi ngày</div><div class="value ${colorClassByValue(profit)}">$${fmtSigned(profit)}</div></div>
            <div class="modal-metric"><div class="label">% ngày</div><div class="value ${colorClassByValue(pct)}">${fmtSigned(pct, 2, true)}</div></div>
            <div class="modal-metric"><div class="label">Vốn đầu ngày</div><div class="value">$${fmtNum(startBal)}</div></div>
            <div class="modal-metric"><div class="label">Equity cuối</div><div class="value">$${fmtNum(endEq)}</div></div>
          </div>
          <div class="modal-list">
            <div class="small-card"><div class="label">Orders</div><div class="value">${fmtNum(rawItem.dayOrders || 0,0)}</div></div>
            <div class="small-card"><div class="label">Buy / Sell / Lots</div><div class="value">${fmtNum(rawItem.dayBuy || rawItem.buy || 0,0)} / ${fmtNum(rawItem.daySell || rawItem.sell || 0,0)} / ${fmtNum(rawItem.dayLots || rawItem.lots || 0,2)}</div></div>
            <div class="small-card"><div class="label">Ghi chú</div><div class="value">${esc(safe(rawItem.note || rawItem.status || 'Không có'))}</div></div>
          </div>
        `,
        actions: [{ label: 'Đóng', className: 'primary', onClick: closeModal }]
      });
    }
    function pinCompare(a, b) {
      const ap = a?.pinned ? 1 : 0;
      const bp = b?.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      if (ap && bp) return Number(a.pinOrder || 0) - Number(b.pinOrder || 0);
      return 0;
    }
    function statusFlag(bot) {
      const c = connectionState(bot);
      if (c === 'online') return '<span class="flag good">ONLINE</span>';
      if (c === 'stale') return '<span class="flag warn">CHẬM NHỊP</span>';
      return '<span class="flag bad">MẤT KẾT NỐI</span>';
    }
    function rankMetricMeta() {
      const map = {
        realProfit: ['Lãi thực cao nhất', 'realProfit', '$'],
        realPct: ['% lãi thực cao nhất', 'realPct', '%'],
        dayTotal: ['Lãi ngày cao nhất', 'dayTotal', '$'],
      };
      return map[state.rankMetric] || map.realProfit;
    }
    function fullInfoPairs(bot) {
      return [
        ['Alias hiển thị', safe(bot.alias || bot.bot)],
        ['ID / Symbol', `${safe(bot.id)} · ${safe(bot.symbol)}`],
        ['Tên tài khoản', safe(bot.name)],
        ['Kết nối', connectionText(bot)],
        ['Cập nhật cuối', lastSeenText(bot)],
        ['Phiên bản EA', safe(bot.version)],
        ['EA time', safe(bot.eaTime)],
        ['Ping bridge', pingText(bot)],
        ['Balance', `$${fmtNum(bot.balance)}`],
        ['Equity', `$${fmtNum(bot.equity)}`],
        ['Free margin', `$${fmtNum(bot.freeMargin)}`],
        ['Margin / Level', `$${fmtNum(bot.margin)} / ${fmtNum(bot.marginLevel)}%`],
        ['Vốn đầu ngày', `$${fmtNum(bot.dayStartBalance || bot.balance)}`],
        ['Vốn đầu equity', `$${fmtNum(bot.dayStartEquity || bot.equity)}`],
        ['Lãi thực', `$${fmtSigned(bot.realProfit)}`],
        ['% lãi thực', fmtSigned(bot.realPct,2,true)],
        ['Tổng ngày', `$${fmtSigned(bot.dayTotal)}`],
        ['% ngày', fmtSigned(bot.dayPct,2,true)],
        ['Floating / Closed', `$${fmtSigned(bot.dayFloating)} / $${fmtSigned(bot.dayClosed)}`],
        ['DD hiện tại', `${fmtNum(bot.dd)}%`],
        ['Max DD ngày', `${fmtNum(bot.dayMaxDD)}%`],
        ['Worst EDD', fmtNum(bot.dayWorstEDD,2)],
        ['Open orders', fmtNum(openOrdersValue(bot),0)],
        ['BUY / SELL mở', `${fmtNum(bot.buyOpen,0)} / ${fmtNum(bot.sellOpen,0)}`],
        ['Lots mở', fmtNum(lotsOpenValue(bot),2)],
        ['Lots BUY / SELL', `${fmtNum(bot.buyLotsOpen,2)} / ${fmtNum(bot.sellLotsOpen,2)}`],
        ['Orders ngày', fmtNum(bot.dayOrders,0)],
        ['Lots ngày', fmtNum(bot.dayLots,2)],
        ['Volume ngày', fmtNum(bot.dayVolume,2)],
        ['Target hôm nay', `${fmtNum(bot.targetPct,2)}% · ${hasTargetHit(bot) ? 'ĐÃ ĐẠT' : 'CHƯA ĐẠT'}`],
        ['Hard lock', `${Number(bot.hardLockEnabled || 0) === 1 ? 'BẬT' : 'TẮT'} · $${fmtNum(bot.hardLockMoney,2)}`],
        ['Spread', fmtNum(bot.spread,1)],
        ['Score / Trend', `${fmtNum(bot.score || bot.buyScore || 0,0)} · ${safe(bot.trend)}`],
        ['Basket mode', safe(bot.basketMode)],
        ['State', stateLabel(bot)],
        ['Reason', reasonLabel(bot)],
        ['Status', safe(bot.status)],
        ['Action', safe(bot.lastAction || bot.action)],
        ['Auto trade', safe(bot.autoTrade)],
        ['Time mode', timeModeLabel(bot)],
        ['Remote status', safe(bot.remoteStatus)],
        ['Cooldown', safe(bot.cooldown)],
        ['Target reached', hasTargetHit(bot) ? 'YES' : safe(bot.targetReached)],
        ['Admin note', safe(bot.note)],
        ['Pinned', bot.pinned ? 'Có' : 'Không'],
      ];
    }
    function persistFixedOrder() {
      localStorage.setItem('jcfx_fixed_order_map', JSON.stringify(state.fixedOrderMap || {}));
    }
    function ensureFixedOrder(botKeys = []) {
      let changed = false;
      let maxOrder = Object.values(state.fixedOrderMap || {}).reduce((m, v) => Math.max(m, Number(v) || 0), 0);
      botKeys.forEach(botKey => {
        if (state.fixedOrderMap[botKey] === undefined) {
          maxOrder += 1;
          state.fixedOrderMap[botKey] = maxOrder;
          changed = true;
        }
      });
      if (changed) persistFixedOrder();
    }
    function fixedOrderOf(botKey) {
      const v = Number(state.fixedOrderMap?.[botKey]);
      return Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER;
    }
    function mergedBot(botKey, payload) {
      const live = payload?.live || {};
      const meta = payload?.meta || {};
      const manual = state.manualMap[botKey] || {};
      const overrides = manual.liveOverrides || {};
      const merged = { ...live, ...overrides };
      merged.botKey = botKey;
      merged.alias = manual.alias || '';
      merged.note = manual.note || '';
      merged.pinned = !!manual.pinned;
      merged.pinOrder = Number(manual.pinOrder || 0);
      merged.updatedAt = merged.serverTime || meta.updatedAt || '';
      merged.updatedTs = merged.updatedTs || merged.heartbeatAt || meta.updatedTs || 0;
      merged.days = payload?.days || {};
      merged.meta = meta;
      merged.ignored = !!state.ignoredMap[botKey];
      return merged;
    }
    function selectedBot() {
      return state.bots.find(b => b.botKey === state.selectedBotKey && !b.ignored) || null;
    }
    function persistSelectedBot() {
      localStorage.setItem('jcfx_selected_bot', state.selectedBotKey || '');
    }
    function loadSelectedBot() {
      state.selectedBotKey = localStorage.getItem('jcfx_selected_bot') || '';
    }
    function onlineChip(item) {
      const c = connectionState(item);
      const dot = c === 'online' ? 'live' : c;
      return `<span class="status-chip ${c}"><span class="dot ${dot}"></span>${connectionText(item)}</span>`;
    }
    function filteredBots() {
      const q = els.searchInput.value.trim().toLowerCase();
      const mode = els.filterSelect.value;
      let arr = [...state.bots].filter(b => !b.ignored);
      if (q) {
        arr = arr.filter(b =>
          String(b.id || '').toLowerCase().includes(q) ||
          String(b.bot || '').toLowerCase().includes(q) ||
          String(b.symbol || '').toLowerCase().includes(q) ||
          String(b.name || '').toLowerCase().includes(q) ||
          String(b.alias || '').toLowerCase().includes(q)
        );
      }
      if (mode === 'live') arr = arr.filter(b => connectionState(b) === 'online');
      if (mode === 'paused') arr = arr.filter(b => String(b.state || '').toUpperCase() === 'PAUSED');
      if (mode === 'dead') arr = arr.filter(b => connectionState(b) === 'dead');
      const sort = els.sortSelect.value;
      const base = (a, b) => pinCompare(a, b) || fixedOrderOf(a.botKey) - fixedOrderOf(b.botKey);
      if (sort === 'profit') arr.sort((a,b)=>pinCompare(a,b)||Number(b.realProfit||0)-Number(a.realProfit||0)||fixedOrderOf(a.botKey)-fixedOrderOf(b.botKey));
      else if (sort === 'realPct') arr.sort((a,b)=>pinCompare(a,b)||Number(b.realPct||0)-Number(a.realPct||0)||fixedOrderOf(a.botKey)-fixedOrderOf(b.botKey));
      else if (sort === 'day') arr.sort((a,b)=>pinCompare(a,b)||Number(b.dayTotal||0)-Number(a.dayTotal||0)||fixedOrderOf(a.botKey)-fixedOrderOf(b.botKey));
      else if (sort === 'dd') arr.sort((a,b)=>pinCompare(a,b)||Number(a.dd||0)-Number(b.dd||0)||fixedOrderOf(a.botKey)-fixedOrderOf(b.botKey));
      else if (sort === 'name') arr.sort((a,b)=>pinCompare(a,b)||String(a.alias||a.bot||'').localeCompare(String(b.alias||b.bot||''),'vi')||fixedOrderOf(a.botKey)-fixedOrderOf(b.botKey));
      else arr.sort(base);
      return arr;
    }
    function refreshSelectionIfMissing() {
      const items = filteredBots();
      if (!state.selectedBotKey && items.length) {
        state.selectedBotKey = items[0].botKey;
        persistSelectedBot();
      }
      if (state.selectedBotKey && !state.bots.some(b => b.botKey === state.selectedBotKey && !b.ignored)) {
        state.selectedBotKey = items[0]?.botKey || '';
        persistSelectedBot();
      }
    }
    function activeFilterText() {
      const map = { all: 'Tất cả bot', live: 'Bot online', paused: 'Bot paused', dead: 'Bot mất kết nối' };
      return `${map[els.filterSelect.value] || 'Tất cả bot'} · ${els.sortSelect.options[els.sortSelect.selectedIndex]?.text || ''}`;
    }
    function currentMonthDayStats(bot) {
      const daysMap = mergedMonthDays(bot);
      let profit = 0;
      let orders = 0;
      let startBase = 0;
      Object.entries(daysMap).forEach(([key, item]) => {
        const norm = normalizeDayData(bot.botKey, key, item);
        profit += norm.profit;
        orders += Number(item.dayOrders || 0);
        if (!startBase && norm.startBal > 0) startBase = norm.startBal;
      });
      return { profit, orders, pct: startBase > 0 ? (profit / startBase) * 100 : 0 };
    }

    function renderHeader() {
      const visible = state.bots.filter(b => !b.ignored);
      const total = visible.length;
      const online = visible.filter(b => connectionState(b) === 'online').length;
      const dead = visible.filter(b => connectionState(b) === 'dead').length;
      const brand = document.querySelector('.brand');
      const existing = document.querySelector('.live-pill');
      if (existing) existing.remove();
      const livePill = document.createElement('div');
      livePill.className = 'live-pill';
      livePill.innerHTML = `<span class="dot ${online > 0 ? 'live' : dead > 0 ? 'stale' : 'dead'}"></span><span>${online} online · ${dead} dead</span>`;
      brand.after(livePill);
      const syncText = state.lastDataAt ? ` · Đồng bộ ${timeLabel(state.lastDataAt)}` : '';
      els.globalSubtitle.innerHTML = `Realtime ${online}/${total} bot · ${activeFilterText()}<span class="sync-note">${syncText}</span>`;
    }

    function renderTopStats() {
      const items = state.bots.filter(b => !b.ignored);
      let online = 0, stale = 0, dead = 0, running = 0, paused = 0, target = 0, monthProfit = 0, monthPctBase = 0, pinned = 0;
      items.forEach(bot => {
        const c = connectionState(bot);
        if (c === 'online') online += 1;
        else if (c === 'stale') stale += 1;
        else dead += 1;
        if (String(bot.state || '').toUpperCase() === 'RUNNING') running += 1;
        if (String(bot.state || '').toUpperCase() === 'PAUSED') paused += 1;
        if (hasTargetHit(bot)) target += 1;
        if (bot.pinned) pinned += 1;
        const agg = currentMonthDayStats(bot);
        monthProfit += agg.profit;
        monthPctBase += agg.pct;
      });
      const cards = [
        ['Tổng bot', items.length, 'muted'],
        ['Bot online', online, online ? 'good' : 'muted'],
        ['Bot chậm nhịp', stale, stale ? 'warn' : 'muted'],
        ['Bot chết', dead, dead ? 'bad' : 'muted'],
        ['Đang chạy', running, running ? 'good' : 'muted'],
        ['Pause tổng', paused, paused ? 'warn' : 'muted'],
        ['Đủ target', target, target ? 'warn' : 'muted'],
        ['Bot ghim', pinned, pinned ? 'good' : 'muted'],
        ['% tháng', `${fmtNum(monthPctBase)}%`, colorClassByValue(monthPctBase)],
        ['Lãi tháng', `$${fmtSigned(monthProfit)}`, colorClassByValue(monthProfit)],
        ['Đang hiển thị', filteredBots().length, 'muted'],
        ['Bộ lọc', els.filterSelect.options[els.filterSelect.selectedIndex]?.text || 'Tất cả', 'muted'],
      ];
      els.homeMonthLabel.textContent = monthName(state.selectedMonth);
      els.topStats.innerHTML = cards.map(([label,value,cls]) => `<div class="stat-card"><div class="label">${label}</div><div class="value ${cls}">${value}</div></div>`).join('');
    }

    function renderTopLeaders() {
      const [hint, metric, suffix] = rankMetricMeta();
      els.rankMetricHint.textContent = hint;
      els.rankTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.rank === state.rankMetric));
      const leaders = state.bots
        .filter(b => !b.ignored)
        .sort((a, b) => pinCompare(a,b) || Number(b[metric] || 0) - Number(a[metric] || 0) || Number(b.realProfit || 0) - Number(a.realProfit || 0))
        .slice(0, 5);
      els.topLeaders.innerHTML = leaders.length
        ? leaders.map((item, idx) => {
            const metricValue = Number(item[metric] || 0);
            const valueText = suffix === '%' ? fmtSigned(metricValue, 2, true) : `$${fmtSigned(metricValue)}`;
            return `
              <div class="top-item" data-botkey="${item.botKey}">
                <div class="top-rank rank-${idx + 1}">${idx + 1}</div>
                <div class="top-main">
                  <div class="name">${item.alias || item.bot || 'BOT'} ${item.pinned ? '· PIN' : ''}</div>
                  <div class="meta">ID ${safe(item.id)} · ${safe(item.symbol)} · ${connectionText(item)}</div>
                </div>
                <div class="top-profit ${colorClassByValue(metricValue)}">${valueText}</div>
              </div>
            `;
          }).join('')
        : '<div class="empty">Chưa có dữ liệu BXH bot.</div>';
      attachBotCardEvents(els.topLeaders, 'bots');
    }

    function renderSelectedHero() {
      const bot = selectedBot();
      els.currentBotBadge.textContent = bot ? (bot.alias || bot.bot || 'BOT') : 'Chưa chọn';
      els.settingsSelectedBot.textContent = bot ? (bot.alias || bot.bot || '-') : '-';
      if (!bot) {
        els.selectedHero.innerHTML = '<div class="empty">Chưa có bot nào để hiển thị.</div>';
        return;
      }
      els.selectedHero.innerHTML = `
        <div class="row-between">
          <div>
            <div class="bot-title">${bot.alias || bot.bot || 'BOT'}</div>
            <div class="meta">ID <span class="mono">${safe(bot.id)}</span> · ${safe(bot.symbol)} · ${safe(bot.name)}</div>
          </div>
          <div>${onlineChip(bot)}</div>
        </div>
        <div class="bot-flags">
          ${bot.pinned ? '<span class="flag pin">PINNED</span>' : ''}
          ${statusFlag(bot)}
          <span class="flag ${String(bot.state||'').toUpperCase()==='PAUSED' ? 'warn' : 'good'}">${esc(safe(bot.state,'NO STATE'))}</span>
          <span class="flag">${esc(safe(bot.trend,'NO TREND'))}</span>
        </div>
        <div class="split2">
          <div class="metric">
            <div class="label">Lãi thực</div>
            <div class="value ${colorClassByValue(bot.realProfit)}">$${fmtSigned(bot.realProfit)}</div>
            <div class="mini">${fmtSigned(bot.realPct, 2, true)} · Equity $${fmtNum(bot.equity)}</div>
          </div>
          <div class="metric">
            <div class="label">Lãi hôm nay</div>
            <div class="value ${colorClassByValue(bot.dayTotal)}">$${fmtSigned(bot.dayTotal)}</div>
            <div class="mini">Open ${fmtNum(openOrdersValue(bot), 0)} · DD ${fmtNum(bot.dd)}% · ${hasTargetHit(bot) ? 'Target done' : 'Target chưa đạt'}</div>
          </div>
        </div>
        <div class="bot-grid">
          <div><div class="tag">Balance</div><strong>$${fmtNum(bot.balance)}</strong></div>
          <div><div class="tag">Vốn đầu ngày</div><strong>$${fmtNum(bot.dayStartBalance || bot.balance)}</strong></div>
          <div><div class="tag">Lots mở</div><strong>${fmtNum(lotsOpenValue(bot),2)}</strong></div>
          <div><div class="tag">Time mode</div><strong>${timeModeLabel(bot)}</strong></div>
        </div>
        <div class="meta">${stateLabel(bot)} · ${reasonLabel(bot)} · ${safe(bot.lastAction || bot.action, 'Không có action')} · ${lastSeenText(bot)}</div>
        <div class="hero-actions">
          <button class="ghost" id="btnOpenBotModal">Xem full info</button>
          <button class="ghost" id="btnJumpBots">Mở tab Bots</button>
        </div>
      `;
      document.getElementById('btnOpenBotModal')?.addEventListener('click', () => openBotModal(bot));
      document.getElementById('btnJumpBots')?.addEventListener('click', () => switchTab('bots'));
    }

    function miniBotHtml(item) {
      return `
        <div class="mini-bot ${item.botKey === state.selectedBotKey ? 'active' : ''}" data-botkey="${item.botKey}">
          <div class="row-between">
            <div class="name">${item.alias || item.bot || 'BOT'}</div>
            <div>${onlineChip(item)}</div>
          </div>
          <div class="meta">ID ${safe(item.id)} · ${safe(item.symbol)} · ${safe(item.name)}</div>
          <div class="bot-flags">
            ${item.pinned ? '<span class="flag pin">PIN</span>' : ''}
            ${statusFlag(item)}
            <span class="flag ${String(item.state||'').toUpperCase()==='PAUSED' ? 'warn' : 'good'}">${esc(safe(item.state,'NO STATE'))}</span>
          </div>
          <div class="bot-grid">
            <div><div class="tag">Lãi thực</div><strong class="${colorClassByValue(item.realProfit)}">$${fmtSigned(item.realProfit)}</strong></div>
            <div><div class="tag">% thực</div><strong class="${colorClassByValue(item.realPct)}">${fmtSigned(item.realPct,2,true)}</strong></div>
            <div><div class="tag">Lãi ngày</div><strong class="${colorClassByValue(item.dayTotal)}">$${fmtSigned(item.dayTotal)}</strong></div>
            <div><div class="tag">DD</div><strong>${fmtNum(item.dd)}%</strong></div>
            <div><div class="tag">Equity</div><strong>$${fmtNum(item.equity)}</strong></div>
            <div><div class="tag">Open</div><strong>${fmtNum(openOrdersValue(item),0)}</strong></div>
            <div><div class="tag">Lots mở</div><strong>${fmtNum(lotsOpenValue(item),2)}</strong></div>
            <div><div class="tag">Target</div><strong class="${hasTargetHit(item) ? 'good' : 'muted'}">${hasTargetHit(item) ? 'DONE' : 'WAIT'}</strong></div>
          </div>
          <div class="meta" style="margin-top:10px">${stateLabel(item)} · ${reasonLabel(item)} · ${lastSeenText(item)}</div>
        </div>
      `;
    }
    function botRowHtml(item) {
      return `
        <div class="bot-row ${item.botKey === state.selectedBotKey ? 'active' : ''}" data-botkey="${item.botKey}">
          <div>
            <div class="row-between">
              <div class="name">${item.alias || item.bot || 'BOT'}</div>
              <div>${onlineChip(item)}</div>
            </div>
            <div class="meta">ID ${safe(item.id)} · ${safe(item.symbol)} · ${safe(item.name)}</div>
            <div class="bot-flags">
              ${item.pinned ? '<span class="flag pin">PINNED</span>' : ''}
              ${statusFlag(item)}
              <span class="flag">${esc(safe(item.trend,'NO TREND'))}</span>
            </div>
            <div class="bot-grid">
              <div><div class="tag">Balance</div><strong>$${fmtNum(item.balance)}</strong></div>
              <div><div class="tag">Equity</div><strong>$${fmtNum(item.equity)}</strong></div>
              <div><div class="tag">Lãi thực</div><strong class="${colorClassByValue(item.realProfit)}">$${fmtSigned(item.realProfit)}</strong></div>
              <div><div class="tag">% thực</div><strong class="${colorClassByValue(item.realPct)}">${fmtSigned(item.realPct,2,true)}</strong></div>
              <div><div class="tag">Ngày</div><strong class="${colorClassByValue(item.dayTotal)}">$${fmtSigned(item.dayTotal)}</strong></div>
              <div><div class="tag">DD</div><strong>${fmtNum(item.dd)}%</strong></div>
              <div><div class="tag">Open</div><strong>${fmtNum(openOrdersValue(item),0)}</strong></div>
              <div><div class="tag">Lots mở / ngày</div><strong>${fmtNum(lotsOpenValue(item),2)} / ${fmtNum(item.dayLots,2)}</strong></div>
            </div>
            <div class="meta" style="margin-top:10px">${stateLabel(item)} · ${reasonLabel(item)} · ${timeModeLabel(item)} · ${lastSeenText(item)}</div>
          </div>
        </div>
      `;
    }
    function attachBotCardEvents(root, nextTab = null) {
      Array.from(root.querySelectorAll('[data-botkey]')).forEach(card => {
        card.addEventListener('click', () => {
          state.selectedBotKey = card.dataset.botkey;
          persistSelectedBot();
          renderAll();
          if (nextTab) switchTab(nextTab);
        });
      });
    }
    function renderBotLists() {
      const items = filteredBots();
      els.filterSummary.textContent = activeFilterText();
      els.botCount.textContent = String(items.length);
      els.botCountBottom.textContent = String(items.length);
      els.homeBotList.innerHTML = items.length ? items.map(miniBotHtml).join('') : '<div class="empty">Không có bot nào.</div>'; 
      els.botList.innerHTML = items.length ? items.map(botRowHtml).join('') : '<div class="empty">Không có bot nào để hiển thị.</div>';
      attachBotCardEvents(els.homeBotList, 'bots');
      attachBotCardEvents(els.botList, null);
    }

    function renderProfitOverview() {
      ensureMonthJson(state.selectedMonth);
      const bot = selectedBot();
      els.monthLabel.textContent = monthName(state.selectedMonth);
      if (!bot) {
        els.profitOverview.innerHTML = '<div class="empty" style="grid-column:1/-1;height:100%">Chọn bot ở tab Bots để xem hiệu suất.</div>';
        els.profitMonthSummary.innerHTML = '';
        renderCalendar(null);
        return;
      }
      const agg = currentMonthDayStats(bot);
      const cards = [
        ['Vốn hiện tại', `$${fmtNum(bot.equity)}`, 'muted'],
        ['Vốn đầu ngày', `$${fmtNum(bot.dayStartBalance || bot.balance)}`, 'muted'],
        ['Lãi thực', `$${fmtSigned(bot.realProfit)}`, colorClassByValue(bot.realProfit)],
        ['% tháng', fmtSigned(agg.pct, 2, true), colorClassByValue(agg.pct)],
      ];
      els.profitOverview.innerHTML = cards.map(([label, value, cls]) => `<div class="stat-card"><div class="label">${label}</div><div class="value ${cls}">${value}</div></div>`).join('');
      els.profitMonthSummary.innerHTML = `
        <div class="small-card"><div class="label">Lãi tháng</div><div class="value ${colorClassByValue(agg.profit)}">$${fmtSigned(agg.profit)}</div></div>
        <div class="small-card"><div class="label">Orders tháng</div><div class="value">${fmtNum(agg.orders,0)}</div></div>
      `;
      renderCalendar(bot);
    }

    function renderCalendar(bot) {
      const first = new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth(), 1);
      const startDay = first.getDay();
      const last = new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth() + 1, 0);
      const totalDays = last.getDate();
      const nowKey = ymd(new Date());
      const daysMap = mergedMonthDays(bot);
      const cells = [];
      for (let i = 0; i < startDay; i++) cells.push('<div class="day emptyday"></div>');
      for (let d = 1; d <= totalDays; d++) {
        const cur = new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth(), d);
        const key = ymd(cur);
        const item = daysMap[key];
        if (!item) {
          cells.push(`<div class="day ${key === nowKey ? 'today' : ''}"><div class="top"><span class="n">${d}</span></div><div class="p muted">-</div><div class="pct"></div></div>`);
          continue;
        }
        const norm = normalizeDayData(bot.botKey, key, item);
        const profit = norm.profit;
        const pct = norm.pct;
        cells.push(`
          <div class="day clickable-day ${key === nowKey ? 'today' : ''}" data-date="${key}">
            <div class="top"><span class="n">${d}</span></div>
            <div class="p ${colorClassByValue(profit)}">${profit >= 0 ? '+' : ''}${fmtNum(profit, 0)}</div>
            <div class="pct ${colorClassByValue(pct)}">${pct >= 0 ? '+' : ''}${fmtNum(pct, 1)}%</div>
          </div>
        `);
      }
      els.calendarBody.innerHTML = cells.join('');
      Array.from(els.calendarBody.querySelectorAll('[data-date]')).forEach(dayEl => {
        dayEl.addEventListener('click', () => openDayModal(dayEl.dataset.date, daysMap[dayEl.dataset.date]));
      });
    }

    function renderDetail() {
      const bot = selectedBot();
      if (!bot) {
        els.detailEmpty.classList.remove('hide');
        els.detailContent.classList.add('hide');
        return;
      }
      els.detailEmpty.classList.add('hide');
      els.detailContent.classList.remove('hide');
      const c = connectionState(bot);
      const dot = c === 'online' ? 'live' : c;
      els.detailBotTitle.textContent = bot.alias || bot.bot || '-';
      els.detailBotMeta.textContent = `ID ${safe(bot.id)} · ${safe(bot.symbol)} · ${safe(bot.name)} · ${bot.pinned ? 'PINNED' : 'UNPINNED'}`;
      els.detailStateDot.className = `dot ${dot}`;
      els.detailStateText.textContent = connectionText(bot);
      const kpis = [
        ['Balance', `$${fmtNum(bot.balance)}`, 'muted'],
        ['Equity', `$${fmtNum(bot.equity)}`, 'muted'],
        ['Lãi thực', `$${fmtSigned(bot.realProfit)}`, colorClassByValue(bot.realProfit)],
        ['% lãi thực', fmtSigned(bot.realPct,2,true), colorClassByValue(bot.realPct)],
        ['Tổng ngày', `$${fmtSigned(bot.dayTotal)}`, colorClassByValue(bot.dayTotal)],
        ['% ngày', fmtSigned(bot.dayPct,2,true), colorClassByValue(bot.dayPct)],
      ];
      els.detailKpis.innerHTML = kpis.map(([label,value,cls]) => `<div class="metric"><div class="label">${label}</div><div class="value ${cls}">${value}</div></div>`).join('');
      const mini = [
        ['DD', `${fmtNum(bot.dd)}%`],
        ['Max DD', `${fmtNum(bot.dayMaxDD)}%`],
        ['Worst EDD', fmtNum(bot.dayWorstEDD,2)],
        ['Open orders', fmtNum(openOrdersValue(bot), 0)],
        ['BUY mở', fmtNum(bot.buyOpen,0)],
        ['SELL mở', fmtNum(bot.sellOpen,0)],
        ['Lots mở', fmtNum(lotsOpenValue(bot),2)],
        ['Orders ngày', fmtNum(bot.dayOrders,0)],
      ];
      els.detailMini.innerHTML = mini.map(([label, value]) => `<div class="small-card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('');
      els.detailBanner.innerHTML = `
        <div class="title">
          <span>Trạng thái kết nối & bot</span>
          ${onlineChip(bot)}
        </div>
        <div class="desc">${esc(stateLabel(bot))} · ${esc(reasonLabel(bot))} · Action ${esc(safe(bot.lastAction || bot.action,'NO ACTION'))} · Remote ${esc(safe(bot.remoteStatus,'-'))}</div>
        <div class="desc">Trend ${esc(safe(bot.trend,'NO TREND'))} · Score ${fmtNum(bot.score || bot.buyScore || 0,0)} · Spread ${fmtNum(bot.spread,1)} · Time ${esc(timeModeLabel(bot))} · Ping ${esc(pingText(bot))} · Last seen ${esc(lastSeenText(bot))}</div>
      `;
      const info = fullInfoPairs(bot);
      const infoHtml = info.map(([label, value]) => `<div class="small-card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('');
      els.detailFullGrid.innerHTML = infoHtml;
      els.detailInfoGrid.innerHTML = infoHtml;
    }

    function renderAdminState() {
      els.controlLocked.classList.toggle('hide', !!state.adminUnlocked);
      els.controlActions.classList.toggle('hide', !state.adminUnlocked);
      els.adminStatePill.textContent = state.adminUnlocked ? 'Admin đã mở khóa' : 'Chỉ admin';
      els.btnAdminToggle.textContent = state.adminUnlocked ? 'ADMIN ON' : 'ADMIN';
      if (!state.adminUnlocked) els.adminContent.classList.add('hide');
    }
    function fillAdminForm() {
      const bot = selectedBot();
      const manual = bot ? (state.manualMap[bot.botKey] || {}) : {};
      const lo = manual.liveOverrides || {};
      els.editAlias.value = manual.alias || '';
      els.editNote.value = manual.note || '';
      els.editStartBalance.value = lo.dayStartBalance ?? '';
      els.editRealProfit.value = lo.realProfit ?? '';
      els.editRealPct.value = lo.realPct ?? '';
      els.editDayTotal.value = lo.dayTotal ?? '';
      els.editAction.value = lo.action || '';
      if (els.btnTogglePin) els.btnTogglePin.textContent = manual.pinned ? 'Bỏ ghim bot' : 'Ghim bot';
    }

    async function saveOverride() {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      if (!state.adminUnlocked) return showToast('Chưa mở khóa admin.', 'warn');
      const liveOverrides = {};
      if (els.editStartBalance.value !== '') liveOverrides.dayStartBalance = Number(els.editStartBalance.value);
      if (els.editRealProfit.value !== '') liveOverrides.realProfit = Number(els.editRealProfit.value);
      if (els.editRealPct.value !== '') liveOverrides.realPct = Number(els.editRealPct.value);
      if (els.editDayTotal.value !== '') liveOverrides.dayTotal = Number(els.editDayTotal.value);
      if (els.editAction.value.trim()) liveOverrides.action = els.editAction.value.trim();
      await update(ref(db, `manual/${bot.botKey}`), {
        alias: els.editAlias.value.trim(),
        note: els.editNote.value.trim(),
        liveOverrides,
        updatedAt: new Date().toISOString(),
      });
      showToast('Đã lưu override.', 'success');
    }
    async function clearOverride() {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      if (!state.adminUnlocked) return showToast('Chưa mở khóa admin.', 'warn');
      await remove(ref(db, `manual/${bot.botKey}`));
      showToast('Đã xóa override.', 'success');
    }
    async function togglePin() {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      if (!state.adminUnlocked) return showToast('Chưa mở khóa admin.', 'warn');
      const manualRef = ref(db, `manual/${bot.botKey}`);
      const manual = state.manualMap[bot.botKey] || {};
      const nextPinned = !manual.pinned;
      await update(manualRef, {
        pinned: nextPinned,
        pinOrder: nextPinned ? (manual.pinOrder || Date.now()) : 0,
        updatedAt: new Date().toISOString(),
      });
      showToast(nextPinned ? 'Đã ghim bot lên đầu danh sách.' : 'Đã bỏ ghim bot.', 'success');
    }
    async function installPwa() {
      if (window.matchMedia('(display-mode: standalone)').matches) return showToast('App đã chạy ở chế độ cài đặt rồi.', 'info');
      if (state.installPrompt) {
        state.installPrompt.prompt();
        const choice = await state.installPrompt.userChoice.catch(() => null);
        state.installPrompt = null;
        showToast(choice?.outcome === 'accepted' ? 'Đã gửi yêu cầu cài app.' : 'Bạn đã đóng hộp thoại cài app.', choice?.outcome === 'accepted' ? 'success' : 'info');
        return;
      }
      showToast('Trình duyệt chưa bật popup cài app. Vẫn có thể dùng Add to Home Screen trong menu trình duyệt.', 'warn');
    }
    async function hideBot() {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      if (!state.adminUnlocked) return showToast('Chưa mở khóa admin.', 'warn');
      await set(ref(db, `ignoredBots/${bot.botKey}`), true);
      showToast('Đã ẩn bot.', 'success');
    }
    async function deleteBot() {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      if (!state.adminUnlocked || !state.panelToken) return showToast('Chưa mở khóa admin.', 'warn');
      const ok = await showConfirm({
        title: 'Xóa bot',
        text: `Xóa bot ${bot.alias || bot.bot} khỏi danh sách công khai? Bot sẽ bị ẩn và không tự hiện lại nếu EA gửi tiếp với cùng botKey.`,
        confirmText: 'Xóa bot',
        cancelText: 'Hủy',
        danger: true
      });
      if (!ok) return;
      try {
        const res = await fetch('/panel/delete-bot', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            token: state.panelToken,
            botKey: bot.botKey,
            note: `Deleted by admin from web UI at ${new Date().toISOString()}`,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
        state.selectedBotKey = '';
        persistSelectedBot();
        showToast('Đã xóa bot khỏi danh sách hiển thị.', 'success');
      } catch (err) {
        showToast(`Xóa bot thất bại: ${err.message || err}`, 'error');
      }
    }
    async function exportBotJson() {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      const snap = await get(ref(db, `bots/${bot.botKey}`));
      const blob = new Blob([JSON.stringify(snap.val() || {}, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${bot.botKey}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(`Đã xuất JSON cho ${bot.alias || bot.bot}.`, 'success');
    }
    async function queueCommand(cmd) {
      const bot = selectedBot();
      if (!bot) return showToast('Chưa chọn bot.', 'warn');
      if (!state.adminUnlocked || !state.panelToken) return showToast('Chỉ admin đã mở khóa mới điều khiển được bot.', 'warn');
      const res = await fetch('/panel/cmd', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: state.panelToken, botKey: bot.botKey, cmd }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) return showToast(`Gửi lệnh thất bại: ${json.error || res.status}`, 'error');
      showToast(`Đã gửi lệnh ${cmd} cho bot ${bot.alias || bot.bot}.`, 'success');
    }

    function switchTab(tab) {
      state.activeTab = tab;
      localStorage.setItem('jcfx_active_tab', tab);
      els.pages.forEach(page => page.classList.toggle('active', page.id === `page-${tab}`));
      els.navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    }

    function renderAll() {
      ensureMonthJson(state.selectedMonth);
      renderHeader();
      renderTopStats();
      renderTopLeaders();
      renderSelectedHero();
      renderBotLists();
      renderProfitOverview();
      renderDetail();
      fillAdminForm();
      renderAdminState();
    }

    function rebuildBots() {
      ensureFixedOrder(Object.keys(state.botsMap || {}));
      state.bots = Object.entries(state.botsMap).map(([botKey, payload]) => mergedBot(botKey, payload));
      freezeSeenDaySnapshots();
      refreshSelectionIfMissing();
      renderAll();
    }

    function bindEvents() {
      els.searchInput.addEventListener('input', renderAll);
      els.sortSelect.addEventListener('change', renderAll);
      els.filterSelect.addEventListener('change', renderAll);
      els.btnRefresh.addEventListener('click', () => { renderAll(); showToast('Đã làm mới giao diện.', 'info'); });
      els.modalClose.addEventListener('click', closeModal);
      els.appModal.addEventListener('click', (e) => { if (e.target === els.appModal) closeModal(); });
      els.btnToday.addEventListener('click', () => { state.selectedMonth = new Date(); renderTopStats(); renderProfitOverview(); });
      els.btnPrevMonth.addEventListener('click', () => { state.selectedMonth = new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth() - 1, 1); renderTopStats(); renderProfitOverview(); });
      els.btnNextMonth.addEventListener('click', () => { state.selectedMonth = new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth() + 1, 1); renderTopStats(); renderProfitOverview(); });
      els.btnAdminToggle.addEventListener('click', () => switchTab('settings'));
      els.btnUnlock.addEventListener('click', async () => {
        const pin = els.adminPin.value.trim();
        if (!pin) return showToast('Nhập PIN admin trước.', 'warn');
        try {
          const res = await fetch(`/panel/summary?token=${encodeURIComponent(pin)}`);
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.ok) throw new Error(json.error || 'UNAUTHORIZED');
          state.adminUnlocked = true;
          state.panelToken = pin;
          els.adminContent.classList.remove('hide');
          renderAdminState();
          showToast('Admin đã mở khóa.', 'success');
        } catch (err) {
          state.adminUnlocked = false;
          state.panelToken = '';
          renderAdminState();
          showToast('PIN admin sai hoặc token chưa hợp lệ.', 'error');
        }
      });
      els.btnLock.addEventListener('click', () => {
        state.adminUnlocked = false;
        state.panelToken = '';
        els.adminContent.classList.add('hide');
        els.adminPin.value = '';
        renderAdminState();
        showToast('Đã khóa lại quyền admin.', 'info');
      });
      els.btnSaveOverride.addEventListener('click', saveOverride);
      els.btnClearOverride.addEventListener('click', clearOverride);
      els.btnTogglePin?.addEventListener('click', togglePin);
      els.btnInstallPwa?.addEventListener('click', installPwa);
      els.btnHideBot.addEventListener('click', hideBot);
      els.btnDeleteBot.addEventListener('click', deleteBot);
      els.btnExportJson.addEventListener('click', exportBotJson);
      Array.from(document.querySelectorAll('[data-cmd]')).forEach(btn => btn.addEventListener('click', () => queueCommand(btn.dataset.cmd)));
      els.navBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
      els.rankTabs.forEach(btn => btn.addEventListener('click', () => { state.rankMetric = btn.dataset.rank; localStorage.setItem('jcfx_rank_metric', state.rankMetric); renderTopLeaders(); }));
      window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installPrompt = e; showToast('Đã sẵn sàng cài app PWA.', 'success'); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }

    function watchFirebase() {
      onValue(ref(db, 'manual'), snap => { state.manualMap = snap.val() || {}; rebuildBots(); });
      onValue(ref(db, 'ignoredBots'), snap => { state.ignoredMap = snap.val() || {}; rebuildBots(); });
      onValue(ref(db, 'bots'), snap => { 
        state.botsMap = snap.val() || {}; 
        state.lastDataAt = Date.now(); 
        state.firstSyncDone = true;
        els.appLoader?.classList.add('hidden');
        rebuildBots(); 
      }, err => {
        els.globalSubtitle.textContent = err.message;
        els.appLoader?.classList.add('hidden');
      });
    }

    loadSelectedBot();
    bindEvents();
    switchTab(state.activeTab);
    renderAdminState();
    if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {})); }
    watchFirebase();
  