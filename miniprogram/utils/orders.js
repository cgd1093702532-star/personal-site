/** 订单演示数据（小程序） */
const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_pay', label: '待付款' },
  { key: 'pending_ship', label: '待发货' },
  { key: 'pending_use', label: '待使用/待收货' },
  { key: 'completed', label: '已完成' },
];

const STATUS_LABEL = {
  pending_pay: '待付款',
  pending_ship: '待发货',
  pending_use: '待使用',
  completed: '已完成',
};

const ORDERS = [
  {
    id: 'o1',
    shop: '浪浪鲤',
    status: 'pending_use',
    title: '企业家杯月赛',
    price: 5200,
    qty: 1,
    paid: 5200,
    cover: '/assets/images/event.jpg',
    showVoucher: true,
    timeRange: '2026/08/02 14:00–2027/08/02 17:00',
    location: '北京市北京市丰台区一方剧场',
    voucherCode: '23114214652405485',
    orderNo: '2607211543073890001',
    payMethod: '在线支付',
    createdAt: '2026-07-21 15:43:07',
    paidAt: '2026-07-21 15:43:07',
  },
  {
    id: 'o2',
    shop: '浪浪鲤',
    status: 'completed',
    title: '周末帆船体验课',
    price: 680,
    qty: 1,
    paid: 680,
    cover: '/assets/images/course.jpg',
    showVoucher: false,
    showRate: true,
    voucherRedeemed: true,
    timeRange: '2026/06/15 09:00–2026/06/15 17:00',
    location: '北京市朝阳区奥帆中心',
    voucherCode: '23114214652409999',
    orderNo: '2606151030123450002',
    payMethod: '在线支付',
    createdAt: '2026-06-10 10:30:12',
    paidAt: '2026-06-10 10:30:15',
  },
  {
    id: 'o3',
    shop: '浪浪鲤',
    status: 'completed',
    title: '城市定向挑战赛',
    price: 198,
    qty: 1,
    paid: 198,
    cover: '/assets/images/event.jpg',
    showVoucher: false,
    showRate: false,
    ratedScore: 5,
    voucherRedeemed: true,
    timeRange: '2026/05/18 08:00–2026/05/18 18:00',
    location: '北京市海淀区奥林匹克森林公园',
    voucherCode: '23114214652408888',
    orderNo: '2605180910456780003',
    payMethod: '在线支付',
    createdAt: '2026-05-12 09:10:45',
    paidAt: '2026-05-12 09:10:48',
  },
];

function formatMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
}

function normalizeTab(raw) {
  const key = String(raw || 'all');
  return TABS.some((t) => t.key === key) ? key : 'all';
}

function listOrders(tabKey) {
  const key = normalizeTab(tabKey);
  if (key === 'all') return ORDERS.slice();
  return ORDERS.filter((o) => o.status === key);
}

function getOrderById(id) {
  return ORDERS.find((o) => o.id === String(id)) || null;
}

function enrichOrder(order) {
  return {
    ...order,
    statusLabel: STATUS_LABEL[order.status] || order.status,
    priceText: formatMoney(order.price),
    paidText: formatMoney(order.paid),
  };
}

module.exports = {
  TABS,
  STATUS_LABEL,
  ORDERS,
  formatMoney,
  normalizeTab,
  listOrders,
  getOrderById,
  enrichOrder,
};
