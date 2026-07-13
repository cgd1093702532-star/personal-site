/** M1 本地 Mock 数据，后续替换为 API */

const { fuzzyFilter } = require('./fuzzy.js');

const PROJECT_TYPES = ['全部', '帆船', '皮划艇', '桨板', '潜水', '冲浪'];

const SORT_OPTIONS = [
  { id: 'default', label: '综合排序' },
  { id: 'rating_desc', label: '评分从高到低' },
  { id: 'rating_asc', label: '评分从低到高' },
];

const YEARS_OPTIONS = [
  { id: '全部', label: '不限年限' },
  { id: '1-3', label: '1-3年', min: 1, max: 3 },
  { id: '3-5', label: '3-5年', min: 3, max: 5 },
  { id: '5-10', label: '5-10年', min: 5, max: 10 },
  { id: '10+', label: '10年以上', min: 10, max: 999 },
];

const heroes = [
  {
    hero_id: '1',
    name: '小哥',
    avatar: '',
    rating: 4.9,
    project_types: ['帆船', '游艇'],
    certification_level: 'ASA帆船认证教练',
    honor_titles: ['中欧航海协会秘书长', 'ASA205级资深签证官'],
    cert_badges: ['ASA认证', 'ACA认证', '救生员证'],
    years_exp: 15,
    student_count: 128,
    bio: 'ASA帆船认证教练，15年水上运动教学经验。',
    honors_count: 3,
    recruitments: [
      { type: 'event', status: '招募中', title: '企业家杯帆船赛系列赛7月站', target_id: 'r1' },
      { type: 'course', status: '报名中', title: 'ASA101-103培训课', target_id: 'c1' },
    ],
  },
  {
    hero_id: '2',
    name: '熊猫',
    avatar: '',
    rating: 4.8,
    project_types: ['帆船', '浆板'],
    certification_level: 'ASA帆船认证教练',
    honor_titles: ['ASA帆船认证教练', '15年执教经验'],
    cert_badges: ['ASA认证', '救生员证'],
    years_exp: 15,
    student_count: 96,
    bio: '专注帆船与浆板入门教学。',
    honors_count: 2,
    recruitments: [
      { type: 'event', status: '招募中', title: '企业家杯帆船赛系列赛7月站', target_id: 'r1' },
      { type: 'course', status: '报名中', title: 'ASA101-103培训课', target_id: 'c1' },
    ],
  },
  {
    hero_id: '3',
    name: 'Amy',
    avatar: '',
    rating: 4.6,
    project_types: ['桨板', '潜水'],
    certification_level: 'PADI潜水教练',
    honor_titles: ['PADI潜水教练', '5年教学经验'],
    cert_badges: ['PADI认证', 'ACA认证'],
    years_exp: 5,
    student_count: 64,
    bio: '桨板与潜水入门教学，5年教学经验。',
    honors_count: 1,
    recruitments: [
      { type: 'course', status: '报名中', title: '桨板入门体验课', target_id: 'c2' },
      { type: 'course', status: '报名中', title: '潜水基础课程', target_id: 'c3' },
    ],
  },
  {
    hero_id: '4',
    name: '大伟',
    avatar: '',
    rating: 5.0,
    project_types: ['帆船', '冲浪'],
    certification_level: '国家级帆船教练',
    honor_titles: ['国家级帆船教练', '20年执教经验'],
    cert_badges: ['国家级教练', 'ACA认证', '救生员证'],
    years_exp: 20,
    student_count: 210,
    bio: '20年帆船与冲浪执教经验，多次带队参赛获奖。',
    honors_count: 5,
    recruitments: [
      { type: 'event', status: '招募中', title: '城市帆船精英赛', target_id: 'r7' },
      { type: 'course', status: '报名中', title: 'ASA101-103培训课', target_id: 'c1' },
    ],
  },
];

