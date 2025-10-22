import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      'payment',
      'lease',
      'maintenance',
      'price_change',
      'system',
      'message',
      'reminder',
      'wallet',
      'booking',
      'review',
      'alert'
    ],
    required: true,
    index: true
  },

  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },

  message: {
    type: String,
    required: [true, 'Notification message is required']
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  read: {
    type: Boolean,
    default: false,
    index: true
  },

  actionUrl: String,

  actionLabel: String,

  data: {
    type: Schema.Types.Mixed,
    default: {}
  },

  channels: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },

  delivery: {
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: Date,
    emailError: String,

    smsSent: {
      type: Boolean,
      default: false
    },
    smsSentAt: Date,
    smsError: String,

    pushSent: {
      type: Boolean,
      default: false
    },
    pushSentAt: Date,
    pushError: String
  },

  readAt: Date,
  expiresAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ userId: 1, read: 0, createdAt: -1 }); // Unread notifications
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = Date.now();
  return this.save();
};

// Check if expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(notificationData) {
  const notification = await this.create(notificationData);

  // Get user preferences
  const User = mongoose.model('User');
  const user = await User.findById(notificationData.userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Send based on user preferences and notification channels
  const sendPromises = [];

  if (notification.channels.email && user.preferences.notifications.email) {
    sendPromises.push(notification.sendEmail(user));
  }

  if (notification.channels.sms && user.preferences.notifications.sms) {
    sendPromises.push(notification.sendSMS(user));
  }

  if (notification.channels.push && user.preferences.notifications.push) {
    sendPromises.push(notification.sendPush(user));
  }

  // Send all notifications in parallel
  await Promise.allSettled(sendPromises);

  return notification;
};

// Method to send email
notificationSchema.methods.sendEmail = async function(user) {
  try {
    // Email sending logic would go here
    // Using SendGrid or similar service
    // await sendEmailService.send({
    //   to: user.email,
    //   subject: this.title,
    //   text: this.message,
    //   html: this.message
    // });

    this.delivery.emailSent = true;
    this.delivery.emailSentAt = Date.now();
    await this.save();

    return true;
  } catch (error) {
    this.delivery.emailError = error.message;
    await this.save();
    return false;
  }
};

// Method to send SMS
notificationSchema.methods.sendSMS = async function(user) {
  try {
    // SMS sending logic would go here
    // Using Africa's Talking or Twilio
    // await smsService.send({
    //   to: user.phone,
    //   message: `${this.title}: ${this.message}`
    // });

    this.delivery.smsSent = true;
    this.delivery.smsSentAt = Date.now();
    await this.save();

    return true;
  } catch (error) {
    this.delivery.smsError = error.message;
    await this.save();
    return false;
  }
};

// Method to send push notification
notificationSchema.methods.sendPush = async function(user) {
  try {
    // Push notification logic would go here
    // Using Firebase Cloud Messaging or similar
    // await pushService.send({
    //   userId: user._id,
    //   title: this.title,
    //   body: this.message,
    //   data: this.data
    // });

    this.delivery.pushSent = true;
    this.delivery.pushSentAt = Date.now();
    await this.save();

    return true;
  } catch (error) {
    this.delivery.pushError = error.message;
    await this.save();
    return false;
  }
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
