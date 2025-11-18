import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/currency.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';

// Simulación: dueño de la cuenta actual.
// Más adelante esto saldrá de la sesión del usuario autenticado.
const String kCurrentCustomerName = 'Cliente Demo Keikichi';

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
  final Set<int> _selectedIndexes = {};

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

    double calculateTotalBase(List<_ProductLabelConfig> currentLabelConfigs) {
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
                    DropdownButtonFormField<_SavedDestination>(
                      decoration: const InputDecoration(
                        labelText: 'Usar destino guardado (opcional)',
                      ),
                      items: _savedDestinations
                          .map(
                            (dest) => DropdownMenuItem(
                              value: dest,
                              child: Text(dest.displayLabel),
                            ),
                          )
                          .toList(),
                      onChanged: (dest) {
                        if (dest != null) {
                          setLocal(() {
                            destinationNameController.text = dest.name;
                            destinationContactController.text = dest.contactName;
                            destinationAddressController.text = dest.address;
                            destinationReferenceController.text = dest.reference;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: destinationNameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre de destino (bodega/rancho)',
                      ),
                    ),
                    TextField(
                      controller: destinationContactController,
                      decoration: const InputDecoration(
                        labelText: 'Persona/empresa receptora',
                      ),
                    ),
                    TextField(
                      controller: destinationAddressController,
                      decoration: const InputDecoration(
                        labelText: 'Dirección completa',
                      ),
                    ),
                    TextField(
                      controller: destinationReferenceController,
                      decoration: const InputDecoration(
                        labelText: 'Referencias de la dirección',
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Productos',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Column(
                      children: [
                        for (int i = 0; i < productLines.length; i++)
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          decoration: const InputDecoration(
                                            labelText: 'Producto',
                                            hintText: 'Ej. Albahaca',
                                          ),
                                          onChanged: (val) {
                                            productLines[i].productName = val;
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      IconButton(
                                        onPressed: productLines.length > 1
                                            ? () {
                                                setLocal(() {
                                                  productLines.removeAt(i);
                                                  labelConfigs.removeAt(i);
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
                                                int.tryParse(val) ?? 0;
                                            if (!clientProvidesLabels &&
                                                labelConfigs[i]
                                                        .labelsCount ==
                                                    0) {
                                              setLocal(() {
                                                labelConfigs[i].labelsCount =
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
                                            DropdownButtonFormField<String>(
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
                                              productLines[i].unit = val;
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
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      flex: 3,
                                      child:
                                          DropdownButtonFormField<String>(
                                        value: labelConfigs[i]
                                            .labelFileName,
                                        items: labelFiles
                                            .map(
                                              (f) => DropdownMenuItem(
                                                value: f,
                                                child: Text(f),
                                              ),
                                            )
                                            .toList(),
                                        onChanged: (val) {
                                          setLocal(() {
                                            labelConfigs[i]
                                                .labelFileName = val;
                                          });
                                        },
                                        decoration: const InputDecoration(
                                          labelText: 'Archivo de etiqueta',
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    SizedBox(
                                      width: 80,
                                      child: TextField(
                                        keyboardType:
                                            TextInputType.number,
                                        decoration: const InputDecoration(
                                          labelText: 'Etiquetas',
                                        ),
                                        onChanged: (val) {
                                          final parsed =
                                              int.tryParse(val) ?? 0;
                                          setLocal(() {
                                            labelConfigs[i]
                                                .labelsCount = parsed;
                                          });
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                    ],
                    const SizedBox(height: 16),
                    const Text(
                      'Fianza y recolección',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (trip.isInternational)
                      RadioListTile<_BondOption>(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('El cliente usará su propia fianza'),
                        value: _BondOption.client,
                        groupValue: bondOption,
                        onChanged: (val) {
                          if (val != null) {
                            setLocal(() => bondOption = val);
                          }
                        },
                      ),
                    if (trip.isInternational)
                      RadioListTile<_BondOption>(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          'Keikichi proporcionará la fianza (+ '
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
                    if (trip.isInternational &&
                        bondOption == _BondOption.client)
                      TextField(
                        controller: bondFileController,
                        decoration: const InputDecoration(
                          labelText: 'Archivo de fianza del cliente',
                        ),
                      ),
                    RadioListTile<_PickupOption>(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Cliente llevará a bodega'),
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
    return Scaffold(
      body: Row(
        children: [
          SizedBox(
            width: 320,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: DropdownButtonFormField<Trip>(
                    value: _selectedTrip,
                    items: widget.trips
                        .map(
                          (trip) => DropdownMenuItem(
                            value: trip,
                            child: Text('${trip.id} · ${trip.destination}'),
                          ),
                        )
                        .toList(),
                    onChanged: (trip) {
                      setState(() {
                        _selectedTrip = trip;
                        _selectedIndexes.clear();
                      });
                    },
                    decoration: const InputDecoration(
                      labelText: 'Selecciona un viaje',
                    ),
                  ),
                ),
                Expanded(
                  child: _selectedTrip == null
                      ? const Center(
                          child: Text('No hay viajes disponibles.'),
                        )
                      : ListView.builder(
                          itemCount: _selectedTrip!.spaces.length,
                          itemBuilder: (context, index) {
                            final space = _selectedTrip!.spaces[index];
                            return ListTile(
                              title: Text('Espacio ${space.index}'),
                              subtitle: Text(space.status.label),
                              trailing: Icon(
                                Icons.circle,
                                size: 12,
                                color: _spaceColor(space.status, theme),
                              ),
                              onTap: () {
                                if (space.status != SpaceStatus.free) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Este espacio ya está reservado/ocupado/bloqueado.',
                                      ),
                                    ),
                                  );
                                  return;
                                }
                                setState(() {
                                  if (_selectedIndexes.contains(index)) {
                                    _selectedIndexes.remove(index);
                                  } else {
                                    _selectedIndexes.add(index);
                                  }
                                });
                              },
                              selected: _selectedIndexes.contains(index),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: _selectedTrip == null
                ? const SizedBox.shrink()
                : Stack(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
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
