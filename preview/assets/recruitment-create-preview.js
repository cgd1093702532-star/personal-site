/** 发布赛事招募 · 预览页 */
(function () {
  const root = document.getElementById('recruitment-create-root');
  if (!root || !window.RecruitmentFormPreview) return;
  window.RecruitmentFormPreview.renderForm(root, {
    mock: window.RecruitmentFormPreview.defaultMock,
    publishLabel: '立即发布',
    publishHref: 'my-recruitments.html',
  });
})();
