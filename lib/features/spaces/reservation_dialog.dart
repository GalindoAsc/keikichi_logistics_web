import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';

const List<String> demoProductNames = [
  'Basil',
  'Menta',
  'Zanahoria',
  'Pepino',
  'Cilantro',
  'Apio',
];

Future<ReservationDetails?> showReservationDialog({
  required BuildContext context,
  required Trip trip,
  required List<int> selectedSpaceIndexes,
  required String currentCustomerName,
}) {
  return showDialog<ReservationDetails>(
    context: context,
    barrierDismissible: false,
    builder: (context) => _ReservationDialog(
      trip: trip,
      selectedSpaceIndexes: selectedSpaceIndexes,
      currentCustomerName: currentCustomerName,
    ),
  );
}

enum _BondChoice { customer, keikichi }
enum _LogisticsChoice { customer, keikichi }

class _LabelFormData {
  _LabelFormData({required this.id})
      : labelNameController = TextEditingController(),
        fileNameController = TextEditingController(),
        quantityController = TextEditingController(text: '0');

  final String id;
  final TextEditingController labelNameController;
  final TextEditingController fileNameController;
  final TextEditingController quantityController;

  void dispose() {
    labelNameController.dispose();
    fileNameController.dispose();
    quantityController.dispose();
  }
}

class _ProductFormData {
  _ProductFormData({required this.id})
      : nameController = TextEditingController(),
        nameFocusNode = FocusNode(),
        quantityController = TextEditingController(text: '0'),
        weightController = TextEditingController();

  final String id;
  final TextEditingController nameController;
  final FocusNode nameFocusNode;
  final TextEditingController quantityController;
  final TextEditingController weightController;
  String unit = 'cajas';
  final List<_LabelFormData> labels = [];

  void dispose() {
    nameController.dispose();
    nameFocusNode.dispose();
    quantityController.dispose();
    weightController.dispose();
    for (final label in labels) {
      label.dispose();
    }
  }
}

class _ReservationDialog extends StatefulWidget {
  final Trip trip;
  final List<int> selectedSpaceIndexes;
  final String currentCustomerName;

  const _ReservationDialog({
    required this.trip,
    required this.selectedSpaceIndexes,
    required this.currentCustomerName,
  });

  @override
  State<_ReservationDialog> createState() => _ReservationDialogState();
}

class _ReservationDialogState extends State<_ReservationDialog> {
  late List<_ProductFormData> _products;
  int _productCounter = 0;
  int _labelCounter = 0;

  final TextEditingController _contactNameController = TextEditingController();
  final TextEditingController _contactPhoneController = TextEditingController();
  final TextEditingController _destinationAddressController =
      TextEditingController();
  final TextEditingController _destinationNotesController =
      TextEditingController();
  bool _saveDestinationForLater = false;

  bool _customerProvidesLabels = true;

  final TextEditingController _pickupAddressController = TextEditingController();
  final TextEditingController _pickupContactNameController =
      TextEditingController();
  final TextEditingController _pickupContactPhoneController =
      TextEditingController();
  DateTime? _pickupDateTime;

  _BondChoice _bondChoice = _BondChoice.customer;
  _LogisticsChoice _logisticsChoice = _LogisticsChoice.customer;

  @override
  void initState() {
    super.initState();
    _products = [_createProductForm()];
    if (!widget.trip.isInternational) {
      _bondChoice = _BondChoice.customer;
    }
  }

  @override
  void dispose() {
    for (final product in _products) {
      product.dispose();
    }
    _contactNameController.dispose();
    _contactPhoneController.dispose();
    _destinationAddressController.dispose();
    _destinationNotesController.dispose();
    _pickupAddressController.dispose();
    _pickupContactNameController.dispose();
    _pickupContactPhoneController.dispose();
    super.dispose();
  }

  _ProductFormData _createProductForm() {
    final product = _ProductFormData(id: 'product-${_productCounter++}');
    return product;
  }

