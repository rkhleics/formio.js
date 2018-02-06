'use strict';
import _each from 'lodash/each';
import _clone from 'lodash/clone';
import _remove from 'lodash/remove';
import _assign from 'lodash/assign';
import _findIndex from 'lodash/findIndex';
import Promise from "native-promise-only";
import FormioUtils from '../utils/index';
import { BaseComponent } from './base/Base';

export class FormioComponents extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema({
      tree: true
    }, ...extend);
  }

  constructor(component, options, data) {
    super(component, options, data);
    this.type = 'components';
    this.components = [];
    this.hidden = [];
  }

  build() {
    this.createElement();
    this.addComponents();
  }

  get schema() {
    let schema = this.component;
    schema.components = [];
    this.eachComponent((component) => schema.components.push(component.schema));
    return schema;
  }

  getComponents() {
    return this.components;
  }

  /**
   * Perform a deep iteration over every component, including those
   * within other container based components.
   *
   * @param {function} cb - Called for every component.
   */
  everyComponent(cb) {
    const components = this.getComponents();
    _each(components, (component, index) => {
      if (cb(component, components, index) === false) {
        return false;
      }

      if (typeof component.everyComponent === 'function') {
        if (component.everyComponent(cb) === false) {
          return false;
        }
      }
    });
  }

  /**
   * Perform an iteration over each component within this container component.
   *
   * @param {function} cb - Called for each component
   */
  eachComponent(cb) {
    _each(this.getComponents(), (component, index) => {
      if (cb(component, index) === false) {
        return false;
      }
    });
  }

  /**
   * Returns a component provided a key. This performs a deep search within the
   * component tree.
   *
   * @param {string} key - The key of the component to retrieve.
   * @param {function} cb - Called with the component once found.
   * @return {Object} - The component that is located.
   */
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

  /**
   * Return a component provided the Id of the component.
   *
   * @param {string} id - The Id of the component.
   * @param {function} cb - Called with the component once it is retrieved.
   * @return {Object} - The component retrieved.
   */
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

  /**
   * Create a new component and add it to the components array.
   *
   * @param component
   * @param data
   */
  createComponent(component, options, data, before) {
    if (!this.options.components) {
      this.options.components = require('./index');
      _assign(this.options.components, FormioComponents.customComponents);
    }
    const comp = this.options.components.create(component, options, data, true);
    comp.parent = this;
    comp.root = this.root || this;
    comp.build();
    comp.isBuilt = true;
    if (component.internal) {
      return comp;
    }

    if (before) {
      let index = _findIndex(this.components, {id: before.id});
      if (index !== -1) {
        this.components.splice(index, 0, comp);
      }
      else {
        this.components.push(comp);
      }
    }
    else {
      this.components.push(comp);
    }
    return comp;
  }

  getContainer() {
    return this.element;
  }

  /**
   * Add a new component to the components array.
   *
   * @param {Object} component - The component JSON schema to add.
   * @param {HTMLElement} element - The DOM element to append this child to.
   * @param {Object} data - The submission data object to house the data for this component.
   * @param {HTMLElement} before - A DOM element to insert this element before.
   * @return {BaseComponent} - The created component instance.
   */
  addComponent(component, element, data, before) {
    element = element || this.getContainer();
    data = data || this.data;
    component.row = this.row;
    let comp = this.createComponent(component, this.options, data, before ? before.component : null);
    this.setHidden(comp);
    element = this.hook('addComponent', element, comp);
    if (before) {
      element.insertBefore(comp.getElement(), before);
    }
    else {
      element.appendChild(comp.getElement());
    }
    return comp;
  }

  /**
   * Remove a component from the components array.
   *
   * @param {BaseComponent} component - The component to remove from the components.
   * @param {Array<BaseComponent>} components - An array of components to remove this component from.
   */
  removeComponent(component, components) {
    components = components || this.components;
    component.destroy();
    const element = component.getElement();
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    _remove(components, {id: component.id});
  }

  /**
   * Removes a component provided the API key of that component.
   *
   * @param {string} key - The API key of the component to remove.
   * @param {function} cb - Called once the component is removed.
   * @return {null}
   */
  removeComponentByKey(key, cb) {
    const comp = this.getComponent(key, (component, components) => {
      this.removeComponent(component, components);
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

  /**
   * Removes a component provided the Id of the component.
   *
   * @param {string} id - The Id of the component to remove.
   * @param {function} cb - Called when the component is removed.
   * @return {null}
   */
  removeComponentById(id, cb) {
    const comp = this.getComponentById(id, (component, components) => {
      this.removeComponent(component, components);
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

  /**
   *
   * @param element
   * @param data
   */
  addComponents(element, data) {
    element = element || this.getContainer();
    data = data || this.data;
    let components = this.hook('addComponents', this.component.components);
    _each(components, (component) => this.addComponent(component, element, data));
  }

  updateValue(flags) {
    let changed = false;
    _each(this.components, (comp) => {
      changed |= comp.updateValue(flags);
    });
    return changed;
  }

  hasChanged() {
    return false;
  }

  /**
   * A more performant way to check the conditions, calculations, and validity of
   * a submission once it has been changed.
   *
   * @param data
   * @param flags
   */
  checkData(data, flags) {
    flags = flags || {};
    let valid = true;
    if (flags.noCheck) {
      return;
    }

    // Update the value.
    let changed = this.updateValue({
      noUpdateEvent: true
    });

    // Iterate through all components and check conditions, and calculate values.
    _each(this.getComponents(), (comp) => {
      changed |= comp.calculateValue(data, {
        noUpdateEvent: true
      });
      comp.checkConditions(data);
      if (!flags.noValidate) {
        valid &= comp.checkValidity(data);
      }
    });

    // Trigger the change if the values changed.
    if (changed) {
      this.triggerChange(flags);
    }

    // Return if the value is valid.
    return valid;
  }

  checkConditions(data) {
    let forceShow = false;
    let show = false;
    _each(this.getComponents(), (comp) => {
      const compShow = comp.checkConditions(data);
      forceShow |= (
        comp.hasCondition() &&
        compShow &&
        comp.component &&
        comp.component.conditional &&
        comp.component.conditional.overrideParent
      );
      show |= compShow;
    });

    // If any child has conditions set and are visible, then force the show.
    if (forceShow) {
      return this.show(true);
    }

    // Show if it explicitely says so.
    show |= super.checkConditions(data);
    return show;
  }

  /**
   * Allow components to hook into the next page trigger to perform their own logic.
   *
   * @return {*}
   */
  beforeNext() {
    const ops = [];
    _each(this.getComponents(), (comp) => ops.push(comp.beforeNext()));
    return Promise.all(ops);
  }

  /**
   * Allow components to hook into the submission to provide their own async data.
   *
   * @return {*}
   */
  beforeSubmit() {
    const ops = [];
    _each(this.getComponents(), (comp) => ops.push(comp.beforeSubmit()));
    return Promise.all(ops);
  }

  onResize(scale) {
    super.onResize(scale);
    _each(this.getComponents(), (comp) => comp.onResize(scale));
  }

  calculateValue(data, flags) {
    let changed = super.calculateValue(data, flags);
    _each(this.getComponents(), (comp) => {
      changed |= comp.calculateValue(data, flags);
    });
    return changed;
  }

  isValid(data, dirty) {
    let valid = super.isValid(data, dirty);
    _each(this.getComponents(), (comp) => {
      valid &= comp.isValid(data, dirty);
    });
    return valid;
  }

  checkValidity(data, dirty) {
    if (!FormioUtils.checkCondition(this.component, data, this.data)) {
      return true;
    }

    let check = super.checkValidity(data, dirty);
    _each(this.getComponents(), (comp) => {
      check &= comp.checkValidity(data, dirty);
    });
    return check;
  }

  setPristine(pristine) {
    super.setPristine(pristine);
    _each(this.getComponents(), (comp) => (comp.setPristine(pristine)));
  }

  destroy(all) {
    super.destroy(all);
    const components = _clone(this.components);
    _each(components, (comp) => this.removeComponent(comp, this.components));
    this.components = [];
    this.hidden = [];
  }

  set disabled(disabled) {
    _each(this.components, (component) => (component.disabled = disabled));
  }

  setHidden(component) {
    if (component.components && component.components.length) {
      component.hideComponents(this.hidden);
    }
    else if (component.component.hidden) {
      component.visible = false;
    }
    else {
      component.visible = (!this.hidden || !this.hidden.includes(component.component.key));
    }
  }

  hideComponents(hidden) {
    this.hidden = hidden;
    this.eachComponent((component) => this.setHidden(component));
  }

  get errors() {
    let errors = [];
    _each(this.getComponents(), (comp) => {
      const compErrors = comp.errors;
      if (compErrors.length) {
        errors = errors.concat(compErrors);
      }
    });
    return errors;
  }

  get value() {
    return this.data;
  }

  getValue() {
    return this.data;
  }

  whenReady() {
    const promises = [];
    _each(this.getComponents(), (component) => {
      promises.push(component.whenReady());
    });
    return Promise.all(promises);
  }

  setValue(value, flags) {
    if (!value) {
      return false;
    }
    flags = this.getFlags.apply(this, arguments);
    let changed = false;
    _each(this.getComponents(), (component) => {
      if (component.type === 'button') {
        return;
      }

      if (component.type === 'components') {
        changed |= component.setValue(value, flags);
      }
      else if (value && value.hasOwnProperty(component.component.key)) {
        changed |= component.setValue(value[component.component.key], flags);
      }
      else if (component.hasInput) {
        flags.noValidate = true;
        changed |= component.setValue(null, flags);
      }
    });
    return changed;
  }
}

FormioComponents.customComponents = {};
FormioComponents.groupInfo = {
  basic: {
    title: 'Basic Components',
    weight: 0
  },
  advanced: {
    title: 'Advanced',
    weight: 10
  },
  layout: {
    title: 'Layout',
    weight: 20
  }
};
