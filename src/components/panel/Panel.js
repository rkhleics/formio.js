import { FormioComponents } from '../Components';
export class PanelComponent extends FormioComponents {
  getContainer() {
    return this.panelBody;
  }

  get className() {
    return 'panel panel-' + this.component.theme + ' ' + super.className;
  }

  build() {
    this.createElement();
    if (this.component.title) {
      let heading = this.ce('div', {
        class: 'panel-heading'
      });
      let title = this.ce('h3', {
        class: 'panel-title'
      });
      title.appendChild(this.text(this.component.title));
      this.createTooltip(title);
      heading.appendChild(title);
      this.element.appendChild(heading);
    }
    this.panelBody = this.ce('div', {
      class: 'panel-body'
    });
    this.addComponents();
    this.element.appendChild(this.panelBody);
  }
}
