<script>
import { defineComponent, h } from 'vue';

export default defineComponent({
  functional: true,

  props: {
    type: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
  },

  render() {
    const { type, icon } = this;

    return (
      h('div', {
        class: `vue-customtreeselect__tip vue-customtreeselect__${type}-tip`,
      }, [
        h('div', {
          class: 'vue-customtreeselect__icon-container',
        }, [
          h('span', { class: `vue-customtreeselect__icon-${icon}` }),
        ]),

        h('span', {
          class: `vue-customtreeselect__tip-text vue-customtreeselect__${type}-tip-text`,
        }, [
          this.$slots.default(),
        ]),
      ])
    );
  },
});
</script>
