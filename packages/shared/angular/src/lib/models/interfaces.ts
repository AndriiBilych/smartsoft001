import {
  ComponentFactory,
  PipeTransform,
  Signal,
  Type,
  WritableSignal,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
} from '@angular/forms';
import { Observable } from 'rxjs';

import { IEntity } from '@smartsoft001/domain-core';
import { IFieldOptions, IModelOptions } from '@smartsoft001/models';

import { InputBaseComponent } from '../components';
import { IAppProvider } from '../providers';
import { IStyle } from './style';

export interface IAppOptions {
  provider: IAppProvider;
  logo?: string;
  menu?: {
    showForAnonymous?: boolean;
    items?: IMenuItem[];
  };
  style?: IStyle;
}

export interface ICardOptions {
  title?: string;
  buttons?: Array<IIconButtonOptions>;
}

export interface IIconButtonOptions {
  icon: string;
  text?: string;
  handler?: () => void;
  component?: any;
  type?: 'default' | 'popover';
  disabled$?: Observable<boolean>;
  number?: number;
}

export type DynamicComponentType =
  | 'form'
  | 'page'
  | 'button'
  | 'details'
  | 'list'
  | 'crud-list-page'
  | 'crud-item-page';
export interface IDynamicComponentData {
  key: DynamicComponentType;
  component: Type<any>;
  data?: any;
}

export interface IFormOptions<T> {
  model: T;
  show: boolean;
  treeLevel?: number;
  control?: AbstractControl;
  mode?: 'create' | 'update' | string;
  loading$?: Observable<boolean>;
  uniqueProvider?: (values: Record<keyof T, any>) => Promise<boolean>;
  possibilities?: {
    [key: string]: WritableSignal<
      { id: any; text: string; checked: boolean }[]
    >;
  };
  inputComponents?: {
    [key: string]: Type<InputBaseComponent<T>>;
  };
  fieldOptions?: IFieldOptions;
  modelOptions?: IModelOptions;
}

export type InputOptions<T> = IInputOptions & IInputFromFieldOptions<T>;

export interface IInputOptions {
  treeLevel: number;
  control: UntypedFormControl | UntypedFormArray;
  possibilities?: WritableSignal<{ id: any; text: string; checked: boolean }[]>;
  component?: Type<InputBaseComponent<any>>;
}

export interface IInputFromFieldOptions<T> {
  model: T;
  fieldKey: string;
  mode?: 'create' | 'update' | string;
}

export interface IDetailsComponentFactories<T> {
  top?: ComponentFactory<any>;
  bottom?: ComponentFactory<any>;
}

export interface IDetailsOptions<T extends IEntity<string>> {
  title?: string;
  cellPipe?: ICellPipe<T>;
  type: any;
  item: Signal<T | undefined>;
  loading?: Signal<boolean>;
  itemHandler?: ((id: string) => void) | null;
  removeHandler?: ((item: T) => void) | null;
  componentFactories?: IDetailsComponentFactories<T>;
}

export interface IMenuItem {
  mode?: 'divider' | 'default';
  route?: string;
  click?: (arg0: IMenuItem) => void;
  caption?: string;
  component?: any;
  icon?: string;
  infos?: Array<{ text: string }>;
}

export interface IButtonOptions {
  type?: 'submit' | 'button';
  expand?: 'block' | 'full' | undefined;
  confirm?: boolean;
  color?: 'primary' | 'light' | string;
  click: () => void;
  loading?: Signal<boolean>;
}

export interface IDetailOptions<T> {
  key: string;
  item?: Signal<T>;
  options: IFieldOptions;
  cellPipe?: ICellPipe<T>;
  loading?: Signal<boolean>;
}

export interface ICellPipe<T> extends PipeTransform {
  transform(
    value: T,
    columnName: string,
    translate?: (val: string) => string,
  ): string;
}

export interface IPageOptions {
  title: string;
  hideHeader?: boolean;
  hideMenuButton?: boolean;
  showBackButton?: boolean;
  endButtons?: Array<IIconButtonOptions>;
  search?: { text: Signal<string>; set: (txt: string) => void };
}

export interface IListProvider<T> {
  getData: (filter: any) => void;
  onChangeMultiSelected?: (list: Array<T>) => void;
  onCleanMultiSelected$?: Observable<void>;
  list: Signal<T[]>;
  loading: Signal<boolean>;
}

export interface IListPaginationOptions {
  mode?: PaginationMode;
  limit: number;
  loadNextPage: () => Promise<boolean>;
  loadPrevPage: () => Promise<boolean>;
  page: Signal<number>;
  totalPages: Signal<number>;
}

export enum PaginationMode {
  infiniteScroll = 'infiniteScroll',
  singlePage = 'singlePage',
}

export enum ListMode {
  mobile = 'mobile',
  desktop = 'desktop',
  masonryGrid = 'masonryGrid',
}

export interface IItemOptionsForPage {
  routingPrefix: string;
  edit: boolean;
}

export interface IItemOptionsForCustom {
  select: (id: string) => void;
  edit: boolean;
}

export type ItemOptions = IItemOptionsForPage | IItemOptionsForCustom;

export interface IListComponentFactories<T> {
  top?: ComponentFactory<any>;
}

export interface IDetailsProvider<T> {
  getData: (id: string) => void;
  clearData: () => void;
  item: Signal<T | undefined>;
  loading: Signal<boolean>;
}

export interface IListOptions<T> {
  provider: IListProvider<T>;
  type: any;
  mode?: ListMode;

  pagination?: IListPaginationOptions;

  cellPipe?: ICellPipe<T>;
  componentFactories?: IListComponentFactories<T>;
  sort?:
    | boolean
    | {
        default?: string;
        defaultDesc?: boolean;
      };

  details?:
    | boolean
    | {
        provider?: IDetailsProvider<T>;
        componentFactories?: IDetailsComponentFactories<T>;
      };

  item?:
    | boolean
    | {
        options?: ItemOptions;
      };

  remove?:
    | boolean
    | {
        provider?: IRemoveProvider<T>;
      };

  select?: 'multi';
}

export interface IRemoveProvider<T> {
  invoke: (id: string) => void;
  check?: (item: T) => boolean;
}

export interface IListInternalOptions<T> extends IListOptions<T> {
  fields?: Array<{ key: string; options: IFieldOptions }>;
}
