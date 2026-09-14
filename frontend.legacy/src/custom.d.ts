declare module "@paystack/inline-js" {
    export default class PaystackPop {
      newTransaction(config: {
        key: string;
        amount: number;
        email: string;
        onSuccess: (payment: { reference: string }) => void;
        onCancel?: () => void;
      }): void;
    }
  }
  