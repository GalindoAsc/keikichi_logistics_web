// lib/core/models/trip.dart

import 'package:keikichi_logistics_web/core/models/reservation.dart';

/// Estado de viaje
enum TripStatus {
  planned,
  inProgress,
  finished,
  cancelled,
}

extension TripStatusLabel on TripStatus {
  String get label {
    switch (this) {
      case TripStatus.planned:
        return 'Planeado';
      case TripStatus.inProgress:
        return 'En curso';
      case TripStatus.finished:
        return 'Finalizado';
      case TripStatus.cancelled:
        return 'Cancelado';
    }
  }
}

/// Estado de cada espacio en la caja
enum SpaceStatus {
  free,
  reserved,
  occupied,
}

extension SpaceStatusLabel on SpaceStatus {
  String get label {
    switch (this) {
      case SpaceStatus.free:
        return 'Libre';
      case SpaceStatus.reserved:
        return 'Reservado';
      case SpaceStatus.occupied:
        return 'Ocupado';
    }
  }
}

/// Monedas soportadas para los viajes.
enum TripCurrency {
  mxn,
  usd,
}

extension TripCurrencyLabel on TripCurrency {
  String get code => this == TripCurrency.mxn ? 'MXN' : 'USD';

  String get name => this == TripCurrency.mxn ? 'Pesos' : 'Dólares';
}

/// Espacio individual dentro de la caja
class TripSpace {
  final String id;
  final String tripId;
  final int index; // número de espacio (1..N)

  SpaceStatus status;
  ReservationDetails? reservation; // detalles si está reservado / ocupado

  TripSpace({
    required this.id,
    required this.tripId,
    required this.index,
    this.status = SpaceStatus.free,
    this.reservation,
  });
}

/// Viaje
class Trip {
  final String id;
  final DateTime departureDateTime;
  final String origin;
  final String destination;
  TripStatus status;

  final int capacitySpaces;

  final TripCurrency currency;
  final double basePricePerSpace;
  final double labelPricePerUnit;
  final double bondPrice;
  final double pickupPrice;
  final bool isInternational;
  /// Tipo de cambio frente a MXN cuando la moneda base es USD.
  /// Puede ser null si no aplica.
  final double? exchangeRateToMXN;

  /// Horas antes de la salida del viaje en las que los pagos deben estar confirmados.
  /// Si una reservación no está pagada antes de este límite, se cancela automáticamente.
  /// Por defecto son 24 horas antes de la salida.
  final int paymentDeadlineHours;

  final List<TripSpace> spaces;
  final List<ReservationDetails> reservations;

  Trip({
    required this.id,
    required this.departureDateTime,
    required this.origin,
    required this.destination,
    this.status = TripStatus.planned,
    required this.capacitySpaces,
    this.currency = TripCurrency.mxn,
    this.basePricePerSpace = 100,
    this.labelPricePerUnit = 5,
    this.bondPrice = 0,
    this.pickupPrice = 0,
    this.isInternational = false,
    this.exchangeRateToMXN,
    this.paymentDeadlineHours = 24,
    required this.spaces,
    List<ReservationDetails>? reservations,
  }) : reservations = List<ReservationDetails>.from(reservations ?? const []);

  String get dateLabel {
    final d = departureDateTime.toLocal();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String get timeLabel {
    final d = departureDateTime.toLocal();
    if (d.hour == 0 && d.minute == 0) return 'Sin hora';
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  String get currencyLabel => currency.code;
}
