const data = require('../../utils/data.js');
const formUtil = require('../../utils/recruitment-form.js');

const DRAFT_KEY = 'recruitment-event-draft';

Page({
  data: {
    audienceOptions: formUtil.AUDIENCE_OPTIONS,
    audienceMap: {},
    form: { ...formUtil.EMPTY_FORM },
    draftRecruitId: '',
    draftItem: null,
  },

  onLoad(options) {
    if (options.type === 'event') {
      this.setData({ 'form.type': 'event' });
    }
    if (options.draft) {
      data.getRecruitmentById(options.draft).then((item) => {
        if (!item) {
          this.loadDraft();
          return;
        }
        const form = formUtil.itemToForm(item);
        this.setData({
          form,
          audienceMap: formUtil.buildAudienceMap(form.audience),
          draftRecruitId: item.recruit_id || '',
          draftItem: item,
        });
      });
      return;
    }
    this.loadDraft();
  },

  loadDraft() {
    try {
      const draft = wx.getStorageSync(DRAFT_KEY);
      if (!draft) return;
      const audience = draft.audience || [];
      this.setData({
        form: { ...this.data.form, ...draft, audience },
        audienceMap: formUtil.buildAudienceMap(audience),
      });
    } catch (e) {
      /* ignore */
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onTimeChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onAudienceToggle(e) {
    const { audience } = e.currentTarget.dataset;
    const map = { ...this.data.audienceMap };
    const list = [...this.data.form.audience];
    if (map[audience]) {
      delete map[audience];
      const idx = list.indexOf(audience);
      if (idx >= 0) list.splice(idx, 1);
    } else {
      map[audience] = true;
      list.push(audience);
    }
    this.setData({ audienceMap: map, 'form.audience': list });
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ 'form.location': res.name || res.address || '' });
      },
      fail: () => {
        wx.showToast({ title: '未选择地点', icon: 'none' });
      },
    });
  },

  onChooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (file && file.tempFilePath) {
          this.setData({ 'form.cover': file.tempFilePath });
        }
      },
    });
  },

  validate(forPublish) {
    const result = formUtil.validateForm(this.data.form, forPublish);
    if (!result.ok) {
      wx.showToast({ title: result.message, icon: 'none' });
      return false;
    }
    return true;
  },

  onSaveDraft() {
    if (!this.validate(false)) return;
    const item = formUtil.formToRecruitment(this.data.form, this.data.draftItem);
    item.displayStatus = 'draft';
    item.listTab = 'draft';
    const save = this.data.draftRecruitId
      ? data.updateRecruitment(this.data.draftRecruitId, { ...item, scope: 'mine_draft' })
      : data.createRecruitment(item, 'draft');
    save
      .then((saved) => {
        const recruitId = (saved && saved.recruit_id) || item.recruit_id;
        this.setData({ draftRecruitId: recruitId, draftItem: saved || item });
        try {
          wx.setStorageSync(DRAFT_KEY, this.data.form);
        } catch (e) {
          /* ignore */
        }
        wx.showToast({ title: '草稿已保存', icon: 'success' });
        setTimeout(
          () => wx.redirectTo({ url: '/pages/my-recruitments/my-recruitments?tab=draft' }),
          800,
        );
      })
      .catch(() => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },

  onSubmit() {
    if (!this.validate(true)) return;
    try {
      wx.removeStorageSync(DRAFT_KEY);
    } catch (e) {
      /* ignore */
    }
    const item = formUtil.formToRecruitment(this.data.form, this.data.draftItem);
    const status = formUtil.resolvePublishedStatus(item);
    item.displayStatus = status.displayStatus;
    item.listTab = status.listTab;
    const save = this.data.draftRecruitId
      ? data.updateRecruitment(this.data.draftRecruitId, { ...item, scope: status.scope })
      : data.createRecruitment(item, status.listTab);
    save
      .then(() => {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(
          () =>
            wx.redirectTo({
              url: `/pages/my-recruitments/my-recruitments?tab=${status.listTab}`,
            }),
          800,
        );
      })
      .catch(() => {
        wx.showToast({ title: '发布失败', icon: 'none' });
      });
  },
});
