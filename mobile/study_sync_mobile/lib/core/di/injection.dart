import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:study_sync_mobile/core/network/api_client.dart';
import 'package:study_sync_mobile/core/network/socket_service.dart';
import 'package:study_sync_mobile/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:study_sync_mobile/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:study_sync_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:study_sync_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:study_sync_mobile/features/chat/data/datasources/chat_remote_data_source.dart';
import 'package:study_sync_mobile/features/chat/data/datasources/message_remote_data_source.dart';
import 'package:study_sync_mobile/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:study_sync_mobile/features/chat/data/repositories/message_repository_impl.dart';
import 'package:study_sync_mobile/features/chat/domain/repositories/chat_repository.dart';
import 'package:study_sync_mobile/features/chat/domain/repositories/message_repository.dart';
import 'package:study_sync_mobile/features/chat/presentation/bloc/chat_bloc.dart';
import 'package:study_sync_mobile/features/chat/presentation/bloc/message_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // Features - Auth
  sl.registerFactory(() => AuthBloc(authRepository: sl()));
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl(), secureStorage: sl()),
  );
  sl.registerLazySingleton(() => AuthRemoteDataSource(apiClient: sl()));

  // Features - Chat
  sl.registerFactory(() => ChatBloc(chatRepository: sl()));
  sl.registerLazySingleton<ChatRepository>(
    () => ChatRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton(() => ChatRemoteDataSource(apiClient: sl()));

  // Features - Messaging
  sl.registerFactory(
      () => MessageBloc(messageRepository: sl(), socketService: sl()));
  sl.registerLazySingleton<MessageRepository>(
    () => MessageRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton(() => MessageRemoteDataSource(apiClient: sl()));

  // Core
  sl.registerLazySingleton(() => ApiClient(dio: sl(), secureStorage: sl()));
  sl.registerLazySingleton(() => SocketService(secureStorage: sl()));

  // External
  sl.registerLazySingleton(() => Dio());
  sl.registerLazySingleton(() => const FlutterSecureStorage());
}
