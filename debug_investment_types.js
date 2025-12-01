
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find transactions for specific categories to check their 'type'
        const categoriesToCheck = ['Mutual Funds', 'Bonds', 'Stocks', 'Gold', 'Crypto', 'Real Estate'];

        const transactions = await prisma.transaction.findMany({
            where: {
                category: {
                    in: categoriesToCheck
                }
            },
            select: {
                id: true,
                type: true,
                category: true,
                amount: true,
                date: true
            }
        });

        console.log('Transactions for checked categories:', JSON.stringify(transactions, null, 2));

        // Also check counts by type
        const typeCounts = await prisma.transaction.groupBy({
            by: ['type'],
            _count: {
                id: true
            }
        });
        console.log('Transaction counts by type:', typeCounts);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
