/**
 * Models Index
 * Central export point for all Mongoose models
 */

import User from './User.model.js';
import Property from './Property.model.js';
import Unit from './Unit.model.js';
import Lease from './Lease.model.js';
import Payment from './Payment.model.js';
import PaymentPlan from './PaymentPlan.model.js';
import RentWallet from './RentWallet.model.js';
import Booking from './Booking.model.js';
import Notification from './Notification.model.js';
import UtilityReading from './UtilityReading.model.js';
import MaintenanceRequest from './MaintenanceRequest.model.js';

export {
  User,
  Property,
  Unit,
  Lease,
  Payment,
  PaymentPlan,
  RentWallet,
  Booking,
  Notification,
  UtilityReading,
  MaintenanceRequest
};

export default {
  User,
  Property,
  Unit,
  Lease,
  Payment,
  PaymentPlan,
  RentWallet,
  Booking,
  Notification,
  UtilityReading,
  MaintenanceRequest
};
