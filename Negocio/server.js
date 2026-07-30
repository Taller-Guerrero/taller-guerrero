require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 1. Obtener vehículos con sus gastos
app.get('/api/vehicles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*, vehicle_expenses:expenses(*)');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Guardar un vehículo nuevo
app.post('/api/vehicles', async (req, res) => {
    try {
        const { car_name, purchase_price, sale_price, status } = req.body;
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{ car_name, purchase_price, sale_price, status: status || 'En Preparación' }])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Actualizar / Editar un vehículo
app.put('/api/vehicles/:id', async (req, res) => {
    try {
        const { car_name, purchase_price, sale_price, status, final_sale_price } = req.body;
        const { data, error } = await supabase
            .from('vehicles')
            .update({ car_name, purchase_price, sale_price, status, final_sale_price })
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.status(200).json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Eliminar un vehículo
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        // Primero eliminamos los gastos asociados para mantener integridad
        await supabase.from('expenses').delete().eq('vehicle_id', req.params.id);
        const { error } = await supabase.from('vehicles').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Agregar un gasto a un vehículo
app.post('/api/vehicles/:id/expenses', async (req, res) => {
    try {
        const { category, description, amount } = req.body;
        const { data, error } = await supabase
            .from('expenses')
            .insert([{ vehicle_id: req.params.id, category, description, amount }])
            .select();
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Eliminar un gasto
app.delete('/api/expenses/:expenseId', async (req, res) => {
    try {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', req.params.expenseId);
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Registrar venta de un vehículo
app.post('/api/vehicles/:id/sell', async (req, res) => {
    try {
        const { error } = await supabase
            .from('vehicles')
            .update({ status: 'Vendido', final_sale_price: req.body.final_sale_price })
            .eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});