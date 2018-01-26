import { FormioComponents } from '../Components';
import _isObject from 'lodash/isObject';
import _each from 'lodash/each';

export class ContainerComponent extends FormioComponents {
  static schema(...extend) {
    return FormioComponents.schema({
      type: 'container',
      key: 'container',
      clearOnHide: true,
      input: true,
      components: []
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Container',
      icon: 'fa fa-folder-open',
      group: 'advanced',
      documentation: 'http://help.form.io/userguide/#container',
      weight: 140,
      schema: ContainerComponent.schema()
    };
  }

  constructor(component, options, data) {
    super(component, options, data);
    this.type = 'container';
  }

  build() {
    this.createElement();
    if (!this.data[this.component.key]) {
      this.data[this.component.key] = {};
    }
    this.addComponents(this.getContainer(), this.data[this.component.key]);
  }

  getValue() {
    let value = {};
    _each(this.components, (component) => {
      value[component.component.key] = component.getValue();
    });
    return value;
  }

  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    if (!value || !_isObject(value)) {
      return;
    }
    this.value = value;
    _each(this.components, (component) => {
      if (component.type === 'components') {
        component.setValue(value, flags);
      }
      else if (value.hasOwnProperty(component.component.key)) {
        component.setValue(value[component.component.key], flags);
      }
    });
    this.updateValue(flags);
  }
}
