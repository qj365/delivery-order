export {};

declare global {
  namespace PrismaJson {
    type ProductImages = string[];

    type VariantOption = {
      id: number;
      value: string;
    };
    type VariantOptions = {
      id: number;
      name: string;
      options: VariantOption[];
    }[];

    type VariantOptionIds = number[];

    type PaymentMethodInfo = {
      card?: {
        name?: string;
        brand: string;
        last_digits: string;
        expiry: string;
      };
      paypal?: {
        email_address: string;
        name?: {
          given_name?: string;
          surname?: string;
        };
      };
    };

    type BillingAddress = {
      fullName: string;
      companyName?: string;
      vat?: string;
      address1: string;
      address2?: string;
      province: string;
      city: string;
      postalCode: string;
      country: string;
    };

    type NotificationData = {
      orderId?: number;
      platformName?: string;
      orderNumbers?: number;
      amount?: number;
      thresholdAmount?: number;
      productName?: string;
      rfqId?: number;
      quantity?: number;
      quoteId?: number;
      transactionId?: number;
      orderCode?: string;
    };

    type TimeSchedule = string[];

    type SetNumber = 1 | 2 | 3 | 4 | 5;

    type RegionPricing = {
      [set in SetNumber]?: number;
    };
  }
}
