import _each from 'lodash/each';
import { FormioComponents } from '../Components';
export class ColumnsComponent extends FormioComponents {
  get className() {
    return 'row ' + super.className;
  }
  addComponents() {
    let container = this.getContainer();
    _each(this.component.columns, (column) => {
      column.type = 'column';
      this.addComponent(column, container, this.data);
    });
  }
}
