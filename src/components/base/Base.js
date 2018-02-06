import maskInput, { conformToMask } from 'vanilla-text-mask';
import Promise from "native-promise-only";
import _get from 'lodash/get';
import _each from 'lodash/each';
import _merge from 'lodash/merge';
import _debounce from 'lodash/debounce';
import _isArray from 'lodash/isArray';
import _clone from 'lodash/clone';
import _cloneDeep from 'lodash/cloneDeep';
import _defaults from 'lodash/defaults';
import _isEqual from 'lodash/isEqual';
import _isUndefined from 'lodash/isUndefined';
import _toString from 'lodash/toString';
import FormioUtils from '../../utils';
import { Validator } from '../Validator';
import Tooltip from 'tooltip.js';
import i18next from 'i18next';

/**
 * This is the BaseComponent class which all elements within the FormioForm derive from.
 */
export class BaseComponent {
  static schema(...sources) {
    return _merge({
      /**
       * Determines if this component provides an input.
       */
      input: true,

      /**
       * The data key for this component (how the data is stored in the database).
       */
      key: '',

      /**
       * The input placeholder for this component.
       */
      placeholder: '',

      /**
       * The input prefix
       */
      prefix: '',

      /**
       * The custom CSS class to provide to this component.
       */
      customClass: '',

      /**
       * The input suffix.
       */
      suffix: '',

      /**
       * If this component should allow an array of values to be captured.
       */
      multiple: false,

      /**
       * The default value of this compoennt.
       */
      defaultValue: null,

      /**
       * If the data of this component should be protected (no GET api requests can see the data)
       */
      protected: false,

      /**
       * Validate if the value of this component should be unique within the form.
       */
      unique: false,

      /**
       * If the value of this component should be persisted within the backend api database.
       */
      persistent: false,

      /**
       * Determines if the component should be within the form, but not visible.
       */
      hidden: false,

      /**
       * If the component should be cleared when hidden.
       */
      clearOnHide: true,

      /**
       * If this component should be included as a column within a submission table.
       */
      tableView: true,

      /**
       * The input label provided to this component.
       */
      label: '',

      /**
       * The validation criteria for this component.
       */
      validate: {
        /**
         * If this component is required.
         */
        required: false,

        /**
         * Custom JavaScript validation.
         */
        custom: '',

        /**
         * If the custom validation should remain private (only the backend will see it and execute it).
         */
        customPrivate: false
      },

      /**
       * The simple conditional settings for a component.
       */
      conditional: {
        show: null,
        when: null,
        eq: ''
      }
    }, ...sources);
  }

  /**
   * Initialize a new BaseComponent.
   *
   * @param {Object} component - The component JSON you wish to initialize.
   * @param {Object} options - The options for this component.
   * @param {Object} data - The global data submission object this component will belong.
   */
  constructor(component, options, data) {
    this.originalComponent = _cloneDeep(component);
    /**
     * The ID of this component. This value is auto-generated when the component is created, but
     * can also be provided from the component.id value passed into the constructor.
     * @type {string}
     */
    this.id = (component && component.id) ? component.id : `e${Math.random().toString(36).substring(7)}`;

    /**
     * The options for this component.
     * @type {{}}
     */
    this.options = _defaults(_clone(options), {
      highlightErrors: true
    });

    // Use the i18next that is passed in, otherwise use the global version.
    this.i18next = this.options.i18next || i18next;

    /**
     * Determines if this component has a condition assigned to it.
     * @type {null}
     * @private
     */
    this._hasCondition = null;

    /**
     * The events that are triggered for the whole FormioForm object.
     */
    this.events = this.options.events;

    /**
     * The data object in which this component resides.
     * @type {*}
     */
    this.data = data || {};

    /**
     * The Form.io component JSON schema.
     * @type {*}
     */
    this.component = component || {};

    // Add the id to the component.
    this.component.id = this.id;

    /**
     * The bounding HTML Element which this component is rendered.
     * @type {null}
     */
    this.element = null;

    /**
     * The HTML Element for the table body. This is relevant for the "multiple" flag on inputs.
     * @type {null}
     */
    this.tbody = null;

    /**
     * The HTMLElement that is assigned to the label of this component.
     * @type {null}
     */
    this.labelElement = null;

    /**
     * The HTMLElement for which the errors are rendered for this component (usually underneath the component).
     * @type {null}
     */
    this.errorElement = null;

    /**
     * The existing error that this component has.
     * @type {string}
     */
    this.error = '';

    /**
     * An array of all of the input HTML Elements that have been added to this component.
     * @type {Array}
     */
    this.inputs = [];

    /**
     * The basic component information which tells the BaseComponent how to render the input element of the components that derive from this class.
     * @type {null}
     */
    this.info = null;

    /**
     * The row path of this component.
     * @type {number}
     */
    this.row = component ? component.row : '';
    this.row = this.row || '';

    /**
     * Determines if this component is disabled, or not.
     *
     * @type {boolean}
     */
    this._disabled = false;

    /**
     * Determines if this component is visible, or not.
     */
    this._visible = true;

    /**
     * If this input has been input and provided value.
     *
     * @type {boolean}
     */
    this.pristine = true;

    /**
     * Points to the parent component.
     *
     * @type {BaseComponent}
     */
    this.parent = null;

    /**
     * Points to the root component, usually the FormComponent.
     *
     * @type {BaseComponent}
     */
    this.root = this;

    /**
     * The Input mask instance for this component.
     * @type {InputMask}
     */
    this.inputMask = null;

    this.options.name = this.options.name || 'data';

    /**
     * The validators that are assigned to this component.
     * @type {[string]}
     */
    this.validators = ['required', 'minLength', 'maxLength', 'custom', 'pattern', 'json', 'mask'];

    /**
     * Used to trigger a new change in this component.
     * @type {function} - Call to trigger a change in this component.
     */
    this.triggerChange = _debounce(this.onChange.bind(this), 100);

    /**
     * An array of event handlers so that the destry command can deregister them.
     * @type {Array}
     */
    this.eventHandlers = [];

    // To force this component to be invalid.
    this.invalid = false;

    // Determine if the component has been built.
    this.isBuilt = false;

    /**
     * An array of the event listeners so that the destroy command can deregister them.
     * @type {Array}
     */
    this.eventListeners = [];

    if (this.component) {
      this.type = this.component.type;
      if (this.hasInput && this.component.key) {
        this.options.name += `[${this.component.key}]`;
      }

      /**
       * The element information for creating the input element.
       * @type {*}
       */
      this.info = this.elementInfo();
    }

    // Allow anyone to hook into the component creation.
    this.hook('component');
  }

