function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

Component({
  properties: {
    visible: { type: Boolean, value: false },
    hero: { type: Object, value: null },
    heroId: { type: String, value: '' },
  },

  data: {
    posterVisible: false,
    posterPath: '',
  },

  methods: {
    noop() {},

    onClose() {
      this.triggerEvent('close');
    },

    onClosePoster() {
      this.setData({ posterVisible: false, posterPath: '' });
    },

    onPosterTap() {
      const { hero } = this.data;
      if (!hero) return;
      this.onClose();
      wx.showLoading({ title: '生成海报中' });
      this.drawPoster(hero)
        .then((path) => {
          wx.hideLoading();
          this.setData({ posterPath: path, posterVisible: true });
        })
        .catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '海报生成失败', icon: 'none' });
        });
    },

    drawPoster(hero) {
      return new Promise((resolve, reject) => {
        const query = this.createSelectorQuery();
        query
          .select('#heroPosterCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0] || !res[0].node) {
              reject(new Error('canvas not found'));
              return;
            }
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = wx.getSystemInfoSync().pixelRatio || 2;
            const width = 300;
            const height = 480;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            const grd = ctx.createLinearGradient(0, 0, width, height);
            grd.addColorStop(0, '#dbe6ff');
            grd.addColorStop(0.55, '#a8c4f5');
            grd.addColorStop(1, '#7ba3e8');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#fff';
            roundRect(ctx, 24, 72, width - 48, height - 120, 16);
            ctx.fill();

            ctx.fillStyle = '#a8c4f5';
            ctx.beginPath();
            ctx.arc(width / 2, 132, 44, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((hero.name || '教练').slice(0, 1), width / 2, 132);

            ctx.fillStyle = '#222';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(hero.name || '教练', width / 2, 200);

            const subtitle = `${(hero.project_types || []).join(' · ')} · ${hero.years_exp || ''}年经验`;
            ctx.fillStyle = '#666';
            ctx.font = '13px sans-serif';
            ctx.fillText(subtitle, width / 2, 226);

            ctx.fillStyle = '#1b579c';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`★ ${hero.rating || '-'}`, width / 2, 254);

            const tags = [...(hero.honor_titles || []), ...(hero.cert_badges || [])].slice(0, 3);
            ctx.fillStyle = '#444';
            ctx.font = '12px sans-serif';
            tags.forEach((tag, i) => {
              ctx.fillText(tag, width / 2, 282 + i * 22);
            });

            const bio = (hero.about_me || hero.bio || '').slice(0, 48);
            if (bio) {
              ctx.fillStyle = '#888';
              ctx.font = '11px sans-serif';
              ctx.textAlign = 'left';
              const lines = wrapText(ctx, bio, width - 80);
              lines.forEach((line, i) => {
                ctx.fillText(line, 40, 350 + i * 18);
              });
            }

            ctx.textAlign = 'center';
            ctx.fillStyle = '#1b579c';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('英雄广场', width / 2, height - 72);
            ctx.fillStyle = '#999';
            ctx.font = '11px sans-serif';
            ctx.fillText('长按识别小程序，查看教练详情', width / 2, height - 52);

            wx.canvasToTempFilePath({
              canvas,
              width,
              height,
              destWidth: width * dpr,
              destHeight: height * dpr,
              success: (r) => resolve(r.tempFilePath),
              fail: reject,
            });
          });
      });
    },

    onSavePoster() {
      const { posterPath } = this.data;
      if (!posterPath) return;
      wx.saveImageToPhotosAlbum({
        filePath: posterPath,
        success: () => wx.showToast({ title: '已保存到相册' }),
        fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
      });
    },

    onSharePosterImage() {
      const { posterPath } = this.data;
      if (!posterPath) return;
      if (wx.showShareImageMenu) {
        wx.showShareImageMenu({
          path: posterPath,
          fail: () => wx.showToast({ title: '分享失败', icon: 'none' }),
        });
        return;
      }
      wx.showToast({ title: '请长按海报图片分享', icon: 'none' });
    },
  },
});
