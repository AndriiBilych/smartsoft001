import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DynamicIoDirective } from 'ng-dynamic-component';

import {
  ButtonComponent,
  FormComponent,
  IButtonOptions,
  MenuService,
} from '@smartsoft001/angular';
import { IEntity } from '@smartsoft001/domain-core';
import {
  getModelFieldsWithOptions,
  IFieldEditMetadata,
} from '@smartsoft001/models';

import { CrudFacade } from '../../+state/crud.facade';
import { CrudFullConfig } from '../../crud.config';
import { FormOptionsPipe } from '../../pipes';

@Component({
  selector: 'smart-crud-multiselect',
  templateUrl: './multiselect.component.html',
  imports: [
    TranslatePipe,
    NgComponentOutlet,
    DynamicIoDirective,
    FormOptionsPipe,
    FormComponent,
    ButtonComponent,
  ],
  styleUrls: ['./multiselect.component.scss'],
})
export class MultiselectComponent<T extends IEntity<string>> {
  private facade = inject(CrudFacade<T>);
  public config = inject(CrudFullConfig<T>);
  private menuService = inject(MenuService);

  private _list!: Array<T>;
  private _changes!: Partial<T>;

  item!: T;
  valid!: boolean;
  buttonOptions: IButtonOptions = {
    click: async () => {
      const result = this._list.map((item) => {
        return {
          ...this._changes,
          id: item.id,
        };
      });

      this.facade.updatePartialMany(result);
      await this.menuService.closeEnd();
    },
    confirm: true,
  };
  lock!: boolean;
  showForm = false;

  list!: Signal<T[]>;

  constructor() {
    this.list = computed(() => {
      const list = this.facade.multiSelected() || [];
      this.lock = true;
      const model = new this.config.type();

      const fieldsWithOptions = getModelFieldsWithOptions(model).filter(
        (f) => (f.options.update as IFieldEditMetadata)?.multi,
      );

      this.showForm = !!fieldsWithOptions.length;

      fieldsWithOptions.forEach(({ key }) => {
        const uniques = _.uniq(list.map((i: { [key: string]: any }) => i[key]));

        if (uniques.length === 1) {
          model[key] = uniques[0];
        }
      });

      this.item = model;

      return list;
    });
  }

  async onClose(): Promise<void> {
    await this.menuService.closeEnd();
  }

  onPartialChange(changes: Partial<T>, list: Array<T>) {
    this.lock = false;
    this._list = list;
    this._changes = changes;
  }

  onValidChange(valid: boolean) {
    this.valid = valid;
  }
}
