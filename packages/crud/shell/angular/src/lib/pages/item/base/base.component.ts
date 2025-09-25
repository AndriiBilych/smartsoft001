import {
  Directive,
  inject,
  input,
  output,
  Signal,
  viewChild,
  viewChildren,
  ViewContainerRef,
} from '@angular/core';

import {
  BaseComponent,
  DynamicComponentType,
  FormComponent,
  IDetailsOptions,
} from '@smartsoft001/angular';
import { IEntity } from '@smartsoft001/domain-core';

import { CrudFacade } from '../../../+state/crud.facade';
import { CrudFullConfig } from '../../../crud.config';

@Directive()
export abstract class CrudItemPageBaseComponent<
  T extends IEntity<string>,
> extends BaseComponent {
  public config = inject(CrudFullConfig<T>);
  public facade = inject(CrudFacade<T>);

  static smartType: DynamicComponentType = 'crud-item-page';

  selected: Signal<T | undefined>;

  contentTpl = viewChild<ViewContainerRef>('contentTpl');

  formComponents = viewChildren(FormComponent);

  detailsOptions = input<IDetailsOptions<T>>();

  mode = input<string>();

  uniqueProvider = input<(values: Record<keyof T, any>) => Promise<boolean>>();

  onPartialChange = output<Partial<T>>();

  onChange = output<T>();

  onValidChange = output<boolean>();

  constructor() {
    super();
    this.selected = this.facade.selected;
  }
}
