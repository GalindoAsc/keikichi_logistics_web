// lib/core/models/user_role.dart

enum UserRole {
  superAdmin,
  manager,
  customer,
}

extension UserRoleLabel on UserRole {
  String get label {
    switch (this) {
      case UserRole.superAdmin:
        return 'SuperAdmin';
      case UserRole.manager:
        return 'Gerente';
      case UserRole.customer:
        return 'Cliente';
    }
  }
}
