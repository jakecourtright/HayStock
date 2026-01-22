// Data Management
const Storage = {
    SAVE_KEY: 'hay_inventory_data_v2',

    getData() {
        const data = localStorage.getItem(this.SAVE_KEY);
        const parsed = data ? JSON.parse(data) : {
            stacks: [],
            transactions: [],
            locations: [
                { id: 'loc1', name: 'Barn A', capacity: 2000, unit: 'bales' },
                { id: 'loc2', name: 'Barn B', capacity: 1500, unit: 'bales' },
                { id: 'loc3', name: 'External Yard', capacity: 5000, unit: 'bales' }
            ],
            settings: {
                hayTypes: ['Alfalfa', 'Timothy', 'Bermuda', 'Oat Hay', 'Orchard Grass'],
                baleSizes: ['Small Square', 'Large Square', 'Round'],
                qualities: ['Premium', '#1', 'Feeder']
            }
        };
        // Migration: Ensure locations exist
        if (!parsed.locations) {
            parsed.locations = [
                { id: 'loc1', name: 'Barn A', capacity: 2000, unit: 'bales' },
                { id: 'loc2', name: 'Barn B', capacity: 1500, unit: 'bales' },
                { id: 'loc3', name: 'External Yard', capacity: 5000, unit: 'bales' }
            ];
            this.saveData(parsed);
        }
        return parsed;
    },

    saveData(data) {
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    },

    addLocation(locationData) {
        const data = this.getData();
        const location = {
            id: 'loc_' + Date.now(),
            name: locationData.name,
            capacity: parseInt(locationData.capacity),
            unit: locationData.unit || 'bales'
        };
        data.locations.push(location);
        this.saveData(data);
        return location;
    },

    updateLocation(id, locationData) {
        const data = this.getData();
        const index = data.locations.findIndex(l => l.id === id);
        if (index !== -1) {
            data.locations[index] = {
                ...data.locations[index],
                ...locationData,
                capacity: parseInt(locationData.capacity)
            };
            this.saveData(data);
        }
    },

    deleteLocation(id) {
        const data = this.getData();
        // Only delete if no transactions are using it
        if (data.transactions.some(t => t.locationId === id)) {
            throw new Error('Cannot delete location while it has transaction history.');
        }
        data.locations = data.locations.filter(l => l.id !== id);
        this.saveData(data);
    },

    addStack(stackData) {
        const data = this.getData();
        const stack = {
            id: 'stack_' + Date.now(),
            name: stackData.name,
            commodity: stackData.commodity,
            baleSize: stackData.baleSize,
            quality: stackData.quality,
            basePrice: parseFloat(stackData.basePrice || 0),
            created: new Date().toISOString()
        };
        data.stacks.push(stack);
        this.saveData(data);
        return stack;
    },

    updateStack(id, stackData) {
        const data = this.getData();
        const index = data.stacks.findIndex(s => s.id === id);
        if (index !== -1) {
            data.stacks[index] = {
                ...data.stacks[index],
                ...stackData,
                basePrice: parseFloat(stackData.basePrice || 0)
            };
            this.saveData(data);
        }
    },

    deleteStack(id) {
        const data = this.getData();
        data.stacks = data.stacks.filter(s => s.id !== id);
        // Keep transactions but they will show as "Unknown Stack" unless we delete them too
        // For safety/audit, we just filter the stacks
        this.saveData(data);
    },

    addTransaction(type, stackId, locationId, amount, unit, entity, price) {
        const data = this.getData();
        const stack = data.stacks.find(s => s.id === stackId);
        const location = data.locations.find(l => l.id === locationId);

        const transaction = {
            id: 'tx_' + Date.now(),
            date: new Date().toISOString(),
            type, // 'production', 'purchase', 'sale'
            stackId,
            stackName: stack ? stack.name : 'Unknown Stack',
            locationId,
            locationName: location ? location.name : 'Unknown Location',
            commodity: stack ? stack.commodity : 'Unknown',
            amount: parseFloat(amount),
            unit,
            entity,
            price: parseFloat(price || (stack ? stack.basePrice : 0))
        };

        data.transactions.unshift(transaction);
        this.saveData(data);
        return transaction;
    },

    getInventoryByStack() {
        const data = this.getData();
        const inventory = {};

        data.stacks.forEach(stack => {
            inventory[stack.id] = {
                ...stack,
                currentStock: 0,
                locationBreakdown: {} // { locId: amount }
            };
        });

        data.transactions.forEach(t => {
            if (inventory[t.stackId]) {
                const amount = (t.type === 'production' || t.type === 'purchase') ? t.amount : -t.amount;

                inventory[t.stackId].currentStock += amount;

                if (t.locationId) {
                    inventory[t.stackId].locationBreakdown[t.locationId] = (inventory[t.stackId].locationBreakdown[t.locationId] || 0) + amount;
                }
            }
        });

        return Object.values(inventory);
    },

    getInventoryByLocation(locId) {
        const data = this.getData();
        const inventory = [];
        const stackMap = {};

        data.stacks.forEach(s => {
            stackMap[s.id] = { ...s, currentStock: 0 };
        });

        data.transactions.forEach(t => {
            if (t.locationId === locId && stackMap[t.stackId]) {
                const amount = (t.type === 'production' || t.type === 'purchase') ? t.amount : -t.amount;
                stackMap[t.stackId].currentStock += amount;
            }
        });

        return Object.values(stackMap).filter(s => s.currentStock !== 0);
    }
};

