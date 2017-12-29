import { FormioComponents } from '../Components';
export class PanelComponent extends FormioComponents {
  constructor(component, options, data) {
    super(component, options, data);
    this.collapsed = !!this.component.collapsed;
  }

  getContainer() {
    return this.panelBody;
  }

  get className() {
    return 'panel panel-' + this.component.theme + ' ' + super.className;
  }

  setCollapsed() {
    if (this.collapsed) {
      this.panelBody.setAttribute('hidden', true);
      this.panelBody.style.visibility = 'hidden';
    }
    else {
      this.panelBody.removeAttribute('hidden');
      this.panelBody.style.visibility = 'visible';
    }
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.setCollapsed();
  }

  build() {
    this.component.theme = this.component.theme || 'default';
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

      if (this.component.collapsible) {
        this.addClass(heading, 'formio-clickable');
        this.addEventListener(heading, 'click', (event) => this.toggleCollapse());
      }

      this.element.appendChild(heading);
    }
    this.panelBody = this.ce('div', {
      class: 'panel-body'
    });
    this.addComponents();
    this.element.appendChild(this.panelBody);
    this.setCollapsed();
  }
}
