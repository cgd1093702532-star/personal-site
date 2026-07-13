const mock = require('../../utils/mock.js');
const data = require('../../utils/data.js');

Page({
  data: {
    keyword: '',
    projectTypes: mock.PROJECT_TYPES,
    sortOptions: mock.SORT_OPTIONS,
    yearsOptions: mock.YEARS_OPTIONS,
    activeType: '全部',
    activeSort: 'default',
    activeYears: '全部',
    filterVisible: false,
    filterActive: false,
    filterCount: 0,
    heroes: [],
    loading: false,
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

  updateFilterActive() {
    const { activeType, activeSort, activeYears } = this.data;
    let filterCount = 0;
    if (activeType !== '全部') filterCount += 1;
    if (activeSort !== 'default') filterCount += 1;
    if (activeYears !== '全部') filterCount += 1;
    this.setData({ filterActive: filterCount > 0, filterCount });
  },

  loadHeroes() {
    const seq = ++this._loadSeq;
    this.setData({ loading: true });
    return data
      .getHeroes({
        keyword: this.data.keyword,
        project_type: this.data.activeType,
        sort_by: this.data.activeSort,
        years_range: this.data.activeYears,
      })
      .then((list) => {
        if (seq !== this._loadSeq) return;
        this.setData({ heroes: list || [], loading: false });
        this.updateFilterActive();
      })
      .catch(() => {
        if (seq !== this._loadSeq) return;
        this.setData({ heroes: [], loading: false });
        this.updateFilterActive();
      });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.loadHeroes(), 300);
  },

  onSearchConfirm() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this.loadHeroes();
  },

  onSearchClear() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this.setData({ keyword: '' }, () => this.loadHeroes());
  },

  onFilterOpen() {
    this.setData({ filterVisible: true });
  },

  onFilterClose() {
    this.setData({ filterVisible: false });
  },

  onFilterReset() {
    this.setData(
      { activeType: '全部', activeSort: 'default', activeYears: '全部' },
      () => this.loadHeroes(),
    );
  },

  noop() {},

  onFilterTap(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ activeType: type }, () => this.loadHeroes());
  },

  onSortTap(e) {
    const { sort } = e.currentTarget.dataset;
    this.setData({ activeSort: sort }, () => this.loadHeroes());
  },

  onYearsTap(e) {
    const { years } = e.currentTarget.dataset;
    this.setData({ activeYears: years }, () => this.loadHeroes());
  },

  onHeroTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/hero-detail/hero-detail?id=${id}` });
  },
});
