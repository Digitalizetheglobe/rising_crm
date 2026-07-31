import { Op, Sequelize } from 'sequelize';
import Unit from './unit.model';
import Project from '../projects/project.model';
import { ApiError } from '../../utils/ApiError';
import { UnitType, UnitStatus, UnitFacing } from './unit.constants';
import { getTenantId } from '../../middleware/tenant.middleware';

export const createUnitService = async (body: {
  project: string;
  unitNumber: string;
  type: string;
  floor: number;
  area: number;
  price: number;
  status?: string;
  facing?: string;
  description?: string;
}) => {
  const tenantId = getTenantId();
  
  const project = await Project.findOne({ where: { id: body.project, tenantId } });
  if (!project) throw new ApiError(404, 'Project not found');

  const exists = await Unit.findOne({ where: { projectId: body.project, unitNumber: body.unitNumber, tenantId } });
  if (exists) throw new ApiError(409, `Unit number "${body.unitNumber}" already exists in this project`);

  const unit = await Unit.create({
    tenantId,
    projectId: body.project,
    unitNumber: body.unitNumber,
    type: body.type as UnitType,
    floor: body.floor,
    area: body.area,
    price: body.price,
    ...(body.status ? { status: body.status as UnitStatus } : {}),
    ...(body.facing ? { facing: body.facing as UnitFacing } : {}),
    ...(body.description ? { description: body.description } : {}),
  });

  return await Unit.findByPk(unit.id, {
    include: [{ model: Project, as: 'project', attributes: ['name', 'location', 'status'] }],
  });
};

export const bulkCreateUnitsService = async (body: {
  project: string;
  units: {
    unitNumber: string;
    type: string;
    floor: number;
    area: number;
    price: number;
    facing?: string;
    description?: string;
  }[];
}) => {
  const tenantId = getTenantId();
  
  const project = await Project.findOne({ where: { id: body.project, tenantId } });
  if (!project) throw new ApiError(404, 'Project not found');

  const existingUnits = await Unit.findAll({
    where: { projectId: body.project, tenantId },
    attributes: ['unitNumber'],
  });
  
  const existingNumbers = new Set(existingUnits.map((u) => u.unitNumber));

  const toInsert: any[] = [];
  const skipped: string[] = [];

  for (const u of body.units) {
    if (existingNumbers.has(u.unitNumber)) {
      skipped.push(u.unitNumber);
    } else {
      toInsert.push({ ...u, tenantId, projectId: body.project, status: 'Available' });
      existingNumbers.add(u.unitNumber);
    }
  }

  let insertedCount = 0;
  if (toInsert.length > 0) {
    const inserted = await Unit.bulkCreate(toInsert);
    insertedCount = inserted.length;
  }

  return {
    insertedCount,
    skippedCount: skipped.length,
    skippedUnitNumbers: skipped,
  };
};