  get hasInput() {
    return this.component.input || this.inputs.length;
  }

  /**
   * Returns the JSON schema for this component.
   */
  get schema() {
    return this.component;
  }

  /**
   * Translate a text using the i18n system.
   *
   * @param {string} text - The i18n identifier.
   * @param {Object} params - The i18n parameters to use for translation.
   */
  t(text, params) {
    params = params || {};
    params.data = this.root ? this.root.data : this.data;
    params.row = this.data;
    params.component = this.component;
    params.nsSeparator = '::';
    params.keySeparator = '.|.';
    params.pluralSeparator = '._.';
    params.contextSeparator = '._.';
    let translated = this.i18next.t(text, params);
    return translated || text;
  }

  /**
   * Register for a new event within this component.
   *
   * @example
   * let component = new BaseComponent({
   *   type: 'textfield',
   *   label: 'First Name',
   *   key: 'firstName'
   * });
   * component.on('componentChange', (changed) => {
   *   console.log('this element is changed.');
   * });
   *
   *
   * @param {string} event - The event you wish to register the handler for.
   * @param {function} cb - The callback handler to handle this event.
   * @param {boolean} internal - This is an internal event handler.
   */
  on(event, cb, internal) {
    if (!this.events) {
      return;
    }
    let type = `formio.${event}`;
    this.eventListeners.push({
      type: type,
      listener: cb,
      internal: internal
    });
    return this.events.on(type, cb);
  }

  /**
   * Emit a new event.
   *
   * @param {string} event - The event to emit.
   * @param {Object} data - The data to emit with the handler.
   */
  emit(event, data) {
    this.events.emit(`formio.${event}`, data);
  }

  /**
   * Returns an HTMLElement icon element.
   *
   * @param {string} name - The name of the icon to retrieve.
   * @returns {HTMLElement} - The icon element.
   */
  getIcon(name) {
    return this.ce('i', {
      class: this.iconClass(name)
    });
  }

  getBrowserLanguage() {
    const nav = window.navigator;
    const browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'];
    let language;

    // support for HTML 5.1 "navigator.languages"
    if (Array.isArray(nav.languages)) {
      for (let i = 0; i < nav.languages.length; i++) {
        language = nav.languages[i];
        if (language && language.length) {
          return language;
        }
      }
    }

    // support for other well known properties in browsers
    for (let i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }

    return null;
  }

  /**
   * Called before a next page is triggered allowing the components
   * to perform special functions.
   *
   * @return {*}
   */
  beforeNext() {
    return Promise.resolve(true);
  }

  /**
   * Called before a submission is triggered allowing the components
   * to perform special async functions.
   *
   * @return {*}
   */
  beforeSubmit() {
    return Promise.resolve(true);
  }

  get shouldDisable() {
    return (this.options.readOnly || this.component.disabled);
  }

  /**
   * Builds the component.
   */
  build() {
    if (this.viewOnly) {
      this.viewOnlyBuild();
    }
    else {
      this.createElement();

      const labelAtTheBottom = this.component.labelPosition === 'bottom';
      if (!labelAtTheBottom) {
        this.createLabel(this.element);
      }
      if (!this.createWrapper()) {
        this.createInput(this.element);
      }
      if (labelAtTheBottom) {
        this.createLabel(this.element);
      }
      this.createDescription(this.element);

      // Disable if needed.
      if (this.shouldDisable) {
        this.disabled = true;
      }

      // Restore the value.
      this.restoreValue();
    }
  }

  get viewOnly() {
    return this.options.readOnly && this.options.viewAsHtml;
  }

  viewOnlyBuild() {
    this.createViewOnlyElement();
    this.createViewOnlyLabel(this.element);
    this.createViewOnlyValue(this.element);
  }

  createViewOnlyElement() {
    this.element = this.ce('dl', {
      id: this.id
    });

    if (this.element) {
      // Ensure you can get the component info from the element.
      this.element.component = this.component;
    }

    return this.element;
  }

  createViewOnlyLabel(container) {
    if (this.labelIsHidden()) {
      return;
    }

    this.labelElement = this.ce('dt');
    this.labelElement.appendChild(this.text(this.component.label));
    this.createTooltip(this.labelElement);
    container.appendChild(this.labelElement);
  }

  createViewOnlyValue(container) {
    this.valueElement = this.ce('dd');
    this.setupValueElement(this.valueElement);
    container.appendChild(this.valueElement);
  }

  setupValueElement(element) {
    let value = this.value;
    value = this.isEmpty(value) ? this.defaultViewOnlyValue : this.getView(value);
    element.appendChild(this.text(value));
  }

  get defaultViewOnlyValue() {
    return '-';
  }

  getView(value) {
    return _toString(value);
  }

  updateViewOnlyValue() {
    this.empty(this.valueElement);
    this.setupValueElement(this.valueElement);
  }

