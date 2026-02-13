import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class CallScreen extends StatefulWidget {
  final io.Socket socket;
  final String otherUserId;
  final String otherUserName;
  final bool isVideo;
  final bool isIncoming;
  final dynamic signal;

  const CallScreen({
    Key? key,
    required this.socket,
    required this.otherUserId,
    required this.otherUserName,
    this.isVideo = true,
    this.isIncoming = false,
    this.signal,
  }) : super(key: key);

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;

  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isCallAccepted = false;

  @override
  void initState() {
    super.initState();
    _initRenderers();
    _initCall();
  }

  Future<void> _initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  Future<void> _initCall() async {
    _peerConnection = await _createPeerConnection();

    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': widget.isVideo,
    });

    _localStream!.getTracks().forEach((track) {
      _peerConnection!.addTrack(track, _localStream!);
    });

    setState(() {
      _localRenderer.srcObject = _localStream;
    });

    if (widget.isIncoming) {
      // Handle incoming signal if already accepted or auto-init
      if (widget.signal != null) {
        await _peerConnection!.setRemoteDescription(
          RTCSessionDescription(widget.signal['sdp'], widget.signal['type']),
        );
        var answer = await _peerConnection!.createAnswer();
        await _peerConnection!.setLocalDescription(answer);

        widget.socket.emit('make-answer', {
          'signal': {'sdp': answer.sdp, 'type': answer.type},
          'to': widget.otherUserId,
        });
      }
    } else {
      // Initiate call
      var offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      widget.socket.emit('call-user', {
        'userToCall': widget.otherUserId,
        'signalData': {'sdp': offer.sdp, 'type': offer.type},
        'from':
            'TODO_CURRENT_USER_ID', // Needs to be passed or obtained from state
        'name': 'TODO_CURRENT_USER_NAME',
      });
    }

    widget.socket.on('call-answered', (data) async {
      if (mounted) {
        setState(() => _isCallAccepted = true);
        await _peerConnection!.setRemoteDescription(
          RTCSessionDescription(data['signal']['sdp'], data['signal']['type']),
        );
      }
    });

    widget.socket.on('ice-candidate', (data) async {
      if (data['candidate'] != null) {
        await _peerConnection!.addCandidate(
          RTCIceCandidate(
            data['candidate']['candidate'],
            data['candidate']['sdpMid'],
            data['candidate']['sdpMLineIndex'],
          ),
        );
      }
    });

    widget.socket.on('call-ended', (_) => _endCall());
    widget.socket.on('call-rejected', (_) => _endCall());
  }

  Future<RTCPeerConnection> _createPeerConnection() async {
    Map<String, dynamic> configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ]
    };

    final Map<String, dynamic> offerOptions = {
      'optional': [
        {'DtlsSrtpKeyAgreement': true},
      ],
    };

    RTCPeerConnection pc =
        await createPeerConnection(configuration, offerOptions);

    pc.onIceCandidate = (candidate) {
      widget.socket.emit('ice-candidate', {
        'to': widget.otherUserId,
        'candidate': {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        }
      });
    };

    pc.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        setState(() {
          _remoteRenderer.srcObject = event.streams[0];
          _isCallAccepted = true;
        });
      }
    };

    return pc;
  }

  void _endCall() {
    _localStream?.getTracks().forEach((track) => track.stop());
    _peerConnection?.close();
    widget.socket.emit('hang-up', {'to': widget.otherUserId});
    if (mounted) Navigator.pop(context);
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
      _localStream?.getAudioTracks().forEach((track) {
        track.enabled = !_isMuted;
      });
    });
  }

  void _toggleVideo() {
    setState(() {
      _isVideoOff = !_isVideoOff;
      _localStream?.getVideoTracks().forEach((track) {
        track.enabled = !_isVideoOff;
      });
    });
  }

  @override
  void dispose() {
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Remote Video
          Positioned.fill(
            child: _isCallAccepted
                ? RTCVideoView(_remoteRenderer,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover)
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.grey[800],
                          child: Text(
                            widget.otherUserName[0].toUpperCase(),
                            style: const TextStyle(
                                fontSize: 40, color: Colors.white),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          widget.otherUserName,
                          style: const TextStyle(
                              fontSize: 24,
                              color: Colors.white,
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _isCallAccepted ? "Connected" : "Calling...",
                          style: const TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
          ),

          // Local Video (PiP)
          if (!_isVideoOff)
            Positioned(
              top: 50,
              right: 20,
              width: 120,
              height: 180,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: RTCVideoView(_localRenderer,
                    mirror: true,
                    objectFit:
                        RTCVideoViewObjectFit.RTCVideoViewObjectFitCover),
              ),
            ),

          // Controls
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                FloatingActionButton(
                  onPressed: _toggleMute,
                  backgroundColor: _isMuted ? Colors.red : Colors.grey[800],
                  child: Icon(_isMuted ? Icons.mic_off : Icons.mic),
                ),
                FloatingActionButton(
                  onPressed: _endCall,
                  backgroundColor: Colors.red,
                  child: const Icon(Icons.call_end, size: 30),
                ),
                FloatingActionButton(
                  onPressed: _toggleVideo,
                  backgroundColor: _isVideoOff ? Colors.red : Colors.grey[800],
                  child:
                      Icon(_isVideoOff ? Icons.videocam_off : Icons.videocam),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
