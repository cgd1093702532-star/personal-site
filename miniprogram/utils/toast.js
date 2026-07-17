/** 统一 Toast：页面居中；全局黑底白字（微信 icon:none 为黑底白字文案态） */
function show(title, options) {
  const opts = options || {};
  wx.showToast({
    title: String(title || ''),
    icon: 'none',
    duration: opts.duration || 2000,
    mask: opts.mask === true,
  });
}

function success(title, duration) {
  show(title, { duration: duration || 2000 });
}

function error(title, duration) {
  show(title, { duration: duration || 2000 });
}

module.exports = {
  show,
  success,
  error,
};
