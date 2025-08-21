const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Pandora@1989', 12);
        
        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: process.env.ADMIN_EMAIL || 'du.claza@gmail.com' }
        });
        
        if (existingAdmin) {
            console.log('Admin user already exists, updating password...');
            await prisma.admin.update({
                where: { email: process.env.ADMIN_EMAIL || 'du.claza@gmail.com' },
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
                    email: process.env.ADMIN_EMAIL || 'du.claza@gmail.com',
                    password: hashedPassword,
                    name: 'Eduardo Claza'
                }
            });
            console.log('✅ Admin user created successfully!');
        }
        
        console.log('📧 Email:', process.env.ADMIN_EMAIL || 'du.claza@gmail.com');
        console.log('🔐 Password:', process.env.ADMIN_PASSWORD || 'Pandora@1989');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
