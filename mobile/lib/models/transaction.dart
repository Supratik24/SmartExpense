class ExpenseTransaction {
  ExpenseTransaction({
    required this.id,
    required this.amount,
    required this.category,
    required this.merchant,
    required this.transactionDate,
    required this.type,
    required this.source,
    this.paymentMethod,
  });

  final String id;
  final double amount;
  final String category;
  final String merchant;
  final DateTime transactionDate;
  final String type;
  final String source;
  final String? paymentMethod;

  factory ExpenseTransaction.fromJson(Map<String, dynamic> json) {
    return ExpenseTransaction(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      category: json['category'] as String,
      merchant: json['merchant'] as String,
      transactionDate: DateTime.parse(json['transactionDate'] as String),
      type: json['type'] as String,
      source: json['source'] as String,
      paymentMethod: json['paymentMethod'] as String?,
    );
  }
}
