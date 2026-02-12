import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_sync_mobile/core/di/injection.dart';
import 'package:study_sync_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:study_sync_mobile/features/chat/presentation/bloc/chat_bloc.dart';
import 'package:study_sync_mobile/features/chat/presentation/screens/chat_room_screen.dart';

class ConversationListScreen extends StatelessWidget {
  const ConversationListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = (context.read<AuthBloc>().state as Authenticated).user;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthBloc>().add(LogoutEvent()),
          ),
        ],
      ),
      body: BlocProvider(
        create: (_) => sl<ChatBloc>()..add(LoadConversationsEvent(user.id)),
        child: BlocBuilder<ChatBloc, ChatState>(
          builder: (context, state) {
            if (state is ChatLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is ChatLoaded) {
              return ListView.builder(
                itemCount: state.conversations.length,
                itemBuilder: (context, index) {
                  final conv = state.conversations[index];
                  return ListTile(
                    leading: CircleAvatar(child: Text(conv.name?[0] ?? 'C')),
                    title: Text(conv.name ?? 'Direct Chat'),
                    subtitle: Text(conv.lastMessage ?? 'No messages yet'),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChatRoomScreen(conversation: conv),
                      ),
                    ),
                  );
                },
              );
            } else if (state is ChatError) {
              return Center(child: Text(state.message));
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }
}
