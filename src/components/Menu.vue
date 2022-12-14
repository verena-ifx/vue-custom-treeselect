<script>
import { defineComponent, h } from 'vue';
import { MENU_BUFFER } from '../constants';
import { watchSize, setupResizeAndScrollEventListeners } from '../utils';
import Option from './Option.vue';
import Tip from './Tip.vue';

const directionMap = {
  top: 'top',
  bottom: 'bottom',
  above: 'top',
  below: 'bottom',
};

export default {
  inject: ['instance'],

  computed: {
    menuStyle() {
      const { instance } = this;

      return {
        maxHeight: `${instance.maxHeight}px`,
      };
    },

    menuContainerStyle() {
      const { instance } = this;

      return {
        zIndex: instance.appendToBody ? null : instance.zIndex,
      };
    },
  },

  watch: {
    // eslint-disable-next-line func-names
    'instance.menu.isOpen': function (newValue) {
      if (newValue) {
        // In case `openMenu()` is just called and the menu is not rendered yet.
        this.$nextTick(this.onMenuOpen);
      } else {
        this.onMenuClose();
      }
    },
  },

  created() {
    this.menuSizeWatcher = null;
    this.menuResizeAndScrollEventListeners = null;
  },

  mounted() {
    const { instance } = this;

    if (instance.menu.isOpen) this.$nextTick(this.onMenuOpen);
  },

  unmounted() {
    this.onMenuClose();
  },

  methods: {
    renderMenu() {
      const { instance } = this;

      if (!instance.menu.isOpen) return null;

      return h('div', {
        ref: 'menu',
        class: 'vue-customtreeselect__menu',
        onMousedown: instance.handleMouseDown,
        style: this.menuStyle,
      },
      [
        this.renderBeforeList(),
        // eslint-disable-next-line no-nested-ternary
        instance.async
          ? this.renderAsyncSearchMenuInner()
          : instance.localSearch.active
            ? this.renderLocalSearchMenuInner()
            : this.renderNormalMenuInner(),
        this.renderAfterList(),
      ]);
    },

    renderBeforeList() {
      const { instance } = this;
      const beforeListRenderer = instance.$slots['before-list'];

      return beforeListRenderer
        ? beforeListRenderer()
        : null;
    },

    renderAfterList() {
      const { instance } = this;
      const afterListRenderer = instance.$slots['after-list'];

      return afterListRenderer
        ? afterListRenderer()
        : null;
    },

    renderNormalMenuInner() {
      const { instance } = this;

      if (instance.rootOptionsStates.isLoading) {
        return this.renderLoadingOptionsTip();
      } if (instance.rootOptionsStates.loadingError) {
        return this.renderLoadingRootOptionsErrorTip();
      } if (instance.rootOptionsStates.isLoaded && instance.forest.normalizedOptions.length === 0) {
        return this.renderNoAvailableOptionsTip();
      }
      return this.renderOptionList();
    },

    renderLocalSearchMenuInner() {
      const { instance } = this;

      if (instance.rootOptionsStates.isLoading) {
        return this.renderLoadingOptionsTip();
      } if (instance.rootOptionsStates.loadingError) {
        return this.renderLoadingRootOptionsErrorTip();
      } if (instance.rootOptionsStates.isLoaded && instance.forest.normalizedOptions.length === 0) {
        return this.renderNoAvailableOptionsTip();
      } if (instance.localSearch.noResults) {
        return this.renderNoResultsTip();
      }
      return this.renderOptionList();
    },

    renderAsyncSearchMenuInner() {
      const { instance } = this;
      const entry = instance.getRemoteSearchEntry;
      const shouldShowSearchPromptTip = instance.trigger.searchQuery === '' && !instance.defaultOptions;
      const shouldShowNoResultsTip = shouldShowSearchPromptTip
        ? false
        : entry.isLoaded && entry.options.length === 0;

      if (shouldShowSearchPromptTip) {
        return this.renderSearchPromptTip();
      } if (entry.isLoading) {
        return this.renderLoadingOptionsTip();
      } if (entry.loadingError) {
        return this.renderAsyncSearchLoadingErrorTip();
      } if (shouldShowNoResultsTip) {
        return this.renderNoResultsTip();
      }
      return this.renderOptionList();
    },

    renderOptionList() {
      const { instance } = this;

      return (
        h('div', { class: 'vue-customtreeselect__list' },
          instance.forest.normalizedOptions.map((rootNode) => (
            h(Option, { node: rootNode, key: rootNode.id })
          )))
      );
    },

    renderSearchPromptTip() {
      const { instance } = this;

      return (
        h(Tip, { type: 'search-prompt', icon: 'warning' }, () => instance.searchPromptText)
      );
    },

    renderLoadingOptionsTip() {
      const { instance } = this;

      return (
        h(Tip, { type: 'loading', icon: 'loader' }, () => [instance.loadingText])
      );
    },

    renderLoadingRootOptionsErrorTip() {
      const { instance } = this;

      return (
        h(Tip, { type: 'error', icon: 'error' }, () => [
          instance.rootOptionsStates.loadingError,
          h('a', {
            class: 'vue-customtreeselect__retry',
            onClick: instance.loadRootOptions,
            title: instance.retryTitle,
          }, [instance.retryText]),
        ])
      );
    },

    renderAsyncSearchLoadingErrorTip() {
      const { instance } = this;
      const entry = instance.getRemoteSearchEntry;

      return (
        h(Tip, { type: 'error', icon: 'error' }, () => [
          instance.rootOptionsStates.loadingError,
          h('a', {
            class: 'vue-customtreeselect__retry',
            onClick: instance.handleRemoteSearch,
            title: instance.retryTitle,
          }, [instance.retryText]),
        ])
      );
    },

    renderNoAvailableOptionsTip() {
      const { instance } = this;

      return (
        h(Tip, { type: 'no-options', icon: 'warning' }, () => [instance.searchPromptText])
      );
    },

    renderNoResultsTip() {
      const { instance } = this;
      return (
        h(Tip, { type: 'no-results', icon: 'warning' }, () => [instance.noResultsText])
      );
    },

    onMenuOpen() {
      this.adjustMenuOpenDirection();
      this.setupMenuSizeWatcher();
      this.setupMenuResizeAndScrollEventListeners();
    },

    onMenuClose() {
      this.removeMenuSizeWatcher();
      this.removeMenuResizeAndScrollEventListeners();
    },

    adjustMenuOpenDirection() {
      const { instance } = this;
      if (!instance.menu.isOpen) return;

      const $menu = instance.getMenu();
      const $control = instance.getControl();
      const menuRect = $menu.getBoundingClientRect();
      const controlRect = $control.getBoundingClientRect();
      const menuHeight = menuRect.height;
      const viewportHeight = window.innerHeight;
      const spaceAbove = controlRect.top;
      const spaceBelow = window.innerHeight - controlRect.bottom;
      const isControlInViewport = (
        (controlRect.top >= 0 && controlRect.top <= viewportHeight)
          || (controlRect.top < 0 && controlRect.bottom > 0)
      );
      const hasEnoughSpaceBelow = spaceBelow > menuHeight + MENU_BUFFER;
      const hasEnoughSpaceAbove = spaceAbove > menuHeight + MENU_BUFFER;

      if (!isControlInViewport) {
        instance.closeMenu();
      } else if (instance.openDirection !== 'auto') {
        instance.menu.placement = directionMap[instance.openDirection];
      } else if (hasEnoughSpaceBelow || !hasEnoughSpaceAbove) {
        instance.menu.placement = 'bottom';
      } else {
        instance.menu.placement = 'top';
      }
    },

    setupMenuSizeWatcher() {
      const { instance } = this;
      const $menu = instance.getMenu();

      // istanbul ignore next
      if (this.menuSizeWatcher) return;

      this.menuSizeWatcher = {
        remove: watchSize($menu, this.adjustMenuOpenDirection),
      };
    },

    setupMenuResizeAndScrollEventListeners() {
      const { instance } = this;
      const $control = instance.getControl();

      // istanbul ignore next
      if (this.menuResizeAndScrollEventListeners) return;

      this.menuResizeAndScrollEventListeners = {
        remove: setupResizeAndScrollEventListeners($control, this.adjustMenuOpenDirection),
      };
    },

    removeMenuSizeWatcher() {
      if (!this.menuSizeWatcher) return;

      this.menuSizeWatcher.remove();
      this.menuSizeWatcher = null;
    },

    removeMenuResizeAndScrollEventListeners() {
      if (!this.menuResizeAndScrollEventListeners) return;

      this.menuResizeAndScrollEventListeners.remove();
      this.menuResizeAndScrollEventListeners = null;
    },
  },

  render() {
    return (
      h('div', { ref: 'menu-container', class: 'vue-customtreeselect__menu-container', style: this.menuContainerStyle }, [
        h('transition', { name: 'vue-customtreeselect__menu--transition' }, this.renderMenu()),
      ])
    );
  },
};
</script>
