import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_sync_mobile/core/di/injection.dart';
import 'package:study_sync_mobile/core/theme/app_theme.dart';
import 'package:study_sync_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:study_sync_mobile/features/auth/presentation/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await init();
  runApp(const StudySyncApp());
}

class StudySyncApp extends StatelessWidget {
  const StudySyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(create: (_) => sl<AuthBloc>()),
      ],
      child: MaterialApp(
        title: 'Study Sync',
        debugShowCheckedModeBanner: false,
        theme: StudySyncTheme.darkTheme,
        home: const LoginScreen(),
      ),
    );
  }
}
