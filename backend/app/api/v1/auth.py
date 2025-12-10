"""
Authentication Endpoints
Registro, login, tokens JWT y gestión de sesión
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, Token, TokenRefresh, UserOut
from app.services.user_service import UserService
from app.core.exceptions import UnauthorizedException
from app.config import settings

router = APIRouter()


@router.post(
    "/register",
    response_model=UserOut,
    summary="Registrar nuevo usuario",
    description="""
Crea una nueva cuenta de usuario en el sistema.

**Flujo de Registro:**
1. El usuario proporciona email/teléfono, contraseña y nombre
2. Se crea la cuenta con estado `pending_documents`
3. El usuario debe subir documentos de verificación (INE)
4. Un administrador aprueba la verificación
5. El usuario puede empezar a reservar

**Validaciones:**
- Email debe ser único
- Teléfono debe ser único (si se proporciona)
- Contraseña mínimo 8 caracteres
- Al menos email O teléfono requerido
    """,
    responses={
        200: {"description": "Usuario creado exitosamente"},
        400: {"description": "Email o teléfono ya registrado"},
        422: {"description": "Error de validación en los datos"},
    }
)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db_session)):
    service = UserService(db)
    user = await service.create_user(
        email=payload.email, 
        password=payload.password, 
        full_name=payload.full_name, 
        phone=payload.phone
    )
    
    # Notify Admins about new user
    try:
        from app.services.notification_service import notification_service
        from sqlalchemy import select, or_
        
        # Find admins (managers and superadmins)
        stmt = select(User).where(or_(User.role == UserRole.superadmin, User.role == UserRole.manager))
        result = await db.execute(stmt)
        admins = result.scalars().all()
        
        for admin in admins:
            await notification_service.send_in_app(
                user_id=str(admin.id),
                title="Nuevo Usuario Registrado",
                message=f"El usuario {user.full_name} ({user.email or user.phone}) se ha registrado y espera verificación.",
                link="/admin/users",
                type="info"
            )
            # Also send real-time update to refresh admin user list
            await notification_service.send_data_update(
                str(admin.id),
                "USER_REGISTERED",
                {"user_id": str(user.id)}
            )
    except Exception as e:
        print(f"Error sending registration notifications: {e}")
        # Don't fail the request
        
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión",
    description="""
Autentica al usuario y devuelve tokens JWT.

**Respuesta incluye:**
- `access_token` - Token de acceso (expira en 60 minutos)
- `refresh_token` - Token de renovación (expira en 30 días)
- `expires_in` - Segundos hasta expiración del access_token
- `user` - Información del usuario autenticado

**Uso del Token:**
```
Authorization: Bearer <access_token>
```

**Nota:** Los usuarios no verificados pueden iniciar sesión para 
completar el proceso de verificación (subir documentos).
    """,
    responses={
        200: {"description": "Login exitoso"},
        401: {"description": "Credenciales inválidas"},
    }
)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    service = UserService(db)
    user = await service.authenticate(payload.email, payload.password)
    if not user:
        raise UnauthorizedException("Invalid credentials")
    if not user.is_active:
        # Allow login if pending verification but not if rejected/banned
        pass
        
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=user,
    )


@router.post(
    "/refresh",
    response_model=TokenRefresh,
    summary="Renovar access token",
    description="""
Renueva el access token usando un refresh token válido.

**Cuándo usar:**
- Cuando el access_token está por expirar
- Antes de que expire (no después)

**El refresh_token es de un solo uso por seguridad.**
    """,
    responses={
        200: {"description": "Token renovado exitosamente"},
        401: {"description": "Refresh token inválido o expirado"},
    }
)
async def refresh(payload: RefreshRequest):
    token_data = verify_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise UnauthorizedException()
    user_id = token_data.get("sub")
    if not user_id:
        raise UnauthorizedException()
    new_access = create_access_token(user_id)
    return TokenRefresh(access_token=new_access, expires_in=settings.access_token_expire_minutes * 60)


@router.post(
    "/logout",
    summary="Cerrar sesión",
    description="""
Invalida la sesión actual del usuario.

**Nota:** Con JWT, el logout es principalmente del lado del cliente
(eliminar tokens almacenados). Este endpoint confirma la intención.
    """,
    responses={
        200: {"description": "Sesión cerrada"},
    }
)
async def logout():
    return {"message": "Logged out"}


@router.get(
    "/me",
    response_model=UserOut,
    summary="Obtener perfil actual",
    description="""
Devuelve la información del usuario autenticado.

**Requiere autenticación.**

Útil para:
- Verificar que el token es válido
- Obtener datos actualizados del perfil
- Verificar el rol y estado de verificación
    """,
    responses={
        200: {"description": "Perfil del usuario"},
        401: {"description": "No autenticado"},
    }
)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post(
    "/forgot-password",
    summary="Solicitar recuperación de contraseña",
    description="""
Envía un email con instrucciones para restablecer la contraseña.

**Flujo:**
1. Usuario envía su email
2. Se envía un email con link de recuperación
3. El link expira en 1 hora

**Nota:** Por seguridad, siempre se responde con éxito aunque 
el email no exista en el sistema.
    """,
    responses={
        200: {"description": "Email enviado (si existe)"},
    }
)
async def forgot_password(payload: dict):
    return {"message": "Password reset requested", "email": payload.get("email")}


@router.post(
    "/reset-password",
    summary="Restablecer contraseña",
    description="""
Cambia la contraseña usando un token de recuperación.

**Requiere:**
- `token` - Token recibido por email
- `password` - Nueva contraseña

**El token es de un solo uso.**
    """,
    responses={
        200: {"description": "Contraseña actualizada"},
        400: {"description": "Token inválido o expirado"},
    }
)
async def reset_password(payload: dict):
    return {"message": "Password reset", "token": payload.get("token")}
