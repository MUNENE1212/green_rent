import Lease from '../models/Lease.model.js';
import Unit from '../models/Unit.model.js';
import PaymentPlan from '../models/PaymentPlan.model.js';
import Booking from '../models/Booking.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * @desc    Create lease
 * @route   POST /api/v1/leases
 * @access  Private (Landlord/Admin)
 */
export const createLease = catchAsync(async (req, res, next) => {
  const {
    unitId,
    tenantId,
    startDate,
    endDate,
    monthlyRent,
    deposit,
    utilitiesIncluded,
    customTerms,
    bookingId
  } = req.body;

  // Get unit details
  const unit = await Unit.findById(unitId).populate('propertyId', 'landlordId');

  if (!unit) {
    return next(new AppError('Unit not found', 404));
  }

  // Verify landlord ownership or admin
  const landlordId = unit.propertyId.landlordId;
  const isAuthorized =
    landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to create lease for this unit', 403));
  }

  // Check if unit is available
  if (unit.availabilityStatus === 'occupied') {
    return next(new AppError('Unit is currently occupied', 400));
  }

  // Check for active lease on this unit
  const existingLease = await Lease.findOne({
    unitId,
    status: 'active',
    endDate: { $gte: new Date() }
  });

  if (existingLease) {
    return next(new AppError('Unit already has an active lease', 400));
  }

  // Create lease
  const lease = await Lease.create({
    unitId,
    tenantId,
    landlordId,
    startDate,
    endDate,
    monthlyRent: monthlyRent || unit.pricing.baseRent,
    deposit: deposit || unit.pricing.deposit,
    utilitiesIncluded: utilitiesIncluded || false,
    customTerms: customTerms || [],
    status: 'draft'
  });

  // If created from booking, link them
  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (booking) {
      await booking.convertToLease({ leaseId: lease._id });

      // If booking fee was paid, mark deposit as partially paid
      if (booking.bookingFeePaid) {
        lease.depositPaid = booking.bookingFee >= lease.deposit;
        if (lease.depositPaid) {
          lease.depositPaidDate = booking.paymentDetails.paidAt;
        }
        await lease.save();
      }
    }
  }

  // Populate for response
  await lease.populate([
    { path: 'unitId', select: 'unitNumber unitType pricing' },
    { path: 'tenantId', select: 'profile email phone' },
    { path: 'landlordId', select: 'profile email phone' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Lease created successfully',
    data: { lease }
  });
});

/**
 * @desc    Sign lease (tenant or landlord)
 * @route   PUT /api/v1/leases/:id/sign
 * @access  Private
 */
export const signLease = catchAsync(async (req, res, next) => {
  const { signature } = req.body;

  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Determine role
  let role;
  if (lease.tenantId.toString() === req.user._id.toString()) {
    role = 'tenant';
  } else if (lease.landlordId.toString() === req.user._id.toString()) {
    role = 'landlord';
  } else if (req.user.role === 'admin') {
    // Admin can sign on behalf of landlord
    role = 'landlord';
  } else {
    return next(new AppError('Unauthorized to sign this lease', 403));
  }

  // Check if already signed
  if (lease.signatures[role].signed) {
    return next(new AppError(`${role} has already signed this lease`, 400));
  }

  await lease.sign(req.user._id, role, signature, req.ip);

  res.status(200).json({
    success: true,
    message: 'Lease signed successfully',
    data: {
      lease,
      bothPartiesSigned: lease.signatures.tenant.signed && lease.signatures.landlord.signed
    }
  });
});

/**
 * @desc    Activate lease
 * @route   PUT /api/v1/leases/:id/activate
 * @access  Private (Landlord/Admin)
 */
export const activateLease = catchAsync(async (req, res, next) => {
  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify landlord ownership or admin
  const isAuthorized =
    lease.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to activate this lease', 403));
  }

  await lease.activate();

  res.status(200).json({
    success: true,
    message: 'Lease activated successfully',
    data: { lease }
  });
});

