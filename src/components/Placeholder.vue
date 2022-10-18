<script>
import { defineComponent, h } from 'vue';

export default {
  inject: ['instance'],

  render() {
    const { instance } = this;
    const placeholderClass = {
      'vue-customtreeselect__placeholder': true,
      'vue-customtreeselect-helper-zoom-effect-off': true,
      'vue-customtreeselect-helper-hide': instance.hasValue || instance.trigger.searchQuery,
    };

    return (
      h('div', { class: placeholderClass }, instance.placeholder)
    );
  },
};
</script>