  _LabelFormData _createLabelForm() {
    return _LabelFormData(id: 'label-${_labelCounter++}');
  }

  double _spacesSubtotal() {
    return widget.trip.basePricePerSpace * widget.selectedSpaceIndexes.length;
  }

  double _labelsSubtotal() {
    if (_customerProvidesLabels) return 0;
    double total = 0;
    for (final product in _products) {
      for (final label in product.labels) {
        final qty = int.tryParse(label.quantityController.text) ?? 0;
        if (qty <= 0) continue;
        total += qty * widget.trip.labelPricePerUnit;
      }
    }
    return total;
  }

  double _bondSubtotal() {
    if (!widget.trip.isInternational) return 0;
    return _bondChoice == _BondChoice.keikichi ? widget.trip.bondPrice : 0;
  }

  double _logisticsSubtotal() {
    return _logisticsChoice == _LogisticsChoice.customer
        ? 0
        : widget.trip.pickupPrice;
  }

  double get _totalAmount {
    final total =
        _spacesSubtotal() + _labelsSubtotal() + _bondSubtotal() + _logisticsSubtotal();
    // En el futuro se podría aplicar widget.trip.exchangeRateToMXN si se
    // requiere mostrar equivalencias MXN/USD para el total.
    return total;
  }

  bool get _requiresPickupDetails =>
      _logisticsChoice == _LogisticsChoice.keikichi;

