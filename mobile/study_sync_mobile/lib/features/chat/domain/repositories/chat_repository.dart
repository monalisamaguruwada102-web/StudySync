import 'package:study_sync_mobile/features/chat/domain/entities/conversation.dart';

abstract class ChatRepository {
  Future<List<Conversation>> getConversations(String userId);
  Future<Conversation> createDirectChat(String otherUserId);
  Future<Conversation> createGroupChat(String name, String description, List<String> participants);
  Future<void> joinGroup(String inviteCode);
}
