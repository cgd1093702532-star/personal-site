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

function loadCanvasImage(canvas, src) {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawQrPlaceholder(ctx, x, y, size, seedText) {
  const cells = 18;
  const cell = size / cells;
  let seed = [...String(seedText || '英雄广场')].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#111';
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      seed = (seed * 9301 + 49297) % 233280;
      if (seed / 233280 > 0.52) {
        ctx.fillRect(x + col * cell, y + row * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b579c';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('英', x + size / 2, y + size / 2);
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
          .exec(async (res) => {
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

            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);

            const photoX = 16;
            const photoY = 16;
            const photoWidth = width - 32;
            const photoHeight = 300;
            ctx.save();
            roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 16);
            ctx.clip();
            try {
              const avatar = hero.avatar_img || hero.avatar || 'hero-1.jpg';
              const avatarSrc =
                /^https?:|^\//.test(avatar) ? avatar : `/assets/images/${avatar}`;
              const image = await loadCanvasImage(canvas, avatarSrc);
              const imageRatio = image.width / image.height;
              const targetRatio = photoWidth / photoHeight;
              let sx = 0;
              let sy = 0;
              let sw = image.width;
              let sh = image.height;
              if (imageRatio > targetRatio) {
                sw = image.height * targetRatio;
                sx = (image.width - sw) / 2;
              } else {
                sh = image.width / targetRatio;
                sy = (image.height - sh) / 2;
              }
              ctx.drawImage(
                image,
                sx,
                sy,
                sw,
                sh,
                photoX,
                photoY,
                photoWidth,
                photoHeight,
              );
            } catch (_) {
              const grd = ctx.createLinearGradient(0, photoY, 0, photoY + photoHeight);
              grd.addColorStop(0, '#dbe6ff');
              grd.addColorStop(1, '#7ba3e8');
              ctx.fillStyle = grd;
              ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
            }
            ctx.restore();

            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#222';
            ctx.font = '18px sans-serif';
            ctx.fillText(hero.name || hero.nickname || '教练', 16, 350);

            const bio = hero.about_me || hero.bio || '欢迎扫码查看英雄详情';
            ctx.fillStyle = '#999';
            ctx.font = '12px sans-serif';
            const lines = wrapText(ctx, bio, 174);
            lines.forEach((line, index) => {
              ctx.fillText(line, 16, 386 + index * 20);
            });

            drawQrPlaceholder(ctx, 214, 338, 70, hero.name || hero.nickname);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#999';
            ctx.font = '10px sans-serif';
            ctx.fillText('扫码/长按识别', 249, 424);

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
