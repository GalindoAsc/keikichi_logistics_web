import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/payment_instructions.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';

class SettingsPage extends StatefulWidget {
  final AppUser currentUser;
  const SettingsPage({super.key, required this.currentUser});

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

  bool get _canEditPaymentInfo {
    return widget.currentUser.role == UserRole.superAdmin ||
        widget.currentUser.role == UserRole.manager;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(widget.currentUser.name.isNotEmpty
                    ? widget.currentUser.name.substring(0, 1).toUpperCase()
                    : '?'),
              ),
              title: Text(widget.currentUser.name),
              subtitle: Text(
                '${widget.currentUser.emailOrPhone}\nRol: ${widget.currentUser.role.label}' +
                    (widget.currentUser.isVerified
                        ? '\nCuenta verificada'
                        : '\nPendiente de verificación'),
              ),
              isThreeLine: true,
            ),
          ),
          const SizedBox(height: 24),
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
          if (!_canEditPaymentInfo)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text(
                'Solo usuarios autorizados pueden modificar esta información.',
                style: TextStyle(
                  color: Colors.orange,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _bankController,
                  decoration:
                      const InputDecoration(labelText: 'Nombre del banco'),
                  enabled: _canEditPaymentInfo,
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
                  enabled: _canEditPaymentInfo,
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
                  enabled: _canEditPaymentInfo,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _clabeController,
                  decoration: const InputDecoration(labelText: 'CLABE'),
                  enabled: _canEditPaymentInfo,
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
                  enabled: _canEditPaymentInfo,
                ),
                const SizedBox(height: 16),
                if (_canEditPaymentInfo)
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
