import FormioForm from './formio.form';
import dragula from 'dragula';
import { ColumnsComponent } from './components/columns/Columns';
import { ColumnComponent } from './components/columns/Column';
import Components from './components';
import { FormioComponents } from './components/Components';
import _groupBy from 'lodash/groupBy';
import _sortBy from 'lodash/sortBy';
import _each from 'lodash/each';
import _merge from 'lodash/merge';
import _assign from 'lodash/assign';
import _map from 'lodash/map';

Components.textfield.editForm = require('./components/textfield/TextField.form');

export class FormioFormBuilder extends FormioForm {
  constructor(element, options) {
    super(element, options);
    let self = this;
    this.options.hooks = this.options.hooks || {};
    this.options.hooks.addComponent = function(container, comp) {
      if (!(comp instanceof ColumnComponent)) {
        // Make sure the component position is relative so the buttons align properly.
        comp.getElement().style.position = 'relative';

        let removeButton = this.ce('div', {
          class: 'btn btn-xxs btn-danger component-settings-button component-settings-button-remove'
        }, this.ce('span', {class: 'glyphicon glyphicon-remove'}));
        this.addEventListener(removeButton, 'click', () => self.deleteComponent(comp));

        let editButton = this.ce('div', {
          class: 'btn btn-xxs btn-default component-settings-button component-settings-button-edit'
        }, this.ce('span', {class: 'glyphicon glyphicon-cog'}));
        this.addEventListener(editButton, 'click', () => self.editComponent(comp));

        // Add the edit buttons to the component.
        comp.prepend(this.ce('div', {
          class: 'component-btn-group'
        }, [removeButton, editButton]));
      }

      if (this instanceof ColumnsComponent) {
        return container;
      }

      if (!this.dragContainer) {
        this.dragContainer = this.ce('div', {
          class: 'drag-container'
        });

        container.appendChild(this.dragContainer);
        self.dragContainers.push(this.dragContainer);
      }
      return this.dragContainer;
    };
  }

  deleteComponent(component) {
    if (!component.parent) {
      return;
    }
    let remove = true;
    if (component.type === 'components' && component.getComponents().length > 0) {
      remove = window.confirm(this.t('Removing this component will also remove all of its children. Are you sure you want to do this?'));
    }
    if (remove) {
      component.parent.removeComponentById(component.id);
    }
  }

  editComponent(component) {
    let componentClass = Components[component.component.type];
    let dialog = this.createModal(component.name);
    let formioForm = this.ce('div');
    let preview = this.ce('div', {
      class: 'component-preview'
    });
    let componentInfo = componentClass ? componentClass.builderInfo : {};

    let saveButton = this.ce('button', {
      class: 'btn btn-success',
      style: 'margin-right: 10px;'
    }, this.t('Save'));

    let cancelButton = this.ce('button', {
      class: 'btn btn-default',
      style: 'margin-right: 10px;'
    }, this.t('Cancel'));

    let removeButton = this.ce('button', {
      class: 'btn btn-danger'
    }, this.t('Remove'));

    let componentEdit = this.ce('div', {

    }, [
      this.ce('div', {
        class: 'row'
      }, [
        this.ce('div', {
          class: 'col col-sm-6'
        }, this.ce('p', {
          class: 'lead'
        }, componentInfo.title + ' Component')),
        this.ce('div', {
          class: 'col col-sm-6'
        }, [
          this.ce('div', {
            class: 'pull-right',
            style: 'margin-right: 20px; margin-top: 10px'
          }, this.ce('a', {
            href: componentInfo.documentation || '#',
            target: '_blank'
          }, this.ce('i', {
            class: 'glyphicon glyphicon-new-window'
          }, ' ' + this.t('Help'))))
        ])
      ]),
      this.ce('div', {
        class: 'row'
      }, [
        this.ce('div', {
          class: 'col col-sm-6'
        }, formioForm),
        this.ce('div', {
          class: 'col col-sm-6'
        }, [
          this.ce('div', {
            class: 'panel panel-default preview-panel'
          }, [
            this.ce('div', {
              class: 'panel-heading'
            }, this.ce('h3', {
              class: 'panel-title'
            }, this.t('Preview'))),
            this.ce('div', {
              class: 'panel-body'
            }, preview)
          ]),
          this.ce('div', {
            style: 'margin-top: 10px;'
          }, [
            saveButton,
            cancelButton,
            removeButton
          ])
        ])
      ])
    ]);

    let updatePreview = function(comp) {
      preview.innerHTML = '';
      preview.appendChild(Components.create(comp).getElement())
    };

    // Update the preview with this component.
    updatePreview(component.component);

    // Append the settings page to the dialog body.
    dialog.body.appendChild(componentEdit);
    let editForm = new FormioForm(formioForm);

    // Set the form to the edit form.
    editForm.form = Components[component.component.type].editForm();

    //  Set the submission of this form to the component settings.
    editForm.submission = {data: component.component};

    // Register for when the edit form changes.
    editForm.on('change', (event) => {
      if (event.changed) {
        updatePreview(event.data);
      }
    });

    this.addEventListener(cancelButton, 'click', (event) => {
      event.preventDefault();
      dialog.close();
    });

    this.addEventListener(saveButton, 'click', (event) => {
      event.preventDefault();
      console.log(editForm.submission);
    });

    this.addEventListener(dialog, 'close', () => {
      editForm.destroy();
    });
  }

