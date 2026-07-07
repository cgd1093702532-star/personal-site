Component({
  properties: {
    hero: { type: Object, value: {} },
    layout: { type: String, value: 'scroll' },
  },
  methods: {
    onHeadTap() {
      this.triggerEvent('tap', { hero_id: this.properties.hero.hero_id });
    },

    onRowTap(e) {
      const { type, targetId } = e.currentTarget.dataset;
      if (!targetId) return;
      if (type === 'event') {
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
