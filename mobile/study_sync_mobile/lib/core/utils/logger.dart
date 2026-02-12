import 'package:flutter/foundation.dart';

class GlobalLogger {
  static void logError(dynamic error, StackTrace? stackTrace, {String? reason}) {
    // In production, integrate with Sentry or Firebase Crashlytics
    if (kDebugMode) {
      print('❌ ERROR: $error');
      if (reason != null) print('Context: $reason');
      if (stackTrace != null) print(stackTrace);
    }
  }

  static void logInfo(String message) {
    if (kDebugMode) {
      print('ℹ️ INFO: $message');
    }
  }
}
