/** 消息详情 · 系统消息列表（预览） */
(function () {
  const REJECT_MOCK = '我是后台驳回时填写的内容';
  const DISABLE_FALLBACK = '您的英雄身份不可用，具体原因可联系客服处理';

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function wantsEmpty() {
    try {
      return new URLSearchParams(window.location.search).get('empty') === '1';
    } catch (_) {
      return false;
    }
  }

  async function loadApplyReasons() {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        return {
          rejectReason: String(res?.reject_reason || res?.application?.reject_reason || '').trim(),
          disableReason: String(res?.disable_reason || '').trim(),
        };
      } catch (_) {
        /* fallback */
      }
    }
    return { rejectReason: '', disableReason: '' };
  }

  /** §3.1 表前 6 行（新增） */
  const SHELF_MOCK_LIST = [
    {
      id: 'sys-event-on',
      title: '您的赛事已上架',
      time: '2026-07-17 14:00',
      content: '您的赛事《我是赛事名称》已开始招募，可前往我的>服务中心中（我的招募）中查看。',
    },
    {
      id: 'sys-event-off',
      title: '您的赛事已下架',
      time: '2026-07-17 13:50',
      content: '您的赛事《我是赛事名称》已下架，无法继续招募。',
    },
    {
      id: 'sys-activity-on',
      title: '您的活动已上架',
      time: '2026-07-17 13:40',
      content: '您的活动《我是活动名称》已开始报名，可前往我的>服务中心中（我的招募）中查看。',
    },
    {
      id: 'sys-activity-off',
      title: '您的活动已下架',
      time: '2026-07-17 13:30',
      content: '您的活动《我是活动名称》已下架，无法继续报名。',
    },
    {
      id: 'sys-course-on',
      title: '您的课程已上架',
      time: '2026-07-17 13:20',
      content: '您有一门课程《我是课程名称》已上架，可前往我的>服务中心中（我的课程）中查看。',
    },
    {
      id: 'sys-course-off',
      title: '您的课程已下架',
      time: '2026-07-17 13:10',
      content: '您有一门课程《我是课程名称》已下架，无法继续报名。',
    },
  ];

  function emptyHtml() {
    return (
      `<div class="msg-detail">` +
      `<div class="msg-detail__empty">` +
      `<div class="msg-detail__empty-icon"><img src="../assets/icons/empty.png" alt=""></div>` +
      `<div class="msg-detail__empty-title">暂无消息</div>` +
      `</div>` +
      `</div>`
    );
  }

  function card(item) {
    return (
      `<article class="msg-detail__item">` +
      `<div class="msg-detail__head">` +
      `<h3 class="msg-detail__title">${escapeHtml(item.title)}</h3>` +
      `<time class="msg-detail__time">${escapeHtml(item.time)}</time>` +
      `</div>` +
      `<p class="msg-detail__content">${escapeHtml(item.content)}</p>` +
      `</article>`
    );
  }

  async function render() {
    const root = document.getElementById('message-detail-root');
    if (!root) return;

    if (wantsEmpty()) {
      root.innerHTML = emptyHtml();
      return;
    }

    const { rejectReason, disableReason } = await loadApplyReasons();
    /** 原有 mock，保留不覆盖 */
    const legacyList = [
      {
        id: 'sys-0',
        title: '课程申请成功',
        time: '2026-07-17 11:00',
        content:
          '您有一门课程《我是课程名称》已上架，可前往我的>服务中心中（我的课程）中查看。',
      },
      {
        id: 'sys-1',
        title: '认证英雄成功',
        time: '2026-07-17 10:00',
        content:
          '恭喜您完成英雄认证，已成功加入英雄广场，即刻发布赛事招募与课程，开启您的英雄之旅吧',
      },
      {
        id: 'sys-2',
        title: '认证英雄驳回',
        time: '2026-07-15 18:30',
        content: rejectReason || REJECT_MOCK,
      },
      {
        id: 'sys-3',
        title: '英雄身份被禁用',
        time: '2026-07-14 16:00',
        content: disableReason || DISABLE_FALLBACK,
      },
    ];

    const list = SHELF_MOCK_LIST.concat(legacyList);
    root.innerHTML = `<div class="msg-detail">` + list.map(card).join('') + `</div>`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
