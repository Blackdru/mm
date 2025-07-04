package com.ludogameapp

import android.app.Activity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.razorpay.Checkout
import com.razorpay.PaymentResultListener
import org.json.JSONObject

class RazorpayNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PaymentResultListener {

    private var mPromise: Promise? = null

    override fun getName(): String {
        return "RazorpayNative"
    }

    @ReactMethod
    fun openNativeCheckout(options: ReadableMap, promise: Promise) {
        mPromise = promise
        
        val activity = currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NOT_FOUND", "Activity not found")
            return
        }

        try {
            // Force native checkout by setting specific flags
            val checkout = Checkout()
            checkout.setKeyID(options.getString("key"))
            
            // Convert ReadableMap to JSONObject
            val jsonOptions = JSONObject()
            val iterator = options.keySetIterator()
            while (iterator.hasNextKey()) {
                val key = iterator.nextKey()
                when (val value = options.getDynamic(key)) {
                    is String -> jsonOptions.put(key, value)
                    is Int -> jsonOptions.put(key, value)
                    is Double -> jsonOptions.put(key, value)
                    is Boolean -> jsonOptions.put(key, value)
                    is ReadableMap -> {
                        val nestedJson = JSONObject()
                        val nestedIterator = value.keySetIterator()
                        while (nestedIterator.hasNextKey()) {
                            val nestedKey = nestedIterator.nextKey()
                            val nestedValue = value.getDynamic(nestedKey)
                            when (nestedValue) {
                                is String -> nestedJson.put(nestedKey, nestedValue)
                                is Int -> nestedJson.put(nestedKey, nestedValue)
                                is Double -> nestedJson.put(nestedKey, nestedValue)
                                is Boolean -> nestedJson.put(nestedKey, nestedValue)
                            }
                        }
                        jsonOptions.put(key, nestedJson)
                    }
                }
            }
            
            // Force native mode
            jsonOptions.put("disable_redesign_v15", false)
            jsonOptions.put("force_native", true)
            
            // Open native checkout
            checkout.open(activity, jsonOptions)
            
        } catch (e: Exception) {
            promise.reject("CHECKOUT_ERROR", e.message)
        }
    }

    override fun onPaymentSuccess(razorpayPaymentID: String?) {
        val successObject = Arguments.createMap()
        successObject.putString("razorpay_payment_id", razorpayPaymentID)
        mPromise?.resolve(successObject)
        mPromise = null
    }

    override fun onPaymentError(code: Int, response: String?) {
        mPromise?.reject("PAYMENT_ERROR", response ?: "Payment failed")
        mPromise = null
    }
}