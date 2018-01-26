import _each from 'lodash/each';
import { FormioComponents } from '../Components';

export class TableComponent extends FormioComponents {
  static schema(...extend) {
    return FormioComponents.schema({
      type: 'table',
      input: false,
      key: 'table',
      numRows: 3,
      numCols: 3,
      rows: [
        [{components: []}, {components: []}, {components: []}],
        [{components: []}, {components: []}, {components: []}],
        [{components: []}, {components: []}, {components: []}]
      ],
      header: [],
      caption: '',
      striped: false,
      bordered: false,
      hover: false,
      condensed: false
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Table',
      group: 'layout',
      icon: 'fa fa-table',
      weight: 40,
      documentation: 'http://help.form.io/userguide/#table',
      schema: TableComponent.schema()
    };
  }

  build() {
    this.element = this.ce('div', {
      class: 'table-responsive'
    });

    let tableClass = 'table ';
    _each(['striped', 'bordered', 'hover', 'condensed'], (prop) => {
      if (this.component[prop]) {
        tableClass += 'table-' + prop + ' ';
      }
    });
    let table = this.ce('table', {
      class: tableClass
    });

    // Build the header.
    if (this.component.header && this.component.header.length) {
      let thead = this.ce('thead');
      let thr = this.ce('tr');
      _each(this.component.header, (header) => {
        let th = this.ce('th');
        th.appendChild(this.text(header));
        thr.appendChild(th);
      });
      thead.appendChild(thr);
      table.appendChild(thead);
    }

    // Build the body.
    let tbody = this.ce('tbody');
    _each(this.component.rows, (row) => {
      let tr = this.ce('tr');
      _each(row, (column) => {
        let td = this.ce('td');
        _each(column.components, (comp) => {
          this.addComponent(comp, td);
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    this.element.appendChild(table);
  }
}
