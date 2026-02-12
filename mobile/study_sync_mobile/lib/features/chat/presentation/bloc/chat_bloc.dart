import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:study_sync_mobile/features/chat/domain/entities/conversation.dart';
import 'package:study_sync_mobile/features/chat/domain/repositories/chat_repository.dart';

// Events
abstract class ChatEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadConversationsEvent extends ChatEvent {
  final String userId;
  LoadConversationsEvent(this.userId);
  @override
  List<Object?> get props => [userId];
}

// States
abstract class ChatState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ChatInitial extends ChatState {}
class ChatLoading extends ChatState {}
class ChatLoaded extends ChatState {
  final List<Conversation> conversations;
  ChatLoaded(this.conversations);
  @override
  List<Object?> get props => [conversations];
}
class ChatError extends ChatState {
  final String message;
  ChatError(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final ChatRepository chatRepository;

  ChatBloc({required this.chatRepository}) : super(ChatInitial()) {
    on<LoadConversationsEvent>((event, emit) async {
      emit(ChatLoading());
      try {
        final conversations = await chatRepository.getConversations(event.userId);
        emit(ChatLoaded(conversations));
      } catch (e) {
        emit(ChatError(e.toString()));
      }
    });
  }
}