const HERO_EXTRA = {
  '1': {
    about_me:
      '从事水上运动教学十五年，深耕帆船与游艇领域，持有 ASA 多项认证与救生员资质。带领学员从入门到参赛，注重安全规范与技术细节。曾出任中欧航海协会秘书长，担任 ASA205 级资深签证官，擅长根据学员水平定制课程方案。教学风格耐心细致，累计服务学员逾百人，多次组织企业团建与青少年帆船夏令营，希望帮助更多人爱上航海运动，在风浪中找到自信与快乐。',
    past_honors: [
      { icon: '/assets/icons/trophy.png', name: '企业家杯冠军教练', summary: '连续三年带队夺冠' },
      { icon: '/assets/icons/crown.png', name: '中欧航海协会秘书长', summary: '负责协会赛事与培训' },
      { icon: '/assets/icons/boat.png', name: 'ASA205级资深签证官', summary: '负责资质认证评审' },
    ],
    moments: ['hero-1.jpg', 'hero-2.jpg', 'event.jpg', 'course.jpg', 'recruit-cover.jpg'],
    certificates: [
      { name: '国家级教练证', image: 'cert.jpg' },
      { name: '救生员证', image: 'cert.jpg' },
      { name: 'ACA证', image: 'cert.jpg' },
      { name: 'ASA认证', image: 'cert.jpg' },
    ],
  },
  '2': {
    about_me:
      '专注帆船与浆板入门教学十五年，擅长零基础学员引导与团队体验课设计。教学强调安全意识与基础动作规范，帮助学员快速建立水上运动信心。曾服务多家企业与亲子营地，课程反馈稳定。希望以轻松有趣的方式，让更多人接触帆船与浆板运动，享受湖畔与海风中的自由感。',
    past_honors: [
      { icon: '/assets/icons/medal.png', name: 'ASA帆船认证教练', summary: '持官方认证资质' },
      { icon: '/assets/icons/boat.png', name: '浆板入门金牌讲师', summary: '入门课好评率领先' },
    ],
    moments: ['hero-2.jpg', 'event.jpg', 'course.jpg'],
    certificates: [
      { name: 'ASA帆船认证', image: 'cert.jpg' },
      { name: '救生员证', image: 'cert.jpg' },
      { name: 'ACA证', image: 'cert.jpg' },
    ],
  },
  '3': {
    about_me:
      '桨板与潜水双项教练，五年教学经验，擅长女性与青少年入门课程。注重呼吸节奏与核心力量训练，帮助学员克服恐水心理。持有 PADI 潜水教练与 ACA 桨板认证，可开展湖泊桨板与开放水域潜水体验。希望用温和耐心的方式，带领学员探索水下与水面世界。',
    past_honors: [
      { icon: '/assets/icons/dive.png', name: 'PADI潜水教练', summary: '开放水域教学资质' },
      { icon: '/assets/icons/surf.png', name: '桨板体验课讲师', summary: '亲子课口碑优秀' },
    ],
    moments: ['hero-1.jpg', 'course.jpg'],
    certificates: [
      { name: 'PADI潜水证', image: 'cert.jpg' },
      { name: 'ACA桨板证', image: 'cert.jpg' },
    ],
  },
  '4': {
    about_me:
      '二十年帆船与冲浪执教经验，国家级帆船教练，多次带队参加国内外赛事并获奖。擅长竞技训练与高级技术提升，注重战术配合与体能储备。长期担任企业赛事顾问与青少年队教练，教学风格严谨高效。希望培养更多优秀水手，推动国内帆船运动发展。',
    past_honors: [
      { icon: '/assets/icons/medal.png', name: '国家级帆船教练', summary: '国家级执业资质' },
      { icon: '/assets/icons/trophy.png', name: '全国帆船联赛导师', summary: '多次带队获奖' },
      { icon: '/assets/icons/wave.png', name: '冲浪入门推广人', summary: '推广冲浪安全教学' },
    ],
    moments: ['hero-2.jpg', 'hero-1.jpg', 'event.jpg', 'recruit-cover.jpg', 'course.jpg', 'news-1.jpg'],
    certificates: [
      { name: '国家级教练证', image: 'cert.jpg' },
      { name: '救生员证', image: 'cert.jpg' },
      { name: 'ACA证', image: 'cert.jpg' },
      { name: 'ASA认证', image: 'cert.jpg' },
    ],
  },
};

heroes.forEach((h) => {
  const extra = HERO_EXTRA[h.hero_id] || {
    about_me: h.bio,
    past_honors: [],
    moments: [],
    certificates: [],
  };
  Object.assign(h, extra);
});

const banner = {
  season: '2026 夏季航季',
  title: '企业家杯月赛',
  subtitle: '06.20',
  desc: '一站式高端水上运动体验平台',
  cta: '查看活动',
};

