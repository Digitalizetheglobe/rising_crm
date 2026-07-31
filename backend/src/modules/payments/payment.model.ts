import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Booking from '../bookings/booking.model';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import {
  PaymentStatus,
  PaymentMode,
  PaymentType,
  PAYMENT_STATUSES,
  PAYMENT_MODES,
  PAYMENT_TYPES,
} from './payment.constants';

export interface PaymentAttributes {
  id: string;
  tenantId: string;
  bookingId: string;
  clientId: string;
  paymentType: PaymentType;
  amount: number;
  dueDate: Date;
  paidDate?: Date | null;
  status: PaymentStatus;
  paymentMode?: PaymentMode | null;
  receiptNumber?: string | null;
  transactionId?: string | null;
  notes?: string;
  recordedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'paidDate' | 'paymentMode' | 'receiptNumber' | 'transactionId' | 'notes' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public tenantId!: string;
  public bookingId!: string;
  public clientId!: string;
  public paymentType!: PaymentType;
  public amount!: number;
  public dueDate!: Date;
  public paidDate?: Date | null;
  public status!: PaymentStatus;
  public paymentMode?: PaymentMode | null;
  public receiptNumber?: string | null;
  public transactionId?: string | null;
  public notes?: string;
  public recordedBy!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly booking?: Booking;
  public readonly client?: Client;
  public readonly recordedByUser?: User;
  public readonly tenant?: Tenant;
}

Payment.init(
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
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Bookings', key: 'id' },
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
    },
    paymentType: {
      type: DataTypes.ENUM(...PAYMENT_TYPES),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('amount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paidDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'Pending',
    },
    paymentMode: {
      type: DataTypes.ENUM(...PAYMENT_MODES),
      allowNull: true,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recordedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['bookingId', 'status'] },
      { fields: ['clientId', 'status'] },
      { fields: ['status', 'dueDate'] },
      { fields: ['receiptNumber'] },
    ],
  }
);

Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Payment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Payment.belongsTo(User, { foreignKey: 'recordedBy', as: 'recordedByUser' });
Payment.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Payment;