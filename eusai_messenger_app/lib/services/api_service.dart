import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class ApiService {
  static String get baseUrl {
    // TACTICAL ROUTING:
    // 1. Android Emulator: 10.0.2.2
    // 2. Windows/Web: localhost/127.0.0.1
    // 3. iOS/Physical: Use your machine's local IP (e.g., 192.168.1.XX)
    
    if (kIsWeb) return 'http://192.168.0.101:3000/api';
    
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000/api';
      if (Platform.isIOS) {
        // TACTICAL LINK: Your PC's Local IP
        return 'http://192.168.0.101:3000/api'; 
      }
    } catch (e) {
      // Fallback for platforms where Platform.isX might throw
    }
    
    return 'http://127.0.0.1:3000/api';
  }

  static String get baseHost {
    return baseUrl.replaceAll('/api', '');
  }
  static const String googleClientId = '257076820133-mrv6tc9ckc9rd78848jdaipokm2jemga.apps.googleusercontent.com';

  String? _token;
  Map<String, dynamic>? _user;

  ApiService();

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      _user = jsonDecode(userStr);
    }
  }

  String get currentUserEmail => _user?['email'] ?? '';
  String get currentUserId => _user?['id']?.toString() ?? '';
  String get currentUserName => _user?['name'] ?? 'Admin User';
  String get currentUserRole => _user?['role'] ?? 'OPERATIVE';
  String? get currentUserImage => _user?['image'];

  Future<bool> loginWithGoogle() async {
    HttpServer? server;
    try {
      server = await HttpServer.bind(InternetAddress.loopbackIPv4, 18290);
      final authUrl = Uri.https('accounts.google.com', '/o/oauth2/v2/auth', {
        'client_id': googleClientId,
        'redirect_uri': 'http://localhost:18290',
        'response_type': 'id_token',
        'scope': 'email profile openid',
        'nonce': 'eusai_nonce_2026',
      });

      if (!await launchUrl(authUrl, mode: LaunchMode.externalApplication)) {
        return false;
      }

      await for (var request in server) {
        request.response
          ..statusCode = 200
          ..headers.contentType = ContentType.html
          ..write('<html><body style="font-family: sans-serif; background: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;"><h1 style="color: #2196F3;">EUSAI AUTHENTICATED</h1><p>Establishing secure link... You can close this window now.</p><script>const fragment = window.location.hash.substring(1); if (fragment) { window.location.href = "/token?" + fragment; }</script></body></html>');
        await request.response.close();

        if (request.uri.path == '/token') {
          final idToken = request.uri.queryParameters['id_token'];
          if (idToken != null) {
            final success = await _verifyWithBackend(idToken);
            await server.close();
            return success;
          }
        }
      }
      return false;
    } catch (e) {
      await server?.close();
      return false;
    }
  }

  Future<bool> _verifyWithBackend(String idToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/mobile/google'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'idToken': idToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _token = data['token'];
      _user = data['user'];
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('user', jsonEncode(_user));
      return true;
    }
    return false;
  }

  Future<void> devLogin() async {
    _token = 'dev_mock_token_2026';
    _user = {
      'id': '462ca1a5-61aa-40e0-89b7-99b70cd8fcab',
      'name': 'Admin Director',
      'email': 'admin@eusaiteam.com',
      'role': 'DIRECTOR',
      'image': null,
    };
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('user', jsonEncode(_user));
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<List<dynamic>> fetchChannels() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.get(
      Uri.parse('$baseUrl/chat/channels?_t=${DateTime.now().millisecondsSinceEpoch}'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['channels'] ?? [];
    }
    return [];
  }

  Future<List<dynamic>> fetchMessages(String channelId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.get(
      Uri.parse('$baseUrl/chat/messages?channelId=$channelId&_t=${DateTime.now().millisecondsSinceEpoch}'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['messages'] ?? [];
    }
    return [];
  }

  Future<bool> sendMessage(String channelId, String content) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.post(
      Uri.parse('$baseUrl/chat/messages'),
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode({'channelId': channelId, 'content': content}),
    );
    return response.statusCode == 200;
  }

  Future<List<dynamic>> fetchNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.get(
      Uri.parse('$baseUrl/notifications?_t=${DateTime.now().millisecondsSinceEpoch}'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['notifications'] ?? []; // Extract from { notifications: [...] }
    }
    return [];
  }

  Future<List<dynamic>> fetchUsers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.get(
      Uri.parse('$baseUrl/users?_t=${DateTime.now().millisecondsSinceEpoch}'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body); // Directly returns array
    }
    return [];
  }

  Future<dynamic> createChannel(String name, String type, List<String> memberIds) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final response = await http.post(
      Uri.parse('$baseUrl/chat/channels'),
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode({'name': name, 'type': type, 'memberIds': memberIds}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<int>?> downloadFile(String url) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    String host = ApiService.baseHost;
    
    String fullUrl = url;
    if (url.startsWith('/')) fullUrl = host + url;
    else if (!url.startsWith('http')) fullUrl = host + '/' + url;
    else {
       // Replace localhost with the correct dynamic host for this platform
       if (url.contains('localhost')) {
         fullUrl = url.replaceAll('localhost', host.replaceAll('http://', '').replaceAll('https://', ''));
       } else if (url.contains('127.0.0.1')) {
         fullUrl = url.replaceAll('127.0.0.1', host.replaceAll('http://', '').replaceAll('https://', ''));
       }
    }
    
    final encodedUrl = Uri.encodeFull(fullUrl);
    debugPrint('--- TACTICAL SATURATION PROBE ---');
    debugPrint('Primary Target: $encodedUrl');
    
    // Path variations to try
    final List<String> variations = [
      encodedUrl,
      encodedUrl.replaceAll('%E2%80%93', '-'), // En-dash to Hyphen
      encodedUrl.replaceAll('%E2%80%93', '_'), // En-dash to Underscore
      // Full sanitization attempt
      host + '/' + url.split('/').last.replaceRange(0, url.split('/').last.length, 
          url.split('/').last.replaceAll(RegExp(r'[^a-zA-Z0-9.-]'), '_'))
    ];

    for (int i = 0; i < variations.length; i++) {
      try {
        debugPrint('Variation ${i+1} Pulse: ${variations[i]}');
        var response = await http.get(Uri.parse(variations[i]));
        debugPrint('Variation ${i+1} Result: ${response.statusCode}, Type: ${response.headers['content-type']}');
        
        if (!_isErrorResponse(response)) {
          debugPrint('SUCCESS: Variation ${i+1} cleared the block. Streaming bytes...');
          return response.bodyBytes;
        }
      } catch (e) {
        debugPrint('Variation ${i+1} Failure: $e');
      }
    }

    // Final attempt: Authenticated Pulse
    if (token != null) {
      debugPrint('Final Strike: Authenticated Pulse...');
      try {
        final response = await http.get(Uri.parse(encodedUrl), headers: {'Authorization': 'Bearer $token'});
        if (!_isErrorResponse(response)) return response.bodyBytes;
      } catch (e) {}
    }
    
    debugPrint('--- PROBE FAILED ---');
    return null;
  }

  bool _isErrorResponse(http.Response response) {
    if (response.statusCode != 200) return true;
    final contentType = response.headers['content-type'] ?? '';
    return contentType.contains('application/json') || contentType.contains('text/html');
  }
}
