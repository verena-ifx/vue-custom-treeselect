<script>
import { defineComponent, h } from 'vue';
import { UNCHECKED, INDETERMINATE, CHECKED } from '../constants';
import { onLeftClick } from '../utils';
import Tip from './Tip.vue';
import ArrowIcon from './icons/Arrow.vue';

let arrowPlaceholder; let checkMark; let
  minusMark;

const Option = {
  name: 'vue-customtreeselect--option',
  inject: ['instance'],

  props: {
    node: {
      type: Object,
      required: true,
    },
  },

  computed: {
    shouldExpand() {
      const { instance, node } = this;

      return node.isBranch && instance.shouldExpand(node);
    },

    shouldShow() {
      const { instance, node } = this;
      return instance.shouldShowOptionInMenu(node);
    },
  },

  methods: {
    renderOption() {
      const { instance, node } = this;
      const optionClass = {
        'vue-customtreeselect__option': true,
        'vue-customtreeselect__option--disabled': node.isDisabled,
        'vue-customtreeselect__option--selected': instance.isSelected(node),
        'vue-customtreeselect__option--highlight': node.isHighlighted,
        'vue-customtreeselect__option--matched': instance.localSearch.active && node.isMatched,
        'vue-customtreeselect__option--hide': !this.shouldShow,
      };

      const t = (
        h('div', {
          class: optionClass,
          onMouseenter: this.handleMouseEnterOption,
          dataId: node.id,
        }, [
          this.renderArrow(),
          this.renderCheckboxContainer([
            this.renderCheckbox(),
          ]), this.renderLabelContainer([
            this.renderLabel(),
          ])])
      );
      return t;
    },

    renderSubOptionsList() {
      if (!this.shouldExpand) return null;

      return (
        h('div', { class: 'vue-customtreeselect__list' }, [
          ...this.renderSubOptions(),
          this.renderNoChildrenTip(),
          this.renderLoadingChildrenTip(),
          this.renderLoadingChildrenErrorTip(),
        ])
      );
    },

    renderArrow() {
      const { instance, node } = this;

      if (instance.shouldFlattenOptions && this.shouldShow) return null;
      if (node.isBranch) {
        const arrowClass = {
          'vue-customtreeselect__option-arrow': true,
          'vue-customtreeselect__option-arrow--rotated': this.shouldExpand,
        };

        return (
          h('div', { class: 'vue-customtreeselect__option-arrow-container', onMousedown: this.handleMouseDownOnArrow },
            [
              h('transition', { name: 'vue-customtreeselect__option-arrow--prepare', appear: true }, [
                h(ArrowIcon, { class: arrowClass })]),
            ])
        );
      }

      // For leaf nodes, we render a placeholder to keep its label aligned to
      // branch nodes. Unless there is no branch nodes at all (a normal
      // non-tree select).
      if (/* node.isLeaf && */instance.hasBranchNodes) {
        if (!arrowPlaceholder) {
          arrowPlaceholder = (
            h('div', { class: 'vue-customtreeselect__option-arrow-placeholder' }, [])
          );
        }

        return arrowPlaceholder;
      }

      return null;
    },

    renderLabelContainer(children) {
      return (
        h('div', {
          class: 'vue-customtreeselect__label-container',
          onMousedown: this.handleMouseDownOnLabelContainer,
        }, children)
      );
    },

    renderCheckboxContainer(children) {
      const { instance, node } = this;

      if (instance.single) return null;
      if (instance.disableBranchNodes && node.isBranch) return null;

      return (
        h('div', {
          class: 'vue-customtreeselect__checkbox-container',
          onMousedown: this.handleMouseDownOnLabelContainer,
        }, children)
      );
    },

    renderCheckbox() {
      const { instance, node } = this;
      const checkedState = instance.forest.checkedStateMap[node.id];
      const checkboxClass = {
        'vue-customtreeselect__checkbox': true,
        'vue-customtreeselect__checkbox--checked': checkedState === CHECKED,
        'vue-customtreeselect__checkbox--indeterminate': checkedState === INDETERMINATE,
        'vue-customtreeselect__checkbox--unchecked': checkedState === UNCHECKED,
        'vue-customtreeselect__checkbox--disabled': node.isDisabled,
      };

      if (!checkMark) {
        checkMark = (
          h('span', { class: 'vue-customtreeselect__check-mark' })
        );
      }
      if (!minusMark) {
        minusMark = (
          h('span', { class: 'vue-customtreeselect__minus-mark' })
        );
      }

      return (
        h('span', { class: checkboxClass }, [
          checkMark,
          minusMark])
      );
    },

    renderLabel() {
      const { instance, node } = this;
      const shouldShowCount = (
        node.isBranch && (instance.localSearch.active
          ? instance.showCountOnSearchComputed
          : instance.showCount
        )
      );
      // eslint-disable-next-line no-nested-ternary
      const count = shouldShowCount
        ? instance.localSearch.active
          ? instance.localSearch.countMap[node.id][instance.showCountOf]
          : node.count[instance.showCountOf]
        : NaN;
      const labelClassName = 'vue-customtreeselect__label';
      const countClassName = 'vue-customtreeselect__count';
      const customLabelRenderer = instance.$slots['option-label'];

      if (customLabelRenderer) {
        return customLabelRenderer({
          node,
          shouldShowCount,
          count,
          labelClassName,
          countClassName,
        });
      }
      return (
        h('label', { class: labelClassName }, [
          node.label,
          (shouldShowCount && (
            h('span', { class: countClassName }, [count])
          )),
        ])
      );
    },

    renderSubOptions() {
      const { node } = this;

      if (!node.childrenStates.isLoaded) return null;

      return node.children.map((childNode) => (
        h(Option, { node: childNode, key: childNode.id })
      ));
    },

    renderNoChildrenTip() {
      const { instance, node } = this;

      if (!node.childrenStates.isLoaded || node.children.length) return null;

      return (
        h(Tip, { type: 'no-children', icon: 'warning' }, () => instance.noChildrenText)
      );
    },

    renderLoadingChildrenTip() {
      const { instance, node } = this;

      if (!node.childrenStates.isLoading) return null;

      return (
        h(Tip, { type: 'loading', icon: 'loader' }, () => [instance.noChildrenText])
      );
    },

    renderLoadingChildrenErrorTip() {
      const { instance, node } = this;

      if (!node.childrenStates.loadingError) return null;

      return (
        h(Tip, { type: 'error', icon: 'error' }, () => [
          node.childrenStates.loadingError,
          h('a', { class: 'vue-customtreeselect__retry', title: instance.retryTitle, onMousedown: this.handleMouseDownOnRetry }, [
            instance.retryText]),
        ])
      );
    },

    handleMouseEnterOption(evt) {
      const { instance, node } = this;

      // Equivalent to `self` modifier.
      // istanbul ignore next
      if (evt.target !== evt.currentTarget) return;

      instance.setCurrentHighlightedOption(node, false);
    },

    handleMouseDownOnArrow: onLeftClick(function handleMouseDownOnOptionArrow() {
      const { instance, node } = this;
      instance.toggleExpanded(node);
    }),

    handleMouseDownOnLabelContainer: onLeftClick(function handleMouseDownOnLabelContainer() {
      const { instance, node } = this;

      if (node.isBranch && instance.disableBranchNodes) {
        instance.toggleExpanded(node);
      } else {
        instance.select(node);
      }
    }),

    handleMouseDownOnRetry: onLeftClick(function handleMouseDownOnRetry() {
      const { instance, node } = this;
      instance.loadChildrenOptions(node);
    }),
  },

  render() {
    const { node } = this;
    const indentLevel = this.instance.shouldFlattenOptions ? 0 : node.level;
    const listItemClass = {
      'vue-customtreeselect__list-item': true,
      [`vue-customtreeselect__indent-level-${indentLevel}`]: true,
    };

    const childs = [this.renderOption()];

    if (node.isBranch) {
      childs.push(h('transition', {
        name: 'vue-customtreeselect__list--transition',
      }, [
        this.renderSubOptionsList(),
      ]));
    }

    return (
      h('div', { class: listItemClass },
        childs)
    );
  },
};

// eslint-disable-next-line vue/require-direct-export
export default Option;
</script>
