/** 招募表单 · 预览端共享渲染（发布/编辑） */
(function (global) {
  const imgBase = '../assets/images/';
  const defaultMock = {
    type: 'event',
    title: '周末帆船体验营',
    location: '滴水湖二号码头',
    start_date: '2026-06-08',
    start_time: '09:00',
    end_date: '2026-06-08',
    end_time: '16:00',
    fee: '500',
    cover: `${imgBase}recruit-cover.jpg`,
  };

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
      type: item.type || 'event',
      title: item.title || '',
      location: item.location || '',
      start_date: start.date,
      start_time: start.time,
      end_date: end.date || start.date,
      end_time: end.time,
      fee: item.fee != null ? String(item.fee) : '',
      cover: coverSrc,
    };
  }

  function renderForm(root) {
    if (!root) return;
    root.innerHTML = '';
  }

  global.RecruitmentFormPreview = {
    renderForm,
    itemToMock,
    defaultMock,
  };
})(typeof window !== 'undefined' ? window : globalThis);
