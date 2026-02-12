import 'package:study_sync_mobile/core/network/api_client.dart';

class ChatRemoteDataSource {
  final ApiClient apiClient;

  ChatRemoteDataSource({required this.apiClient});

  Future<List<dynamic>> getConversations(String userId) async {
    final response = await apiClient.dio.get('/chat/user/$userId');
    return response.data;
  }

  Future<Map<String, dynamic>> createChat(Map<String, dynamic> data) async {
    final response = await apiClient.dio.post('/chat/conversations', data: data);
    return response.data;
  }
}
