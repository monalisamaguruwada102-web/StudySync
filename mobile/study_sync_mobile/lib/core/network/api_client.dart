import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio dio;
  final FlutterSecureStorage secureStorage;

  ApiClient({required this.dio, required this.secureStorage}) {
    dio.options.baseUrl = 'http://localhost:8000/api/v1'; // API Gateway URL
    dio.options.connectTimeout = const Duration(seconds: 5);
    dio.options.receiveTimeout = const Duration(seconds: 3);

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await secureStorage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // TODO: Implement Refresh Token logic
        }
        return handler.next(e);
      },
    ));
  }
}
