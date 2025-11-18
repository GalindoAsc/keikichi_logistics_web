// lib/core/models/trip.dart

import 'package:keikichi_logistics_web/core/models/currency.dart';
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
  blocked,
  cancelled,
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
      case SpaceStatus.blocked:
        return 'Bloqueado';
      case SpaceStatus.cancelled:
        return 'Cancelado';
    }
  }
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

  // Configuración económica por viaje
  final bool isInternational; // true = viaje internacional → fianza disponible
  final Currency currencyBase; // moneda base (USD o MXN)
  final double exchangeRateToMxn; // 1 USD = X MXN

  final double basePricePerSpace;
  final double labelPrintPricePerLabel;
  final double bondPrice; // costo de usar la fianza de Keikichi (en moneda base)
  final double pickupPrice; // costo de recolección (en moneda base)

  final List<TripSpace> spaces;

  Trip({
    required this.id,
    required this.departureDateTime,
    required this.origin,
    required this.destination,
    this.status = TripStatus.planned,
    required this.capacitySpaces,
    required this.isInternational,
    required this.currencyBase,
    required this.exchangeRateToMxn,
    required this.basePricePerSpace,
    required this.labelPrintPricePerLabel,
    required this.bondPrice,
    required this.pickupPrice,
    required this.spaces,
  });

  String get dateLabel {
    final d = departureDateTime.toLocal();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String get timeLabel {
    final d = departureDateTime.toLocal();
    if (d.hour == 0 && d.minute == 0) return 'Sin hora';
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
