import 'package:flutter/material.dart';
import 'models.dart';

// Simulación: dueño de la cuenta actual.
// Más adelante esto saldrá de la sesión del usuario autenticado.
const String kCurrentCustomerName = 'Cliente Demo Keikichi';

void main() {
  runApp(const KeikichiLogisticsApp());
}

class KeikichiLogisticsApp extends StatelessWidget {
  const KeikichiLogisticsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Keikichi Logistics',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
        useMaterial3: true,
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

enum AppSection { trips, trailerTemplates, settings }

class _MainShellState extends State<MainShell> {
  AppSection _section = AppSection.trips;

  final List<Trip> _trips = [];
  Trip? _selectedTripForSpaces;

  @override
  void initState() {
    super.initState();

    // Viaje ejemplo internacional en USD
    _trips.add(
      Trip(
        id: 'T-001',
        departureDateTime: DateTime.now().add(const Duration(days: 1)),
        origin: 'Irapuato, Gto',
        destination: 'Los Ángeles, CA',
        capacitySpaces: 28,
        isInternational: true,
        currencyBase: Currency.usd,
        exchangeRateToMxn: 18.50,
        basePricePerSpace: 40,
        labelPrintPricePerLabel: 0.5,
        bondPrice: 25,
        pickupPrice: 20,
        spaces: List.generate(
          28,
          (i) => TripSpace(
            id: 'S-T001-${i + 1}',
            tripId: 'T-001',
            index: i + 1,
          ),
        ),
      ),
    );

    // Viaje ejemplo nacional en MXN
    _trips.add(
      Trip(
        id: 'T-002',
        departureDateTime: DateTime.now().add(const Duration(days: 3)),
        origin: 'Irapuato, Gto',
        destination: 'CDMX',
        capacitySpaces: 30,
        isInternational: false,
        currencyBase: Currency.mxn,
        exchangeRateToMxn: 18.50,
        basePricePerSpace: 700,
        labelPrintPricePerLabel: 5,
        bondPrice: 0,
        pickupPrice: 350,
        spaces: List.generate(
          30,
          (i) => TripSpace(
            id: 'S-T002-${i + 1}',
            tripId: 'T-002',
            index: i + 1,
          ),
        ),
      ),
    );

    if (_trips.isNotEmpty) {
      _selectedTripForSpaces = _trips.first;
    }
  }

  void _addTrip(Trip trip) {
    setState(() {
      _trips.add(trip);
      _selectedTripForSpaces ??= trip;
    });
  }

  void _updateTrip(Trip updated) {
    setState(() {
      final index = _trips.indexWhere((t) => t.id == updated.id);
      if (index != -1) {
        final wasSelected = _selectedTripForSpaces?.id == updated.id;
        _trips[index] = updated;
        if (wasSelected) {
          _selectedTripForSpaces = updated;
        }
      }
    });
  }