// UI Controller
const UI = {
    init() {
        this.renderDashboard();
        this.setupEventListeners();
        this.updateStackDropdowns();
    },

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`[data-page="${pageId}"]`);
        if (navItem) navItem.classList.add('active');

        if (pageId === 'dashboard') this.renderDashboard();
        if (pageId === 'reports') this.renderReports();
        if (pageId === 'inventory') this.renderLocations();
        if (pageId === 'manage-stacks') this.renderStacks();
        if (pageId === 'log-entry') {
            this.updateStackDropdowns();
            const select = document.querySelector('select[name="stackId"]');
            if (select) this.updateLogLocationDisplay(select.value);
        }
    },

    updateStackDropdowns() {
        const data = Storage.getData();
        const stackDropdown = document.querySelector('select[name="stackId"]');
        const locDropdown = document.querySelectorAll('select[name="locationId"]');

        if (stackDropdown) {
            if (data.stacks.length === 0) {
                stackDropdown.innerHTML = '<option value="">No stacks available</option>';
            } else {
                stackDropdown.innerHTML = data.stacks.map(s =>
                    `<option value="${s.id}">${s.name} (${s.commodity})</option>`
                ).join('');
            }
        }

        locDropdown.forEach(dropdown => {
            if (data.locations.length === 0) {
                dropdown.innerHTML = '<option value="">No locations available</option>';
            } else {
                dropdown.innerHTML = data.locations.map(l =>
                    `<option value="${l.id}">${l.name}</option>`
                ).join('');
            }
        });
    },

    // Removed updateLogLocationDisplay as location is now a direct user input in transactions


    renderDashboard() {
        const inventory = Storage.getInventoryByStack();
        const totalStock = inventory.reduce((a, b) => a + b.currentStock, 0);

        document.getElementById('total-stock').textContent = totalStock.toLocaleString();

        const data = Storage.getData();
        const recentActivity = data.transactions.slice(0, 5);
        const activityList = document.getElementById('recent-activity');

        activityList.innerHTML = recentActivity.length ? '' : '<p style="color: var(--text-dim); text-align: center; padding: 2rem;">No entries found yet.</p>';

        recentActivity.forEach(t => {
            const date = new Date(t.date).toLocaleDateString();
            const isOut = t.type === 'sale';
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-info">
                    <span class="activity-title">${t.type === 'production' ? 'Baled' : t.type.charAt(0).toUpperCase() + t.type.slice(1)}: ${t.stackName}</span>
                    <span class="activity-meta">${t.commodity} • ${t.locationName || 'Unknown'} • ${t.entity} • ${date}</span>
                </div>
                <div class="activity-amount ${isOut ? 'amount-out' : 'amount-in'}">
                    ${isOut ? '−' : '+'}${t.amount.toLocaleString()}
                </div>
            `;
            activityList.appendChild(item);
        });
    },

    renderLocations() {
        const data = Storage.getData();
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';

        data.locations.forEach(loc => {
            const locInventory = Storage.getInventoryByLocation(loc.id);
            const totalInLoc = locInventory.reduce((sum, s) => sum + s.currentStock, 0);
            const percentUsed = Math.min(100, Math.round((totalInLoc / loc.capacity) * 100));

            const card = document.createElement('div');
            card.className = 'glass-card mb-1';
            card.style.padding = '1.25rem';
            card.style.cursor = 'pointer';
            card.setAttribute('onclick', `UI.viewLocationDetails('${loc.id}')`);
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem;">${loc.name}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-dim);">${totalInLoc.toLocaleString()} / ${loc.capacity.toLocaleString()} ${loc.unit}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-weight: 600; color: ${percentUsed > 90 ? 'var(--error)' : 'var(--accent)'}">${percentUsed}%</span>
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn btn-secondary" onclick="event.stopPropagation(); UI.editLocation('${loc.id}')" style="padding: 0.4rem; border-radius: 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: var(--accent); width: ${percentUsed}%; height: 100%; border-radius: 4px;"></div>
                </div>
                <div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-dim);">
                    ${locInventory.length} Lots stored here
                </div>
            `;
            list.appendChild(card);
        });
    },

    editLocation(id) {
        const data = Storage.getData();
        const loc = data.locations.find(l => l.id === id);
        if (!loc) return;

        document.getElementById('location-creation-form').classList.remove('hidden');
        const form = document.getElementById('location-form');
        form.dataset.editId = id;
        form.querySelector('[name="name"]').value = loc.name;
        form.querySelector('[name="capacity"]').value = loc.capacity;
        form.querySelector('[name="unit"]').value = loc.unit;

        form.querySelector('button[type="submit"]').textContent = 'Update Location';
        document.getElementById('cancel-location-edit').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    cancelLocationEdit() {
        const form = document.getElementById('location-form');
        delete form.dataset.editId;
        form.reset();
        form.querySelector('button[type="submit"]').textContent = 'Save Location';
        document.getElementById('cancel-location-edit').classList.add('hidden');
        document.getElementById('location-creation-form').classList.add('hidden');
    },

    viewLocationDetails(locId) {
        const data = Storage.getData();
        const loc = data.locations.find(l => l.id === locId);
        if (!loc) return;

        const locInventory = Storage.getInventoryByLocation(locId);
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';

        // Add Back Button and Header
        const header = document.createElement('div');
        header.className = 'mb-1';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '1rem';
        header.innerHTML = `
            <button class="btn btn-secondary" onclick="UI.renderLocations()" style="padding: 0.5rem; border-radius: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h3 style="margin: 0; font-size: 1.25rem;">Stacks in ${loc.name}</h3>
        `;
        list.appendChild(header);

        if (locInventory.length === 0) {
            const empty = document.createElement('p');
            empty.style.color = 'var(--text-dim)';
            empty.style.textAlign = 'center';
            empty.style.padding = '2rem';
            empty.textContent = 'No stacks currently in this location.';
            list.appendChild(empty);
            return;
        }

        locInventory.forEach(s => {
            const card = document.createElement('div');
            card.className = 'glass-card mb-1';
            card.style.padding = '1.25rem';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-bright);">${s.name}</h3>
                        <span style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">${s.commodity.toUpperCase()}</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="stat-mini">
                        <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">STOCK HERE</span>
                        <span style="font-size: 1rem; font-weight: 600; color: var(--text-bright);">${s.currentStock.toLocaleString()} Bales</span>
                    </div>
                    <div class="stat-mini">
                        <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">QUALITY</span>
                        <span style="font-size: 1rem; font-weight: 600; color: var(--text-bright);">${s.quality}</span>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    },

    renderStackCards() {
        const data = Storage.getData();
        const inventory = Storage.getInventoryByStack();
        const list = document.getElementById('stacks-list');
        list.innerHTML = '';

        inventory.forEach(s => {
            const card = document.createElement('div');
            card.className = 'glass-card mb-1';
            card.style.padding = '1.25rem';

            // Generate location breakdown text
            const breakdown = Object.entries(s.locationBreakdown)
                .map(([locId, amount]) => {
                    const loc = data.locations.find(l => l.id === locId);
                    return amount !== 0 ? `<div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                        <span style="color: var(--text-dim);">${loc ? loc.name : 'Unknown'}:</span>
                        <span style="font-weight: 600;">${amount.toLocaleString()}</span>
                    </div>` : '';
                }).join('');

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-bright);">${s.name}</h3>
                        <span style="font-size: 0.85rem; color: var(--accent); font-weight: 600;">${s.commodity.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="UI.editStack('${s.id}')" style="padding: 0.4rem; border-radius: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button class="btn btn-secondary" onclick="UI.deleteStack('${s.id}')" style="padding: 0.4rem; border-radius: 8px; color: var(--error);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                    </div>
                </div>
                
                <div class="stat-mini mb-1">
                    <span style="font-size: 0.7rem; color: var(--text-dim); display: block;">TOTAL INVENTORY</span>
                    <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-bright);">${s.currentStock.toLocaleString()} Bales</span>
                </div>

                ${breakdown ? `
                <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.8rem;">
                    <div style="font-weight: 600; margin-bottom: 0.25rem; color: var(--text-dim); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem;">Location Breakdown</div>
                    ${breakdown}
                </div>` : ''}

                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                    <span class="badge">${s.quality}</span>
                    <span class="badge">${s.baleSize}</span>
                    <span class="badge">$${s.basePrice}/unit</span>
                </div>
            `;
            list.appendChild(card);
        });
    },

    renderStacks() {
        this.renderStackCards();
    },

    editStack(id) {
        const data = Storage.getData();
        const stack = data.stacks.find(s => s.id === id);
        if (!stack) return;

        this.showPage('manage-stacks');
        const form = document.getElementById('stack-form');
        form.dataset.editId = id;
        form.querySelector('[name="name"]').value = stack.name;
        form.querySelector('[name="commodity"]').value = stack.commodity;
        form.querySelector('[name="baleSize"]').value = stack.baleSize;
        form.querySelector('[name="quality"]').value = stack.quality;
        form.querySelector('[name="basePrice"]').value = stack.basePrice;

        form.querySelector('button[type="submit"]').textContent = 'Update Stack';
        document.getElementById('cancel-stack-edit').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    cancelEditStack() {
        const form = document.getElementById('stack-form');
        delete form.dataset.editId;
        form.reset();
        form.querySelector('button[type="submit"]').textContent = 'Create New Stack';
        document.getElementById('cancel-stack-edit').classList.add('hidden');
    },

    deleteStack(id) {
        if (confirm('Are you sure you want to delete this stack? Transactions will remain but refer to a missing stack.')) {
            Storage.deleteStack(id);
            this.renderStacks();
            this.updateStackDropdowns();
        }
    },

    renderReports() {
        const data = Storage.getData();
        const reportContent = document.getElementById('report-summary');

        const transactions = data.transactions;
        const sales = transactions.filter(t => t.type === 'sale');
        const production = transactions.filter(t => t.type === 'production');

        const totalRevenue = sales.reduce((sum, t) => sum + (t.amount * t.price), 0);
        const totalProduced = production.reduce((sum, t) => sum + t.amount, 0);

        reportContent.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                <div class="glass-card">
                    <span class="stat-label">Production Yield</span>
                    <div class="stat-value">${totalProduced.toLocaleString()}</div>
                    <p style="color: var(--text-dim); font-size: 0.85rem;">Total units baled from fields</p>
                </div>
                <div class="glass-card">
                    <span class="stat-label">Sales Revenue</span>
                    <div class="stat-value">$${totalRevenue.toLocaleString()}</div>
                    <p style="color: var(--text-dim); font-size: 0.85rem;">Estimated value from all sales</p>
                </div>
            </div>
        `;
    },

    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(item.dataset.page);
            });
        });

        const transactionForm = document.getElementById('transaction-form');
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(transactionForm);

            if (!formData.get('stackId')) {
                alert('Please select a stack first.');
                return;
            }

            Storage.addTransaction(
                formData.get('type'),
                formData.get('stackId'),
                formData.get('locationId'),
                formData.get('amount'),
                formData.get('unit'),
                formData.get('entity'),
                formData.get('price')
            );

            transactionForm.reset();
            alert('Inventory Updated!');
            this.showPage('dashboard');
        });

        const stackForm = document.getElementById('stack-form');
        stackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(stackForm);
            const editId = stackForm.dataset.editId;

            const stackData = {
                name: formData.get('name'),
                commodity: formData.get('commodity'),
                baleSize: formData.get('baleSize'),
                quality: formData.get('quality'),
                basePrice: formData.get('basePrice')
            };

            if (editId) {
                Storage.updateStack(editId, stackData);
                delete stackForm.dataset.editId;
                stackForm.querySelector('button[type="submit"]').textContent = 'Create New Stack';
                document.getElementById('cancel-stack-edit').classList.add('hidden');
                alert('Stack Updated!');
            } else {
                Storage.addStack(stackData);
                alert('Stack Created!');
            }

            stackForm.reset();
            this.renderStacks();
            this.updateStackDropdowns();
            document.getElementById('stack-creation-form').classList.add('hidden');
        });

        const locationForm = document.getElementById('location-form');
        locationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(locationForm);
            const editId = locationForm.dataset.editId;

            const locData = {
                name: formData.get('name'),
                capacity: formData.get('capacity'),
                unit: formData.get('unit')
            };

            if (editId) {
                Storage.updateLocation(editId, locData);
                delete locationForm.dataset.editId;
                locationForm.querySelector('button[type="submit"]').textContent = 'Save Location';
                document.getElementById('cancel-location-edit').classList.add('hidden');
                alert('Location Updated!');
            } else {
                Storage.addLocation(locData);
                alert('Location Added!');
            }

            locationForm.reset();
            this.renderLocations();
            this.updateStackDropdowns();
            document.getElementById('location-creation-form').classList.add('hidden');
        });
    }
};

window.addEventListener('DOMContentLoaded', () => UI.init());
