const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('Pandora@1989', 12);
        
        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: 'du.claza@gmail.com' }
        });
        
        if (existingAdmin) {
            console.log('Admin user already exists, updating password...');
            await prisma.admin.update({
                where: { email: 'du.claza@gmail.com' },
                data: { 
                    password: hashedPassword,
                    name: 'Eduardo Claza'
                }
            });
            console.log('✅ Admin user updated successfully!');
        } else {
            // Create new admin user
            await prisma.admin.create({
                data: {
                    email: 'du.claza@gmail.com',
                    password: hashedPassword,
                    name: 'Eduardo Claza'
                }
            });
            console.log('✅ Admin user created successfully!');
        }
        
        console.log('📧 Email: du.claza@gmail.com');
        console.log('🔐 Password: Pandora@1989');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
