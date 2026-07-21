/**
 * 招募详情底栏主按钮文案与动作（预览）
 * 已认证教练 × 招募状态 / 未认证用户 × 招募状态
 * 从「发布赛事招募」进入时：按英雄是否已发起显示「发起招募」/「招募中...」
 */
(function (global) {
  'use strict';

  function isRecruitmentEnded(recruitment) {
    if (!recruitment) return true;
    if (recruitment.listTab === 'ended') return true;
    if (recruitment.displayStatus === 'ended') return true;
    if (recruitment.status === 'ended') return true;
    if (recruitment.listTab === 'active') return false;
    const endRaw = recruitment.end_at || recruitment.end_time;
    const end = endRaw ? new Date(endRaw).getTime() : NaN;
    return Number.isFinite(end) && end < Date.now();
  }

  function isHeroInitiated(recruitment) {
    if (!recruitment) return false;
    if (recruitment.hero_initiated === true) return true;
    if (recruitment.hero_initiated === false) return false;
    return false;
  }

  /**
   * @param {{ recruitment: object, isApprovedHero?: boolean, fromPublish?: boolean }} opts
   * @returns {{ label: string, disabled: boolean, action: 'signup'|'initiate'|'none' }}
   */
  function resolveSignupFooter(opts) {
    const recruitment = opts && opts.recruitment;
    const isHero = !!(opts && opts.isApprovedHero);
    const fromPublish = !!(opts && opts.fromPublish);
    const ended = isRecruitmentEnded(recruitment);

    if (fromPublish) {
      if (ended) {
        return { label: '活动已结束', disabled: true, action: 'none' };
      }
      if (isHeroInitiated(recruitment)) {
        return { label: '招募中...', disabled: true, action: 'none' };
      }
      return { label: '发起招募', disabled: false, action: 'initiate' };
    }

    if (isHero) {
      if (ended) {
        return { label: '招募已结束', disabled: true, action: 'none' };
      }
      return { label: '立即报名', disabled: false, action: 'initiate' };
    }

    if (ended) {
      return { label: '活动已结束', disabled: true, action: 'none' };
    }
    return { label: '立即报名', disabled: false, action: 'signup' };
  }

  global.SignupActionPreview = {
    isRecruitmentEnded: isRecruitmentEnded,
    isHeroInitiated: isHeroInitiated,
    resolveSignupFooter: resolveSignupFooter,
  };
})(typeof window !== 'undefined' ? window : globalThis);