  empty(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  createModal(title) {
    let modalBody = this.ce('div');
    let modalOverlay = this.ce('div', {
      class: 'formio-dialog-overlay'
    });
    let closeDialog = this.ce('button', {
      class: 'formio-dialog-close pull-right btn btn-default btn-xs',
      'aria-label': 'close'
    });

    let dialog = this.ce('div', {
      class: 'formio-dialog formio-dialog-theme-default component-settings'
    }, [
      modalOverlay,
      this.ce('div', {
        class: 'formio-dialog-content'
      }, [
        modalBody,
        closeDialog
      ])
    ]);

    this.addEventListener(modalOverlay, 'click', (event) => {
      event.preventDefault();
      dialog.close();
    });
    this.addEventListener(closeDialog, 'click', (event) => {
      event.preventDefault();
      dialog.close();
    });
    this.addEventListener(dialog, 'close', () => {
      document.body.removeChild(dialog);
    });
    document.body.appendChild(dialog);
    dialog.body = modalBody;
    dialog.close = function() {
      dialog.dispatchEvent(new CustomEvent('close'));
      try {
        document.body.removeChild(dialog);
      }
      catch (err) {}
    };
    return dialog;
  }

  /**
   * Retrieves the CSS class name of this component.
   * @returns {string} - The class name of this component.
   */
  get className() {
    let className = this.hasInput ? 'form-group has-feedback ' : '';
    className += `formio-component formio-component-${this.component.type} `;
    if (this.component.key) {
      className += `formio-component-${this.component.key} `;
    }
    if (this.component.customClass) {
      className += this.component.customClass;
    }
    if (this.hasInput && this.component.validate && this.component.validate.required) {
      className += ' required';
    }
    return className;
  }

  /**
   * Build the custom style from the layout values
   * @return {string} - The custom style
   */
  get customStyle() {
    let customCSS = '';
    _each(this.component.style, function(value, key) {
        if (value !== '') {
          customCSS += `${key}:${value};`;
        }
    });
    return customCSS;
  }

  /**
   * Returns the outside wrapping element of this component.
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }

  /**
   * Create the outside wrapping element for this component.
   * @returns {HTMLElement}
   */
  createElement() {
    // If the element is already created, don't recreate.
    if (this.element) {
      return this.element;
    }

    this.element = this.ce('div', {
      id: this.id,
      class: this.className,
      style: this.customStyle
    });

    // Ensure you can get the component info from the element.
    this.element.component = this.component;

    this.hook('element', this.element);
    return this.element;
  }

  /**
   * Create the input wrapping element. For multiple, this may be the table wrapper for the elements.
   * @returns {boolean}
   */
  createWrapper() {
    if (!this.component.multiple) {
      return false;
    }
    else {
      let table = this.ce('table', {
        class: 'table table-bordered'
      });
      this.tbody = this.ce('tbody');
      table.appendChild(this.tbody);

      // Add a default value.
      if (!this.data[this.component.key] || !this.data[this.component.key].length) {
        this.addNewValue();
      }

      // Build the rows.
      this.buildRows();

      this.setInputStyles(table);

      // Add the table to the element.
      this.append(table);
      return true;
    }
  }

  get defaultValue() {
    let defaultValue = '';
    if (this.component.defaultValue) {
      defaultValue = this.component.defaultValue;
    }
    else if (this.component.customDefaultValue) {
      if (typeof this.component.customDefaultValue === 'string') {
        try {
          defaultValue = (new Function('component', 'row', 'data', `var value = ''; ${this.component.customDefaultValue.toString()}; return value;`))(this, this.data, this.data);
        }
        catch (err) {
          defaultValue = null;
          /* eslint-disable no-console */
          console.warn(`An error occurred getting default value for ${this.component.key}`, e);
          /* eslint-enable no-console */
        }
      }
      else {
        try {
          defaultValue = FormioUtils.jsonLogic.apply(this.component.customDefaultValue, {
            data: this.data,
            row: this.data
          });
        }
        catch (err) {
          defaultValue = null;
          /* eslint-disable no-console */
          console.warn(`An error occurred calculating a value for ${this.component.key}`, err);
          /* eslint-enable no-console */
        }
      }
    }

    if (this._inputMask) {
      defaultValue = conformToMask(defaultValue, this._inputMask).conformedValue;
      if (!FormioUtils.matchInputMask(defaultValue, this._inputMask)) {
        defaultValue = '';
      }
    }

    return defaultValue;
  }

  /**
   * Sets the pristine flag for this component.
   *
   * @param pristine {boolean} - TRUE to make pristine, FALSE not pristine.
   */
  setPristine(pristine) {
    this.pristine = pristine;
  }

  /**
   * Adds a new empty value to the data array.
   */
  addNewValue() {
    if (!this.data[this.component.key]) {
      this.data[this.component.key] = [];
    }
    if (this.data[this.component.key] && !_isArray(this.data[this.component.key])) {
      this.data[this.component.key] = [this.data[this.component.key]];
    }
    this.data[this.component.key].push(this.defaultValue);
  }

  /**
   * Adds a new empty value to the data array, and add a new row to contain it.
   */
  addValue() {
    this.addNewValue();
    this.buildRows();
	  this.checkConditions(this.root ? this.root.data : this.data);
    this.restoreValue();
  }

  /**
   * Removes a value out of the data array and rebuild the rows.
   * @param {number} index - The index of the data element to remove.
   */
  removeValue(index) {
    if (this.data.hasOwnProperty(this.component.key)) {
      this.data[this.component.key].splice(index, 1);
      this.triggerChange();
    }
    this.buildRows();
  }

  /**
   * Rebuild the rows to contain the values of this component.
   */
  buildRows() {
    if (!this.tbody) {
      return;
    }
    this.inputs = [];
    this.tbody.innerHTML = '';
    _each(this.data[this.component.key], (value, index) => {
      let tr = this.ce('tr');
      let td = this.ce('td');
      const input = this.createInput(td);
      input.value = value;
      tr.appendChild(td);

      if (!this.shouldDisable) {
        let tdAdd = this.ce('td');
        tdAdd.appendChild(this.removeButton(index));
        tr.appendChild(tdAdd);
      }

      this.tbody.appendChild(tr);
    });

    if (!this.shouldDisable) {
      let tr = this.ce('tr');
      let td = this.ce('td', {
        colspan: '2'
      });
      td.appendChild(this.addButton());
      tr.appendChild(td);
      this.tbody.appendChild(tr);
    }

    if (this.shouldDisable) {
      this.disabled = true;
    }
  }

  bootstrap4Theme(name) {
    return (name === 'default') ? 'secondary' : name;
  }

  iconClass(name, spinning) {
    if (!this.options.icons || this.options.icons === 'glyphicon') {
      return spinning ? `glyphicon glyphicon-${name} glyphicon-spin` : `glyphicon glyphicon-${name}`;
    }
    switch (name) {
      case 'zoom-in':
        return 'fa fa-search-plus';
      case 'zoom-out':
        return 'fa fa-search-minus';
      case 'question-sign':
        return `fa fa-question-circle`;
      case 'remove-circle':
        return `fa fa-times-circle-o`;
      default:
        return spinning ? `fa fa-${name} fa-spin` : `fa fa-${name}`;
    }
  }

  /**
   * Adds a new button to add new rows to the multiple input elements.
   * @returns {HTMLElement} - The "Add New" button html element.
   */
  addButton(justIcon) {
    let addButton = this.ce('a', {
      class: 'btn btn-primary'
    });
    this.addEventListener(addButton, 'click', (event) => {
      event.preventDefault();
      this.addValue();
    });

    let addIcon = this.ce('i', {
      class: this.iconClass('plus')
    });

    if (justIcon) {
      addButton.appendChild(addIcon);
      return addButton;
    }
    else {
      addButton.appendChild(addIcon);
      addButton.appendChild(this.text(this.component.addAnother || ' Add Another'));
      return addButton;
    }
  }

  /**
   * The readible name for this component.
   * @returns {string} - The name of the component.
   */
  get name() {
    return this.t(this.component.label || this.component.placeholder || this.component.key);
  }

  /**
   * Returns the error label for this component.
   * @return {*}
   */
  get errorLabel() {
    return this.t(this.component.errorLabel || this.component.label || this.component.placeholder || this.component.key);
  }

  /**
   * Get the error message provided a certain type of error.
   * @param type
   * @return {*}
   */
  errorMessage(type) {
    return (this.component.errors && this.component.errors[type]) ? this.component.errors[type] :  type;
  }

  /**
   * Creates a new "remove" row button and returns the html element of that button.
   * @param {number} index - The index of the row that should be removed.
   * @returns {HTMLElement} - The html element of the remove button.
   */
  removeButton(index) {
    let removeButton = this.ce('button', {
      type: 'button',
      class: 'btn btn-default btn-secondary',
      tabindex: '-1'
    });

    this.addEventListener(removeButton, 'click', (event) => {
      event.preventDefault();
      this.removeValue(index);
    });

    let removeIcon = this.ce('i', {
      class: this.iconClass('remove-circle')
    });
    removeButton.appendChild(removeIcon);
    return removeButton;
  }

  labelOnTheLeft(position) {
    return [
      'left-left',
      'left-right'
    ].includes(position);
  }

  labelOnTheRight(position) {
    return [
      'right-left',
      'right-right'
    ].includes(position);
  }

  rightAlignedLabel(position) {
    return [
      'left-right',
      'right-right'
    ].includes(position);
  }

  labelOnTheLeftOrRight(position) {
    return this.labelOnTheLeft(position) || this.labelOnTheRight(position);
  }

  getLabelWidth() {
    if (_isUndefined(this.component.labelWidth)) {
      this.component.labelWidth = 30;
    }

    return this.component.labelWidth;
  }

  getLabelMargin() {
    if (_isUndefined(this.component.labelMargin)) {
      this.component.labelMargin = 3;
    }

    return this.component.labelMargin;
  }

  setInputStyles(input) {
    if (this.labelIsHidden()) {
      return;
    }

    if (this.labelOnTheLeftOrRight(this.component.labelPosition)) {
      const totalLabelWidth = this.getLabelWidth() + this.getLabelMargin();
      input.style.width = `${100 - totalLabelWidth}%`;

      if (this.labelOnTheLeft(this.component.labelPosition)) {
        input.style.marginLeft = `${totalLabelWidth}%`
      }
      else {
        input.style.marginRight = `${totalLabelWidth}%`
      }
    }
  }

  labelIsHidden() {
    return !this.component.label || this.component.hideLabel || this.options.inputsOnly;
  }

  /**
   * Create the HTML element for the label of this component.
   * @param {HTMLElement} container - The containing element that will contain this label.
   */
  createLabel(container) {
    if (this.labelIsHidden()) {
      return;
    }
    let className = 'control-label';
    let style = '';

    const {
      labelPosition
    } = this.component;

    // Determine label styles/classes depending on position.
    if (labelPosition === 'bottom') {
      className += ' control-label--bottom';
    }
    else if (labelPosition && labelPosition !== 'top') {
      const labelWidth = this.getLabelWidth();
      const labelMargin = this.getLabelMargin();

      // Label is on the left or right.
      if (this.labelOnTheLeft(labelPosition)) {
        style += `float: left; width: ${labelWidth}%; margin-right: ${labelMargin}%; `;
      }
      else if (this.labelOnTheRight(labelPosition)) {
        style += `float: right; width: ${labelWidth}%; margin-left: ${labelMargin}%; `;
      }
      if (this.rightAlignedLabel(labelPosition)) {
        style += 'text-align: right; ';
      }
    }

    if (this.hasInput && this.component.validate && this.component.validate.required) {
      className += ' field-required';
    }
    this.labelElement = this.ce('label', {
      class: className,
      style
    });
    if (this.info.attr.id) {
      this.labelElement.setAttribute('for', this.info.attr.id);
    }
    this.labelElement.appendChild(this.text(this.component.label));
    this.createTooltip(this.labelElement);
    container.appendChild(this.labelElement);
  }

  addShortcutToLabel(label, shortcut) {
    if (!label) {
      label = this.component.label;
    }

    if (!shortcut) {
      shortcut = this.component.shortcut;
    }

    if (!shortcut || !/^[A-Za-z]$/.test(shortcut)) {
      return label;
    }

    const match = label.match(new RegExp(shortcut, 'i'));

    if (!match) {
      return label;
    }

    const char = match[0];
    const index = match.index + 1;
    const lowLineCombinator = '\u0332';

    return label.substring(0, index) + lowLineCombinator + label.substring(index);
  }

  addShortcut(element, shortcut) {
    // Avoid infinite recursion.
    if (this.root === this) {
      return;
    }

    if (!element) {
      element = this.labelElement;
    }

    if (!shortcut) {
      shortcut = this.component.shortcut;
    }

    this.root.addShortcut(element, shortcut);
  }

  removeShortcut(element, shortcut) {
    // Avoid infinite recursion.
    if (this.root === this) {
      return;
    }

    if (!element) {
      element = this.labelElement;
    }

    if (!shortcut) {
      shortcut = this.component.shortcut;
    }

    this.root.removeShortcut(element, shortcut);
  }

  /**
   * Create the HTML element for the tooltip of this component.
   * @param {HTMLElement} container - The containing element that will contain this tooltip.
   */
  createTooltip(container, component, classes) {
    component = component || this.component;
    classes = classes || `${this.iconClass('question-sign')} text-muted`;
    if (!component.tooltip) {
      return;
    }
    this.tooltip = this.ce('i', {
      class: classes
    });
    container.appendChild(this.text(' '));
    container.appendChild(this.tooltip);
    new Tooltip(this.tooltip, {
      delay: {
        hide: 100
      },
      placement: 'right',
      html: true,
      title: component.tooltip.replace(/(?:\r\n|\r|\n)/g, '<br />')
    });
  }

  /**
   * Creates the description block for this input field.
   * @param container
   */
  createDescription(container) {
    if (!this.component.description) {
      return;
    }
    this.description = this.ce('div', {
      class: 'help-block'
    });
    this.description.innerHTML = this.t(this.component.description);
    container.appendChild(this.description);
  }

  /**
   * Creates a new error element to hold the errors of this element.
   */
  createErrorElement() {
    if (!this.errorContainer) {
      return;
    }
    this.errorElement = this.ce('div', {
      class: 'formio-errors invalid-feedback'
    });
    this.errorContainer.appendChild(this.errorElement);
  }

  /**
   * Adds a prefix html element.
   *
   * @param {HTMLElement} input - The input element.
   * @param {HTMLElement} inputGroup - The group that will hold this prefix.
   * @returns {HTMLElement} - The html element for this prefix.
   */
  addPrefix(input, inputGroup) {
    let prefix = null;
    if (this.component.prefix) {
      prefix = this.ce('div', {
        class: 'input-group-addon'
      });
      prefix.appendChild(this.text(this.component.prefix));
      inputGroup.appendChild(prefix);
    }
    return prefix;
  }

  /**
   * Adds a suffix html element.
   *
   * @param {HTMLElement} input - The input element.
   * @param {HTMLElement} inputGroup - The group that will hold this suffix.
   * @returns {HTMLElement} - The html element for this suffix.
   */
  addSuffix(input, inputGroup) {
    let suffix = null;
    if (this.component.suffix) {
      suffix = this.ce('div', {
        class: 'input-group-addon'
      });
      suffix.appendChild(this.text(this.component.suffix));
      inputGroup.appendChild(suffix);
    }
    return suffix;
  }

  /**
   * Adds a new input group to hold the input html elements.
   *
   * @param {HTMLElement} input - The input html element.
   * @param {HTMLElement} container - The containing html element for this group.
   * @returns {HTMLElement} - The input group element.
   */
  addInputGroup(input, container) {
    let inputGroup = null;
    if (this.component.prefix || this.component.suffix) {
      inputGroup = this.ce('div', {
        class: 'input-group'
      });
      container.appendChild(inputGroup);
    }
    return inputGroup;
  }

  /**
   * Creates a new input mask placeholder.
   * @param {HTMLElement} mask - The input mask.
   * @returns {string} - The placeholder that will exist within the input as they type.
   */
  maskPlaceholder(mask) {
    return mask.map((char) => (char instanceof RegExp) ? '_' : char).join('');
  }

  /**
   * Sets the input mask for an input.
   * @param {HTMLElement} input - The html input to apply the mask to.
   */
  setInputMask(input) {
    if (input && this.component.inputMask) {
      const mask = FormioUtils.getInputMask(this.component.inputMask);
      this._inputMask = mask;
      this.inputMask = maskInput({
        inputElement: input,
        mask
      });
      if (mask.numeric) {
        input.setAttribute('pattern', "\\d*");
      }
      if (!this.component.placeholder) {
        input.setAttribute('placeholder', this.maskPlaceholder(mask));
      }
    }
  }

  /**
   * Creates a new input element.
   * @param {HTMLElement} container - The container which should hold this new input element.
   * @returns {HTMLElement} - Either the input or the group that contains the input.
   */
  createInput(container) {
    let input = this.ce(this.info.type, this.info.attr);
    this.setInputMask(input);
    let inputGroup = this.addInputGroup(input, container);
    this.addPrefix(input, inputGroup);
    this.addInput(input, inputGroup || container);
    this.addSuffix(input, inputGroup);
    this.errorContainer = container;
    this.setInputStyles(inputGroup || input);
    return inputGroup || input;
  }

  /**
   * Wrapper method to add an event listener to an HTML element.
   *
   * @param obj
   *   The DOM element to add the event to.
   * @param evt
   *   The event name to add.
   * @param func
   *   The callback function to be executed when the listener is triggered.
   */
  addEventListener(obj, evt, func) {
    this.eventHandlers.push({type: evt, func: func});
    if ('addEventListener' in obj){
      obj.addEventListener(evt, func, false);
    }
    else if ('attachEvent' in obj) {
      obj.attachEvent(`on${evt}`, func);
    }
  }

  redraw() {
    // Don't bother if we have not built yet.
    if (!this.isBuilt) {
      return;
    }
    this.clear();
    this.build();
  }

  /**
   * Remove all event handlers.
   */
  destroy(all) {
    if (this.inputMask) {
      this.inputMask.destroy();
    }
    _each(this.eventListeners, (listener) => {
      if (all || listener.internal) {
        this.events.off(listener.type, listener.listener);
      }
    });
    _each(this.eventHandlers, (handler) => {
      if (handler.event) {
        window.removeEventListener(handler.event, handler.func);
      }
    });
    this.inputs = [];
  }

  /**
   * Render a template string into html.
   *
   * @param template
   * @param data
   * @param actions
   *
   * @return {HTMLElement} - The created element.
   */
  renderTemplate(template, data, actions = []) {
    // Create a container div.
    const div = this.ce('div');

    // Interpolate the template and populate
    div.innerHTML = FormioUtils.interpolate(template, data);

    // Add actions to matching elements.
    actions.forEach(action => {
      const elements = div.getElementsByClassName(action.class);
      Array.prototype.forEach.call(elements, element => {
        element.addEventListener(action.event, action.action);
      });
    });

    return div;
  }

  /**
   * Append different types of children.
   *
   * @param child
   */
  appendChild(element, child) {
    if (Array.isArray(child)) {
      child.forEach(oneChild => {
        this.appendChild(element, oneChild);
      });
    }
    else if (child instanceof HTMLElement || child instanceof Text) {
      element.appendChild(child);
    }
    else if (child) {
      element.appendChild(this.text(child.toString()));
    }
  }

  /**
   * Alias for document.createElement.
   *
   * @param {string} type - The type of element to create
   * @param {Object} attr - The element attributes to add to the created element.
   * @param {Various} children - Child elements. Can be a DOM Element, string or array of both.
   * @param {Object} events
   *
   * @return {HTMLElement} - The created element.
   */
  ce(type, attr, children = null, events = {}) {
    // Create the element.
    let element = document.createElement(type);

    // Add attributes.
    if (attr) {
      this.attr(element, attr);
    }

    // Append the children.
    this.appendChild(element, children);
    return element;
  }

  /**
   * Alias to create a text node.
   * @param text
   * @returns {Text}
   */
  text(text) {
    return document.createTextNode(this.t(text));
  }

  /**
   * Adds an object of attributes onto an element.
   * @param {HtmlElement} element - The element to add the attributes to.
   * @param {Object} attr - The attributes to add to the input element.
   */
  attr(element, attr) {
    _each(attr, (value, key) => {
      if (typeof value !== 'undefined') {
        if (key.indexOf('on') === 0) {
          // If this is an event, add a listener.
          this.addEventListener(element, key.substr(2).toLowerCase(), value);
        }
        else {
          // Otherwise it is just an attribute.
          element.setAttribute(key, value);
        }
      }
    });
  }

  /**
   * Determines if an element has a class.
   *
   * Taken from jQuery https://j11y.io/jquery/#v=1.5.0&fn=jQuery.fn.hasClass
   */
  hasClass(element, className) {
    className = " " + className + " ";
    return ((" " + element.className + " ").replace(/[\n\t\r]/g, " ").indexOf(className) > -1);
  }

  /**
   * Adds a class to a DOM element.
   *
   * @param element
   *   The element to add a class to.
   * @param className
   *   The name of the class to add.
   */
  addClass(element, className) {
    const classes = element.getAttribute('class');
    if (!classes || classes.indexOf(className) === -1) {
      element.setAttribute('class', `${classes} ${className}`);
    }
  }

  /**
   * Remove a class from a DOM element.
   *
   * @param element
   *   The DOM element to remove the class from.
   * @param className
   *   The name of the class that is to be removed.
   */
  removeClass(element, className) {
    let cls = element.getAttribute('class');
    if (cls) {
      cls = cls.replace(new RegExp(className, 'g'), '');
      element.setAttribute('class', cls);
    }
  }

  /**
   * Determines if this component has a condition defined.
   *
   * @return {null}
   */
  hasCondition() {
    if (this._hasCondition !== null) {
      return this._hasCondition;
    }

    this._hasCondition = FormioUtils.hasCondition(this.component);
    return this._hasCondition;
  }

  /**
   * Check for conditionals and hide/show the element based on those conditions.
   */
  checkConditions(data) {
    // Check advanced conditions
    let result;

    if (!this.hasCondition()) {
      result = this.show(true);
    }
    else {
      result = this.show(FormioUtils.checkCondition(this.component, this.data, data));
    }

    if (this.fieldLogic(data)) {
      this.redraw();
    }

    return result;
  }

  /**
   * Check all triggers and apply necessary actions.
   *
   * @param data
   */
  fieldLogic(data) {
    const logics = this.component.logic || [];

    // If there aren't logic, don't go further.
    if (logics.length === 0) {
      return;
    }

    const newComponent = _cloneDeep(this.originalComponent);

    let changed = logics.reduce((changed, logic) => {
      const result = FormioUtils.checkTrigger(newComponent, logic.trigger, this.data, data);

      if (result) {
        changed |= logic.actions.reduce((changed, action) => {
          switch(action.type) {
            case 'property':
              FormioUtils.setActionProperty(newComponent, action, this.data, data, newComponent, result);
              break;
            case 'value':
              const newValue = (new Function('row', 'data', 'component', 'result', action.value))(this.data, data, newComponent, result);
              if (!_isEqual(this.getValue(), newValue)) {
                this.setValue(newValue);
                changed = true;
              }
              break;
            case 'validation':
              // TODO
              break;
          }
          return changed;
        }, false);
      }
      return changed;
    }, false);

    // If component definition changed, replace and mark as changed.
    if (!_isEqual(this.component, newComponent)) {
      this.component = newComponent;
      changed = true;
    }

    return changed;
  }

  /**
   * Add a new input error to this element.
   *
   * @param message
   * @param dirty
   */
  addInputError(message, dirty) {
    if (!message) {
      return;
    }

    if (this.errorElement) {
      let errorMessage = this.ce('p', {
        class: 'help-block'
      });
      errorMessage.appendChild(this.text(message));
      this.errorElement.appendChild(errorMessage);
    }

    // Add error classes
    this.addClass(this.element, 'has-error');
    this.inputs.forEach((input) => this.addClass(input, 'is-invalid'));
    if (dirty && this.options.highlightErrors) {
      this.addClass(this.element, 'alert alert-danger');
    }
  }

  /**
   * Hide or Show an element.
   *
   * @param show
   */
  show(show) {
    // Ensure we stop any pending data clears.
    if (this.clearPending) {
      clearTimeout(this.clearPending);
      this.clearPending = null;
    }

    // Execute only if visibility changes.
    if (!show === !this._visible) {
      return show;
    }

    this._visible = show;
    let element = this.getElement();
    if (element) {
      if (show && !this.component.hidden) {
        element.removeAttribute('hidden');
        element.style.visibility = 'visible';
        element.style.position = 'relative';
      }
      else if (!show || this.component.hidden) {
        element.setAttribute('hidden', true);
        element.style.visibility = 'hidden';
        element.style.position = 'absolute';
      }
    }

    if (!show && this.component.clearOnHide) {
      this.clearPending = setTimeout(() => this.setValue(null, {
        noValidate: true
      }), 200);
    }

    return show;
  }

  onResize() {}

  /**
   * Allow for options to hook into the functionality of this renderer.
   * @return {*}
   */
  hook() {
    const name = arguments[0];
    const fn = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : null;
    if (
      this.options &&
      this.options.hooks &&
      this.options.hooks[name]
    ) {
      return this.options.hooks[name].apply(this, Array.prototype.slice.call(arguments, 1));
    }
    else {
      // If this is an async hook instead of a sync.
      if (fn) {
        return fn(null, arguments[1]);
      }
      else {
        return arguments[1];
      }
    }
  }

  set visible(visible) {
    this.show(visible);
  }

  get visible() {
    return this._visible;
  }

  onChange(flags, fromRoot) {
    flags = flags || {};
    if (!flags.noValidate) {
      this.pristine = false;
    }

    // Set the changed variable.
    let changed = {
      component: this.component,
      value: this.value,
      flags: flags
    };

    // Emit the change.
    this.emit('componentChange', changed);

    // Bubble this change up to the top.
    if (this.root && !fromRoot) {
      this.root.triggerChange(flags, changed);
    }
  }

  addInputSubmitListener(input) {
    if (!this.options.submitOnEnter) {
      return;
    }
    this.addEventListener(input, 'keypress', (event) => {
      let key = event.keyCode || event.which;
      if (key == 13) {
        event.preventDefault();
        event.stopPropagation();
        this.emit('submitButton');
      }
    });
  }

  /**
   * Add new input element listeners.
   *
   * @param input
   */
  addInputEventListener(input) {
    this.addEventListener(input, this.info.changeEvent, () => this.updateValue({changed: true}));
  }

  /**
   * Add a new input to this comonent.
   *
   * @param input
   * @param container
   * @param noSet
   */
  addInput(input, container) {
    if (!input) {
      return;
    }
    if (input && container) {
      input = container.appendChild(input);
    }
    this.inputs.push(input);
    this.hook('input', input, container);
    this.addInputEventListener(input);
    this.addInputSubmitListener(input);
    return input;
  }

  /**
   * Get the static value of this component.
   * @return {*}
   */
  get value() {
    if (!this.data) {
      return null;
    }
    return this.data[this.component.key];
  }

  /**
   * Get the value at a specific index.
   *
   * @param index
   * @returns {*}
   */
  getValueAt(index) {
    return this.inputs[index].value;
  }

  /**
   * Get the input value of this component.
   *
   * @return {*}
   */
  getValue() {
    if (!this.hasInput) {
      return;
    }
    if (this.viewOnly) {
      return this.value;
    }
    const values = [];
    for (let i in this.inputs) {
      if (this.inputs.hasOwnProperty(i)) {
        if (!this.component.multiple) {
          return this.getValueAt(i);
        }
        values.push(this.getValueAt(i));
      }
    }
    return values;
  }

  /**
   * Determine if the value of this component has changed.
   *
   * @param before
   * @param after
   * @return {boolean}
   */
  hasChanged(before, after) {
    return !_isEqual(before, after);
  }

  /**
   * Update a value of this component.
   *
   * @param flags
   */
  updateValue(flags) {
    if (!this.hasInput) {
      return false;
    }

    flags = flags || {};
    const value = this.data[this.component.key];
    this.data[this.component.key] = this.getValue(flags);
    if (this.viewOnly) {
      this.updateViewOnlyValue(this.value);
    }

    const changed = flags.changed || this.hasChanged(value, this.data[this.component.key]);
    delete flags.changed;
    if (!flags.noUpdateEvent && changed) {
      this.triggerChange(flags);
    }
    return changed;
  }

  /**
   * Restore the value of a control.
   */
  restoreValue() {
    if (this.data && this.data.hasOwnProperty(this.component.key)) {
      this.setValue(this.data[this.component.key], {
        noUpdateEvent: true
      });
    }
    else {
      let defaultValue = this.defaultValue;
      if (!this.data.hasOwnProperty(this.component.key) && defaultValue) {
        this.setValue(defaultValue, {
          noUpdateEvent: true
        });
      }
    }
  }

  /**
   * Perform a calculated value operation.
   *
   * @param data - The global data object.
   *
   * @return {boolean} - If the value changed during calculation.
   */
  calculateValue(data, flags) {
    if (!this.component.calculateValue) {
      return false;
    }

    flags = flags || {};
    flags.noCheck = true;
    let changed = false;

    // If this is a string, then use eval to evalulate it.
    if (typeof this.component.calculateValue === 'string') {
      try {
        let value = (new Function('component', 'row', 'data', `value = []; ${this.component.calculateValue.toString()}; return value;`))(this, this.data, data);
        changed = this.setValue(value, flags);
      }
      catch (err) {
        /* eslint-disable no-console */
        console.warn(`An error occurred calculating a value for ${this.component.key}`, err);
        changed = false;
        /* eslint-enable no-console */
      }
    }
    else {
      try {
        let val = FormioUtils.jsonLogic.apply(this.component.calculateValue, {
          data,
          row: this.data
        });
        changed = this.setValue(val, flags);
      }
      catch (err) {
        /* eslint-disable no-console */
        console.warn(`An error occurred calculating a value for ${this.component.key}`, err);
        changed = false;
        /* eslint-enable no-console */
      }
    }

    return changed;
  }

  /**
   * Get this component's label text.
   *
   */
  get label() {
    return this.component.label;
  }

  /**
   * Set this component's label text and render it.
   *
   * @param value - The new label text.
   */
  set label(value) {
    this.component.label = value;
    if (this.labelElement) {
      this.labelElement.innerText = value;
    }
  }

  /**
   * Get FormioForm element at the root of this component tree.
   *
   */
  getRoot() {
    return this.root;
  }

  /**
   * Returns the invalid message, or empty string if the component is valid.
   *
   * @param data
   * @param dirty
   * @return {*}
   */
  invalidMessage(data, dirty) {
    // No need to check for errors if there is no input or if it is pristine.
    if (!this.hasInput || (!dirty && this.pristine)) {
      return '';
    }

    return Validator.check(this, data);
  }

  /**
   * Returns if the component is valid or not.
   *
   * @param data
   * @param dirty
   * @return {boolean}
   */
  isValid(data, dirty) {
    return !this.invalidMessage(data, dirty);
  }

  checkValidity(data, dirty) {
    // Force valid if component is conditionally hidden.
    if (!FormioUtils.checkCondition(this.component, data, this.data)) {
      return true;
    }

    let message = this.invalid || this.invalidMessage(data, dirty);
    this.setCustomValidity(message, dirty);
    return message ? false : true;
  }

  getRawValue() {
    return this.data[this.component.key];
  }

  isEmpty(value) {
    return value == null || value.length === 0;
  }

  /**
   * Check if a component is eligible for multiple validation
   *
   * @return {boolean}
   */
  validateMultiple(value) {
    return this.component.multiple && _isArray(value);
  }

  get errors() {
    return this.error ? [this.error] : [];
  }

  interpolate(string, data) {
    return FormioUtils.interpolate(string, data);
  }

  setCustomValidity(message, dirty) {
    if (this.errorElement && this.errorContainer) {
      this.errorElement.innerHTML = '';
      try {
        this.errorContainer.removeChild(this.errorElement);
      }
      catch (err) {}
    }
    this.removeClass(this.element, 'has-error');
    this.inputs.forEach((input) => this.removeClass(input, 'is-invalid'));
    if (this.options.highlightErrors) {
      this.removeClass(this.element, 'alert alert-danger');
    }
    if (message) {
      this.error = {
        component: this.component,
        message: message
      };
      this.emit('componentError', this.error);
      this.createErrorElement();
      this.addInputError(message, dirty);
    }
    else {
      this.error = null;
    }
    _each(this.inputs, (input) => {
      if (typeof input.setCustomValidity === 'function') {
        input.setCustomValidity(message, dirty);
      }
    });
  }

  /**
   * Set the value at a specific index.
   *
   * @param index
   * @param value
   */
  setValueAt(index, value) {
    if (value === null || value === undefined) {
      value = this.defaultValue;
    }
    this.inputs[index].value = value;
  }

  getFlags() {
    return (typeof arguments[1] === 'boolean') ? {
      noUpdateEvent: arguments[1],
      noValidate: arguments[2]
    } : (arguments[1] || {});
  }

  whenReady() {
    return Promise.resolve();
  }

  /**
   * Set the value of this component.
   *
   * @param value
   * @param flags
   *
   * @return {boolean} - If the value changed.
   */
  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    if (!this.hasInput) {
      return false;
    }
    if (this.component.multiple && !_isArray(value)) {
      value = [value];
    }
    this.buildRows();
    const isArray = _isArray(value);
    for (let i in this.inputs) {
      if (this.inputs.hasOwnProperty(i)) {
        this.setValueAt(i, isArray ? value[i] : value);
      }
    }
    return this.updateValue(flags);
  }

