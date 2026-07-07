Component({
  properties: {
    title: { type: String, value: '' },
    showMore: { type: Boolean, value: true },
    moreText: { type: String, value: '查看更多' },
  },
  methods: {
    onMoreTap() {
      this.triggerEvent('more');
    },
  },
});
