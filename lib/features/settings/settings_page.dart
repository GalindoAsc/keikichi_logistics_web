import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/payment_instructions.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _bankController;
  late final TextEditingController _accountNameController;
  late final TextEditingController _accountNumberController;
  late final TextEditingController _clabeController;
  late final TextEditingController _referenceController;

  @override
  void initState() {
    super.initState();
    final current = PaymentConfig.current;
    _bankController = TextEditingController(text: current.bankName);
    _accountNameController = TextEditingController(text: current.accountName);
    _accountNumberController =
        TextEditingController(text: current.accountNumber);
    _clabeController = TextEditingController(text: current.clabe);
    _referenceController = TextEditingController(text: current.referenceHint);
  }

  @override
  void dispose() {
    _bankController.dispose();
    _accountNameController.dispose();
    _accountNumberController.dispose();
    _clabeController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  void _savePaymentInstructions() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final updated = PaymentConfig.current.copyWith(
      bankName: _bankController.text.trim(),
      accountName: _accountNameController.text.trim(),
      accountNumber: _accountNumberController.text.trim(),
      clabe: _clabeController.text.trim(),
      referenceHint: _referenceController.text.trim(),
    );

    PaymentConfig.update(updated);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Instrucciones de transferencia actualizadas.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Aquí configuraremos más adelante:\n'
            '- Usuarios y roles\n'
            '- Catálogos por cliente (destinos, productos, etiquetas)\n'
            '- Precios por tipo de viaje\n'
            '- etc.',
          ),
          const SizedBox(height: 32),
          Text(
            'Datos para transferencia bancaria',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _bankController,
                  decoration:
                      const InputDecoration(labelText: 'Nombre del banco'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Indica el nombre del banco.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _accountNameController,
                  decoration:
                      const InputDecoration(labelText: 'Nombre de la cuenta'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Indica el nombre de la cuenta.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _accountNumberController,
                  decoration: const InputDecoration(
                    labelText: 'Número de cuenta',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _clabeController,
                  decoration: const InputDecoration(labelText: 'CLABE'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Indica la CLABE para transferencias.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _referenceController,
                  decoration: const InputDecoration(
                    labelText: 'Nota / referencia sugerida',
                  ),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton.icon(
                    onPressed: _savePaymentInstructions,
                    icon: const Icon(Icons.save_outlined),
                    label: const Text('Guardar cambios'),
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
