import { TextFieldComponent } from '../textfield/TextField';
export class PhoneNumberComponent extends TextFieldComponent {
  static get builderInfo() {
    return {
      title: 'Phone Number',
      icon: 'fa fa-phone-square',
      group: 'advanced',
      documentation: 'http://help.form.io/userguide/#phonenumber',
      weight: 10
    };
  }
}
