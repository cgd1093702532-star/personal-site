/** 申请成为英雄 · 预览页 */
(function () {
  const PREVIEW_SMS_CODE = '666666';
  const imgBase = '../assets/images/';
  const projectTypes = ['帆船', '皮划艇', '桨板', '潜水'];
  const yearsOptions = ['1-3年', '3-5年', '5-10年', '10年+'];
  const certOptions = ['国家级教练', '省级教练', 'ACA认证', 'ISA认证', '其他'];

  let cleanup = null;
  let sentSmsCode = null;
  let countdownTimer = null;
  let countdownLeft = 0;
  let smsSentOnce = false;
  let certCount = 0;

  function showToast(msg, type) {
    if (window.PreviewToast) {
      window.PreviewToast.show(msg, type || 'error', 2000);
      return;
    }
    window.alert(msg);
  }

  function tags(items, active, attr) {
    return items
      .map(
        (item) =>
          `<button type="button" class="apply-tag${active.includes(item) ? ' apply-tag--active' : ''}" data-${attr}="${item}">${item}</button>`,
      )
      .join('');
  }

  function getRoot() {
    return document.getElementById('hero-apply-root');
  }

  function getShell(root) {
    return root?.closest('.mobile-shell') || null;
  }

  function removeStaleFooters(shell) {
    shell?.querySelectorAll(':scope > .apply-footer--pinned').forEach((node) => node.remove());
  }

  function pinFooterToShell(root, shell) {
    const footer = root.querySelector('#apply-footer');
    if (!footer || !shell) return;
    footer.classList.add('apply-footer--pinned');
    shell.appendChild(footer);
  }

  function hasCertUploaded(root) {
    return certCount > 0 || !!root.querySelector('#apply-cert-grid .apply-cert-item');
  }

  async function handleSubmit(root, agree) {
    const name = root.querySelector('[data-field="name"]')?.value?.trim();
    const phone = root.querySelector('[data-field="phone"]')?.value?.trim();
    const smsCode = root.querySelector('[data-field="sms_code"]')?.value?.trim();
    const city = root.querySelector('[data-field="city"]')?.value?.trim();
    const bio = root.querySelector('[data-field="bio"]')?.value?.trim();
    const certification = root.querySelector('#apply-cert')?.value?.trim();

    if (!name) {
      showToast('请填写姓名');
      return;
    }
    if (!phone || !/^1\d{10}$/.test(phone)) {
      showToast('请填写正确的手机号');
      return;
    }
    if (!smsCode || !sentSmsCode || smsCode !== sentSmsCode) {
      showToast('请填写正确的验证码');
      return;
    }

    const projects = [];
    root.querySelectorAll('#apply-project-tags .apply-tag--active').forEach((btn) => {
      if (btn.dataset.project) projects.push(btn.dataset.project);
    });
    if (projects.length === 0) {
      showToast('请选择项目类型');
      return;
    }
    if (!city) {
      showToast('请填写城市');
      return;
    }
    if (!certification) {
      showToast('请选择教练资质等级');
      return;
    }

    const yearsBtn = root.querySelector('#apply-years-tags .apply-tag--active');
    const yearsExp = yearsBtn?.dataset.years || '';
    if (!yearsExp) {
      showToast('请选择从业年限');
      return;
    }
    if (!hasCertUploaded(root)) {
      showToast('请上传资证证书');
      return;
    }
    if (!bio) {
      showToast('请填写详细介绍');
      return;
    }
    if (!agree?.checked) {
      showToast('请阅读并同意相关协议');
      return;
    }

    const db = window.HeroPlazaDB;
    if (!db || !(await db.isAvailable())) {
      showToast('提交失败，请确认本地数据库服务已启动（:8787）');
      return;
    }

    const application = {
      name,
      phone,
      sms_code: smsCode,
      project_types: projects,
      city,
      certification,
      years_exp: yearsExp,
      honors: root.querySelector('[data-field="honors"]')?.value || '',
      bio,
      cert_count: certCount,
      submitted_at: new Date().toISOString(),
    };

    try {
      await db.submitHeroApply(application);
      if (window.PreviewNav?.navigateTo) {
        window.PreviewNav.navigateTo('hero-apply-submitted.html', 'forward', { replace: true });
      } else {
        window.location.href = 'hero-apply-submitted.html';
      }
    } catch (err) {
      const code = err?.payload?.error || err?.message || '';
      if (code === 'already_approved') {
        showToast('您已是认证英雄，无需重复申请');
        return;
      }
      if (code === 'application_pending') {
        showToast('申请审核中，请勿重复提交');
        return;
      }
      if (code === 'not_found' || err?.status === 404) {
        showToast('API 接口未找到，请重启本地数据库服务（:8787）');
        return;
      }
      showToast(`提交失败：${code || '请稍后重试'}`);
      console.error(err);
    }
  }

  function initHeroApplyPage() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    const root = getRoot();
    if (!root) return;

    const shell = getShell(root);
    removeStaleFooters(shell);
    sentSmsCode = null;
    countdownLeft = 0;
    smsSentOnce = false;
    certCount = 0;
    clearInterval(countdownTimer);
    countdownTimer = null;

    root.innerHTML = `
    <div class="apply">
      <div class="apply-header">
        <div class="apply-header__title">认证成为英雄教练</div>
        <div class="apply-header__desc">发布课程/赛事，开启你的水上教育事业</div>
      </div>

      <section class="apply-section">
        <div class="apply-section__title">基本信息</div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">姓名</label>
          <input class="apply-input" value="" placeholder="请输入" data-field="name" />
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">手机号</label>
          <div class="apply-phone-wrap">
            <input class="apply-input apply-input--phone" type="tel" maxlength="11" placeholder="请输入" data-field="phone" value="" inputmode="numeric" />
            <button type="button" class="apply-sms-code" id="apply-sms-send" disabled>获取验证码</button>
          </div>
          <div class="apply-sms-field" id="apply-sms-field">
            <input class="apply-input" type="tel" maxlength="6" placeholder="请输入" data-field="sms_code" inputmode="numeric" />
          </div>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">项目类型</label>
          <div class="apply-tags" id="apply-project-tags">${tags(projectTypes, [], 'project')}</div>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">常驻城市</label>
          <textarea class="apply-textarea apply-textarea--city" placeholder="请输入" data-field="city" rows="1"></textarea>
        </div>
      </section>

      <section class="apply-section">
        <div class="apply-section__title">资质认证</div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">教练资质等级</label>
          <select class="apply-input apply-select" id="apply-cert">
            <option value="" selected>请选择</option>
            ${certOptions.map((o) => `<option value="${o}">${o}</option>`).join('')}
          </select>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">从业年限</label>
          <div class="apply-tags" id="apply-years-tags">${yearsOptions
            .map((item) => `<button type="button" class="apply-tag" data-years="${item}">${item}</button>`)
            .join('')}</div>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">资质证书上传</label>
          <div class="apply-cert-grid" id="apply-cert-grid">
            <button type="button" class="apply-cert-add" id="apply-cert-add"><span class="apply-cert-add__icon">+</span><span class="apply-cert-add__text">上传证书</span></button>
          </div>
        </div>
      </section>

      <section class="apply-section">
        <div class="apply-section__title">荣誉与成就</div>
        <div class="apply-field">
          <label class="apply-label">曾获荣誉（选填）</label>
          <textarea class="apply-textarea" data-field="honors"></textarea>
        </div>
      </section>

      <section class="apply-section">
        <div class="apply-section__title">个人简介</div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">详细介绍</label>
          <textarea class="apply-textarea apply-textarea--lg" data-field="bio"></textarea>
        </div>
        <div class="apply-field">
          <label class="apply-label">个人展示视频（选填）</label>
          <button type="button" class="apply-video" id="apply-video">
            <span class="apply-video__icon">🎬</span>
            <span class="apply-video__hint">点击上传/拍摄视频介绍（建议30秒以内）</span>
          </button>
        </div>
      </section>

      <div class="apply-footer" id="apply-footer">
        <label class="apply-agreement">
          <input type="checkbox" class="apply-agreement__input" id="apply-agree" />
          <span class="apply-agreement__check"></span>
          <span class="apply-agreement__text">我已阅读并同意<span class="apply-agreement__link">《英雄认证协议》</span><span class="apply-agreement__link">《平台服务条款》</span>和<span class="apply-agreement__link">《安全保障须知》</span>，承诺以上信息真实有效。</span>
        </label>
        <button type="button" class="apply-submit" id="apply-submit">提交申请</button>
      </div>
    </div>`;

    pinFooterToShell(root, shell);

    const agree = document.getElementById('apply-agree');
    const agreeVisual = document.querySelector('#apply-footer .apply-agreement__check');
    const phoneInput = root.querySelector('[data-field="phone"]');
    const sendBtn = root.querySelector('#apply-sms-send');
    const smsField = root.querySelector('#apply-sms-field');
    const certGrid = root.querySelector('#apply-cert-grid');
    const certAddBtn = root.querySelector('#apply-cert-add');

    function syncAgreeVisual() {
      if (!agreeVisual || !agree) return;
      agreeVisual.classList.toggle('apply-agreement__check--on', agree.checked);
      agreeVisual.textContent = agree.checked ? '✓' : '';
    }

    function updateSendBtn() {
      const hasChars = !!(phoneInput && phoneInput.value.trim());
      if (!sendBtn || countdownLeft > 0) return;
      sendBtn.disabled = !hasChars;
      sendBtn.textContent = smsSentOnce ? '重新获取验证码' : '获取验证码';
      sendBtn.classList.toggle('apply-sms-code--active', hasChars);
      sendBtn.classList.remove('apply-sms-code--countdown');
    }

    function startCountdown() {
      if (!sendBtn) return;
      smsSentOnce = true;
      smsField?.classList.add('apply-sms-field--visible');
      countdownLeft = 60;
      sendBtn.disabled = true;
      sendBtn.classList.remove('apply-sms-code--active');
      sendBtn.classList.add('apply-sms-code--countdown');
      sendBtn.textContent = '60s';
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        countdownLeft -= 1;
        if (countdownLeft <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          updateSendBtn();
          return;
        }
        sendBtn.textContent = `${countdownLeft}s`;
      }, 1000);
    }

    function appendCertItem() {
      if (!certGrid || !certAddBtn) return;
      certCount += 1;
      const item = document.createElement('div');
      item.className = 'apply-cert-item';
      item.innerHTML = `<img src="${imgBase}cert.jpg" alt="证书${certCount}"><span class="apply-cert-item__label">证书${certCount}</span>`;
      certGrid.insertBefore(item, certAddBtn);
      if (certCount >= 5) certAddBtn.style.display = 'none';
    }

    const onProjectTagsClick = (e) => {
      const btn = e.target.closest('[data-project]');
      if (!btn) return;
      btn.classList.toggle('apply-tag--active');
    };

    const onYearsTagsClick = (e) => {
      const btn = e.target.closest('[data-years]');
      if (!btn) return;
      root.querySelectorAll('#apply-years-tags .apply-tag').forEach((el) => el.classList.remove('apply-tag--active'));
      btn.classList.add('apply-tag--active');
    };

    const onAgreeChange = () => syncAgreeVisual();
    const onCertAddClick = () => appendCertItem();
    const onVideoClick = () => window.alert('预览：上传视频（演示环境跳过）');
    const onPhoneInput = () => updateSendBtn();
    const onSendSmsClick = () => {
      if (countdownLeft > 0) return;
      const phone = phoneInput?.value?.trim() || '';
      if (!phone) return;
      if (!/^1\d{10}$/.test(phone)) {
        showToast('手机号格式不正确');
        return;
      }
      sentSmsCode = PREVIEW_SMS_CODE;
      showToast('短信验证码已发送', 'success');
      startCountdown();
    };

    const onShellClick = (e) => {
      const submitBtn = e.target.closest('#apply-submit');
      if (!submitBtn || !shell?.contains(submitBtn)) return;
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(root, agree);
    };

    root.querySelector('#apply-project-tags')?.addEventListener('click', onProjectTagsClick);
    root.querySelector('#apply-years-tags')?.addEventListener('click', onYearsTagsClick);
    agree?.addEventListener('change', onAgreeChange);
    certAddBtn?.addEventListener('click', onCertAddClick);
    root.querySelector('#apply-video')?.addEventListener('click', onVideoClick);
    phoneInput?.addEventListener('input', onPhoneInput);
    sendBtn?.addEventListener('click', onSendSmsClick);
    shell?.addEventListener('click', onShellClick, true);

    syncAgreeVisual();
    updateSendBtn();

    cleanup = () => {
      clearInterval(countdownTimer);
      root.querySelector('#apply-project-tags')?.removeEventListener('click', onProjectTagsClick);
      root.querySelector('#apply-years-tags')?.removeEventListener('click', onYearsTagsClick);
      agree?.removeEventListener('change', onAgreeChange);
      certAddBtn?.removeEventListener('click', onCertAddClick);
      root.querySelector('#apply-video')?.removeEventListener('click', onVideoClick);
      phoneInput?.removeEventListener('input', onPhoneInput);
      sendBtn?.removeEventListener('click', onSendSmsClick);
      shell?.removeEventListener('click', onShellClick, true);
    };
  }

  function boot() {
    try {
      initHeroApplyPage();
    } catch (err) {
      console.error('[hero-apply-preview]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('preview:navigate', () => {
    if (getRoot()) boot();
  });

  window.initHeroApplyPage = initHeroApplyPage;
})();
