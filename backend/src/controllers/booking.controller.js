import Booking from '../models/Booking.model.js';
import Unit from '../models/Unit.model.js';
import Property from '../models/Property.model.js';
import User from '../models/User.model.js';
import Payment from '../models/Payment.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * @desc    Create booking/viewing request
 * @route   POST /api/v1/bookings
 * @access  Private (Tenant)
 */
export const createBooking = catchAsync(async (req, res, next) => {
  const {
    unitId,
    bookingType,
    skipPhysicalViewing,
    viewingDetails,
    reservationDetails
  } = req.body;

  // Get unit details
  const unit = await Unit.findById(unitId)
    .populate('propertyId', 'landlordId name location');

  if (!unit) {
    return next(new AppError('Unit not found', 404));
  }

  // Check if unit is available
  if (unit.availabilityStatus !== 'available') {
    return next(new AppError('Unit is not available for booking', 400));
  }

  const landlordId = unit.propertyId.landlordId;

  // Calculate booking fee
  let bookingFee = 0;
  if (bookingType === 'direct_reservation' || bookingType === 'express_move_in') {
    // Booking fee is typically 10-20% of monthly rent or fixed amount
    bookingFee = Math.min(unit.pricing.baseRent * 0.15, 10000); // 15% or max KES 10,000
  }

  // Create booking
  const booking = await Booking.create({
    unitId,
    tenantId: req.user._id,
    landlordId,
    bookingType,
    skipPhysicalViewing: skipPhysicalViewing || false,
    bookingFee,
    viewingDetails: viewingDetails || {},
    reservationDetails: reservationDetails || {},
    status: bookingFee > 0 ? 'pending' : 'confirmed' // Pending if fee required
  });

  // Populate for response
  await booking.populate([
    { path: 'unitId', select: 'unitNumber unitType pricing media' },
    { path: 'tenantId', select: 'profile email phone' },
    { path: 'landlordId', select: 'profile email phone' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      booking,
      paymentRequired: bookingFee > 0,
      bookingFee
    }
  });
});

/**
 * @desc    Pay booking fee
 * @route   POST /api/v1/bookings/:id/pay-fee
 * @access  Private (Tenant)
 */
export const payBookingFee = catchAsync(async (req, res, next) => {
  const { paymentMethod, metadata } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify tenant ownership
  if (booking.tenantId.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized to pay for this booking', 403));
  }

  if (booking.bookingFeePaid) {
    return next(new AppError('Booking fee already paid', 400));
  }

  // Create payment record
  const payment = await Payment.create({
    tenantId: booking.tenantId,
    landlordId: booking.landlordId,
    amount: booking.bookingFee,
    type: 'booking_fee',
    paymentMethod,
    metadata: {
      ...metadata,
      bookingId: booking._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    },
    breakdown: {
      total: booking.bookingFee
    },
    status: 'processing'
  });

  // Update booking with payment details
  booking.bookingFeePaymentId = payment._id;
  booking.paymentDetails = {
    paymentId: payment._id,
    amount: booking.bookingFee,
    method: paymentMethod
  };

  // IntaSend integration would happen here
  // For now, auto-complete payment for testing
  await payment.markAsCompleted();
  booking.bookingFeePaid = true;
  booking.paymentDetails.paidAt = Date.now();

  // If it's a reservation, reserve the unit
  if (booking.bookingType === 'direct_reservation' || booking.bookingType === 'express_move_in') {
    await booking.reserve();
  } else {
    booking.status = 'confirmed';
  }

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking fee paid successfully',
    data: { booking, payment }
  });
});

/**
 * @desc    Confirm viewing appointment
 * @route   PUT /api/v1/bookings/:id/confirm-viewing
 * @access  Private (Landlord)
 */
export const confirmViewing = catchAsync(async (req, res, next) => {
  const { confirmedDate, confirmedTime, meetingPoint } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify landlord ownership
  if (booking.landlordId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to confirm this booking', 403));
  }

  await booking.confirmViewing(confirmedDate, confirmedTime, meetingPoint);

  res.status(200).json({
    success: true,
    message: 'Viewing confirmed successfully',
    data: { booking }
  });
});

/**
 * @desc    Complete viewing
 * @route   PUT /api/v1/bookings/:id/complete-viewing
 * @access  Private (Landlord/Tenant)
 */
