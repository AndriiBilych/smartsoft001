import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  SignalStoreFeatureResult,
} from '@ngrx/signals';

import { IEntity } from '@smartsoft001/domain-core';

import { ICrudFilter } from '../models';
import { crudComputedFactory } from './crud.computed';
import { crudMethodsFactory } from './crud.methods';

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

export function crudFeatureStoreFactory<T extends IEntity<string>>() {
  return signalStore(
    { providedIn: 'root' },
    withState<CrudState<T>>(initialState),
    withComputed(
      crudComputedFactory<
        T,
        SignalStoreFeatureResult & { state: CrudState<T> }
      >(),
    ),
    withMethods(
      crudMethodsFactory<
        T,
        SignalStoreFeatureResult & { state: CrudState<T> }
      >(),
    ),
  );
}