const shortNav = [
  { id: 'boat', label: '船艇预约', icon: '/assets/icons/boat.png' },
  { id: 'event', label: '活动赛事', icon: '/assets/icons/trophy.png' },
  { id: 'course', label: '精选课程', icon: '/assets/icons/book.png' },
  { id: 'goods', label: '好物推荐', icon: '/assets/icons/shopping.png' },
];

const membership = {
  title: '航海家权益卡',
  price: 300,
  benefits: ['课程体验', '课程折扣', '商城折扣'],
};

const events = [
  {
    recruit_id: 'r1',
    hero_id: '1',
    hero_name: '小哥',
    type: 'event',
    typeLabel: '赛事',
    title: '企业家杯月赛',
    start_at: '2026-07-20T08:00:00',
    end_at: '2026-07-20T17:00:00',
    location: '滴水湖二号码头',
    fee: 500,
    signed: 12,
    total: 20,
    status: 'recruiting',
    cover_images: ['recruit-cover.jpg', 'event.jpg', 'hero-1.jpg'],
  },
  {
    recruit_id: 'r2',
    hero_id: '1',
    hero_name: '小哥',
    type: 'course',
    typeLabel: '活动',
    title: '周末帆船体验营',
    start_at: '2026-07-12T09:30:00',
    end_at: '2026-07-12T16:00:00',
    location: '滴水湖帆船基地',
    fee: 680,
    signed: 8,
    total: 16,
    status: 'recruiting',
    cover_images: ['recruit-cover.jpg'],
  },
  {
    recruit_id: 'r3',
    hero_id: '2',
    hero_name: '熊猫',
    type: 'course',
    typeLabel: '活动',
    title: '浆板初体验',
    start_at: '2026-08-03T14:00:00',
    end_at: '2026-08-03T17:00:00',
    location: '金鸡湖桨板码头',
    fee: 298,
    signed: 5,
    total: 12,
    status: 'recruiting',
  },
  {
    recruit_id: 'r4',
    hero_id: '2',
    hero_name: '熊猫',
    type: 'course',
    typeLabel: '课程',
    title: 'ASA101-103培训课',
    start_at: '2026-07-26T09:00:00',
    end_at: '2026-07-26T16:30:00',
    location: '滴水湖二号码头',
    fee: 1280,
    signed: 10,
    total: 10,
    status: 'enrolling',
  },
  {
    recruit_id: 'r5',
    hero_id: '3',
    hero_name: 'Amy',
    type: 'course',
    typeLabel: '课程',
    title: '桨板入门体验课',
    start_at: '2026-07-18T10:00:00',
    end_at: '2026-07-18T12:00:00',
    location: '太湖桨板营地',
    fee: 198,
    signed: 3,
    total: 8,
    status: 'recruiting',
  },
  {
    recruit_id: 'r6',
    hero_id: '3',
    hero_name: 'Amy',
    type: 'course',
    typeLabel: '课程',
    title: '潜水基础课程',
    start_at: '2026-08-10T09:00:00',
    end_at: '2026-08-10T17:00:00',
    location: '三亚开放水域基地',
    fee: 2680,
    signed: 2,
    total: 6,
    status: 'enrolling',
  },
  {
    recruit_id: 'r7',
    hero_id: '4',
    hero_name: '大伟',
    type: 'event',
    typeLabel: '赛事',
    title: '城市帆船精英赛',
    start_at: '2026-07-28T07:30:00',
    end_at: '2026-07-28T18:00:00',
    location: '青岛奥帆中心',
    fee: 800,
    signed: 15,
    total: 24,
    status: 'recruiting',
  },
];

const ORGANIZER_PROFILES = {
  小哥: {
    credentials:
      'ASA 四级裁判、RYA 青年帆船教练、中国帆船协会裁判员；2024 华东帆船联赛「年度最佳教练」。',
    teaching_philosophy:
      '安全第一、循序渐进、因材施教。让学员在真实水域中建立信心与团队意识，而非纸上谈兵。',
    race_experience:
      '连续八年带队参加企业家杯、城市帆船联赛等赛事，累计指挥大小航程 120+ 次，培育学员获奖 30 余人次。',
    leadership_style:
      '长航领队注重航线规划、气象研判与船员协作，强调「读风、读海、读人」三位一体的实战教学。',
    social_contribution:
      '发起「扬帆少年」公益项目，为内陆城市青少年提供帆船体验与航海科普，累计服务学员超 500 人。',
    slogan: '风起帆扬，英雄登场。',
  },
  大伟: {
    credentials: '国家一级帆船运动员、ASA 教练执照；曾代表省队参加全运会帆船项目。',
    teaching_philosophy: '竞技与乐趣并重，用赛事标准打磨技术细节，同时保持对海洋的敬畏。',
    race_experience: '十余年竞技帆船生涯，参加过环中国海、城市联赛等多站赛事，熟悉 OP、激光等多种船型。',
    leadership_style: '长航中强调分工与应急演练，培养学员独立判断风浪与调整帆具的能力。',
    social_contribution: '担任多所高校帆船社技术顾问，推动校园帆船运动规范化发展。',
    slogan: '与海同行，竞逐风浪。',
  },
};

