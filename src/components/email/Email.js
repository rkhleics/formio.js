import { TextFieldComponent } from '../textfield/TextField';
export class EmailComponent extends TextFieldComponent {
  constructor(component, options, data) {
    super(component, options, data);
    this.validators.push('email');
  }
  elementInfo() {
    let info = super.elementInfo();
    info.attr.type = 'email';
    return info;
  }

  static get builderInfo() {
    return {
      title: 'Email',
      icon: 'fa fa-at',
      group: 'advanced',
      documentation: 'http://help.form.io/userguide/#email'
    };
  }
}
