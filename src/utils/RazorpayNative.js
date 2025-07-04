import { NativeModules } from 'react-native';

const { RazorpayNative } = NativeModules;

class RazorpayNativeCheckout {
  static async open(options) {
    try {
      console.log('Opening native Razorpay checkout with options:', options);
      
      // Use our custom native module for true native checkout
      const result = await RazorpayNative.openNativeCheckout(options);
      console.log('Native checkout result:', result);
      
      return result;
    } catch (error) {
      console.error('Native checkout error:', error);
      throw error;
    }
  }
}

export default RazorpayNativeCheckout;