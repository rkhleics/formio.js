import { TextFieldComponent } from '../textfield/TextField';
export class PasswordComponent extends TextFieldComponent {
  elementInfo() {
    let info = super.elementInfo();
    info.attr.type = 'password';
    return info;
  }

  static get builderInfo() {
    return {
      title: 'Password',
      icon: 'fa fa-asterisk',
      group: 'basic',
      documentation: 'http://help.form.io/userguide/#password',
      weight: 20
    };
  }
}
