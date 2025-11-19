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

const bool kCustomerHasBondOnFile = false;

Future<List<ReservationDetails>?> showReservationDialog({
  required BuildContext context,
  required Trip trip,
  required List<int> selectedSpaceIndexes,
  required String currentCustomerName,
}) {
  return showDialog<List<ReservationDetails>>(
    context: context,
    barrierDismissible: false,
    builder: (context) => _ReservationDialog(
      trip: trip,
      selectedSpaceIndexes: selectedSpaceIndexes,
      currentCustomerName: currentCustomerName,
    ),
  );
}

enum ReservationMode {
  sameForAll,
  perSpace,
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
class _SpaceFormState {
  _SpaceFormState({
    required _ProductFormData initialProduct,
    required bool isInternational,
  })  : contactNameController = TextEditingController(),
        contactPhoneController = TextEditingController(),
        destinationAddressController = TextEditingController(),
        destinationNotesController = TextEditingController(),
        pickupAddressController = TextEditingController(),
        pickupContactNameController = TextEditingController(),
        pickupContactPhoneController = TextEditingController(),
        customerBondFileNameController = TextEditingController(),
        products = [initialProduct],
        bondChoice = isInternational ? _BondChoice.customer : _BondChoice.customer,
        logisticsChoice = _LogisticsChoice.customer;

  final TextEditingController contactNameController;
  final TextEditingController contactPhoneController;
  final TextEditingController destinationAddressController;
  final TextEditingController destinationNotesController;
  final TextEditingController pickupAddressController;
  final TextEditingController pickupContactNameController;
  final TextEditingController pickupContactPhoneController;
  final TextEditingController customerBondFileNameController;

  bool saveDestinationForLater = false;
  bool customerProvidesLabels = true;
  _BondChoice bondChoice;
  _LogisticsChoice logisticsChoice;
  DateTime? pickupDateTime;
  String? paymentMethod;

  final List<_ProductFormData> products;

  bool get requiresPickupDetails =>
      logisticsChoice == _LogisticsChoice.keikichi;

  void dispose() {
    contactNameController.dispose();
    contactPhoneController.dispose();
    destinationAddressController.dispose();
    destinationNotesController.dispose();
    pickupAddressController.dispose();
    pickupContactNameController.dispose();
    pickupContactPhoneController.dispose();
    customerBondFileNameController.dispose();
    for (final product in products) {
      product.dispose();
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
  ReservationMode _mode = ReservationMode.sameForAll;
  int _activeSpaceFormIndex = 0;
  late final List<_SpaceFormState> _forms;
  int _productCounter = 0;
  int _labelCounter = 0;
  late Set<int> _activeSpaceIndexes;

  @override
  void initState() {
    super.initState();
    _forms = List<_SpaceFormState>.generate(
      widget.selectedSpaceIndexes.length,
      (_) => _createSpaceForm(),
    );
    _activeSpaceIndexes = widget.selectedSpaceIndexes.toSet();
  }

  @override
  void dispose() {
    for (final form in _forms) {
      form.dispose();
    }
    super.dispose();
  }

  _SpaceFormState _createSpaceForm() {
    return _SpaceFormState(
      initialProduct: _createProductForm(),
      isInternational: widget.trip.isInternational,
    );
  }

  _ProductFormData _createProductForm() {
    _productCounter += 1;
    return _ProductFormData(id: 'P-$_productCounter');
  }

  _LabelFormData _createLabelForm() {
    _labelCounter += 1;
    return _LabelFormData(id: 'L-$_labelCounter');
  }

  _SpaceFormState get _currentForm => _forms[_activeSpaceFormIndex];

  bool get _isPerSpace => _mode == ReservationMode.perSpace;

  int get _spacesForCurrentForm =>
      _isPerSpace ? 1 : _activeSpaceIndexes.length;
  Future<void> _selectPickupDateTime(_SpaceFormState form) async {
    final initialDate =
        form.pickupDateTime ?? DateTime.now().add(const Duration(days: 1));
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (pickedDate == null) return;
    final initialTime = form.pickupDateTime != null
        ? TimeOfDay(
            hour: form.pickupDateTime!.hour,
            minute: form.pickupDateTime!.minute,
          )
        : const TimeOfDay(hour: 9, minute: 0);
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );
    if (pickedTime == null) return;
    setState(() {
      form.pickupDateTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        pickedTime.hour,
        pickedTime.minute,
      );
    });
  }

  String _pickupDateTimeLabel(_SpaceFormState form) {
    final dt = form.pickupDateTime;
    if (dt == null) return 'Seleccionar día y hora de recolección';
    final date =
        '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    final time =
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    return '$date · $time';
  }

