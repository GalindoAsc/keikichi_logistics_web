import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/models/currency.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/features/settings/settings_page.dart';
import 'package:keikichi_logistics_web/features/spaces/spaces_page.dart';
import 'package:keikichi_logistics_web/features/trips/trips_page.dart';

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

enum AppSection { trips, spaces, settings }

class _MainShellState extends State<MainShell> {
  AppSection _section = AppSection.trips;

  final List<Trip> _trips = [];
  Trip? _selectedTripForSpaces;

  @override
  void initState() {
    super.initState();

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
      _section = AppSection.spaces;
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
      case AppSection.spaces:
        content = SpacesPage(
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