export const getUnitsService = async (query: {
  projectId?: string;
  status?: string;
  type?: string;
  floor?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  facing?: string;
  search?: string;
  page?: string;
  limit?: string;
}) => {
  const tenantId = getTenantId();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const offset = (page - 1) * limit;

  const where: any = { tenantId };

  if (query.projectId) where.projectId = query.projectId;
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.facing) where.facing = query.facing;
  if (query.floor !== undefined) where.floor = parseInt(query.floor, 10);

  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price[Op.gte] = parseFloat(query.minPrice);
    if (query.maxPrice) where.price[Op.lte] = parseFloat(query.maxPrice);
  }

  if (query.minArea || query.maxArea) {
    where.area = {};
    if (query.minArea) where.area[Op.gte] = parseFloat(query.minArea);
    if (query.maxArea) where.area[Op.lte] = parseFloat(query.maxArea);
  }

  if (query.search) {
    where[Op.or] = [
      { unitNumber: { [Op.iLike]: `%${query.search}%` } },
      { description: { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  const { rows, count } = await Unit.findAndCountAll({
    where,
    include: [{ model: Project, as: 'project', attributes: ['name', 'location', 'status'] }],
    order: [['floor', 'ASC'], ['unitNumber', 'ASC']],
    limit,
    offset,
  });

  return {
    units: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

export const getUnitByIdService = async (unitId: string) => {
  const tenantId = getTenantId();
  const unit = await Unit.findOne({
    where: { id: unitId, tenantId },
    include: [{ model: Project, as: 'project', attributes: ['name', 'location', 'status', 'totalUnits', 'launchDate'] }],
  });
  
  if (!unit) throw new ApiError(404, 'Unit not found');
  return unit;
};

export const updateUnitService = async (
  unitId: string,
  body: {
    unitNumber?: string;
    type?: string;
    floor?: number;
    area?: number;
    price?: number;
    facing?: string | null;
    description?: string;
  }
) => {
  const tenantId = getTenantId();
  const unit = await Unit.findOne({ where: { id: unitId, tenantId } });
  if (!unit) throw new ApiError(404, 'Unit not found');

  if (unit.status !== 'Available') {
    const blockedFields = ['type', 'area', 'price'];
    const attemptedBlocked = blockedFields.filter((f) => (body as any)[f] !== undefined);
    if (attemptedBlocked.length > 0) {
      throw new ApiError(400, `Cannot update ${attemptedBlocked.join(', ')} on a ${unit.status} unit`);
    }
  }

  if (body.unitNumber && body.unitNumber !== unit.unitNumber) {
    const duplicate = await Unit.findOne({
      where: {
        projectId: unit.projectId,
        unitNumber: body.unitNumber,
        tenantId,
        id: { [Op.ne]: unitId }
      },
    });
    if (duplicate) {
      throw new ApiError(409, `Unit number "${body.unitNumber}" already exists in this project`);
    }
  }

  await unit.update(body);

  return await Unit.findByPk(unitId, {
    include: [{ model: Project, as: 'project', attributes: ['name', 'location', 'status'] }],
  });
};

export const updateUnitStatusService = async (unitId: string, status: string) => {
  const tenantId = getTenantId();
  const unit = await Unit.findOne({ where: { id: unitId, tenantId } });
  if (!unit) throw new ApiError(404, 'Unit not found');

  if (unit.status === 'Sold' && status === 'Available') {
    throw new ApiError(400, 'A Sold unit cannot be directly set to Available. Cancel the booking first.');
  }

  await unit.update({ status: status as UnitStatus });

  return await Unit.findByPk(unitId, {
    include: [{ model: Project, as: 'project', attributes: ['name', 'location', 'status'] }],
  });
};

export const deleteUnitService = async (unitId: string) => {
  const tenantId = getTenantId();
  const unit = await Unit.findOne({ where: { id: unitId, tenantId } });
  if (!unit) throw new ApiError(404, 'Unit not found');

  if (unit.status === 'Booked') {
    throw new ApiError(400, 'Cannot delete a Booked unit. Cancel the booking first.');
  }
  if (unit.status === 'Sold') {
    throw new ApiError(400, 'Cannot delete a Sold unit.');
  }

  await unit.destroy();
  return { deleted: true };
};

export const getUnitStatsService = async (projectId?: string) => {
  const tenantId = getTenantId();
  const where: any = { tenantId };
  if (projectId) where.projectId = projectId;

  // By Status
  const byStatusRows = await Unit.findAll({
    where,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['status'],
    order: [['status', 'ASC']],
  });
  const byStatus = byStatusRows.map(r => r.get({ plain: true }));

  // By Type
  const byTypeRows = await Unit.findAll({
    where,
    attributes: [
      ['type', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('AVG', Sequelize.col('price')), 'avgPrice']
    ],
    group: ['type'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
  });
  const byType = byTypeRows.map(r => r.get({ plain: true }));

  // Totals
  const totalsRow = await Unit.findOne({
    where,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalUnits'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END)`), 'availableUnits'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'Booked' THEN 1 ELSE 0 END)`), 'bookedUnits'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'Sold' THEN 1 ELSE 0 END)`), 'soldUnits'],
      [Sequelize.fn('MIN', Sequelize.col('price')), 'minPrice'],
      [Sequelize.fn('MAX', Sequelize.col('price')), 'maxPrice'],
      [Sequelize.fn('AVG', Sequelize.col('price')), 'avgPrice'],
      [Sequelize.fn('SUM', Sequelize.col('area')), 'totalArea'],
    ],
    raw: true,
  }) as any;

  return {
    totalUnits: parseInt(totalsRow?.totalUnits || '0', 10),
    availableUnits: parseInt(totalsRow?.availableUnits || '0', 10),
    bookedUnits: parseInt(totalsRow?.bookedUnits || '0', 10),
    soldUnits: parseInt(totalsRow?.soldUnits || '0', 10),
    priceRange: {
      min: parseFloat(totalsRow?.minPrice || '0'),
      max: parseFloat(totalsRow?.maxPrice || '0'),
      avg: Math.round(parseFloat(totalsRow?.avgPrice || '0')),
    },
    totalArea: parseFloat(totalsRow?.totalArea || '0'),
    byStatus,
    byType,
  };
};
