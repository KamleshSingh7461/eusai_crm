import 'package:flutter/material.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/chat_list_screen.dart';
import 'services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:local_notifier/local_notifier.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final apiService = ApiService();
  await apiService.init();

  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    await localNotifier.setup(
      appName: 'EUSAI Hub',
      shortcutPolicy: ShortcutPolicy.requireCreate,
    );
  }

  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: apiService),
      ],
      child: EusaiMessengerApp(isLoggedIn: token != null),
    ),
  );
}

class EusaiMessengerApp extends StatelessWidget {
  final bool isLoggedIn;
  
  const EusaiMessengerApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EUSAI Messenger',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.teamsTheme,
      home: isLoggedIn ? const ChatListScreen() : const LoginScreen(),
    );
  }
}
