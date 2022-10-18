import CustomTreeSelect from './src/components/TreeSelect.vue';
import customTreeselectMixin from './src/mixins/customTreeselectMixin';
import './styles/style.less';

export default CustomTreeSelect;
export { CustomTreeSelect, customTreeselectMixin };
export {
  // Delayed loading.
  LOAD_ROOT_OPTIONS,
  LOAD_CHILDREN_OPTIONS,
  ASYNC_SEARCH,
} from './src/constants';
