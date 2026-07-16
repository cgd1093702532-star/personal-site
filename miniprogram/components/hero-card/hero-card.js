function truncateLabel(text, maxLen = 6) {
  const s = String(text || '');
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
}

function yearsHonorText(yearsExp) {
  if (yearsExp == null || yearsExp === '') return '';
  let y = String(yearsExp).trim();
  if (!y) return '';
  y = y.replace(/[~～－–—−‐‑﹣]/g, '—').replace(/-/g, '—').replace(/\s*—\s*/g, '—');
  if (/经验/.test(y)) return y.replace(/^(\d+)\s*年执教经验$/, '$1年经验').replace(/执教经验/, '经验');
  if (/年/.test(y)) return y.includes('经验') ? y : `${y}经验`;
  return `${y}年经验`;
}

function pickRows(hero, layout) {
  const nested = Array.isArray(hero.recruitments) ? hero.recruitments : [];
  const events = nested.filter((r) => r.type === 'event');
  const activities = nested.filter((r) => r.type === 'activity');
  const courses = nested.filter((r) => r.type === 'course');
  const rows = [];

  const event = events[0] || null;
  const activity = activities[0] || null;
  const course = courses[0] || null;

  if (event) {
    const title = event.title || '';
    const status = event.status || '招募中';
    const extra = event.quota_text || event.signup_hint || '';
    const text = extra ? `${status} | ${title} ${extra}` : `${status} | ${title}`;
    const eventId = event.target_id || event.recruit_id || event.id;
    rows.push({
      key: `e-${eventId || title}`,
      type: 'event',
      target_id: eventId,
      tagLabel: '赛事',
      tagVariant: 'event',
      text,
    });
  }
  if (activity) {
    const activityId = activity.target_id || activity.recruit_id || activity.id;
    rows.push({
      key: `a-${activityId || activity.title}`,
      type: 'activity',
      target_id: activityId,
      tagLabel: '活动',
      tagVariant: 'activity',
      text: `${activity.status || '报名中'} | ${activity.title || ''}`,
    });
  }
  if (course) {
    const courseText =
      layout === 'home'
        ? course.title || ''
        : `${course.status || '报名中'} | ${course.title || ''}`;
    const courseId = course.target_id || course.course_id || course.id;
    rows.push({
      key: `c-${courseId || course.title}`,
      type: 'course',
      target_id: courseId,
      tagLabel: '课程',
      tagVariant: 'course',
      text: courseText,
    });
  }

  if (!rows.length && nested.length) {
    return nested.slice(0, layout === 'home' ? 3 : 2).map((item, index) => {
      const type = item.type === 'course' ? 'course' : item.type === 'activity' ? 'activity' : 'event';
      const tagLabel = type === 'course' ? '课程' : type === 'activity' ? '活动' : '赛事';
      const targetId = item.target_id || item.recruit_id || item.course_id || item.id;
      return {
        key: `n-${index}-${targetId || item.title}`,
        type,
        target_id: targetId,
        tagLabel,
        tagVariant: type,
        text: `${item.status || ''}${item.status ? ' | ' : ''}${item.title || ''}`,
      };
    });
  }
  return rows;
}

Component({
  properties: {
    hero: { type: Object, value: {} },
    layout: { type: String, value: 'scroll' },
  },

  data: {
    displayName: '',
    displayTypes: [],
    honorItems: [],
    displayRows: [],
  },

  observers: {
    'hero, layout': function (hero, layout) {
      const h = hero || {};
      const titles = Array.isArray(h.honor_titles) ? h.honor_titles.filter(Boolean) : [];
      const types = Array.isArray(h.project_types) ? h.project_types.slice(0, 3) : [];
      // 主荣誉（皇冠）+ 经验副标；无经验时用第二条荣誉
      const honorItems = [];
      if (titles[0]) {
        honorItems.push({ text: titles[0], primary: true });
      }
      const yearsText = yearsHonorText(h.years_exp);
      if (yearsText) honorItems.push({ text: yearsText, primary: false });
      else if (titles[1]) honorItems.push({ text: titles[1], primary: false });

      this.setData({
        displayName: h.nickname || h.name || '',
        displayTypes: types.map((t) => truncateLabel(t)),
        honorItems,
        displayRows: pickRows(h, layout === 'scroll' ? 'home' : layout),
      });
    },
  },

  methods: {
    onHeadTap() {
      this.triggerEvent('tap', { hero_id: this.properties.hero.hero_id });
    },

    onRowTap(e) {
      const { type, targetId } = e.currentTarget.dataset;
      if (!targetId) return;
      if (type === 'event' || type === 'activity') {
        wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${targetId}` });
        return;
      }
      if (type === 'course') {
        wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${targetId}` });
        return;
      }
      wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${targetId}` });
    },
  },
});
