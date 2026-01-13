
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Get the first user (assuming single user for now or just adding for the first one found)
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No user found');
            return;
        }

        const categories = [
            'Mutual Funds',
            'Stocks',
            'Fixed Deposits',
            'Real Estate',
            'Gold',
            'Crypto',
            'Bonds'
        ];

        for (const name of categories) {
            const exists = await prisma.category.findFirst({
                where: {
                    userId: user.id,
                    categoryGroup: 'Investment',
                    name: name
                }
            });

            if (!exists) {
                await prisma.category.create({
                    data: {
                        userId: user.id,
                        categoryGroup: 'Investment',
                        name: name,
                        isDefault: true
                    }
                });
                console.log(`Created category: ${name}`);
            } else {
                console.log(`Category already exists: ${name}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
