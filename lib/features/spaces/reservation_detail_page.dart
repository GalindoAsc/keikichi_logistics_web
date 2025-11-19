import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/payment_instructions.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';
import 'package:keikichi_logistics_web/widgets/copy_text_button.dart';

class ReservationDetailPage extends StatefulWidget {
  final ReservationDetails reservation;
  final Trip trip;
  final AppUser currentUser;
  final Function(ReservationDetails)? onReservationUpdated;

  const ReservationDetailPage({
    super.key,
    required this.reservation,
    required this.trip,
    required this.currentUser,
    this.onReservationUpdated,
  });

  @override
  State<ReservationDetailPage> createState() => _ReservationDetailPageState();
}

class _ReservationDetailPageState extends State<ReservationDetailPage> {
  late ReservationDetails _reservation;

  @override
  void initState() {
    super.initState();
    _reservation = widget.reservation;
  }

  bool get _isAdmin =>
      widget.currentUser.role == UserRole.superAdmin ||
      widget.currentUser.role == UserRole.manager;

  bool get _isOwner => _reservation.customerId == widget.currentUser.id;

  Color _getStatusColor() {
    switch (_reservation.status) {
      case ReservationStatus.pending:
        return Colors.orange;
      case ReservationStatus.paid:
        return Colors.green;
      case ReservationStatus.cancelled:
        return Colors.red;
    }
  }

  String _getStatusLabel() {
    switch (_reservation.status) {
      case ReservationStatus.pending:
        return 'Pendiente';
      case ReservationStatus.paid:
        return 'Pagada';
      case ReservationStatus.cancelled:
        return 'Cancelada';
    }
  }

  void _updateReservation(ReservationDetails updated) {
    setState(() {
      _reservation = updated;
    });
    widget.onReservationUpdated?.call(updated);
  }

