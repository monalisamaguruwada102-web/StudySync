import 'package:study_sync_mobile/features/chat/data/datasources/chat_remote_data_source.dart';
import 'package:study_sync_mobile/features/chat/domain/entities/conversation.dart';
import 'package:study_sync_mobile/features/chat/domain/repositories/chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  final ChatRemoteDataSource remoteDataSource;

  ChatRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<Conversation>> getConversations(String userId) async {
    final list = await remoteDataSource.getConversations(userId);
    return list.map((json) => Conversation(
      id: json['id'],
      type: json['type'] == 'group' ? ConversationType.group : ConversationType.direct,
      participants: List<String>.from(json['participants']),
      name: json['name'],
      lastMessage: json['lastMessage'],
      lastMessageTime: json['lastMessageTime'] != null 
        ? DateTime.parse(json['lastMessageTime']) 
        : null,
      inviteCode: json['groupMetadata']?['inviteCode'],
    )).toList();
  }

  @override
  Future<Conversation> createDirectChat(String otherUserId) async {
    // Logic handled by data source calling API
    // Mapping omitted for brevity
    throw UnimplementedError();
  }

  @override
  Future<Conversation> createGroupChat(String name, String description, List<String> participants) async {
    throw UnimplementedError();
  }

  @override
  Future<void> joinGroup(String inviteCode) async {
    throw UnimplementedError();
  }
}
