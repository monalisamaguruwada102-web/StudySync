import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_sync_mobile/core/di/injection.dart' as di;
import 'package:study_sync_mobile/features/auth/presentation/bloc/auth_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await di.init();
  runApp(const StudySyncApp());
}

class StudySyncApp extends StatelessWidget {
  const StudySyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => di.sl<AuthBloc>()),
      ],
      child: MaterialApp(
        title: 'Study Sync',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        ),
        home: const Scaffold(
          body: Center(
            child: Text('Study Sync Mobile Chat'),
          ),
        ),
      ),
    );
  }
}
