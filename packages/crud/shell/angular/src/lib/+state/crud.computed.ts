import { computed } from '@angular/core';
import { SignalStoreFeatureResult, StateSignals } from '@ngrx/signals';

import { IEntity } from '@smartsoft001/domain-core';

import { CrudState } from './crud.store';

// Base computed selectors
export function crudComputedFactory<
  T extends IEntity<string>,
  Input extends SignalStoreFeatureResult & {
    state: CrudState<T>;
  },
>() {
  return (
    store: StateSignals<Input['state']> & Input['props'] & Input['methods'],
  ) => ({
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
  });
}
