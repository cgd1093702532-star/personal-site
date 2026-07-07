const data = require('../../utils/data.js');
const formUtil = require('../../utils/recruitment-form.js');

const DRAFT_KEY = 'recruitment-event-draft';

Page({
  data: {
    recruitId: '',
    sourceItem: null,
    audienceOptions: formUtil.AUDIENCE_OPTIONS,
    audienceMap: {},
    form: { ...formUtil.EMPTY_FORM },
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '缺少招募 ID', icon: 'none' });
      return;
    }
    data.getRecruitmentById(id).then((item) => {
      if (!item) {
        wx.showToast({ title: '招募不存在', icon: 'none' });
        return;
      }
      const form = formUtil.itemToForm(item);
      this.setData({
        recruitId: id,
        sourceItem: item,
        form,
        audienceMap: formUtil.buildAudienceMap(form.audience),
      });
    });
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
    const item = formUtil.formToRecruitment(this.data.form, this.data.sourceItem);
    item.displayStatus = 'draft';
    item.listTab = 'draft';
    data
      .updateRecruitment(this.data.recruitId, item)
      .then(() => {
        try {
          wx.setStorageSync(DRAFT_KEY, { ...this.data.form, recruit_id: this.data.recruitId });
        } catch (e) {
          /* ignore */
        }
        wx.showToast({ title: '草稿已保存', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },

  onSubmit() {
    if (!this.validate(true)) return;
    const item = formUtil.formToRecruitment(this.data.form, this.data.sourceItem);
    data
      .updateRecruitment(this.data.recruitId, item)
      .then(() => {
        try {
          wx.removeStorageSync(DRAFT_KEY);
        } catch (e) {
          /* ignore */
        }
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 800);
      })
      .catch(() => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },
});