  void _addProduct() {
    setState(() {
      _currentForm.products.add(_createProductForm());
    });
  }

  void _removeProduct(int index) {
    final form = _currentForm;
    if (form.products.length == 1) return;
    setState(() {
      final removed = form.products.removeAt(index);
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

  List<_ProductFormData> _validProducts(_SpaceFormState form) {
    return form.products.where((product) {
      final qty = int.tryParse(product.quantityController.text) ?? 0;
      return product.nameController.text.trim().isNotEmpty && qty > 0;
    }).toList();
  }

  double _spacesSubtotal(int spacesCount) {
    return widget.trip.basePricePerSpace * spacesCount;
  }

  double _labelsSubtotal(_SpaceFormState form) {
    if (form.customerProvidesLabels) return 0;
    double subtotal = 0;
    for (final product in form.products) {
      for (final label in product.labels) {
        final qty = int.tryParse(label.quantityController.text) ?? 0;
        if (qty <= 0) continue;
        subtotal += qty * widget.trip.labelPricePerUnit;
      }
    }
    return subtotal;
  }

  double _bondSubtotal(_SpaceFormState form) {
    if (!widget.trip.isInternational) return 0;
    return form.bondChoice == _BondChoice.keikichi
        ? widget.trip.bondPrice
        : 0;
  }

  double _logisticsSubtotal(_SpaceFormState form) {
    return form.logisticsChoice == _LogisticsChoice.keikichi
        ? widget.trip.pickupPrice
        : 0;
  }

  double _totalAmount(_SpaceFormState form, int spacesCount) {
    return _spacesSubtotal(spacesCount) +
        _labelsSubtotal(form) +
        _bondSubtotal(form) +
        _logisticsSubtotal(form);
  }

  bool _validateForm(_SpaceFormState form) {
    final destination = form.destinationAddressController.text.trim();
    if (destination.isEmpty) {
      _showError('La dirección de destino es obligatoria.');
      return false;
    }

    final phone = form.contactPhoneController.text.trim();
    if (phone.isEmpty) {
      _showError('El teléfono de contacto es obligatorio.');
      return false;
    }

    final validProducts = _validProducts(form);
    if (validProducts.isEmpty) {
      _showError('Agrega al menos un producto válido (nombre y cantidad).');
      return false;
    }

    if (form.paymentMethod == null) {
      _showError('Selecciona un método de pago.');
      return false;
    }

    if (widget.trip.isInternational &&
        form.bondChoice == _BondChoice.customer &&
        !kCustomerHasBondOnFile &&
        form.customerBondFileNameController.text.trim().isEmpty) {
      _showError('Selecciona al menos un archivo de fianza del cliente.');
      return false;
    }

    if (form.requiresPickupDetails) {
      if (form.pickupAddressController.text.trim().isEmpty) {
        _showError('Indica la dirección de recolección.');
        return false;
      }
      if (form.pickupContactPhoneController.text.trim().isEmpty) {
        _showError('Indica el teléfono del contacto de recolección.');
        return false;
      }
      if (form.pickupDateTime == null) {
        _showError('Selecciona la fecha y hora de recolección.');
        return false;
      }
    }

    return true;
  }
  ReservationDetails _buildReservation(
    _SpaceFormState form,
    List<int> spaceIndexes,
    int sequence,
  ) {
    final validProducts = _validProducts(form);
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
    if (!form.customerProvidesLabels) {
      for (final product in form.products) {
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

    final now = DateTime.now();
    final orderCode = _generateOrderCode(sequence, now);
    final reservationId = 'R-${now.millisecondsSinceEpoch}-$sequence';
    final spacesSubtotal = _spacesSubtotal(spaceIndexes.length);
    final labelsSubtotal = _labelsSubtotal(form);
    final bondSubtotal = _bondSubtotal(form);
    final logisticsSubtotal = _logisticsSubtotal(form);

    return ReservationDetails(
      id: reservationId,
      orderCode: orderCode,
      customerName: widget.currentCustomerName,
      contactName: form.contactNameController.text.trim().isEmpty
          ? null
          : form.contactNameController.text.trim(),
      contactPhone: form.contactPhoneController.text.trim(),
      destinationAddress: form.destinationAddressController.text.trim(),
      destinationNotes: form.destinationNotesController.text.trim().isEmpty
          ? null
          : form.destinationNotesController.text.trim(),
      saveDestinationForLater: form.saveDestinationForLater,
      customerDeliversToWarehouse:
          form.logisticsChoice == _LogisticsChoice.customer,
      pickupAddress: form.requiresPickupDetails
          ? form.pickupAddressController.text.trim()
          : null,
      pickupContactName: form.requiresPickupDetails &&
              form.pickupContactNameController.text.trim().isNotEmpty
          ? form.pickupContactNameController.text.trim()
          : null,
      pickupContactPhone: form.requiresPickupDetails
          ? form.pickupContactPhoneController.text.trim()
          : null,
      pickupDateTime: form.requiresPickupDetails ? form.pickupDateTime : null,
      usesCustomerBond: widget.trip.isInternational &&
          form.bondChoice == _BondChoice.customer,
      usesKeikichiBond: widget.trip.isInternational &&
          form.bondChoice == _BondChoice.keikichi,
      customerBondFileName:
          widget.trip.isInternational &&
                  form.bondChoice == _BondChoice.customer
              ? (kCustomerHasBondOnFile
                  ? null
                  : (form.customerBondFileNameController.text.trim().isEmpty
                      ? null
                      : form.customerBondFileNameController.text.trim()))
              : null,
      products: products,
      labels: labels,
      status: ReservationStatus.pending,
      paymentMethod: form.paymentMethod,
      paymentReceiptFileName: null,
      spaceIndexes: List<int>.from(spaceIndexes),
      spacesSubtotal: spacesSubtotal,
      labelsSubtotal: labelsSubtotal,
      bondSubtotal: bondSubtotal,
      logisticsSubtotal: logisticsSubtotal,
      totalAmount:
          spacesSubtotal + labelsSubtotal + bondSubtotal + logisticsSubtotal,
    );
  }

  String _generateOrderCode(int sequence, DateTime now) {
    final dateCode =
        '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
    final sequenceLabel = (sequence + 1).toString().padLeft(2, '0');
    return 'ORD-$dateCode-$sequenceLabel';
  }

  Future<void> _submit() async {
    if (widget.selectedSpaceIndexes.isEmpty) {
      _showError('Debes seleccionar al menos un espacio.');
      return;
    }

    if (_mode == ReservationMode.sameForAll) {
      final form = _forms.first;
      if (!_validateForm(form)) return;
      if (_activeSpaceIndexes.isEmpty) {
        _showError('Selecciona al menos un espacio para aplicar la reservación.');
        return;
      }
      final selection = _activeSpaceIndexes.toList()..sort();
      final reservation = _buildReservation(
        form,
        selection,
        0,
      );
      Navigator.of(context).pop([reservation]);
      return;
    }

    for (var i = 0; i < _forms.length; i++) {
      if (!_validateForm(_forms[i])) {
        setState(() => _activeSpaceFormIndex = i);
        return;
      }
    }

    final reservations = <ReservationDetails>[];
    for (var i = 0; i < _forms.length; i++) {
      reservations.add(
        _buildReservation(
          _forms[i],
          [widget.selectedSpaceIndexes[i]],
          i,
        ),
      );
    }
    Navigator.of(context).pop(reservations);
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

  Widget _buildModeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('¿Cómo deseas llenar la información?'),
        RadioListTile<ReservationMode>(
          contentPadding: EdgeInsets.zero,
          title: const Text(
            'Aplicar la misma información a todos los espacios seleccionados',
          ),
          subtitle: const Text(
            'Completa un único formulario y lo aplicaremos a todas tus tarimas.',
          ),
          value: ReservationMode.sameForAll,
          groupValue: _mode,
          onChanged: (value) {
            if (value == null) return;
            setState(() {
              _mode = value;
              _activeSpaceFormIndex = 0;
              if (value == ReservationMode.sameForAll) {
                _activeSpaceIndexes = widget.selectedSpaceIndexes.toSet();
              }
            });
          },
        ),
        RadioListTile<ReservationMode>(
          contentPadding: EdgeInsets.zero,
          title: const Text('Configurar cada espacio por separado'),
          subtitle: const Text(
            'Personaliza destino, productos y pago de cada espacio individualmente.',
          ),
          value: ReservationMode.perSpace,
          groupValue: _mode,
          onChanged: (value) {
            if (value == null) return;
            setState(() {
              _mode = value;
              _activeSpaceFormIndex = 0;
            });
          },
        ),
        const SizedBox(height: 8),
        Text(
          _isPerSpace
              ? 'Estás reservando ${widget.selectedSpaceIndexes.length} espacio(s). Configura cada formulario y navega entre ellos usando los chips de abajo.'
              : 'Estás reservando ${widget.selectedSpaceIndexes.length} espacio(s). Toda la información se aplicará por igual.',
        ),
      ],
    );
  }

  Widget _buildSameInfoSpaceSelector() {
    if (_isPerSpace) return const SizedBox.shrink();
    final totalSpaces = widget.selectedSpaceIndexes.length;
    final allSelected = _activeSpaceIndexes.length == totalSpaces;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        _buildSectionTitle('Espacios a los que se aplicará la información'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: widget.selectedSpaceIndexes.map((index) {
            final isActive = _activeSpaceIndexes.contains(index);
            return FilterChip(
              label: Text('Espacio $index'),
              selected: isActive,
              onSelected: (_) {
                setState(() {
                  if (isActive) {
                    _activeSpaceIndexes.remove(index);
                  } else {
                    _activeSpaceIndexes.add(index);
                  }
                });
              },
            );
          }).toList(),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            onPressed: () {
              setState(() {
                if (allSelected) {
                  _activeSpaceIndexes.clear();
                } else {
                  _activeSpaceIndexes = widget.selectedSpaceIndexes.toSet();
                }
              });
            },
            child: Text(allSelected ? 'Limpiar selección' : 'Seleccionar todos'),
          ),
        ),
        if (_activeSpaceIndexes.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Text(
              'Selecciona al menos un espacio para aplicar la reservación.',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
      ],
    );
  }

  Widget _buildSpaceNavigator() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (var i = 0; i < widget.selectedSpaceIndexes.length; i++)
          ChoiceChip(
            label: Text('Espacio ${widget.selectedSpaceIndexes[i]}'),
            selected: _activeSpaceFormIndex == i,
            onSelected: (value) {
              if (!value) return;
              setState(() => _activeSpaceFormIndex = i);
            },
          ),
      ],
    );
  }

