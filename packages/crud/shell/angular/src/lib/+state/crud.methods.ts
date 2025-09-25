import { inject } from '@angular/core';
import {
  patchState,
  SignalStoreFeatureResult,
  StateSignals,
  WritableStateSource,
} from '@ngrx/signals';

import { PaginationMode } from '@smartsoft001/angular';
import { IEntity } from '@smartsoft001/domain-core';

import { ICrudCreateManyOptions, ICrudFilter } from '../models';
import { CrudState, initialState } from './crud.store';
import { CrudService } from '../services/crud/crud.service';

type CrudMethods<T> = {
  create: (item: T) => Promise<void>;
  createSuccess: () => Promise<void>;
  createMany: (data: {
    items: T[];
    options: ICrudCreateManyOptions;
  }) => Promise<void>;
  createManySuccess: () => Promise<void>;
  export: (filter: ICrudFilter, format: any) => Promise<void>;
  exportSuccess: () => void;
  read: (filter?: ICrudFilter) => Promise<void>;
  readSuccess: (data: {
    list: T[];
    filter?: ICrudFilter;
    totalCount?: number;
    links?: any;
  }) => void;
  clear: () => void;
  select: (id: string) => Promise<void>;
  selectSuccess: (selected: T) => void;
  unselect: () => void;
  multiSelect: (items: Array<T>) => void;
  update: (item: Partial<T> & { id: string }) => Promise<void>;
  updateSuccess: (id: string) => Promise<void>;
  updatePartial: (item: Partial<T> & { id: string }) => Promise<void>;
  updatePartialSuccess: (id: string) => Promise<void>;
  updatePartialMany: (
    items: Array<Partial<T> & { id: string }>,
  ) => Promise<void>;
  updatePartialManySuccess: () => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteSuccess: () => Promise<void>;
  defaultFailure: (error: string) => void;
};

export function crudMethodsFactory<
  T extends IEntity<string>,
  Input extends SignalStoreFeatureResult & {
    state: CrudState<T>;
  },
>() {
  return (
    store: StateSignals<Input['state']> &
      Input['props'] &
      Input['methods'] &
      WritableStateSource<Input['state']>,
    crudService = inject(CrudService<T>),
  ) => {
    // Cast store to the WritableStateSource with TodosState for patchState operations (necessary work-around caused by very complex withMethods function's store parameter)
    const writableStore = store as WritableStateSource<CrudState<T>>;

    const methods: CrudMethods<T> = {
      async create(item: T) {
        patchState(writableStore, {
          loaded: false,
          error: null,
        });

        try {
          await crudService.create(item);
          await this.createSuccess();
        } catch (error: any) {
          methods.defaultFailure(error);
        }
      },

      async createSuccess() {
        patchState(writableStore, {
          loaded: true,
          error: null,
        });

        await methods.read(
          store.filter ? { ...store.filter, offset: 0 } : undefined,
        );
      },

      async createMany(data: { items: T[]; options: ICrudCreateManyOptions }) {
        patchState(writableStore, {
          loaded: false,
          error: null,
        });

        try {
          await crudService.createMany(data.items, data.options);
          await methods.createManySuccess();
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      async createManySuccess() {
        patchState(writableStore, {
          loaded: true,
          error: null,
        });

        methods.read(store.filter ? { ...store.filter, offset: 0 } : undefined);
      },

      async export(filter: ICrudFilter, format: any) {
        patchState(writableStore, {
          loaded: false,
        });

        try {
          await crudService.exportList(filter, format);
          methods.exportSuccess();
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      exportSuccess() {
        patchState(writableStore, {
          loaded: true,
        });
      },

      async read(filter?: ICrudFilter) {
        patchState(writableStore, {
          loaded: false,
          filter,
          error: null,
          totalCount: undefined,
          links: null,
        });

        try {
          const result = await crudService.getList<T>(filter);
          methods.readSuccess({
            list: result.data,
            filter,
            totalCount: result.totalCount,
            links: result.links,
          });
        } catch (error: any) {
          methods.defaultFailure(error);
        }
      },

      readSuccess<T>(data: {
        list: T[];
        filter?: ICrudFilter;
        totalCount?: number;
        links?: any;
      }) {
        let list = [];

        if (
          data.filter?.offset &&
          store.list?.() &&
          data.filter.paginationMode !== PaginationMode.singlePage
        ) {
          list = [...store.list(), ...data.list];
        } else {
          list = data.list;
        }

        patchState(writableStore, {
          loaded: true,
          list,
          totalCount: data.totalCount,
          links: data.links,
          error: null,
        });
      },

      clear() {
        patchState(writableStore, { ...initialState });
      },

      async select(id: string) {
        patchState(writableStore, {
          loaded: false,
          selected: undefined,
          error: null,
        });

        try {
          const result = await crudService.getById(id);
          methods.selectSuccess(result);
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      selectSuccess(selected: T) {
        patchState(store, {
          loaded: true,
          selected,
          error: null,
        });
      },

      unselect() {
        patchState(writableStore, {
          loaded: true,
          selected: undefined,
          error: null,
        });
      },

      multiSelect(items: Array<T>) {
        patchState(writableStore, {
          multiSelected: [...items],
        });
      },

      async update(item: Partial<T> & { id: string }) {
        patchState(writableStore, {
          loaded: false,
          error: null,
        });

        try {
          await crudService.updatePartial(item);
          await methods.updateSuccess(item.id);
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      async updateSuccess(id: string) {
        await methods.read({ ...store.filter, offset: 0 });
        await methods.select(id);
      },

      async updatePartial(item: Partial<T> & { id: string }) {
        patchState(writableStore, {
          loaded: false,
          error: null,
        });

        try {
          await crudService.updatePartial(item);
          await methods.updatePartialSuccess(item.id);
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      async updatePartialSuccess(id: string) {
        await methods.read({ ...store.filter, offset: 0 });
        await methods.select(id);
      },

      async updatePartialMany(items: Array<Partial<T> & { id: string }>) {
        patchState(writableStore, {
          loaded: false,
          error: null,
        });

        try {
          await crudService.updatePartialMany(items);
          await methods.updatePartialManySuccess();
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      async updatePartialManySuccess() {
        await methods.read({ ...store.filter, offset: 0 });
      },

      async delete(id: string) {
        patchState(writableStore, {
          loaded: false,
          error: null,
        });

        try {
          await crudService.delete(id);
          await methods.deleteSuccess();
        } catch (e: any) {
          methods.defaultFailure(e);
        }
      },

      async deleteSuccess() {
        await methods.read({ ...store.filter, offset: 0 });
      },

      defaultFailure(error: string) {
        patchState(writableStore, {
          loaded: true,
          error,
        });
      },
    };

    return methods;
  };
}