  Future<void> _selectPickupDateTime() async {
    final now = DateTime.now();
    final initialDate = _pickupDateTime ?? now.add(const Duration(days: 1));
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (pickedDate == null) return;
    final initialTime = _pickupDateTime != null
        ? TimeOfDay(hour: _pickupDateTime!.hour, minute: _pickupDateTime!.minute)
        : const TimeOfDay(hour: 9, minute: 0);
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );
    if (pickedTime == null) return;
    setState(() {
      _pickupDateTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        pickedTime.hour,
        pickedTime.minute,
      );
    });
  }

  String get _pickupDateTimeLabel {
    final dt = _pickupDateTime;
    if (dt == null) return 'Seleccionar día y hora de recolección';
    final date =
        '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    final time =
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    return '$date · $time';
  }

  void _addProduct() {
    setState(() {
      _products.add(_createProductForm());
    });
  }

  void _removeProduct(int index) {
    if (_products.length == 1) return;
    setState(() {
      final removed = _products.removeAt(index);
      removed.dispose();
    });
  }

  void _addLabel(_ProductFormData product) {
    setState(() {
      product.labels.add(_createLabelForm());
    });
  }

  void _removeLabel(_ProductFormData product, int index) {
    setState(() {
      final removed = product.labels.removeAt(index);
      removed.dispose();
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _submit() {
    if (widget.selectedSpaceIndexes.isEmpty) {
      _showError('Debes seleccionar al menos un espacio.');
      return;
    }

    final destination = _destinationAddressController.text.trim();
    if (destination.isEmpty) {
      _showError('La dirección de destino es obligatoria.');
      return;
    }

    final phone = _contactPhoneController.text.trim();
    if (phone.isEmpty) {
      _showError('El teléfono de contacto es obligatorio.');
      return;
    }

    final validProducts = _products.where((product) {
      final qty = int.tryParse(product.quantityController.text) ?? 0;
      return product.nameController.text.trim().isNotEmpty && qty > 0;
    }).toList();

    if (validProducts.isEmpty) {
      _showError('Agrega al menos un producto válido (nombre y cantidad).');
      return;
    }

    if (_requiresPickupDetails) {
      if (_pickupAddressController.text.trim().isEmpty) {
        _showError('Indica la dirección de recolección.');
        return;
      }
      if (_pickupContactPhoneController.text.trim().isEmpty) {
        _showError('Indica el teléfono del contacto de recolección.');
        return;
      }
      if (_pickupDateTime == null) {
        _showError('Selecciona la fecha y hora de recolección.');
        return;
      }
    }

    final products = validProducts
        .map(
          (product) => ProductLine(
            id: product.id,
            name: product.nameController.text.trim(),
            quantity: int.tryParse(product.quantityController.text) ?? 0,
            unit: product.unit,
            weightPerUnit: double.tryParse(product.weightController.text),
          ),
        )
        .toList();

    final validProductIds = validProducts.map((p) => p.id).toSet();

    final labels = <LabelAssignment>[];
    if (!_customerProvidesLabels) {
      for (final product in _products) {
        if (!validProductIds.contains(product.id)) continue;
        for (final label in product.labels) {
          final name = label.labelNameController.text.trim();
          final qty = int.tryParse(label.quantityController.text) ?? 0;
          if (name.isEmpty || qty <= 0) continue;
          labels.add(
            LabelAssignment(
              id: label.id,
              productLineId: product.id,
              labelName: name,
              fileName: label.fileNameController.text.trim().isEmpty
                  ? null
                  : label.fileNameController.text.trim(),
              quantityToPrint: qty,
            ),
          );
        }
      }
    }

    final reservation = ReservationDetails(
      id: 'R-${DateTime.now().millisecondsSinceEpoch}',
      customerName: widget.currentCustomerName,
      contactName: _contactNameController.text.trim().isEmpty
          ? null
          : _contactNameController.text.trim(),
      contactPhone: phone,
      destinationAddress: destination,
      destinationNotes: _destinationNotesController.text.trim().isEmpty
          ? null
          : _destinationNotesController.text.trim(),
      saveDestinationForLater: _saveDestinationForLater,
      customerDeliversToWarehouse:
          _logisticsChoice == _LogisticsChoice.customer,
      pickupAddress: _requiresPickupDetails
          ? _pickupAddressController.text.trim()
          : null,
      pickupContactName: _requiresPickupDetails &&
              _pickupContactNameController.text.trim().isNotEmpty
          ? _pickupContactNameController.text.trim()
          : null,
      pickupContactPhone: _requiresPickupDetails
          ? _pickupContactPhoneController.text.trim()
          : null,
      pickupDateTime: _requiresPickupDetails ? _pickupDateTime : null,
      usesCustomerBond:
          widget.trip.isInternational && _bondChoice == _BondChoice.customer,
      usesKeikichiBond:
          widget.trip.isInternational && _bondChoice == _BondChoice.keikichi,
      products: products,
      labels: labels,
      status: ReservationStatus.pending,
      paymentMethod: null,
      paymentReceiptFileName: null,
      spaceIndexes: List<int>.from(widget.selectedSpaceIndexes),
      spacesSubtotal: _spacesSubtotal(),
      labelsSubtotal: _labelsSubtotal(),
      bondSubtotal: _bondSubtotal(),
      logisticsSubtotal: _logisticsSubtotal(),
      totalAmount: _totalAmount,
    );

    Navigator.of(context).pop(reservation);
  }

  Widget _buildSectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildProductCard(int index, _ProductFormData product) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: RawAutocomplete<String>(
                    textEditingController: product.nameController,
                    focusNode: product.nameFocusNode,
                    optionsBuilder: (textEditingValue) {
                      final query = textEditingValue.text.toLowerCase();
                      if (query.isEmpty) {
                        return demoProductNames;
                      }
                      return demoProductNames.where(
                        (option) => option.toLowerCase().contains(query),
                      );
                    },
                    fieldViewBuilder:
                        (context, controller, focusNode, onFieldSubmitted) {
                      return TextField(
                        controller: controller,
                        focusNode: focusNode,
                        decoration: const InputDecoration(
                          labelText: 'Producto',
                          hintText: 'Ej. Basil',
                        ),
                        onChanged: (_) => setState(() {}),
                      );
                    },
                    optionsViewBuilder: (context, onSelected, options) {
                      if (options.isEmpty) {
                        return const SizedBox.shrink();
                      }
                      return Align(
                        alignment: Alignment.topLeft,
                        child: Material(
                          elevation: 4,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(
                              maxHeight: 200,
                              maxWidth: 260,
                            ),
                            child: ListView(
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              children: options
                                  .map(
                                    (option) => ListTile(
                                      title: Text(option),
                                      onTap: () => onSelected(option),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ),
                        ),
                      );
                    },
                    onSelected: (selection) {
                      setState(() {
                        product.nameController.text = selection;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed:
                      _products.length == 1 ? null : () => _removeProduct(index),
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Eliminar producto',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: product.quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad',
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: product.unit,
                    decoration: const InputDecoration(labelText: 'Unidad'),
                    items: const [
                      DropdownMenuItem(value: 'cajas', child: Text('Cajas')),
                      DropdownMenuItem(value: 'bolsas', child: Text('Bolsas')),
                      DropdownMenuItem(value: 'cubetas', child: Text('Cubetas')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => product.unit = value);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: product.weightController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Peso por unidad (lbs)',
                hintText: 'Opcional',
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                Text(
                  'Sugerencias:',
                  style: theme.textTheme.bodySmall,
                ),
                ...demoProductNames.map(
                  (name) => ActionChip(
                    label: Text(name),
                    onPressed: () {
                      setState(() {
                        product.nameController.text = name;
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabelsForProduct(_ProductFormData product, int index) {
    final productName = product.nameController.text.trim().isEmpty
        ? 'Producto ${index + 1}'
        : product.nameController.text.trim();
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              productName,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            if (product.labels.isEmpty)
              Text(
                'Agrega instrucciones de impresión para este producto.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            for (int i = 0; i < product.labels.length; i++)
              _buildLabelCard(product, product.labels[i], i),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => _addLabel(product),
                icon: const Icon(Icons.add),
                label: const Text('Agregar etiqueta'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabelCard(
    _ProductFormData product,
    _LabelFormData label,
    int index,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      color: Theme.of(context).colorScheme.surfaceVariant,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: label.labelNameController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre de la etiqueta',
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                IconButton(
                  onPressed: () => _removeLabel(product, index),
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Eliminar etiqueta',
                ),
              ],
            ),
            TextField(
              controller: label.fileNameController,
              decoration: const InputDecoration(
                labelText: 'Nombre de archivo (simulado)',
              ),
            ),
            TextField(
              controller: label.quantityController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Cantidad de etiquetas',
              ),
              onChanged: (_) => setState(() {}),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trip = widget.trip;
    return AlertDialog(
      title: const Text('Reservar espacios'),
      content: SizedBox(
        width: 780,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('Emisor / Cliente'),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Cliente'),
                subtitle: Text(widget.currentCustomerName),
              ),
              const SizedBox(height: 16),
              _buildSectionTitle('Destino'),
              TextField(
                controller: _contactNameController,
                decoration: const InputDecoration(
                  labelText: 'Nombre persona/empresa (opcional)',
                ),
              ),
              TextField(
                controller: _contactPhoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Teléfono de contacto',
                ),
              ),
              TextField(
                controller: _destinationAddressController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Dirección principal',
                ),
              ),
              TextField(
                controller: _destinationNotesController,
                decoration: const InputDecoration(
                  labelText: 'Referencias de la dirección (opcional)',
                ),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _saveDestinationForLater,
                title: const Text('Guardar este destino para uso posterior'),
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _saveDestinationForLater = value);
                },
              ),
              const SizedBox(height: 16),
              _buildSectionTitle('Productos'),
              for (int i = 0; i < _products.length; i++)
                _buildProductCard(i, _products[i]),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _addProduct,
                  icon: const Icon(Icons.add),
                  label: const Text('Agregar producto'),
                ),
              ),
              const SizedBox(height: 16),
              _buildSectionTitle('Etiquetas'),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title:
                    const Text('¿El cliente entregará el producto ya etiquetado?'),
                value: _customerProvidesLabels,
                onChanged: (value) {
                  setState(() => _customerProvidesLabels = value);
                },
              ),
              if (_customerProvidesLabels) ...[
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Perfecto, no agregaremos cargos por impresión de etiquetas.',
                  ),
                ),
              ] else ...[
                const SizedBox(height: 4),
                const Text(
                  'Agrega instrucciones de impresión por producto.',
                ),
                const SizedBox(height: 8),
                for (int i = 0; i < _products.length; i++)
                  _buildLabelsForProduct(_products[i], i),
              ],
              const SizedBox(height: 16),
              _buildSectionTitle('Fianza'),
              if (trip.isInternational) ...[
                RadioListTile<_BondChoice>(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Usar fianza del cliente'),
                  value: _BondChoice.customer,
                  groupValue: _bondChoice,
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _bondChoice = value);
                  },
                ),
                RadioListTile<_BondChoice>(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Usar fianza de Keikichi Produce (+ '
                    '\$${trip.bondPrice.toStringAsFixed(2)} ${trip.currency.code})',
                  ),
                  value: _BondChoice.keikichi,
                  groupValue: _bondChoice,
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _bondChoice = value);
                  },
                ),
              ] else
                const Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 12),
                  child: Text('Este viaje es nacional, no requiere fianza.'),
                ),
              const SizedBox(height: 16),
              _buildSectionTitle('Logística'),
              RadioListTile<_LogisticsChoice>(
                contentPadding: EdgeInsets.zero,
                title: const Text('El cliente lleva el producto a la bodega'),
                value: _LogisticsChoice.customer,
                groupValue: _logisticsChoice,
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _logisticsChoice = value);
                },
              ),
              RadioListTile<_LogisticsChoice>(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  'Keikichi Produce recoge el producto (+ '
                  '\$${trip.pickupPrice.toStringAsFixed(2)} ${trip.currency.code})',
                ),
                value: _LogisticsChoice.keikichi,
                groupValue: _logisticsChoice,
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _logisticsChoice = value);
                },
              ),
              if (_requiresPickupDetails) ...[
                TextField(
                  controller: _pickupAddressController,
                  decoration: const InputDecoration(
                    labelText: 'Dirección de recolección',
                  ),
                ),
                TextField(
                  controller: _pickupContactNameController,
                  decoration: const InputDecoration(
                    labelText: 'Nombre de contacto (opcional)',
                  ),
                ),
                TextField(
                  controller: _pickupContactPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Teléfono del contacto',
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _selectPickupDateTime,
                  icon: const Icon(Icons.calendar_today),
                  label: Text(_pickupDateTimeLabel),
                ),
              ],
              const SizedBox(height: 16),
              _buildSectionTitle('Resumen de precios'),
              Text(
                'Espacios seleccionados: ${widget.selectedSpaceIndexes.length}',
              ),
              Text(
                'Precio base por espacio: '
                '\$${trip.basePricePerSpace.toStringAsFixed(2)} ${trip.currency.code}',
              ),
              Text(
                'Subtotal espacios: '
                '\$${_spacesSubtotal().toStringAsFixed(2)} ${trip.currency.code}',
              ),
              Text(
                'Subtotal etiquetas: '
                '\$${_labelsSubtotal().toStringAsFixed(2)} ${trip.currency.code}',
              ),
              Text(
                'Subtotal fianza: '
                '\$${_bondSubtotal().toStringAsFixed(2)} ${trip.currency.code}',
              ),
              Text(
                'Subtotal logística: '
                '\$${_logisticsSubtotal().toStringAsFixed(2)} ${trip.currency.code}',
              ),
              const SizedBox(height: 4),
              Text(
                'Total en ${trip.currency.code}: '
                '\$${_totalAmount.toStringAsFixed(2)}',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _submit,
          child: const Text('Confirmar reserva'),
        ),
      ],
    );
  }
}
