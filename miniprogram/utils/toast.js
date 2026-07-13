/** 统一 Toast：页面居中（微信原生 showToast 默认居中） */
function show(title, options) {
  const opts = options || {};
  wx.showToast({
    title: String(title || ''),
    icon: opts.icon || 'none',
    duration: opts.duration || 2000,
    mask: opts.mask === true,
  });
}

function success(title, duration) {
  show(title, { icon: 'success', duration: duration || 2000 });
}

function error(title, duration) {
  show(title, { icon: 'none', duration: duration || 2000 });
}

module.exports = {
  show,
  success,
  error,
};
