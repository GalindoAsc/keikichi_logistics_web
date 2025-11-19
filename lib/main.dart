import 'package:flutter/material.dart';
import 'package:keikichi_logistics_web/core/auth/auth_service.dart';
import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/trip.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';
import 'package:keikichi_logistics_web/features/admin/admin_dashboard_page.dart';
import 'package:keikichi_logistics_web/features/auth/login_page.dart';
import 'package:keikichi_logistics_web/features/settings/settings_page.dart';
import 'package:keikichi_logistics_web/features/spaces/spaces_page.dart';
import 'package:keikichi_logistics_web/features/trips/trips_page.dart';

void main() {
  runApp(const KeikichiLogisticsApp());
}

class KeikichiLogisticsApp extends StatefulWidget {
  const KeikichiLogisticsApp({super.key});

  @override
  State<KeikichiLogisticsApp> createState() => _KeikichiLogisticsAppState();
}

class _KeikichiLogisticsAppState extends State<KeikichiLogisticsApp> {
  AppUser? _currentUser;

  @override
  void initState() {
    super.initState();
    _currentUser = AuthService.instance.currentUser;
  }

  void _handleLoggedIn(AppUser user) {
    setState(() => _currentUser = user);
  }

  void _handleLogout() {
    AuthService.instance.logout();
    setState(() => _currentUser = null);
  }

  @override
  Widget build(BuildContext context) {
    const keikichiSeed = Color(0xFF4CAF50);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: keikichiSeed,
      brightness: Brightness.light,
    );

    final home = _currentUser == null
        ? LoginPage(onLoggedIn: _handleLoggedIn)
        : MainShell(
            currentUser: _currentUser!,
            onLogout: _handleLogout,
          );

    return MaterialApp(
      title: 'Keikichi Logistics',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: colorScheme,
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF4F5F7),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: colorScheme.surface,
          foregroundColor: colorScheme.onSurface,
          elevation: 0,
          titleTextStyle: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        floatingActionButtonTheme: FloatingActionButtonThemeData(
          backgroundColor: colorScheme.primary,
          foregroundColor: Colors.white,
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: colorScheme.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
          ),
        ),
      ),
      home: home,
    );
  }
}

class MainShell extends StatefulWidget {
  final AppUser currentUser;
  final VoidCallback onLogout;
  const MainShell({
    super.key,
    required this.currentUser,
    required this.onLogout,
  });

  @override
  State<MainShell> createState() => _MainShellState();
}

enum AppSection { trips, spaces, settings, admin }

class _MainShellState extends State<MainShell> {
  AppSection _section = AppSection.trips;

  final List<Trip> _trips = [];
  Trip? _selectedTripForSpaces;

  bool get _isClient => widget.currentUser.role == UserRole.client;

  List<AppSection> get _availableSections {
    final sections = [AppSection.trips, AppSection.spaces, AppSection.settings];
    if (!_isClient) {
      sections.add(AppSection.admin);
    }
    return sections;
  }

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
        currency: TripCurrency.usd,
        basePricePerSpace: 40,
        labelPricePerUnit: 0.5,
        bondPrice: 25,
        pickupPrice: 20,
        exchangeRateToMXN: 18.2,
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
        currency: TripCurrency.mxn,
        basePricePerSpace: 700,
        labelPricePerUnit: 5,
        bondPrice: 0,
        pickupPrice: 350,
        exchangeRateToMXN: null,
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

  NavigationRailDestination _railDestinationFor(AppSection section) {
    switch (section) {
      case AppSection.trips:
        return const NavigationRailDestination(
          icon: Icon(Icons.list_alt_outlined),
          selectedIcon: Icon(Icons.list_alt),
          label: Text('Viajes'),
        );
      case AppSection.spaces:
        return const NavigationRailDestination(
          icon: Icon(Icons.view_column_outlined),
          selectedIcon: Icon(Icons.view_column),
          label: Text('Mapa de espacios'),
        );
      case AppSection.settings:
        return const NavigationRailDestination(
          icon: Icon(Icons.settings_outlined),
          selectedIcon: Icon(Icons.settings),
          label: Text('Ajustes'),
        );
      case AppSection.admin:
        return const NavigationRailDestination(
          icon: Icon(Icons.admin_panel_settings_outlined),
          selectedIcon: Icon(Icons.admin_panel_settings),
          label: Text('Admin'),
        );
    }
  }

  NavigationDestination _bottomDestinationFor(AppSection section) {
    switch (section) {
      case AppSection.trips:
        return const NavigationDestination(
          icon: Icon(Icons.list_alt_outlined),
          selectedIcon: Icon(Icons.list_alt),
          label: 'Viajes',
        );
      case AppSection.spaces:
        return const NavigationDestination(
          icon: Icon(Icons.view_column_outlined),
          selectedIcon: Icon(Icons.view_column),
          label: 'Mapa',
        );
      case AppSection.settings:
        return const NavigationDestination(
          icon: Icon(Icons.settings_outlined),
          selectedIcon: Icon(Icons.settings),
          label: 'Ajustes',
        );
      case AppSection.admin:
        return const NavigationDestination(
          icon: Icon(Icons.admin_panel_settings_outlined),
          selectedIcon: Icon(Icons.admin_panel_settings),
          label: 'Admin',
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final availableSections = _availableSections;
    final activeSection = availableSections.contains(_section)
        ? _section
        : availableSections.first;

    Widget content;
    switch (activeSection) {
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
          currentUser: widget.currentUser,
        );
        break;
      case AppSection.settings:
        content = SettingsPage(currentUser: widget.currentUser);
        break;
      case AppSection.admin:
        content = AdminDashboardPage(
          currentUser: widget.currentUser,
          trips: _trips,
        );
        break;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 900;
        final selectedIndex = availableSections.indexOf(activeSection);

        if (isWide) {
          return Scaffold(
            body: Row(
              children: [
                NavigationRail(
                  labelType: NavigationRailLabelType.all,
                  selectedIndex: selectedIndex,
                  onDestinationSelected: (i) {
                    setState(() => _section = availableSections[i]);
                  },
                  destinations:
                      availableSections.map(_railDestinationFor).toList(),
                  trailing: IconButton(
                    tooltip: 'Cerrar sesión',
                    onPressed: widget.onLogout,
                    icon: const Icon(Icons.logout),
                  ),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: content),
              ],
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Keikichi Logistics'),
            actions: [
              IconButton(
                tooltip: 'Cerrar sesión',
                onPressed: widget.onLogout,
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          body: content,
          bottomNavigationBar: NavigationBar(
            selectedIndex: selectedIndex,
            onDestinationSelected: (i) {
              setState(() => _section = availableSections[i]);
            },
            destinations:
                availableSections.map(_bottomDestinationFor).toList(),
          ),
        );
      },
    );
  }
}
