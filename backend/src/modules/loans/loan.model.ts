import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/sequelize';
import Booking from '../bookings/booking.model';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import Tenant from '../tenants/tenant.model';
import { LoanStatus, LOAN_STATUSES } from './loan.constants';

export interface LoanStatusHistoryEntry {
  status: string;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

export interface LoanAttributes {
  id: string;
  tenantId: string;
  bookingId: string;
  clientId: string;
  createdBy: string;
  bankName: string;
  loanAmount: number;
  sanctionedAmount?: number | null;
  interestRate?: number | null;
  tenureMonths?: number | null;
  emiAmount?: number | null;
  status: LoanStatus;
  applicationDate: Date;
  approvalDate?: Date | null;
  disbursementDate?: Date | null;
  bankContact?: string | null;
  remarks?: string;
  statusHistory: LoanStatusHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoanCreationAttributes extends Optional<LoanAttributes, 'id' | 'status' | 'sanctionedAmount' | 'interestRate' | 'tenureMonths' | 'emiAmount' | 'approvalDate' | 'disbursementDate' | 'bankContact' | 'remarks' | 'statusHistory' | 'createdAt' | 'updatedAt'> {}

class Loan extends Model<LoanAttributes, LoanCreationAttributes> implements LoanAttributes {
  public id!: string;
  public tenantId!: string;
  public bookingId!: string;
  public clientId!: string;
  public createdBy!: string;
  public bankName!: string;
  public loanAmount!: number;
  public sanctionedAmount?: number | null;
  public interestRate?: number | null;
  public tenureMonths?: number | null;
  public emiAmount?: number | null;
  public status!: LoanStatus;
  public applicationDate!: Date;
  public approvalDate?: Date | null;
  public disbursementDate?: Date | null;
  public bankContact?: string | null;
  public remarks?: string;
  public statusHistory!: LoanStatusHistoryEntry[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // relations
  public readonly booking?: Booking;
  public readonly client?: Client;
  public readonly createdByUser?: User;
  public readonly tenant?: Tenant;
}

Loan.init(
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    loanAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('loanAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    sanctionedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      get() {
        const val = this.getDataValue('sanctionedAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      get() {
        const val = this.getDataValue('interestRate');
        return val === null ? null : parseFloat(val as any);
      },
    },
    tenureMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    emiAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      get() {
        const val = this.getDataValue('emiAmount');
        return val === null ? null : parseFloat(val as any);
      },
    },
    status: {
      type: DataTypes.ENUM(...LOAN_STATUSES),
      allowNull: false,
      defaultValue: 'Applied',
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disbursementDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bankContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusHistory: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Loan',
    tableName: 'Loans',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['bookingId'], unique: true },
      { fields: ['clientId', 'status'] },
    ],
  }
);

Loan.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Loan.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Loan.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Loan.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

export default Loan;