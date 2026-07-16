/** 预览专用：总览大全（弹框总览 / 提示总览）；隐藏手机区，右侧面板铺满。 */
(function () {
  const DIALOG_ENTRIES = [
    {
      group: '个人中心',
      items: [
        {
          title: '已驳回 · 查看原因弹窗',
          src: '../docs/miniprogram/pages/images/profile/state-rejected-dialog.png',
        },
        {
          title: '英雄身份禁用',
          src: '../assets/dialog-gallery/profile-disable-dialog.png',
        },
        {
          title: '发布招募/课程 · 底部选项',
          src: '../assets/dialog-gallery/profile-publish-sheet.png',
        },
      ],
    },
    {
      group: '英雄详情',
      items: [
        {
          title: '申请被驳回 · 温馨提示',
          src: '../assets/dialog-gallery/hero-detail-reject-dialog.png',
        },
        {
          title: '分享面板',
          src: '../assets/dialog-gallery/hero-share-sheet.png',
        },
        {
          title: '海报结果页',
          src: '../assets/dialog-gallery/hero-poster-modal.png',
        },
      ],
    },
    {
      group: '申请成为英雄',
      items: [
        {
          title: '选择证件类型',
          src: '../assets/dialog-gallery/apply-id-doc-sheet.png',
        },
        {
          title: '选择教练资质',
          src: '../assets/dialog-gallery/apply-cert-sheet.png',
        },
        {
          title: '选择项目类型',
          src: '../assets/dialog-gallery/apply-project-sheet.png',
        },
        {
          title: '个人展示 · 上传类型',
          src: '../assets/dialog-gallery/apply-showcase-media-sheet.png',
        },
        {
          title: '命名证书弹窗',
          src: '../assets/dialog-gallery/apply-cert-name-dialog.png',
        },
        {
          title: '自定义资质等级弹窗',
          src: '../assets/dialog-gallery/apply-custom-cert-dialog.png',
        },
      ],
    },
    {
      group: '发布招募',
      items: [
        {
          title: '确认发起赛事招募',
          src: '../assets/dialog-gallery/recruit-initiate-dialog.png',
        },
      ],
    },
    {
      group: '通用',
      items: [
        {
          title: '图片预览',
          src: '../assets/dialog-gallery/image-viewer.png',
        },
      ],
    },
  ];

  const TOAST_ENTRIES = [
    {
      group: '个人中心',
      items: [
        { title: '未登录拦截', message: '请先授权登录', type: 'none' },
        { title: '非英雄拦截', message: '请先成为认证英雄', type: 'none' },
        { title: '已是英雄', message: '您已是认证英雄', type: 'none' },
        { title: '功能占位', message: '功能开发中', type: 'none' },
        { title: '即将开放', message: '即将开放', type: 'none' },
      ],
    },
    {
      group: '英雄详情',
      items: [
        { title: '已认证', message: '您已是认证英雄', type: 'none' },
        { title: '审核中', message: '您的申请在审核中，无需重复提交', type: 'none' },
      ],
    },
    {
      group: '申请成为英雄',
      items: [
        { title: '校验 · 昵称', message: '请填写昵称', type: 'error' },
        { title: '校验 · 手机号', message: '请填写正确的手机号', type: 'error' },
        { title: '校验 · 验证码', message: '请填写正确的验证码', type: 'error' },
        { title: '校验 · 姓名', message: '请填写姓名', type: 'error' },
        { title: '校验 · 证件类型', message: '请选择证件类型', type: 'error' },
        { title: '校验 · 证件号码', message: '请填写证件号码', type: 'error' },
        { title: '实名校验失败', message: '实名校验未通过，请核对姓名与身份证号', type: 'error' },
        { title: '校验 · 项目类型', message: '请选择项目类型', type: 'error' },
        { title: '项目类型上限', message: '项目类型最多选择3个', type: 'error' },
        { title: '校验 · 资质等级', message: '请选择教练资质等级', type: 'error' },
        { title: '校验 · 经验年限', message: '请选择经验年限', type: 'error' },
        { title: '校验 · 证书', message: '请上传资证证书', type: 'error' },
        { title: '校验 · 证书名称', message: '请填写证书名称', type: 'error' },
        { title: '校验 · 详细介绍', message: '请填写详细介绍', type: 'error' },
        { title: '校验 · 协议', message: '请阅读并同意相关协议', type: 'error' },
        { title: '短信已发送', message: '短信验证码已发送', type: 'success' },
        { title: '提交成功', message: '已提交审核', type: 'success' },
        { title: '撤回成功', message: '已撤回审核', type: 'success' },
        { title: '重复申请 · 已认证', message: '您已是认证英雄，无需重复申请', type: 'error' },
        { title: '重复申请 · 审核中', message: '申请审核中，请勿重复提交', type: 'error' },
        { title: '提交失败 · 服务未启动', message: '提交失败，请确认本地数据库服务已启动（:8787）', type: 'error' },
      ],
    },
    {
      group: '招募 / 课程详情',
      items: [
        { title: '功能占位', message: '功能开发中', type: 'info' },
        { title: '地图占位', message: '地图功能开发中', type: 'info' },
        { title: '分享占位', message: '分享功能开发中', type: 'info' },
        { title: '即将开放', message: '即将开放', type: 'info' },
        { title: '已报名', message: '您已报名', type: 'info' },
        { title: '报名成功', message: '报名成功', type: 'success' },
        { title: '报名失败', message: '报名失败', type: 'error' },
        { title: '手机号无效', message: '请填写有效手机号', type: 'error' },
      ],
    },
    {
      group: '其他',
      items: [
        { title: '报名列表 · 已确认', message: '已确认', type: 'success' },
        { title: '页面加载失败', message: '页面加载失败', type: 'error' },
      ],
    },
  ];

  const META = {
    dialogs: {
      title: '弹框总览',
      meta: '全局弹框截图（仅预览）',
    },
    toasts: {
      title: '提示总览',
      meta: '全局 Toast 提示文案（仅预览）',
    },
  };

  let panelEl = null;
  let currentKind = '';

  function isDesktopPreview() {
    return window.matchMedia('(min-width: 960px)').matches;
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toastTypeLabel(type) {
    if (type === 'success') return '成功';
    if (type === 'error') return '错误';
    if (type === 'info') return '信息';
    return '默认';
  }

  function toastBg(type) {
    if (type === 'error') return 'rgba(180,40,40,0.92)';
    if (type === 'success') return 'rgba(27,87,156,0.92)';
    return 'rgba(0,0,0,0.82)';
  }

  function ensurePanel() {
    if (panelEl?.isConnected) return panelEl;
    const device = document.querySelector('.device');
    if (!device) return null;
    panelEl = document.createElement('aside');
    panelEl.className = 'preview-dialog-gallery';
    panelEl.hidden = true;
    panelEl.innerHTML =
      `<div class="preview-dialog-gallery__head">` +
      `<div class="preview-dialog-gallery__title"></div>` +
      `<div class="preview-dialog-gallery__meta"></div>` +
      `</div>` +
      `<div class="preview-dialog-gallery__body"></div>`;
    device.appendChild(panelEl);
    return panelEl;
  }

  function renderDialogs(body) {
    body.innerHTML = DIALOG_ENTRIES.map((group) => {
      const cards = group.items
        .map(
          (item) =>
            `<figure class="preview-dialog-gallery__card">` +
            `<figcaption class="preview-dialog-gallery__caption">${escapeHtml(item.title)}</figcaption>` +
            `<img class="preview-dialog-gallery__shot" src="${escapeHtml(item.src)}" alt="${escapeHtml(
              item.title,
            )}" loading="lazy">` +
            `</figure>`,
        )
        .join('');
      return (
        `<section class="preview-dialog-gallery__group">` +
        `<h2 class="preview-dialog-gallery__group-title">${escapeHtml(group.group)}</h2>` +
        `<div class="preview-dialog-gallery__grid">${cards}</div>` +
        `</section>`
      );
    }).join('');
  }

  function renderToasts(body) {
    body.innerHTML = TOAST_ENTRIES.map((group) => {
      const cards = group.items
        .map((item) => {
          const type = item.type || 'none';
          return (
            `<figure class="preview-dialog-gallery__card preview-dialog-gallery__card--toast">` +
            `<figcaption class="preview-dialog-gallery__caption">` +
            `<span>${escapeHtml(item.title)}</span>` +
            `<span class="preview-dialog-gallery__toast-badge preview-dialog-gallery__toast-badge--${escapeHtml(
              type,
            )}">${escapeHtml(toastTypeLabel(type))}</span>` +
            `</figcaption>` +
            `<div class="preview-dialog-gallery__toast-stage">` +
            `<div class="preview-dialog-gallery__toast-bubble" style="background:${toastBg(type)}">${escapeHtml(
              item.message,
            )}</div>` +
            `</div>` +
            `</figure>`
          );
        })
        .join('');
      return (
        `<section class="preview-dialog-gallery__group">` +
        `<h2 class="preview-dialog-gallery__group-title">${escapeHtml(group.group)}</h2>` +
        `<div class="preview-dialog-gallery__grid preview-dialog-gallery__grid--toast">${cards}</div>` +
        `</section>`
      );
    }).join('');
  }

  function renderBody(kind) {
    const panel = ensurePanel();
    if (!panel) return;
    const meta = META[kind] || META.dialogs;
    panel.querySelector('.preview-dialog-gallery__title').textContent = meta.title;
    panel.querySelector('.preview-dialog-gallery__meta').textContent = meta.meta;
    const body = panel.querySelector('.preview-dialog-gallery__body');
    if (!body) return;
    if (kind === 'toasts') renderToasts(body);
    else renderDialogs(body);
  }

  function setOpen(kind) {
    const nextKind = kind || '';
    const panel = ensurePanel();
    if (!panel) return;
    if (!nextKind) {
      currentKind = '';
      panel.hidden = true;
      document.body.classList.remove('preview-dialog-gallery-open');
      return;
    }
    currentKind = nextKind;
    renderBody(currentKind);
    panel.hidden = false;
    document.body.classList.add('preview-dialog-gallery-open', 'has-preview-doc');
    document.querySelector('.device')?.classList.add('device--with-doc');
  }

  function init() {
    if (!isDesktopPreview()) return;
    ensurePanel();
    window.addEventListener('preview:navigate', () => setOpen(''));
  }

  window.PreviewOverviewGallery = {
    open: (kind) => setOpen(kind === 'toasts' ? 'toasts' : 'dialogs'),
    close: () => setOpen(''),
    current: () => currentKind,
  };
  // 兼容旧调用
  window.PreviewDialogGallery = {
    open: () => setOpen('dialogs'),
    close: () => setOpen(''),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
