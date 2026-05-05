import 'package:flutter/material.dart' hide RoundedRectangleBorder;
import 'package:flutter/material.dart' as material;
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // EUSAI Web "Command Center" Palette
  static const Color blackRail = Color(0xFF000000);   
  static const Color blackSidebar = Color(0xFF0A0A0A); 
  static const Color blackMain = Color(0xFF050505);    
  static const Color blackBubble = Color(0xFF1A1A1A);  
  static const Color eusaiBlue = Color(0xFF2563EB);    
  static const Color eusaiNeon = Color(0xFF60A5FA);    
  static const Color textMain = Color(0xFFFFFFFF);
  static const Color textDim = Color(0x66FFFFFF);     
  static const Color textMicro = Color(0x33FFFFFF);    

  // Premium Accents
  static const Color accentOrange = Color(0xFFF97316);
  static const Color accentPurple = Color(0xFF8B5CF6);
  static const Color glassWhite = Color(0x0FFFFFFF);
  static const Color glassBorder = Color(0x1AFFFFFF);

  static LinearGradient get primaryGradient => const LinearGradient(
    colors: [Color(0xFF1E40AF), Color(0xFF2563EB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get darkGradient => const LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF020617)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get accentGradient => const LinearGradient(
    colors: [Color(0xFFEA580C), Color(0xFFF97316)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static BoxDecoration get glassDecoration => BoxDecoration(
    color: glassWhite,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: glassBorder),
  );

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
        error: Colors.redAccent,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
          color: textMain,
        ),
        bodyLarge: const TextStyle(color: textMain, fontSize: 14, fontWeight: FontWeight.w600),
        bodyMedium: const TextStyle(color: textDim, fontSize: 13, fontWeight: FontWeight.w500),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5),
      ),
      cardTheme: CardTheme(
        color: blackSidebar,
        shape: material.RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 0,
      ),
    );
  }
}
