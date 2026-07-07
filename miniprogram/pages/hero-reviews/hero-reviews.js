const data = require('../../utils/data.js');

Page({
  data: {
    list: [],
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    data.getMyRatings().then((list) => {
      this.setData({ list });
    });
  },
});