  void _goToSpacesForTrip(Trip trip) {
    setState(() {
      _selectedTripForSpaces = trip;
      _section = AppSection.trailerTemplates;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget content;
    switch (_section) {
      case AppSection.trips:
        content = TripsPage(
          trips: _trips,
          onAddTrip: _addTrip,
          onUpdateTrip: _updateTrip,
          onOpenSpacesForTrip: _goToSpacesForTrip,
        );
        break;
      case AppSection.trailerTemplates:
        content = TrailerTemplatesPage(
          trips: _trips,
          initialTrip: _selectedTripForSpaces,
        );
        break;
      case AppSection.settings:
        content = const SettingsPage();
        break;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 900;

        if (isWide) {
          return Scaffold(
            body: Row(
              children: [
                NavigationRail(
                  labelType: NavigationRailLabelType.all,
                  selectedIndex: _section.index,
                  onDestinationSelected: (i) {
                    setState(() => _section = AppSection.values[i]);
                  },
                  destinations: const [
                    NavigationRailDestination(
                      icon: Icon(Icons.list_alt_outlined),
                      selectedIcon: Icon(Icons.list_alt),
                      label: Text('Viajes'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.view_column_outlined),
                      selectedIcon: Icon(Icons.view_column),
                      label: Text('Mapa de espacios'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.settings_outlined),
                      selectedIcon: Icon(Icons.settings),
                      label: Text('Ajustes'),
                    ),
                  ],
                ),
                const VerticalDivider(width: 1),
                Expanded(child: content),
              ],
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Keikichi Logistics')),
          body: content,
          bottomNavigationBar: NavigationBar(
            selectedIndex: _section.index,
            onDestinationSelected: (i) {
              setState(() => _section = AppSection.values[i]);
            },
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.list_alt_outlined),
                selectedIcon: Icon(Icons.list_alt),
                label: 'Viajes',
              ),
              NavigationDestination(
                icon: Icon(Icons.view_column_outlined),
                selectedIcon: Icon(Icons.view_column),
                label: 'Mapa',
              ),
              NavigationDestination(
                icon: Icon(Icons.settings_outlined),
                selectedIcon: Icon(Icons.settings),
                label: 'Ajustes',
              ),
            ],
          ),
        );
      },
    );
  }
}

// ------------------------------------------------------------
// PANTALLA VIAJES
// ------------------------------------------------------------

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
      text: existing?.labelPrintPricePerLabel.toString() ?? '0.5',
    );
    final bondPriceController = TextEditingController(
      text: existing?.bondPrice.toString() ?? '25',
    );
    final pickupPriceController = TextEditingController(
      text: existing?.pickupPrice.toString() ?? '20',
    );
    final exchangeRateController = TextEditingController(
      text: existing?.exchangeRateToMxn.toString() ?? '18.5',
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
    Currency currencyBase = existing?.currencyBase ?? Currency.usd;

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
                        selected: currencyBase == Currency.usd,
                        onSelected: (_) =>
                            setLocal(() => currencyBase = Currency.usd),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('MXN'),
                        selected: currencyBase == Currency.mxn,
                        onSelected: (_) =>
                            setLocal(() => currencyBase = Currency.mxn),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: exchangeRateController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Tipo de cambio (1 USD = X MXN)',
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
                  final exchangeRate = double.tryParse(
                      exchangeRateController.text.trim());

                  if (origin.isEmpty ||
                      destination.isEmpty ||
                      selectedDate == null ||
                      (!isEditing &&
                          (capacity == null || capacity <= 0)) ||
                      basePrice == null ||
                      labelPrice == null ||
                      bondPrice == null ||
                      pickupPrice == null ||
                      exchangeRate == null ||
                      exchangeRate <= 0) {
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
                      currencyBase: currencyBase,
                      exchangeRateToMxn: exchangeRate,
                      basePricePerSpace: basePrice,
                      labelPrintPricePerLabel: labelPrice,
                      bondPrice: isInternational ? bondPrice : 0,
                      pickupPrice: pickupPrice,
                      spaces: existing.spaces,
                    );
                    onUpdateTrip(updated);
                  } else {
                    final id = 'T-${DateTime.now().millisecondsSinceEpoch}';
                    final spaces = List.generate(
                      capacity!,
                      (i) => TripSpace(
                        id: 'S-$id-${i + 1}',
                        tripId: id,
                        index: i + 1,
                      ),
                    );
                    final trip = Trip(
                      id: id,
                      departureDateTime: dt,
                      origin: origin,
                      destination: destination,
                      capacitySpaces: capacity,
                      isInternational: isInternational,
                      currencyBase: currencyBase,
                      exchangeRateToMxn: exchangeRate,
                      basePricePerSpace: basePrice,
                      labelPrintPricePerLabel: labelPrice,
                      bondPrice: isInternational ? bondPrice : 0,
                      pickupPrice: pickupPrice,
                      spaces: spaces,
                    );
                    onAddTrip(trip);
                  }

                  Navigator.pop(context, true);
                },
                child: Text(isEditing ? 'Guardar cambios' : 'Guardar'),
              ),
            ],
          );
        });
      },
    );

    if (result == true && context.mounted && !isEditing) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Viaje creado correctamente.')),
      );
    } else if (result == true && context.mounted && isEditing) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Viaje actualizado correctamente.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Viajes',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _openNewTripDialog(context),
                icon: const Icon(Icons.add),
                label: const Text('Nuevo viaje'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: trips.isEmpty
                ? const Center(child: Text('No hay viajes creados.'))
                : Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: DataTable(
                        columns: const [
                          DataColumn(label: Text('ID')),
                          DataColumn(label: Text('Fecha')),
                          DataColumn(label: Text('Hora')),
                          DataColumn(label: Text('Origen')),
                          DataColumn(label: Text('Destino')),
                          DataColumn(label: Text('Tipo')),
                          DataColumn(label: Text('Moneda')),
                          DataColumn(label: Text('Capacidad')),
                          DataColumn(label: Text('Acciones')),
                        ],
                        rows: trips
                            .map(
                              (t) => DataRow(
                                cells: [
                                  DataCell(Text(t.id)),
                                  DataCell(Text(t.dateLabel)),
                                  DataCell(Text(t.timeLabel)),
                                  DataCell(Text(t.origin)),
                                  DataCell(Text(t.destination)),
                                  DataCell(Text(
                                      t.isInternational ? 'Internacional' : 'Nacional')),
                                  DataCell(Text(t.currencyBase.code)),
                                  DataCell(Text('${t.capacitySpaces}')),
                                  DataCell(
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        TextButton(
                                          onPressed: () =>
                                              onOpenSpacesForTrip(t),
                                          child:
                                              const Text('Ver espacios'),
                                        ),
                                        PopupMenuButton<String>(
                                          tooltip: 'Más acciones',
                                          onSelected: (value) {
                                            if (value == 'edit') {
                                              _openTripDialog(
                                                context,
                                                existing: t,
                                              );
                                            }
                                          },
                                          itemBuilder: (ctx) => const [
                                            PopupMenuItem(
                                              value: 'edit',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.edit, size: 18),
                                                  SizedBox(width: 8),
                                                  Text('Editar viaje'),
                                                ],
                                              ),
                                            ),
                                          ],
                                          child: const Icon(
                                              Icons.more_vert,
                                              size: 20),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------
// PANTALLA MAPA DE ESPACIOS + RESERVACIÓN
// ------------------------------------------------------------

// Helper para productos en el formulario
class _ProductLineFormData {
  String productName;
  int quantity;
  String unit;
  double? unitWeightLbs;

  _ProductLineFormData({
    this.productName = '',
    this.quantity = 0,
    this.unit = 'Cajas',
    this.unitWeightLbs,
  });
}

// Helper para destinos guardados (solo para este cliente actual)
class _SavedDestination {
  final String name;
  final String contactName;
  final String address;
  final String reference;

  _SavedDestination({
    required this.name,
    required this.contactName,
    required this.address,
    required this.reference,
  });

  String get displayLabel {
    if (name.isNotEmpty) return name;
    if (address.isNotEmpty) return address;
    return 'Destino sin nombre';
  }
}

// Configuración de etiquetas por producto en el formulario
class _ProductLabelConfig {
  String? labelFileName;
  int labelsCount;

  _ProductLabelConfig({
    this.labelFileName,
    this.labelsCount = 0,
  });
}

enum _BondOption { client, keikichi }
enum _PickupOption { clientToWarehouse, keikichiPickup }

class TrailerTemplatesPage extends StatefulWidget {
  final List<Trip> trips;
  final Trip? initialTrip;

  const TrailerTemplatesPage({
    super.key,
    required this.trips,
    this.initialTrip,
  });

  @override
  State<TrailerTemplatesPage> createState() =>
      _TrailerTemplatesPageState();
}

class _TrailerTemplatesPageState extends State<TrailerTemplatesPage> {
  Trip? _selectedTrip;
  final Set<int> _selectedIndexes = {};

  // Destinos guardados para el "cliente actual" (simulado en memoria)
  final List<_SavedDestination> _savedDestinations = [];

  @override
  void initState() {
    super.initState();
    _selectedTrip =
        widget.initialTrip ?? (widget.trips.isNotEmpty ? widget.trips.first : null);
  }

  Color _spaceColor(SpaceStatus status, ThemeData theme) {
    final cs = theme.colorScheme;
    switch (status) {
      case SpaceStatus.free:
        return cs.surface;
      case SpaceStatus.reserved:
        return cs.tertiaryContainer;
      case SpaceStatus.occupied:
        return cs.primaryContainer;
      case SpaceStatus.blocked:
        return cs.errorContainer;
      case SpaceStatus.cancelled:
        return cs.surfaceVariant;
    }
  }

  String _shortStatus(TripSpace space) {
    switch (space.status) {
      case SpaceStatus.free:
        return 'L';
      case SpaceStatus.reserved:
        return 'R';
      case SpaceStatus.occupied:
        return 'O';
      case SpaceStatus.blocked:
        return 'B';
      case SpaceStatus.cancelled:
        return 'C';
    }
  }

  void _openReservationDialog() {
    if (_selectedTrip == null || _selectedIndexes.isEmpty) return;
    final trip = _selectedTrip!;

    final customerController =
        TextEditingController(text: kCurrentCustomerName);

    // Destino detallado
    final destinationNameController = TextEditingController();
    final destinationContactController = TextEditingController();
    final destinationAddressController = TextEditingController();
    final destinationReferenceController = TextEditingController();

    final notesController = TextEditingController();

    List<_ProductLineFormData> productLines = [
      _ProductLineFormData(),
    ];
    List<_ProductLabelConfig> labelConfigs = [
      _ProductLabelConfig(),
    ];

    bool clientProvidesLabels = true;
    List<String> labelFiles = [];
    final labelFileNameController = TextEditingController();

    _BondOption bondOption = _BondOption.client;
    final bondFileController = TextEditingController();

    _PickupOption pickupOption = _PickupOption.clientToWarehouse;

    double sumQuantities() {
      return productLines.fold<double>(
        0,
        (prev, p) => prev + p.quantity.toDouble(),
      );
    }

    double calculateTotalBase(
        List<_ProductLabelConfig> currentLabelConfigs) {
      final spacesCount = _selectedIndexes.length;
      final base = spacesCount * trip.basePricePerSpace;

      int totalLabels = 0;
      if (!clientProvidesLabels) {
        for (final cfg in currentLabelConfigs) {
          if (cfg.labelFileName != null && cfg.labelsCount > 0) {
            totalLabels += cfg.labelsCount;
          }
        }
      }
      final labelsCost =
          totalLabels * trip.labelPrintPricePerLabel;

      double bondCost = 0;
      if (trip.isInternational && bondOption == _BondOption.keikichi) {
        bondCost = trip.bondPrice;
      }

      double pickupCost =
          pickupOption == _PickupOption.keikichiPickup ? trip.pickupPrice : 0;

      return base + labelsCost + bondCost + pickupCost;
    }

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setLocal) {
          final theme = Theme.of(context);
          final totalBase = calculateTotalBase(labelConfigs);

          // Calcular equivalencias en USD/MXN
          double totalUsd;
          double totalMxn;
          if (trip.currencyBase == Currency.usd) {
            totalUsd = totalBase;
            totalMxn = totalBase * trip.exchangeRateToMxn;
          } else {
            totalMxn = totalBase;
            totalUsd = trip.exchangeRateToMxn == 0
                ? 0
                : totalBase / trip.exchangeRateToMxn;
          }

          int totalLabelsCount = 0;
          for (final cfg in labelConfigs) {
            if (!clientProvidesLabels &&
                cfg.labelFileName != null &&
                cfg.labelsCount > 0) {
              totalLabelsCount += cfg.labelsCount;
            }
          }

          return AlertDialog(
            title: Text(
                'Reservar ${_selectedIndexes.length} espacio(s) en ${trip.id}'),
            content: SizedBox(
              width: 650,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Datos del cliente y destino',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: customerController,
                      decoration: const InputDecoration(
                        labelText: 'Emisor / Cliente',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: destinationNameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre del destino',
                        hintText: 'Ej. Bodega general, Rancho X, etc.',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: destinationContactController,
                      decoration: const InputDecoration(
                        labelText: 'Persona / empresa receptora (opcional)',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: destinationAddressController,
                      decoration: const InputDecoration(
                        labelText: 'Dirección',
                        hintText:
                            'Calle, número, ciudad, estado, país...',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: destinationReferenceController,
                      decoration: const InputDecoration(
                        labelText:
                            'Referencias de la dirección (opcional)',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<_SavedDestination>(
                            isExpanded: true,
                            items: _savedDestinations
                                .map(
                                  (d) => DropdownMenuItem(
                                    value: d,
                                    child: Text(
                                      d.displayLabel,
                                      overflow:
                                          TextOverflow.ellipsis,
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setLocal(() {
                                  destinationNameController.text =
                                      value.name;
                                  destinationContactController.text =
                                      value.contactName;
                                  destinationAddressController.text =
                                      value.address;
                                  destinationReferenceController.text =
                                      value.reference;
                                });
                              }
                            },
                            decoration: const InputDecoration(
                              labelText: 'Seleccionar destino guardado',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () {
                            final name =
                                destinationNameController.text.trim();
                            final contact = destinationContactController.text
                                .trim();
                            final address =
                                destinationAddressController.text.trim();
                            final reference =
                                destinationReferenceController.text.trim();

                            if (name.isEmpty && address.isEmpty) {
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Para guardar un destino, coloca al menos nombre o dirección.',
                                  ),
                                ),
                              );
                              return;
                            }

                            final dest = _SavedDestination(
                              name: name,
                              contactName: contact,
                              address: address,
                              reference: reference,
                            );

                            if (!_savedDestinations.any((d) =>
                                d.name == dest.name &&
                                d.address == dest.address)) {
                              setState(() {
                                _savedDestinations.add(dest);
                              });
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Destino guardado para este cliente.',
                                  ),
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.save),
                          tooltip: 'Guardar destino',
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Productos en la tarima',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Column(
                      children: [
                        for (int i = 0;
                            i < productLines.length;
                            i++)
                          Card(
                            margin: const EdgeInsets.symmetric(
                                vertical: 4),
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          decoration:
                                              const InputDecoration(
                                            labelText: 'Producto',
                                            hintText:
                                                'Ej. Basil, Menta, Zanahoria...',
                                          ),
                                          onChanged: (val) {
                                            productLines[i]
                                                .productName = val;
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      IconButton(
                                        onPressed:
                                            productLines.length > 1
                                                ? () {
                                                    setLocal(() {
                                                      productLines
                                                          .removeAt(
                                                              i);
                                                      labelConfigs
                                                          .removeAt(
                                                              i);
                                                    });
                                                  }
                                                : null,
                                        icon: const Icon(
                                            Icons.delete_outline),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          keyboardType:
                                              TextInputType.number,
                                          decoration:
                                              const InputDecoration(
                                            labelText: 'Cantidad',
                                            hintText: 'Ej. 10',
                                          ),
                                          onChanged: (val) {
                                            productLines[i].quantity =
                                                int.tryParse(val) ??
                                                    0;
                                            if (!clientProvidesLabels &&
                                                labelConfigs[
                                                            i]
                                                        .labelsCount ==
                                                    0) {
                                              setLocal(() {
                                                labelConfigs[i]
                                                        .labelsCount =
                                                    productLines[i]
                                                        .quantity;
                                              });
                                            } else {
                                              setLocal(() {});
                                            }
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child:
                                            DropdownButtonFormField<
                                                String>(
                                          value: productLines[i].unit,
                                          items: const [
                                            DropdownMenuItem(
                                              value: 'Cajas',
                                              child: Text('Cajas'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'Bolsas',
                                              child: Text('Bolsas'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'Cubetas',
                                              child: Text('Cubetas'),
                                            ),
                                            DropdownMenuItem(
                                              value: 'Otro',
                                              child: Text('Otro'),
                                            ),
                                          ],
                                          onChanged: (val) {
                                            if (val != null) {
                                              productLines[i].unit =
                                                  val;
                                            }
                                          },
                                          decoration:
                                              const InputDecoration(
                                            labelText: 'Unidad',
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  TextField(
                                    keyboardType:
                                        const TextInputType
                                            .numberWithOptions(
                                                decimal: true),
                                    decoration: const InputDecoration(
                                      labelText:
                                          'Peso por unidad (lbs)',
                                      hintText: 'Ej. 10',
                                    ),
                                    onChanged: (val) {
                                      productLines[i].unitWeightLbs =
                                          double.tryParse(val);
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () {
                              setLocal(() {
                                productLines
                                    .add(_ProductLineFormData());
                                labelConfigs
                                    .add(_ProductLabelConfig());
                              });
                            },
                            icon: const Icon(Icons.add),
                            label: const Text('Agregar producto'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Etiquetas',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        '¿El cliente entregará el producto ya etiquetado?',
                      ),
                      value: clientProvidesLabels,
                      onChanged: (val) {
                        setLocal(() {
                          clientProvidesLabels = val;
                          if (!clientProvidesLabels) {
                            for (int i = 0;
                                i < labelConfigs.length;
                                i++) {
                              if (labelConfigs[i].labelsCount == 0) {
                                labelConfigs[i].labelsCount =
                                    productLines[i].quantity;
                              }
                            }
                          }
                        });
                      },
                    ),
                    if (!clientProvidesLabels) ...[
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: labelFileNameController,
                              decoration: const InputDecoration(
                                labelText:
                                    'Nombre de archivo de etiqueta',
                                hintText: 'Ej. basil_10lbs.pdf',
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () {
                              final name =
                                  labelFileNameController.text.trim();
                              if (name.isNotEmpty) {
                                setLocal(() {
                                  labelFiles.add(name);
                                  labelFileNameController.clear();
                                });
                              }
                            },
                            icon: const Icon(Icons.upload_file),
                            tooltip: 'Agregar archivo de etiqueta',
                          ),
                        ],
                      ),
                      if (labelFiles.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Archivos de etiquetas disponibles:',
                          style: theme.textTheme.bodySmall,
                        ),
                        Wrap(
                          spacing: 6,
                          children: labelFiles
                              .map(
                                (f) => Chip(
                                  label: Text(f),
                                  onDeleted: () {
                                    setLocal(() {
                                      labelFiles.remove(f);
                                    });
                                  },
                                ),
                              )
                              .toList(),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Text(
                        'Asignación de etiquetas por producto',
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      if (labelFiles.isEmpty)
                        Text(
                          'Agrega al menos un archivo de etiqueta para poder asignarlo a los productos.',
                          style: theme.textTheme.bodySmall,
                        )
                      else
                        Column(
                          children: [
                            for (int i = 0;
                                i < productLines.length;
                                i++)
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        productLines[i]
                                                .productName
                                                .trim()
                                                .isEmpty
                                            ? 'Producto ${i + 1}'
                                            : productLines[i]
                                                .productName,
                                        overflow:
                                            TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      flex: 3,
                                      child: DropdownButtonFormField<
                                          String>(
                                        value: labelConfigs[i]
                                            .labelFileName,
                                        items: labelFiles
                                            .map(
                                              (f) =>
                                                  DropdownMenuItem(
                                                value: f,
                                                child: Text(
                                                  f,
                                                  overflow:
                                                      TextOverflow
                                                          .ellipsis,
                                                ),
                                              ),
                                            )
                                            .toList(),
                                        onChanged: (val) {
                                          setLocal(() {
                                            labelConfigs[i]
                                                    .labelFileName =
                                                val;
                                            if (labelConfigs[i]
                                                        .labelsCount ==
                                                    0 &&
                                                productLines[i]
                                                        .quantity >
                                                    0) {
                                              labelConfigs[i]
                                                      .labelsCount =
                                                  productLines[i]
                                                      .quantity;
                                            }
                                          });
                                        },
                                        decoration:
                                            const InputDecoration(
                                          labelText: 'Etiqueta',
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    SizedBox(
                                      width: 90,
                                      child: TextField(
                                        keyboardType:
                                            TextInputType.number,
                                        decoration:
                                            const InputDecoration(
                                          labelText: 'Cant.',
                                        ),
                                        controller:
                                            TextEditingController(
                                          text: labelConfigs[i]
                                                      .labelsCount ==
                                                  0
                                              ? ''
                                              : labelConfigs[i]
                                                  .labelsCount
                                                  .toString(),
                                        ),
                                        onChanged: (val) {
                                          setLocal(() {
                                            labelConfigs[i]
                                                    .labelsCount =
                                                int.tryParse(val) ??
                                                    0;
                                          });
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      const SizedBox(height: 8),
                      Text(
                        'Costo por etiqueta: '
                        '\$${trip.labelPrintPricePerLabel.toStringAsFixed(2)} '
                        '${trip.currencyBase.code}',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                    const SizedBox(height: 16),
                    if (trip.isInternational) ...[
                      const Text(
                        'Fianza de exportación',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      RadioListTile<_BondOption>(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Fianza del cliente'),
                        value: _BondOption.client,
                        groupValue: bondOption,
                        onChanged: (val) {
                          if (val != null) {
                            setLocal(() => bondOption = val);
                          }
                        },
                      ),
                      if (bondOption == _BondOption.client)
                        TextField(
                          controller: bondFileController,
                          decoration: const InputDecoration(
                            labelText:
                                'Nombre / referencia archivo de fianza (simulado)',
                          ),
                        ),
                      RadioListTile<_BondOption>(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          'Fianza de Keikichi (+ '
                          '\$${trip.bondPrice.toStringAsFixed(2)} '
                          '${trip.currencyBase.code})',
                        ),
                        value: _BondOption.keikichi,
                        groupValue: bondOption,
                        onChanged: (val) {
                          if (val != null) {
                            setLocal(() => bondOption = val);
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    const Text(
                      'Entrega / Recolección',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    RadioListTile<_PickupOption>(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                          'El cliente llevará la mercancía a la bodega'),
                      value: _PickupOption.clientToWarehouse,
                      groupValue: pickupOption,
                      onChanged: (val) {
                        if (val != null) {
                          setLocal(() => pickupOption = val);
                        }
                      },
                    ),
                    RadioListTile<_PickupOption>(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        'Keikichi recogerá el producto (+ '
                        '\$${trip.pickupPrice.toStringAsFixed(2)} '
                        '${trip.currencyBase.code})',
                      ),
                      value: _PickupOption.keikichiPickup,
                      groupValue: pickupOption,
                      onChanged: (val) {
                        if (val != null) {
                          setLocal(() => pickupOption = val);
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: notesController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Notas adicionales',
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Resumen de precios',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Builder(
                      builder: (_) {
                        final spacesCount = _selectedIndexes.length;
                        final base =
                            spacesCount * trip.basePricePerSpace;

                        final bondCost =
                            trip.isInternational &&
                                    bondOption == _BondOption.keikichi
                                ? trip.bondPrice
                                : 0;
                        final pickupCost =
                            pickupOption == _PickupOption.keikichiPickup
                                ? trip.pickupPrice
                                : 0;

                        final labelsCost =
                            totalLabelsCount *
                                trip.labelPrintPricePerLabel;

                        return Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Espacios (${spacesCount}) x '
                              '\$${trip.basePricePerSpace.toStringAsFixed(2)} '
                              '${trip.currencyBase.code} = '
                              '\$${base.toStringAsFixed(2)} '
                              '${trip.currencyBase.code}',
                            ),
                            Text(
                              'Etiquetas (${totalLabelsCount}) x '
                              '\$${trip.labelPrintPricePerLabel.toStringAsFixed(2)} '
                              '${trip.currencyBase.code} = '
                              '\$${labelsCost.toStringAsFixed(2)} '
                              '${trip.currencyBase.code}',
                            ),
                            if (trip.isInternational)
                              Text(
                                'Fianza: '
                                '\$${bondCost.toStringAsFixed(2)} '
                                '${trip.currencyBase.code}',
                              ),
                            Text(
                              'Recolección: '
                              '\$${pickupCost.toStringAsFixed(2)} '
                              '${trip.currencyBase.code}',
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'TOTAL: '
                              '\$${totalBase.toStringAsFixed(2)} '
                              '${trip.currencyBase.code}',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(
                                      fontWeight:
                                          FontWeight.bold),
                            ),
                            Text(
                              trip.currencyBase == Currency.usd
                                  ? 'Equivalente aprox: '
                                    '\$${totalMxn.toStringAsFixed(2)} MXN '
                                    '(TC ${trip.exchangeRateToMxn})'
                                  : 'Equivalente aprox: '
                                    '\$${totalUsd.toStringAsFixed(2)} USD '
                                    '(TC ${trip.exchangeRateToMxn})',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: () {
                  final customer =
                      customerController.text.trim();
                  final destName =
                      destinationNameController.text.trim();
                  final destAddress =
                      destinationAddressController.text.trim();

                  final validProducts = productLines.where(
                    (p) =>
                        p.productName.trim().isNotEmpty &&
                        p.quantity > 0,
                  );

                  if (customer.isEmpty ||
                      (destName.isEmpty && destAddress.isEmpty) ||
                      validProducts.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Emisor, algún dato de destino y al menos un producto válido son obligatorios.',
                        ),
                      ),
                    );
                    return;
                  }

                  final products = validProducts
                      .map(
                        (p) => ProductLine(
                          productName: p.productName.trim(),
                          quantity: p.quantity,
                          unit: p.unit,
                          unitWeightLbs: p.unitWeightLbs,
                        ),
                      )
                      .toList();

                  // Construir asignaciones de etiquetas por producto
                  final productLabels = <ProductLabelAssignment>[];
                  for (int i = 0;
                      i < productLines.length &&
                          i < labelConfigs.length;
                      i++) {
                    final p = productLines[i];
                    final cfg = labelConfigs[i];
                    if (!clientProvidesLabels &&
                        cfg.labelFileName != null &&
                        cfg.labelsCount > 0 &&
                        p.productName.trim().isNotEmpty) {
                      productLabels.add(
                        ProductLabelAssignment(
                          productName: p.productName.trim(),
                          labelFileName: cfg.labelFileName!,
                          labelsCount: cfg.labelsCount,
                        ),
                      );
                    }
                  }

                  final labelFileNames =
                      productLabels.map((e) => e.labelFileName).toSet().toList();

                  final details = ReservationDetails(
                    customerName: customer,
                    destinationName: destName.isNotEmpty
                        ? destName
                        : destAddress,
                    destinationContactName:
                        destinationContactController.text.trim().isEmpty
                            ? null
                            : destinationContactController.text.trim(),
                    destinationAddress: destAddress.isEmpty
                        ? null
                        : destAddress,
                    destinationReference:
                        destinationReferenceController.text.trim().isEmpty
                            ? null
                            : destinationReferenceController.text.trim(),
                    products: products,
                    clientProvidesLabels: clientProvidesLabels,
                    labelFileNames: labelFileNames,
                    productLabels: productLabels,
                    usesClientBond: trip.isInternational &&
                        bondOption == _BondOption.client,
                    clientBondFileName: trip.isInternational &&
                            bondOption == _BondOption.client
                        ? (bondFileController.text.trim().isEmpty
                            ? null
                            : bondFileController.text.trim())
                        : null,
                    usesKeikichiBond: trip.isInternational &&
                        bondOption == _BondOption.keikichi,
                    pickupByKeikichi:
                        pickupOption == _PickupOption.keikichiPickup,
                    paymentStatus: PaymentStatus.pending,
                    totalPrice: totalBase,
                    notes: notesController.text.trim().isEmpty
                        ? null
                        : notesController.text.trim(),
                  );

                  setState(() {
                    for (final index in _selectedIndexes) {
                      final space = trip.spaces[index];
                      space.status = SpaceStatus.reserved;
                      space.reservation = details;
                    }
                    _selectedIndexes.clear();
                  });

                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content:
                          Text('Reservación creada correctamente.'),
                    ),
                  );
                },
                child: const Text('Confirmar reservación'),
              ),
            ],
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (widget.trips.isEmpty) {
      return const Center(child: Text('No hay viajes creados.'));
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Mapa de espacios por viaje',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text('Selecciona un viaje:'),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButton<Trip>(
                  isExpanded: true,
                  value: _selectedTrip ?? widget.trips.first,
                  items: widget.trips
                      .map(
                        (t) => DropdownMenuItem(
                          value: t,
                          child: Text(
                            '${t.id} · ${t.origin} → ${t.destination} · ${t.dateLabel}',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (t) {
                    setState(() {
                      _selectedTrip = t;
                      _selectedIndexes.clear();
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_selectedTrip == null)
            const Expanded(
              child: Center(child: Text('No hay viaje seleccionado.')),
            )
          else
            Expanded(
              child: Stack(
                children: [
                  Center(
                    child: SizedBox(
                      width: 400,
                      child: InteractiveViewer(
                        minScale: 0.8,
                        maxScale: 3,
                        child: GridView.builder(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 6,
                            crossAxisSpacing: 6,
                            childAspectRatio: 2,
                          ),
                          itemCount: _selectedTrip!.spaces.length,
                          itemBuilder: (context, index) {
                            final space =
                                _selectedTrip!.spaces[index];
                            final color =
                                _spaceColor(space.status, theme);
                            final selected =
                                _selectedIndexes.contains(index);

                            return GestureDetector(
                              onTap: () {
                                // Solo se pueden seleccionar espacios libres
                                if (space.status != SpaceStatus.free) {
                                  ScaffoldMessenger.of(context)
                                      .showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Este espacio ya está reservado/ocupado/bloqueado.',
                                      ),
                                    ),
                                  );
                                  return;
                                }
                                setState(() {
                                  if (selected) {
                                    _selectedIndexes.remove(index);
                                  } else {
                                    _selectedIndexes.add(index);
                                  }
                                });
                              },
                              child: AnimatedContainer(
                                duration:
                                    const Duration(milliseconds: 120),
                                decoration: BoxDecoration(
                                  color: color,
                                  borderRadius:
                                      BorderRadius.circular(8),
                                  border: Border.all(
                                    color: selected
                                        ? theme.colorScheme.primary
                                        : theme.colorScheme
                                            .outlineVariant,
                                    width: selected ? 3 : 1,
                                  ),
                                ),
                                alignment: Alignment.center,
                                child: Column(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      space.index.toString(),
                                      style: theme
                                          .textTheme.titleMedium
                                          ?.copyWith(
                                              fontWeight:
                                                  FontWeight.bold),
                                    ),
                                    Text(
                                      _shortStatus(space),
                                      style: theme
                                          .textTheme.labelSmall,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                  if (_selectedIndexes.isNotEmpty)
                    Align(
                      alignment: Alignment.bottomRight,
                      child: Padding(
                        padding: const EdgeInsets.only(
                            right: 8, bottom: 8),
                        child: FloatingActionButton.extended(
                          onPressed: _openReservationDialog,
                          icon: const Icon(Icons.check),
                          label: Text(
                            'Reservar espacios (${_selectedIndexes.length})',
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------
// AJUSTES (placeholder)
// ------------------------------------------------------------

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Text(
        'Aquí configuraremos más adelante:\n'
        '- Usuarios y roles\n'
        '- Catálogos por cliente (destinos, productos, etiquetas)\n'
        '- Precios por tipo de viaje\n'
        '- etc.',
      ),
    );
  }
}