  /**
   * Prints out the value of this component as a string value.
   */
  asString(value) {
    value = value || this.getValue();
    return _isArray(value) ? value.join(', ') : value.toString();
  }

  /**
   * Return if the component is disabled.
   * @return {boolean}
   */
  get disabled() {
    return this._disabled;
  }

  /**
   * Disable this component.
   *
   * @param {boolean} disabled
   */
  set disabled(disabled) {
    // Do not allow a component to be disabled if it should be always...
    if (!disabled && this.shouldDisable) {
      return;
    }

    this._disabled = disabled;

    // Disable all inputs.
    _each(this.inputs, (input) => this.setDisabled(input, disabled));
  }

  setDisabled(element, disabled) {
    element.disabled = disabled;
    if (disabled) {
      element.setAttribute('disabled', 'disabled');
    }
    else {
      element.removeAttribute('disabled');
    }
  }

  setLoading(element, loading) {
    if (element.loading === loading) {
      return;
    }

    element.loading = loading;
    if (!element.loader && loading) {
      element.loader = this.ce('i', {
        class: this.iconClass('refresh', true) + ' button-icon-right'
      });
    }
    if (element.loader) {
      if (loading) {
        element.appendChild(element.loader);
      }
      else if (element.contains(element.loader)) {
        element.removeChild(element.loader);
      }
    }
  }

