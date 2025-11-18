import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/features/spaces/reservation_dialog.dart';

const bool kCurrentCustomerIsVerified = true;
const String kCurrentCustomerName = 'Cliente Demo Keikichi';

class SpacesPage extends StatefulWidget {
  final List<Trip> trips;
  final Trip? initialTrip;

  const SpacesPage({
    super.key,
    required this.trips,
    this.initialTrip,
  });

  @override
  State<SpacesPage> createState() => _SpacesPageState();
}

class _SpacesPageState extends State<SpacesPage> {
  Trip? _selectedTrip;
  final List<int> _selectedSpaceIndexes = [];

  @override
  void initState() {
    super.initState();
    _selectedTrip =
        widget.initialTrip ?? (widget.trips.isNotEmpty ? widget.trips.first : null);
  }

  Color _spaceColor(SpaceStatus status, ThemeData theme) {
    final scheme = theme.colorScheme;
    switch (status) {
      case SpaceStatus.free:
        return scheme.surface;
      case SpaceStatus.reserved:
        return scheme.tertiaryContainer;
      case SpaceStatus.occupied:
        return scheme.primaryContainer;
    }
  }

  String _shortStatus(SpaceStatus status) {
    switch (status) {
      case SpaceStatus.free:
        return 'Libre';
      case SpaceStatus.reserved:
        return 'Reservado';
      case SpaceStatus.occupied:
        return 'Ocupado';
    }
  }

  bool _isSpaceSelectable(TripSpace space) {
    return space.status == SpaceStatus.free;
  }

  void _toggleSpaceSelection(TripSpace space) {
    setState(() {
      if (_selectedSpaceIndexes.contains(space.index)) {
        _selectedSpaceIndexes.remove(space.index);
      } else {
        _selectedSpaceIndexes.add(space.index);
      }
    });
  }

  String _reservationStatusLabel(ReservationStatus status) {
    switch (status) {
      case ReservationStatus.pending:
        return 'Pendiente';
      case ReservationStatus.paid:
        return 'Pagada';
      case ReservationStatus.cancelled:
        return 'Cancelada';
    }
  }

  Future<void> _handleReservationPressed() async {
    final trip = _selectedTrip;
    if (trip == null || _selectedSpaceIndexes.isEmpty) return;

    if (!kCurrentCustomerIsVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Tu cuenta aún no ha sido verificada por un gerente. No puedes reservar espacios por el momento.',
          ),
        ),
      );
      return;
    }

    final sortedSelection = List<int>.from(_selectedSpaceIndexes)..sort();

    final reservation = await showReservationDialog(
      context: context,
      trip: trip,
      selectedSpaceIndexes: sortedSelection,
      currentCustomerName: kCurrentCustomerName,
    );

    if (reservation == null) return;

    setState(() {
      trip.reservations = [...trip.reservations, reservation];
      for (final spaceIndex in reservation.spaceIndexes) {
        final listIndex = spaceIndex - 1;
        if (listIndex >= 0 && listIndex < trip.spaces.length) {
          final space = trip.spaces[listIndex];
          space.status = SpaceStatus.reserved;
          space.reservation = reservation;
        }
      }
      _selectedSpaceIndexes.clear();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Reserva creada para ${reservation.spaceIndexes.length} espacio(s). Estado: Pendiente de pago.',
        ),
      ),
    );
  }

  Widget _buildTripSummary(Trip trip) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${trip.origin} → ${trip.destination}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text('Salida: ${trip.dateLabel} · ${trip.timeLabel}'),
            Text('Capacidad total: ${trip.capacitySpaces} espacios'),
            Text('Moneda: ${trip.currency.code}'),
            const Divider(height: 24),
            Text('Precio base por espacio: \$${trip.basePricePerSpace.toStringAsFixed(2)} ${trip.currency.code}'),
            Text('Precio por etiqueta: \$${trip.labelPricePerUnit.toStringAsFixed(2)} ${trip.currency.code}'),
            if (trip.isInternational)
              Text('Fianza Keikichi: \$${trip.bondPrice.toStringAsFixed(2)} ${trip.currency.code}'),
            Text('Recolección: \$${trip.pickupPrice.toStringAsFixed(2)} ${trip.currency.code}'),
          ],
        ),
      ),
    );
  }

  Widget _buildReservationsList(Trip trip) {
    if (trip.reservations.isEmpty) {
      return const Center(
        child: Text('Aún no hay reservaciones registradas para este viaje.'),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final reservation = trip.reservations[index];
        final spacesLabel = reservation.spaceIndexes.join(', ');
        return ListTile(
          leading: const Icon(Icons.receipt_long),
          title: Text(reservation.customerName),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Espacios: $spacesLabel'),
              Text('Estado: ${_reservationStatusLabel(reservation.status)}'),
            ],
          ),
          trailing: Text(
            '\$${reservation.totalAmount.toStringAsFixed(2)}\n${trip.currency.code}',
            textAlign: TextAlign.right,
          ),
        );
      },
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemCount: trip.reservations.length,
    );
  }

  Widget _buildSpacesGrid(Trip trip) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 6,
          crossAxisSpacing: 6,
          childAspectRatio: 2,
        ),
        itemCount: trip.spaces.length,
        itemBuilder: (context, index) {
          final space = trip.spaces[index];
          final isSelected = _selectedSpaceIndexes.contains(space.index);
          final selectable = _isSpaceSelectable(space);
          final color = _spaceColor(space.status, theme);

          return GestureDetector(
            onTap: () {
              if (!selectable) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Este espacio no está disponible.'),
                  ),
                );
                return;
              }
              _toggleSpaceSelection(space);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outlineVariant,
                  width: isSelected ? 3 : 1,
                ),
              ),
              padding: const EdgeInsets.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Espacio ${space.index}',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _shortStatus(space.status),
                    style: theme.textTheme.bodyMedium,
                  ),
                  if (space.reservation != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        space.reservation!.customerName,
                        style: theme.textTheme.bodySmall,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trip = _selectedTrip;
    return Scaffold(
      floatingActionButton: trip == null
          ? null
          : FloatingActionButton.extended(
              onPressed:
                  _selectedSpaceIndexes.isEmpty ? null : _handleReservationPressed,
              icon: const Icon(Icons.shopping_cart_checkout),
              label: const Text('Reservar espacios'),
            ),
      body: Row(
        children: [
          SizedBox(
            width: 320,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: DropdownButtonFormField<Trip>(
                    value: trip,
                    decoration: const InputDecoration(labelText: 'Viaje'),
                    items: widget.trips
                        .map(
                          (trip) => DropdownMenuItem(
                            value: trip,
                            child: Text('${trip.id} · ${trip.destination}'),
                          ),
                        )
                        .toList(),
                    onChanged: (selected) {
                      setState(() {
                        _selectedTrip = selected;
                        _selectedSpaceIndexes.clear();
                      });
                    },
                  ),
                ),
                if (trip == null)
                  const Expanded(
                    child: Center(
                      child: Text('Selecciona un viaje para ver sus espacios.'),
                    ),
                  )
                else ...[
                  _buildTripSummary(trip),
                  Expanded(child: _buildReservationsList(trip)),
                ],
              ],
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: trip == null
                ? const SizedBox.shrink()
                : _buildSpacesGrid(trip),
          ),
        ],
      ),
    );
  }
}
