/** 编辑招募 · 预览页（与发布招募相同精简表单） */
(function () {
  const root = document.getElementById('recruitment-edit-root');
  if (!root || !window.RecruitmentFormPreview) return;

  const id = new URLSearchParams(location.search).get('id') || 'r1';

  async function init() {
    let item = window.getRecruitmentById ? window.getRecruitmentById(id) : null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        item = await window.HeroPlazaDB.getRecruitment(id);
      } catch (err) {
        console.warn('[recruitment-edit] 数据库读取失败，使用静态数据', err);
      }
    }
    const mock = item
      ? window.RecruitmentFormPreview.itemToMock(item)
      : window.RecruitmentFormPreview.defaultMock;

    window.RecruitmentFormPreview.renderForm(root, {
      mock,
      recruitId: id,
      sourceItem: item,
      isEdit: true,
    });
  }

  init().catch((err) => {
    console.error('[recruitment-edit] 初始化失败', err);
    if (window.PreviewToast) {
      window.PreviewToast.show('页面加载失败', 'error');
    }
  });
})();
