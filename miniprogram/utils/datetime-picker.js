/** 年月日时分 · 多列选择器工具 */

function pad2(n) {
  return String(n).padStart(2, '0');
}

function buildDateTimeRange(baseYear) {
  const year = baseYear || new Date().getFullYear();
  const years = [];
  for (let y = year - 1; y <= year + 3; y += 1) years.push(String(y));
  const months = Array.from({ length: 12 }, (_, i) => pad2(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => pad2(i + 1));
  const hours = Array.from({ length: 24 }, (_, i) => pad2(i));
  const minutes = Array.from({ length: 60 }, (_, i) => pad2(i));
  return [years, months, days, hours, minutes];
}

function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate();
}

function clampDay(year, month, day) {
  const max = daysInMonth(year, month);
  const d = Number(day) || 1;
  return pad2(Math.min(Math.max(d, 1), max));
}

function dateTimeToIndexes(date, time, range) {
  const years = range[0];
  const [y, m, d] = String(date || '').split('-');
  const [hh, mm] = String(time || '09:00').split(':');
  const year = y || String(new Date().getFullYear());
  const month = pad2(m || 1);
  const day = clampDay(year, month, d || 1);
  const hour = pad2(hh || 9);
  const minute = pad2(mm || 0);
  const yi = Math.max(0, years.indexOf(year));
  return [
    yi >= 0 ? yi : 0,
    Math.max(0, Number(month) - 1),
    Math.max(0, Number(day) - 1),
    Math.max(0, Number(hour)),
    Math.max(0, Number(minute)),
  ];
}

function indexesToDateTime(indexes, range) {
  const [yi, mi, di, hi, mini] = indexes || [0, 0, 0, 0, 0];
  const year = range[0][yi] || String(new Date().getFullYear());
  const month = range[1][mi] || '01';
  const day = clampDay(year, month, range[2][di] || '01');
  const hour = range[3][hi] || '00';
  const minute = range[4][mini] || '00';
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    label: `${year}-${month}-${day} ${hour}:${minute}`,
  };
}

function formatDateTimeLabel(date, time) {
  if (!date) return '';
  return `${date} ${(time || '09:00').slice(0, 5)}`;
}

module.exports = {
  buildDateTimeRange,
  dateTimeToIndexes,
  indexesToDateTime,
  formatDateTimeLabel,
  daysInMonth,
  clampDay,
};
