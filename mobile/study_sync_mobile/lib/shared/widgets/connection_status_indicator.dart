import 'package:flutter/material.dart';
import 'package:study_sync_mobile/core/network/socket_service.dart';
import 'package:study_sync_mobile/core/di/injection.dart';

class ConnectionStatusIndicator extends StatefulWidget {
  const ConnectionStatusIndicator({super.key});

  @override
  State<ConnectionStatusIndicator> createState() => _ConnectionStatusIndicatorState();
}

class _ConnectionStatusIndicatorState extends State<ConnectionStatusIndicator> {
  bool _isConnected = false;

  @override
  void initState() {
    super.initState();
    // In a real app, SocketService would expose a connection state stream
    _isConnected = sl<SocketService>().socket.connected;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: _isConnected ? Colors.green : Colors.red,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (_isConnected ? Colors.green : Colors.red).withOpacity(0.5),
            blurRadius: 4,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }
}
