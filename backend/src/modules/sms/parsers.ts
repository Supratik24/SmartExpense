export type ParsedSms = {
  amount: number;
  merchant: string;
  transactionDate: string;
  type: 'income' | 'expense';
  accountMask?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  parserName: string;
  confidence: number;
};

export abstract class BaseParser {
  abstract name: string;
  protected abstract patterns: RegExp[];

  parse(text: string, receivedAt?: string): ParsedSms | null {
    for (const pattern of this.patterns) {
      const match = pattern.exec(text);
      if (!match?.groups) continue;
      const groups = match.groups;
      return {
        amount: Number(groups.amount.replace(/,/g, '')),
        merchant: normalizeMerchant(groups.merchant ?? 'Unknown'),
        transactionDate: receivedAt ?? new Date().toISOString(),
        type: inferType(text),
        accountMask: groups.account,
        referenceNumber: groups.ref,
        paymentMethod: inferPaymentMethod(text),
        parserName: this.name,
        confidence: this.name === 'UPIParser' ? 0.9 : 0.86
      };
    }
    return null;
  }
}

class HDFCParser extends BaseParser {
  name = 'HDFCParser';
  protected patterns = [
    /Rs\.?\s?(?<amount>[\d,]+(?:\.\d{1,2})?)\s(?<direction>debited|credited).*?(?:A\/c|account)\s(?<account>[Xx\d*]+).*?(?:at|to|from)\s(?<merchant>[A-Z0-9 .&_-]+?)(?:\.| Ref|$)/i
  ];
}

class ICICIParser extends BaseParser {
  name = 'ICICIParser';
  protected patterns = [
    /INR\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?<direction>debited|credited).*?(?<account>[Xx*]+\d{3,4}).*?(?:Info|at|towards)\s(?<merchant>[A-Z0-9 .&_-]+?)(?:\.| Ref|$)/i
  ];
}

class SBIParser extends BaseParser {
  name = 'SBIParser';
  protected patterns = [
    /(?:Rs|INR)\.?\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?<direction>debited|credited).*?(?:A\/c|account)\s(?<account>[Xx*]+\d{3,4}).*?(?:by|at|to)\s(?<merchant>[A-Z0-9 .&_-]+?)(?:\.| Ref|$)/i
  ];
}

class AxisParser extends BaseParser {
  name = 'AxisParser';
  protected patterns = [
    /(?<direction>debited|credited).*?(?:INR|Rs\.?)\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?:A\/c|account)\s(?<account>[Xx*]+\d{3,4}).*?(?:at|to|from)\s(?<merchant>[A-Z0-9 .&_-]+?)(?:\.| Ref|$)/i
  ];
}

class KotakParser extends BaseParser {
  name = 'KotakParser';
  protected patterns = [
    /(?<account>[Xx*]+\d{3,4}).*?(?<direction>debited|credited).*?(?:Rs|INR)\.?\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?:at|to|from)\s(?<merchant>[A-Z0-9 .&_-]+?)(?:\.| Ref|$)/i
  ];
}

class CBIParser extends BaseParser {
  name = 'CBIParser';
  protected patterns = [
    /(?:CBI|Central Bank).*?(?:Rs|INR)\.?\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?<direction>debited|credited).*?(?:A\/c|account)\s(?<account>[Xx*]+\d{3,4}).*?(?:at|to|from)\s(?<merchant>[A-Z0-9 .&_-]+?)(?:\.| Ref|$)/i
  ];
}

class UPIParser extends BaseParser {
  name = 'UPIParser';
  protected patterns = [
    /(?:UPI|VPA).*?(?:Rs|INR)\.?\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?<direction>debited|credited|paid|received).*?(?:to|from|at)\s(?<merchant>[A-Z0-9 .&@_-]+?)(?:\.| UPI| Ref|$).*?(?:ref(?:erence)?(?: no)?[: ](?<ref>[A-Z0-9]+))?/i,
    /(?<direction>paid|received).*?(?:Rs|INR)\.?\s?(?<amount>[\d,]+(?:\.\d{1,2})?).*?(?:to|from)\s(?<merchant>[A-Z0-9 .&@_-]+?)(?:\.| UPI| Ref|$)/i
  ];
}

const parsers = [
  new HDFCParser(),
  new ICICIParser(),
  new SBIParser(),
  new AxisParser(),
  new KotakParser(),
  new CBIParser(),
  new UPIParser()
];

export function parseTransactionSms(text: string, receivedAt?: string) {
  for (const parser of parsers) {
    const parsed = parser.parse(text, receivedAt);
    if (parsed) return parsed;
  }
  return null;
}

function inferType(text: string): 'income' | 'expense' {
  return /credited|received|refund/i.test(text) ? 'income' : 'expense';
}

function inferPaymentMethod(text: string) {
  if (/UPI|VPA/i.test(text)) return 'UPI';
  if (/card/i.test(text)) return 'Card';
  if (/A\/c|account/i.test(text)) return 'Bank Account';
  return 'Unknown';
}

function normalizeMerchant(value: string) {
  return value.replace(/\s+/g, ' ').replace(/[^a-z0-9 .&@_-]/gi, '').trim().toUpperCase();
}
