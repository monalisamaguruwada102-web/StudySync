import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_sync_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:study_sync_mobile/features/auth/presentation/bloc/auth_bloc_state.dart'; // Split for clarity if needed, but here we include it in one

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(AuthInitial()) {
    on<LoginEvent>((event, emit) async {
      emit(AuthLoading());
      try {
        final user = await authRepository.login(event.email, event.password);
        emit(Authenticated(user));
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<RegisterEvent>((event, emit) async {
      emit(AuthLoading());
      try {
        await authRepository.register(event.email, event.password, event.name);
        // Auto login or navigate to login
        final user = await authRepository.login(event.email, event.password);
        emit(Authenticated(user));
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<LogoutEvent>((event, emit) async {
      await authRepository.logout();
      emit(Unauthenticated());
    });

    on<CheckAuthEvent>((event, emit) async {
      emit(AuthLoading());
      final user = await authRepository.getCurrentUser();
      if (user != null) {
        emit(Authenticated(user));
      } else {
        emit(Unauthenticated());
      }
    });
  }
}
