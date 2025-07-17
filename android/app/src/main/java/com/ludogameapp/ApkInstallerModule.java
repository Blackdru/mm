package com.ludogameapp;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.io.File;

public class ApkInstallerModule extends ReactContextBaseJavaModule {
    
    private static final String MODULE_NAME = "ApkInstaller";
    
    public ApkInstallerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return MODULE_NAME;
    }
    
    @ReactMethod
    public void installApk(String filePath, Promise promise) {
        try {
            File file = new File(filePath);
            
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found at path: " + filePath);
                return;
            }
            
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            Uri apkUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Android 7.0+ (API 24+) - Use FileProvider
                apkUri = FileProvider.getUriForFile(
                    getReactApplicationContext(),
                    getReactApplicationContext().getPackageName() + ".fileprovider",
                    file
                );
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                // Android 6.0 and below - Use file:// URI
                apkUri = Uri.fromFile(file);
            }
            
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            
            // Check if there's an activity that can handle this intent
            if (intent.resolveActivity(getReactApplicationContext().getPackageManager()) != null) {
                getReactApplicationContext().startActivity(intent);
                promise.resolve("Installation started successfully");
            } else {
                promise.reject("NO_INSTALLER", "No app found to handle APK installation");
            }
            
        } catch (Exception e) {
            promise.reject("INSTALL_ERROR", "Failed to install APK: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void checkInstallPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8.0+ (API 26+) - Check if app can install packages
                boolean canInstall = getReactApplicationContext().getPackageManager().canRequestPackageInstalls();
                promise.resolve(canInstall);
            } else {
                // Below Android 8.0 - always allowed
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", "Failed to check install permission: " + e.getMessage());
        }
    }
    
    @ReactMethod
    public void requestInstallPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8.0+ - Request install permission
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(intent);
                promise.resolve("Permission request started");
            } else {
                promise.resolve("Permission not required for this Android version");
            }
        } catch (Exception e) {
            promise.reject("PERMISSION_REQUEST_ERROR", "Failed to request install permission: " + e.getMessage());
        }
    }
}