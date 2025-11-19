// lib/core/models/reservation.dart

/// Estado actual de la reservación / pago.
enum ReservationStatus {
  pending,
  paid,
  cancelled,
}

/// Línea de producto dentro de una reservación.
class ProductLine {
  final String id;
  final String name;
  final int quantity;
  final String unit;
  final double? weightPerUnit;

  const ProductLine({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unit,
    this.weightPerUnit,
  });
}

/// Configuración de impresión de etiquetas asociadas a un producto.
class LabelAssignment {
  final String id;
  final String productLineId;
  final String labelName;
  final String? fileName;
  final int quantityToPrint;

  const LabelAssignment({
    required this.id,
    required this.productLineId,
    required this.labelName,
    this.fileName,
    required this.quantityToPrint,
  });
}

/// Detalle completo de la reservación de espacios.
class ReservationDetails {
  final String id;
  final String customerName;

  final String? contactName;
  final String? contactPhone;
  final String destinationAddress;
  final String? destinationNotes;
  final bool saveDestinationForLater;

  final bool customerDeliversToWarehouse;

  final String? pickupAddress;
  final String? pickupContactName;
  final String? pickupContactPhone;
  final DateTime? pickupDateTime;

  final bool usesCustomerBond;
  final bool usesKeikichiBond;

  final List<ProductLine> products;
  final List<LabelAssignment> labels;

  final ReservationStatus status;
  final String? paymentMethod;
  final String? paymentReceiptFileName;

  final List<int> spaceIndexes;

  final double spacesSubtotal;
  final double labelsSubtotal;
  final double bondSubtotal;
  final double logisticsSubtotal;
  final double totalAmount;

  const ReservationDetails({
    required this.id,
    required this.customerName,
    required this.contactName,
    required this.contactPhone,
    required this.destinationAddress,
    required this.destinationNotes,
    required this.saveDestinationForLater,
    required this.customerDeliversToWarehouse,
    this.pickupAddress,
    this.pickupContactName,
    this.pickupContactPhone,
    this.pickupDateTime,
    required this.usesCustomerBond,
    required this.usesKeikichiBond,
    required this.products,
    required this.labels,
    required this.status,
    required this.paymentMethod,
    required this.paymentReceiptFileName,
    required this.spaceIndexes,
    required this.spacesSubtotal,
    required this.labelsSubtotal,
    required this.bondSubtotal,
    required this.logisticsSubtotal,
    required this.totalAmount,
  });
}
