/** 我的学员 · 预览页 */
(function () {
  const root = document.getElementById('my-students-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const DEFAULT_MY_STUDENTS = [
    { id: 'st1', nickname: '学员小李', avatar: `${imgBase}avatar-user.jpg`, course_count: 3, last_active: '2026-06-10' },
    { id: 'st2', nickname: '航海爱好者', avatar: `${imgBase}avatar-user.jpg`, course_count: 2, last_active: '2026-06-05' },
    { id: 'st3', nickname: '张女士', avatar: `${imgBase}avatar-user.jpg`, course_count: 1, last_active: '2026-05-28' },
    { id: 'st4', nickname: '王先生', avatar: `${imgBase}avatar-user.jpg`, course_count: 4, last_active: '2026-05-15' },
  ];

  async function loadList() {
    let source = null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        source = (await window.HeroPlazaDB.getAppState('my_students')) || [];
      } catch (err) {
        console.warn('[my-students] 数据库加载失败，回退静态数据', err);
      }
    }
    if (!source || !source.length) source = DEFAULT_MY_STUDENTS;
    return [...source].sort((a, b) => {
      const ta = new Date(a.last_active || 0).getTime();
      const tb = new Date(b.last_active || 0).getTime();
      return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
    });
  }

  function card(item) {
    const avatar = item.avatar
      ? `<img class="my-student__avatar" src="${item.avatar}" alt="">`
      : `<span class="my-student__avatar my-student__avatar--placeholder"></span>`;
    return (
      `<article class="my-student__item">` +
      avatar +
      `<div class="my-student__info">` +
      `<span class="my-student__name">${item.nickname}</span>` +
      `<span class="my-student__meta">参与 ${item.course_count || 0} 门课程 · 最近活跃 ${item.last_active || '—'}</span>` +
      `</div>` +
      `</article>`
    );
  }

  async function render() {
    const list = await loadList();
    root.innerHTML =
      `<div class="my-student">` +
      `<div class="my-student__list">` +
      (list.length ? list.map(card).join('') : `<div class="my-student__empty">暂无学员</div>`) +
      `</div>` +
      `</div>`;
  }

  render();
  window.addEventListener('preview:navigate', () => {
    render();
  });
})();
