import { TextFieldComponent } from '../textfield/TextField';
import { BaseComponent } from '../base/Base';

export class TextAreaComponent extends TextFieldComponent {
  static schema(...extend) {
    return TextFieldComponent.schema({
      type: 'textarea',
      label: 'Text Area',
      key: 'textArea',
      rows: 3,
      wysiwyg: false,
      editor: ''
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Text Area',
      group: 'basic',
      icon: 'fa fa-font',
      documentation: 'http://help.form.io/userguide/#textarea',
      weight: 40,
      schema: TextAreaComponent.schema()
    };
  }

  constructor(component, options, data) {
    super(component, options, data);

    // Never submit on enter for text areas.
    this.options.submitOnEnter = false;
  }

  wysiwygDefault() {
    return {
      theme: 'snow',
      placeholder: this.component.placeholder,
      modules: {
        toolbar: [
          [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'font': [] }],
          ['bold', 'italic', 'underline', 'strike', {'script': 'sub'}, {'script': 'super'}, 'clean'],
          [{ 'color': [] }, { 'background': [] }],
          [{'list': 'ordered'}, {'list': 'bullet'}, { 'indent': '-1'}, { 'indent': '+1' }, { 'align': [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video', 'formula', 'source']
        ]
      }
    };
  }

  createInput(container) {
    if (!this.component.wysiwyg && !this.component.editor) {
      return super.createInput(container);
    }

    if (this.component.editor === 'ace') {
      BaseComponent.requireLibrary('ace', 'ace', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.9/ace.js', true)
        .then(() => {
          container.style.height = '200px';
          let mode = (this.component.as === 'json') ? 'json' : 'javascript';
          this.editor = ace.edit(container);
          this.editor.on('change', () => this.updateValue({noUpdateEvent: true}));
          this.editor.getSession().setTabSize(2);
          this.editor.getSession().setMode("ace/mode/" + mode);
        });
      return;
    }

    // Normalize the configurations.
    if (this.component.wysiwyg.toolbarGroups) {
      console.warn('The WYSIWYG settings are configured for CKEditor. For this renderer, you will need to use configurations for the Quill Editor. See https://quilljs.com/docs/configuration for more information.');
      this.component.wysiwyg = this.wysiwygDefault();
    }
    if (typeof this.component.wysiwyg === 'boolean') {
      this.component.wysiwyg = this.wysiwygDefault();
    }

    // Add the input.
    this.input = this.ce('div', {
      class: 'formio-wysiwyg-editor'
    });
    container.appendChild(this.input);

    // Lazy load the quill css.
    BaseComponent.requireLibrary('quill-css-' + this.component.wysiwyg.theme, 'Quill', [
      {type: 'styles', src: 'https://cdn.quilljs.com/1.3.5/quill.' + this.component.wysiwyg.theme + '.css'}
    ], true);

    // Lazy load the quill library.
    this.quillReady = BaseComponent.requireLibrary('quill', 'Quill', 'https://cdn.quilljs.com/1.3.5/quill.min.js', true)
      .then(() => {
        this.quill = new Quill(this.input, this.component.wysiwyg);

        /** This block of code adds the [source] capabilities.  See https://codepen.io/anon/pen/ZyEjrQ **/
        var txtArea = document.createElement('textarea');
        txtArea.setAttribute('class', 'quill-source-code');
        this.quill.addContainer('ql-custom').appendChild(txtArea);

        // Allows users to skip toolbar items when tabbing though form
        var elm = document.querySelectorAll('.ql-formats > button');
        for (var i=0; i < elm.length; i++) {
          elm[i].setAttribute("tabindex", "-1");
        }

        document.querySelector('.ql-source').addEventListener('click', () => {
          if (txtArea.style.display === 'inherit') {
            this.quill.clipboard.dangerouslyPasteHTML(txtArea.value);
          }
          txtArea.style.display = (txtArea.style.display === 'none') ? 'inherit' : 'none';
        });
        /** END CODEBLOCK **/

        this.quill.on('text-change', () => {
          txtArea.value = this.quill.root.innerHTML;
          this.updateValue({noUpdateEvent: true});
        });

        if (this.options.readOnly || this.component.disabled) {
          this.quill.disable();
        }

        return this.quill;
      });

    return this.input;
  }

  setConvertedValue(value) {
    if (this.component.as && this.component.as === 'json' && value) {
      try {
        value = JSON.stringify(value);
      }
      catch (err) {
        console.warn(err);
      }
    }
    return value;
  }

  isEmpty(value) {
    if (this.quill) {
      return (!value || (value === '<p><br></p>'));
    }
    else {
      return super.isEmpty(value);
    }
  }

  get defaultValue() {
    let defaultValue = super.defaultValue;
    if (this.component.wysiwyg && !defaultValue) {
      defaultValue = '<p><br></p>';
    }
    return defaultValue;
  }

  setValue(value, flags) {
    if (!this.component.wysiwyg && !this.component.editor) {
      return super.setValue(this.setConvertedValue(value), flags);
    }

    if (this.component.editor === 'ace') {
      return this.editor ? this.editor.setValue(this.setConvertedValue(value)) : '';
    }

    this.quillReady.then((quill) => {
      quill.clipboard.dangerouslyPasteHTML(this.setConvertedValue(value));
      this.updateValue(flags);
    });
  }

  getConvertedValue(value) {
    if (this.component.as && this.component.as === 'json' && value) {
      try {
        value = JSON.parse(value);
      }
      catch (err) {
        console.warn(err);
      }
    }
    return value;
  }

  getValue() {
    if (this.viewOnly) {
      return this.value;
    }

    if (!this.component.wysiwyg && !this.component.editor) {
      return this.getConvertedValue(super.getValue());
    }

    if (this.component.editor === 'ace') {
      return this.editor ? this.getConvertedValue(this.editor.getValue()) : '';
    }

    if (this.quill) {
      return this.getConvertedValue(this.quill.root.innerHTML);
    }

    return this.quill ? this.quill.root.innerHTML : super.getValue();
  }

  elementInfo() {
    let info = super.elementInfo();
    info.type = 'textarea';
    if (this.component.rows) {
      info.attr.rows = this.component.rows;
    }
    return info;
  }
}
