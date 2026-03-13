"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuentasService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
let CuentasService = class CuentasService {
    async createCuentaConMiembro(tx, dto) {
        const existingUser = await tx.cuenta.findUnique({
            where: { user: dto.user },
            select: { id: true },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Ya existe una cuenta con ese usuario.');
        }
        const existingDni = await tx.miembro.findUnique({
            where: { dni: dto.dni },
            select: { id: true },
        });
        if (existingDni) {
            throw new common_1.ConflictException('Ya existe un miembro con ese DNI.');
        }
        if (dto.email) {
            const existingEmail = await tx.miembro.findUnique({
                where: { email: dto.email },
                select: { id: true },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Ya existe un miembro con ese email.');
            }
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const cuenta = await tx.cuenta.create({
            data: {
                user: dto.user,
                password: hashedPassword,
            },
            select: {
                id: true,
                user: true,
            },
        });
        const miembro = await tx.miembro.create({
            data: {
                nombre: dto.nombre,
                apellidos: dto.apellidos,
                dni: dto.dni,
                fecha_nacimiento: dto.fechaNacimiento,
                direccion: dto.direccion,
                email: dto.email,
                telefono: dto.telefono,
                telefono_emergencia: dto.telefonoEmergencia,
                totem: dto.totem,
                cualidad: dto.cualidad,
                id_cuenta: cuenta.id,
            },
            select: {
                id: true,
            },
        });
        return {
            cuentaId: cuenta.id,
            miembroId: miembro.id,
            user: cuenta.user,
        };
    }
    async updateCuentaConMiembro(tx, identifiers, dto) {
        if (dto.user) {
            const existingUser = await tx.cuenta.findFirst({
                where: {
                    user: dto.user,
                    NOT: {
                        id: identifiers.cuentaId,
                    },
                },
                select: { id: true },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Ya existe una cuenta con ese usuario.');
            }
        }
        if (dto.dni) {
            const existingDni = await tx.miembro.findFirst({
                where: {
                    dni: dto.dni,
                    NOT: {
                        id: identifiers.miembroId,
                    },
                },
                select: { id: true },
            });
            if (existingDni) {
                throw new common_1.ConflictException('Ya existe un miembro con ese DNI.');
            }
        }
        if (dto.email) {
            const existingEmail = await tx.miembro.findFirst({
                where: {
                    email: dto.email,
                    NOT: {
                        id: identifiers.miembroId,
                    },
                },
                select: { id: true },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Ya existe un miembro con ese email.');
            }
        }
        const cuentaData = {};
        if (dto.user !== undefined) {
            cuentaData.user = dto.user;
        }
        if (dto.password) {
            cuentaData.password = await bcrypt.hash(dto.password, 10);
        }
        if (Object.keys(cuentaData).length > 0) {
            await tx.cuenta.update({
                where: { id: identifiers.cuentaId },
                data: cuentaData,
            });
        }
        const miembroData = {};
        if (dto.nombre !== undefined) {
            miembroData.nombre = dto.nombre;
        }
        if (dto.apellidos !== undefined) {
            miembroData.apellidos = dto.apellidos;
        }
        if (dto.dni !== undefined) {
            miembroData.dni = dto.dni;
        }
        if (dto.fechaNacimiento !== undefined) {
            miembroData.fecha_nacimiento = dto.fechaNacimiento;
        }
        if (dto.direccion !== undefined) {
            miembroData.direccion = dto.direccion;
        }
        if (dto.email !== undefined) {
            miembroData.email = dto.email;
        }
        if (dto.telefono !== undefined) {
            miembroData.telefono = dto.telefono;
        }
        if (dto.telefonoEmergencia !== undefined) {
            miembroData.telefono_emergencia = dto.telefonoEmergencia;
        }
        if (dto.totem !== undefined) {
            miembroData.totem = dto.totem;
        }
        if (dto.cualidad !== undefined) {
            miembroData.cualidad = dto.cualidad;
        }
        if (Object.keys(miembroData).length > 0) {
            await tx.miembro.update({
                where: { id: identifiers.miembroId },
                data: miembroData,
            });
        }
    }
};
exports.CuentasService = CuentasService;
exports.CuentasService = CuentasService = __decorate([
    (0, common_1.Injectable)()
], CuentasService);
//# sourceMappingURL=cuentas.service.js.map