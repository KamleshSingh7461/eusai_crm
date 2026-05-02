import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // EUSAI Web "Command Center" Palette
  static const Color blackRail = Color(0xFF000000);   // Absolute black rail
  static const Color blackSidebar = Color(0xFF0A0A0A); // Tactical Sidebar
  static const Color blackMain = Color(0xFF050505);    // Main background
  static const Color blackBubble = Color(0xFF1A1A1A);  // Other's bubble
  static const Color eusaiBlue = Color(0xFF2563EB);    // Tactical Blue (blue-600)
  static const Color eusaiNeon = Color(0xFF60A5FA);    // Neon blue text (blue-400)
  static const Color textMain = Color(0xFFFFFFFF);
  static const Color textDim = Color(0x66FFFFFF);     // white/40
  static const Color textMicro = Color(0x33FFFFFF);    // white/20

  static ThemeData get teamsTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: blackMain,
      primaryColor: eusaiBlue,
      colorScheme: const ColorScheme.dark(
        primary: eusaiBlue,
        secondary: eusaiNeon,
        surface: blackSidebar,
        onSurface: textMain,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
          color: textMain,
        ),
        bodyLarge: const TextStyle(color: textMain, fontSize: 14, fontWeight: FontWeight.w500),
        bodyMedium: const TextStyle(color: textDim, fontSize: 12),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: blackMain,
        elevation: 0,
        titleTextStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: -0.5),
      ),
    );
  }
}
