/** 招募详情 · 底部报名/签到按钮状态（预览） */
(function (global) {
  function isActivityEnded(recruitment, signup, now = Date.now()) {
    if (signup && signup.listTab === 'ended') return true;
    const endAt = (signup && signup.end_at) || (recruitment && recruitment.end_at);
    if (endAt) {
      const endMs = new Date(endAt).getTime();
      if (!Number.isNaN(endMs) && endMs < now) return true;
    }
    if (recruitment && (recruitment.displayStatus === 'ended' || recruitment.listTab === 'ended')) {
      return true;
    }
    return false;
  }

  function isCheckedIn(signup) {
    if (!signup) return false;
    if (signup.checked_in === true) return true;
    if (signup.checkin_at) return true;
    return signup.status === '已签到' || signup.status === '已核销';
  }

  function resolveSignupFooter({ recruitment, signup }) {
    if (isActivityEnded(recruitment, signup)) {
      return { label: '活动已结束', disabled: true, action: 'none' };
    }
    if (!signup) {
      return { label: '立即报名', disabled: false, action: 'signup' };
    }
    if (isCheckedIn(signup)) {
      return { label: '已签到', disabled: true, action: 'none' };
    }
    return { label: '签到二维码核销', disabled: false, action: 'checkin' };
  }

  global.SignupActionPreview = {
    isActivityEnded,
    isCheckedIn,
    resolveSignupFooter,
  };
})(typeof window !== 'undefined' ? window : globalThis);
