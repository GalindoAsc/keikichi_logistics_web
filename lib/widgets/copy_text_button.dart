import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Widget que muestra un label, un valor y un botón para copiar al portapapeles.
class CopyableText extends StatelessWidget {
  final String label;
  final String value;
  final TextStyle? labelStyle;
  final TextStyle? valueStyle;

  const CopyableText({
    super.key,
    required this.label,
    required this.value,
    this.labelStyle,
    this.valueStyle,
  });

  void _copyToClipboard(BuildContext context) {
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copiado: $value'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: labelStyle ??
                    theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 4),
              SelectableText(
                value,
                style: valueStyle ?? theme.textTheme.bodyLarge,
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.copy, size: 18),
          onPressed: () => _copyToClipboard(context),
          tooltip: 'Copiar',
        ),
      ],
    );
  }
}

/// Botón compacto que copia texto al portapapeles.
class CopyTextButton extends StatelessWidget {
  final String textToCopy;
  final String? tooltip;
  final IconData icon;
  final double iconSize;

  const CopyTextButton({
    super.key,
    required this.textToCopy,
    this.tooltip,
    this.icon = Icons.copy,
    this.iconSize = 18,
  });

  void _copyToClipboard(BuildContext context) {
    Clipboard.setData(ClipboardData(text: textToCopy));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copiado: $textToCopy'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon, size: iconSize),
      onPressed: () => _copyToClipboard(context),
      tooltip: tooltip ?? 'Copiar',
    );
  }
}
