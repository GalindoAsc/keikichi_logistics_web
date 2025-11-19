import 'user_role.dart';

class AppUser {
  final String id;
  final String name;
  final String emailOrPhone;
  final UserRole role;
  final bool isVerified;

  const AppUser({
    required this.id,
    required this.name,
    required this.emailOrPhone,
    required this.role,
    required this.isVerified,
  });

  AppUser copyWith({
    String? id,
    String? name,
    String? emailOrPhone,
    UserRole? role,
    bool? isVerified,
  }) {
    return AppUser(
      id: id ?? this.id,
      name: name ?? this.name,
      emailOrPhone: emailOrPhone ?? this.emailOrPhone,
      role: role ?? this.role,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}
