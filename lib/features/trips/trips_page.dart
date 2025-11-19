import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';

class TripsPage extends StatelessWidget {
  final List<Trip> trips;
  final void Function(Trip) onAddTrip;
  final void Function(Trip) onUpdateTrip;
  final void Function(Trip) onOpenSpacesForTrip;

  const TripsPage({
    super.key,
    required this.trips,
    required this.onAddTrip,
    required this.onUpdateTrip,
    required this.onOpenSpacesForTrip,
  });

  Future<void> _openNewTripDialog(BuildContext context) async {
    await _openTripDialog(context);
  }

  Future<void> _openTripDialog(
    BuildContext context, {
    Trip? existing,
  }) async {
    final isEditing = existing != null;

    final originController = TextEditingController(
      text: existing?.origin ?? '',
    );
    final destinationController = TextEditingController(
      text: existing?.destination ?? '',
    );
    final capacityController = TextEditingController(
      text: existing?.capacitySpaces.toString() ?? '28',
    );

    final basePriceController = TextEditingController(
      text: existing?.basePricePerSpace.toString() ?? '40',
    );
    final labelPriceController = TextEditingController(
      text: existing?.labelPricePerUnit.toString() ?? '0.5',
    );
    final bondPriceController = TextEditingController(
      text: existing?.bondPrice.toString() ?? '25',
    );
    final pickupPriceController = TextEditingController(
      text: existing?.pickupPrice.toString() ?? '20',
    );
    final exchangeRateController = TextEditingController(
      text: existing?.exchangeRateToMXN?.toString() ?? (existing == null ? '18.0' : ''),
    );
    DateTime? selectedDate =
        existing?.departureDateTime ?? DateTime.now();
    TimeOfDay? selectedTime;
    if (existing != null) {
      final d = existing.departureDateTime;
      if (!(d.hour == 0 && d.minute == 0)) {
        selectedTime = TimeOfDay(hour: d.hour, minute: d.minute);
      }
    }

    bool isInternational = existing?.isInternational ?? true;
    TripCurrency currency = existing?.currency ?? TripCurrency.usd;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setLocal) {
          return AlertDialog(
            title: Text(isEditing ? 'Editar viaje' : 'Nuevo viaje'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: originController,
                    decoration: const InputDecoration(labelText: 'Origen'),
                  ),
                  TextField(
                    controller: destinationController,
                    decoration: const InputDecoration(labelText: 'Destino'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            final now = DateTime.now();
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: selectedDate ?? now,
                              firstDate: now.subtract(
                                  const Duration(days: 1)),
                              lastDate:
                                  now.add(const Duration(days: 365)),
                            );
                            if (picked != null) {
                              setLocal(() => selectedDate = picked);
                            }
                          },
                          child: Text(
                            selectedDate == null
                                ? 'Fecha'
                                : '${selectedDate!.day.toString().padLeft(2, '0')}/${selectedDate!.month.toString().padLeft(2, '0')}/${selectedDate!.year}',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            final picked = await showTimePicker(
                              context: context,
                              initialTime: selectedTime ??
                                  const TimeOfDay(
                                      hour: 0, minute: 0),
                            );
                            if (picked != null) {
                              setLocal(() => selectedTime = picked);
                            } else {
                              // Si cancela el time picker, interpretamos como "sin hora"
                              setLocal(() => selectedTime = null);
                            }
                          },
                          child: Text(
                            selectedTime == null
                                ? 'Sin hora (opcional)'
                                : '${selectedTime!.hour.toString().padLeft(2, '0')}:${selectedTime!.minute.toString().padLeft(2, '0')}',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (!isEditing)
                    TextField(
                      controller: capacityController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Capacidad en espacios',
                      ),
                    ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('Tipo de viaje:'),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('Internacional'),
                        selected: isInternational,
                        onSelected: (_) =>
                            setLocal(() => isInternational = true),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('Nacional'),
                        selected: !isInternational,
                        onSelected: (_) =>
                            setLocal(() => isInternational = false),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('Moneda base:'),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('USD'),
                        selected: currency == TripCurrency.usd,
                        onSelected: (_) =>
                            setLocal(() => currency = TripCurrency.usd),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('MXN'),
                        selected: currency == TripCurrency.mxn,
                        onSelected: (_) =>
                            setLocal(() => currency = TripCurrency.mxn),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: exchangeRateController,
                    enabled: currency == TripCurrency.usd,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText:
                          'Tipo de cambio (solo si la moneda base es USD)',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: basePriceController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Precio base por espacio',
                      prefixText: '\$ ',
                    ),
                  ),
                  TextField(
                    controller: labelPriceController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Costo por etiqueta impresa',
                      prefixText: '\$ ',
                    ),
                  ),
                  TextField(
                    controller: bondPriceController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Costo de fianza Keikichi',
                      prefixText: '\$ ',
                    ),
                  ),
                  TextField(
                    controller: pickupPriceController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Costo de recolección',
                      prefixText: '\$ ',
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Los montos se entienden en la moneda base seleccionada.',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: () {
                  final origin = originController.text.trim();
                  final destination =
                      destinationController.text.trim();
                  final capacity =
                      int.tryParse(capacityController.text.trim());
                  final basePrice =
                      double.tryParse(basePriceController.text.trim());
                  final labelPrice =
                      double.tryParse(labelPriceController.text.trim());
                  final bondPrice =
                      double.tryParse(bondPriceController.text.trim());
                  final pickupPrice =
                      double.tryParse(pickupPriceController.text.trim());
                  final exchangeRate =
                      double.tryParse(exchangeRateController.text.trim());

                  if (origin.isEmpty ||
                      destination.isEmpty ||
                      selectedDate == null ||
                      (!isEditing &&
                          (capacity == null || capacity <= 0)) ||
                      basePrice == null ||
                      labelPrice == null ||
                      bondPrice == null ||
                      pickupPrice == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                            'Completa todos los campos con valores válidos.'),
                      ),
                    );
                    return;
                  }

                  final dt = DateTime(
                    selectedDate!.year,
                    selectedDate!.month,
                    selectedDate!.day,
                    selectedTime?.hour ?? 0,
                    selectedTime?.minute ?? 0,
                  );

                  if (isEditing && existing != null) {
                    final updated = Trip(
                      id: existing.id,
                      departureDateTime: dt,
                      origin: origin,
                      destination: destination,
                      status: existing.status,
                      capacitySpaces: existing.capacitySpaces,
                      isInternational: isInternational,
                      currency: currency,
                      basePricePerSpace: basePrice,
                      labelPricePerUnit: labelPrice,
                      bondPrice: bondPrice,
                      pickupPrice: pickupPrice,
                      exchangeRateToMXN:
                          currency == TripCurrency.usd ? exchangeRate : null,
                      spaces: existing.spaces,
                      reservations: existing.reservations,
                    );
                    Navigator.pop(context, true);
                    onUpdateTrip(updated);
                  } else {
                    final id = 'T-${DateTime.now().millisecondsSinceEpoch}';
                    final newTrip = Trip(
                      id: id,
                      departureDateTime: dt,
                      origin: origin,
                      destination: destination,
                      capacitySpaces: capacity ?? 0,
                      isInternational: isInternational,
                      currency: currency,
                      basePricePerSpace: basePrice,
                      labelPricePerUnit: labelPrice,
                      bondPrice: bondPrice,
                      pickupPrice: pickupPrice,
                      exchangeRateToMXN:
                          currency == TripCurrency.usd ? exchangeRate : null,
                      spaces: List.generate(
                        capacity ?? 0,
                        (i) => TripSpace(
                          id: 'S-$id-${i + 1}',
                          tripId: id,
                          index: i + 1,
                        ),
                      ),
                    );
                    Navigator.pop(context, true);
                    onAddTrip(newTrip);
                  }
                },
                child: Text(isEditing ? 'Guardar' : 'Crear'),
              ),
            ],
          );
        });
      },
    );

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              isEditing ? 'Viaje actualizado.' : 'Viaje creado.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Viajes',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                FilledButton.icon(
                  onPressed: () => _openNewTripDialog(context),
                  icon: const Icon(Icons.add),
                  label: const Text('Nuevo viaje'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: trips.isEmpty
                  ? const Center(
                      child: Text('No hay viajes registrados.'),
                    )
                  : ListView.separated(
                      itemCount: trips.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final trip = trips[index];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${trip.origin} → ${trip.destination}',
                                      style: Theme.of(context)
                                          .textTheme.titleMedium,
                                    ),
                                    Chip(
                                      label: Text(trip.status.label),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Salida: ${trip.dateLabel} · ${trip.timeLabel}',
                                ),
                                Text(
                                  'Capacidad: ${trip.capacitySpaces} espacios',
                                ),
                                Text(
                                  'Moneda base: ${trip.currency.code}',
                                ),
                                if (trip.currency == TripCurrency.usd &&
                                    trip.exchangeRateToMXN != null)
                                  Text(
                                    'Tipo de cambio ref.: '
                                    '${trip.exchangeRateToMXN!.toStringAsFixed(2)} MXN',
                                  ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      trip.isInternational
                                          ? 'Internacional'
                                          : 'Nacional',
                                    ),
                                    Wrap(
                                      spacing: 8,
                                      children: [
                                        OutlinedButton.icon(
                                          onPressed: () =>
                                              _openTripDialog(
                                            context,
                                            existing: trip,
                                          ),
                                          icon: const Icon(Icons.edit_outlined),
                                          label: const Text('Editar'),
                                        ),
                                        FilledButton.icon(
                                          onPressed: () =>
                                              onOpenSpacesForTrip(trip),
                                          icon:
                                              const Icon(Icons.view_column_outlined),
                                          label:
                                              const Text('Ver espacios'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
