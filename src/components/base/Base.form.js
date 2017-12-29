import _mergeWith from 'lodash/mergeWith';
import _sortBy from 'lodash/sortBy';
import _isArray from 'lodash/isArray';
import _unionWith from 'lodash/unionWith';

let mergeComponents = (objValue, srcValue) => {
  if (_isArray(objValue)) {
    if (objValue[0] && objValue[0].components) {
      return _mergeWith(objValue, srcValue, mergeComponents);
    }
    if (objValue[0] && objValue[0].type) {
      return _sortBy(_unionWith(objValue, srcValue, (a, b) => (a.key === b.key)), ['weight']);
    }
    return objValue.concat(srcValue);
  }
};

const javaScriptValue = function(title, property) {
  return {
    type: 'panel',
    title: title,
    theme: 'default',
    collapsible: true,
    collapsed: true,
    key: property + 'Panel',
    components: [
      {
        type: 'panel',
        title: 'JavaScript Default',
        collapsible: true,
        collapsed: false,
        style: {'margin-bottom': '10px'},
        key: property + '-js',
        components: [
          {
            type: 'textarea',
            key: property,
            rows: 5,
            editor: 'ace',
            input: true
          },
          {
            type: 'htmlelement',
            tag: 'div',
            content: '<p>Enter custom default value code.</p>' +
            '<p>You must assign the <strong>value</strong> variable as the result you want for the default value.</p>' +
            '<p>The global variable data is provided, and allows you to access the data of any form component, by using its API key.</p>' +
            '<p>Default Values are only calculated on form load. Use Calculated Value for a value that will update with the form.</p>'
          }
        ]
      },
      {
        type: 'panel',
        title: 'JSONLogic Default',
        collapsible: true,
        collapsed: true,
        key: property + '-json',
        components: [
          {
            type: 'htmlelement',
            tag: 'div',
            content: '<p>Execute custom logic using <a href="http://jsonlogic.com/" target="_blank">JSONLogic</a>.</p>' +
            '<p>Submission data is available as JsonLogic variables, with the same api key as your components.</p>' +
            '<p><a href="http://formio.github.io/formio.js/app/examples/calculated.html" target="_blank">Click here for an example</a></p>'
          },
          {
            type: 'textarea',
            key: property,
            rows: 5,
            editor: 'ace',
            as: 'json',
            input: true
          }
        ]
      }
    ]
  };
};

module.exports = function(...extend) {
  return _mergeWith({
    components: [
      {
        weight: 0,
        type: 'tabs',
        key: 'tabs',
        components: [
          {
            label: 'Display',
            key: 'display',
            components: [
              {
                weight: 0,
                type: 'textfield',
                input: true,
                key: 'label',
                label: 'Label',
                placeholder: 'Field Label',
                tooltip: 'The label for this field that will appear next to it.'
              },
              {
                weight: 100,
                type: 'textfield',
                input: true,
                key: 'placeholder',
                label: 'Placeholder',
                placeholder: 'Placeholder',
                tooltip: 'The placeholder text that will appear when this field is empty.'
              },
              {
                weight: 200,
                type: 'textfield',
                input: true,
                key: 'description',
                label: 'Description',
                placeholder: 'Description for this field.',
                tooltip: 'The description is text that will appear below the input field.'
              },
              {
                weight: 300,
                type: 'textarea',
                input: true,
                key: 'tooltip',
                label: 'Tooltip',
                placeholder: 'To add a tooltip to this field, enter text here.',
                tooltip: 'Adds a tooltip to the side of this field.'
              },
              {
                weight: 400,
                type: 'textfield',
                input: true,
                key: 'errorLabel',
                label: 'Error Label',
                placeholder: 'Error Label',
                tooltip: 'The label for this field when an error occurs.'
              },
              {
                weight: 500,
                type: 'textfield',
                input: true,
                key: 'customClass',
                label: 'Custom CSS Class',
                placeholder: 'Custom CSS Class',
                tooltip: 'Custom CSS class to add to this component.'
              },
              {
                weight: 600,
                type: 'textfield',
                input: true,
                key: 'tabIndex',
                label: 'Tab Index',
                placeholder: 'Tab Index',
                tooltip: 'Sets the tabindex attribute of this component to override the tab order of the form. See the <a href=\\\'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex\\\'>MDN documentation</a> on tabindex for more information.'
              },
              {
                weight: 700,
                type: 'checkbox',
                label: 'Multiple Values',
                tooltip: 'Allows multiple values to be entered for this field.',
                key: 'multiple',
                input: true
              },
              {
                weight: 800,
                type: 'checkbox',
                label: 'Clear Value When Hidden',
                key: 'clearOnHide',
                tooltip: 'When a field is hidden, clear the value.',
                input: true
              },
              {
                weight: 900,
                type: 'checkbox',
                label: 'Protected',
                tooltip: 'A protected field will not be returned when queried via API.',
                key: 'protected',
                input: true
              },
              {
                weight: 1000,
                type: 'checkbox',
                label: 'Persistent',
                tooltip: 'A persistent field will be stored in database when the form is submitted.',
                key: 'persistent',
                input: true
              },
              {
                weight: 1100,
                type: 'checkbox',
                label: 'Hidden',
                tooltip: 'A hidden field is still a part of the form, but is hidden from view.',
                key: 'hidden',
                input: true
              },
              {
                weight: 1200,
                type: 'checkbox',
                label: 'Hide Label',
                tooltip: 'Hide the label of this component. This allows you to show the label in the form builder, but not when it is rendered.',
                key: 'hideLabel',
                input: true
              },
              {
                weight: 1300,
                type: 'checkbox',
                label: 'Hide Input',
                tooltip: 'Hide the input in the browser. This does not encrypt on the server. Do not use for passwords.',
                key: 'mask',
                input: true
              },
              {
                weight: 1400,
                type: 'checkbox',
                label: 'Disabled',
                tooltip: 'Disable the form input.',
                key: 'disabled',
                input: true
              },
              {
                weight: 1500,
                type: 'checkbox',
                label: 'Table View',
                tooltip: 'Shows this value within the table view of the submissions.',
                key: 'tableView',
                input: true
              }
            ]
          },
          {
            label: 'Data',
            key: 'data',
            components: [
              {
                type: 'textfield',
                label: 'Default Value',
                key: 'defaultValue',
                placeholder: 'Default Value',
                tooltip: 'The will be the value for this field, before user interaction. Having a default value will override the placeholder text.',
                input: true
              },
              javaScriptValue('Custom Default Value', 'customDefaultValue'),
              javaScriptValue('Calculated Value', 'calculateValue')
            ]
          },
          {
            label: 'Validation',
            key: 'validation',
            components: []
          },
          {
            label: 'API',
            key: 'api',
            components: [
              {
                weight: 0,
                type: 'textfield',
                input: true,
                key: 'key',
                label: 'Property Name',
                tooltip: 'The name of this field in the API endpoint.'
              }
            ]
          },
          {
            label: 'Layout',
            key: 'layout',
            components: []
          },
          {
            label: 'Conditional',
            key: 'conditional',
            components: []
          }
        ]
      }
    ]
  }, ...extend, mergeComponents);
};
