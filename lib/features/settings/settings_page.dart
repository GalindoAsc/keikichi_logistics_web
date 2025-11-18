import 'package:flutter/material.dart';

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