const MY_RECRUITMENT_LISTS = {
  active: [
    {
      recruit_id: 'r2',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '周末帆船体验营',
      start_at: '2026-07-08T09:00:00',
      end_at: '2026-07-08T17:00:00',
      location: '三亚帆船港',
      fee: 299,
      signed: 4,
      total: 6,
      displayStatus: 'recruiting',
      listTab: 'active',
      cover_images: ['recruit-cover.jpg', 'event.jpg'],
      description: '适合零基础学员参与，含安全讲解与实操体验。请穿着运动服，注意防晒。',
    },
    {
      recruit_id: 'r1',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '企业家杯月赛',
      start_at: '2026-07-20T08:00:00',
      end_at: '2026-07-20T17:00:00',
      location: '滴水湖二号码头',
      fee: 500,
      signed: 12,
      total: 20,
      displayStatus: 'ongoing',
      listTab: 'active',
      cover_images: ['recruit-cover.jpg', 'event.jpg', 'hero-1.jpg'],
      description: '企业家杯帆船系列赛分站，适合有一定基础的学员组队参赛。含赛前说明会与赛后颁奖。',
    },
    {
      recruit_id: 'r10',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '暑期帆船入门营',
      start_at: '2026-07-15T09:00:00',
      end_at: '2026-07-15T16:00:00',
      location: '金鸡湖帆船基地',
      fee: 399,
      signed: 6,
      total: 6,
      displayStatus: 'closed',
      listTab: 'active',
      cover_images: ['recruit-cover.jpg'],
      description: '暑期帆船入门营，三天集训含岸上理论与水上实操，适合青少年及成人初学者。',
    },
  ],
  ended: [
    {
      recruit_id: 'r9',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '冬季帆船训练营',
      timeDisplay: '2025/12/01 09:00 - 17:00',
      location: '滴水湖',
      fee: 880,
      signed: 20,
      total: 20,
      displayStatus: 'ended',
      listTab: 'ended',
      cover_images: ['recruit-cover.jpg'],
      description: '冬季帆船强化训练营，已完成全部课程与结营考核。',
    },
    {
      recruit_id: 'r11',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '春季企业团建帆船赛',
      timeDisplay: '2026/04/18 08:30 - 16:30',
      location: '滴水湖二号码头',
      fee: 680,
      signed: 16,
      total: 16,
      displayStatus: 'ended',
      listTab: 'ended',
      cover_images: ['event.jpg'],
      description: '企业团建帆船赛专场，含团队配合训练与友谊赛。',
    },
    {
      recruit_id: 'r12',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '五一桨板体验日',
      timeDisplay: '2026/05/01 10:00 - 15:00',
      location: '太湖桨板营地',
      fee: 198,
      signed: 8,
      total: 10,
      displayStatus: 'ended',
      listTab: 'ended',
      cover_images: ['event.jpg'],
      description: '五一桨板体验日活动，含基础教学与湖面体验滑行。',
    },
  ],
  draft: [
    {
      recruit_id: 'd1',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '国庆帆船挑战赛',
      timeDisplay: '待定',
      location: '三亚帆船港',
      fee: 520,
      signed: 0,
      total: 12,
      displayStatus: 'draft',
      listTab: 'draft',
      cover_images: ['recruit-cover.jpg'],
      description: '草稿：国庆帆船挑战赛方案待完善。',
    },
    {
      recruit_id: 'd2',
      hero_name: '小哥',
      type: 'event',
      typeLabel: '赛事',
      title: '亲子帆船周末营',
      timeDisplay: '待定',
      location: '滴水湖帆船基地',
      fee: 360,
      signed: 0,
      total: 8,
      displayStatus: 'draft',
      listTab: 'draft',
      cover_images: ['recruit-cover.jpg'],
      description: '草稿：亲子帆船周末营，待确认档期与名额。',
    },
  ],
};

