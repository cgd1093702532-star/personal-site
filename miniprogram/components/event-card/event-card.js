Component({
  properties: {
    item: { type: Object, value: {} },
  },
  methods: {
    onTap() {
      const id = this.properties.item.recruit_id;
      if (id) this.triggerEvent('tap', { recruit_id: id });
    },
  },
});