  Future<void> _handleUploadReceipt() async {
    if (_reservation.status != ReservationStatus.pending) return;
    if (!_isOwner && !_isAdmin) return;

    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Subir comprobante de pago'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Por ahora, ingresa el nombre del archivo simulado:',
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Nombre del archivo',
                hintText: 'comprobante_001.pdf',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Subir'),
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      final updated = _reservation.copyWith(
        paymentReceiptFileName: result,
        status: ReservationStatus.paid,
      );
      _updateReservation(updated);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comprobante subido y reservación marcada como pagada'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _handleMarkAsPaid() async {
    if (!_isAdmin) return;
    if (_reservation.status != ReservationStatus.pending) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Marcar como pagada'),
        content: const Text(
          '¿Estás seguro de que deseas marcar esta reservación como pagada?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Marcar como pagada'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final updated = _reservation.copyWith(status: ReservationStatus.paid);
      _updateReservation(updated);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reservación marcada como pagada'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _handleMarkAsPending() async {
    if (!_isAdmin) return;
    if (_reservation.status != ReservationStatus.paid) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Marcar como pendiente'),
        content: const Text(
          '¿Estás seguro de que deseas marcar esta reservación como pendiente?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Marcar como pendiente'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final updated = _reservation.copyWith(status: ReservationStatus.pending);
      _updateReservation(updated);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reservación marcada como pendiente'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _handleCancelReservation() async {
    if (!_isOwner && !_isAdmin) return;
    if (_reservation.status == ReservationStatus.cancelled) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar reservación'),
        content: const Text(
          '¿Estás seguro de que deseas cancelar esta reservación?\n\n'
          'Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final updated = _reservation.copyWith(status: ReservationStatus.cancelled);
      _updateReservation(updated);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reservación cancelada'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Widget _buildInfoCard(String title, List<Widget> children) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildCopyableField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: CopyableText(label: label, value: value),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateFormatter = DateFormat('dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Orden ${_reservation.orderCode}'),
            Text(
              '${widget.trip.origin} → ${widget.trip.destination}',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Chip(
              label: Text(_getStatusLabel()),
              backgroundColor: _getStatusColor(),
              labelStyle: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Información general
            _buildInfoCard(
              'Información general',
              [
                _buildCopyableField('Código de orden', _reservation.orderCode),
                _buildCopyableField('Cliente', _reservation.customerName),
                _buildCopyableField(
                  'Viaje',
                  '${widget.trip.id} · ${widget.trip.origin} → ${widget.trip.destination}',
                ),
                _buildCopyableField(
                  'Fecha de salida',
                  dateFormatter.format(widget.trip.departureDateTime),
                ),
                _buildCopyableField(
                  'Espacios reservados',
                  _reservation.spaceIndexes.join(', '),
                ),
              ],
            ),

            // Contacto y destino
            _buildInfoCard(
              'Contacto y destino',
              [
                if (_reservation.contactName != null)
                  _buildCopyableField('Contacto', _reservation.contactName!),
                if (_reservation.contactPhone != null)
                  _buildCopyableField('Teléfono', _reservation.contactPhone!),
                _buildCopyableField(
                  'Dirección de destino',
                  _reservation.destinationAddress,
                ),
                if (_reservation.destinationNotes != null &&
                    _reservation.destinationNotes!.isNotEmpty)
                  _buildCopyableField('Notas', _reservation.destinationNotes!),
              ],
            ),

            // Productos
            if (_reservation.products.isNotEmpty)
              _buildInfoCard(
                'Productos',
                [
                  ..._reservation.products.map(
                    (product) => Card(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildCopyableField('Producto', product.name),
                            _buildCopyableField(
                              'Cantidad',
                              '${product.quantity} ${product.unit}',
                            ),
                            if (product.weightPerUnit != null)
                              _buildCopyableField(
                                'Peso por unidad',
                                '${product.weightPerUnit} kg',
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

            // Etiquetas
            if (_reservation.labels.isNotEmpty)
              _buildInfoCard(
                'Etiquetas',
                [
                  ..._reservation.labels.map(
                    (label) => Card(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildCopyableField('Etiqueta', label.labelName),
                            _buildCopyableField(
                              'Cantidad',
                              label.quantityToPrint.toString(),
                            ),
                            if (label.fileName != null)
                              _buildCopyableField('Archivo', label.fileName!),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

            // Logística/Recolección
            if (!_reservation.customerDeliversToWarehouse)
              _buildInfoCard(
                'Logística y recolección',
                [
                  if (_reservation.pickupAddress != null)
                    _buildCopyableField(
                      'Dirección de recolección',
                      _reservation.pickupAddress!,
                    ),
                  if (_reservation.pickupContactName != null)
                    _buildCopyableField(
                      'Contacto de recolección',
                      _reservation.pickupContactName!,
                    ),
                  if (_reservation.pickupContactPhone != null)
                    _buildCopyableField(
                      'Teléfono de recolección',
                      _reservation.pickupContactPhone!,
                    ),
                  if (_reservation.pickupDateTime != null)
                    _buildCopyableField(
                      'Fecha de recolección',
                      dateFormatter.format(_reservation.pickupDateTime!),
                    ),
                ],
              ),

            // Desglose de costos
            _buildInfoCard(
              'Desglose de costos',
              [
                _buildCopyableField(
                  'Subtotal de espacios',
                  '\$${_reservation.spacesSubtotal.toStringAsFixed(2)} ${widget.trip.currency.code}',
                ),
                if (_reservation.labelsSubtotal > 0)
                  _buildCopyableField(
                    'Subtotal de etiquetas',
                    '\$${_reservation.labelsSubtotal.toStringAsFixed(2)} ${widget.trip.currency.code}',
                  ),
                if (_reservation.bondSubtotal > 0)
                  _buildCopyableField(
                    'Subtotal de fianza',
                    '\$${_reservation.bondSubtotal.toStringAsFixed(2)} ${widget.trip.currency.code}',
                  ),
                if (_reservation.logisticsSubtotal > 0)
                  _buildCopyableField(
                    'Subtotal de logística',
                    '\$${_reservation.logisticsSubtotal.toStringAsFixed(2)} ${widget.trip.currency.code}',
                  ),
                const Divider(height: 24),
                _buildCopyableField(
                  'TOTAL',
                  '\$${_reservation.totalAmount.toStringAsFixed(2)} ${widget.trip.currency.code}',
                ),
              ],
            ),

            // Información de pago
            _buildInfoCard(
              'Información de pago',
              [
                _buildCopyableField(
                  'Método de pago',
                  _reservation.paymentMethod == 'transferencia'
                      ? 'Transferencia bancaria'
                      : 'Efectivo',
                ),
                if (_reservation.paymentMethod == 'transferencia') ...[
                  const SizedBox(height: 8),
                  const Text(
                    'Datos bancarios:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  _buildCopyableField('Banco', PaymentConfig.current.bankName),
                  _buildCopyableField(
                    'Cuenta',
                    PaymentConfig.current.accountName,
                  ),
                  _buildCopyableField(
                    'Número de cuenta',
                    PaymentConfig.current.accountNumber,
                  ),
                  _buildCopyableField('CLABE', PaymentConfig.current.clabe),
                  _buildCopyableField(
                    'Referencia sugerida',
                    _reservation.orderCode,
                  ),
                ],
                if (_reservation.paymentReceiptFileName != null) ...[
                  const SizedBox(height: 8),
                  _buildCopyableField(
                    'Comprobante',
                    _reservation.paymentReceiptFileName!,
                  ),
                ],
              ],
            ),

            const SizedBox(height: 16),

            // Botones de acción
            if (_reservation.status != ReservationStatus.cancelled) ...[
              // Subir comprobante
              if (_reservation.status == ReservationStatus.pending &&
                  (_isOwner || _isAdmin))
                FilledButton.icon(
                  onPressed: _handleUploadReceipt,
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Subir comprobante de pago'),
                ),

              const SizedBox(height: 8),

              // Marcar como pagada
              if (_isAdmin && _reservation.status == ReservationStatus.pending)
                FilledButton.icon(
                  onPressed: _handleMarkAsPaid,
                  icon: const Icon(Icons.check_circle),
                  label: const Text('Marcar como pagada'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                ),

              const SizedBox(height: 8),

              // Marcar como pendiente
              if (_isAdmin && _reservation.status == ReservationStatus.paid)
                FilledButton.icon(
                  onPressed: _handleMarkAsPending,
                  icon: const Icon(Icons.pending),
                  label: const Text('Marcar como pendiente'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.orange,
                  ),
                ),

              const SizedBox(height: 8),

              // Cancelar reservación
              if (_isOwner || _isAdmin)
                OutlinedButton.icon(
                  onPressed: _handleCancelReservation,
                  icon: const Icon(Icons.cancel),
                  label: const Text('Cancelar reservación'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                  ),
                ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
