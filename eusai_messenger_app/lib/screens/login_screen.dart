import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'chat_list_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    final success = await context.read<ApiService>().loginWithGoogle();
    
    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const ChatListScreen()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication failed. Check tactical link.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 600;

    return Scaffold(
      backgroundColor: AppTheme.blackMain,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              width: isMobile ? screenWidth : 400,
              padding: EdgeInsets.all(isMobile ? 32 : 40),
              decoration: BoxDecoration(
                color: AppTheme.blackSidebar,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 40)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: isMobile ? 64 : 80, 
                    height: isMobile ? 64 : 80,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.asset('assets/EUSAI-LOGO.png', fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text('EUSAI HUB', style: TextStyle(fontSize: isMobile ? 20 : 24, fontWeight: FontWeight.w900, letterSpacing: -1)),
                  const Text('COMMAND CENTER ACCESS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white24)),
                  const SizedBox(height: 48),
                  _buildLoginButton(),
                  const SizedBox(height: 16),
                  _buildDevOverrideButton(),
                  const SizedBox(height: 24),
                  const Text('SECURE TRANSCEIVER v1.0', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white10, letterSpacing: 1)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleDevLogin() async {
    setState(() => _isLoading = true);
    await context.read<ApiService>().devLogin();
    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const ChatListScreen()),
      );
    }
  }

  Widget _buildDevOverrideButton() {
    return GestureDetector(
      onTap: _isLoading ? null : _handleDevLogin,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Center(
          child: Text(
            'DEVELOPER OVERRIDE', 
            style: TextStyle(
              fontSize: 9, 
              fontWeight: FontWeight.w900, 
              color: Colors.white.withOpacity(0.2), 
              letterSpacing: 2
            )
          ),
        ),
      ),
    );
  }

  Widget _buildLoginButton() {
    return GestureDetector(
      onTap: _isLoading ? null : _handleLogin,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppTheme.eusaiBlue,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: AppTheme.eusaiBlue.withOpacity(0.3), blurRadius: 20)],
        ),
        child: Center(
          child: _isLoading 
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.shieldCheck, color: Colors.white, size: 18),
                  SizedBox(width: 12),
                  Text('INITIALIZE SECURE LINK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ],
              ),
        ),
      ),
    );
  }
}
