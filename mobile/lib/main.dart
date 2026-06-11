import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/api_client.dart';

void main() {
  runApp(const SmartExpenseApp());
}

class SmartExpenseApp extends StatefulWidget {
  const SmartExpenseApp({super.key});

  @override
  State<SmartExpenseApp> createState() => _SmartExpenseAppState();
}

class _SmartExpenseAppState extends State<SmartExpenseApp> {
  final apiClient = ApiClient();
  bool authenticated = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartExpense AI',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1677FF)),
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
        useMaterial3: true,
      ),
      home: authenticated
          ? HomeScreen(apiClient: apiClient)
          : LoginScreen(apiClient: apiClient, onAuthenticated: () => setState(() => authenticated = true)),
    );
  }
}
