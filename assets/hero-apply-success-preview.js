/** 申请成为英雄 · 提交成功页 */
(function () {
  const root = document.getElementById('hero-apply-success-root');
  if (!root) return;

  const benefits = [
    '发布课程和赛事招募',
    '接收学员在线报名',
    '获得平台流量扶持',
    '参与英雄排行榜评选',
    '创建专属教练主页',
  ];

  const tips = [
    '您的资料将在 1-3 个工作日内完成审核',
    '审核通过后可正式发布招募活动',
    '请保持手机畅通，平台可能联系您核实信息',
  ];

  root.innerHTML = `
    <div class="hero-success">
      <div class="hero-success__hero">
        <div class="hero-success__icon-wrap"><span class="hero-success__icon">✓</span></div>
        <div class="hero-success__title">恭喜您！成功认证英雄</div>
      </div>

      <section class="hero-success__section">
        <div class="hero-success__section-title">🎁 您已获得的认证权益</div>
        <div class="hero-success__benefits">
          ${benefits
            .map(
              (b) =>
                `<div class="hero-success__benefit"><span class="hero-success__check">✓</span><span class="hero-success__benefit-text">${b}</span></div>`,
            )
            .join('')}
        </div>
      </section>

      <section class="hero-success__section">
        <div class="hero-success__section-title">📌 温馨提示</div>
        <div class="hero-success__tips">
          ${tips.map((t) => `<div class="hero-success__tip">· ${t}</div>`).join('')}
        </div>
      </section>

      <section class="hero-success__section">
        <div class="hero-success__section-title">接下来，建议您完成</div>
        <div class="hero-success__steps">
          <a class="hero-success__step nav-forward" href="hero-profile.html">
            <span class="hero-success__step-num">1</span>
            <span class="hero-success__step-body">
              <span class="hero-success__step-title">完善英雄资料</span>
              <span class="hero-success__step-desc">补充简介、荣誉与资质证书</span>
            </span>
            <span class="hero-success__step-arrow">›</span>
          </a>
          <a class="hero-success__step nav-forward" href="recruitment-create.html">
            <span class="hero-success__step-num">2</span>
            <span class="hero-success__step-body">
              <span class="hero-success__step-title">发布首个赛事招募</span>
              <span class="hero-success__step-desc">开启您的第一场水上活动招募</span>
            </span>
            <span class="hero-success__step-arrow">›</span>
          </a>
        </div>
      </section>
    </div>
    <div class="hero-success__footer" id="hero-success-footer">
      <a class="hero-success__btn nav-forward" href="profile.html">返回个人中心</a>
    </div>`;

  function pinFooterToShell() {
    const footer = root.querySelector('#hero-success-footer');
    const shell = root.closest('.mobile-shell');
    if (!footer || !shell) return;
    footer.classList.add('hero-success__footer--pinned');
    shell.appendChild(footer);
  }

  pinFooterToShell();
})();
