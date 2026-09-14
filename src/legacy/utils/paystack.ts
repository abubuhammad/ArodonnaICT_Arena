// Paystack Payment Integration
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface PaystackPaymentConfig {
  email: string;
  amount: number;
  currency: string;
  ref: string;
  callback: (response: { reference: string; status: string }) => void;
  onClose: () => void;
}

export const initiatePaystackPayment = (config: PaystackPaymentConfig) => {
  if (!(window as any).PaystackPop) {
    alert("Paystack Checkout is not loaded. Please refresh the page and try again.");
    return;
  }
  
  const handler = (window as any).PaystackPop.setup({
    key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || "pk_test_default_key",
    email: config.email,
    amount: config.amount * 100, // Paystack expects amount in kobo
    currency: config.currency,
    ref: config.ref,
    callback: config.callback,
    onClose: config.onClose,
  });
  
  handler.openIframe();
};

export const verifyPaystackPayment = async (reference: string, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/payments/paystack/verify`,
      { reference },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};
