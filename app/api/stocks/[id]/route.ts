import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { stockSchema } from '@/lib/validations';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = await verifyToken(token);
        return decoded?.userId || null;
    } catch (error) {
        return null;
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = stockSchema.parse(body);
        const { date, ...dataWithoutDate } = validatedData;

        const stock = await prisma.stock.update({
            where: { id: params.id, userId },
            data: {
                ...dataWithoutDate,
                date: date ? new Date(date) : undefined,
                totalValue: validatedData.quantity * validatedData.buyPrice,
            },
        });

        return NextResponse.json({ stock }, { status: 200 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        await prisma.stock.delete({
            where: { id: params.id, userId },
        });

        return NextResponse.json({ message: 'Stock deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
