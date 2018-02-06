import { BaseComponent } from '../base/Base';
import _assign from 'lodash/assign';

export class CheckBoxComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema({
      type: 'checkbox',
      inputType: 'checkbox',
      label: 'Checkbox',
      key: 'checkbox',
      datagridLabel: true,
      value: '',
      name: ''
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Checkbox',
      group: 'basic',
      icon: 'fa fa-check-square',
      documentation: 'http://help.form.io/userguide/#checkbox',
      weight: 50,
      schema: CheckBoxComponent.schema()
    };
  }

  elementInfo() {
    const info = super.elementInfo();
    info.type = 'input';
    info.changeEvent = 'click';
    info.attr.type = this.component.inputType || 'checkbox';
    info.attr.class = 'form-check-input';
    if (this.component.name) {
      info.attr.name = `data[${this.component.name}]`;
    }
    info.attr.value = this.component.value ? this.component.value : 0;
    return info;
  }

  build() {
    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    if (!this.component.input) {
      return;
    }
    this.createElement();
    this.input = this.createInput(this.element);
    this.createLabel(this.element, this.input);
    if (!this.labelElement) {
      this.addInput(this.input, this.element);
    }
    this.createDescription(this.element);
    this.restoreValue();
    if (this.shouldDisable) {
      this.disabled = true;
    }
  }

  createElement() {
    let className = `form-check ${this.className}`;
    if (this.component.label) {
      className += ' checkbox';
    }
    this.element = this.ce('div', {
      id: this.id,
      class: className
    });
    this.element.component = this;
  }

  labelOnTheTopOrLeft() {
    return ['top', 'left'].includes(this.component.labelPosition);
  }

  labelOnTheTopOrBottom() {
    return ['top', 'bottom'].includes(this.component.labelPosition);
  }

  setInputLabelStyle(label) {
    if (this.component.labelPosition === 'left') {
      _assign(label.style, {
        textAlign: 'center',
        paddingLeft: 0,
      });
    }

    if (this.labelOnTheTopOrBottom()) {
      _assign(label.style, {
        display: 'block',
        textAlign: 'center',
        paddingLeft: 0,
      });
    }
  }

  setInputStyle(input) {
    if (this.component.labelPosition === 'left') {
      _assign(input.style, {
        position: 'initial',
        marginLeft: '7px'
      });
    }

    if (this.labelOnTheTopOrBottom()) {
      _assign(input.style, {
        width: '100%',
        position: 'initial',
        marginLeft: 0
      });
    }
  }

  createLabel(container, input) {
    if (!this.component.label) {
      return null;
    }

    let className = 'control-label form-check-label';
    if (this.component.input && this.component.validate && this.component.validate.required) {
      className += ' field-required';
    }

    this.labelElement = this.ce('label', {
      class: className
    });
    this.addShortcut();

    const labelOnTheTopOrOnTheLeft = this.labelOnTheTopOrLeft();

    // Create the SPAN around the textNode for better style hooks
    this.labelSpan = this.ce('span');

    if (this.info.attr.id) {
      this.labelElement.setAttribute('for', this.info.attr.id);
    }
    if (!this.options.inputsOnly && labelOnTheTopOrOnTheLeft) {
      this.setInputLabelStyle(this.labelElement);
      this.setInputStyle(input);
      this.labelSpan.appendChild(this.text(this.component.label));
      this.labelElement.appendChild(this.labelSpan);
    }
    this.addInput(input, this.labelElement);

    if (!this.options.inputsOnly && !labelOnTheTopOrOnTheLeft) {
      this.setInputLabelStyle(this.labelElement);
      this.setInputStyle(input);
      this.labelSpan.appendChild(this.text(this.addShortcutToLabel()));
      this.labelElement.appendChild(this.labelSpan);
    }
    this.createTooltip(this.labelElement);
    container.appendChild(this.labelElement);
  }

  createInput(container) {
    if (!this.component.input) {
      return;
    }
    const input = this.ce(this.info.type, this.info.attr);
    this.errorContainer = container;
    return input;
  }

  updateValueByName() {
    const component = this.getRoot().getComponent(this.component.name);

    if (component) {
      component.setValue(this.component.value, { changed: true });
    }
    else {
      this.data[this.component.name] = this.component.value;
    }
  }

  addInputEventListener(input) {
    this.addEventListener(input, this.info.changeEvent, () => {
      // If this input has a "name", then its other input elements are elsewhere on
      // the form. To get the correct submission object, we need to refresh the whole
      // data object.
      if (this.component.name) {
        this.updateValueByName();
        this.emit('refreshData');
      }

      this.updateValue();
    });
  }

  getValueAt(index) {
    return !!this.inputs[index].checked;
  }

  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    if (!this.input) {
      return;
    }
    if (value === 'on') {
      this.input.value = 1;
      this.input.checked = 1;
    }
    else if (value === 'off') {
      this.input.value = 0;
      this.input.checked = 0;
    }
    else if (value) {
      this.input.value = 1;
      this.input.checked = 1;
    }
    else {
      this.input.value = 0;
      this.input.checked = 0;
    }
    this.updateValue(flags);
  }

  getRawValue() {
    if (this.component.name) {
      return this.data[this.component.name];
    }

    return super.getRawValue();
  }

  getView(value) {
    return value ? 'Yes' : 'No';
  }

  destroy() {
    super.destroy.apply(this, Array.prototype.slice.apply(arguments));
    this.removeShortcut();
  }
}
