import 'package:equatable/equatable.dart';

enum MessageStatus { sent, delivered, read }
enum MessageType { text, image, file }

class Message extends Equatable {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final MessageType type;
  final MessageStatus status;
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.type,
    required this.status,
    required this.createdAt,
    this.metadata,
  });

  @override
  List<Object?> get props => [id, conversationId, senderId, content, type, status, createdAt, metadata];
}
