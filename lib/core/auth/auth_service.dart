import 'package:keikichi_logistics_web/core/models/app_user.dart';
import 'package:keikichi_logistics_web/core/models/user_role.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  AppUser? _currentUser;
  AppUser? get currentUser => _currentUser;

  static final List<_DemoCredentials> _demoUsers = [
    _DemoCredentials(
      identifier: 'admin@keikichi.test',
      password: 'admin123',
      user: const AppUser(
        id: 'u-admin',
        name: 'Super Admin',
        emailOrPhone: 'admin@keikichi.test',
        role: UserRole.superAdmin,
        isVerified: true,
      ),
    ),
    _DemoCredentials(
      identifier: 'manager@keikichi.test',
      password: 'manager123',
      user: const AppUser(
        id: 'u-manager',
        name: 'Gerente Demo',
        emailOrPhone: 'manager@keikichi.test',
        role: UserRole.manager,
        isVerified: true,
      ),
    ),
    _DemoCredentials(
      identifier: 'cliente1@demo.test',
      password: 'cliente123',
      user: const AppUser(
        id: 'u-client-1',
        name: 'Cliente Demo 1',
        emailOrPhone: 'cliente1@demo.test',
        role: UserRole.client,
        isVerified: true,
      ),
    ),
    _DemoCredentials(
      identifier: 'cliente2@demo.test',
      password: 'cliente123',
      user: const AppUser(
        id: 'u-client-2',
        name: 'Cliente No Verificado',
        emailOrPhone: 'cliente2@demo.test',
        role: UserRole.client,
        isVerified: false,
      ),
    ),
  ];

  Future<AppUser?> login(String identifier, String password) async {
    final match = _demoUsers.firstWhere(
      (d) =>
          d.identifier.toLowerCase() == identifier.toLowerCase() &&
          d.password == password,
      orElse: () => _DemoCredentials.empty,
    );
    if (match == _DemoCredentials.empty) {
      return null;
    }
    _currentUser = match.user;
    return _currentUser;
  }

  void logout() {
    _currentUser = null;
  }
}

class _DemoCredentials {
  final String identifier;
  final String password;
  final AppUser user;

  const _DemoCredentials({
    required this.identifier,
    required this.password,
    required this.user,
  });

  static const empty = _DemoCredentials(
    identifier: '',
    password: '',
    user: AppUser(
      id: '',
      name: '',
      emailOrPhone: '',
      role: UserRole.client,
      isVerified: false,
    ),
  );
}
