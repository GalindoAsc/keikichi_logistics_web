// lib/core/models/reservation.dart

/// Estado del pago de la reservación
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

/// Línea de producto dentro de una reservación (tarima)
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

/// Asignación de etiquetas por producto
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

/// Detalles de la reservación de una tarima asociada a uno o varios espacios
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
