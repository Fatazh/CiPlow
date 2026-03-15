-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "quantity" INTEGER DEFAULT 1,
ADD COLUMN     "unitPrice" DECIMAL(15,2);
