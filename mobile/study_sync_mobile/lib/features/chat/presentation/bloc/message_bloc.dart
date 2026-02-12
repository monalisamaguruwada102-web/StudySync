import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:study_sync_mobile/features/chat/domain/entities/message.dart';
import 'package:study_sync_mobile/features/chat/domain/repositories/message_repository.dart';
import 'package:study_sync_mobile/core/network/socket_service.dart';
import 'dart:async';

// Events
abstract class MessageEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadMessagesEvent extends MessageEvent {
  final String conversationId;
  LoadMessagesEvent(this.conversationId);
  @override
  List<Object?> get props => [conversationId];
}

class SendMessageEvent extends MessageEvent {
  final String conversationId;
  final String content;
  final String type;
  SendMessageEvent({required this.conversationId, required this.content, this.type = 'text'});
  @override
  List<Object?> get props => [conversationId, content, type];
}

class NewMessageReceivedEvent extends MessageEvent {
  final Message message;
  NewMessageReceivedEvent(this.message);
  @override
  List<Object?> get props => [message];
}

// States
abstract class MessageState extends Equatable {
  @override
  List<Object?> get props => [];
}

class MessageInitial extends MessageState {}
class MessageLoading extends MessageState {}
class MessagesLoaded extends MessageState {
  final List<Message> messages;
  MessagesLoaded(this.messages);
  @override
  List<Object?> get props => [messages];
}
class MessageError extends MessageState {
  final String message;
  MessageError(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class MessageBloc extends Bloc<MessageEvent, MessageState> {
  final MessageRepository messageRepository;
  final SocketService socketService;
  StreamSubscription? _socketSubscription;

  MessageBloc({required this.messageRepository, required this.socketService}) : super(MessageInitial()) {
    
    // Listen to real-time events from SocketService
    _socketSubscription = socketService.messages.listen((event) {
      if (event['type'] == 'new_message') {
        final json = event['data'];
        final message = Message(
          id: json['id'],
          conversationId: json['conversationId'],
          senderId: json['senderId'],
          content: json['content'],
          type: MessageType.text, // Simplified mapping
          status: MessageStatus.sent,
          createdAt: DateTime.parse(json['createdAt']),
        );
        add(NewMessageReceivedEvent(message));
      }
    });

    on<LoadMessagesEvent>((event, emit) async {
      emit(MessageLoading());
      try {
        final messages = await messageRepository.getMessages(event.conversationId);
        socketService.joinConversation(event.conversationId);
        emit(MessagesLoaded(messages));
      } catch (e) {
        emit(MessageError(e.toString()));
      }
    });

    on<SendMessageEvent>((event, emit) async {
      try {
        final message = await messageRepository.sendMessage(event.conversationId, event.content, event.type, null);
        if (state is MessagesLoaded) {
          final currentMessages = (state as MessagesLoaded).messages;
          emit(MessagesLoaded([...currentMessages, message]));
        }
      } catch (e) {
        emit(MessageError(e.toString()));
      }
    });

    on<NewMessageReceivedEvent>((event, emit) {
      if (state is MessagesLoaded) {
        final currentMessages = (state as MessagesLoaded).messages;
        if (!currentMessages.any((m) => m.id == event.message.id)) {
          emit(MessagesLoaded([...currentMessages, event.message]));
        }
      }
    });
  }

  @override
  Future<void> close() {
    _socketSubscription?.cancel();
    return super.close();
  }
}
