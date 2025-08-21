const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome, email e mensagem são obrigatórios' 
            });
        }

        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                phone: phone || null,
                subject: subject || null,
                message
            }
        });

        res.json({ 
            success: true, 
            message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
            id: contact.id
        });

    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor. Tente novamente.' 
        });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin in database
        const admin = await prisma.admin.findUnique({
            where: { email }
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin.id,
                email: admin.email, 
                name: admin.name,
                role: 'admin' 
            },
            'solutionsweb_super_secret_key_2025',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            message: 'Login realizado com sucesso',
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, 'solutionsweb_super_secret_key_2025');
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

// Get all contacts (admin only)
app.get('/api/admin/contacts', verifyAdmin, async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar contatos'
        });
    }
});

// Mark contact as read (admin only)
app.patch('/api/admin/contacts/:id/read', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const contact = await prisma.contact.update({
            where: { id: parseInt(id) },
            data: { read: true }
        });

        res.json({
            success: true,
            contact
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar contato'
        });
    }
});

// Delete contact (admin only)
app.delete('/api/admin/contacts/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.contact.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Contato deletado com sucesso'
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar contato'
        });
    }
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
