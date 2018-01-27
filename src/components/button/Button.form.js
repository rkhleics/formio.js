const BaseEditForm = require('../base/Base.form');
module.exports = function(...extend) {
  return BaseEditForm({
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
                type: 'select',
                key: 'action',
                label: 'Action',
                input: true,
                dataSrc: 'values',
                weight: 110,
                tooltip: 'This is the action to be performed by this button.',
                data: {
                  values: [
                    {label: 'Submit', value: 'submit'},
                    {label: 'Event', value: 'event'},
                    {label: 'Custom', value: 'custom'},
                    {label: 'Reset', value: 'reset'},
                    {label: 'OAuth', value: 'oauth'}
                  ]
                }
              },
              {
                type: 'textfield',
                label: 'Button Event',
                key: 'event',
                input: true,
                weight: 120,
                tooltip: 'The event to fire when the button is clicked.',
                conditional: {
                  json: {'===': [{var: 'data.action'}, 'event']}
                }
              }
            ]
          }
        ]
      }
    ]
  }, ...extend);
};
