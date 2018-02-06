'use strict';
import _ from 'lodash';
import _clone from 'lodash/clone';
import _get from 'lodash/get';
import _set from 'lodash/set';
import _round from 'lodash/round';
import _pad from 'lodash/pad';
import _chunk from 'lodash/chunk';
import _isNaN from 'lodash/isNaN';
import _has from 'lodash/has';
import _last from 'lodash/last';
import _isBoolean from 'lodash/isBoolean';
import _isString from 'lodash/isString';
import _isDate from 'lodash/isDate';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _isArray from 'lodash/isArray';
import _isPlainObject from 'lodash/isPlainObject';
import _isRegExp from 'lodash/isRegExp';
import _forOwn from 'lodash/forOwn';
import compile from 'lodash/template';
import jsonLogic from 'json-logic-js';
import { lodashOperators } from './jsonlogic/operators';
import momentModule from 'moment';

// Configure JsonLogic
lodashOperators.forEach((name) => jsonLogic.add_operation(`_${name}`, _[name]));

// Retrieve Any Date
jsonLogic.add_operation("getDate", function(date){
  return momentModule(date).toISOString()
});

// Set Relative Minimum Date
jsonLogic.add_operation("relativeMinDate", function(relativeMinDate){
  return momentModule().subtract(relativeMinDate, "days").toISOString()
});

// Set Relative Maximum Date
jsonLogic.add_operation("relativeMaxDate", function(relativeMaxDate){
  return momentModule().add(relativeMaxDate, "days").toISOString();
});


