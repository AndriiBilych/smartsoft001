import { Location, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import {
  CreateDynamicComponent,
  DetailsService,
  DynamicComponentLoader,
  DynamicContentDirective,
  ICellPipe,
  IDetailsOptions,
  IIconButtonOptions,
  IPageOptions,
  PageComponent,
  StyleService,
  ToastService,
} from '@smartsoft001/angular';
import { IEntity } from '@smartsoft001/domain-core';
import { getModelOptions } from '@smartsoft001/models';
import { SpecificationService } from '@smartsoft001/utils';

import { CrudFacade } from '../../+state/crud.facade';
import { CrudFullConfig } from '../../crud.config';
import { ICrudFilter } from '../../models';
import { CrudItemPageBaseComponent } from './base/base.component';
import { ItemStandardComponent } from './standard/standard.component';
import { CrudService } from '../../services/crud/crud.service';
import { PageService } from '../../services/page/page.service';

@Component({
  selector: 'smart-crud-item-page',
  imports: [PageComponent, ItemStandardComponent, NgTemplateOutlet],
  template: `
    <smart-page [options]="pageOptions()">
      <div #topTpl class="text-xl py-2.5 separator"></div>
      @if (template() === 'default') {
        <smart-crud-item-standard-page
          [detailsOptions]="detailsOptions()"
          [mode]="mode"
          [uniqueProvider]="uniqueProvider()"
          (onPartialChange)="onPartialChange($event)"
          (onChange)="onChange($event)"
          (onValidChange)="onValidChange($event)"
        >
          <ng-container [ngTemplateOutlet]="contentTpl"></ng-container>
        </smart-crud-item-standard-page>
      }
      <ng-template #contentTpl>
        <ng-content></ng-content>
      </ng-template>
      <div class="dynamic-content"></div>
      <div #bottomTpl class="text-xl py-2.5 separator"></div>
    </smart-page>
  `,
})
export class ItemComponent<T extends IEntity<string>>
  extends CreateDynamicComponent<CrudItemPageBaseComponent<any>>(
    'crud-item-page',
  )
  implements OnInit, OnDestroy
{
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private facade = inject(CrudFacade<T>);
  private service = inject(CrudService<T>);
  private dynamicComponentLoader = inject(DynamicComponentLoader<T>);
  private translateService = inject(TranslateService);
  public config = inject(CrudFullConfig<T>);
  private location = inject(Location);
  private cd = inject(ChangeDetectorRef);
  private styleService = inject(StyleService);
  private elementRef = inject(ElementRef);
  private toastService = inject(ToastService);
  private pageService = inject(PageService<T>);
  private detailsService = inject(DetailsService);

  private _mode!: WritableSignal<string>;

  pageOptions: WritableSignal<IPageOptions> = signal({
    title: '',
    showBackButton: true,
    hideMenuButton: true,
  });
  detailsOptions!: WritableSignal<IDetailsOptions<T>>;
  id!: string;
  formValue!: T;
  formValid = false;
  item: T | undefined;
  formPartialValue!: Partial<T>;
  uniqueProvider!: WritableSignal<
    (values: Record<keyof T, any>) => Promise<boolean>
  >;

  set mode(val: string) {
    this._mode = signal(val);
    this.refreshDynamicInstance();
  }
  get mode(): string {
    return this._mode();
  }

  selected: Signal<T | undefined>;

  standardComponents = viewChildren(ItemStandardComponent);
  // @ViewChild(IonContent, { static: true }) content: IonContent; //TODO: rewrite when rewriting ionic

  override contentTpl = viewChild<TemplateRef<any>>('contentTpl');

  topTpl = viewChild<ViewContainerRef>('topTpl');

  bottomTpl = viewChild<ViewContainerRef>('bottomTpl');

  override dynamicContents = viewChildren<DynamicContentDirective>(
    DynamicContentDirective,
  );

  subscription = new Subscription();

  constructor() {
    super();

    this.selected = this.facade.selected;
  }

  override refreshProperties() {
    this.baseComponentRef.setInput('detailsOptions', this.detailsOptions());
    this.baseComponentRef.setInput('mode', this.mode);
    this.baseComponentRef.setInput('uniqueProvider', this.uniqueProvider());
    this.subscription.add(
      this.baseInstance.onPartialChange.subscribe((val) =>
        this.onPartialChange(val),
      ),
    );
    this.subscription.add(
      this.baseInstance.onChange.subscribe((val) => this.onChange(val)),
    );
    this.subscription.add(
      this.baseInstance.onValidChange.subscribe((val) =>
        this.onValidChange(val),
      ),
    );
  }

  async ngOnInit() {
    this.detailsService.init();
    this.styleService.init(this.elementRef);

    this.pageService.checkPermissions();

    if (this.router.routerState.snapshot.url.split('?')[0].endsWith('/add')) {
      this.mode = 'create';
      await this.generateComponents('add');
    } else {
      this.mode = this.config.details ? 'details' : 'update';

      if (this.mode === 'update') {
        await this.generateComponents('edit');
      }

      this.activeRoute.params
        .pipe(this.takeUntilDestroy)
        .subscribe(({ id }) => {
          this.facade.select(id);
          this.id = id;
        });

      this.activeRoute.queryParams
        .pipe(this.takeUntilDestroy)
        .subscribe(({ edit }) => {
          if (edit) {
            this.mode = 'update';
            this.generateComponents('edit');
          }
        });
    }

    this.uniqueProvider.set(async (values) => {
      const filter: ICrudFilter = {
        query: [],
      };

      Object.keys(values).forEach((key) => {
        filter.query!.push({
          key: key,
          value: (values as any)[key],
          type: '=',
        });
      });

      if (this.id) {
        filter.query!.push({
          key: 'id',
          value: this.id,
          type: '!=',
        });
      }
      const { totalCount } = await this.service.getList(filter);

      return !totalCount;
    });

    if (this.config.details) {
      const compiledComponents: {
        component: any;
        factory: ComponentFactory<any>;
      }[] = await this.dynamicComponentLoader.getComponentsWithFactories({
        components: [
          ...(this.config.details &&
          (this.config.details as any)['components'] &&
          (this.config.details as any)['components'].top
            ? [(this.config.details as any)['components'].top]
            : []),
          ...(this.config.details &&
          (this.config.details as any)['components'] &&
          (this.config.details as any)['components'].bottom
            ? [(this.config.details as any)['components'].bottom]
            : []),
        ],
      });

      this.detailsOptions.set({
        type: this.config.type,
        item: this.facade.selected,
        cellPipe: this.config.details
          ? (this.config.details as { cellPipe?: ICellPipe<T> }).cellPipe
          : undefined,
        componentFactories: {
          top:
            this.config.details &&
            (this.config.details as any)['components'] &&
            (this.config.details as any)['components'].top
              ? compiledComponents.find(
                  (cc) =>
                    cc.component ===
                    (this.config.details as any)['components'].top,
                )?.factory
              : undefined,
          bottom:
            this.config.details &&
            (this.config.details as any)['components'] &&
            (this.config.details as any)['components'].bottom
              ? compiledComponents.find(
                  (cc) =>
                    cc.component ===
                    (this.config.details as any)['components'].bottom,
                )?.factory
              : undefined,
        },
      });
    }

    this.initPageOptions();

    effect(() => {
      this.item = this.facade.selected();
      this.initPageOptions();
      this.cd.detectChanges();
    });

    this.refreshDynamicInstance();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();

    this.subscription.unsubscribe();
  }

  private async generateComponents(mode: 'add' | 'edit') {
    const compiledComponents =
      await this.dynamicComponentLoader.getComponentsWithFactories({
        components: [
          ...(this.config[mode] &&
          (this.config[mode] as any)['components'] &&
          (this.config[mode] as any)['components'].top
            ? [(this.config[mode] as any)['components'].top]
            : []),
          ...(this.config[mode] &&
          (this.config[mode] as any)['components'] &&
          (this.config[mode] as any)['components'].bottom
            ? [(this.config[mode] as any)['components'].bottom]
            : []),
        ],
      });

    const topComponentFactory = compiledComponents.find(
      (cc) => cc.component === (this.config[mode] as any)['components']?.top,
    )?.factory;

    const bottomComponentFactory = compiledComponents.find(
      (cc) => cc.component === (this.config[mode] as any)['components']?.bottom,
    )?.factory;

    if (!this.topTpl()?.get(0) && topComponentFactory) {
      this.topTpl()?.createComponent(topComponentFactory);
    }

    if (!this.bottomTpl()?.get(0) && bottomComponentFactory) {
      this.bottomTpl()?.createComponent(bottomComponentFactory);
    }
  }

  onPartialChange(val: Partial<T>) {
    this.formPartialValue = val;
  }

  onChange(val: T) {
    this.formValue = val;
  }

  onValidChange(val: boolean) {
    this.formValid = val;
  }

  private initPageOptions(): void {
    this.pageOptions.set({
      ...this.pageOptions(),
      title: this.getTitle() || '',
      endButtons: this.getButtons(),
    });
  }

  private getButtons(): Array<IIconButtonOptions> | undefined {
    const options = getModelOptions(this.config.type);

    switch (this.mode) {
      case 'create':
        return [
          {
            icon: 'add',
            text: 'add',
            handler: () => {
              if (this.checkFirstInvalid()) {
                return;
              }

              this.facade.create(this.formValue);
              this.location.back();
            },
          },
        ];
      case 'update':
        return [
          ...(this.config.details
            ? [
                {
                  icon: 'close',
                  text: 'cancel',
                  handler: () => {
                    this.mode = 'details';
                    this.initPageOptions();
                    this.topTpl()?.clear();
                    this.bottomTpl()?.clear();
                  },
                  disabled$: new BehaviorSubject(false),
                },
              ]
            : []),
          {
            icon: 'save',
            text: 'save',
            handler: () => {
              if (this.checkFirstInvalid()) {
                return;
              }

              this.formPartialValue.id = this.id;
              this.facade.updatePartial(this.formPartialValue as any);

              if (this.config.details) {
                this.mode = 'details';
                this.initPageOptions();
              } else {
                this.location.back();
              }
            },
          },
        ];
      case 'details':
        return this.config.edit &&
          (!options?.update?.enabled ||
            SpecificationService.valid(this.item, options?.update?.enabled))
          ? [
              {
                icon: 'create',
                text: 'edit',
                handler: () => {
                  this.mode = 'update';
                  this.generateComponents('edit');
                  this.initPageOptions();
                },
                disabled$: new BehaviorSubject(false),
              },
            ]
          : [];
      default:
        return undefined;
    }
  }

  private getTitle(): string | undefined {
    const options = getModelOptions(this.config.type);

    const prefix =
      options.titleKey && this.item
        ? this.removeParagraph((this.item as any)[options.titleKey]) + ' - '
        : '';

    switch (this.mode) {
      case 'create':
        return 'add';
      case 'update':
        return prefix + this.translateService.instant('change');
      case 'details':
        return prefix + this.translateService.instant('details');
      default:
        return undefined;
    }
  }

  private removeParagraph(val: string): string {
    if (!val || val.indexOf('<p>') !== 0) return val;

    const div = document.createElement('div');
    div.innerHTML = val;

    const item = div.querySelectorAll('p').item(0);

    return item.innerHTML;
  }

  private checkFirstInvalid(): boolean {
    this.cd.detectChanges();

    const form =
      this.template() === 'default'
        ? (this.standardComponents() as any)?.[0]?.formComponents?.[0]?.form
        : this.baseInstance.formComponents()[0].form;

    this.cd.detectChanges();

    if (form.valid) return false;

    const invalidFields: string[] = [];

    this.getInvalidFields(form, invalidFields, '');

    this.toastService.info({
      title: this.translateService.instant('INPUT.ERRORS.requires'),
      message: invalidFields.slice(0, 3).join('<br/>'),
    });

    return true;
  }

  private getInvalidFields(
    control: AbstractControl,
    invalidFields: any[],
    baseField: string,
    key = null,
  ) {
    if (control.valid) return;

    const field = key
      ? baseField + ' > ' + this.translateService.instant('MODEL.' + key)
      : baseField;

    if (control.errors?.['customMessage']) {
      invalidFields.push(field + ` (${control.errors['customMessage']})`);
      return;
    }

    if (control instanceof UntypedFormControl) {
      invalidFields.push(field);
    }

    if (control instanceof UntypedFormGroup) {
      Object.keys(control.controls).forEach((groupKey) => {
        this.getInvalidFields(
          control.controls[groupKey],
          invalidFields,
          field,
          groupKey as any,
        );
      });
    }

    if (control instanceof UntypedFormArray) {
      control.controls.forEach((c, index) => {
        this.getInvalidFields(c, invalidFields, field + `(${index + 1})`);
      });
    }
  }
}
