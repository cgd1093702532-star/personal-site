/** 招募表单 · 预览端共享渲染（发布/编辑） */
(function (global) {
  const imgBase = '../assets/images/';
  const audienceOptions = ['青少年', '成人', '亲子', '新手'];

  const defaultMock = {
    title: '周末帆船体验营',
    location: '三亚帆船港',
    start_date: '2026-07-08',
    start_time: '09:00',
    end_date: '2026-07-08',
    end_time: '17:00',
    headcount: '6',
    fee: '299',
    deadline: '2026-07-06',
    audience: ['青少年'],
    highlights: '专业教练全程指导\n配备全套装备\n含午餐和保险\n完成可获结业证书',
    desc: '周末帆船体验营面向零基础学员，从码头安全讲解到帆具组装、起航控帆，全程由专业教练陪同。活动含午餐与保险，适合希望体验帆船运动的青少年与成人。',
    phone: '13800138000',
    cover: `${imgBase}recruit-cover.jpg`,
  };

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseIso(iso) {
    if (!iso) return { date: '', time: '09:00' };
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: '', time: '09:00' };
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }

  function itemToMock(item) {
    if (!item) return { ...defaultMock };
    const start = parseIso(item.start_at);
    const end = parseIso(item.end_at);
    const coverSrc =
      item.cover_images && item.cover_images.length
        ? item.cover_images[0].startsWith('http') || item.cover_images[0].startsWith('../')
          ? item.cover_images[0]
          : `${imgBase}${item.cover_images[0]}`
        : defaultMock.cover;
    return {
      title: item.title || '',
      location: item.location || '',
      start_date: start.date,
      start_time: start.time,
      end_date: end.date || start.date,
      end_time: end.time,
      headcount: item.total != null ? String(item.total) : '',
      fee: item.fee != null ? String(item.fee) : '',
      deadline: item.deadline || defaultMock.deadline,
      audience: item.audience || [],
      highlights: item.highlights || defaultMock.highlights,
      desc: item.description || item.desc || '',
      phone: item.phone || defaultMock.phone,
      cover: coverSrc,
    };
  }

  function collectForm(root) {
    const val = (field) => {
      const el = root.querySelector(`[data-field="${field}"]`);
      return el ? el.value : '';
    };
    const audience = [];
    root.querySelectorAll('#rc-audience .create-tag--active').forEach((btn) => {
      if (btn.dataset.audience) audience.push(btn.dataset.audience);
    });
    const coverImg = root.querySelector('.create-cover__img');
    return {
      title: val('title'),
      location: val('location'),
      start_date: val('start_date'),
      start_time: val('start_time') || '09:00',
      end_date: val('end_date'),
      end_time: val('end_time') || '17:00',
      headcount: val('headcount'),
      fee: val('fee'),
      deadline: val('deadline'),
      audience,
      highlights: val('highlights'),
      desc: val('desc'),
      phone: val('phone'),
      cover: coverImg ? coverImg.src : defaultMock.cover,
    };
  }

  function formToRecruitment(form, existing) {
    const base = existing || {};
    const coverName =
      form.cover && form.cover.includes('/')
        ? form.cover.split('/').pop()
        : form.cover || 'recruit-cover.jpg';
    return {
      ...base,
      recruit_id: base.recruit_id || `r${Date.now()}`,
      hero_id: base.hero_id || '1',
      hero_name: base.hero_name || '小哥',
      type: base.type || 'event',
      typeLabel: base.typeLabel || '赛事',
      title: form.title.trim(),
      start_at: `${form.start_date}T${form.start_time}:00`,
      end_at: `${form.end_date || form.start_date}T${form.end_time}:00`,
      location: form.location.trim(),
      fee: Number(form.fee) || 0,
      signed: base.signed != null ? base.signed : 0,
      total: Number(form.headcount) || 0,
      displayStatus: base.displayStatus || 'recruiting',
      listTab: base.listTab || 'active',
      cover_images: [coverName],
      description: form.desc.trim(),
      highlights: form.highlights || '',
      audience: form.audience || [],
      phone: form.phone || '',
      deadline: form.deadline || '',
    };
  }

  function notify(message, type) {
    if (global.PreviewToast && global.PreviewToast.show) {
      global.PreviewToast.show(message, type);
    } else {
      window.alert(message);
    }
  }

  function validateForm(form, forPublish) {
    if (forPublish) {
      if (!form.title.trim() || form.title.length < 2 || form.title.length > 50) {
        return { ok: false, message: '标题 2-50 字' };
      }
      if (!form.location.trim()) return { ok: false, message: '请填写活动地点' };
      if (!form.start_date) return { ok: false, message: '请选择开始日期' };
      if (!form.headcount || Number(form.headcount) < 1) return { ok: false, message: '请填写招募人数' };
      if (form.fee === '' || Number(form.fee) < 0) return { ok: false, message: '请填写有效费用' };
      if (!form.deadline) return { ok: false, message: '请选择报名截止' };
      if (!form.desc.trim() || form.desc.length < 10) return { ok: false, message: '详细描述至少 10 字' };
      if (!/^1\d{10}$/.test(form.phone)) return { ok: false, message: '请填写有效手机号' };
    } else if (!form.title.trim()) {
      return { ok: false, message: '请至少填写标题' };
    }
    return { ok: true };
  }

  function resolvePublishedStatus(item, now = Date.now()) {
    const startMs = item.start_at ? new Date(item.start_at).getTime() : NaN;
    const endMs = item.end_at ? new Date(item.end_at).getTime() : NaN;
    if (!Number.isNaN(endMs) && now > endMs) {
      return { displayStatus: 'ended', listTab: 'ended', scope: 'mine_ended' };
    }
    if (!Number.isNaN(startMs) && now >= startMs) {
      return { displayStatus: 'ongoing', listTab: 'active', scope: 'mine_active' };
    }
    return { displayStatus: 'recruiting', listTab: 'active', scope: 'mine_active' };
  }

  async function persistRecruitment(form, options, mode) {
    const db = global.HeroPlazaDB;
    if (!db) throw new Error('db_unavailable');
    const ok = await db.isAvailable();
    if (!ok) throw new Error('db_offline');
    const existing = options.sourceItem || {};
    const item = formToRecruitment(form, existing);
    if (!existing.hero_id || existing.hero_id === '1') {
      try {
        const hero = await db.resolveCurrentHero();
        if (hero?.hero_id) {
          item.hero_id = hero.hero_id;
          item.hero_name = hero.hero_name || item.hero_name;
        }
      } catch (_) {
        /* keep defaults */
      }
    }
    item.user_id = item.user_id || 'mock-user-1';
    if (mode === 'draft') {
      item.displayStatus = 'draft';
      item.listTab = 'draft';
      if (options.recruitId) {
        return db.updateRecruitment(options.recruitId, { ...item, scope: 'mine_draft' });
      }
      return db.createRecruitment(item, 'mine_draft');
    }
    const status = resolvePublishedStatus(item);
    item.displayStatus = status.displayStatus;
    item.listTab = status.listTab;
    if (options.recruitId) {
      return db.updateRecruitment(options.recruitId, { ...item, scope: status.scope });
    }
    return db.createRecruitment(item, status.scope);
  }

  function setButtonBusy(btn, busy, busyText, idleText) {
    if (!btn) return;
    btn.disabled = busy;
    btn.style.opacity = busy ? '0.65' : '';
    btn.textContent = busy ? busyText : idleText;
  }

  function audienceTags(mock) {
    return audienceOptions
      .map(
        (item) =>
          `<button type="button" class="create-tag${mock.audience.includes(item) ? ' create-tag--active' : ''}" data-audience="${item}">${item}</button>`,
      )
      .join('');
  }

  function pinFooterToShell(root) {
    const footer = root.querySelector('.create-footer');
    const shell = root.closest('.mobile-shell');
    if (!footer || !shell) return;
    footer.classList.add('create-footer--pinned');
    shell.appendChild(footer);
  }

  function renderForm(root, options) {
    if (!root) return;
    const opts = options || {};
    const mock = opts.mock || defaultMock;
    const publishLabel = opts.publishLabel || '立即发布';
    const publishHref = opts.publishHref || 'my-recruitments.html';

    root.innerHTML = `
    <div class="create-form">
      <section class="create-section">
        <div class="create-section__title">基本信息</div>
        <div class="create-field">
          <label class="create-label create-label--required">招募标题</label>
          <input class="create-input" value="${escapeHtml(mock.title)}" data-field="title" />
        </div>
        <div class="create-field">
          <label class="create-label create-label--required">活动地点</label>
          <div class="create-location-row">
            <input class="create-input create-input--flex" value="${escapeHtml(mock.location)}" data-field="location" />
            <button type="button" class="create-map-btn" id="rc-map">地图</button>
          </div>
        </div>
        <div class="create-row">
          <div class="create-field create-field--half">
            <label class="create-label create-label--required">开始日期</label>
            <input class="create-input" type="date" value="${escapeHtml(mock.start_date)}" data-field="start_date" />
          </div>
          <div class="create-field create-field--half">
            <label class="create-label">开始时间</label>
            <input class="create-input" type="time" value="${escapeHtml(mock.start_time)}" data-field="start_time" />
          </div>
        </div>
        <div class="create-row">
          <div class="create-field create-field--half">
            <label class="create-label">结束日期</label>
            <input class="create-input" type="date" value="${escapeHtml(mock.end_date)}" data-field="end_date" />
          </div>
          <div class="create-field create-field--half">
            <label class="create-label">结束时间</label>
            <input class="create-input" type="time" value="${escapeHtml(mock.end_time)}" data-field="end_time" />
          </div>
        </div>
      </section>

      <section class="create-section">
        <div class="create-section__title">招募设置</div>
        <div class="create-row">
          <div class="create-field create-field--half">
            <label class="create-label create-label--required">招募人数</label>
            <input class="create-input" type="number" value="${escapeHtml(mock.headcount)}" data-field="headcount" />
          </div>
          <div class="create-field create-field--half">
            <label class="create-label create-label--required">费用（元/人）</label>
            <input class="create-input" type="number" value="${escapeHtml(mock.fee)}" data-field="fee" />
          </div>
        </div>
        <div class="create-field">
          <label class="create-label create-label--required">报名截止时间</label>
          <input class="create-input" type="date" value="${escapeHtml(mock.deadline)}" data-field="deadline" />
        </div>
        <div class="create-field">
          <label class="create-label">招募对象</label>
          <div class="create-tags" id="rc-audience">${audienceTags(mock)}</div>
        </div>
      </section>

      <section class="create-section">
        <div class="create-section__title">活动详情</div>
        <div class="create-field">
          <label class="create-label">活动亮点</label>
          <textarea class="create-textarea" data-field="highlights">${escapeHtml(mock.highlights)}</textarea>
        </div>
        <div class="create-field">
          <label class="create-label create-label--required">详细描述</label>
          <textarea class="create-textarea create-textarea--lg" data-field="desc">${escapeHtml(mock.desc)}</textarea>
        </div>
        <div class="create-field">
          <label class="create-label">封面图片</label>
          <button type="button" class="create-cover" id="rc-cover">
            <img class="create-cover__img" src="${escapeHtml(mock.cover)}" alt="封面">
            <span class="create-cover__hint">点击更换封面图（建议比例 16:9）</span>
          </button>
        </div>
      </section>

      <section class="create-section">
        <div class="create-section__title">联系方式</div>
        <div class="create-field">
          <label class="create-label create-label--required">咨询手机</label>
          <input class="create-input" value="${escapeHtml(mock.phone)}" data-field="phone" />
        </div>
      </section>

      <div class="create-footer">
        <button type="button" class="create-footer__draft" id="rc-draft">保存草稿</button>
        <button type="button" class="create-footer__publish" id="rc-publish" data-publish-href="${publishHref}">${publishLabel}</button>
      </div>
    </div>`;

    root.querySelector('#rc-audience')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-audience]');
      if (!btn) return;
      btn.classList.toggle('create-tag--active');
    });
    root.querySelector('#rc-map')?.addEventListener('click', () => {
      window.alert('预览：打开地图选点');
    });
    root.querySelector('#rc-cover')?.addEventListener('click', () => {
      window.alert('预览：上传封面图');
    });

    async function goMyRecruitmentsTab(tab) {
      sessionStorage.setItem('my-recruitments-tab', tab || 'active');
      sessionStorage.setItem('my-recruitments-reload', String(Date.now()));
      await new Promise((r) => setTimeout(r, 350));
      const href = 'my-recruitments.html';
      if (global.PreviewNav && global.PreviewNav.navigateTo) {
        await global.PreviewNav.navigateTo(href);
      } else {
        window.location.href = href;
      }
    }

    async function goMyRecruitmentsDraft() {
      await goMyRecruitmentsTab('draft');
    }

    root.querySelector('#rc-draft')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const draftBtn = e.currentTarget;
      const form = collectForm(root);
      const check = validateForm(form, false);
      if (!check.ok) {
        notify(check.message, 'error');
        return;
      }
      setButtonBusy(draftBtn, true, '保存中…', '保存草稿');
      try {
        const saved = await persistRecruitment(form, opts, 'draft');
        opts.recruitId = saved.recruit_id;
        opts.sourceItem = saved;
        notify('草稿已保存', 'success');
        await goMyRecruitmentsDraft();
      } catch (err) {
        const msg =
          err.message === 'db_unavailable' || err.message === 'db_offline'
            ? '本地数据库未连接，请先运行 bash scripts/start-dev.sh'
            : '保存失败';
        notify(msg, 'error');
        console.error(err);
      } finally {
        setButtonBusy(draftBtn, false, '保存中…', '保存草稿');
      }
    });

    const publishBtn = root.querySelector('#rc-publish');
    publishBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const form = collectForm(root);
      const strict = !opts.isEdit;
      const check = validateForm(form, strict);
      if (!check.ok) {
        notify(check.message, 'error');
        return;
      }
      setButtonBusy(publishBtn, true, '保存中…', publishLabel);
      try {
        const saved = await persistRecruitment(form, opts, 'publish');
        opts.recruitId = saved.recruit_id;
        opts.sourceItem = saved;
        notify('保存成功', 'success');
        if (opts.isEdit && global.PreviewNav && global.PreviewNav.goBack) {
          await global.PreviewNav.goBack(publishHref);
        } else {
          await goMyRecruitmentsTab(saved.listTab || 'active');
        }
      } catch (err) {
        const msg =
          err.message === 'db_unavailable' || err.message === 'db_offline'
            ? '本地数据库未连接，请先运行 bash scripts/start-dev.sh'
            : '保存失败';
        notify(msg, 'error');
        console.error(err);
      } finally {
        setButtonBusy(publishBtn, false, '保存中…', publishLabel);
      }
    });

    pinFooterToShell(root);
  }

  global.RecruitmentFormPreview = {
    renderForm,
    itemToMock,
    defaultMock,
    collectForm,
    formToRecruitment,
    validateForm,
    resolvePublishedStatus,
  };
})(typeof window !== 'undefined' ? window : globalThis);
