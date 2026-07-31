import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Client from '../clients/client.model';
import Unit from '../units/unit.model';
import Project from '../projects/project.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import {
  BookingType,
  BookingStatus,
  PaymentMode,
  BOOKING_TYPES,
  BOOKING_STATUSES,
  PAYMENT_MODES,
} from './booking.constants';

export interface BookingAttributes {
  id: string;
  tenantId: string;
  clientId: string;
  unitId: string;
  projectId: string;
  bookedBy: string;
  bookingType: BookingType;
  status: BookingStatus;
  bookingDate: Date;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  bookingAmount: number;
  paymentMode: PaymentMode;
  remarks?: string;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'status' | 'discountAmount' | 'remarks' | 'cancelledAt' | 'cancellationReason' | 'createdAt' | 'updatedAt'> {}

class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  public id!: string;
  public tenantId!: string;
  public clientId!: string;
  public unitId!: string;
  public projectId!: string;
  public bookedBy!: string;
  public bookingType!: BookingType;
  public status!: BookingStatus;
  public bookingDate!: Date;
  public totalAmount!: number;
  public discountAmount!: number;
  public finalAmount!: number;
  public bookingAmount!: number;
  public paymentMode!: PaymentMode;
  public remarks?: string;
  public cancelledAt?: Date | null;
  public cancellationReason?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly client?: Client;
  public readonly unit?: Unit;
  public readonly project?: Project;
  public readonly bookedByUser?: User;
  public readonly tenant?: Tenant;
}

Booking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tenants', key: 'id' },
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Units', key: 'id' },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },
    bookedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    bookingType: {
      type: DataTypes.ENUM(...BOOKING_TYPES),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...BOOKING_STATUSES),
      allowNull: false,
      defaultValue: 'Active',
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('totalAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('discountAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    finalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('finalAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    bookingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('bookingAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    paymentMode: {
      type: DataTypes.ENUM(...PAYMENT_MODES),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'Bookings',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['unitId', 'status'] },
      { fields: ['clientId', 'status'] },
      { fields: ['projectId', 'bookingDate'] },
    ],
  }
);

Booking.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Booking.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });
Booking.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Booking.belongsTo(User, { foreignKey: 'bookedBy', as: 'bookedByUser' });
Booking.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Booking;