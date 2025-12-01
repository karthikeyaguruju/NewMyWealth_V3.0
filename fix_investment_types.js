
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const investmentCategories = [
            'Mutual Funds',
            'Stocks',
            'Fixed Deposit',
            'Real Estate',
            'Gold',
            'Crypto',
            'Bonds'
        ];

        // Update transactions that have an investment category but wrong type
        const result = await prisma.transaction.updateMany({
            where: {
                category: {
                    in: investmentCategories
                },
                type: {
                    not: 'investment'
                }
            },
            data: {
                type: 'investment',
                categoryGroup: 'Investment'
            }
        });

        console.log(`Updated ${result.count} transactions to type 'investment'.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
