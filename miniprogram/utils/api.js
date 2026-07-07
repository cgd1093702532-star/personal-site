/** 本地 API 客户端 · 小程序 */

const API_BASE = 'http://127.0.0.1:8787';

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${path}`,
      method: method || 'GET',
      data: data || {},
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error((res.data && res.data.error) || `HTTP ${res.statusCode}`));
        }
      },
      fail: reject,
    });
  });
}

function checkAvailable() {
  return request('/api/health')
    .then(() => true)
    .catch(() => false);
}

module.exports = {
  API_BASE,
  request,
  checkAvailable,
};
