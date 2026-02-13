import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:async';

class SocketService {
  late io.Socket socket;
  final FlutterSecureStorage secureStorage;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();

  SocketService({required this.secureStorage});

  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  Future<void> connect() async {
    final token = await secureStorage.read(key: 'access_token');

    socket = io.io(
        'http://localhost:8004',
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .disableAutoConnect()
            .build());

    socket.connect();

    // socket.onConnect((_) => print('🚀 Connected to WebSocket Gateway'));

    socket.on('message_received', (data) {
      _messageController.add({'type': 'new_message', 'data': data});
    });

    socket.on('message_status_updated', (data) {
      _messageController.add({'type': 'status_update', 'data': data});
    });

    socket.on('user_typing', (data) {
      _messageController.add({'type': 'typing', 'data': data});
    });
  }

  void joinConversation(String conversationId) {
    socket.emit('join_conversation', conversationId);
  }

  void sendTyping(String conversationId, bool isTyping) {
    socket.emit(
        'typing', {'conversationId': conversationId, 'isTyping': isTyping});
  }

  void disconnect() {
    socket.disconnect();
  }
}
