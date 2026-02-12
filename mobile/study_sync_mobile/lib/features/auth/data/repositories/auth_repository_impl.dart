import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:study_sync_mobile/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:study_sync_mobile/features/auth/domain/entities/user.dart';
import 'package:study_sync_mobile/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final FlutterSecureStorage secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<User> login(String email, String password) async {
    final data = await remoteDataSource.login(email, password);

    // Save tokens
    await secureStorage.write(key: 'access_token', value: data['accessToken']);
    await secureStorage.write(
        key: 'refresh_token', value: data['refreshToken']);

    final userData = data['user'];
    return User(
      id: userData['id'],
      email: userData['email'],
      name: userData['name'],
    );
  }

  @override
  Future<void> register(String email, String password, String name) async {
    await remoteDataSource.register(email, password, name);
  }

  @override
  Future<void> logout() async {
    await secureStorage.delete(key: 'access_token');
    await secureStorage.delete(key: 'refresh_token');
  }

  @override
  Future<User?> getCurrentUser() async {
    final token = await secureStorage.read(key: 'access_token');
    if (token == null) return null;

    // In a real app, we would fetch the profile from API using the token.
    // For now, we'll return a placeholder to satisfy the integration.
    return const User(id: 'current_user', email: '', name: 'Logged In User');
  }
}
