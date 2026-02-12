import 'package:study_sync_mobile/features/chat/domain/entities/message.dart';

abstract class MessageRepository {
  Future<List<Message>> getMessages(String conversationId);
  Future<Message> sendMessage(String conversationId, String content, String type, Map<String, dynamic>? metadata);
  Future<void> updateMessageStatus(String messageId, MessageStatus status);
}
