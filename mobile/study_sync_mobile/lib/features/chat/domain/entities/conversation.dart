import 'package:equatable/equatable.dart';

enum ConversationType { direct, group }

class Conversation extends Equatable {
  final String id;
  final ConversationType type;
  final String? name;
  final List<String> participants;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final String? inviteCode;

  const Conversation({
    required this.id,
    required this.type,
    required this.participants,
    this.name,
    this.lastMessage,
    this.lastMessageTime,
    this.inviteCode,
  });

  @override
  List<Object?> get props => [id, type, name, participants, lastMessage, lastMessageTime, inviteCode];
}