  selectOptions(select, tag, options, defaultValue) {
    _each(options, (option) => {
      let attrs = {
        value: option.value
      };
      if (defaultValue !== undefined && (option.value === defaultValue)) {
        attrs.selected = 'selected';
      }
      let optionElement = this.ce('option', attrs);
      optionElement.appendChild(this.text(option.label));
      select.appendChild(optionElement);
    });
  }

  setSelectValue(select, value) {
    let options = select.querySelectorAll('option');
    _each(options, (option) => {
      if (option.value === value) {
        option.setAttribute('selected', 'selected');
      }
      else {
        option.removeAttribute('selected');
      }
    });
    if (select.onchange) {
      select.onchange();
    }
    if (select.onselect) {
      select.onchange();
    }
  }

  clear() {
    this.destroy();
    const element = this.getElement();
    if (element) {
      while (element.lastChild) {
        element.removeChild(element.lastChild);
      }
    }
  }

  append(element) {
    if (this.element) {
      this.element.appendChild(element);
    }
  }

  prepend(element) {
    if (this.element) {
      if (this.element.firstChild) {
        this.element.insertBefore(element, this.element.firstChild);
      }
      else {
        this.element.appendChild(element);
      }
    }
  }

  removeChild(element) {
    if (this.element) {
      this.element.removeChild(element);
    }
  }