function normalizeRecruitmentDetail(item) {
  if (!item) return null;
  const timeDisplay =
    item.timeDisplay ||
    (item.start_at ? formatRecruitmentTimeRange(item.start_at, item.end_at) : '');
  return {
    ...item,
    type: item.type || 'event',
    typeLabel: item.typeLabel || '赛事',
    hero_name: item.hero_name || '小哥',
    time: timeDisplay,
    timeDisplay,
    cover_images:
      item.cover_images && item.cover_images.length
        ? item.cover_images
        : ['recruit-cover.jpg', 'event.jpg', 'hero-1.jpg'],
    description:
      item.description ||
      '适合零基础学员参与，含安全讲解与实操体验。请穿着运动服，注意防晒。',
    organizer_profile:
      item.organizer_profile ||
      ORGANIZER_PROFILES[item.hero_name] ||
      ORGANIZER_PROFILES['小哥'],
  };
}

function findMyRecruitment(id) {
  const tabs = ['active', 'ended', 'draft'];
  for (let i = 0; i < tabs.length; i += 1) {
    const found = (MY_RECRUITMENT_LISTS[tabs[i]] || []).find((r) => r.recruit_id === id);
    if (found) return found;
  }
  return null;
}

function getMyRecruitmentLists() {
  return MY_RECRUITMENT_LISTS;
}

function parseRecruitmentDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatRecruitmentTime(startAt) {
  const d = parseRecruitmentDate(startAt);
  if (!d) return startAt || '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRecruitmentTimeRange(startAt, endAt) {
  const start = parseRecruitmentDate(startAt);
  const end = parseRecruitmentDate(endAt);
  if (!start) return startAt || '';
  if (!end) return formatRecruitmentTime(startAt);
  const pad = (n) => String(n).padStart(2, '0');
  const startStr = `${start.getMonth() + 1}月${start.getDate()}日 ${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) {
    return `${startStr} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }
  const endStr = `${end.getMonth() + 1}月${end.getDate()}日 ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return `${startStr} - ${endStr}`;
}

function formatRecruitmentSignup(signed, total) {
  if (signed >= total) {
    return `已满 ${total} 名，可继续报名`;
  }
  return `共招募 ${total} 名，已报 ${signed} 名`;
}

function getRecruitmentsByHeroId(heroId) {
  return events
    .filter((e) => e.hero_id === heroId && e.status !== 'ended')
    .map((e) => ({
      ...e,
      timeDisplay: formatRecruitmentTimeRange(e.start_at, e.end_at),
      signupDisplay: formatRecruitmentSignup(e.signed, e.total),
      cover_image:
        e.cover_image ||
        (e.cover_images && e.cover_images.length ? e.cover_images[0] : 'recruit-cover.jpg'),
    }));
}

const courses = [
  {
    id: 'c1',
    title: 'ASA101-103培训课',
    price: 1280,
    priceLabel: '1280.00',
    total: 16,
    signed: 10,
    location: '滴水湖二号码头',
    hero_name: '小哥',
    time: '7月26日 09:00 - 16:30',
    description: 'ASA 101+103 组合课程，适合零基础学员，含理论讲解、岸上模拟与水上实操。',
    detail_html: '<p>ASA 101+103 组合课程，适合<strong>零基础学员</strong>。</p><ul><li>理论讲解与岸上模拟</li><li>水上实操与结业评估</li></ul>',
    banner_images: ['/assets/images/course.jpg'],
    cover_image: 'course',
  },
  {
    id: 'c2',
    title: '桨板入门体验课',
    price: 198,
    priceLabel: '198.00',
    total: 12,
    signed: 5,
    location: '太湖桨板营地',
    hero_name: 'Amy',
    time: '7月18日 10:00 - 12:00',
    description: '桨板入门体验，含安全讲解、基础站姿与划行练习，适合亲子与新手参与。',
    detail_html: '<p>桨板入门体验，含安全讲解与基础划行练习。</p>',
    banner_images: ['/assets/images/course.jpg', '/assets/images/event.jpg'],
    cover_image: 'course',
  },
  {
    id: 'c3',
    title: '潜水基础课程',
    price: 2680,
    priceLabel: '2680.00',
    total: 8,
    signed: 3,
    location: '三亚开放水域基地',
    hero_name: 'Amy',
    time: '8月10日 09:00 - 17:00',
    description: '潜水基础课程，含装备介绍、平静水域技巧与开放水域体验。',
    detail_html: '<p>潜水基础课程，含装备介绍与开放水域体验。</p>',
    banner_images: ['/assets/images/course.jpg'],
    cover_image: 'course',
  },
];

function getCourseById(id) {
  return courses.find((c) => c.id === id) || null;
}

function getCoursesByHeroId(heroId) {
  const hero = getHeroById(heroId);
  if (!hero) return [];
  return (hero.recruitments || [])
    .filter((r) => r.type === 'course')
    .map((r) => {
      const course = getCourseById(r.target_id);
      if (!course) return null;
      return {
        course_id: course.id,
        title: course.title,
        timeDisplay: course.time,
        location: course.location,
        fee: course.price,
        cover_image: course.cover_image || 'course',
      };
    })
    .filter(Boolean);
}

const products = [
  { id: 'p1', title: '生态种植｜零添加自然...', price: '299.00', cover: 'tomato', tag: 'Tomato' },
  { id: 'p2', title: '航海专用手套', price: '98.00', cover: 'gloves' },
];

const news = [
  {
    id: 'n1',
    title: '城市亲子帆船体验日开启，孩子们在风里完成第一次掌舵',
    category: '帆船',
    cover: 'news1',
  },
  {
    id: 'n2',
    title: 'ASA航海课程报名升温，城市白领成为主力学员',
    category: '浆板',
    cover: 'news2',
  },
  {
    id: 'n3',
    title: '企业团建新选择：帆船团队赛成为高端团建热门项目',
    category: '亲子活动',
    cover: 'news3',
  },
];

function matchYearsRange(yearsExp, rangeId) {
  if (!rangeId || rangeId === '全部') return true;
  const opt = YEARS_OPTIONS.find((o) => o.id === rangeId);
  if (!opt || opt.min == null) return true;
  const max = opt.max >= 999 ? Infinity : opt.max;
  return yearsExp >= opt.min && yearsExp <= max;
}

function sortHeroes(list, sortBy) {
  const arr = [...list];
  if (sortBy === 'rating_desc') {
    return arr.sort((a, b) => b.rating - a.rating || b.years_exp - a.years_exp);
  }
  if (sortBy === 'rating_asc') {
    return arr.sort((a, b) => a.rating - b.rating || a.years_exp - b.years_exp);
  }
  return arr;
}

function getHeroes(filter = {}) {
  let list = [...heroes];
  const {
    keyword = '',
    project_type = '全部',
    sort_by = 'default',
    years_range = '全部',
  } = filter;

  if (project_type && project_type !== '全部') {
    list = list.filter((h) => h.project_types.some((p) => p.includes(project_type) || project_type.includes(p)));
  }

  if (years_range && years_range !== '全部') {
    list = list.filter((h) => matchYearsRange(h.years_exp, years_range));
  }

  if (keyword) {
    list = fuzzyFilter(list, keyword, (h) => [
      h.name,
      h.certification_level,
      h.bio,
      String(h.years_exp),
      `${h.years_exp}年`,
      String(h.rating),
      ...(h.cert_badges || []),
      ...(h.honor_titles || []),
      ...h.project_types,
      h.project_types.join(''),
      ...(h.recruitments || []).map((r) => `${r.status} ${r.title}`),
    ]);
  }

  return sortHeroes(list, sort_by);
}

function getHeroById(id) {
  return heroes.find((h) => h.hero_id === id) || null;
}

function getRecruitmentById(id) {
  const mine = findMyRecruitment(id);
  if (mine) return normalizeRecruitmentDetail(mine);
  const pub = events.find((e) => e.recruit_id === id);
  return pub ? normalizeRecruitmentDetail(pub) : null;
}

module.exports = {
  PROJECT_TYPES,
  heroes,
  banner,
  shortNav,
  membership,
  events,
  courses,
  products,
  news,
  getHeroes,
  getHeroById,
  getRecruitmentById,
  getMyRecruitmentLists,
  getRecruitmentsByHeroId,
  getCoursesByHeroId,
  getCourseById,
  formatRecruitmentTime,
  formatRecruitmentTimeRange,
  formatRecruitmentSignup,
  SORT_OPTIONS,
  YEARS_OPTIONS,
};
