/** 招募数据 · 我的招募与招募详情共享 */
(function () {
  const IMG = '../assets/images';

  window.RECRUITMENTS_LISTS = {
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

  window.PUBLIC_RECRUITMENTS = [
    {
      recruit_id: 'r7',
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
      cover_images: ['recruit-cover.jpg', 'event.jpg'],
      description: '城市帆船精英赛，面向有一定基础的帆船爱好者，含多日赛程与技术讲评。',
    },
  ];

  function parseDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatTimeRange(startAt, endAt) {
    const start = parseDate(startAt);
    const end = parseDate(endAt);
    if (!start) return startAt || '';
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${start.getMonth() + 1}月${start.getDate()}日 ${pad(start.getHours())}:${pad(start.getMinutes())}`;
    if (!end) return startStr;
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    if (sameDay) return `${startStr} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
    const endStr = `${end.getMonth() + 1}月${end.getDate()}日 ${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startStr} - ${endStr}`;
  }

  function normalize(item) {
    if (!item) return null;
    const timeDisplay =
      item.timeDisplay || (item.start_at ? formatTimeRange(item.start_at, item.end_at) : '');
    return {
      ...item,
      type: item.type || 'event',
      typeLabel: item.typeLabel || '赛事',
      hero_name: item.hero_name || '小哥',
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

  window.getRecruitmentById = function getRecruitmentById(id) {
    const tabs = ['active', 'ended', 'draft'];
    for (let i = 0; i < tabs.length; i += 1) {
      const found = (window.RECRUITMENTS_LISTS[tabs[i]] || []).find((r) => r.recruit_id === id);
      if (found) return normalize(found);
    }
    const pub = (window.PUBLIC_RECRUITMENTS || []).find((r) => r.recruit_id === id);
    return pub ? normalize(pub) : null;
  };

  window.getMyRecruitmentLists = function getMyRecruitmentLists() {
    const lists = window.RECRUITMENTS_LISTS;
    return window.sortMyRecruitmentLists
      ? window.sortMyRecruitmentLists(lists)
      : lists;
  };

  window.RECRUITMENTS_IMG_BASE = IMG;
})();
