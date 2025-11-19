import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';
import 'package:keikichi_logistics_web/features/spaces/reservation_detail_page.dart';

class AdminDashboardPage extends StatelessWidget {
  final AppUser currentUser;
  final List<Trip> trips;
  const AdminDashboardPage({
    super.key,
    required this.currentUser,
    required this.trips,
  });

  @override
  Widget build(BuildContext context) {
    final tripCards = trips.isEmpty
        ? [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'No hay viajes registrados aún.',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text('Crea un viaje desde la sección de Viajes para comenzar.'),
                  ],
                ),
              ),
            )
          ]
        : trips
            .map(
              (trip) => Card(
                margin: const EdgeInsets.symmetric(vertical: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Viaje ${trip.id} · ${trip.origin} → ${trip.destination}',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text('Salida: ${trip.dateLabel} · ${trip.timeLabel}'),
                      Text('Reservaciones: ${trip.reservations.length}'),
                      const SizedBox(height: 16),
                      if (trip.reservations.isEmpty)
                        const Text('Aún no hay reservaciones para este viaje.')
                      else
                        _TripReservationsTable(
                          trip: trip,
                          currentUser: currentUser,
                        ),
                    ],
                  ),
                ),
              ),
            )
            .toList();

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Card(
          child: ListTile(
            leading: const Icon(Icons.admin_panel_settings),
            title: Text('Bienvenido, ${currentUser.name}'),
            subtitle: Text('Rol: ${currentUser.role.label}'),
          ),
        ),
        const SizedBox(height: 16),
        ...tripCards,
      ],
    );
  }
}

class _TripReservationsTable extends StatefulWidget {
  final Trip trip;
  final AppUser currentUser;
  final Function(Trip)? onTripUpdated;

  const _TripReservationsTable({
    required this.trip,
    required this.currentUser,
    this.onTripUpdated,
  });

  @override
  State<_TripReservationsTable> createState() => _TripReservationsTableState();
}

class _TripReservationsTableState extends State<_TripReservationsTable> {
  void _openReservationDetail(ReservationDetails reservation) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ReservationDetailPage(
          reservation: reservation,
          trip: widget.trip,
          currentUser: widget.currentUser,
          onReservationUpdated: (updated) {
            setState(() {
              final index = widget.trip.reservations.indexWhere(
                (r) => r.id == updated.id,
              );
              if (index != -1) {
                widget.trip.reservations[index] = updated;
              }
            });
            widget.onTripUpdated?.call(widget.trip);
          },
        ),
      ),
    );
  }

  static String _statusLabel(ReservationStatus status) {
    switch (status) {
      case ReservationStatus.pending:
        return 'Pendiente';
      case ReservationStatus.paid:
        return 'Pagada';
      case ReservationStatus.cancelled:
        return 'Cancelada';
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columns: const [
          DataColumn(label: Text('Orden')),
          DataColumn(label: Text('Cliente')),
          DataColumn(label: Text('Estado')),
          DataColumn(label: Text('Total')),
          DataColumn(label: Text('Espacios')),
          DataColumn(label: Text('Acciones')),
        ],
        rows: widget.trip.reservations
            .map(
              (reservation) => DataRow(
                cells: [
                  DataCell(Text(reservation.orderCode)),
                  DataCell(Text(reservation.customerName)),
                  DataCell(Text(_statusLabel(reservation.status))),
                  DataCell(Text(
                      '\$${reservation.totalAmount.toStringAsFixed(2)} ${widget.trip.currency.code}')),
                  DataCell(Text(reservation.spaceIndexes.join(', '))),
                  DataCell(
                    IconButton(
                      icon: const Icon(Icons.visibility),
                      tooltip: 'Ver detalle',
                      onPressed: () => _openReservationDetail(reservation),
                    ),
                  ),
                ],
              ),
            )
            .toList(),
      ),
    );
  }
}
