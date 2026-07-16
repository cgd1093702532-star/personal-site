const data = require('../../utils/data.js');

const CERT_OPTIONS = ['国家级教练', '省级教练', 'ACA认证', 'ISA认证', '其他'];
const PRESET_CERT_LIST = CERT_OPTIONS.filter((item) => item !== '其他');
const YEARS_OPTIONS = ['1-3年', '3-5年', '5-10年', '10年+'];
const ID_DOC_TYPES = [
  '身份证',
  '护照',
  '港澳居民居住证',
  '港澳居民来往内地通行证',
  '台湾居民来往大陆通行证',
  '台湾居民居住证',
  '外国人永久居留身份证',
  '外国人居留许可证',
];
const DEFAULT_ID_DOC_TYPE = '身份证';
/** 与后台「管理项目类型」默认字典一致；正式环境应从管理端字典按创建时间倒序拉取 */
const PROJECT_TYPES = ['游艇', '冲浪', '潜水', '桨板', '皮划艇', '帆船'];
const PROJECT_TYPE_MAX = 3;
const SHOWCASE_IMAGE_MAX = 9;
const SHOWCASE_INTRO_MAX = 300;
const CERT_MAX = 10;
const CERT_NAME_MAX = 15;

const MOCK_FORM = {
  nickname: '',
  name: '',
  phone: '',
  id_doc_type: DEFAULT_ID_DOC_TYPE,
  id_card: '',
  bank_account: '',
  project_types: [],
  city: '',
  address: '',
  certification: '',
  years_exp: '',
  bio: '',
};

function buildSelectedMap(projects) {
  const map = {};
  (projects || []).forEach((t) => {
    map[t] = true;
  });
  return map;
}

function projectTypesDisplayText(projects) {
  return (projects || []).filter(Boolean).join('、');
}

function validateIdCard(idCard) {
  const id = String(idCard || '').trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(id)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i += 1) sum += parseInt(id[i], 10) * weights[i];
  return id[17] === checkCodes[sum % 11];
}

function isCertificationValid(cert, options) {
  if (!cert) return false;
  if (options.includes(cert)) return true;
  if (PRESET_CERT_LIST.includes(cert)) return false;
  return true;
}

function formatVideoDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function createDefaultShowcaseSections() {
  return [
    {
      id: 'showcase-1',
      title: '个人展示',
      isDefault: true,
      intro: '',
      mode: 'image',
      images: [],
      video: '',
      videoThumb: '',
      videoDuration: 0,
      videoDurationText: '0:00',
    },
  ];
}

function showcaseSectionsToPayload(sections) {
  const list = Array.isArray(sections) ? sections : [];
  const first = list[0];
  const custom = list.slice(1).map((section) => ({
    title: section.title || '自定义栏目',
    text: section.intro || '',
    images: section.mode === 'image' ? (section.images || []).slice() : [],
    video: section.mode === 'video' ? section.video || '' : '',
  }));
  return {
    moments_text: first?.intro || '',
    moments: first?.mode === 'image' ? (first.images || []).slice() : [],
    moments_video: first?.mode === 'video' ? first.video || '' : '',
    custom_sections: custom,
    showcase_sections: list.map((section) => ({
      title: section.title || '个人展示',
      intro: section.intro || '',
      mediaType: section.mode || 'image',
      images: section.mode === 'image' ? (section.images || []).slice() : [],
      video: section.mode === 'video' ? section.video || '' : '',
    })),
  };
}

