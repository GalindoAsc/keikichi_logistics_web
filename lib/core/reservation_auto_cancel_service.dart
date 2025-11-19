// lib/core/reservation_auto_cancel_service.dart

import 'dart:async';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/core/models/reservation.dart';

/// Servicio que verifica periódicamente las reservaciones pendientes
/// y cancela automáticamente aquellas que no han sido pagadas dentro
/// del plazo establecido.
class ReservationAutoCancelService {
  Timer? _timer;
  final List<Trip> trips;
  final void Function(Trip) onTripUpdate;

  ReservationAutoCancelService({
    required this.trips,
    required this.onTripUpdate,
  });

  /// Inicia el servicio de verificación periódica.
  /// Verifica cada 5 minutos las reservaciones pendientes.
  void start() {
    // Ejecutar inmediatamente la primera vez
    _checkAndCancelExpiredReservations();

    // Luego verificar cada 5 minutos
    _timer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => _checkAndCancelExpiredReservations(),
    );
  }

  /// Detiene el servicio de verificación.
  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Verifica todas las reservaciones pendientes y cancela las que
  /// han excedido el plazo de pago.
  void _checkAndCancelExpiredReservations() {
    final now = DateTime.now();

    for (final trip in trips) {
      // Solo verificar viajes que no estén cancelados o finalizados
      if (trip.status == TripStatus.cancelled ||
          trip.status == TripStatus.finished) {
        continue;
      }

      // Calcular el límite de pago para este viaje
      final paymentDeadline = trip.departureDateTime.subtract(
        Duration(hours: trip.paymentDeadlineHours),
      );

      // Si aún no hemos llegado al límite, no hacer nada
      if (now.isBefore(paymentDeadline)) {
        continue;
      }

      // Verificar cada reservación del viaje
      bool tripNeedsUpdate = false;
      final updatedReservations = <ReservationDetails>[];

      for (final reservation in trip.reservations) {
        // Si la reservación está pendiente y ya pasó el límite, cancelarla
        if (reservation.status == ReservationStatus.pending) {
          // Cancelar la reservación
          final cancelledReservation = reservation.copyWith(
            status: ReservationStatus.cancelled,
          );
          updatedReservations.add(cancelledReservation);
          tripNeedsUpdate = true;

          // Liberar los espacios asociados
          for (final spaceIndex in reservation.spaceIndexes) {
            final space = trip.spaces.firstWhere(
              (s) => s.index == spaceIndex,
              orElse: () => trip.spaces[0], // fallback
            );
            space.status = SpaceStatus.free;
            space.reservation = null;
          }
        } else {
          // Mantener la reservación sin cambios
          updatedReservations.add(reservation);
        }
      }

      // Si hubo cambios, actualizar el viaje
      if (tripNeedsUpdate) {
        final updatedTrip = Trip(
          id: trip.id,
          departureDateTime: trip.departureDateTime,
          origin: trip.origin,
          destination: trip.destination,
          status: trip.status,
          capacitySpaces: trip.capacitySpaces,
          currency: trip.currency,
          basePricePerSpace: trip.basePricePerSpace,
          labelPricePerUnit: trip.labelPricePerUnit,
          bondPrice: trip.bondPrice,
          pickupPrice: trip.pickupPrice,
          isInternational: trip.isInternational,
          exchangeRateToMXN: trip.exchangeRateToMXN,
          paymentDeadlineHours: trip.paymentDeadlineHours,
          spaces: trip.spaces,
          reservations: updatedReservations,
        );

        onTripUpdate(updatedTrip);
      }
    }
  }

  /// Verifica manualmente las reservaciones (útil para testing o llamadas bajo demanda).
  void checkNow() {
    _checkAndCancelExpiredReservations();
  }
}
