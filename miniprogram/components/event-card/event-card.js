Component({
  properties: {
    item: { type: Object, value: {} },
    actionText: { type: String, value: '立即报名' },
    actionDisabled: { type: Boolean, value: false },
      /** detail | signup | initiate | none */
    actionKind: { type: String, value: 'detail' },
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
      if (this.properties.actionDisabled) return;
      const kind = this.properties.actionKind || 'detail';
      if (kind === 'none') return;
      if (kind === 'signup' || kind === 'initiate') {
        this.triggerEvent('action', { type: kind, recruit_id: id });
        return;
      }
      this.triggerEvent('tap', { recruit_id: id });
    },
  },
});
