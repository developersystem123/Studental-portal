-- Add Pakistan local payment methods to the PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE 'jazzcash';
ALTER TYPE "PaymentMethod" ADD VALUE 'easypaisa';
ALTER TYPE "PaymentMethod" ADD VALUE 'bank_transfer';
