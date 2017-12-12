import FormioForm from './formio.form';
import dragula from 'dragula';
import { ColumnsComponent } from './components/columns/Columns';
import { ColumnComponent } from './components/columns/Column';
import Components from './components';
import { FormioComponents } from './components/Components';
import _groupBy from 'lodash/groupBy';
import _sortBy from 'lodash/sortBy';
import _each from 'lodash/each';
import _assign from 'lodash/assign';
import _map from 'lodash/map';

export class FormioFormBuilder extends FormioForm {
  constructor(element, options) {
    super(element, options);
    let self = this;
    this.options.hooks = this.options.hooks || {};
    this.options.hooks.addComponent = function(container, comp) {
      if (!(comp instanceof ColumnComponent)) {
        // Make sure the component position is relative so the buttons align properly.
        comp.getElement().style.position = 'relative';

        // Add the edit buttons to the component.
        comp.prepend(this.ce('div', {
          class: 'component-btn-group'
        }, [
          this.ce('div', {
            class: 'btn btn-xxs btn-danger component-settings-button component-settings-button-remove'
          }, this.ce('span', {class: 'glyphicon glyphicon-remove'})),
          this.ce('div', {
            class: 'btn btn-xxs btn-default component-settings-button component-settings-button-edit'
          }, this.ce('span', {class: 'glyphicon glyphicon-cog'}))
        ]));
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
          class: 'panel-body'
        });

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
            class: 'btn btn-primary btn-xs btn-block formcomponent'
          });
          if (builderInfo.icon) {
            compButton.appendChild(this.ce('i', {
              class: builderInfo.icon,
              style: 'margin-right: 5px;'
            }));
          }
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

    this.dragContainers = [];
    super.build();
    dragula(this.dragContainers).on('drop', (element, target, source, sibling) => {
      console.log(element);
      console.log(target);
      console.log(source);
      console.log(sibling);
    });
  }
}
