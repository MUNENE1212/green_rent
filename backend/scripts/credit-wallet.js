import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from parent directory
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Import models
import RentWallet from '../src/models/RentWallet.model.js';

async function creditWallet() {
  try {
    // Use correct database name from .env (greenrent not green-rent)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/greenrent');
    console.log('Connected to MongoDB');

    // Find the wallet - correct wallet ID
    const walletId = '68fc709b3f722045068a7018';
    const wallet = await RentWallet.findById(walletId);

    if (!wallet) {
      console.log('Wallet not found:', walletId);
      await mongoose.connection.close();
      return;
    }

    console.log('Wallet before deposit:', {
      id: wallet._id,
      balance: wallet.balance,
      deposits: wallet.deposits.length
    });

    // Add the deposit using the wallet's deposit method
    // transactionId should be null or a Payment ObjectId
    await wallet.deposit(
      10,
      'mpesa',
      null, // transactionId - no valid Payment record for this old transaction
      'Manual credit for M-Pesa payment ws_CO_25102025101430398799954672'
    );

    console.log('\n✅ Deposit successful!');
    console.log('Wallet after deposit:', {
      balance: wallet.balance,
      totalDeposits: wallet.deposits.length,
      lastDeposit: {
        amount: wallet.deposits[wallet.deposits.length - 1].amount,
        source: wallet.deposits[wallet.deposits.length - 1].source,
        transactionId: wallet.deposits[wallet.deposits.length - 1].transactionId,
        date: wallet.deposits[wallet.deposits.length - 1].createdAt
      }
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! User wallet has been credited with KES 10');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

creditWallet();
