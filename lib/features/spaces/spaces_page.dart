import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/payment_instructions.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';
import 'package:keikichi_logistics_web/features/spaces/reservation_dialog.dart';

class SpacesPage extends StatefulWidget {
  final List<Trip> trips;
  final Trip? initialTrip;
  final AppUser currentUser;

  const SpacesPage({
    super.key,
    required this.trips,
    required this.currentUser,
    this.initialTrip,
  });

  @override
  State<SpacesPage> createState() => _SpacesPageState();
}

class _SpacesPageState extends State<SpacesPage> {
  Trip? _selectedTrip;
  final List<int> _selectedSpaceIndexes = [];

  bool get _isManagerOrAdmin =>
      widget.currentUser.role == UserRole.manager ||
      widget.currentUser.role == UserRole.superAdmin;

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
            if (isTransfer) ...[
              Text('Banco: ${PaymentConfig.current.bankName}'),
              Text('Cuenta: ${PaymentConfig.current.accountName}'),
              Text('Número de cuenta: ${PaymentConfig.current.accountNumber}'),
              Text('CLABE: ${PaymentConfig.current.clabe}'),
              Text('Nota: ${PaymentConfig.current.referenceHint}'),
              Text('Referencia sugerida: ${reservation.orderCode}'),
            ] else
              const Text(
                'Presenta este número de orden cuando pagues en efectivo para asociar tu depósito.',
              ),
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
    final transferReservations = reservations
        .where(
          (reservation) =>
              (reservation.paymentMethod ?? 'transferencia') == 'transferencia',
        )
        .toList();
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
                if (transferReservations.isNotEmpty) ...[
                  Text('Banco: ${PaymentConfig.current.bankName}'),
                  Text('Cuenta: ${PaymentConfig.current.accountName}'),
                  Text('Número de cuenta: ${PaymentConfig.current.accountNumber}'),
                  Text('CLABE: ${PaymentConfig.current.clabe}'),
                  Text('Nota: ${PaymentConfig.current.referenceHint}'),
                  Text(
                    'Referencias sugeridas: ${transferReservations.map((r) => r.orderCode).join(', ')}',
                  ),
                  const SizedBox(height: 12),
                ],
                const Text(
                  'Si pagas en efectivo, presenta cada número de orden en caja. Para transferencia, sube tu comprobante en el portal.',
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

    final sortedSelection = List<int>.from(_selectedSpaceIndexes)..sort();

    final reservations = await showReservationDialog(
      context: context,
      trip: trip,
      selectedSpaceIndexes: sortedSelection,
      currentUser: widget.currentUser,
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

  List<ReservationDetails> _visibleReservationsForTrip(Trip trip) {
    if (_isManagerOrAdmin) {
      return trip.reservations;
    }
    return trip.reservations
        .where((reservation) => reservation.customerId == widget.currentUser.id)
        .toList();
  }

  Widget _buildReservationsList(
    Trip trip, {
    ScrollPhysics? physics,
    bool shrinkWrap = false,
  }) {
    final visibleReservations = _visibleReservationsForTrip(trip);
    if (visibleReservations.isEmpty) {
      return Center(
        child: Text(
          _isManagerOrAdmin
              ? 'Aún no hay reservaciones registradas para este viaje.'
              : 'Aún no tienes reservaciones registradas para este viaje.',
        ),
      );
    }

    return ListView.separated(
      primary: false,
      physics: physics,
      shrinkWrap: shrinkWrap,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final reservation = visibleReservations[index];
        final spacesLabel = reservation.spaceIndexes.join(', ');
        final title = _isManagerOrAdmin
            ? reservation.customerName
            : 'Orden ${reservation.orderCode}';
        return ListTile(
          leading: const Icon(Icons.receipt_long),
          title: Text(title),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_isManagerOrAdmin)
                Text('Orden: ${reservation.orderCode}'),
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
      itemCount: visibleReservations.length,
    );
  }

  String? _spaceReservationLabel(TripSpace space) {
    final reservation = space.reservation;
    if (reservation == null) return null;
    final isOwner = reservation.customerId == widget.currentUser.id;
    if (_isManagerOrAdmin) {
      return reservation.customerName;
    }
    if (isOwner) {
      return 'Tu reservación';
    }
    return 'Reservado';
  }

  Widget _buildSpaceCard(TripSpace space) {
    final theme = Theme.of(context);
    final isSelected = _selectedSpaceIndexes.contains(space.index);
    final selectable = _isSpaceSelectable(space);
    final color = _spaceColor(space.status, theme);

    return GestureDetector(
      onTap: () {
        if (!selectable) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Este espacio ya está reservado u ocupado.'),
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
            final reservationLabel = _spaceReservationLabel(space);
            if (reservationLabel != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  reservationLabel,
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
  }

  Widget _buildSpacesGrid(
    Trip trip, {
    EdgeInsetsGeometry padding = const EdgeInsets.all(16),
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Scrollbar(
          child: GridView.builder(
            padding: padding,
            physics: const AlwaysScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2,
            ),
            itemCount: trip.spaces.length,
            itemBuilder: (context, index) {
              final space = trip.spaces[index];
              return _buildSpaceCard(space);
            },
          ),
        );
      },
    );
  }

  SliverPadding _buildSpacesSliverGrid(Trip trip) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 2,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => _buildSpaceCard(trip.spaces[index]),
          childCount: trip.spaces.length,
        ),
      ),
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
              Expanded(
                child: _buildReservationsList(
                  trip,
                  physics: const AlwaysScrollableScrollPhysics(),
                ),
              ),
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
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildTripSelector(),
                const SizedBox(height: 16),
                _buildTripSummary(trip, margin: EdgeInsets.zero),
                const SizedBox(height: 16),
                Card(
                  child: SizedBox(
                    height: 240,
                    child: _buildReservationsList(
                      trip,
                      physics: const BouncingScrollPhysics(),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          sliver: SliverToBoxAdapter(
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _selectedSpaceIndexes.isEmpty
                    ? null
                    : _handleReservationPressed,
                icon: const Icon(Icons.event_available_outlined),
                label: const Text('Reservar espacios'),
              ),
            ),
          ),
        ),
        _buildSpacesSliverGrid(trip),
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
