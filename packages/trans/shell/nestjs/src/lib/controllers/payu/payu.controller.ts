import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { TransService } from '@smartsoft001/trans-shell-app-services';

@Controller('payu')
export class PayUController {
  constructor(private readonly service: TransService) {}

  @Post()
  @HttpCode(200)
  async refreshStatus(
    @Body() obj: { order: { orderId: string } },
  ): Promise<string> {
    try {
      await this.service.refresh(obj.order.orderId, obj);
      return 'ok';
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