  destroy() {
    super.destroy();
    if (this.dragula) {
      this.dragula.destroy();
    }
  }

  buildSidebar() {
    // Get all of the components builder info grouped and sorted.
    let components = _map(_assign(Components, FormioComponents.customComponents), (component, key) => {
      let builderInfo = component.builderInfo;
      if (!builderInfo) {
        return null;
      }

      builderInfo.key = key;
      return builderInfo;
    });

    components = _sortBy(components, 'weight');
    components = _groupBy(components, 'group');
    let sideBarElement = this.ce('div', {
      class: 'panel-group'
    });

    this.groupPanels = [];

    // Iterate through each group of components.
    let firstGroup = true;
    _each(components, (groupComponents, group) => {
      let groupInfo = FormioComponents.groupInfo[group];
      if (groupInfo) {
        let groupAnchor = this.ce('a', {
          href: '#group-' + group
        }, this.text(groupInfo.title));
        this.addEventListener(groupAnchor, 'click', (event) => {
          event.preventDefault();
          _each(this.groupPanels, (groupPanel) => {
            this.removeClass(groupPanel, 'in');
            if (groupPanel.getAttribute('id') === event.target.getAttribute('href').substr(1)) {
              this.addClass(groupPanel, 'in');
            }
          });
        });

        let groupPanel = this.ce('div', {
          class: 'panel panel-default form-builder-panel'
        }, [
          this.ce('div', {
            class: 'panel-heading'
          }, [
            this.ce('h4', {
              class: 'panel-title'
            }, groupAnchor)
          ])
        ]);
        let groupBody = this.ce('div', {
          class: 'panel-body no-drop'
        });

        // Add this group body to the drag containers.
        this.dragContainers.push(groupBody);

        let groupBodyClass = 'panel-collapse collapse';
        if (firstGroup) {
          groupBodyClass += ' in';
          firstGroup = false;
        }
        let groupBodyWrapper = this.ce('div', {
          class: groupBodyClass,
          id: 'group-' + group
        }, groupBody);

        this.groupPanels.push(groupBodyWrapper);

        _each(groupComponents, (builderInfo) => {
          let compButton = this.ce('span', {
            id: 'builder-' + builderInfo.key,
            class: 'btn btn-primary btn-xs btn-block formcomponent drag-copy'
          });
          if (builderInfo.icon) {
            compButton.appendChild(this.ce('i', {
              class: builderInfo.icon,
              style: 'margin-right: 5px;'
            }));
          }
          console.log(builderInfo);
          compButton.builderInfo = builderInfo;
          compButton.appendChild(this.text(builderInfo.title));
          groupBody.appendChild(compButton);
        });

        groupPanel.appendChild(groupBodyWrapper);
        sideBarElement.appendChild(groupPanel);
      }
    });

    return sideBarElement;
  }

  build() {
    this.dragContainers = [];
    this.builderElement = this.element;
    this.builderElement.setAttribute('class', 'row formbuilder');

    this.builderSidebar = document.createElement('div');
    this.builderSidebar.setAttribute('class', 'col-xs-4 col-sm-3 col-md-2 formcomponents');
    this.builderElement.appendChild(this.builderSidebar);

    this.formBuilderElement = document.createElement('div');
    this.formBuilderElement.setAttribute('class', 'col-xs-8 col-sm-9 col-md-10 formarea');
    this.element = this.formBuilderElement;

    this.builderElement.appendChild(this.formBuilderElement);
    this.sideBarElement = this.buildSidebar();
    this.builderSidebar.appendChild(this.sideBarElement);

    super.build();
    this.dragula = dragula(this.dragContainers, {
      copy: function(el, source) {
        return el.classList.contains('drag-copy');
      },
      accepts: function(el, target) {
        return !target.classList.contains('no-drop');
      }
    }).on('drop', (element, target, source, sibling) => {
      let builderElement = source.querySelector('#' + element.id);
      if (
        builderElement &&
        builderElement.builderInfo &&
        builderElement.builderInfo.schema
      ) {

        // Walk up the parent chain until we find the container component.
        let containerComponent = element;
        do { containerComponent = containerComponent.parentNode } while (containerComponent && !containerComponent.component);
        if (containerComponent && containerComponent.component) {
          containerComponent.component.addComponent(builderElement.builderInfo.schema, null, containerComponent.component.data, sibling);
        }

        // Remove the element.
        target.removeChild(element);
      }
    });
  }
}