function showcaseSectionsFromDraft(draft) {
  if (Array.isArray(draft?.showcase_sections) && draft.showcase_sections.length) {
    return draft.showcase_sections.map((section, index) => {
      const videoDuration = Number(section.videoDuration) || 0;
      return {
        id: `showcase-${index + 1}`,
        title: section.title || (index === 0 ? '个人展示' : '自定义栏目'),
        isDefault: index === 0,
        intro: String(section.intro || section.text || '').slice(0, SHOWCASE_INTRO_MAX),
        mode: section.mediaType || (section.video ? 'video' : 'image'),
        images: Array.isArray(section.images) ? section.images.slice(0, SHOWCASE_IMAGE_MAX) : [],
        video: section.video || '',
        videoThumb: section.videoThumb || '',
        videoDuration,
        videoDurationText: formatVideoDuration(videoDuration),
      };
    });
  }
  const images = Array.isArray(draft?.moments) ? draft.moments.slice() : [];
  const video = draft?.moments_video || draft?.videoPath || draft?.showcasePath || '';
  const intro = String(draft?.moments_text || '').slice(0, SHOWCASE_INTRO_MAX);
  const sections = createDefaultShowcaseSections();
  if (video && (draft?.showcaseType === 'video' || draft?.moments_video || draft?.videoPath)) {
    const videoDuration = Number(draft?.moments_video_duration) || 0;
    sections[0].mode = 'video';
    sections[0].video = video;
    sections[0].videoThumb = draft?.moments_video_thumb || '';
    sections[0].videoDuration = videoDuration;
    sections[0].videoDurationText = formatVideoDuration(videoDuration);
  } else if (images.length) {
    sections[0].mode = 'image';
    sections[0].images = images;
  }
  sections[0].intro = intro;
  (draft?.custom_sections || []).forEach((section, index) => {
    const imgs = Array.isArray(section.images) ? section.images.slice() : [];
    const videoDuration = Number(section.videoDuration) || 0;
    sections.push({
      id: `showcase-${index + 2}`,
      title: section.title || '自定义栏目',
      isDefault: false,
      intro: section.text || section.intro || '',
      mode: section.video ? 'video' : 'image',
      images: section.video ? [] : imgs,
      video: section.video || '',
      videoThumb: section.videoThumb || '',
      videoDuration,
      videoDurationText: formatVideoDuration(videoDuration),
    });
  });
  return sections;
}

function validateShowcaseSections(sections) {
  const list = Array.isArray(sections) ? sections : [];
  if (!list.length) return '请完善个人展示栏目';
  for (const section of list) {
    if (!(section.intro || '').length) return '请完善个人展示栏目';
    if (section.mode === 'video') {
      if (!section.video) return '请完善个人展示栏目';
    } else if (!(section.images || []).length) {
      return '请完善个人展示栏目';
    }
  }
  return '';
}

