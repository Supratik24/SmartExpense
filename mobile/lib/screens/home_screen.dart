import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/transaction.dart';
import '../services/api_client.dart';
import '../services/sms_import_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.apiClient});

  final ApiClient apiClient;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final SmsImportService smsImportService;
  List<ExpenseTransaction> transactions = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    smsImportService = SmsImportService(widget.apiClient);
    load();
  }

  Future<void> load() async {
    setState(() => loading = true);
    try {
      transactions = await widget.apiClient.transactions();
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> importSms() async {
    final count = await smsImportService.importRecentTransactionSms();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Imported $count SMS transactions')));
    await load();
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs.');
    return Scaffold(
      appBar: AppBar(title: const Text('SmartExpense AI'), actions: [IconButton(onPressed: load, icon: const Icon(Icons.refresh))]),
      floatingActionButton: FloatingActionButton.extended(onPressed: importSms, icon: const Icon(Icons.sms), label: const Text('Import SMS')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: load,
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                itemCount: transactions.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final tx = transactions[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(tx.merchant),
                    subtitle: Text('${tx.category} • ${tx.source} • ${DateFormat.yMMMd().format(tx.transactionDate)}'),
                    trailing: Text(currency.format(tx.amount), style: TextStyle(color: tx.type == 'expense' ? Colors.red : Colors.green)),
                  );
                },
              ),
            ),
    );
  }
}
