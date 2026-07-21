Component({
  properties: {
    item: { type: Object, value: {} },
    actionText: { type: String, value: '立即报名' },
    actionDisabled: { type: Boolean, value: false },
    /** detail | signup | initiate | none */
    actionKind: { type: String, value: 'detail' },
    showTimeDot: { type: Boolean, value: true },
  },
  methods: {
    onTap() {
      const id = this.properties.item.recruit_id;
      if (!id) return;
      this.triggerEvent('tap', { recruit_id: id });
    },
    onActionTap() {
      const id = this.properties.item.recruit_id;
      if (!id) return;
      const kind = this.properties.actionKind || 'detail';
      if (kind === 'none') return;
      if (kind === 'signup' || kind === 'initiate') {
        if (this.properties.actionDisabled) return;
        this.triggerEvent('action', { type: kind, recruit_id: id });
        return;
      }
      // detail：含视觉禁用的「招募中...」「活动已结束」仍进详情
      this.triggerEvent('tap', { recruit_id: id });
    },
  },
});
