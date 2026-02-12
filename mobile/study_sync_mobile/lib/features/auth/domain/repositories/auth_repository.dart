import 'package:study_sync_mobile/features/auth/domain/entities/user.dart';

abstract class AuthRepository {
  Future<User> login(String email, String password);
  Future<void> register(String email, String password, String name);
  Future<void> logout();
  Future<User?> getCurrentUser();
}
