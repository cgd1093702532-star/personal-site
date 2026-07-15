/** 招募表单 · 发布/编辑共享（精简字段，本页不提交） */

const EMPTY_FORM = {
  type: 'event',
  title: '',
  location: '',
  start_date: '',
  start_time: '09:00',
  end_date: '',
  end_time: '17:00',
  fee: '',
  cover: '',
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseIso(iso) {
  if (!iso) return { date: '', time: '09:00' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '09:00' };
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

function itemToForm(item) {
  if (!item) return { ...EMPTY_FORM };
  const start = parseIso(item.start_at);
  const end = parseIso(item.end_at);
  const cover =
    item.cover ||
    (item.cover_images && item.cover_images.length ? item.cover_images[0] : '');
  return {
    type: item.type || 'event',
    title: item.title || '',
    location: item.location || '',
    start_date: start.date,
    start_time: start.time,
    end_date: end.date,
    end_time: end.time,
    fee: item.fee != null ? String(item.fee) : '',
    cover,
  };
}

function formToRecruitment(form, existing) {
  const base = existing || {};
  const type = form.type === 'activity' ? 'activity' : 'event';
  return {
    ...base,
    recruit_id: base.recruit_id || `r${Date.now()}`,
    hero_id: form.hero_id || base.hero_id || '1',
    hero_name: form.hero_name || base.hero_name || '小哥',
    type,
    typeLabel: type === 'activity' ? '活动' : '赛事',
    title: (form.title || '').trim(),
    start_at: `${form.start_date}T${form.start_time || '09:00'}:00`,
    end_at: `${form.end_date || form.start_date}T${form.end_time || '17:00'}:00`,
    location: (form.location || '').trim(),
    fee: Number(form.fee) || 0,
    signed: base.signed != null ? base.signed : 0,
    total: base.total != null ? base.total : 0,
    displayStatus: base.displayStatus || 'recruiting',
    listTab: base.listTab || 'active',
    cover_images: form.cover ? [form.cover] : base.cover_images || ['recruit-cover.jpg'],
  };
}

module.exports = {
  EMPTY_FORM,
  itemToForm,
  formToRecruitment,
  parseIso,
};
