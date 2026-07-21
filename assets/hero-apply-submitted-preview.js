/** 申请成为英雄 · 提交成功（审核中） */
(function () {
  const root = document.getElementById('hero-apply-submitted-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const fromHeroDetail = params.get('from') === 'hero-detail';
  const heroId = params.get('hero_id') || '1';
  const backHref = fromHeroDetail
    ? `hero-detail.html?id=${encodeURIComponent(heroId)}`
    : 'profile.html';
  const backText = fromHeroDetail ? '返回英雄详情' : '返回个人中心';

  root.innerHTML = `
    <div class="apply-submitted">
      <div class="apply-submitted__hero">
        <div class="apply-submitted__icon-wrap"><span class="apply-submitted__icon">✓</span></div>
        <div class="apply-submitted__title">申请信息已提交成功</div>
        <p class="apply-submitted__desc">预计 1-7 个工作日完成审核，审核通过后会发送通知告知。</p>
      </div>
      <div class="apply-submitted__footer">
        <a class="apply-submitted__btn nav-forward" href="${backHref}">${backText}</a>
      </div>
    </div>`;
})();
