/** 我的评价列表排序 */

function parseIso(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function sortReviewsByTimeDesc(items) {
  return [...(items || [])].sort((a, b) => {
    const ta = parseIso(a.reviewed_at);
    const tb = parseIso(b.reviewed_at);
    return (tb ?? -Infinity) - (ta ?? -Infinity);
  });
}

module.exports = {
  sortReviewsByTimeDesc,
};
