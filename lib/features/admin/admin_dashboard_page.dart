import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';

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
                        _TripReservationsTable(trip: trip),
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

class _TripReservationsTable extends StatelessWidget {
  final Trip trip;
  const _TripReservationsTable({required this.trip});

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
        ],
        rows: trip.reservations
            .map(
              (reservation) => DataRow(
                cells: [
                  DataCell(Text(reservation.orderCode)),
                  DataCell(Text(reservation.customerName)),
                  DataCell(Text(_statusLabel(reservation.status))),
                  DataCell(Text(
                      '\$${reservation.totalAmount.toStringAsFixed(2)} ${trip.currency.code}')),
                  DataCell(Text(reservation.spaceIndexes.join(', '))),
                ],
              ),
            )
            .toList(),
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
}