  /**
   * Get the element information.
   */
  elementInfo() {
    let attributes = {
      name: this.options.name,
      type: this.component.inputType || 'text',
      class: 'form-control',
      lang: this.options.language
    };

    if (this.component.placeholder) {
      attributes.placeholder = this.t(this.component.placeholder);
    }

    if (this.component.tabindex) {
      attributes.tabindex = this.component.tabindex;
    }

    if (this.component.autofocus) {
      attributes.autofocus = this.component.autofocus;
    }

    return {
      type: 'input',
      component: this.component,
      changeEvent: 'change',
      attr: attributes
    };
  }
}

BaseComponent.externalLibraries = {};
BaseComponent.requireLibrary = function(name, property, src, polling) {
  if (!BaseComponent.externalLibraries.hasOwnProperty(name)) {
    BaseComponent.externalLibraries[name] = {};
    BaseComponent.externalLibraries[name].ready = new Promise((resolve, reject) => {
      BaseComponent.externalLibraries[name].resolve = resolve;
      BaseComponent.externalLibraries[name].reject = reject;
    });

    const callbackName = `${name}Callback`;

    if (!polling && !window[callbackName]) {
      window[callbackName] = function() {
        this.resolve();
      }.bind(BaseComponent.externalLibraries[name]);
    }

    // See if the plugin already exists.
    let plugin = _get(window, property);
    if (plugin) {
      BaseComponent.externalLibraries[name].resolve(plugin);
    }
    else {
      src = _isArray(src) ? src : [src];
      src.forEach((lib) => {
        let attrs = {};
        let elementType = '';
        if (typeof lib === 'string') {
          lib = {
            type: 'script',
            src: lib
          };
        }
        switch (lib.type) {
          case 'script':
            elementType = 'script';
            attrs = {
              src: lib.src,
              type: 'text/javascript',
              defer: true,
              async: true
            };
            break;
          case 'styles':
            elementType = 'link';
            attrs = {
              href: lib.src,
              rel: 'stylesheet'
            };
            break;
        }

        // Add the script to the top page.
        let script = document.createElement(elementType);
        for (let attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
        document.getElementsByTagName('head')[0].appendChild(script);
      });

      // if no callback is provided, then check periodically for the script.
      if (polling) {
        setTimeout(function checkLibrary() {
          let plugin = _get(window, property);
          if (plugin) {
            BaseComponent.externalLibraries[name].resolve(plugin);
          }
          else {
            // check again after 200 ms.
            setTimeout(checkLibrary, 200);
          }
        }, 200)
      }
    }
  }
  return BaseComponent.externalLibraries[name].ready;
};

BaseComponent.libraryReady = function(name) {
  if (
    BaseComponent.externalLibraries.hasOwnProperty(name) &&
    BaseComponent.externalLibraries[name].ready
  ) {
    return BaseComponent.externalLibraries[name].ready;
  }

  return Promise.reject(`${name} library was not required.`);
};
