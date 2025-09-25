import { computed, Signal } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
} from '@ngrx/signals';

import { IEntity } from '@smartsoft001/domain-core';

import { ICrudCreateManyOptions, ICrudFilter } from '../models';
import { CrudMethodsFactory } from './crud.methods';

export interface CrudState<T> {
  selected?: T;
  multiSelected?: Array<T>;
  list?: T[];
  totalCount?: number;
  filter?: ICrudFilter;
  links?: any;
  loaded: boolean; // has the Auth list been loaded
  error?: string | null; // last none error (if any)
}

export const initialState: CrudState<any> = {
  loaded: false,
};

interface CrudStore<T> extends CrudState<T> {
  // State properties are inherited from CrudState

  // Computed properties
  getError: Signal<string | null | undefined>;
  getLoaded: Signal<boolean>;
  getSelected: Signal<T | undefined>;
  getMultiSelected: Signal<Array<T> | undefined>;
  getList: Signal<Array<T> | undefined>;
  getTotalCount: Signal<number | undefined>;
  getLinks: Signal<any>;
  getFilter: Signal<ICrudFilter | undefined>;

  // Methods
  create(item: T): void;
  createMany(data: { items: T[]; options: ICrudCreateManyOptions }): void;
  export(filter: ICrudFilter, format: any): void;
  read(filter: ICrudFilter): void;
  clear(): void;
  select(id: string): void;
  multiSelect(items: Array<T>): void;
  unselect(): void;
  update(item: Partial<T> & { id: string }): void;
  updatePartial(item: Partial<T> & { id: string }): void;
  updatePartialMany(items: Array<Partial<T> & { id: string }>): void;
  delete(id: string): void;
}

// Base computed selectors
export function withCrudComputed() {
  return withComputed((store: any) => ({
    getError: computed(() => (store.error ? store.error() : null)),
    getLoaded: computed(() => store.loaded()),
    getSelected: computed(() =>
      store.selected ? store.selected() : undefined,
    ),
    getMultiSelected: computed(() =>
      store.multiSelected ? store.multiSelected() : undefined,
    ),
    getList: computed(() => (store.list ? store.list() : undefined)),
    getTotalCount: computed(() =>
      store.totalCount ? store.totalCount() : undefined,
    ),
    getLinks: computed(() => (store.links ? store.links() : undefined)),
    getFilter: computed(() => (store.filter ? store.filter() : undefined)),
  }));
}

// Base CRUD methods
export function withCrudMethods<T extends IEntity<string>>() {
  return withMethods(CrudMethodsFactory<T>());
}

export function createCrudFeatureStore<
  T extends IEntity<string>,
>(): CrudStore<T> {
  return signalStore(
    { providedIn: 'root' },
    withState<CrudState<T>>(initialState),
    withCrudComputed(),
    withCrudMethods<T>(),
  ) as unknown as CrudStore<T>;
}

export type CrudFeatureStore<T extends IEntity<string>> = ReturnType<
  typeof createCrudFeatureStore<T>
>;
