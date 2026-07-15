/**
 * 招募详情底栏主按钮文案与动作
 * 已认证教练 × 招募状态 / 未认证用户 × 招募状态
 */

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

/**
 * @param {{ recruitment: object, isApprovedHero?: boolean }} opts
 * @returns {{ label: string, disabled: boolean, action: 'signup'|'initiate'|'none' }}
 */
function resolveSignupFooter(opts) {
  const recruitment = opts && opts.recruitment;
  const isHero = !!(opts && opts.isApprovedHero);
  const ended = isRecruitmentEnded(recruitment);

  if (isHero) {
    if (ended) {
      return { label: '招募已结束', disabled: true, action: 'none' };
    }
    return { label: '发起招募', disabled: false, action: 'initiate' };
  }

  if (ended) {
    return { label: '活动已结束', disabled: true, action: 'none' };
  }
  return { label: '立即报名', disabled: false, action: 'signup' };
}

module.exports = {
  isRecruitmentEnded,
  resolveSignupFooter,
};
