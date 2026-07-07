/** 我的课程列表排序 */

function parseIso(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function sortByStartAsc(a, b) {
  const ta = parseIso(a.start_at);
  const tb = parseIso(b.start_at);
  return (ta ?? Infinity) - (tb ?? Infinity);
}

function sortByEndDesc(a, b) {
  const ta = parseIso(a.end_at);
  const tb = parseIso(b.end_at);
  return (tb ?? -Infinity) - (ta ?? -Infinity);
}

function sortMyCourseLists(lists) {
  const src = lists || {};
  return {
    active: [...(src.active || [])].sort(sortByStartAsc),
    ended: [...(src.ended || [])].sort(sortByEndDesc),
  };
}

module.exports = {
  sortMyCourseLists,
};
