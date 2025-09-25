import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';

import { IEntity } from '@smartsoft001/domain-core';

import { DetailsComponent, PageComponent } from '../../components';
import {
  IPageOptions,
  IDetailsOptions,
  IIconButtonOptions,
} from '../../models';
import { ModalService, StyleService } from '../../services';

@Component({
  templateUrl: './details.page.html',
  imports: [PageComponent, DetailsComponent],
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage<T extends IEntity<string>> implements OnInit {
  private modalService = inject(ModalService);
  private styleService = inject(StyleService);
  private elementRef = inject(ElementRef);
  // navParams: NavParams, //TODO: to be injected

  pageOptions: WritableSignal<IPageOptions> = signal({
    title: 'details',
    hideMenuButton: true,
  });
  detailsOptions: IDetailsOptions<T>;

  constructor() {
    this.detailsOptions = /*navParams.get('value')*/ {} as IDetailsOptions<T>;
    this.initTitle();
    this.initButtons();
  }

  ngOnInit(): void {
    this.styleService.init(this.elementRef);
  }

  private initTitle(): void {
    this.pageOptions.update((options) => {
      if (this.detailsOptions.title) {
        return {
          ...options,
          title: this.detailsOptions.title,
        };
      }

      return options;
    });
  }

  private initButtons(): void {
    const buttons: IIconButtonOptions[] = [];

    if (this.detailsOptions.removeHandler) {
      buttons.push({
        handler: () => {
          computed(() => {
            const item = this.detailsOptions.item();
            if (item) {
              this.detailsOptions?.removeHandler?.(item);
            }
            this.modalService.dismiss();
          });
        },
        icon: 'trash',
      });
    }

    if (this.detailsOptions.itemHandler) {
      buttons.push({
        handler: () => {
          computed(() => {
            const item = this.detailsOptions.item();
            if (item) {
              this.detailsOptions?.removeHandler?.(item);
            }
            this.modalService.dismiss();
          });
        },
        icon: 'arrow-forward-outline',
      });
    }

    this.pageOptions.update((options) => ({ ...options, endButtons: buttons }));
  }
}
