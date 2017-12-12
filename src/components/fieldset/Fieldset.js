import { FormioComponents } from '../Components';
export class FieldsetComponent extends FormioComponents {
  get className() {
    return 'form-group ' + super.className;
  }

  build() {
    this.createElement();
    if (this.component.legend) {
      let legend = this.ce('legend');
      legend.appendChild(this.text(this.component.legend));
      this.createTooltip(legend);
      this.element.appendChild(legend);
    }
    this.addComponents();
  }
}
