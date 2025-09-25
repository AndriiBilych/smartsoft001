import { computed, inject, Injectable, Signal } from '@angular/core';

import { IEntity } from '@smartsoft001/domain-core';

import { CrudConfig } from '../crud.config';
import { ICrudCreateManyOptions, ICrudFilter } from '../models';
import { crudFeatureStoreFactory } from './crud.store';

@Injectable()
export class CrudFacade<T extends IEntity<string>> {
  private store = inject(crudFeatureStoreFactory<T>());

  loaded: Signal<boolean> = this.store.getLoaded;
  loading: Signal<boolean> = computed(() => !this.store.getLoaded());
  selected: Signal<T | undefined> = this.store.getSelected;
  multiSelected: Signal<T[] | undefined> = this.store.getMultiSelected;
  list: Signal<T[] | undefined> = this.store.getList;
  filter: Signal<ICrudFilter | undefined> = this.store.getFilter;
  totalCount: Signal<number | undefined> = this.store.getTotalCount;
  links: Signal<any> = this.store.getLinks;
  error: Signal<any> = this.store.getError;

  constructor(private config: CrudConfig<T>) {}

  create(item: T): void {
    this.store.create(item);
  }

  createMany(items: Array<T>, options: ICrudCreateManyOptions): void {
    this.store.createMany({ items, options });
  }

  read(filter: ICrudFilter | null = null): void {
    let baseQuery: any[] = [];
    if (this.config.baseQuery) {
      baseQuery = this.config.baseQuery;
    }

    const fullFilter = {
      ...(filter ? filter : {}),
      query: filter && filter.query ? filter.query : baseQuery,
    };

    this.store.read(fullFilter);
  }

  clear(): void {
    this.store.clear();
  }

  select(id: string): void {
    this.store.select(id);
  }

  unselect(): void {
    this.store.unselect();
  }

  multiSelect(items: Array<T>): void {
    this.store.multiSelect(items);
  }

  update(item: T): void {
    this.store.update(item);
  }

  export(
    filter: ICrudFilter | null = null,
    format: string | null = null,
  ): void {
    this.store.export(filter || ({} as ICrudFilter), format);
  }

  updatePartial(item: Partial<T> & { id: string }): void {
    this.store.updatePartial(item);
  }

  updatePartialMany(items: (Partial<T> & { id: string })[]) {
    this.store.updatePartialMany(items);
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}
