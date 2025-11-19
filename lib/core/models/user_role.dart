// lib/core/models/user_role.dart

enum UserRole {
  superAdmin,
  manager,
  client,
}

extension UserRoleX on UserRole {
  String get label {
    switch (this) {
      case UserRole.superAdmin:
        return 'SuperAdmin';
      case UserRole.manager:
        return 'Gerente';
      case UserRole.client:
        return 'Cliente';
    }
  }
}
