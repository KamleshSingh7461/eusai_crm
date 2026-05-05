import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import '../services/api_service.dart';

class PushNotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  static Future<void> initialize(ApiService apiService) async {
    // Request permissions for iOS
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      if (kDebugMode) print('TACTICAL_PULSE: Push permissions granted');
      
      // Get the token
      String? token = await _fcm.getToken();
      if (token != null) {
        if (kDebugMode) print('FCM_TOKEN: $token');
        await apiService.registerFcmToken(token);
      }

      // Handle token refreshes
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
        await apiService.registerFcmToken(newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) print('FOREGROUND_NOTIF: ${message.notification?.title}');
        // Note: active app alerts are already handled by polling in ChatListScreen
      });
    }
  }

  static String getDeviceType() {
    if (kIsWeb) return 'web';
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    if (Platform.isWindows) return 'windows';
    if (Platform.isMacOS) return 'macos';
    return 'unknown';
  }
}
