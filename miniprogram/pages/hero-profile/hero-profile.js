const data = require('../../utils/data.js');

const FALLBACK_HERO_ID = '1';
const BIO_STORAGE = 'hero-profile-edit-bio';
const BIO_RESULT = 'hero-profile-edit-bio-result';
const MAX_PHOTOS = 9;

function buildStars(rating) {
  return [1, 2, 3, 4, 5].map((i) => ({
    index: i,
    filled: rating >= i,
    half: rating >= i - 0.5 && rating < i,
  }));
}

function buildDetailTags(hero) {
  const tags = [...(hero.honor_titles || []), ...(hero.cert_badges || [])];
  return tags.slice(0, 3);
}

function withHonorIds(list) {
  return (list || []).map((item, index) => ({
    ...item,
    id: item.id || `honor-${index}`,
  }));
}

function withMediaIds(list, prefix) {
  return (list || []).map((item, index) => {
    if (typeof item === 'string') {
      return { id: `${prefix}-${index}`, url: item, image: item, name: '资质证书', isLocal: false };
    }
    const url = item.image || item.url;
    return {
      id: item.id || `${prefix}-${index}`,
      url,
      image: url,
      name: item.name || '资质证书',
      isLocal: !!item.isLocal,
    };
  });
}

function yearsLabel(years) {
  const raw = String(years || '').trim();
  if (!raw) return '';
  let s = raw.replace(/[~～－–—−‐‑﹣]/g, '—').replace(/-/g, '—').replace(/\s*—\s*/g, '—');
  if (/年/.test(s)) return /经验/.test(s) ? s : `${s}经验`;
  return `${s}年经验`;
}

function buildSubtitle(hero) {
  const types = (hero.project_types || []).join(' · ');
  const years = yearsLabel(hero.years_exp);
  if (types && years) return `${types} · ${years}`;
  return types || years;
}