/**
 * @desc    Terminate lease
 * @route   PUT /api/v1/leases/:id/terminate
 * @access  Private
 */
export const terminateLease = catchAsync(async (req, res, next) => {
  const { reason, noticeGiven, penaltyAmount } = req.body;

  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Determine who is terminating
  let terminatedBy;
  if (lease.tenantId.toString() === req.user._id.toString()) {
    terminatedBy = 'tenant';
  } else if (lease.landlordId.toString() === req.user._id.toString()) {
    terminatedBy = 'landlord';
  } else if (req.user.role === 'admin') {
    terminatedBy = 'mutual';
  } else {
    return next(new AppError('Unauthorized to terminate this lease', 403));
  }

  await lease.terminate(terminatedBy, reason, noticeGiven, penaltyAmount);

  res.status(200).json({
    success: true,
    message: 'Lease terminated successfully',
    data: { lease }
  });
});

/**
 * @desc    Renew lease
 * @route   POST /api/v1/leases/:id/renew
 * @access  Private (Landlord/Admin)
 */
export const renewLease = catchAsync(async (req, res, next) => {
  const { newEndDate, newMonthlyRent } = req.body;

  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify landlord ownership or admin
  const isAuthorized =
    lease.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to renew this lease', 403));
  }

  const newLease = await lease.renew(newEndDate, newMonthlyRent);

  await newLease.populate([
    { path: 'unitId', select: 'unitNumber unitType pricing' },
    { path: 'tenantId', select: 'profile email phone' },
    { path: 'landlordId', select: 'profile email phone' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Lease renewed successfully',
    data: {
      oldLease: lease,
      newLease
    }
  });
});

/**
 * @desc    Mark deposit as paid
 * @route   PUT /api/v1/leases/:id/deposit-paid
 * @access  Private (Landlord/Admin)
 */
export const markDepositPaid = catchAsync(async (req, res, next) => {
  const { paymentId } = req.body;

  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify landlord ownership or admin
  const isAuthorized =
    lease.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to update this lease', 403));
  }

  lease.depositPaid = true;
  lease.depositPaidDate = Date.now();

  await lease.save();

  res.status(200).json({
    success: true,
    message: 'Deposit marked as paid',
    data: { lease }
  });
});

/**
 * @desc    Add move-in inspection
 * @route   PUT /api/v1/leases/:id/move-in-inspection
 * @access  Private (Landlord/Admin)
 */
export const addMoveInInspection = catchAsync(async (req, res, next) => {
  const { notes, photos, damages } = req.body;

  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify landlord ownership or admin
  const isAuthorized =
    lease.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to update this lease', 403));
  }

  lease.moveInInspection = {
    completed: true,
    completedAt: Date.now(),
    completedBy: req.user._id,
    notes,
    photos: photos || [],
    damages: damages || []
  };

  await lease.save();

  res.status(200).json({
    success: true,
    message: 'Move-in inspection recorded',
    data: { lease }
  });
});

/**
 * @desc    Add move-out inspection
 * @route   PUT /api/v1/leases/:id/move-out-inspection
 * @access  Private (Landlord/Admin)
 */
export const addMoveOutInspection = catchAsync(async (req, res, next) => {
  const { notes, photos, damages, depositDeductions } = req.body;

  const lease = await Lease.findById(req.params.id);

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify landlord ownership or admin
  const isAuthorized =
    lease.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to update this lease', 403));
  }

  // Calculate deposit refund
  const totalDeductions = (depositDeductions || []).reduce((sum, d) => sum + d.amount, 0);
  const depositRefunded = Math.max(0, lease.deposit - totalDeductions);

  lease.moveOutInspection = {
    completed: true,
    completedAt: Date.now(),
    completedBy: req.user._id,
    notes,
    photos: photos || [],
    damages: damages || [],
    depositDeductions: depositDeductions || [],
    depositRefunded
  };

  await lease.save();

  res.status(200).json({
    success: true,
    message: 'Move-out inspection recorded',
    data: {
      lease,
      depositRefunded
    }
  });
});

