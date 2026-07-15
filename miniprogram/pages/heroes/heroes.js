const data = require('../../utils/data.js');

Page({
  data: {
    keyword: '',
    heroes: [],
    loading: false,
    /** plaza | search | '' */
    emptyKind: '',
  },

  _searchTimer: null,
  _loadSeq: 0,

  onLoad() {
    this.loadHeroes();
  },

  onShow() {
    this.loadHeroes();
  },

  onUnload() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
  },

  onPullDownRefresh() {
    this.loadHeroes().finally(() => wx.stopPullDownRefresh());
  },

  resolveEmptyKind(list) {
    if (list && list.length) return '';
    const keyword = (this.data.keyword || '').trim();
    return keyword ? 'search' : 'plaza';
  },

  loadHeroes() {
    const seq = ++this._loadSeq;
    this.setData({ loading: true });
    return data
      .getHeroes({
        keyword: this.data.keyword,
        project_type: '全部',
        sort_by: 'default',
        years_range: '全部',
      })
      .then((list) => {
        if (seq !== this._loadSeq) return;
        const heroes = list || [];
        this.setData({
          heroes,
          loading: false,
          emptyKind: this.resolveEmptyKind(heroes),
        });
      })
      .catch(() => {
        if (seq !== this._loadSeq) return;
        this.setData({
          heroes: [],
          loading: false,
          emptyKind: this.resolveEmptyKind([]),
        });
      });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this._searchTimer) clearTimeout(this._searchTimer);
    // 实时查询：下一帧拉取，避免同一次输入重复请求
    this._searchTimer = setTimeout(() => this.loadHeroes(), 0);
  },

  onSearchConfirm() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this.loadHeroes();
  },

  onSearchClear() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    try {
      wx.hideKeyboard();
    } catch (_) {
      /* ignore */
    }
    this.setData({ keyword: '' }, () => this.loadHeroes());
  },

  onHeroTap(e) {
    const id = e.detail && e.detail.hero_id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/hero-detail/hero-detail?id=${id}` });
  },
});