Page({
  data: {
    isEdit: false,
    submitLabel: '提交申请',
    profileChangePending: false,
    projectTypes: PROJECT_TYPES,
    selectedMap: {},
    projectTypesDisplay: '',
    certOptions: CERT_OPTIONS,
    idDocTypes: ID_DOC_TYPES,
    yearsOptions: YEARS_OPTIONS,
    form: { ...MOCK_FORM, sms_code: '' },
    bioLength: 0,
    showSmsField: false,
    smsCanSend: false,
    smsSentOnce: false,
    smsCountdown: 0,
    showCertSheet: false,
    showIdDocTypeSheet: false,
    showProjectSheet: false,
    showCustomCertDialog: false,
    customCertName: '',
    showCertNameDialog: false,
    pendingCertUrl: '',
    pendingCertName: '',
    certFiles: [],
    showcaseSections: createDefaultShowcaseSections(),
    agreed: false,
  },

  onLoad(options) {
    this._heroId = null;
    this._returnFrom = options?.from || '';
    this._returnHeroId = options?.hero_id || '';
    this._showcaseSectionSeq = 1;
    const isEdit = options?.mode === 'edit';
    this.setData({
      isEdit,
      submitLabel: isEdit ? '提交修改' : '提交申请',
    });
    if (isEdit) {
      wx.setNavigationBarTitle({ title: '修改资料' });
    }

    data.getHeroApplyStatus().then((res) => {
      const role = res.status;
      if (isEdit) {
        if (role !== 'approved') {
          wx.showToast({ title: '仅认证英雄可修改资料', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }
        this._heroId = res.hero_id || res.application?.hero_id || null;
        const pendingAfter = res.pending_profile_change?.after || null;
        this.setData({ profileChangePending: !!res.profile_change_pending });
        const applyPending = (base) => {
          if (pendingAfter) {
            this.fillFromApplication({
              ...(base || {}),
              ...pendingAfter,
              bio: pendingAfter.bio || pendingAfter.about_me || base?.bio || '',
              address: pendingAfter.address || pendingAfter.city || base?.address || '',
              certification:
                pendingAfter.certification ||
                (pendingAfter.cert_badges && pendingAfter.cert_badges[0]) ||
                base?.certification ||
                '',
            });
            return;
          }
          if (base) this.fillFromApplication(base);
          else this.initMockForm();
        };
        if (res.application) {
          applyPending(res.application);
          return;
        }
        if (this._heroId) {
          data.getHeroById(this._heroId).then((hero) => {
            if (hero) {
              applyPending({
                nickname: hero.nickname || hero.name || '',
                name: hero.name || '',
                phone: hero.phone || '',
                id_doc_type: hero.id_doc_type || DEFAULT_ID_DOC_TYPE,
                id_card: hero.id_card || '',
                bank_account: hero.bank_account || '',
                address: hero.address || hero.city || '',
                bio: hero.about_me || hero.bio || '',
                project_types: hero.project_types || [],
                certification: hero.certification || (hero.cert_badges || [])[0] || '',
                years_exp: hero.years_exp || '',
                cert_count: Array.isArray(hero.certificates) ? hero.certificates.length : 0,
                certFiles: (hero.certificates || []).map((c, i) => {
                  const item = typeof c === 'string' ? { name: `证书${i + 1}`, image: c } : c;
                  return {
                    id: `h-${i + 1}`,
                    label: String(item.name || `证书${i + 1}`).slice(0, CERT_NAME_MAX),
                    url: item.image || item.url || 'draft',
                  };
                }).slice(0, CERT_MAX),
                moments: hero.moments || [],
                moments_text: hero.moments_text || '',
                custom_sections: hero.custom_sections || [],
              });
            } else applyPending(null);
          });
          return;
        }
        applyPending(null);
        return;
      }

      if (role === 'approved') {
        wx.showToast({ title: '您已是认证英雄', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
      if (role === 'pending') {
        wx.showToast({ title: '申请审核中', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
      if (role === 'rejected' && res.application) {
        this.fillFromApplication(res.application);
        return;
      }
      this.initMockForm();
    });
  },

  fillFromApplication(app) {
    const projects = Array.isArray(app.project_types)
      ? app.project_types.slice(0, PROJECT_TYPE_MAX)
      : app.project_type
        ? [app.project_type]
        : [];
    const certification = app.certification || '';
    const certCount = Math.min(CERT_MAX, Number(app.cert_count) || 0);
    let certFiles = Array.isArray(app.certFiles)
      ? app.certFiles
          .filter((f) => f && f.url)
          .slice(0, CERT_MAX)
          .map((f, i) => ({
            ...f,
            label: String(f.label || f.name || `证书${i + 1}`).slice(0, CERT_NAME_MAX),
          }))
      : [];
    if (!certFiles.length && Array.isArray(app.certificates) && app.certificates.length) {
      certFiles = app.certificates
        .map((c, i) => {
          const item = typeof c === 'string' ? { name: `证书${i + 1}`, image: c } : c;
          return {
            id: `c-${i + 1}`,
            label: String(item.name || `证书${i + 1}`).slice(0, CERT_NAME_MAX),
            url: item.image || item.url || 'draft',
          };
        })
        .filter((f) => f.url)
        .slice(0, CERT_MAX);
    }
    if (!certFiles.length && certCount > 0) {
      certFiles = Array.from({ length: certCount }, (_, i) => ({
        id: `draft-${i + 1}`,
        label: `证书${i + 1}`,
        url: 'draft',
      }));
    }
    const address = app.address || '';
    let projectTypes = PROJECT_TYPES.slice();
    projects.forEach((name) => {
      if (name && !projectTypes.includes(name)) projectTypes.unshift(name);
    });
    const showcaseSections = showcaseSectionsFromDraft(app);
    this._showcaseSectionSeq = Math.max(
      1,
      ...showcaseSections.map((section) => {
        const num = Number(String(section.id || '').replace(/^showcase-/, ''));
        return Number.isFinite(num) ? num : 1;
      }),
    );
    const bio = app.bio || '';
    this.setData({
      projectTypes,
      selectedMap: buildSelectedMap(projects),
      projectTypesDisplay: projectTypesDisplayText(projects),
      form: {
        nickname: app.nickname || '',
        name: app.name || '',
        phone: app.phone || '',
        sms_code: '',
        id_doc_type: ID_DOC_TYPES.includes(app.id_doc_type) ? app.id_doc_type : DEFAULT_ID_DOC_TYPE,
        id_card: app.id_card || '',
        bank_account: app.bank_account || '',
        project_types: projects,
        city: address || app.city || '',
        address,
        certification,
        years_exp: app.years_exp || '',
        bio,
      },
      bioLength: bio.length,
      certFiles,
      showcaseSections,
      showSmsField: false,
      smsCanSend: !!(app.phone || '').trim(),
      smsSentOnce: false,
      smsCountdown: 0,
      agreed: false,
    });
  },

  initMockForm() {
    this.setData({
      form: { ...MOCK_FORM, sms_code: '' },
      bioLength: 0,
      projectTypes: PROJECT_TYPES.slice(),
      selectedMap: {},
      projectTypesDisplay: '',
      showcaseSections: createDefaultShowcaseSections(),
      agreed: false,
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const patch = { [`form.${field}`]: value };
    if (field === 'bio') patch.bioLength = (value || '').length;
    this.setData(patch);
  },

  onPhoneInput(e) {
    const phone = e.detail.value || '';
    this.setData({
      'form.phone': phone,
      smsCanSend: phone.length > 0,
    });
  },

  onSendSmsCode() {
    if (this.data.smsCountdown > 0 || !this.data.smsCanSend) return;
    const phone = (this.data.form.phone || '').trim();
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none', duration: 1000 });
      return;
    }
    this._sentSmsCode = String(Math.floor(100000 + Math.random() * 900000));
    wx.showToast({ title: '短信验证码已发送', icon: 'none', duration: 1000 });
    this.setData({ smsCountdown: 60, smsCanSend: false, showSmsField: true, smsSentOnce: true });
    if (this._smsTimer) clearInterval(this._smsTimer);
    this._smsTimer = setInterval(() => {
      const next = this.data.smsCountdown - 1;
      if (next <= 0) {
        clearInterval(this._smsTimer);
        this._smsTimer = null;
        this.setData({
          smsCountdown: 0,
          smsCanSend: (this.data.form.phone || '').length > 0,
        });
        return;
      }
      this.setData({ smsCountdown: next });
    }, 1000);
  },

  onUnload() {
    if (this._smsTimer) clearInterval(this._smsTimer);
  },

  onProjectToggle(e) {
    const { type } = e.currentTarget.dataset;
    if (!type) return;
    const list = [...this.data.form.project_types];
    const idx = list.indexOf(type);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      if (list.length >= PROJECT_TYPE_MAX) {
        wx.showToast({ title: `项目类型最多选择${PROJECT_TYPE_MAX}个`, icon: 'none' });
        return;
      }
      list.push(type);
    }
    this.setData({
      'form.project_types': list,
      selectedMap: buildSelectedMap(list),
      projectTypesDisplay: projectTypesDisplayText(list),
    });
  },

  onOpenProjectSheet() {
    this.setData({ showProjectSheet: true });
  },

  onCloseProjectSheet() {
    this.setData({ showProjectSheet: false });
  },

  onOpenCertSheet() {
    this.setData({ showCertSheet: true });
  },

  onCloseCertSheet() {
    this.setData({ showCertSheet: false });
  },

  onOpenIdDocTypeSheet() {
    this.setData({ showIdDocTypeSheet: true });
  },

  onCloseIdDocTypeSheet() {
    this.setData({ showIdDocTypeSheet: false });
  },

  onSelectIdDocType(e) {
    const { type } = e.currentTarget.dataset;
    if (!ID_DOC_TYPES.includes(type)) return;
    this.setData({
      'form.id_doc_type': type,
      showIdDocTypeSheet: false,
    });
  },

  onSelectCert(e) {
    const { cert } = e.currentTarget.dataset;
    if (cert === '其他') {
      this.setData({
        showCertSheet: false,
        showCustomCertDialog: true,
        customCertName: '',
      });
      return;
    }
    this.setData({
      'form.certification': cert || '',
      showCertSheet: false,
    });
  },

  onCloseCustomCertDialog() {
    this.setData({ showCustomCertDialog: false, customCertName: '' });
  },

  onCustomCertInput(e) {
    this.setData({ customCertName: e.detail.value || '' });
  },

  onConfirmCustomCert() {
    const name = String(this.data.customCertName || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入教练资质等级', icon: 'none' });
      return;
    }
    const options = this.data.certOptions || CERT_OPTIONS;
    const exists = options.some((item) => item === name);
    if (exists) {
      wx.showToast({ title: '当前资质等级名称已存在，不可重复', icon: 'none' });
      return;
    }
    this.setData({
      'form.certification': name,
      showCustomCertDialog: false,
      customCertName: '',
    });
  },

  noop() {},

  onYearsTap(e) {
    const { years } = e.currentTarget.dataset;
    this.setData({ 'form.years_exp': years });
  },

  onChooseCert() {
    const uploaded = (this.data.certFiles || []).filter((f) => f && f.url);
    if (uploaded.length >= CERT_MAX) {
      wx.showToast({ title: `最多上传${CERT_MAX}张证书`, icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const file = (res.tempFiles || [])[0];
        if (!file || !file.tempFilePath) return;
        this.setData({
          showCertNameDialog: true,
          pendingCertUrl: file.tempFilePath,
          pendingCertName: '',
        });
      },
    });
  },

  onPendingCertNameInput(e) {
    const value = String(e.detail.value || '').slice(0, CERT_NAME_MAX);
    this.setData({ pendingCertName: value });
  },

  onCloseCertNameDialog() {
    this.setData({
      showCertNameDialog: false,
      pendingCertUrl: '',
      pendingCertName: '',
    });
  },

  onConfirmCertName() {
    const name = String(this.data.pendingCertName || '').trim();
    const url = this.data.pendingCertUrl;
    if (!url) {
      this.onCloseCertNameDialog();
      return;
    }
    if (!name) {
      wx.showToast({ title: '请填写证书名称', icon: 'none' });
      return;
    }
    const uploaded = (this.data.certFiles || []).filter((f) => f && f.url);
    if (uploaded.length >= CERT_MAX) {
      wx.showToast({ title: `最多上传${CERT_MAX}张证书`, icon: 'none' });
      this.onCloseCertNameDialog();
      return;
    }
    const next = [
      ...uploaded,
      {
        id: `new-${Date.now()}`,
        label: name.slice(0, CERT_NAME_MAX),
        url,
      },
    ];
    this.setData({
      certFiles: next,
      showCertNameDialog: false,
      pendingCertUrl: '',
      pendingCertName: '',
    });
  },

  onCertNameInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const value = String(e.detail.value || '').slice(0, CERT_NAME_MAX);
    const certFiles = (this.data.certFiles || []).map((item, i) =>
      i === index ? { ...item, label: value } : item,
    );
    this.setData({ certFiles });
  },

  onDeleteCert(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const next = (this.data.certFiles || []).filter((_, i) => i !== index).filter((f) => f && f.url);
    this.setData({ certFiles: next });
  },

  onShowcaseIntroInput(e) {
    const { sectionId } = e.currentTarget.dataset;
    const value = String(e.detail.value || '').slice(0, SHOWCASE_INTRO_MAX);
    const sections = (this.data.showcaseSections || []).map((section) =>
      section.id === sectionId ? { ...section, intro: value } : section,
    );
    this.setData({ showcaseSections: sections });
  },

  onShowcaseTitleInput(e) {
    const { sectionId } = e.currentTarget.dataset;
    const value = e.detail.value || '';
    const sections = (this.data.showcaseSections || []).map((section) =>
      section.id === sectionId ? { ...section, title: value || '自定义栏目' } : section,
    );
    this.setData({ showcaseSections: sections });
  },

  onRemoveShowcaseSection(e) {
    const { sectionId } = e.currentTarget.dataset;
    const sections = (this.data.showcaseSections || []).filter(
      (section) => section.isDefault || section.id !== sectionId,
    );
    this.setData({ showcaseSections: sections });
  },

  onChooseShowcaseMedia(e) {
    const { sectionId } = e.currentTarget.dataset;
    const section = (this.data.showcaseSections || []).find((item) => item.id === sectionId);
    if (!section) return;
    if (section.mode === 'video' && section.video) {
      wx.showToast({ title: '请先删除视频后再上传', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: ['上传图片', '上传视频'],
      success: (res) => {
        if (res.tapIndex === 0) this._pickShowcaseImages(sectionId, section);
        else if (res.tapIndex === 1) this._pickShowcaseVideo(sectionId);
      },
    });
  },

  _pickShowcaseImages(sectionId, section) {
    const remain = SHOWCASE_IMAGE_MAX - (section.images || []).length;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const files = res.tempFiles || [];
        if (!files.length) return;
        const images = [...(section.images || [])];
        files.forEach((file) => {
          if (file.fileType && file.fileType !== 'image') return;
          if (images.length >= SHOWCASE_IMAGE_MAX) return;
          images.push(file.tempFilePath);
        });
        const sections = this.data.showcaseSections.map((item) =>
          item.id === sectionId
            ? {
                ...item,
                mode: 'image',
                images,
                video: '',
                videoThumb: '',
                videoDuration: 0,
                videoDurationText: '0:00',
              }
            : item,
        );
        this.setData({ showcaseSections: sections });
      },
    });
  },

  _pickShowcaseVideo(sectionId) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'],
      maxDuration: 30,
      success: (res) => {
        const file = (res.tempFiles || [])[0];
        if (!file) return;
        const videoDuration = Number(file.duration) || 0;
        const sections = this.data.showcaseSections.map((item) =>
          item.id === sectionId
            ? {
                ...item,
                mode: 'video',
                video: file.tempFilePath,
                videoThumb: file.thumbTempFilePath || '',
                videoDuration,
                videoDurationText: formatVideoDuration(videoDuration),
                images: [],
              }
            : item,
        );
        this.setData({ showcaseSections: sections });
      },
    });
  },

  onDeleteShowcaseImage(e) {
    const { sectionId, index } = e.currentTarget.dataset;
    const imageIndex = Number(index);
    if (Number.isNaN(imageIndex)) return;
    const sections = this.data.showcaseSections.map((section) => {
      if (section.id !== sectionId) return section;
      const images = [...(section.images || [])];
      images.splice(imageIndex, 1);
      return { ...section, mode: 'image', images };
    });
    this.setData({ showcaseSections: sections });
  },

  onDeleteShowcaseVideo(e) {
    const { sectionId } = e.currentTarget.dataset;
    const sections = this.data.showcaseSections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            mode: 'image',
            video: '',
            videoThumb: '',
            videoDuration: 0,
            videoDurationText: '0:00',
            images: [],
          }
        : section,
    );
    this.setData({ showcaseSections: sections });
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onOpenAgreement() {
    wx.showToast({ title: '协议详情（Mock）', icon: 'none' });
  },

  onWithdrawProfileChange() {
    if (!this.data.isEdit || !this.data.profileChangePending) return;
    const heroId = this._heroId;
    if (!heroId) {
      wx.showToast({ title: '资料加载失败', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '撤回审核',
      content: '确认撤回本次资料变更审核？撤回后可重新修改再提交。',
      success: (res) => {
        if (!res.confirm) return;
        data
          .withdrawProfileChange(heroId)
          .then((r) => {
            if (!r?.ok) {
              wx.showToast({ title: '暂无待审资料可撤回', icon: 'none' });
              return;
            }
            wx.showToast({ title: '已撤回审核', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 600);
          })
          .catch(() => {
            wx.showToast({ title: '撤回失败', icon: 'none' });
          });
      },
    });
  },

  onSubmit() {
    const {
      nickname,
      name,
      phone,
      sms_code,
      id_doc_type,
      id_card,
      bank_account,
      project_types,
      address,
      certification,
      years_exp,
      bio,
    } = this.data.form;

    if (!nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    if (!(phone || '').trim() || !/^1\d{10}$/.test(phone.trim())) {
      wx.showToast({ title: '请填写正确的手机号', icon: 'none' });
      return;
    }
    const smsCode = (sms_code || '').trim();
    if (!smsCode || smsCode !== this._sentSmsCode) {
      wx.showToast({ title: '请填写正确的验证码', icon: 'none' });
      return;
    }
    if (!name) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
      return;
    }
    const docType = ID_DOC_TYPES.includes(id_doc_type) ? id_doc_type : DEFAULT_ID_DOC_TYPE;
    if (!(id_card || '').trim()) {
      wx.showToast({
        title: '请填写证件号码',
        icon: 'none',
      });
      return;
    }
    if (docType === '身份证') {
      if (!validateIdCard(id_card)) {
        wx.showToast({ title: '实名校验未通过，请核对姓名与身份证号', icon: 'none' });
        return;
      }
    }
    if (!project_types.length) {
      wx.showToast({ title: '请选择项目类型', icon: 'none' });
      return;
    }
    if (project_types.length > PROJECT_TYPE_MAX) {
      wx.showToast({ title: `项目类型最多选择${PROJECT_TYPE_MAX}个`, icon: 'none' });
      return;
    }
    if (project_types.some((item) => !this.data.projectTypes.includes(item))) {
      wx.showToast({ title: '当前所选项目类型不存在，请重新选择', icon: 'none' });
      return;
    }
    if (!certification) {
      wx.showToast({ title: '请选择教练资质等级', icon: 'none' });
      return;
    }
    if (!isCertificationValid(certification, this.data.certOptions || CERT_OPTIONS)) {
      wx.showToast({ title: '当前所选资质等级不存在，请重新选择', icon: 'none' });
      return;
    }
    if (!years_exp) {
      wx.showToast({ title: '请选择经验年限', icon: 'none' });
      return;
    }
    if (!YEARS_OPTIONS.includes(years_exp)) {
      wx.showToast({ title: '当前所选经验年限不存在，请重新选择', icon: 'none' });
      return;
    }
    const hasCert = this.data.certFiles.some((f) => f.url);
    if (!hasCert) {
      wx.showToast({ title: '请上传资证证书', icon: 'none' });
      return;
    }
    if (this.data.certFiles.some((f) => f.url && !(f.label || '').trim())) {
      wx.showToast({ title: '请填写证书名称', icon: 'none' });
      return;
    }
    if (!(bio || '').trim()) {
      wx.showToast({ title: '请填写详细介绍', icon: 'none' });
      return;
    }
    const showcaseError = validateShowcaseSections(this.data.showcaseSections);
    if (showcaseError) {
      wx.showToast({ title: showcaseError, icon: 'none' });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: '请阅读并同意相关协议', icon: 'none', duration: 2000 });
      return;
    }

    const addressValue = address || '';
    const projects = project_types.slice(0, PROJECT_TYPE_MAX);
    const certList = this.data.certFiles
      .filter((f) => f.url)
      .map((f) => ({
        name: String(f.label || '').trim().slice(0, CERT_NAME_MAX),
        image: f.url,
      }));
    const certCount = certList.length;
    const showcasePayload = showcaseSectionsToPayload(this.data.showcaseSections);

    if (this.data.isEdit) {
      const heroId = this._heroId;
      if (!heroId) {
        wx.showToast({ title: '资料加载失败，请返回重试', icon: 'none' });
        return;
      }
      const patch = {
        nickname,
        name,
        phone: (phone || '').trim(),
        id_doc_type: docType,
        id_card: (id_card || '').trim(),
        bank_account: (bank_account || '').trim(),
        project_types: projects,
        city: addressValue,
        address: addressValue,
        certification,
        years_exp,
        bio: (bio || '').trim(),
        about_me: (bio || '').trim(),
        cert_count: certCount,
        certificates: certList,
        cert_badges: certification ? [certification] : [],
        ...showcasePayload,
      };
      data
        .submitProfileChange(heroId, patch, 'profile')
        .then(() => {
          wx.showToast({ title: '已提交审核', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 800);
        })
        .catch(() => {
          wx.showToast({ title: '提交失败，请检查本地 API', icon: 'none' });
        });
      return;
    }

    const application = {
      ...this.data.form,
      name,
      phone: (phone || '').trim(),
      id_doc_type: docType,
      id_card: (id_card || '').trim(),
      bank_account: (bank_account || '').trim(),
      address: addressValue,
      city: addressValue,
      project_types: projects,
      honors: '',
      certFiles: this.data.certFiles,
      cert_count: certCount,
      certificates: certList,
      channel: '自主申请',
      submitted_at: new Date().toISOString(),
      ...showcasePayload,
    };
    data
      .submitHeroApply(application)
      .then(() => {
        wx.setStorageSync('mock_hero_role', 'pending');
        const returnQuery =
          this._returnFrom === 'hero-detail'
            ? `?from=hero-detail&hero_id=${encodeURIComponent(this._returnHeroId || '1')}`
            : '';
        wx.redirectTo({
          url: `/pages/hero-apply-submitted/hero-apply-submitted${returnQuery}`,
        });
      })
      .catch((err) => {
        const code = (err && err.message) || '';
        if (code === 'application_pending') {
          wx.showToast({ title: '申请审核中，请勿重复提交', icon: 'none' });
          return;
        }
        if (code === 'already_approved') {
          wx.showToast({ title: '您已是认证英雄，无需重复申请', icon: 'none' });
          return;
        }
        if (code === 'api_unavailable') {
          wx.showToast({ title: '提交失败，请确认本地服务已启动', icon: 'none' });
          return;
        }
        wx.showToast({ title: `提交失败：${code || '请稍后重试'}`, icon: 'none' });
      });
  },
});
