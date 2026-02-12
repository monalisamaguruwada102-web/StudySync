import 'package:study_sync_mobile/features/chat/data/datasources/message_remote_data_source.dart';
import 'package:study_sync_mobile/features/chat/domain/entities/message.dart';
import 'package:study_sync_mobile/features/chat/domain/repositories/message_repository.dart';

class MessageRepositoryImpl implements MessageRepository {
  final MessageRemoteDataSource remoteDataSource;

  MessageRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<Message>> getMessages(String conversationId) async {
    final list = await remoteDataSource.getMessages(conversationId);
    return list.map((json) => Message(
      id: json['id'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      content: json['content'],
      type: json['type'] == 'image' ? MessageType.image : (json['type'] == 'file' ? MessageType.file : MessageType.text),
      status: json['status'] == 'read' ? MessageStatus.read : (json['status'] == 'delivered' ? MessageStatus.delivered : MessageStatus.sent),
      createdAt: DateTime.parse(json['createdAt']),
      metadata: json['metadata'],
    )).toList();
  }

  @override
  Future<Message> sendMessage(String conversationId, String content, String type, Map<String, dynamic>? metadata) async {
    final json = await remoteDataSource.sendMessage({
      'conversationId': conversationId,
      'content': content,
      'type': type,
      'metadata': metadata,
    });
    return Message(
      id: json['id'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      content: json['content'],
      type: type == 'image' ? MessageType.image : (type == 'file' ? MessageType.file : MessageType.text),
      status: MessageStatus.sent,
      createdAt: DateTime.parse(json['createdAt']),
      metadata: json['metadata'],
    );
  }

  @override
  Future<void> updateMessageStatus(String messageId, MessageStatus status) async {
    await remoteDataSource.updateStatus(messageId, status.name);
  }
}
