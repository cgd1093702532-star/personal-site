const data = require('../../utils/data.js');
const mock = require('../../utils/mock.js');

const CERT_OPTIONS = ['国家级教练', '省级教练', 'ACA认证', 'ISA认证', '其他'];
const CERT_PICKER_OPTIONS = ['请选择', ...CERT_OPTIONS];
const YEARS_OPTIONS = ['1-3年', '3-5年', '5-10年', '10年+'];

const MOCK_FORM = {
  name: '',
  phone: '',
  project_types: [],
  city: '',
  certification: '',
  years_exp: '',
  honors: '',
  bio: '',
};

Page({
  data: {
    projectTypes: mock.PROJECT_TYPES.filter((t) => t !== '全部' && t !== '冲浪'),
    certOptions: CERT_PICKER_OPTIONS,
    certIndex: 0,
    yearsOptions: YEARS_OPTIONS,
    form: { ...MOCK_FORM, sms_code: '' },
    showSmsField: false,
    smsCanSend: false,
    smsSentOnce: false,
    smsCountdown: 0,
    certFiles: [
      { id: '1', label: '证书①', url: '' },
      { id: '2', label: '证书②', url: '' },
    ],
    videoPath: '',
    agreed: false,
    selectedMap: {},
  },

  onLoad() {
    data.getHeroApplyStatus().then((res) => {
      const role = res.status;
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
      this.initMockForm();
    });
  },

  initMockForm() {
    this.setData({
      form: { ...MOCK_FORM, sms_code: '' },
      certIndex: 0,
      selectedMap: {},
      agreed: false,
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
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
    const list = [...this.data.form.project_types];
    const idx = list.indexOf(type);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(type);
    const selectedMap = {};
    list.forEach((t) => {
      selectedMap[t] = true;
    });
    this.setData({ 'form.project_types': list, selectedMap });
  },

  onCertChange(e) {
    const index = Number(e.detail.value);
    if (index <= 0) {
      this.setData({ certIndex: 0, 'form.certification': '' });
      return;
    }
    this.setData({
      certIndex: index,
      'form.certification': CERT_OPTIONS[index - 1],
    });
  },

  onYearsTap(e) {
    const { years } = e.currentTarget.dataset;
    this.setData({ 'form.years_exp': years });
  },

  onChooseCert() {
    const remain = 5 - this.data.certFiles.length;
    if (remain <= 0) return;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      success: (res) => {
        const next = [...this.data.certFiles];
        res.tempFiles.forEach((file, i) => {
          next.push({
            id: `new-${Date.now()}-${i}`,
            label: `证书${next.length + 1}`,
            url: file.tempFilePath,
          });
        });
        this.setData({ certFiles: next.slice(0, 5) });
      },
    });
  },

  onChooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      maxDuration: 30,
      success: (res) => {
        const file = res.tempFiles[0];
        if (file) this.setData({ videoPath: file.tempFilePath });
      },
    });
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onOpenAgreement() {
    wx.showToast({ title: '协议详情（Mock）', icon: 'none' });
  },

  onSubmit() {
    const { name, phone, sms_code, project_types, city, certification, years_exp, bio, honors } = this.data.form;

    if (!(name || '').trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
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
    if (project_types.length === 0) {
      wx.showToast({ title: '请选择项目类型', icon: 'none' });
      return;
    }
    if (!(city || '').trim()) {
      wx.showToast({ title: '请填写城市', icon: 'none' });
      return;
    }
    if (!certification) {
      wx.showToast({ title: '请选择教练资质等级', icon: 'none' });
      return;
    }
    if (!years_exp) {
      wx.showToast({ title: '请选择从业年限', icon: 'none' });
      return;
    }
    const hasCert = this.data.certFiles.some((f) => f.url);
    if (!hasCert) {
      wx.showToast({ title: '请上传资证证书', icon: 'none' });
      return;
    }
    if (!(bio || '').trim()) {
      wx.showToast({ title: '请填写详细介绍', icon: 'none' });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: '请阅读并同意相关协议', icon: 'none', duration: 2000 });
      return;
    }
    const application = {
      ...this.data.form,
      honors,
      certFiles: this.data.certFiles,
      videoPath: this.data.videoPath,
      submitted_at: new Date().toISOString(),
    };
    data
      .submitHeroApply(application)
      .then(() => {
        wx.setStorageSync('mock_hero_role', 'pending');
        wx.redirectTo({ url: '/pages/hero-apply-submitted/hero-apply-submitted' });
      })
      .catch(() => {
        wx.setStorageSync('mock_hero_role', 'pending');
        wx.redirectTo({ url: '/pages/hero-apply-submitted/hero-apply-submitted' });
      });
  },
});
