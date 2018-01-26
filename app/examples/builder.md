---
title: Form Builder
layout: vtabs
section: examples
weight: 30
lib: builder
---
Form builder example

<div id="formio"></div>
<script type="text/javascript">
Formio.builder(document.getElementById("formio"), {
  components: [
    {
      clearOnHide: false,
      input: false,
      tableView: false,
      key: 'columns',
      columns: [
        {
          components: [
            {
              input: true,
              tableView: true,
              inputType: 'text',
              inputMask: '',
              label: 'A',
              key: 'columnsA',
              placeholder: '',
              prefix: '',
              suffix: '',
              multiple: false,
              defaultValue: '',
              protected: false,
              unique: false,
              persistent: true,
              hidden: false,
              clearOnHide: true,
              validate: {
                required: false,
                minLength: '',
                maxLength: '',
                pattern: '',
                custom: '',
                customPrivate: false
              },
              conditional: {
                show: '',
                when: null,
                eq: ''
              },
              type: 'textfield',
              hideLabel: false,
              labelPosition: 'top',
              tags: [
                
              ]
            },
            {
              input: true,
              tableView: true,
              inputType: 'text',
              inputMask: '',
              label: 'C',
              key: 'columnsC',
              placeholder: '',
              prefix: '',
              suffix: '',
              multiple: false,
              defaultValue: '',
              protected: false,
              unique: false,
              persistent: true,
              hidden: false,
              clearOnHide: true,
              validate: {
                required: false,
                minLength: '',
                maxLength: '',
                pattern: '',
                custom: '',
                customPrivate: false
              },
              conditional: {
                show: '',
                when: null,
                eq: ''
              },
              type: 'textfield',
              hideLabel: false,
              labelPosition: 'top',
              tags: [
                
              ]
            },
            {
              clearOnHide: false,
              input: false,
              tableView: false,
              key: 'columnsColumns',
              columns: [
                {
                  components: [
                    {
                      input: true,
                      tableView: true,
                      inputType: 'text',
                      inputMask: '',
                      label: 'E',
                      key: 'columnsColumnsE',
                      placeholder: '',
                      prefix: '',
                      suffix: '',
                      multiple: false,
                      defaultValue: '',
                      protected: false,
                      unique: false,
                      persistent: true,
                      hidden: false,
                      clearOnHide: true,
                      validate: {
                        required: false,
                        minLength: '',
                        maxLength: '',
                        pattern: '',
                        custom: '',
                        customPrivate: false
                      },
                      conditional: {
                        show: '',
                        when: null,
                        eq: ''
                      },
                      type: 'textfield',
                      hideLabel: false,
                      labelPosition: 'top',
                      tags: [
                        
                      ]
                    },
                    {
                      input: true,
                      tableView: true,
                      inputType: 'text',
                      inputMask: '',
                      label: 'I',
                      key: 'columnsColumnsI',
                      placeholder: '',
                      prefix: '',
                      suffix: '',
                      multiple: false,
                      defaultValue: '',
                      protected: false,
                      unique: false,
                      persistent: true,
                      hidden: false,
                      clearOnHide: true,
                      validate: {
                        required: false,
                        minLength: '',
                        maxLength: '',
                        pattern: '',
                        custom: '',
                        customPrivate: false
                      },
                      conditional: {
                        show: '',
                        when: null,
                        eq: ''
                      },
                      type: 'textfield',
                      hideLabel: false,
                      labelPosition: 'top',
                      tags: [
                        
                      ]
                    }
                  ],
                  width: 6,
                  offset: 0,
                  push: 0,
                  pull: 0
                },
                {
                  components: [
                    {
                      input: true,
                      tableView: true,
                      inputType: 'text',
                      inputMask: '',
                      label: 'F',
                      key: 'columnsColumnsF',
                      placeholder: '',
                      prefix: '',
                      suffix: '',
                      multiple: false,
                      defaultValue: '',
                      protected: false,
                      unique: false,
                      persistent: true,
                      hidden: false,
                      clearOnHide: true,
                      validate: {
                        required: false,
                        minLength: '',
                        maxLength: '',
                        pattern: '',
                        custom: '',
                        customPrivate: false
                      },
                      conditional: {
                        show: '',
                        when: null,
                        eq: ''
                      },
                      type: 'textfield',
                      hideLabel: false,
                      labelPosition: 'top',
                      tags: [
                        
                      ]
                    },
                    {
                      input: true,
                      tableView: true,
                      inputType: 'text',
                      inputMask: '',
                      label: 'J',
                      key: 'columnsColumnsJ',
                      placeholder: '',
                      prefix: '',
                      suffix: '',
                      multiple: false,
                      defaultValue: '',
                      protected: false,
                      unique: false,
                      persistent: true,
                      hidden: false,
                      clearOnHide: true,
                      validate: {
                        required: false,
                        minLength: '',
                        maxLength: '',
                        pattern: '',
                        custom: '',
                        customPrivate: false
                      },
                      conditional: {
                        show: '',
                        when: null,
                        eq: ''
                      },
                      type: 'textfield',
                      hideLabel: false,
                      labelPosition: 'top',
                      tags: [
                        
                      ]
                    }
                  ],
                  width: 6,
                  offset: 0,
                  push: 0,
                  pull: 0
                }
              ],
              type: 'columns',
              hideLabel: false,
              tags: [
                
              ],
              conditional: {
                show: '',
                when: null,
                eq: ''
              }
            },
            {
              input: true,
              tableView: true,
              inputType: 'text',
              inputMask: '',
              label: 'K',
              key: 'columnsK',
              placeholder: '',
              prefix: '',
              suffix: '',
              multiple: false,
              defaultValue: '',
              protected: false,
              unique: false,
              persistent: true,
              hidden: false,
              clearOnHide: true,
              validate: {
                required: false,
                minLength: '',
                maxLength: '',
                pattern: '',
                custom: '',
                customPrivate: false
              },
              conditional: {
                show: '',
                when: null,
                eq: ''
              },
              type: 'textfield',
              hideLabel: false,
              labelPosition: 'top',
              tags: [
                
              ]
            }
          ],
          width: 6,
          offset: 0,
          push: 0,
          pull: 0
        },
        {
          components: [
            {
              input: true,
              tableView: true,
              inputType: 'text',
              inputMask: '',
              label: 'B',
              key: 'columnsB',
              placeholder: '',
              prefix: '',
              suffix: '',
              multiple: false,
              defaultValue: '',
              protected: false,
              unique: false,
              persistent: true,
              hidden: false,
              clearOnHide: true,
              validate: {
                required: false,
                minLength: '',
                maxLength: '',
                pattern: '',
                custom: '',
                customPrivate: false
              },
              conditional: {
                show: '',
                when: null,
                eq: ''
              },
              type: 'textfield',
              hideLabel: false,
              labelPosition: 'top',
              tags: [
                
              ]
            },
            {
              input: true,
              tableView: true,
              inputType: 'text',
              inputMask: '',
              label: 'D',
              key: 'columnsD',
              placeholder: '',
              prefix: '',
              suffix: '',
              multiple: false,
              defaultValue: '',
              protected: false,
              unique: false,
              persistent: true,
              hidden: false,
              clearOnHide: true,
              validate: {
                required: false,
                minLength: '',
                maxLength: '',
                pattern: '',
                custom: '',
                customPrivate: false
              },
              conditional: {
                show: '',
                when: null,
                eq: ''
              },
              type: 'textfield',
              hideLabel: false,
              labelPosition: 'top',
              tags: [
                
              ]
            },
            {
              clearOnHide: false,
              key: 'columnsPanel',
              input: false,
              title: 'Components',
              theme: 'default',
              tableView: false,
              components: [
                {
                  input: true,
                  tableView: true,
                  inputType: 'text',
                  inputMask: '',
                  label: 'G',
                  key: 'columnsPanelG',
                  placeholder: '',
                  prefix: '',
                  suffix: '',
                  multiple: false,
                  defaultValue: '',
                  protected: false,
                  unique: false,
                  persistent: true,
                  hidden: false,
                  clearOnHide: true,
                  validate: {
                    required: false,
                    minLength: '',
                    maxLength: '',
                    pattern: '',
                    custom: '',
                    customPrivate: false
                  },
                  conditional: {
                    show: '',
                    when: null,
                    eq: ''
                  },
                  type: 'textfield',
                  hideLabel: false,
                  labelPosition: 'top',
                  tags: [
                    
                  ]
                },
                {
                  input: true,
                  tableView: true,
                  inputType: 'text',
                  inputMask: '',
                  label: 'H',
                  key: 'columnsPanelH',
                  placeholder: '',
                  prefix: '',
                  suffix: '',
                  multiple: false,
                  defaultValue: '',
                  protected: false,
                  unique: false,
                  persistent: true,
                  hidden: false,
                  clearOnHide: true,
                  validate: {
                    required: false,
                    minLength: '',
                    maxLength: '',
                    pattern: '',
                    custom: '',
                    customPrivate: false
                  },
                  conditional: {
                    show: '',
                    when: null,
                    eq: ''
                  },
                  type: 'textfield',
                  hideLabel: false,
                  labelPosition: 'top',
                  tags: [
                    
                  ]
                }
              ],
              type: 'panel',
              breadcrumb: 'default',
              hideLabel: false,
              tags: [
                
              ],
              conditional: {
                show: '',
                when: null,
                eq: ''
              }
            }
          ],
          width: 6,
          offset: 0,
          push: 0,
          pull: 0
        }
      ],
      type: 'columns',
      hideLabel: false,
      tags: [
        
      ],
      conditional: {
        show: '',
        when: null,
        eq: ''
      }
    },
    {
      input: true,
      label: 'Submit',
      tableView: false,
      key: 'submit',
      size: 'md',
      leftIcon: '',
      rightIcon: '',
      block: false,
      action: 'submit',
      disableOnInvalid: false,
      theme: 'primary',
      type: 'button',
      hideLabel: false
    }
  ]
}).then(function(builder) {
  builder.on('saveComponent', function(event) {
    console.log('saveComponent', event);
  });

  builder.on('editComponent', function(event) {
    console.log('editComponent', event);
  });
  
  builder.on('updateComponent', function(event) {
    console.log('updateComponent', event);
  });
  
  builder.on('deleteComponent', function(event) {
    console.log('deleteComponent', event);
  });
});
</script>
