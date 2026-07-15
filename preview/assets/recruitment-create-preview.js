/** 发布赛事招募 · 列表预览（大图卡 + 状态筛选） */
(function () {
  const root = document.getElementById('recruitment-create-root');
  if (!root) return;

  const imgBase = '../assets/images/';

  const FALLBACK_LISTS = {
    active: [
      {
        recruit_id: 'r1',
        type: 'event',
        typeLabel: '赛事',
        title: '企业家杯月赛',
        time: '06/08 (周六) 09:00-16:00',
        location: '滴水湖二号码头',
        fee: 500,
        feeDisplay: '500',
        cover: 'event.jpg',
      },
      {
        recruit_id: 'r2',
        type: 'activity',
        typeLabel: '活动',
        title: '亲子帆船体验日',
        time: '06/08 (周六) 09:00-16:00',
        location: '滴水湖二号码头',
        fee: 1280,
        feeDisplay: '1,280',
        cover: 'banner.jpg',
      },
      {
        recruit_id: 'r4',
        type: 'activity',
        typeLabel: '活动',
        title: '浆板初体验',
        time: '06/08 (周六) 09:00-16:00',
        location: '滴水湖二号码头',
        fee: 1280,
        feeDisplay: '1,280',
        cover: 'recruit-cover.jpg',
      },
    ],
    ended: [
      {
        recruit_id: 'r9',
        type: 'event',
        typeLabel: '赛事',
        title: '冬季帆船训练营',
        time: '12/01 (周一) 09:00-17:00',
        location: '滴水湖',
        fee: 880,
        feeDisplay: '880',
        cover: 'recruit-cover.jpg',
        is_mine: true,
      },
      {
        recruit_id: 'r11',
        type: 'event',
        typeLabel: '赛事',
        title: '春季企业团建帆船赛',
        time: '04/18 (周六) 08:30-16:30',
        location: '滴水湖二号码头',
        fee: 680,
        feeDisplay: '680',
        cover: 'event.jpg',
        is_mine: true,
      },
      {
        recruit_id: 'r12',
        type: 'activity',
        typeLabel: '活动',
        title: '五一桨板体验日',
        time: '05/01 (周五) 10:00-15:00',
        location: '太湖桨板营地',
        fee: 198,
        feeDisplay: '198',
        cover: 'banner.jpg',
        is_mine: false,
      },
    ],
  };

  let lists = { active: [], ended: [] };
  let activeTab = 'active';
  const TAB_KEY = 'recruitment-create-tab';
  const RESTORE_KEY = 'recruitment-create-restore';

  /** 仅从详情返回时恢复 Tab；外部进入一律「招募进行中」 */
  function readInitialTab() {
    try {
      const shouldRestore = sessionStorage.getItem(RESTORE_KEY) === '1';
      sessionStorage.removeItem(RESTORE_KEY);
      if (shouldRestore) {
        const s = sessionStorage.getItem(TAB_KEY);
        if (s === 'active' || s === 'ended') return s;
      }
    } catch (_) {
      /* ignore */
    }
    return 'active';
  }

  function persistTab(tab) {
    activeTab = tab === 'ended' ? 'ended' : 'active';
    try {
      sessionStorage.setItem(TAB_KEY, activeTab);
    } catch (_) {
      /* ignore */
    }
  }

  function markLeaveForRestore() {
    try {
      sessionStorage.setItem(TAB_KEY, activeTab);
      sessionStorage.setItem(RESTORE_KEY, '1');
    } catch (_) {
      /* ignore */
    }
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatFee(item) {
    if (item.feeDisplay != null && item.feeDisplay !== '') return `¥${item.feeDisplay}/人`;
    const n = Number(item.fee);
    if (Number.isFinite(n)) return `¥${n.toLocaleString('en-US')}/人`;
    return `¥${item.fee}/人`;
  }

  function coverOf(item) {
    if (item.cover) return item.cover;
    if (item.cover_image) return item.cover_image;
    if (item.cover_images && item.cover_images.length) return item.cover_images[0];
    return 'event.jpg';
  }

  function tabDisplay(label, count) {
    return count > 0 ? `${label}(${count})` : label;
  }

  function cardHtml(item, tab) {
    const isActivity = item.type === 'activity';
    const typeLabel = item.typeLabel || (isActivity ? '活动' : '赛事');
    const tagClass = isActivity ? 'tag--activity' : 'tag--event';
    const dotClass = isActivity ? ' event-card__dot--activity' : '';
    const timeText = item.time || item.timeDisplay || '';
    const cover = coverOf(item);
    const title = escapeHtml(item.title || '');
    const id = escapeHtml(item.recruit_id);

    let btnHtml;
    if (tab === 'ended') {
      btnHtml = `<span class="event-card__btn event-card__btn--disabled" aria-disabled="true">活动已结束</span>`;
    } else {
      btnHtml = `<button type="button" class="event-card__btn" data-initiate-id="${id}">发起招募</button>`;
    }

    return (
      `<a class="event-card event-card--hero nav-forward" href="recruitment-detail.html?id=${id}">` +
      `<div class="event-card__bg"><img src="${imgBase}${escapeHtml(cover)}" alt="${title}"></div>` +
      `<div class="event-card__scrim"></div>` +
      `<div class="event-card__top">` +
      `<span class="event-card__time"><i class="event-card__dot${dotClass}" aria-hidden="true"></i>${escapeHtml(timeText)}</span>` +
      `</div>` +
      `<div class="event-card__bottom">` +
      `<div class="event-card__info">` +
      `<span class="tag ${tagClass}">${escapeHtml(typeLabel)}</span>` +
      `<div class="event-card__title">${title}</div>` +
      `<div class="event-card__meta">${escapeHtml(item.location || '')}</div>` +
      `</div>` +
      `<div class="event-card__footer">` +
      `<span class="event-card__price">${formatFee(item)}</span>` +
      btnHtml +
      `</div></div>` +
      `</a>`
    );
  }

  function modalHtml() {
    return (
      `<div class="profile-dialog__mask" data-initiate-cancel></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true">` +
      `<div class="profile-dialog__title">确认发起赛事招募</div>` +
      `<div class="profile-dialog__body">确认发起赛事招募后，在我的页>服务中心>我的招募中查看。</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn" data-initiate-cancel>取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-initiate-confirm>确认开始招募</button>` +
      `</div></div>`
    );
  }

  function closeInitiateConfirm() {
    document.getElementById('initiate-confirm-dialog')?.remove();
  }

  function openInitiateConfirm() {
    closeInitiateConfirm();
    const dialog = document.createElement('div');
    dialog.id = 'initiate-confirm-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML = modalHtml();
    (root.closest('.mobile-shell') || document.body).appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-initiate-confirm]')) {
        closeInitiateConfirm();
        window.location.href = 'my-recruitments.html';
        return;
      }
      if (e.target.closest('[data-initiate-cancel]')) closeInitiateConfirm();
    });
  }

  function normalizeRow(row) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    let time = row.time || row.timeDisplay || '';
    if (!time && row.start_at) {
      const start = new Date(row.start_at);
      const end = row.end_at ? new Date(row.end_at) : null;
      if (!Number.isNaN(start.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        const base = `${pad(start.getMonth() + 1)}/${pad(start.getDate())} (${weekdays[start.getDay()]}) ${pad(start.getHours())}:${pad(start.getMinutes())}`;
        if (end && !Number.isNaN(end.getTime())) {
          time = `${base}-${pad(end.getHours())}:${pad(end.getMinutes())}`;
        } else {
          time = base;
        }
      }
    } else if (time && time.includes(' - ')) {
      time = time.replace(' - ', '-').replace(/\//g, (m, offset, str) => {
        /* keep MM/DD style if already */
        return m;
      });
    }
    return {
      ...row,
      time,
      type: row.type || 'event',
      typeLabel: row.typeLabel || (row.type === 'activity' ? '活动' : '赛事'),
      is_mine: row.is_mine !== false,
      feeDisplay:
        row.feeDisplay ||
        (row.fee != null ? String(row.fee).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''),
    };
  }

  async function loadLists() {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const raw = await window.HeroPlazaDB.getMyRecruitmentLists();
        if (raw && (raw.active?.length || raw.ended?.length)) {
          return {
            active: (raw.active || []).map(normalizeRow),
            ended: (raw.ended || []).map(normalizeRow),
          };
        }
      } catch (_) {
        /* fallback */
      }
    }
    if (window.RECRUITMENTS_LISTS) {
      return {
        active: (window.RECRUITMENTS_LISTS.active || []).map(normalizeRow),
        ended: (window.RECRUITMENTS_LISTS.ended || []).map(normalizeRow),
      };
    }
    return {
      active: FALLBACK_LISTS.active.map(normalizeRow),
      ended: FALLBACK_LISTS.ended.map(normalizeRow),
    };
  }

  function render() {
    const current = lists[activeTab] || [];
    const tabs = [
      { key: 'active', label: '招募进行中', count: lists.active.length },
      { key: 'ended', label: '招募已结束', count: lists.ended.length },
    ];
    const listHtml = current.length
      ? current.map((item) => cardHtml(item, activeTab)).join('')
      : `<div class="recruit-publish-list__empty">暂无${activeTab === 'ended' ? '已结束的' : ''}赛事招募</div>`;

    root.innerHTML =
      `<div class="recruit-publish">` +
      `<div class="my-recruit__tabs">${tabs
        .map(
          (t) =>
            `<button type="button" class="my-recruit__tab${activeTab === t.key ? ' my-recruit__tab--active' : ''}" data-tab="${t.key}">${tabDisplay(t.label, t.count)}</button>`,
        )
        .join('')}</div>` +
      `<div class="recruit-publish-list">${listHtml}</div>` +
      `</div>`;

    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        persistTab(btn.dataset.tab);
        render();
      });
    });

    root.querySelectorAll('a.event-card').forEach((el) => {
      el.addEventListener('click', () => {
        markLeaveForRestore();
      });
    });

    root.querySelectorAll('[data-initiate-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openInitiateConfirm();
      });
    });
  }

  loadLists().then((data) => {
    lists = data;
    persistTab(readInitialTab());
    render();
  });
})();
