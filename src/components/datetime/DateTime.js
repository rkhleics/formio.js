import { BaseComponent } from '../base/Base';
import Flatpickr from 'flatpickr';
import _get from 'lodash/get';
import _each from 'lodash/each';
import {
  getDateSetting,
  getLocaleDateFormatInfo,
  convertFormatToFlatpickr,
  convertFormatToMoment,
} from '../../utils';
import moment from 'moment';

export class DateTimeComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema({
      type: 'datetime',
      label: 'Date / Time',
      key: 'dateTime',
      format: 'yyyy-MM-dd HH:mm a',
      enableDate: true,
      enableTime: true,
      defaultDate: '',
      datepickerMode: 'day',
      datePicker: {
        showWeeks: true,
        startingDay: 0,
        initDate: '',
        minMode: 'day',
        maxMode: 'year',
        yearRows: 4,
        yearColumns: 5,
        minDate: null,
        maxDate: null
      },
      timePicker: {
        hourStep: 1,
        minuteStep: 1,
        showMeridian: true,
        readonlyInput: false,
        mousewheel: true,
        arrowkeys: true
      }
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Date / Time',
      group: 'advanced',
      icon: 'fa fa-calendar-plus-o',
      documentation: 'http://help.form.io/userguide/#datetime',
      weight: 40,
      schema: DateTimeComponent.schema()
    };
  }

  constructor(component, options, data) {
    super(component, options, data);
    this.validators.push('date');
    this.closedOn = 0;

    const dateFormatInfo = getLocaleDateFormatInfo(this.options.language);
    this.defaultFormat = {
      date: dateFormatInfo.dayFirst ? 'd/m/Y ' : 'm/d/Y ',
      time: 'h:i K'
    };
  }

  elementInfo() {
    const info = super.elementInfo();
    info.type = 'input';
    info.attr.type = 'text';
    info.changeEvent = 'input';
    this.component.suffix = true;
    return info;
  }

  /**
   * Get the default date for the calendar.
   * @return {*}
   */
  get defaultDate() {
    return getDateSetting(this.component.defaultDate);
  }

  // This select component can handle multiple items on its own.
  createWrapper() {
    return false;
  }

  getLocaleFormat() {
    let format = '';

    if (this.component.enableDate) {
      format += this.defaultFormat.date;
    }

    if (this.component.enableTime) {
      format += this.defaultFormat.time;
    }

    return format;
  }

  get config() {
    return {
      altInput: true,
      clickOpens: true,
      enableDate: true,
      mode: this.component.multiple ? 'multiple' : 'single',
      enableTime: _get(this.component, 'enableTime', true),
      noCalendar: !_get(this.component, 'enableDate', true),
      altFormat: this.component.useLocaleSettings
        ? this.getLocaleFormat()
        : convertFormatToFlatpickr(_get(this.component, 'format', '')),
      dateFormat: 'U',
      defaultDate: this.defaultDate,
      hourIncrement: _get(this.component, 'timePicker.hourStep', 1),
      minuteIncrement: _get(this.component, 'timePicker.minuteStep', 5),
      minDate: getDateSetting(_get(this.component, 'datePicker.minDate')),
      maxDate: getDateSetting(_get(this.component, 'datePicker.maxDate')),
      onChange: () => this.onChange(),
      onClose: () => (this.closedOn = Date.now())
    };
  }

  set disabled(disabled) {
    super.disabled = disabled;
    _each(this.inputs, (input) => {
      const calendar = this.getCalendar(input);
      if (calendar) {
        if (disabled) {
          calendar._input.setAttribute('disabled', 'disabled');
        }
        else {
          calendar._input.removeAttribute('disabled');
        }
        calendar.redraw();
      }
    });
  }

  addSuffix(input, inputGroup) {
    const suffix = this.ce('span', {
      class: 'input-group-addon',
      style: 'cursor: pointer'
    });
    suffix.appendChild(this.getIcon(this.component.enableDate ? 'calendar' : 'time'));
    const calendar = this.getCalendar(input);
    if (calendar) {
      this.addEventListener(suffix, 'click', () => {
        // Make sure the calendar is not already open and that it did not just close (like from blur event).
        if (!calendar.isOpen && ((Date.now() - this.closedOn) > 200)) {
          calendar.open();
        }
      });
    }
    inputGroup.appendChild(suffix);
    return suffix;
  }

  /**
   * Get the calendar or create an instance of one.
   * @param input
   * @return {Flatpickr|flatpickr}
   */
  getCalendar(input) {
    if (!input.calendar && !this.options.noCalendar) {
      input.calendar = new Flatpickr(input, this.config);
    }
    return input.calendar;
  }

  getDate(value) {
    const timestamp = parseInt(value, 10);
    if (!timestamp) {
      return null;
    }
    return (new Date(timestamp * 1000));
  }

  getRawValue() {
    const values = [];
    for (let i in this.inputs) {
      if (this.inputs.hasOwnProperty(i)) {
        if (!this.component.multiple) {
          return this.getDate(this.inputs[i].value);
        }
        values.push(this.getDate(this.inputs[i].value));
      }
    }
    return values;
  }

  getValueAt(index) {
    if (!this.inputs[index]) {
      return '';
    }

    const calendar = this.getCalendar(this.inputs[index]);
    if (!calendar) {
      return super.getValueAt(index);
    }

    const dates = calendar.selectedDates;
    if (!dates || !dates.length) {
      return '';
    }

    return dates[0].toISOString();
  }

  getView(value) {
    return value ? moment(value).format(convertFormatToMoment(_get(this.component, 'format', ''))) : null;
  }

  setValueAt(index, value) {
    if (value) {
      const calendar = this.getCalendar(this.inputs[index]);
      if (!calendar) {
        return super.setValueAt(index, value);
      }

      calendar.setDate(value ? new Date(value) : new Date(), false);
    }
  }
}