Page({
  data: {
    hero: null,
    heroId: FALLBACK_HERO_ID,
    subtitle: '',
    detailTags: [],
    stars: [],
    aboutMe: '',
    honors: [],
    moments: [],
    certificates: [],
    momentUrls: [],
    certUrls: [],
    viewerVisible: false,
    viewerUrls: [],
    viewerCurrent: 0,
    honorForm: {
      visible: false,
      mode: 'add',
      index: -1,
      icon: '',
      name: '',
      summary: '',
    },
    dragMomentIndex: -1,
    dragCertIndex: -1,
    maxPhotos: MAX_PHOTOS,
    submitting: false,
  },

  onLoad() {
    this.loadHero();
  },

  onShow() {
    try {
      const result = wx.getStorageSync(BIO_RESULT);
      if (result !== '' && result != null) {
        wx.removeStorageSync(BIO_RESULT);
        this.setData({ aboutMe: result });
        return;
      }
    } catch (e) {
      /* ignore */
    }
    if (!this.data.hero) this.loadHero();
  },

  buildPatch() {
    return {
      about_me: this.data.aboutMe,
      past_honors: this.data.honors.map(({ id, ...h }) => h),
      honors_count: this.data.honors.length,
      moments: this.data.moments.map((m) => m.url),
      certificates: this.data.certificates.map((c) => ({
        name: c.name,
        image: c.image,
      })),
    };
  },

  resolveHeroId() {
    return data
      .getHeroApplyStatus()
      .then((status) => {
        if (status?.status === 'approved') {
          const id = status.hero_id || status.application?.hero_id;
          if (id) return String(id);
        }
        return FALLBACK_HERO_ID;
      })
      .catch(() => FALLBACK_HERO_ID);
  },

  loadHero() {
    this.resolveHeroId().then((heroId) => {
      this._heroId = heroId;
      return data.getHeroById(heroId).then((hero) => {
        if (!hero) {
          wx.showToast({ title: '资料加载失败', icon: 'none' });
          return;
        }
        const moments = withMediaIds(hero.moments, 'moment');
        const certificates = withMediaIds(hero.certificates, 'cert');
        this.setData({
          hero: {
            ...hero,
            name: hero.nickname || hero.name || '',
          },
          heroId,
          subtitle: buildSubtitle(hero),
          detailTags: buildDetailTags(hero),
          stars: buildStars(hero.rating),
          aboutMe: hero.about_me || hero.bio || '',
          honors: withHonorIds(hero.past_honors),
          moments,
          certificates,
          momentUrls: moments.map((m) => m.url),
          certUrls: certificates.map((c) => c.image),
        });
      });
    });
  },

  noop() {},

  onSubmitChange() {
    if (this.data.submitting) return;
    const heroId = this._heroId || this.data.heroId || FALLBACK_HERO_ID;
    this.setData({ submitting: true });
    data
      .submitProfileChange(heroId, this.buildPatch(), 'profile')
      .then(() => {
        wx.showToast({ title: '已提交审核', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '提交失败，请检查本地 API', icon: 'none' });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  },

  onEditAbout() {
    wx.setStorageSync(BIO_STORAGE, this.data.aboutMe);
    wx.navigateTo({ url: '/pages/bio-edit/bio-edit?from=hero-profile&field=about' });
  },

  onAddHonor() {
    this.setData({
      honorForm: { visible: true, mode: 'add', index: -1, icon: '/assets/icons/trophy.png', name: '', summary: '' },
    });
  },

  onEditHonor(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.honors[index];
    if (!item) return;
    this.setData({
      honorForm: {
        visible: true,
        mode: 'edit',
        index,
        icon: item.icon,
        name: item.name,
        summary: item.summary,
      },
    });
  },

  onDeleteHonor(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.honors[index];
    if (!item) return;
    wx.showModal({
      title: '删除荣誉',
      content: `确定删除「${item.name}」？`,
      confirmColor: '#1b579c',
      success: (res) => {
        if (!res.confirm) return;
        const honors = this.data.honors.filter((_, i) => i !== index);
        this.setData({ honors });
        wx.showToast({ title: '已删除', icon: 'success' });
      },
    });
  },

  onHonorFormInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`honorForm.${field}`]: e.detail.value });
  },

  onHonorFormClose() {
    this.setData({ 'honorForm.visible': false });
  },

  onHonorFormSave() {
    const { honorForm, honors } = this.data;
    const { icon, name, summary, mode, index } = honorForm;
    if (!name.trim()) {
      wx.showToast({ title: '请填写荣誉名称', icon: 'none' });
      return;
    }
    const item = {
      id: mode === 'edit' ? honors[index].id : `honor-${Date.now()}`,
      icon: icon || '/assets/icons/trophy.png',
      name: name.trim(),
      summary: (summary || '').trim(),
    };
    const next = [...honors];
    if (mode === 'edit' && index >= 0) next[index] = item;
    else next.push(item);
    this.setData({ honors: next, 'honorForm.visible': false });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  onAddMoment() {
    const remain = MAX_PHOTOS - this.data.moments.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多添加9张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const added = (res.tempFiles || []).slice(0, remain).map((f, i) => ({
          id: `moment-${Date.now()}-${i}`,
          url: f.tempFilePath,
          isLocal: true,
        }));
        const moments = [...this.data.moments, ...added].slice(0, MAX_PHOTOS);
        this.setData({
          moments,
          momentUrls: moments.map((m) => m.url),
        });
      },
    });
  },

  onDeleteMoment(e) {
    const { index } = e.currentTarget.dataset;
    const moments = this.data.moments.filter((_, i) => i !== index);
    this.setData({ moments, momentUrls: moments.map((m) => m.url) });
  },

  onMomentLongPress(e) {
    this.setData({ dragMomentIndex: Number(e.currentTarget.dataset.index) });
    wx.vibrateShort({ type: 'light' });
  },

  onMomentTouchMove(e) {
    if (this.data.dragMomentIndex < 0) return;
  },

  onMomentTouchEnd(e) {
    const from = this.data.dragMomentIndex;
    const to = Number(e.currentTarget.dataset.index);
    if (from >= 0 && to >= 0 && from !== to) {
      const moments = [...this.data.moments];
      const [item] = moments.splice(from, 1);
      moments.splice(to, 0, item);
      this.setData({ moments, momentUrls: moments.map((m) => m.url) });
    }
    this.setData({ dragMomentIndex: -1 });
  },

  onAddCert() {
    const remain = MAX_PHOTOS - this.data.certificates.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多添加9张证书', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const base = this.data.certificates.length;
        const added = (res.tempFiles || []).slice(0, remain).map((f, i) => ({
          id: `cert-${Date.now()}-${i}`,
          image: f.tempFilePath,
          url: f.tempFilePath,
          name: `证书${base + i + 1}`,
          isLocal: true,
        }));
        const certificates = [...this.data.certificates, ...added].slice(0, MAX_PHOTOS);
        this.setData({
          certificates,
          certUrls: certificates.map((c) => c.image),
        });
      },
    });
  },

  onDeleteCert(e) {
    const { index } = e.currentTarget.dataset;
    const certificates = this.data.certificates.filter((_, i) => i !== index);
    this.setData({ certificates, certUrls: certificates.map((c) => c.image) });
  },

  onCertLongPress(e) {
    this.setData({ dragCertIndex: Number(e.currentTarget.dataset.index) });
    wx.vibrateShort({ type: 'light' });
  },

  onCertTouchMove(e) {
    if (this.data.dragCertIndex < 0) return;
  },

  onCertTouchEnd(e) {
    const from = this.data.dragCertIndex;
    const to = Number(e.currentTarget.dataset.index);
    if (from >= 0 && to >= 0 && from !== to) {
      const certificates = [...this.data.certificates];
      const [item] = certificates.splice(from, 1);
      certificates.splice(to, 0, item);
      this.setData({ certificates, certUrls: certificates.map((c) => c.image) });
    }
    this.setData({ dragCertIndex: -1 });
  },

  openViewer(urls, current) {
    if (!urls || !urls.length) return;
    const index = Math.max(0, urls.indexOf(current));
    this.setData({ viewerVisible: true, viewerUrls: urls, viewerCurrent: index });
  },

  onPreviewMoment(e) {
    if (this.data.dragMomentIndex >= 0) return;
    const { index } = e.currentTarget.dataset;
    const item = this.data.moments[index];
    if (item) this.openViewer(this.data.momentUrls, item.url);
  },

  onPreviewCert(e) {
    if (this.data.dragCertIndex >= 0) return;
    const { index } = e.currentTarget.dataset;
    const item = this.data.certificates[index];
    if (item) this.openViewer(this.data.certUrls, item.image);
  },

  onViewerClose() {
    this.setData({ viewerVisible: false });
  },

  onViewerChange(e) {
    this.setData({ viewerCurrent: e.detail.current });
  },
});