export const completeViewing = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify authorization
  const isAuthorized =
    booking.tenantId.toString() === req.user._id.toString() ||
    booking.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to complete this booking', 403));
  }

  await booking.completeViewing();

  res.status(200).json({
    success: true,
    message: 'Viewing marked as completed',
    data: { booking }
  });
});

/**
 * @desc    Track virtual viewing progress
 * @route   PUT /api/v1/bookings/:id/track-virtual-viewing
 * @access  Private (Tenant)
 */
export const trackVirtualViewing = catchAsync(async (req, res, next) => {
  const { viewed360Tour, watchedVideo, viewedPhotos, totalViewTime } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify tenant ownership
  if (booking.tenantId.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized to update this booking', 403));
  }

  await booking.trackVirtualViewing({
    viewed360Tour,
    watchedVideo,
    viewedPhotos,
    totalViewTime
  });

  res.status(200).json({
    success: true,
    message: 'Virtual viewing progress updated',
    data: { booking }
  });
});

/**
 * @desc    Cancel booking
 * @route   PUT /api/v1/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Determine who is cancelling
  let cancelledBy;
  if (booking.tenantId.toString() === req.user._id.toString()) {
    cancelledBy = 'tenant';
  } else if (booking.landlordId.toString() === req.user._id.toString()) {
    cancelledBy = 'landlord';
  } else if (req.user.role === 'admin') {
    cancelledBy = 'system';
  } else {
    return next(new AppError('Unauthorized to cancel this booking', 403));
  }

  await booking.cancel(cancelledBy, reason);

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      booking,
      refundAmount: booking.cancellationDetails.refundAmount
    }
  });
});

/**
 * @desc    Convert booking to lease
 * @route   POST /api/v1/bookings/:id/convert-to-lease
 * @access  Private (Landlord)
 */
export const convertToLease = catchAsync(async (req, res, next) => {
  const { leaseData } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify landlord ownership
  if (booking.landlordId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to convert this booking', 403));
  }

  await booking.convertToLease(leaseData);

  // This would typically trigger lease creation in lease service
  // For now, just update booking status

  res.status(200).json({
    success: true,
    message: 'Booking converted to lease',
    data: { booking }
  });
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/v1/bookings/:id
 * @access  Private
 */
export const getBookingById = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('unitId', 'unitNumber unitType pricing media propertyId')
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .populate('bookingFeePaymentId');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check authorization
  const isAuthorized =
    booking.tenantId._id.toString() === req.user._id.toString() ||
    booking.landlordId._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to view this booking', 403));
  }

  res.status(200).json({
    success: true,
    data: { booking }
  });
});

/**
 * @desc    Get all bookings (with filters)
 * @route   GET /api/v1/bookings
 * @access  Private
 */
export const getAllBookings = catchAsync(async (req, res, next) => {
  const {
    status,
    bookingType,
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
  if (bookingType) filter.bookingType = bookingType;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  // Execute query
  const bookings = await Booking.find(filter)
    .populate('unitId', 'unitNumber unitType pricing')
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Booking.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      bookings,
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
 * @desc    Get expiring reservations
 * @route   GET /api/v1/bookings/expiring
 * @access  Private (Landlord/Admin)
 */
export const getExpiringReservations = catchAsync(async (req, res, next) => {
  const { hours = 24 } = req.query;

  let expiringReservations = await Booking.findExpiringReservations(Number(hours));

  // Filter by landlord if not admin
  if (req.user.role === 'landlord') {
    expiringReservations = expiringReservations.filter(
      b => b.landlordId._id.toString() === req.user._id.toString()
    );
  }

  res.status(200).json({
    success: true,
    data: {
      bookings: expiringReservations,
      count: expiringReservations.length
    }
  });
});

/**
 * @desc    Submit booking feedback
 * @route   PUT /api/v1/bookings/:id/feedback
 * @access  Private (Tenant)
 */
export const submitFeedback = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify tenant ownership
  if (booking.tenantId.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized to submit feedback for this booking', 403));
  }

  if (booking.status !== 'completed') {
    return next(new AppError('Can only submit feedback for completed bookings', 400));
  }

  booking.feedback = {
    rating,
    comment,
    submittedAt: Date.now()
  };

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: { booking }
  });
});
