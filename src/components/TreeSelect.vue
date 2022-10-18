<template>
  <div
    ref="wrapper"
    :class="wrapperClass"
  >
    <HiddenFields />
    <Control ref="control" />
    <MenuPortal
      v-if="appendToBody"
      ref="portal"
    />
    <Menu
      v-else
      ref="menu"
    />
  </div>
</template>

<script>
import { defineComponent, h } from 'vue';
import customTreeselectMixin from '../mixins/customTreeselectMixin';
import HiddenFields from './HiddenFields.vue';
import Control from './Control.vue';
import Menu from './Menu.vue';
import MenuPortal from './MenuPortal.vue';

export default defineComponent({
  name: 'VueCustomTreeselect',
  components: {
    HiddenFields, Control, Menu, MenuPortal,
  },
  mixins: [customTreeselectMixin],

  computed: {
    wrapperClass() {
      return {
        'vue-customtreeselect': true,
        'vue-customtreeselect--single': this.single,
        'vue-customtreeselect--multi': this.multiple,
        'vue-customtreeselect--searchable': this.searchable,
        'vue-customtreeselect--disabled': this.disabled,
        'vue-customtreeselect--focused': this.trigger.isFocused,
        'vue-customtreeselect--has-value': this.hasValue,
        'vue-customtreeselect--open': this.menu.isOpen,
        'vue-customtreeselect--open-above': this.menu.placement === 'top',
        'vue-customtreeselect--open-below': this.menu.placement === 'bottom',
        'vue-customtreeselect--branch-nodes-disabled': this.disableBranchNodes,
        'vue-customtreeselect--append-to-body': this.appendToBody,
      };
    },
  },

  // render() {
  //   return (
  //     <div ref="wrapper" class={this.wrapperClass}>
  //       <HiddenFields />
  //       <Control ref="control" />
  //       {this.appendToBody ? <MenuPortal ref="portal" /> : <Menu ref="menu" />}
  //     </div>
  //   )
  // },
});
</script>
