import _each from 'lodash/each';
import _map from 'lodash/map';
import _cloneDeep from 'lodash/cloneDeep';
import _clone from 'lodash/clone';
import _isArray from 'lodash/isArray';
import { FormioComponents } from '../Components';
import FormioUtils from '../../utils';

export class EditGridComponent extends FormioComponents {
  static schema(...extend) {
    return FormioComponents.schema({
      type: 'editgrid',
      label: 'Edit Grid',
      key: 'editGrid',
      clearOnHide: true,
      input: true,
      components: [],
      templates: {
        header: `
          <div class="row">
            {% util.eachComponent(components, function(component) { %}
              <div class="col-sm-2">{{ component.label }}</div>
            {% }) %}
          </div>`,
        row: `
          <div class="row">
            {% util.eachComponent(components, function(component) { %}
              <div class="col-sm-2">{{ row[component.key] }}</div>
            {% }) %}
            <div class="col-sm-2">
              <div class="btn-group pull-right">
                <div class="btn btn-default editRow">Edit</div>
                <div class="btn btn-danger removeRow">Delete</div>
              </div>
            </div>
          </div>`,
        footer: ''
      }
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Edit Grid',
      icon: 'fa fa-tasks',
      group: 'advanced',
      documentation: 'http://help.form.io/userguide/#editgrid',
      weight: 160,
      schema: EditGridComponent.schema()
    };
  }

  constructor(component, options, data) {
    super(component, options, data);
    this.type = 'datagrid';
    this.rows = [];
    this.editRows = [];
  }

  build() {
    this.createElement();
    this.createLabel(this.element);
    this.buildTable();
    this.createDescription(this.element);
    this.createAddButton();
    this.element.appendChild(this.errorContainer = this.ce('div', {class: 'has-error'}));
  }

  buildTable() {
    if (this.tableElement) {
      this.tableElement.innerHTML = '';
    }

    let tableClass = 'editgrid-listgroup list-group ';
    _each(['striped', 'bordered', 'hover', 'condensed'], (prop) => {
      if (this.component[prop]) {
        tableClass += 'table-' + prop + ' ';
      }
    });
    this.tableElement = this.ce('ul', {class: tableClass}, [
      this.headerElement = this.createHeader(),
      this.rowElements = _map(this.rows, this.createRow.bind(this)),
      this.footerElement = this.createFooter(),
    ]);

    this.element.appendChild(this.tableElement);
  }

  createHeader() {
    return this.component.templates.header ?
      this.ce('li', {class: 'list-group-item list-group-header'}, this.renderTemplate(this.component.templates.header, {
        components: this.component.components,
        util: FormioUtils,
        value: this.rows
      })) :
      this.text('');
  }

  createRow(row, rowIndex) {
    const wrapper = this.ce('li', {class: 'list-group-item'});

    // Store info so we can detect changes later.
    wrapper.rowData = row;
    wrapper.rowIndex = rowIndex;
    wrapper.rowOpen = this.editRows[rowIndex].isOpen;
    this.editRows[rowIndex].components = [];

    if (wrapper.rowOpen) {
      wrapper.appendChild(
        this.ce('div', {class: 'editgrid-edit'},
          this.ce('div', {class: 'editgrid-body'},
            [
              this.component.components.map(comp => {
                const component = _cloneDeep(comp);
                component.row = this.row + '-' + rowIndex;
                const options = _clone(this.options);
                options.name += '[' + rowIndex + ']';
                const instance = this.createComponent(component, options, this.editRows[rowIndex].data);
                this.editRows[rowIndex].components.push(instance);
                return instance.element;
              }),
              this.ce('div', {class: 'editgrid-actions'},
                [
                  this.ce('div', {
                    class: 'btn btn-primary',
                    onClick: this.saveRow.bind(this, rowIndex)
                  }, this.component.saveRow || 'Save'),
                  ' ',
                  this.component.removeRow ?
                    this.ce('div', {
                      class: 'btn btn-danger',
                      onClick: this.cancelRow.bind(this, rowIndex)
                    }, this.component.removeRow || 'Cancel')
                    : null
                ]
              )
            ]
          )
        )
      );
    }
    else {
      wrapper.appendChild(
        this.renderTemplate(this.component.templates.row,
          {
            row,
            rowIndex,
            components: this.component.components,
            util: FormioUtils
          },
          [
            {
              class: 'removeRow',
              event: 'click',
              action: this.removeRow.bind(this, rowIndex)
            },
            {
              class: 'editRow',
              event: 'click',
              action: this.editRow.bind(this, rowIndex)
            }
          ]
        )
      );
    }
    wrapper.appendChild(this.editRows[rowIndex].errorContainer = this.ce('div', {class: 'has-error'}));
    this.checkData(this.data, {noValidate: true}, rowIndex);
    return wrapper;
  }

  createFooter() {
    return this.component.templates.footer ?
      this.ce('li', {class: 'list-group-item list-group-footer'}, this.renderTemplate(this.component.templates.footer, {
        components: this.component.components,
        util: FormioUtils,
        value: this.rows
      })) :
      this.text('');
  }

  checkData(data, flags = {}, index) {
    let valid = true;
    if (flags.noCheck) {
      return;
    }

    // Update the value.
    let changed = this.updateValue({
      noUpdateEvent: true
    });

    // Iterate through all components and check conditions, and calculate values.
    this.editRows[index].components.forEach(comp => {
      changed |= comp.calculateValue(data, {
        noUpdateEvent: true
      });
      comp.checkConditions(this.editRows[index].data);
      if (!flags.noValidate) {
        valid &= comp.checkValidity(this.editRows[index].data, !this.editRows[index].isOpen);
      }
    });

    valid &= this.validateRow(index, false);

    // Trigger the change if the values changed.
    if (changed) {
      this.triggerChange(flags);
    }

    // Return if the value is valid.
    return valid;
  }

  createAddButton() {
    this.element.appendChild(this.ce('div', {class: 'editgrid-add'},
      this.ce('button', {
          class: 'btn btn-primary',
          role: 'button',
          onClick: this.addRow.bind(this)
        },
        [
          this.ce('span', {class: this.iconClass('plus'), 'aria-hidden': true}),
          ' ',
          this.t(this.component.addAnother ? this.component.addAnother : 'Add Another', {})
        ],
      )
    ));
  }

  refreshDOM() {
    const newHeader = this.createHeader();
    this.tableElement.replaceChild(newHeader, this.headerElement);
    this.headerElement = newHeader;

    const newFooter = this.createFooter();
    this.tableElement.replaceChild(newFooter, this.footerElement);
    this.footerElement = newFooter;

    this.editRows.forEach((editRow, rowIndex) => {
      if (!editRow.element) {
        // New row
        editRow.element = this.createRow(editRow.data, rowIndex);
        this.tableElement.insertBefore(editRow.element, this.tableElement.children[rowIndex + 1]);
      }
      else if (
        editRow.element.rowData !== editRow.data ||
        editRow.element.rowIndex !== rowIndex ||
        editRow.element.rowOpen !== editRow.isOpen
      ) {
        // Row has changed due to an edit or delete.
        this.removeRowComponents(rowIndex);
        const newRow = this.createRow(editRow.data, rowIndex);
        this.tableElement.replaceChild(newRow, editRow.element);
        editRow.element = newRow;
      }
    });
  }

  addRow() {
    if (this.options.readOnly) {
      return;
    }
    this.editRows.push({
      isOpen: true,
      data: {}
    });
    this.updateValue();
    this.refreshDOM();
  }

  editRow(rowIndex) {
    this.editRows[rowIndex].isOpen = true;
    this.editRows[rowIndex].data = _cloneDeep(this.rows[rowIndex]);
    this.refreshDOM();
  }

  cancelRow(rowIndex) {
    if (this.options.readOnly) {
      this.editRows[rowIndex].isOpen = false;
      this.removeRowComponents(rowIndex);
      this.refreshDOM();
      return;
    }
    this.removeRowComponents(rowIndex);
    // Remove if new.
    if (!this.rows[rowIndex]) {
      this.tableElement.removeChild(this.editRows[rowIndex].element);
      this.editRows.splice(rowIndex, 1);
      this.rows.splice(rowIndex, 1);
    }
    else {
      this.editRows[rowIndex].isOpen = false;
      this.editRows[rowIndex].data = this.rows[rowIndex];
    }
    this.refreshDOM();
  }

  saveRow(rowIndex) {
    if (this.options.readOnly) {
      this.editRows[rowIndex].isOpen = false;
      this.removeRowComponents(rowIndex);
      this.refreshDOM();
      return;
    }
    if (!this.validateRow(rowIndex, true)) {
      return;
    }
    this.removeRowComponents(rowIndex);
    this.rows[rowIndex] = this.editRows[rowIndex].data;
    this.editRows[rowIndex].isOpen = false;
    this.checkValidity(this.data, true);
    this.updateValue();
    this.refreshDOM();
  }

  removeRow(rowIndex) {
    if (this.options.readOnly) {
      return;
    }
    this.removeRowComponents(rowIndex);
    this.rows.splice(rowIndex, 1);
    this.tableElement.removeChild(this.editRows[rowIndex].element);
    this.editRows.splice(rowIndex, 1);
    this.updateValue();
    this.refreshDOM();
  }

  removeRowComponents(rowIndex) {
    // Clean up components list.
    this.editRows[rowIndex].components.forEach(comp => {
      this.removeComponent(comp, this.components);
    });
    this.editRows[rowIndex].components = [];
  }

  validateRow(rowIndex, dirty) {
    let check = true;
    this.editRows[rowIndex].components.forEach(comp => {
      comp.setPristine(!dirty);
      check &= comp.checkValidity(this.editRows[rowIndex].data, dirty);
    });

    if (this.component.validate && this.component.validate.row) {
      let custom = this.component.validate.row;
      custom = custom.replace(/({{\s+(.*)\s+}})/, function(match, $1, $2) {
        return this.editRows[rowIndex].data[$2];
      }.bind(this));
      let valid;
      try {
        const row = this.editRows[rowIndex].data;
        const data = this.data;
        valid = new Function('row', 'data', custom + '; return valid;')(row, data);
      }
      catch (e) {
        /* eslint-disable no-console, no-undef */
        console.warn('A syntax error occurred while computing custom values in ' + this.component.key, e);
        /* eslint-enable no-console */
      }
      this.editRows[rowIndex].errorContainer.innerHTML = '';
      if (valid !== true) {
        this.editRows[rowIndex].errorContainer.appendChild(
          this.ce('div', {class: 'editgrid-row-error help-block'}, valid)
        );
        return false;
      }
    }

    return check;
  }

  checkValidity(data, dirty) {
    if (!FormioUtils.checkCondition(this.component, data, this.data)) {
      return true;
    }

    let rowsValid = true;
    let rowsClosed = true;
    this.editRows.forEach((editRow, rowIndex) => {
      // Trigger all errors on the row.
      const rowValid = this.validateRow(rowIndex, false);
      // Add has-error class to row.
      if (!rowValid) {
        this.addClass(this.editRows[rowIndex].element, 'has-error');
      }
      else {
        this.removeClass(this.editRows[rowIndex].element, 'has-error');
      }
      rowsValid &= rowValid;

      // Any open rows causes validation to fail.
      rowsClosed &= !editRow.isOpen;
    });

    if (!rowsValid) {
      this.setCustomValidity('Please correct rows before proceeding.', dirty);
      return false;
    }
    else if (!rowsClosed) {
      this.setCustomValidity('Please save all rows before proceeding.', dirty);
      return false;
    }

    this.setCustomValidity();
    return true;
  }

  setCustomValidity(message, dirty) {
    if (this.errorElement && this.errorContainer) {
      this.errorElement.innerHTML = '';
      try {
        this.errorContainer.removeChild(this.errorElement);
      }
      catch (err) {}
    }
    if (message) {
      this.emit('componentError', this.error);
      this.createErrorElement();
      let errorMessage = this.ce('p', {
        class: 'help-block'
      });
      errorMessage.appendChild(this.text(message));
      this.errorElement.appendChild(errorMessage);
    }
  }

  get defaultValue() {
    return [];
  }

  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    if (!value) {
      return;
    }
    if (!_isArray(value)) {
      return;
    }

    this.rows = this.data[this.component.key] = value;
    // Refresh editRow data when data changes.
    this.rows.forEach((row, rowIndex) => {
      if (this.editRows[rowIndex]) {
        this.editRows[rowIndex].data = row;
      }
      else {
        this.editRows[rowIndex] = {
          isOpen: false,
          data: row
        };
      }
    });
    this.refreshDOM();
  }

  /**
   * Get the value of this component.
   *
   * @returns {*}
   */
  getValue() {
    return this.rows;
  }
}