const FormioUtils = {
  jsonLogic, // Share

  /**
   * Determines the boolean value of a setting.
   *
   * @param value
   * @return {boolean}
   */
  boolValue(value) {
    if (_isBoolean(value)) {
      return value;
    }
    else if (_isString(value)) {
      return (value.toLowerCase() === 'true');
    }
    else {
      return !!value;
    }
  },

  /**
   * Check to see if an ID is a mongoID.
   * @param text
   * @return {Array|{index: number, input: string}|Boolean|*}
   */
  isMongoId(text) {
    return text.toString().match(/^[0-9a-fA-F]{24}$/);
  },

  /**
   * Determine if a component is a layout component or not.
   *
   * @param {Object} component
   *   The component to check.
   *
   * @returns {Boolean}
   *   Whether or not the component is a layout component.
   */
  isLayoutComponent(component) {
    return Boolean(
      (component.columns && Array.isArray(component.columns)) ||
      (component.rows && Array.isArray(component.rows)) ||
      (component.components && Array.isArray(component.components))
    );
  },

  /**
   * Iterate through each component within a form.
   *
   * @param {Object} components
   *   The components to iterate.
   * @param {Function} fn
   *   The iteration function to invoke for each component.
   * @param {Boolean} includeAll
   *   Whether or not to include layout components.
   * @param {String} path
   *   The current data path of the element. Example: data.user.firstName
   * @param {Object} parent
   *   The parent object.
   */
  eachComponent(components, fn, includeAll, path, parent) {
    if (!components) return;
    path = path || '';
    components.forEach((component) => {
      const hasColumns = component.columns && Array.isArray(component.columns);
      const hasRows = component.rows && Array.isArray(component.rows);
      const hasComps = component.components && Array.isArray(component.components);
      let noRecurse = false;
      const newPath = component.key ? (path ? (`${path}.${component.key}`) : component.key) : '';

      // Keep track of parent references.
      if (parent) {
        // Ensure we don't create infinite JSON structures.
        component.parent = _clone(parent);
        delete component.parent.components;
        delete component.parent.componentMap;
        delete component.parent.columns;
        delete component.parent.rows;
      }

      if (includeAll || component.tree || (!hasColumns && !hasRows && !hasComps)) {
        noRecurse = fn(component, newPath);
      }

      const subPath = () => {
        if (
          component.key &&
          (
            [ 'datagrid', 'container', 'editgrid' ].includes(component.type) ||
            component.tree
          )
        ) {
          return newPath;
        }
        else if (
          component.key &&
          component.type === 'form'
        ) {
          return `${newPath}.data`
        }
        return path;
      };

      if (!noRecurse) {
        if (hasColumns) {
          component.columns.forEach((column) =>
            FormioUtils.eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null));
        }

        else if (hasRows) {
          component.rows.forEach((row) => row.forEach((column) =>
            FormioUtils.eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null)));
        }

        else if (hasComps) {
          FormioUtils.eachComponent(component.components, fn, includeAll, subPath(), parent ? component : null);
        }
      }
    });
  },

  /**
   * Matches if a component matches the query.
   *
   * @param component
   * @param query
   * @return {boolean}
   */
  matchComponent(component, query) {
    if (_isString(query)) {
      return component.key === query;
    }
    else {
      let matches = false;
      _forOwn(query, (value, key) => {
        matches = (_get(component, key) === value);
        if (!matches) {
          return false;
        }
      });
      return matches;
    }
  },

  /**
   * Get a component by its key
   *
   * @param {Object} components
   *   The components to iterate.
   * @param {String|Object} key
   *   The key of the component to get, or a query of the component to search.
   *
   * @returns {Object}
   *   The component that matches the given key, or undefined if not found.
   */
  getComponent(components, key, includeAll) {
    let result;
    FormioUtils.eachComponent(components, (component, path) => {
      if (FormioUtils.matchComponent(component, key)) {
        component.path = path;
        result = component;
        return true;
      }
    }, includeAll);
    return result;
  },

  /**
   * Finds a component provided a query of properties of that component.
   *
   * @param components
   * @param query
   * @return {*}
   */
  findComponents(components, query) {
    let results = [];
    FormioUtils.eachComponent(components, (component, path) => {
      if (FormioUtils.matchComponent(component, query)) {
        component.path = path;
        results.push(component);
      }
    }, true);
    return results;
  },

  /**
   * Flatten the form components for data manipulation.
   *
   * @param {Object} components
   *   The components to iterate.
   * @param {Boolean} includeAll
   *   Whether or not to include layout components.
   *
   * @returns {Object}
   *   The flattened components map.
   */
  flattenComponents(components, includeAll) {
    let flattened = {};
    FormioUtils.eachComponent(components, (component, path) => {
      flattened[path] = component;
    }, includeAll);
    return flattened;
  },

  /**
   * Returns if this component has a conditional statement.
   *
   * @param component - The component JSON schema.
   *
   * @returns {boolean} - TRUE - This component has a conditional, FALSE - No conditional provided.
   */
  hasCondition(component) {
    return Boolean(
      (component.customConditional) ||
      (component.conditional && component.conditional.when) ||
      (component.conditional && component.conditional.json)
    );
  },

  /**
   * Extension of standard #parseFloat(value) function, that also clears input string.
   *
   * @param {any} value
   *   The value to parse.
   *
   * @returns {Number}
   *   Parsed value.
   */
  parseFloat(value) {
    return parseFloat(_isString(value)
      ? value.replace(/[^\de.+-]/gi, '')
      : value);
  },

  /**
   * Formats provided value in way how Currency component uses it.
   *
   * @param {any} value
   *   The value to format.
   *
   * @returns {String}
   *   Value formatted for Currency component.
   */
  formatAsCurrency(value) {
    const parsedValue = this.parseFloat(value);

    if (_isNaN(parsedValue)) {
      return '';
    }

    const parts = _round(parsedValue, 2)
      .toString()
      .split('.');
    parts[0] = _chunk(Array.from(parts[0]).reverse(), 3)
      .reverse()
      .map((part) => part
        .reverse()
        .join(''))
      .join(',');
    parts[1] = _pad(parts[1], 2, '0');
    return parts.join('.');
  },

  /**
   * Escapes RegEx characters in provided String value.
   *
   * @param {String} value
   *   String for escaping RegEx characters.
   * @returns {string}
   *   String with escaped RegEx characters.
   */
  escapeRegExCharacters(value) {
    return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },

  /**
   * Checks the calculated value for a provided component and data.
   *
   * @param {Object} component
   *   The component to check for the calculated value.
   * @param {Object} submission
   *   A submission object.
   * @param data
   *   The full submission data.
   */
  checkCalculated(component, submission, rowData) {
    // Process calculated value stuff if present.
    if (component.calculateValue) {
      let row = rowData;
      let data = submission ? submission.data : rowData;
      if (_isString(component.calculateValue)) {
        try {
          const util = this;
          rowData[component.key] = (new Function('data', 'row', 'util', `var value = [];${component.calculateValue.toString()}; return value;`))(data, row, util);
        }
        catch (e) {
          console.warn(`An error occurred calculating a value for ${component.key}`, e);
        }
      }
      else {
        try {
          rowData[component.key] = this.jsonLogic.apply(component.calculateValue, {data, row, _});
        }
        catch (e) {
          console.warn(`An error occurred calculating a value for ${component.key}`, e);
        }
      }
    }
  },

  /**
   * Check if a simple conditional evaluates to true.
   *
   * @param condition
   * @param condition
   * @param row
   * @param data
   * @returns {boolean}
   */
  checkSimpleConditional(component, condition, row, data) {
    let value = null;
    if (row) {
      value = this.getValue({data: row}, condition.when);
    }
    if (data && _isNil(value)) {
      value = this.getValue({data: data}, condition.when);
    }
    // FOR-400 - Fix issue where falsey values were being evaluated as show=true
    if (_isNil(value)) {
      value = '';
    }
    // Special check for selectboxes component.
    if (_isObject(value) && _has(value, condition.eq)) {
      return value[condition.eq].toString() === condition.show.toString();
    }
    // FOR-179 - Check for multiple values.
    if (_isArray(value) && value.includes(trigger.eq)) {
      return (condition.show.toString() === 'true');
    }

    return (value.toString() === condition.eq.toString()) === (condition.show.toString() === 'true');
  },

  /**
   * Check custom javascript conditional.
   *
   * @param component
   * @param custom
   * @param row
   * @param data
   * @returns {*}
   */
  checkCustomConditional(component, custom, row, data, variable, onError) {
    try {
      return (new Function('component', 'row', 'data', `var ${variable} = true; ${custom.toString()}; return ${variable};`))(component, row, data);
    }
    catch (e) {
      console.warn(`An error occurred in a condition statement for component ${component.key}`, e);
      return onError;
    }
  },

  checkJsonConditional(component, json, row, data, onError) {
    try {
      return jsonLogic.apply(json, {
        data,
        row,
        _
      });
    }
    catch (err) {
      console.warn(`An error occurred in jsonLogic advanced condition for ${component.key}`, err);
      return onError;
    }
  },

  /**
   * Checks the conditions for a provided component and data.
   *
   * @param component
   *   The component to check for the condition.
   * @param row
   *   The data within a row
   * @param data
   *   The full submission data.
   *
   * @returns {boolean}
   */
  checkCondition(component, row, data) {
    if (component.customConditional) {
      return this.checkCustomConditional(component, component.customConditional, row, data, 'show', true);
    }
    else if (component.conditional && component.conditional.when) {
      return this.checkSimpleConditional(component, component.conditional, row, data, true);
    }
    else if (component.conditional && component.conditional.json) {
      return this.checkJsonConditional(component, component.conditional.json, row, data);
    }

    // Default to show.
    return true;
  },

  /**
   * Test a trigger on a component.
   *
   * @param component
   * @param action
   * @param data
   * @param row
   * @returns {mixed}
   */
  checkTrigger(component, trigger, row, data) {
    switch(trigger.type) {
      case 'simple':
        return this.checkSimpleConditional(component, trigger.simple, row, data);
        break;
      case 'javascript':
        return this.checkCustomConditional(component, trigger.javascript, row, data, 'result', false);
        break;
      case 'json':
        return this.checkJsonConditional(component, trigger.json, row, data, false);
        break;
    }
    // If none of the types matched, don't fire the trigger.
    return false;
  },

  setActionProperty(component, action, row, data, result) {
    switch(action.property.type) {
      case 'boolean':
        if (_get(component, action.property.value, false).toString() !== action.state.toString()) {
          _set(component, action.property.value, action.state.toString() === 'true');
        }
        break;
      case 'string':
        const newValue = FormioUtils.interpolate(action.text, {
          data,
          row,
          component,
          result
        });
        if (newValue !== _get(component, action.property.value, '')) {
          _set(component, action.property.value, newValue);
        }
        break;
    }
    return component;
  },

  /**
   * Get the value for a component key, in the given submission.
   *
   * @param {Object} submission
   *   A submission object to search.
   * @param {String} key
   *   A for components API key to search for.
   */
  getValue(submission, key) {
    const search = (data) => {
      if (_isPlainObject(data)) {
        if (_has(data, key)) {
          return data[key];
        }

        let value = null;

        _forOwn(data, (prop) => {
          const result = search(prop);
          if (!_isNil(result)) {
            value = result;
            return false;
          }
        });

        return value;
      }
      else {
        return null
      }
    };

    return search(submission.data);
  },

  /**
   * Interpolate a string and add data replacements.
   *
   * @param string
   * @param data
   * @returns {XML|string|*|void}
   */
  interpolate(string, data) {
    const templateSettings = {
      evaluate: /\{\%(.+?)\%\}/g,
      interpolate: /\{\{(.+?)\}\}/g,
      escape: /\{\{\{(.+?)\}\}\}/g
    };
    try {
      return compile(string, templateSettings)(data);
    }
    catch (err) {
      console.warn('Error interpolating template', err, string, data);
    }
  },

  /**
   * Make a filename guaranteed to be unique.
   * @param name
   * @returns {string}
   */
  uniqueName(name) {
    const parts = name.toLowerCase().replace(/[^0-9a-z\.]/g, '').split('.');
    const fileName = parts[0];
    const ext = parts.length > 1
      ? `.${_last(parts)}`
      : '';
    return `${fileName.substr(0, 10)}-${this.guid()}${ext}`;
  },

  guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random()*16|0;
      const v = c === 'x'
        ? r
        : (r&0x3|0x8);
      return v.toString(16);
    });
  },

  /**
   * Return a translated date setting.
   *
   * @param date
   * @return {*}
   */
  getDateSetting(date) {
    if (_isNil(date) || _isNaN(date) || date === '') {
      return null;
    }

    let dateSetting = new Date(date);
    if (FormioUtils.isValidDate(dateSetting)) {
      return dateSetting;
    }

    try {
      // Moment constant might be used in eval.
      const moment = momentModule;
      dateSetting = new Date(eval(date));
    }
    catch (e) {
      return null;
    }

    // Ensure this is a date.
    if (!FormioUtils.isValidDate(dateSetting)) {
      dateSetting = null;
    }

    return dateSetting;
  },
  isValidDate(date) {
    return _isDate(date) && !_isNaN(date.getDate());
  },
  getLocaleDateFormatInfo(locale) {
    const formatInfo = {};

    const day = 21;
    const exampleDate = new Date(2017, 11, day);
    const localDateString = exampleDate.toLocaleDateString(locale);

    formatInfo.dayFirst = localDateString.slice(0, 2) === day.toString();

    return formatInfo;
  },
  /**
   * Convert the format from the angular-datepicker module to flatpickr format.
   * @param format
   * @return {string}
   */
  convertFormatToFlatpickr(format) {
    return format
      // Year conversion.
      .replace(/y/g, 'Y')
      .replace('YYYY', 'Y')
      .replace('YY', 'y')

      // Month conversion.
      .replace('MMMM', 'F')
      .replace(/M/g, 'n')
      .replace('nnn', 'M')
      .replace('nn', 'm')

      // Day in month.
      .replace(/d/g, 'j')
      .replace('jj', 'd')

      // Day in week.
      .replace('EEEE', 'l')
      .replace('EEE', 'D')

      // Hours, minutes, seconds
      .replace('HH', 'H')
      .replace('hh', 'h')
      .replace('mm', 'i')
      .replace('ss', 'S')
      .replace(/a/g, 'K');
  },
  /**
   * Convert the format from the angular-datepicker module to moment format.
   * @param format
   * @return {string}
   */
  convertFormatToMoment(format) {
    return format
      // Year conversion.
      .replace(/y/g, 'Y')
      // Day in month.
      .replace(/d/g, 'D')
      // Day in week.
      .replace(/E/g, 'd')
      // AM/PM marker
      .replace(/a/g, 'A');
  },
  /**
   * Returns an input mask that is compatible with the input mask library.
   * @param {string} mask - The Form.io input mask.
   * @returns {Array} - The input mask for the mask library.
   */
  getInputMask(mask) {
    if (mask instanceof Array) {
      return mask;
    }
    let maskArray = [];
    maskArray.numeric = true;
    for (let i = 0; i < mask.length; i++) {
      switch (mask[i]) {
        case '9':
          maskArray.push(/\d/);
          break;
        case 'A':
          maskArray.numeric = false;
          maskArray.push(/[a-zA-Z]/);
          break;
        case 'a':
          maskArray.numeric = false;
          maskArray.push(/[a-z]/);
          break;
        case '*':
          maskArray.numeric = false;
          maskArray.push(/[a-zA-Z0-9]/);
          break;
        default:
          maskArray.push(mask[i]);
          break;
      }
    }
    return maskArray;
  },
  matchInputMask(value, inputMask) {
    if (!inputMask) {
      return true;
    }
    for (let i = 0; i < inputMask.length; i++) {
      const char = value[i];
      const charPart = inputMask[i];

      if (!(_isRegExp(charPart) && charPart.test(char) || charPart === char)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Find the given form components in a map, using the component keys.
   *
   * @param {Array} components
   *   An array of the form components.
   * @param {Object} input
   *   The input component we're trying to uniquify.
   *
   * @returns {Object}
   *   The memoized form components.
   */
  findExistingComponents(components, input) {
    // Prebuild a list of existing components.
    var existingComponents = {};
    FormioUtils.eachComponent(components, function(component) {
      // If theres no key, we cant compare components.
      if (!component.key) return;
      if (component.key === input.key) {
        existingComponents[component.key] = component;
      }
    }, true);

    return existingComponents;
  },

  /**
   * Iterate the given key to make it unique.
   *
   * @param {String} key
   *   Modify the component key to be unique.
   *
   * @returns {String}
   *   The new component key.
   */
  iterateKey(key) {
    if (!key.match(/(\d+)$/)) {
      return key + '2';
    }

    return key.replace(/(\d+)$/, function(suffix) {
      return Number(suffix) + 1;
    });
  },

  /**
   * Appends a number to a component.key to keep it unique
   *
   * @param {Object} form
   *   The components parent form.
   * @param {Object} component
   *   The component to uniquify
   */
  uniquify(form, component) {
    let changed = false;
    // Recurse into all child components.
    FormioUtils.eachComponent([component], (component) => {
      // Skip key uniquification if this component doesn't have a key.
      if (!component.key) {
        return;
      }

      var memoization = FormioUtils.findExistingComponents(form.components, component);
      while (memoization.hasOwnProperty(component.key)) {
        component.key = this.iterateKey(component.key);
        changed = true;
      }
    }, true);
    return changed;
  }
};

module.exports = global.FormioUtils = FormioUtils;
