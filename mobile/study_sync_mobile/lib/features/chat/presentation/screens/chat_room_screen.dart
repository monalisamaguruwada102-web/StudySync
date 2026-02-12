import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_sync_mobile/core/di/injection.dart';
import 'package:study_sync_mobile/features/chat/domain/entities/conversation.dart';
import 'package:study_sync_mobile/features/chat/domain/entities/message.dart';
import 'package:study_sync_mobile/features/chat/presentation/bloc/message_bloc.dart';

class ChatRoomScreen extends StatefulWidget {
  final Conversation conversation;
  const ChatRoomScreen({super.key, required this.conversation});

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          sl<MessageBloc>()..add(LoadMessagesEvent(widget.conversation.id)),
      child: Scaffold(
        appBar: AppBar(title: Text(widget.conversation.name ?? 'Chat')),
        body: Column(
          children: [
            Expanded(
              child: BlocBuilder<MessageBloc, MessageState>(
                builder: (context, state) {
                  if (state is MessageLoading) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (state is MessagesLoaded) {
                    return ListView.builder(
                      reverse: true,
                      itemCount: state.messages.length,
                      itemBuilder: (context, index) {
                        final message =
                            state.messages[state.messages.length - 1 - index];
                        return _MessageBubble(message: message);
                      },
                    );
                  } else if (state is MessageError) {
                    return Center(child: Text(state.message));
                  }
                  return const SizedBox();
                },
              ),
            ),
            _buildInputArea(context),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
      decoration: BoxDecoration(color: Theme.of(context).cardColor),
      child: Row(
        children: [
          IconButton(icon: const Icon(Icons.attach_file), onPressed: () {}),
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: const InputDecoration(hintText: 'Type a message...'),
            ),
          ),
          BlocBuilder<MessageBloc, MessageState>(
            builder: (context, state) {
              return IconButton(
                icon: const Icon(Icons.send),
                onPressed: () {
                  if (_messageController.text.isNotEmpty) {
                    context.read<MessageBloc>().add(
                          SendMessageEvent(
                            conversationId: widget.conversation.id,
                            content: _messageController.text,
                          ),
                        );
                    _messageController.clear();
                  }
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    // Simplified bubble logic
    return Align(
      alignment: Alignment.centerLeft, // Needs actual sender comparison
      child: Container(
        margin: const EdgeInsets.all(8.0),
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(12.0),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message.content),
            const SizedBox(height: 4),
            Text(
              message.status.name,
              style: const TextStyle(fontSize: 10, color: Colors.blueGrey),
            ),
          ],
        ),
      ),
    );
  }
}
