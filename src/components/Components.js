'use strict';
import _each from 'lodash/each';
import _filter from 'lodash/filter';
import _remove from 'lodash/remove';
import BaseComponent from './base/Base';
import _isArray from 'lodash/isArray';
class FormioComponents extends BaseComponent {
  constructor(component, options, data) {
    super(component, options, data);
    this.type = 'components';
  }

  build() {
    this.createElement();
    this.addComponents();
  }

  everyComponent(cb) {
    _each(this.components, (component) => {
      if (component.type === 'components') {
        if (component.everyComponent(cb) === false) {
          return false;
        }
      }
      else if (cb(component, this.components) === false) {
        return false;
      }
    });
  }

  eachComponent(cb) {
    _each(this.components, (component) => {
      if (cb(component) === false) {
        return false;
      }
    });
  }

  getComponent(key, cb) {
    let comp = null;
    this.everyComponent((component, components) => {
      if (component.component.key === key) {
        comp = component;
        if (cb) {
          cb(component, components);
        }
        return false;
      }
    });
    return comp;
  }

  getComponentById(id, cb) {
    let comp = null;
    this.everyComponent((component, components) => {
      if (component.id === id) {
        comp = component;
        if (cb) {
          cb(component, components);
        }
        return false;
      }
    });
    return comp;
  }

  addComponent(component, element, data) {
    element = element || this.element;
    data = data || this.data;
    let components = require('./index');
    let comp = components.create(component, this.options, data);
    this.components.push(comp);
    element.appendChild(comp.getElement());
    return comp;
  }

  removeComponent(key, cb) {
    let comp = this.getComponent(key, (component, components) => {
      component.element.parentNode.removeChild(component.element);
      _remove(components, {id: component.id});
      if (cb) {
        cb(component, components);
      }
    });
    if (!comp) {
      if (cb) {
        cb(null);
      }
      return null;
    }
  }

  removeComponentById(id, cb) {
    let comp = this.getComponentById(id, (component, components) => {
      component.element.parentNode.removeChild(component.element);
      _remove(components, {id: component.id});
      if (cb) {
        cb(component, components);
      }
    });
    if (!comp) {
      if (cb) {
        cb(null);
      }
      return null;
    }
  }

  addComponents(element, data) {
    element = element || this.element;
    data = data || this.data;
    _each(this.component.components, (component) => this.addComponent(component, element, data));
  }

  checkConditions(data) {
    super.checkConditions(data);
    _each(this.components, (comp) => comp.checkConditions(data));
  }

  set disable(disable) {
    _each(this.components, (component) => (component.disable = disable));
  }

  get errors() {
    let errors = [];
    _each(this.components, (comp) => {
      let compErrors = comp.errors;
      if (compErrors.length) {
        errors = errors.concat(compErrors);
      }
    });
    return errors;
  }

  getValue() {
    return this.data;
  }

  setValue(value) {
    _each(this.components, (component) => {
      if (component.input || (component.type === 'button')) {
        return;
      }

      if (component.type === 'components') {
        component.setValue(value);
      }
      else if (value && value.hasOwnProperty(component.component.key)) {
        component.setValue(value[component.component.key]);
      }
      else {
        component.setValue(null);
      }
    });
  }
}

module.exports = FormioComponents;