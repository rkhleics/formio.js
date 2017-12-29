import { BaseComponent } from '../base/Base';
export class TextFieldComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema({
      type: 'textfield',
      inputType: 'text',
      inputMask: '',
      validate: {
        minLength: '',
        maxLength: '',
        pattern: ''
      }
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Text Field',
      icon: 'fa fa-terminal',
      group: 'basic',
      documentation: 'http://help.form.io/userguide/#textfield',
      weight: 0,
      schema: TextFieldComponent.schema()
    };
  }

  elementInfo() {
    let info = super.elementInfo();
    info.type = 'input';

    if (this.component.mask) {
      info.attr.type = 'password';
    }
    else {
      info.attr.type = 'text';
    }
    info.changeEvent = 'input';
    return info;
  }
}
