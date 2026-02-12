import 'package:study_sync_mobile/core/network/api_client.dart';

class MessageRemoteDataSource {
  final ApiClient apiClient;

  MessageRemoteDataSource({required this.apiClient});

  Future<List<dynamic>> getMessages(String conversationId) async {
    final response = await apiClient.dio.get('/messages/$conversationId');
    return response.data;
  }

  Future<Map<String, dynamic>> sendMessage(Map<String, dynamic> data) async {
    final response = await apiClient.dio.post('/messages/send', data: data);
    return response.data;
  }

  Future<void> updateStatus(String messageId, String status) async {
    await apiClient.dio.post('/messages/status', data: {
      'messageId': messageId,
      'status': status,
    });
  }
}
