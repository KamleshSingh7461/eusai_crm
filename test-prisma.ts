import prisma from './src/lib/prisma';

async function test() {
    console.log("Testing Prisma 'space' property...");
    try {
        // @ts-ignore
        const count = await prisma.space.count();
        console.log(`Success! Found ${count} spaces.`);
    } catch (error: any) {
        console.error("FAIL: Could not access prisma.space");
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
