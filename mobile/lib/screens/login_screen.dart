import 'package:flutter/material.dart';

import '../services/api_client.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.apiClient, required this.onAuthenticated});

  final ApiClient apiClient;
  final VoidCallback onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController(text: 'demo@smartexpense.ai');
  final password = TextEditingController(text: 'Password123');
  bool isSignup = false;
  bool loading = false;
  String? error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('SmartExpense AI', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text('Automatic SMS expense tracking and analytics.'),
              const SizedBox(height: 28),
              TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 12),
              TextField(controller: password, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
              if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: const TextStyle(color: Colors.red))),
              const SizedBox(height: 18),
              FilledButton(onPressed: loading ? null : submit, child: Text(isSignup ? 'Create account' : 'Log in')),
              TextButton(onPressed: () => setState(() => isSignup = !isSignup), child: Text(isSignup ? 'Use existing account' : 'Create new account')),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> submit() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      if (isSignup) {
        await widget.apiClient.signup('Mobile User', email.text, password.text);
      } else {
        await widget.apiClient.login(email.text, password.text);
      }
      widget.onAuthenticated();
    } catch (exception) {
      setState(() => error = exception.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}
