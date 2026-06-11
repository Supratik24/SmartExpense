import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../models/transaction.dart';

class ApiClient {
  ApiClient({this.baseUrl = 'http://10.0.2.2:4000/api'});

  final String baseUrl;
  final _storage = const FlutterSecureStorage();

  Future<void> login(String email, String password) async {
    final response = await _post('/auth/login', {'email': email, 'password': password}, authenticated: false);
    await _storage.write(key: 'accessToken', value: response['accessToken'] as String);
    await _storage.write(key: 'refreshToken', value: response['refreshToken'] as String);
  }

  Future<void> signup(String name, String email, String password) async {
    final response = await _post('/auth/signup', {'name': name, 'email': email, 'password': password}, authenticated: false);
    await _storage.write(key: 'accessToken', value: response['accessToken'] as String);
    await _storage.write(key: 'refreshToken', value: response['refreshToken'] as String);
  }

  Future<List<ExpenseTransaction>> transactions() async {
    final response = await _get('/transactions');
    return (response as List).map((item) => ExpenseTransaction.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> importSms(String text, {String? sender}) async {
    await _post('/sms/import', {
      'text': text,
      'sender': sender,
      'receivedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  Future<dynamic> _get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: await _headers());
    return _decode(response);
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body, {bool authenticated = true}) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(authenticated: authenticated),
      body: jsonEncode(body),
    );
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, String>> _headers({bool authenticated = true}) async {
    final headers = {'content-type': 'application/json'};
    if (authenticated) {
      final token = await _storage.read(key: 'accessToken');
      if (token != null) headers['authorization'] = 'Bearer $token';
    }
    return headers;
  }

  dynamic _decode(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(body['message'] ?? 'Request failed');
    }
    if (response.body.isEmpty) return null;
    return jsonDecode(response.body);
  }
}
