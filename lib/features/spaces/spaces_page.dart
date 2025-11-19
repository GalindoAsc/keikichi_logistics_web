import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/features/spaces/reservation_dialog.dart';

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
  static const bool kCurrentCustomerIsVerified = true;
  static const String kCurrentCustomerName = 'Cliente Demo Keikichi';

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

  Future<void> _showSingleReservationConfirmation(
    Trip trip,
    ReservationDetails reservation,
  ) async {
    final paymentMethod = reservation.paymentMethod ?? 'transferencia';
    final isTransfer = paymentMethod == 'transferencia';
    final paymentInstruction = isTransfer
        ? 'Banco Verde · Cuenta 0123456789 · CLABE 012345678901234567\nBeneficiario: Keikichi Produce\nSube tu comprobante en tu portal para que un gerente confirme tu pago.'
        : 'Presenta este número de orden cuando pagues en efectivo para asociar tu depósito.';

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Preconfirmación de pago'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Orden: ${reservation.orderCode}'),
            Text('Viaje: ${trip.id} · ${trip.origin} → ${trip.destination}'),
            Text('Espacios reservados: ${reservation.spaceIndexes.length}'),
            Text(
              'Total: '
              '\$${reservation.totalAmount.toStringAsFixed(2)} ${trip.currency.code}',
            ),
            const SizedBox(height: 12),
            Text(paymentInstruction),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Listo'),
          ),
        ],
      ),
    );
  }

  Future<void> _showMultipleReservationConfirmation(
    Trip trip,
    List<ReservationDetails> reservations,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reservaciones creadas'),
        content: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 360, maxWidth: 480),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Se generaron ${reservations.length} órdenes:'),
                const SizedBox(height: 12),
                ...reservations.map(
                  (reservation) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(reservation.orderCode),
                    subtitle: Text('Espacio ${reservation.spaceIndexes.join(', ')}'),
                    trailing: Text(
                      '\$${reservation.totalAmount.toStringAsFixed(2)} ${trip.currency.code}',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Si pagas por transferencia, usa los datos bancarios indicados y sube tu comprobante. Para efectivo, presenta cada número de orden en caja.',
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Entendido'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleReservationPressed() async {
    final trip = _selectedTrip;
    if (trip == null || _selectedSpaceIndexes.isEmpty) return;

    if (!kCurrentCustomerIsVerified) {
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Cuenta no verificada'),
          content: const Text(
            'Tu cuenta aún no ha sido verificada por un gerente. No puedes reservar espacios por el momento.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Entendido'),
            ),
          ],
        ),
      );
      return;
    }

    final sortedSelection = List<int>.from(_selectedSpaceIndexes)..sort();

    final reservations = await showReservationDialog(
      context: context,
      trip: trip,
      selectedSpaceIndexes: sortedSelection,
      currentCustomerName: kCurrentCustomerName,
    );

    if (reservations == null || reservations.isEmpty) return;

    final isCombinedReservation = reservations.length == 1 &&
        reservations.first.spaceIndexes.length > 1;

    setState(() {
      for (final reservation in reservations) {
        trip.reservations.add(reservation);
        for (final spaceIndex in reservation.spaceIndexes) {
          final listIndex = spaceIndex - 1;
          if (listIndex >= 0 && listIndex < trip.spaces.length) {
            final space = trip.spaces[listIndex];
            space.status = SpaceStatus.reserved;
            space.reservation = reservation;
          }
        }
      }
      _selectedSpaceIndexes.clear();
    });

    if (isCombinedReservation) {
      await _showSingleReservationConfirmation(trip, reservations.first);
    } else {
      await _showMultipleReservationConfirmation(trip, reservations);
    }
  }

  Widget _buildTripSelector() {
    return DropdownButtonFormField<Trip>(
      value: _selectedTrip,
      decoration: const InputDecoration(labelText: 'Viaje'),
      hint: const Text('Selecciona un viaje'),
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
    );
  }

  Widget _buildTripSummary(Trip trip, {EdgeInsetsGeometry? margin}) {
    return Card(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
              Text('Orden: ${reservation.orderCode}'),
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

  Widget _buildSpacesGrid(Trip trip, {EdgeInsetsGeometry padding = const EdgeInsets.all(16)}) {
    final theme = Theme.of(context);
    return Padding(
      padding: padding,
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
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
                    content:
                        Text('Este espacio ya está reservado u ocupado.'),
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

  Widget _buildMobileHeader(Trip trip) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTripSelector(),
        const SizedBox(height: 16),
        _buildTripSummary(trip, margin: EdgeInsets.zero),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: Card(
            child: _buildReservationsList(trip),
          ),
        ),
      ],
    );
  }

  Widget _buildWideLayout(Trip trip) {
    return Row(
      children: [
        SizedBox(
          width: 360,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: _buildTripSelector(),
              ),
              _buildTripSummary(trip),
              Expanded(child: _buildReservationsList(trip)),
            ],
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          child: _buildSpacesGrid(trip),
        ),
      ],
    );
  }

  Widget _buildNarrowLayout(Trip trip) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: _buildMobileHeader(trip),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _buildSpacesGrid(trip, padding: EdgeInsets.zero),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(bool isWide) {
    return Center(
      child: SizedBox(
        width: isWide ? 360 : double.infinity,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _buildTripSelector(),
              const SizedBox(height: 16),
              const Text(
                'Selecciona un viaje para ver sus espacios disponibles.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trip = _selectedTrip;
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 900;
        final hasTrips = widget.trips.isNotEmpty;
        final fab = trip == null
            ? null
            : FloatingActionButton.extended(
                onPressed: _selectedSpaceIndexes.isEmpty
                    ? null
                    : _handleReservationPressed,
                icon: const Icon(Icons.shopping_cart_checkout),
                label: const Text('Reservar espacios'),
              );

        Widget body;
        if (!hasTrips) {
          body = const Center(
            child: Text('No hay viajes disponibles.'),
          );
        } else if (trip == null) {
          body = _buildEmptyState(isWide);
        } else {
          body = isWide ? _buildWideLayout(trip) : _buildNarrowLayout(trip);
        }

        return Scaffold(
          floatingActionButton: fab,
          body: body,
        );
      },
    );
  }
}
