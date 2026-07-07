/** 招募表单 · 发布/编辑共享 */

const AUDIENCE_OPTIONS = ['青少年', '成人', '亲子', '新手'];

const EMPTY_FORM = {
  type: 'event',
  title: '',
  location: '',
  start_date: '',
  start_time: '09:00',
  end_date: '',
  end_time: '17:00',
  headcount: '',
  fee: '',
  deadline: '',
  audience: [],
  highlights: '',
  desc: '',
  cover: '',
  phone: '',
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
    headcount: item.total != null ? String(item.total) : '',
    fee: item.fee != null ? String(item.fee) : '',
    deadline: item.deadline || '',
    audience: item.audience || [],
    highlights: item.highlights || '',
    desc: item.description || item.desc || '',
    cover,
    phone: item.phone || '',
  };
}

function buildAudienceMap(audience) {
  const map = {};
  (audience || []).forEach((item) => {
    map[item] = true;
  });
  return map;
}

function formToRecruitment(form, existing) {
  const base = existing || {};
  return {
    ...base,
    recruit_id: base.recruit_id || `r${Date.now()}`,
    hero_id: base.hero_id || '1',
    hero_name: base.hero_name || '小哥',
    type: form.type || 'event',
    typeLabel: base.typeLabel || '赛事',
    title: form.title.trim(),
    start_at: `${form.start_date}T${form.start_time || '09:00'}:00`,
    end_at: `${form.end_date || form.start_date}T${form.end_time || '17:00'}:00`,
    location: form.location.trim(),
    fee: Number(form.fee),
    signed: base.signed != null ? base.signed : 0,
    total: Number(form.headcount),
    displayStatus: base.displayStatus || 'recruiting',
    listTab: base.listTab || 'active',
    cover_images: form.cover ? [form.cover] : base.cover_images || ['recruit-cover.jpg'],
    description: form.desc.trim(),
    highlights: form.highlights || '',
    audience: form.audience || [],
    phone: form.phone || '',
    deadline: form.deadline || '',
  };
}

function validateForm(form, forPublish) {
  const { title, location, start_date, headcount, fee, deadline, desc, phone } = form;

  if (forPublish) {
    if (!title.trim() || title.length < 2 || title.length > 50) {
      return { ok: false, message: '标题 2-50 字' };
    }
    if (!location.trim()) {
      return { ok: false, message: '请填写活动地点' };
    }
    if (!start_date) {
      return { ok: false, message: '请选择开始日期' };
    }
    if (!headcount || Number(headcount) < 1 || Number(headcount) > 100) {
      return { ok: false, message: '招募人数 1-100' };
    }
    if (fee === '' || Number(fee) < 0 || Number(fee) > 99999) {
      return { ok: false, message: '请填写有效费用' };
    }
    if (!deadline) {
      return { ok: false, message: '请选择报名截止' };
    }
    if (deadline >= start_date) {
      return { ok: false, message: '截止须早于开始日期' };
    }
    if (!desc.trim() || desc.length < 10) {
      return { ok: false, message: '详细描述至少 10 字' };
    }
    if (!/^1\d{10}$/.test(phone)) {
      return { ok: false, message: '请填写有效手机号' };
    }
  } else if (!title.trim()) {
    return { ok: false, message: '请至少填写标题' };
  }
  return { ok: true };
}

module.exports = {
  AUDIENCE_OPTIONS,
  EMPTY_FORM,
  itemToForm,
  buildAudienceMap,
  formToRecruitment,
  validateForm,
  parseIso,
};
