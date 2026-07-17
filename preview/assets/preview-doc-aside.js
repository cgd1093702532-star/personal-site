/** 预览页右侧需求文档面板：加载 Markdown，并随 SPA 页面切换联动 */
(function () {
  const FALLBACK =
    '无法加载需求文档。请确认本地预览已启动，且文件存在于 preview/docs/ 下（运行 python3 preview/build-pages.py 可同步）。';

  let loadSeq = 0;
  let asideEl = null;
  /** @type {Record<string, Record<string, string>>|null} */
  let imageAltMap = null;

  async function loadImageAltMap() {
    if (imageAltMap) return imageAltMap;
    try {
      const url = new URL('../assets/doc-image-alts.json', window.location.href).href;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        imageAltMap = {};
        return imageAltMap;
      }
      const data = await res.json();
      imageAltMap = data.byDoc || {};
    } catch (_) {
      imageAltMap = {};
    }
    return imageAltMap;
  }

  function currentDocFileName(docUrl) {
    try {
      const name = new URL(docUrl, window.location.href).pathname.split('/').pop() || '';
      return decodeURIComponent(name);
    } catch (_) {
      return '';
    }
  }

  function imgTagFromSrc(src, alt, docUrl, cacheToken) {
    let href = src;
    try {
      const u = new URL(src, docUrl);
      if (cacheToken) u.searchParams.set('v', cacheToken);
      href = u.href;
    } catch (_) {
      /* keep */
    }
    return `<p><img class="preview-doc-aside__shot" src="${escapeHtml(href)}" alt="${escapeHtml(alt)}" loading="lazy" /></p>`;
  }

  /** 纯文字 alt 兜底：配图语法被收成「教练不存在空态」或粘成一行时仍能出图 */
  function resolveBareAltImage(line, docUrl, cacheToken) {
    const alt = String(line || '').trim();
    if (!alt || alt.includes('![') || !imageAltMap) return null;
    const docName = currentDocFileName(docUrl);
    const map = imageAltMap[docName] || {};
    if (map[alt]) return imgTagFromSrc(map[alt], alt, docUrl, cacheToken);

    // 粘连行：如「禁用状态预览禁用 · 查看原因弹窗」
    const alts = Object.keys(map).sort((a, b) => b.length - a.length);
    let remaining = alt;
    const chunks = [];
    while (remaining) {
      const hit = alts.find((a) => remaining.startsWith(a));
      if (!hit) break;
      chunks.push(imgTagFromSrc(map[hit], hit, docUrl, cacheToken));
      remaining = remaining.slice(hit.length).replace(/^[\s\u3000]+/, '');
    }
    if (chunks.length >= 2 && !remaining) return chunks.join('');
    return null;
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 需求文档协作标记：【重复】【矛盾】→ 彩色高亮（勿覆盖用户原文，仅标出） */
  function applyDocFlags(escapedHtml) {
    return String(escapedHtml || '')
      .replace(
        /【矛盾】([^【<]*)/g,
        '<mark class="preview-doc-aside__flag preview-doc-aside__flag--conflict" title="相互矛盾，需产品确认">【矛盾】$1</mark>',
      )
      .replace(
        /【重复】([^【<]*)/g,
        '<mark class="preview-doc-aside__flag preview-doc-aside__flag--dup" title="重复描述，供产品删并">【重复】$1</mark>',
      );
  }

  function calloutClassFromText(text) {
    const t = String(text || '');
    if (t.includes('【矛盾】')) return 'preview-doc-aside__callout preview-doc-aside__callout--conflict';
    if (t.includes('【重复】')) return 'preview-doc-aside__callout preview-doc-aside__callout--dup';
    return '';
  }

  function inlineFormat(text, docBaseUrl, cacheToken) {
    let s = escapeHtml(text);
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      let href = src;
      try {
        const u = new URL(src, docBaseUrl);
        if (cacheToken) u.searchParams.set('v', cacheToken);
        href = u.href;
      } catch (_) {
        /* keep raw */
      }
      return `<img class="preview-doc-aside__shot" src="${escapeHtml(href)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
    });
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${label}</a>`;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    return applyDocFlags(s);
  }

  /** 文首元信息：有 http(s) 地址时可点击；「设计中」等占位不可点 */
  function formatMetaLine(text, docBaseUrl, cacheToken) {
    const raw = String(text || '').trim();
    const matched = /^(最后更新|预览地址|UI设计图地址|设计图地址)\s*[：:]\s*(.*)$/.exec(raw);
    if (!matched) return inlineFormat(raw, docBaseUrl, cacheToken);

    const label = matched[1] === '设计图地址' ? 'UI设计图地址' : matched[1];
    const value = (matched[2] || '').trim();
    const labelHtml = `<span class="preview-doc-aside__meta-label">${escapeHtml(label)}：</span>`;

    if (!value || value === '设计中' || value === '暂无' || value === '-') {
      return `${labelHtml}<span class="preview-doc-aside__meta-value">${escapeHtml(value || '设计中')}</span>`;
    }

    const mdLink = /^\[([^\]]*)\]\(([^)]+)\)$/.exec(value);
    if (mdLink) {
      const href = mdLink[2].trim();
      const text = (mdLink[1] || href).trim() || href;
      if (/^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('../')) {
        return `${labelHtml}<a class="preview-doc-aside__meta-link" href="${escapeHtml(
          href,
        )}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
      }
    }

    if (/^https?:\/\/\S+$/i.test(value)) {
      return `${labelHtml}<a class="preview-doc-aside__meta-link" href="${escapeHtml(
        value,
      )}" target="_blank" rel="noopener">${escapeHtml(value)}</a>`;
    }

    // 文案里夹带链接：先走常规 markdown，再给裸 URL 补链接
    let valueHtml = inlineFormat(value, docBaseUrl, cacheToken);
    valueHtml = valueHtml.replace(
      /(^|[^"'>])(https?:\/\/[^\s<]+)/g,
      (_, prefix, url) =>
        `${prefix}<a class="preview-doc-aside__meta-link" href="${escapeHtml(
          url,
        )}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`,
    );
    return `${labelHtml}<span class="preview-doc-aside__meta-value">${valueHtml}</span>`;
  }

  function isMetaHeaderLine(part) {
    return /^(最后更新|预览地址|UI设计图地址|设计图地址)\s*[：:]/.test(String(part || '').trim());
  }

  function isUiDesignMetaLine(part) {
    return /^(UI设计图地址|设计图地址)\s*[：:]/.test(String(part || '').trim());
  }

  /** 正文标题图标：按章节语义选更醒目的 primary 图标 */
  function headingIconFor(title, level) {
    const t = String(title || '').trim();
    const icon = (name) => `../assets/icons/${name}`;
    if (/^1(\.|．|、|\s)|业务目标/.test(t)) return icon('star-primary.png');
    if (/^2(\.|．|、|\s)|登录|身份/.test(t)) return icon('user-primary.png');
    if (/^3(\.|．|、|\s)|详细描述|页面详细/.test(t)) return icon('list-primary.png');
    if (/^4(\.|．|、|\s)|常见路径|路径/.test(t)) return icon('location-primary.png');
    if (/^5(\.|．|、|\s)|相关页面|相关/.test(t)) return icon('share.png');
    if (/^6(\.|．|、|\s)|规则|验收/.test(t)) return icon('check-primary.png');
    if (/^7(\.|．|、|\s)|变更/.test(t)) return icon('calendar-primary.png');
    if (/说明/.test(t)) return icon('announce-primary.png');
    if (level <= 2) return icon('medal-primary.png');
    if (level === 3) return icon('edit-primary.png');
    return icon('plus-primary.png');
  }

  /**
   * 【铁律】表格序号分点必须换行（永久，勿弱化/删除）。
   * 真源 md 须写显式 &lt;br&gt;；此处再按「1、」「1.1、」「1. 」「场景 1：」自动断行兜底。
   * 与 scripts/check-doc-table-linebreaks.py 对齐：只在第 2 个及之后的序号前断行。
   */
  function formatTableCell(text, docBaseUrl, cacheToken) {
    let raw = String(text ?? '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, '\n') // 控制符→换行
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n');

    const markerRe =
      /\d+\.\d+[、]|(?<![\d.])\d+[、]|(?<!\d)\d+\.\s+|场景\s*\d+\s*[：:]/g;
    const spans = [];
    let m;
    while ((m = markerRe.exec(raw)) !== null) {
      spans.push(m.index);
    }
    // 只在第 2 个及之后的序号前插入换行（避免 **1、 被拆成 ** + 1、）
    for (let i = spans.length - 1; i >= 1; i -= 1) {
      const start = spans[i];
      if (start <= 0 || raw[start - 1] === '\n') continue;
      raw = `${raw.slice(0, start)}\n${raw.slice(start)}`;
    }

    return raw
      .split('\n')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => inlineFormat(part, docBaseUrl, cacheToken))
      .join('<br>');
  }

  function isTableSep(line) {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim());
  }

  function parseTableRow(line) {
    const raw = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return raw.split('|').map((c) => c.trim());
  }

  /** 预览协作面板隐藏「§6 规则补充 / 实现对照」整章，源 md 仍保留。 */
  function filterPreviewMarkdown(md, scope) {
    const hideTitles = [/^\s*6(\.|．|、|\s)/, /实现对照/, /规则补充/];
    const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let skipping = false;
    let skipLevel = 99;

    for (const line of lines) {
      const heading = /^(#{1,6})\s+(.+)$/.exec(line.trim());
      if (heading) {
        const level = heading[1].length;
        const title = heading[2].trim();
        /* intro：只保留文首说明，遇到第一个二级标题即止 */
        if (scope === 'intro' && level === 2) {
          break;
        }
        if (skipping && level <= skipLevel) {
          skipping = false;
        }
        if (!skipping && hideTitles.some((re) => re.test(title))) {
          skipping = true;
          skipLevel = level;
          continue;
        }
      }
      if (!skipping) out.push(line);
    }
    return out.join('\n').trim();
  }

  function resolveDocScope(explicit) {
    if (explicit) return explicit;
    return (
      document.body?.dataset?.previewDocScope ||
      document.querySelector('.device')?.dataset?.previewDocScope ||
      ''
    );
  }

  function renderMarkdown(md, docBaseUrl, cacheToken) {
    const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let i = 0;
    let inList = false;
    let firstBlockquote = true;
    const fmt = (t) => inlineFormat(t, docBaseUrl, cacheToken);
    const cell = (t) => formatTableCell(t, docBaseUrl, cacheToken);

    const closeList = () => {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        closeList();
        i += 1;
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        closeList();
        html.push('<hr />');
        i += 1;
        continue;
      }

      const fence = /^```(\w+)?\s*$/.exec(trimmed);
      if (fence) {
        closeList();
        const lang = (fence[1] || '').toLowerCase();
        const codeLines = [];
        i += 1;
        while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i += 1;
        }
        i += 1;
        const code = codeLines.join('\n');
        if (lang === 'mermaid') {
          html.push(`<pre class="mermaid">${escapeHtml(code)}</pre>`);
        } else {
          html.push(`<pre class="preview-doc-aside__code"><code>${escapeHtml(code)}</code></pre>`);
        }
        continue;
      }

      const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
      if (heading) {
        closeList();
        const level = heading[1].length;
        const title = heading[2].trim();
        const icon = headingIconFor(title, level);
        const iconHtml = icon
          ? `<img class="preview-doc-aside__heading-icon" src="${escapeHtml(icon)}" alt="" aria-hidden="true" />`
          : '';
        html.push(
          `<h${level} class="preview-doc-aside__heading preview-doc-aside__heading--h${level}">${iconHtml}<span class="preview-doc-aside__heading-text">${fmt(
            title,
          )}</span></h${level}>`,
        );
        i += 1;
        continue;
      }

      if (trimmed.startsWith('>')) {
        closeList();
        const parts = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          parts.push(lines[i].trim().replace(/^>\s?/, ''));
          i += 1;
        }
        if (firstBlockquote) {
          firstBlockquote = false;
          const kept = parts.filter((part) => isMetaHeaderLine(part));
          if (!kept.some((part) => isUiDesignMetaLine(part))) {
            const previewIdx = kept.findIndex((part) => /^预览地址\s*[：:]/.test(part.trim()));
            const uiLine = 'UI设计图地址：设计中';
            if (previewIdx >= 0) kept.splice(previewIdx + 1, 0, uiLine);
            else kept.push(uiLine);
          }
          if (kept.length) {
            html.push(
              `<blockquote class="preview-doc-aside__doc-meta">${kept
                .map((part) => `<p>${formatMetaLine(part, docBaseUrl, cacheToken)}</p>`)
                .join('')}</blockquote>`,
            );
          }
          continue;
        }
        html.push(`<blockquote class="${calloutClassFromText(parts.join(' ')) || ''}"><p>${fmt(parts.join(' '))}</p></blockquote>`);
        continue;
      }

      if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        closeList();
        const headers = parseTableRow(trimmed);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(parseTableRow(lines[i]));
          i += 1;
        }
        html.push('<div class="preview-doc-aside__table-wrap"><table>');
        html.push(
          `<thead><tr>${headers.map((h) => `<th>${cell(h)}</th>`).join('')}</tr></thead>`,
        );
        html.push('<tbody>');
        rows.forEach((row) => {
          html.push(
            `<tr>${row.map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`,
          );
        });
        html.push('</tbody></table></div>');
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (!inList) {
          html.push('<ul>');
          inList = true;
        }
        html.push(`<li>${fmt(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
        i += 1;
        continue;
      }

      closeList();
      const bareImg = resolveBareAltImage(trimmed, docBaseUrl, cacheToken);
      if (bareImg) {
        html.push(bareImg);
      } else {
        html.push(`<p>${fmt(trimmed)}</p>`);
      }
      i += 1;
    }
    closeList();
    return html.join('\n');
  }

  function resolveDocUrl(explicit) {
    if (explicit) return explicit;
    const fromBody = document.body?.dataset?.previewDoc;
    const fromDevice = document.querySelector('.device')?.dataset?.previewDoc;
    return fromBody || fromDevice || '';
  }

  async function loadMarkdown(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  /** 用文档内全部配图的 Last-Modified / 体积做缓存破坏，避免只改后几张图仍显示旧截图。 */
  async function resolveShotCacheToken(docBaseUrl, md) {
    const matches = [...String(md || '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
    if (!matches.length) return String(Date.now());
    const parts = [];
    for (const m of matches) {
      try {
        const imgUrl = new URL(m[1], docBaseUrl).href;
        const res = await fetch(imgUrl, { method: 'HEAD', cache: 'no-store' });
        const lastMod = res.headers.get('Last-Modified');
        if (lastMod) {
          parts.push(lastMod.replace(/\s+/g, '_'));
          continue;
        }
        const len = res.headers.get('Content-Length');
        if (len) {
          parts.push(`len-${len}`);
          continue;
        }
      } catch (_) {
        /* fall through */
      }
      parts.push(String(Date.now()));
    }
    return parts.join('__') || String(Date.now());
  }

  function ensurePanel() {
    const device = document.querySelector('.device');
    if (!device) return null;
    document.body.classList.add('has-preview-doc');
    device.classList.add('device--with-doc');

    let aside = device.querySelector('.preview-doc-aside');
    if (aside) {
      aside.hidden = false;
      asideEl = aside;
      return aside;
    }

    aside = document.createElement('aside');
    aside.className = 'preview-doc-aside';
    aside.setAttribute('aria-label', '需求文档');
    aside.innerHTML = `
      <div class="preview-doc-aside__head">
        <div class="preview-doc-aside__title">
          <img class="preview-doc-aside__title-icon" src="../assets/icons/book-primary.png" alt="" aria-hidden="true" />
          <span class="preview-doc-aside__title-text">需求说明</span>
        </div>
        <div class="preview-doc-aside__meta">随左侧预览页切换联动</div>
      </div>
      <div class="preview-doc-aside__body">
        <p class="preview-doc-aside__loading">加载文档中…</p>
      </div>`;
    device.appendChild(aside);
    asideEl = aside;
    return aside;
  }

  function setHeadTitle(aside, title) {
    const textEl = aside?.querySelector('.preview-doc-aside__title-text');
    if (textEl) textEl.textContent = title || '需求说明';
  }

  function hidePanel() {
    document.body.classList.remove('has-preview-doc');
    const device = document.querySelector('.device');
    if (device) device.classList.remove('device--with-doc');
    const aside = asideEl || device?.querySelector('.preview-doc-aside');
    if (aside) aside.hidden = true;
  }

  function loadMermaid() {
    if (window.mermaid) return Promise.resolve(window.mermaid);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      s.onload = () => {
        try {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'loose',
            flowchart: { htmlLabels: true },
          });
          resolve(window.mermaid);
        } catch (err) {
          reject(err);
        }
      };
      s.onerror = () => reject(new Error('mermaid CDN load failed'));
      document.head.appendChild(s);
    });
  }

  async function renderMermaidBlocks(root) {
    const nodes = root.querySelectorAll('pre.mermaid');
    if (!nodes.length) return;
    try {
      const mermaid = await loadMermaid();
      await mermaid.run({ nodes: Array.from(nodes) });
    } catch (err) {
      console.warn('[preview-doc-aside] mermaid', err);
      nodes.forEach((n) => {
        n.classList.add('preview-doc-aside__code');
      });
    }
  }

  async function renderDoc(docUrl, docScope) {
    const seq = ++loadSeq;

    if (!docUrl) {
      hidePanel();
      return;
    }

    const aside = ensurePanel();
    if (!aside) return;
    const body = aside.querySelector('.preview-doc-aside__body');

    body.innerHTML = '<p class="preview-doc-aside__loading">加载文档中…</p>';
    setHeadTitle(aside, '需求说明');

    try {
      await loadImageAltMap();
      const absolute = new URL(docUrl, window.location.href).href;
      const raw = await loadMarkdown(absolute);
      const scope = docScope || resolveDocScope();
      const md = filterPreviewMarkdown(raw, scope);
      const bust = await resolveShotCacheToken(absolute, md);
      if (seq !== loadSeq) return;
      const titleMatch = /^#\s+(.+)$/m.exec(md);
      setHeadTitle(aside, titleMatch ? titleMatch[1].trim() : '需求说明');
      body.innerHTML = renderMarkdown(md, absolute, bust);
      body.scrollTop = 0;
      await renderMermaidBlocks(body);
    } catch (err) {
      if (seq !== loadSeq) return;
      body.innerHTML = `<p class="preview-doc-aside__error">${escapeHtml(FALLBACK)}<br/><small>${escapeHtml(
        String(err.message || err),
      )}</small></p>`;
      console.warn('[preview-doc-aside]', docUrl, err);
    }
  }

  function syncFromPage(explicitDoc, explicitScope) {
    return renderDoc(resolveDocUrl(explicitDoc), explicitScope || resolveDocScope());
  }

  function init() {
    if (!document.querySelector('.device')) return;
    syncFromPage();
    window.addEventListener('preview:navigate', (e) => {
      const next = e?.detail?.previewDoc;
      const scope = e?.detail?.previewDocScope;
      syncFromPage(typeof next === 'string' ? next : undefined, typeof scope === 'string' ? scope : undefined);
    });
  }

  window.PreviewDocAside = { sync: syncFromPage, render: renderDoc };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
