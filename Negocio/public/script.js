document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();

    const vehicleForm = document.getElementById('vehicle-form');
    vehicleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const car_name = document.getElementById('car_name').value;
        const purchase_price = parseFloat(document.getElementById('purchase_price').value);
        const sale_price = parseFloat(document.getElementById('sale_price').value);

        try {
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ car_name, purchase_price, sale_price, status: 'En Taller' })
            });

            if (response.ok) {
                vehicleForm.reset();
                loadVehicles();
            } else {
                alert('Error al guardar el vehículo');
            }
        } catch (err) {
            console.error(err);
        }
    });
});

async function loadVehicles() {
    try {
        const res = await fetch('/api/vehicles');
        const vehicles = await res.json();
        
        const workshopContainer = document.getElementById('workshop-container');
        const salesContainer = document.getElementById('sales-container');
        
        workshopContainer.innerHTML = '';
        salesContainer.innerHTML = '';

        let workshopCount = 0;
        let salesCount = 0;

        if (vehicles.length === 0) {
            workshopContainer.innerHTML = '<p class="text-slate-500 text-sm text-center py-6">No hay vehículos en taller.</p>';
            salesContainer.innerHTML = '<p class="text-slate-500 text-sm text-center py-6">No hay vehículos vendidos.</p>';
            document.getElementById('kpi-workshop').innerText = '0 autos';
            document.getElementById('kpi-sales').innerText = '0 autos';
            document.getElementById('badge-count-workshop').innerText = '0';
            document.getElementById('badge-count-sales').innerText = '0';
            return;
        }

        vehicles.forEach(vehicle => {
            const vehicleId = vehicle.vehicle_id || vehicle.id;
            const totalExpenses = vehicle.vehicle_expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
            const totalInvestment = parseFloat(vehicle.purchase_price) + totalExpenses;
            const estimatedProfit = vehicle.sale_price ? (vehicle.sale_price - totalInvestment) : 0;
            const isSold = vehicle.status === 'Vendido';

            let expensesHTML = vehicle.vehicle_expenses.map(exp => `
                <li class="flex justify-between items-center bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-700/50 text-xs">
                    <div>
                        <strong class="text-slate-200">${exp.category}</strong>: <span class="text-slate-400">${exp.description}</span>
                        <span class="text-blue-400 font-semibold ml-2">$${exp.amount}</span>
                    </div>
                    ${!isSold ? `<button onclick="deleteExpense(${exp.expense_id || exp.id})" class="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded transition">✕</button>` : ''}
                </li>
            `).join('');

            const card = document.createElement('div');
            card.className = "bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition shadow-sm space-y-4";

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-base text-white">${vehicle.car_name}</h3>
                        <span class="text-[10px] text-slate-400">ID: #${vehicleId}</span>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${isSold ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}">
                        ${vehicle.status}
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div>
                        <span class="text-slate-400 block">Compra:</span>
                        <span class="text-slate-200 font-semibold">$${vehicle.purchase_price}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block">Venta Est.:</span>
                        <span class="text-slate-200 font-semibold">$${vehicle.sale_price}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block">Gastos Total:</span>
                        <span class="text-amber-400 font-semibold">$${totalExpenses}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block">Inversión Total:</span>
                        <span class="text-slate-200 font-semibold">$${totalInvestment}</span>
                    </div>
                </div>

                <div class="flex justify-between items-center text-xs px-1">
                    <span class="text-slate-400">Utilidad Estimada:</span>
                    <span class="font-bold text-sm ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}">$${estimatedProfit}</span>
                </div>

                <div class="border-t border-slate-800 pt-3 space-y-2">
                    <h4 class="text-xs font-semibold text-slate-400">Gastos y Refacciones:</h4>
                    <ul class="space-y-1.5 max-h-32 overflow-y-auto">${expensesHTML || '<li class="text-slate-500 text-xs italic">Sin gastos registrados</li>'}</ul>
                    
                    ${!isSold ? `
                        <form onsubmit="addExpense(event, ${vehicleId})" class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                            <input type="text" placeholder="Categoría (ej. Motor)" class="exp-cat bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" required>
                            <input type="text" placeholder="Descripción" class="exp-desc bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" required>
                            <div class="flex gap-1">
                                <input type="number" placeholder="Monto" class="exp-amt bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-full" required>
                                <button type="submit" class="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition">+</button>
                            </div>
                        </form>
                    ` : ''}
                </div>

                ${!isSold ? `
                    <div class="border-t border-slate-800 pt-3 flex gap-2">
                        <input type="number" placeholder="Precio final de venta" id="sell-price-${vehicleId}" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 flex-1" required>
                        <button onclick="sellVehicle(${vehicleId})" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition shadow-md shadow-emerald-600/20">Registrar Venta</button>
                    </div>
                ` : `
                    <div class="border-t border-slate-800 pt-3 bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl text-center">
                        <span class="text-xs text-emerald-400 block">Vehículo Vendido Exitosamente</span>
                        <span class="text-base font-bold text-emerald-300">Precio Final: $${vehicle.final_sale_price}</span>
                    </div>
                `}
            `;

            if (isSold) {
                salesContainer.appendChild(card);
                salesCount++;
            } else {
                workshopContainer.appendChild(card);
                workshopCount++;
            }
        });

        if (workshopCount === 0) workshopContainer.innerHTML = '<p class="text-slate-500 text-sm text-center py-6">No hay vehículos en taller.</p>';
        if (salesCount === 0) salesContainer.innerHTML = '<p class="text-slate-500 text-sm text-center py-6">No hay vehículos vendidos.</p>';

        document.getElementById('kpi-workshop').innerText = `${workshopCount} autos`;
        document.getElementById('kpi-sales').innerText = `${salesCount} autos`;
        document.getElementById('badge-count-workshop').innerText = workshopCount;
        document.getElementById('badge-count-sales').innerText = salesCount;

    } catch (err) {
        console.error('Error al cargar:', err);
    }
}

async function addExpense(event, vehicleId) {
    event.preventDefault();
    const form = event.target;
    const category = form.querySelector('.exp-cat').value;
    const description = form.querySelector('.exp-desc').value;
    const amount = parseFloat(form.querySelector('.exp-amt').value);

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, description, amount })
        });

        if (res.ok) {
            loadVehicles();
        } else {
            alert('Error al agregar gasto');
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    try {
        const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
        if (res.ok) {
            loadVehicles();
        } else {
            alert('Error al eliminar gasto');
        }
    } catch (err) {
        console.error(err);
    }
}

async function sellVehicle(vehicleId) {
    const inputField = document.getElementById(`sell-price-${vehicleId}`);
    const final_sale_price = parseFloat(inputField.value);
    
    if (!final_sale_price) {
        alert('Ingresa un precio de venta válido');
        return;
    }

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}/sell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ final_sale_price })
        });

        if (res.ok) {
            loadVehicles();
        } else {
            alert('Error al registrar la venta');
        }
    } catch (err) {
        console.error(err);
    }
}