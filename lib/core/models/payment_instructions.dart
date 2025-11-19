import 'package:flutter/foundation.dart';

class PaymentInstructions {
  final String bankName;
  final String accountName;
  final String accountNumber;
  final String clabe;
  final String referenceHint;

  const PaymentInstructions({
    required this.bankName,
    required this.accountName,
    required this.accountNumber,
    required this.clabe,
    required this.referenceHint,
  });

  PaymentInstructions copyWith({
    String? bankName,
    String? accountName,
    String? accountNumber,
    String? clabe,
    String? referenceHint,
  }) {
    return PaymentInstructions(
      bankName: bankName ?? this.bankName,
      accountName: accountName ?? this.accountName,
      accountNumber: accountNumber ?? this.accountNumber,
      clabe: clabe ?? this.clabe,
      referenceHint: referenceHint ?? this.referenceHint,
    );
  }

  static PaymentInstructions demoDefault() => const PaymentInstructions(
        bankName: 'Banco Demo',
        accountName: 'Keikichi Produce S.A. de C.V.',
        accountNumber: '0000000000',
        clabe: '000000000000000000',
        referenceHint: 'Usa el código de orden como referencia.',
      );
}

class PaymentConfig {
  static PaymentInstructions current = PaymentInstructions.demoDefault();

  static ValueListenable<PaymentInstructions> get listenable =>
      _paymentNotifier;

  static final ValueNotifier<PaymentInstructions> _paymentNotifier =
      ValueNotifier<PaymentInstructions>(PaymentInstructions.demoDefault());

  static void update(PaymentInstructions instructions) {
    current = instructions;
    _paymentNotifier.value = instructions;
  }
}
