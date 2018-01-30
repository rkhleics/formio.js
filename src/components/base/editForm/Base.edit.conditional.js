export let BaseEditConditional = [
  {
    type: 'panel',
    title: 'Simple',
    key: 'simple-conditional',
    theme: 'default',
    components: [
      {
        type: 'select',
        input: true,
        label: 'This component should Display:',
        key: 'conditional.show',
        dataSrc: 'values',
        data: {
          values: [
            {label: 'True', value: true},
            {label: 'False', value: false}
          ]
        }
      },
      {
        type: 'select',
        input: true,
        label: 'When the form component:',
        key: 'conditional.when',
        dataSrc: 'custom',
        data: {
          custom: `
            utils.eachComponent(data.__form.components, function(component, path) {
              if (component.key !== data.key) {
                values.push({
                  label: component.label || component.key,
                  value: path
                });
              }
            });
          `
        }
      },
      {
        type: 'textfield',
        input: true,
        label: 'Has the value:',
        key: 'conditional.eq'
      }
    ]
  }
];
