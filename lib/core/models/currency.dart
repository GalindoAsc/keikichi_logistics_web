// lib/core/models/currency.dart

/// Monedas soportadas
enum Currency {
  usd,
  mxn,
}

extension CurrencyLabel on Currency {
  String get code {
    switch (this) {
      case Currency.usd:
        return 'USD';
      case Currency.mxn:
        return 'MXN';
    }
  }

  String get name {
    switch (this) {
      case Currency.usd:
        return 'Dólares';
      case Currency.mxn:
        return 'Pesos';
    }
  }
}
