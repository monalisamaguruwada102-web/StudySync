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
          final refreshToken = await secureStorage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              // Call identity/refresh endpoint
              final response = await dio
                  .post('/auth/refresh', data: {'refreshToken': refreshToken});
              final newAccessToken = response.data['accessToken'];
              final newRefreshToken = response.data['refreshToken'];

              await secureStorage.write(
                  key: 'access_token', value: newAccessToken);
              await secureStorage.write(
                  key: 'refresh_token', value: newRefreshToken);

              // Retry the original request
              e.requestOptions.headers['Authorization'] =
                  'Bearer $newAccessToken';
              final retryResponse = await dio.fetch(e.requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              // Refresh failed, logout user or handle appropriately
            }
          }
        }
        return handler.next(e);
      },
    ));
  }
}
