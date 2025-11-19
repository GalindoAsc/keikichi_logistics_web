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
  final String orderCode;
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
    required this.orderCode,
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

  ReservationDetails copyWith({
    String? id,
    String? orderCode,
    String? customerName,
    String? contactName,
    String? contactPhone,
    String? destinationAddress,
    String? destinationNotes,
    bool? saveDestinationForLater,
    bool? customerDeliversToWarehouse,
    String? pickupAddress,
    String? pickupContactName,
    String? pickupContactPhone,
    DateTime? pickupDateTime,
    bool? usesCustomerBond,
    bool? usesKeikichiBond,
    List<ProductLine>? products,
    List<LabelAssignment>? labels,
    ReservationStatus? status,
    String? paymentMethod,
    String? paymentReceiptFileName,
    List<int>? spaceIndexes,
    double? spacesSubtotal,
    double? labelsSubtotal,
    double? bondSubtotal,
    double? logisticsSubtotal,
    double? totalAmount,
  }) {
    return ReservationDetails(
      id: id ?? this.id,
      orderCode: orderCode ?? this.orderCode,
      customerName: customerName ?? this.customerName,
      contactName: contactName ?? this.contactName,
      contactPhone: contactPhone ?? this.contactPhone,
      destinationAddress: destinationAddress ?? this.destinationAddress,
      destinationNotes: destinationNotes ?? this.destinationNotes,
      saveDestinationForLater:
          saveDestinationForLater ?? this.saveDestinationForLater,
      customerDeliversToWarehouse:
          customerDeliversToWarehouse ?? this.customerDeliversToWarehouse,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      pickupContactName: pickupContactName ?? this.pickupContactName,
      pickupContactPhone: pickupContactPhone ?? this.pickupContactPhone,
      pickupDateTime: pickupDateTime ?? this.pickupDateTime,
      usesCustomerBond: usesCustomerBond ?? this.usesCustomerBond,
      usesKeikichiBond: usesKeikichiBond ?? this.usesKeikichiBond,
      products: products ?? this.products,
      labels: labels ?? this.labels,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentReceiptFileName:
          paymentReceiptFileName ?? this.paymentReceiptFileName,
      spaceIndexes: spaceIndexes ?? this.spaceIndexes,
      spacesSubtotal: spacesSubtotal ?? this.spacesSubtotal,
      labelsSubtotal: labelsSubtotal ?? this.labelsSubtotal,
      bondSubtotal: bondSubtotal ?? this.bondSubtotal,
      logisticsSubtotal: logisticsSubtotal ?? this.logisticsSubtotal,
      totalAmount: totalAmount ?? this.totalAmount,
    );
  }
}