/**
 * @desc    Get lease by ID
 * @route   GET /api/v1/leases/:id
 * @access  Private
 */
export const getLeaseById = catchAsync(async (req, res, next) => {
  const lease = await Lease.findById(req.params.id)
    .populate('unitId', 'unitNumber unitType pricing propertyId')
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .populate('paymentPlan');

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Check authorization
  const isAuthorized =
    lease.tenantId._id.toString() === req.user._id.toString() ||
    lease.landlordId._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to view this lease', 403));
  }

  res.status(200).json({
    success: true,
    data: { lease }
  });
});

/**
 * @desc    Get all leases (with filters)
 * @route   GET /api/v1/leases
 * @access  Private
 */
export const getAllLeases = catchAsync(async (req, res, next) => {
  const {
    status,
    unitId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = '-createdAt'
  } = req.query;

  // Build filter
  const filter = {};

  // Role-based filtering
  if (req.user.role === 'tenant') {
    filter.tenantId = req.user._id;
  } else if (req.user.role === 'landlord') {
    filter.landlordId = req.user._id;
  }
  // Admin can see all

  if (status) filter.status = status;
  if (unitId) filter.unitId = unitId;

  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  // Execute query
  const leases = await Lease.find(filter)
    .populate('unitId', 'unitNumber unitType pricing')
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Lease.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      leases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get expiring leases
 * @route   GET /api/v1/leases/expiring
 * @access  Private (Landlord/Admin)
 */
export const getExpiringLeases = catchAsync(async (req, res, next) => {
  const { days = 30 } = req.query;

  let expiringLeases = await Lease.findExpiringLeases(Number(days));

  // Filter by landlord if not admin
  if (req.user.role === 'landlord') {
    expiringLeases = expiringLeases.filter(
      l => l.landlordId._id.toString() === req.user._id.toString()
    );
  }

  res.status(200).json({
    success: true,
    data: {
      leases: expiringLeases,
      count: expiringLeases.length
    }
  });
});

/**
 * @desc    Get overdue leases
 * @route   GET /api/v1/leases/overdue
 * @access  Private (Landlord/Admin)
 */
export const getOverdueLeases = catchAsync(async (req, res, next) => {
  let overdueLeases = await Lease.findOverdueLeases();

  // Filter by landlord if not admin
  if (req.user.role === 'landlord') {
    overdueLeases = overdueLeases.filter(
      l => l.landlordId._id.toString() === req.user._id.toString()
    );
  }

  res.status(200).json({
    success: true,
    data: {
      leases: overdueLeases,
      count: overdueLeases.length
    }
  });
});

/**
 * @desc    Get lease document
 * @route   GET /api/v1/leases/:id/document
 * @access  Private
 */
export const getLeaseDocument = catchAsync(async (req, res, next) => {
  const lease = await Lease.findById(req.params.id)
    .populate('unitId')
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone');

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Check authorization
  const isAuthorized =
    lease.tenantId._id.toString() === req.user._id.toString() ||
    lease.landlordId._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to view this lease document', 403));
  }

  // Generate lease agreement document (would typically use PDF generation)
  const document = {
    leaseNumber: lease.leaseNumber,
    date: lease.createdAt,
    landlord: {
      name: `${lease.landlordId.profile.firstName} ${lease.landlordId.profile.lastName}`,
      email: lease.landlordId.email,
      phone: lease.landlordId.phone
    },
    tenant: {
      name: `${lease.tenantId.profile.firstName} ${lease.tenantId.profile.lastName}`,
      email: lease.tenantId.email,
      phone: lease.tenantId.phone
    },
    property: lease.unitId,
    terms: {
      startDate: lease.startDate,
      endDate: lease.endDate,
      monthlyRent: lease.monthlyRent,
      deposit: lease.deposit,
      utilitiesIncluded: lease.utilitiesIncluded,
      customTerms: lease.customTerms
    },
    signatures: lease.signatures,
    status: lease.status
  };

  res.status(200).json({
    success: true,
    data: { document }
  });
});