  Widget _buildProductCard(int index, _ProductFormData product) {
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
                  onPressed: _currentForm.products.length == 1
                      ? null
                      : () => _removeProduct(index),
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
            if (product.labels.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: product.labels
                      .map(
                        (label) => Chip(
                          label: Text(
                            '${label.labelNameController.text.isEmpty ? 'Etiqueta' : label.labelNameController.text} (${label.quantityController.text})',
                          ),
                        ),
                      )
                      .toList(),
                ),
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
            const SizedBox(height: 8),
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
                    decoration: const InputDecoration(labelText: 'Nombre de etiqueta'),
                  ),
                ),
                IconButton(
                  onPressed: () => _removeLabel(product, index),
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Eliminar etiqueta',
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: label.fileNameController,
              decoration: const InputDecoration(
                labelText: 'Archivo / referencia',
                hintText: 'Opcional',
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: label.quantityController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Cantidad a imprimir'),
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildForm(_SpaceFormState form) {
    final trip = widget.trip;
    final spacesCount = _spacesForCurrentForm;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Datos de contacto y destino'),
        TextField(
          controller: form.contactNameController,
          decoration: const InputDecoration(
            labelText: 'Nombre de contacto (opcional)',
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: form.contactPhoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Teléfono de contacto'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: form.destinationAddressController,
          decoration: const InputDecoration(labelText: 'Dirección de destino'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: form.destinationNotesController,
          decoration: const InputDecoration(
            labelText: 'Notas adicionales (opcional)',
          ),
          maxLines: 2,
        ),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: form.saveDestinationForLater,
          title: const Text('Guardar este destino para uso posterior'),
          onChanged: (value) {
            if (value == null) return;
            setState(() => form.saveDestinationForLater = value);
          },
        ),
        const SizedBox(height: 16),
        _buildSectionTitle('Productos'),
        for (int i = 0; i < form.products.length; i++)
          _buildProductCard(i, form.products[i]),
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
          title: const Text('¿El cliente entregará el producto ya etiquetado?'),
          value: form.customerProvidesLabels,
          onChanged: (value) {
            setState(() => form.customerProvidesLabels = value);
          },
        ),
        if (form.customerProvidesLabels) ...[
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Text(
              'Perfecto, no agregaremos cargos por impresión de etiquetas.',
            ),
          ),
        ] else ...[
          const SizedBox(height: 4),
          const Text('Agrega instrucciones de impresión por producto.'),
          const SizedBox(height: 8),
          for (int i = 0; i < form.products.length; i++)
            _buildLabelsForProduct(form.products[i], i),
        ],
        const SizedBox(height: 16),
        _buildSectionTitle('Fianza'),
        if (trip.isInternational) ...[
          RadioListTile<_BondChoice>(
            contentPadding: EdgeInsets.zero,
            title: const Text('Usar fianza del cliente'),
            value: _BondChoice.customer,
            groupValue: form.bondChoice,
            onChanged: (value) {
              if (value == null) return;
              setState(() => form.bondChoice = value);
            },
          ),
          if (trip.isInternational && form.bondChoice == _BondChoice.customer)
            Padding(
              padding: const EdgeInsets.only(left: 16, bottom: 8),
              child: kCustomerHasBondOnFile
                  ? const Text('Fianza del cliente registrada en el sistema.')
                  : TextField(
                      controller: form.customerBondFileNameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre del archivo de la fianza del cliente',
                        hintText: 'ej. fianza_cliente_2025.pdf',
                      ),
                    ),
            ),
          RadioListTile<_BondChoice>(
            contentPadding: EdgeInsets.zero,
            title: Text(
              'Usar fianza de Keikichi Produce (+ '
              '\$${trip.bondPrice.toStringAsFixed(2)} ${trip.currency.code})',
            ),
            value: _BondChoice.keikichi,
            groupValue: form.bondChoice,
            onChanged: (value) {
              if (value == null) return;
              setState(() => form.bondChoice = value);
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
          groupValue: form.logisticsChoice,
          onChanged: (value) {
            if (value == null) return;
            setState(() => form.logisticsChoice = value);
          },
        ),
        RadioListTile<_LogisticsChoice>(
          contentPadding: EdgeInsets.zero,
          title: Text(
            'Keikichi Produce recoge el producto (+ '
            '\$${trip.pickupPrice.toStringAsFixed(2)} ${trip.currency.code})',
          ),
          value: _LogisticsChoice.keikichi,
          groupValue: form.logisticsChoice,
          onChanged: (value) {
            if (value == null) return;
            setState(() => form.logisticsChoice = value);
          },
        ),
        if (form.requiresPickupDetails) ...[
          TextField(
            controller: form.pickupAddressController,
            decoration: const InputDecoration(
              labelText: 'Dirección de recolección',
            ),
          ),
          TextField(
            controller: form.pickupContactNameController,
            decoration: const InputDecoration(
              labelText: 'Nombre de contacto (opcional)',
            ),
          ),
          TextField(
            controller: form.pickupContactPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Teléfono del contacto',
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => _selectPickupDateTime(form),
            icon: const Icon(Icons.calendar_today),
            label: Text(_pickupDateTimeLabel(form)),
          ),
        ],
        const SizedBox(height: 16),
        _buildSectionTitle('Método de pago'),
        RadioListTile<String>(
          contentPadding: EdgeInsets.zero,
          value: 'transferencia',
          groupValue: form.paymentMethod,
          title: const Text('Transferencia bancaria'),
          subtitle: const Text('Te mostraremos los datos bancarios para tu pago.'),
          onChanged: (value) {
            setState(() => form.paymentMethod = value);
          },
        ),
        RadioListTile<String>(
          contentPadding: EdgeInsets.zero,
          value: 'efectivo',
          groupValue: form.paymentMethod,
          title: const Text('Pago en efectivo'),
          subtitle: const Text('Presenta tu orden en caja para liquidar.'),
          onChanged: (value) {
            setState(() => form.paymentMethod = value);
          },
        ),
        const SizedBox(height: 16),
        _buildSectionTitle('Resumen de precios'),
        Text('Espacios seleccionados: $spacesCount'),
        Text(
          'Precio base por espacio: '
          '\$${trip.basePricePerSpace.toStringAsFixed(2)} ${trip.currency.code}',
        ),
        Text(
          'Subtotal espacios: '
          '\$${_spacesSubtotal(spacesCount).toStringAsFixed(2)} ${trip.currency.code}',
        ),
        Text(
          'Subtotal etiquetas: '
          '\$${_labelsSubtotal(form).toStringAsFixed(2)} ${trip.currency.code}',
        ),
        Text(
          'Subtotal fianza: '
          '\$${_bondSubtotal(form).toStringAsFixed(2)} ${trip.currency.code}',
        ),
        Text(
          'Subtotal logística: '
          '\$${_logisticsSubtotal(form).toStringAsFixed(2)} ${trip.currency.code}',
        ),
        const SizedBox(height: 4),
        Text(
          'Total en ${trip.currency.code}: '
          '\$${_totalAmount(form, spacesCount).toStringAsFixed(2)}',
          style:
              Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Reservar espacios'),
      content: SizedBox(
        width: 860,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildModeSelector(),
              _buildSameInfoSpaceSelector(),
              if (_isPerSpace) ...[
                const SizedBox(height: 12),
                _buildSpaceNavigator(),
              ],
              const SizedBox(height: 16),
              _buildForm(_currentForm),
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
