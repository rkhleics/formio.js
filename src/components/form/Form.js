import FormioForm from '../../formio.form';
import FormioUtils from '../../utils';
import Formio from '../../formio';
import { FormioComponents } from "../Components";
import _isEmpty from 'lodash/isEmpty';

export class FormComponent extends FormioForm {
  static schema(...extend) {
    return FormioComponents.schema({
      type: 'form',
      key: 'form',
      src: '',
      reference: true,
      form: '',
      path: ''
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Nested Form',
      icon: 'fa fa-wpforms',
      group: 'advanced',
      documentation: 'http://help.form.io/userguide/#form',
      weight: 110,
      schema: FormComponent.schema()
    };
  }

  constructor(component, options, data) {
    data = data || {};
    super(null, options);

    // Ensure this component does not make it to the global forms array.
    delete Formio.forms[this.id];
    this.type = 'formcomponent';
    this.component = component;
    this.submitted = false;
    this.data = data;
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
  }

  /**
   * Load the subform.
   */
  loadSubForm() {
    if (this.subFormLoaded) {
      return true;
    }
    this.subFormLoaded = true;
    let srcOptions = {};
    if (this.options && this.options.base) {
      srcOptions.base = this.options.base;
    }
    if (this.options && this.options.project) {
      srcOptions.project = this.options.project;
    }

    // Make sure that if reference is provided, the form must submit.
    if (this.component.reference) {
      this.component.submit = true;
    }

    if (
      !this.component.src &&
      !this.options.formio &&
      this.component.form
    ) {
      this.component.src = Formio.getBaseUrl();
      if (this.component.project) {
        // Check to see if it is a MongoID.
        if (FormioUtils.isMongoId(this.component.project)) {
          this.component.src += '/project';
        }
        this.component.src += '/' + this.component.project;
        srcOptions.project = this.component.src;
      }
      this.component.src += '/form/' + this.component.form;
    }

    // Build the source based on the root src path.
    if (!this.component.src && this.options.formio) {
      let rootSrc = this.options.formio.formsUrl;
      if (this.component.path) {
        let parts = rootSrc.split('/');
        parts.pop();
        this.component.src = parts.join('/') + '/' + this.component.path;
      }
      if (this.component.form) {
        this.component.src = rootSrc + '/' + this.component.form;
      }
    }

    // Add the source to this actual submission if the component is a reference.
    if (
      this.data &&
      this.data[this.component.key] &&
      this.data[this.component.key]._id &&
      this.component.reference &&
      !this.component.src.includes('/submission/')
    ) {
      this.component.src += '/submission/' + this.data[this.component.key]._id;
    }

    // Set the src if the property is provided in the JSON.
    if (this.component.src) {
      this.setSrc(this.component.src, srcOptions);
    }

    // Directly set the submission if it isn't a reference.
    if (this.data && this.data[this.component.key] && !this.component.reference) {
      this.setSubmission(this.data[this.component.key]);
    }

    // Set language after everything is established.
    if (this.options && this.options.language) {
      this.language = this.options.language;
    }
  }

  get subData() {
    if (!this.data[this.component.key]) {
      this.data[this.component.key] = {data: {}};
    }
    return this.data[this.component.key].data;
  }

  checkValidity() {
    // Maintain isolated data scope when passing root data for validity checks.
    return super.checkValidity(this.subData);
  }

  checkConditions() {
    // Check the conditions for the subform.
    if (super.checkConditions(this.subData)) {
      // Only load the subform if this component is visible.
      this.loadSubForm();
      return true;
    }

    return false;
  }

  calculateValue(data, flags) {
    // Maintain isolated data scope when calculating values.
    return super.calculateValue(this.subData, flags);
  }

  /**
   * Submit the form before the next page is triggered.
   */
  beforeNext() {
    // If we wish to submit the form on next page, then do that here.
    if (this.component.submit) {
      this.submitted = true;
      return this.submit(true);
    }
    else {
      return super.beforeNext();
    }
  }

  /**
   * Submit the form before the whole form is triggered.
   */
  beforeSubmit() {
    // Ensure we submit the form.
    if (this.component.submit && !this.submitted) {
      return this.submit(true).then(submission => {
        // Before we submit, we need to filter out the references.
        this.data[this.component.key] = this.component.reference ? {_id: submission._id, form: submission.form} : submission;
        return this.data[this.component.key];
      });
    }
    else {
      return super.beforeSubmit();
    }
  }

  build() {
    if (!this.element) {
      this.createElement();
      this.setElement(this.element);
    }

    // Iterate through every component and hide the submit button.
    FormioUtils.eachComponent(this.component.components, (component) => {
      if ((component.type === 'button') && (component.action === 'submit')) {
        component.hidden = true;
      }
    });

    // Set the data for this form.
    if (!this.data[this.component.key]) {
      this.data[this.component.key] = this.defaultValue;
      if (!this.data[this.component.key]) {
        this.data[this.component.key] = {data: {}};
      }
    }

    // Add components using the data of the submission.
    this.addComponents(this.getContainer(), this.subData);

    // Restore default values.
    this.restoreValue();

    // Get the submission value.
    let submission = this.getValue();

    // Check conditions for this form.
    this.checkConditions(submission);

    // Check the data for default values.
    this.checkData(submission.data, {
      noValidate: true
    });
  }

  whenReady() {
    return this.ready.then(() => this.readyPromise);
  }

  emit(event, data) {
    switch (event) {
      case 'submit':
        event = 'formComponentSubmit';
        break;
      case 'submitDone':
        event = 'formComponentSubmitDone';
        break;
      case 'formLoad':
        event = 'formComponentLoad';
        break;
      case 'render':
        event = 'formComponentRender';
        break;
    }

    super.emit(event, data);
  }

  setValue(submission, flags) {
    flags = this.getFlags.apply(this, arguments);
    if (!submission) {
      this.data[this.component.key] = this._submission = {data: {}};
      this.readyResolve();
      return;
    }

    // Load the subform if we have data.
    if (submission._id || !_isEmpty(this.data[this.component.key])) {
      this.loadSubForm();
    }

    // Set the url of this form to the url for a submission if it exists.
    if (submission._id) {
      let submissionUrl = this.options.formio.formsUrl + '/' + submission.form + '/submission/' + submission._id;
      this.setUrl(submissionUrl, this.options);
      this.nosubmit = false;
    }

    if (submission._id && !flags.noload) {
      this.formio.submissionId = submission._id;
      this.formio.submissionUrl = this.formio.submissionsUrl + '/' + submission._id;
      this.formReady.then(() => {
        this._loading = false;
        this.loading = true;
        this.formio.loadSubmission().then((result) => {
          this.loading = false;
          this.setValue(result, {
            noload: true
          });
        });
      });

      // Assume value has changed.
      return true;
    }
    else {
      let superValue = super.setValue(submission, flags, this.data[this.component.key].data);
      this.readyResolve();
      return superValue;
    }
  }

  getValue() {
    return this.data[this.component.key];
  }
}
