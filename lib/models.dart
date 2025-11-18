// lib/models.dart

// Monedas soportadas
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

// Roles de usuario (futuro)
enum UserRole {
  superAdmin,
  manager,
  customer,
}

extension UserRoleLabel on UserRole {
  String get label {
    switch (this) {
      case UserRole.superAdmin:
        return 'SuperAdmin';
      case UserRole.manager:
        return 'Gerente';
      case UserRole.customer:
        return 'Cliente';
    }
  }
}

// Estado de viaje
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

// Estado de cada espacio en la caja
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

// Estado del pago de la reservación
enum PaymentStatus {
  pending,
  paid,
  cancelled,
}

extension PaymentStatusLabel on PaymentStatus {
  String get label {
    switch (this) {
      case PaymentStatus.pending:
        return 'Pendiente de pago';
      case PaymentStatus.paid:
        return 'Pagado';
      case PaymentStatus.cancelled:
        return 'Cancelado';
    }
  }
}

// Línea de producto dentro de una reservación (tarima)
class ProductLine {
  String productName;
  int quantity;
  String unit; // cajas, bolsas, cubetas, etc.
  double? unitWeightLbs;

  ProductLine({
    required this.productName,
    required this.quantity,
    required this.unit,
    this.unitWeightLbs,
  });

  double get totalWeightLbs => (unitWeightLbs ?? 0) * quantity;
}

// Asignación de etiquetas por producto
class ProductLabelAssignment {
  String productName;
  String labelFileName;
  int labelsCount;

  ProductLabelAssignment({
    required this.productName,
    required this.labelFileName,
    required this.labelsCount,
  });
}

// Detalles de la reservación de una tarima asociada a uno o varios espacios
class ReservationDetails {
  String customerName; // Emisor / dueño de la cuenta

  // Destino detallado
  String destinationName; // Nombre de destino (bodega/rancho)
  String? destinationContactName; // Persona/empresa receptora
  String? destinationAddress; // Dirección
  String? destinationReference; // Referencias de dirección

  List<ProductLine> products;

  // Etiquetas
  bool clientProvidesLabels; // true = ya llega etiquetado
  List<String> labelFileNames; // archivos de etiquetas disponibles en esta reserva
  List<ProductLabelAssignment>
      productLabels; // etiqueta y cantidad por producto

  // Fianza
  bool usesClientBond;
  String? clientBondFileName;
  bool usesKeikichiBond;

  // Logística
  bool pickupByKeikichi; // true = se recoge en origen, false = cliente lleva a bodega

  // Pago
  PaymentStatus paymentStatus;
  double totalPrice; // precio total calculado en la moneda base del viaje

  String? notes;

  ReservationDetails({
    required this.customerName,
    required this.destinationName,
    this.destinationContactName,
    this.destinationAddress,
    this.destinationReference,
    required this.products,
    required this.clientProvidesLabels,
    required this.labelFileNames,
    required this.productLabels,
    required this.usesClientBond,
    this.clientBondFileName,
    required this.usesKeikichiBond,
    required this.pickupByKeikichi,
    required this.paymentStatus,
    required this.totalPrice,
    this.notes,
  });
}

// Espacio individual dentro de la caja
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

// Viaje
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