import _each from 'lodash/each';
import { FormioComponents } from '../Components';
export class TabsComponent extends FormioComponents {
  createElement() {
    this.tabBar = this.ce('ul', {
      class: 'nav nav-tabs'
    });
    this.tabContent = this.ce('div', {
      class: 'tab-content'
    });
    this.tabs = [];
    this.tabLinks = [];
    _each(this.component.components, (tab, index) => {
      let tabPanel = this.ce('div', {
        role: 'tabpanel',
        class: 'tab-pane',
        id: tab.key
      });
      let tabLink = this.ce('a', {
        href: '#' + tab.key
      }, tab.label);
      this.addEventListener(tabLink, 'click', (event) => {
        event.preventDefault();
        this.setTab(index);
      });
      let tabElement = this.ce('li', {
        role: 'presentation'
      }, tabLink);
      this.tabLinks.push(tabElement);
      this.tabs.push(tabPanel);
      this.tabBar.appendChild(tabElement);
      this.tabContent.appendChild(tabPanel);
    });
    this.element = this.ce('div', {
      class: this.className
    }, [this.tabBar, this.tabContent]);
    this.setTab(0);
    return this.element;
  }

  setTab(index) {
    _each(this.tabLinks, (tabLink) => {
      this.removeClass(tabLink, 'active');
    });
    this.addClass(this.tabLinks[index], 'active');
    _each(this.tabs, (tab) => {
      this.removeClass(tab, 'active');
    });
    this.addClass(this.tabs[index], 'active');
  }

  addComponents() {
    _each(this.component.components, (tab, index) => {
      _each(tab.components, (component) => this.addComponent(component, this.tabs[index]));
    });
  }
}
