/**
 * 模糊搜索工具
 * 支持：子串匹配、忽略大小写/空格、浆板/桨板等同义字
 */

const SYNONYMS = {
  桨板: ['浆板', 'paddleboard', 'sup'],
  浆板: ['桨板', 'paddleboard', 'sup'],
  帆船: ['sailing', '帆'],
  皮划艇: ['kayak', '皮艇'],
  潜水: ['diving', 'dive'],
  冲浪: ['surf', 'surfing'],
};

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function expandKeyword(keyword) {
  const k = normalize(keyword);
  if (!k) return [];
  const variants = new Set([k]);
  Object.keys(SYNONYMS).forEach((key) => {
    const normKey = normalize(key);
    if (k.includes(normKey) || normKey.includes(k)) {
      variants.add(normKey);
      SYNONYMS[key].forEach((s) => variants.add(normalize(s)));
    }
  });
  return [...variants];
}

/**
 * 判断 text 是否模糊匹配任一 keyword 变体
 */
function fuzzyIncludes(text, keywordVariants) {
  const target = normalize(text);
  if (!target) return false;
  return keywordVariants.some((k) => target.includes(k) || k.includes(target));
}

/**
 * 对记录列表做模糊搜索
 * @param {Array} list
 * @param {string} keyword
 * @param {(item) => string[]} getFields
 */
function fuzzyFilter(list, keyword, getFields) {
  const variants = expandKeyword(keyword);
  if (variants.length === 0) return list;
  return list.filter((item) => {
    const fields = getFields(item);
    return fields.some((field) => fuzzyIncludes(field, variants));
  });
}

module.exports = {
  normalize,
  expandKeyword,
  fuzzyIncludes,
  fuzzyFilter,
};
