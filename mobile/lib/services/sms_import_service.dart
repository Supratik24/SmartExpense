import 'package:permission_handler/permission_handler.dart';
import 'package:telephony/telephony.dart';

import 'api_client.dart';

class SmsImportService {
  SmsImportService(this._apiClient);

  final ApiClient _apiClient;
  final Telephony _telephony = Telephony.instance;

  Future<bool> requestPermission() async {
    final status = await Permission.sms.request();
    return status.isGranted;
  }

  Future<int> importRecentTransactionSms() async {
    final granted = await requestPermission();
    if (!granted) return 0;

    final messages = await _telephony.getInboxSms(
      columns: [SmsColumn.ADDRESS, SmsColumn.BODY, SmsColumn.DATE],
      filter: SmsFilter.where(SmsColumn.BODY).like('%Rs%'),
      sortOrder: [OrderBy(SmsColumn.DATE, sort: Sort.DESC)],
    );

    var imported = 0;
    for (final message in messages.take(100)) {
      final body = message.body;
      if (body == null || !_looksLikeTransaction(body)) continue;
      try {
        await _apiClient.importSms(body, sender: message.address);
        imported += 1;
      } catch (_) {
        // Unsupported bank formats are expected while parser coverage grows.
      }
    }
    return imported;
  }

  bool _looksLikeTransaction(String body) {
    final text = body.toLowerCase();
    final hasMoney = text.contains('rs') || text.contains('inr');
    final hasTransactionWord = text.contains('debited') ||
        text.contains('credited') ||
        text.contains('paid') ||
        text.contains('received') ||
        text.contains('upi');
    return hasMoney && hasTransactionWord;
  }
}
