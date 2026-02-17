'use strict';

const CONFIG = {
    resourceName: 'marketplace',
    items: {
        'weapon_ceramicpistol': { label: 'Ceramic Pistol', image: 'weapon_ceramicpistol.png', rarity: 'rare', category: 'weapons' },
        'weapon_assaultrifle': { label: 'Assault Rifle', image: 'weapon_assaultrifle.png', rarity: 'epic', category: 'weapons' },
        'weapon_bread': { label: 'Bread', image: 'weapon_bread.png', rarity: 'common', category: 'consumables' },
        'drum_attachment': { label: 'Drum Magazine', image: 'drum_attachment.png', rarity: 'rare', category: 'weapons' },
        'armor': { label: 'Body Armor', image: 'armor.png', rarity: 'uncommon', category: 'armor' },
        'coke_brick': { label: 'Cocaine Brick', image: 'coke_brick.png', rarity: 'epic', category: 'consumables' },
        'crack_baggy': { label: 'Crack Baggy', image: 'crack_baggy.png', rarity: 'common', category: 'consumables' },
        'weed_baggy': { label: 'Weed Baggy', image: 'weed_baggy.png', rarity: 'common', category: 'consumables' },
        'oxy': { label: 'Oxy', image: 'oxy.png', rarity: 'uncommon', category: 'consumables' },
        'ephedrine': { label: 'Ephedrine', image: 'ephedrine.png', rarity: 'rare', category: 'consumables' },
        'boostingtablet': { label: 'Boosting Tablet', image: 'boostingtablet.png', rarity: 'legendary', category: 'misc' },
        'advancedlockpick': { label: 'Advanced Lockpick', image: 'advancedlockpick.png', rarity: 'uncommon', category: 'misc' },
        'advancedkit': { label: 'Advanced Repair Kit', image: 'advancedkit.png', rarity: 'rare', category: 'misc' },
        'drill': { label: 'Drill', image: 'drill.png', rarity: 'epic', category: 'misc' },
        'thermite': { label: 'Thermite', image: 'thermite.png', rarity: 'legendary', category: 'misc' }
    },
    vehicles: [
        { plate: 'RUN 420', model: 'banshee_900r', label: 'Banshee 900R', image: 'vehicle_banshee.png', rarity: 'epic' },
        { plate: 'BBL 069', model: 'cypher', label: 'Cypher', image: 'vehicle_Cypher.png', rarity: 'epic' },
        { plate: 'COX 246', model: 'panto', label: 'Panto', image: 'vehicle_panto.png', rarity: 'common' },
        { plate: 'FUTO 86', model: 'futo', label: 'Futo', image: 'vehicle_futo.png', rarity: 'uncommon' },
        { plate: 'CIVIC 99', model: 'kanjo', label: 'Kanjo', image: 'vehicle_kanjo.png', rarity: 'uncommon' },
        { plate: 'FAST AF', model: 'bullet', label: 'Bullet', image: 'vehicle_bullet.png', rarity: 'rare' },
        { plate: 'CLASSIC', model: 'cheetah', label: 'Cheetah Classic', image: 'vehicle_cheetah.png', rarity: 'epic' },
        { plate: 'VACC 1', model: 'vacca', label: 'Vacca', image: 'vehicle_vacca.png', rarity: 'legendary' },
        { plate: 'HELI 1', model: 'conada', label: 'Conada', image: 'vehicle_heli_conada.png', rarity: 'legendary' }
    ],
    sellers: [
        'Raj Patel', 'Mark Skyz', 'Moxie Moch', 'Rowan Phillips', 'George Stillwalter',
        'Juno Clark', 'Elijah Hayze', 'Vlad Sokolo', 'Ol Timer', 'Kento Romano',
        'John Pie', 'David Hopper', 'TJ', 'Pickles', 'Nick Cooper', 'Toast',
        'Viktor Petrov', 'Lulu LaSalle', 'Alex King', 'Teddy Bear', 'Stinky birb'
    ]
};

let currentCategory = 'all';
let currentView = 'list';
let allListings = [];
let myListings = [];
let playerInventory = [];
let playerVehicles = [];
let playerBalance = 0;
let selectedListing = null;
let isSimulationActive = false;
let simulationInterval = null;
let listingIdToRemove = null;

function sendData(action, data = {}) {
    /* Sanitize API calls */
    fetch(`https://${CONFIG.resourceName}/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).catch(error => {
        // Validation/Error handling
    });
}

function renderVehicleSelect() {
    const select = document.getElementById('vehicleSelect');

    if (playerVehicles.length === 0) {
        select.innerHTML = '<option value="">No vehicles in garage</option>';
        return;
    }

    select.innerHTML = '<option value="">Choose a vehicle from your garage...</option>';
    playerVehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.plate;
        option.textContent = `${vehicle.label} (${vehicle.plate})`;
        select.appendChild(option);
    });
}

window.addEventListener('message', (event) => {
    const data = event.data;

    switch (data.action) {
        case 'open':
            openMarketplace(data);
            break;
        case 'close':
            closeMarketplace();
            break;
        case 'updateListings':
            updateListings(data.listings);
            break;
        case 'updateMyListings':
            updateMyListings(data.listings);
            break;
        case 'updateInventory':
            updateInventory(data.inventory);
            break;
        case 'updateBalance':
            updateBalance(data.balance);
            break;
    }
});

function openMarketplace(data) {
    const marketplace = document.getElementById('auctionHouse');
    marketplace.style.display = 'flex';

    if (data.balance !== undefined) updateBalance(data.balance);
    if (data.listings) updateListings(data.listings);
    if (data.myListings) updateMyListings(data.myListings);
    if (data.inventory) updateInventory(data.inventory);
}

function closeMarketplace() {
    const marketplace = document.getElementById('auctionHouse');
    marketplace.style.display = 'none';
    closeDetailsPanel();
    sendData('close');
}

function updateBalance(balance) {
    playerBalance = balance;
    document.getElementById('playerBalance').textContent = `$${balance.toLocaleString()}`;
}

function updateListings(listings) {
    allListings = listings;
    renderListings();
}

function updateMyListings(listings) {
    myListings = listings;
    if (currentCategory === 'my-listings') {
        renderListings();
    }
}

function updateInventory(inventory) {
    playerInventory = inventory;
    renderInventorySelect();
}

function switchCategory(category) {
    currentCategory = category;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Show/hide toolbar and forms
    const toolbar = document.getElementById('toolbar');
    const itemsContainer = document.getElementById('itemsContainer');
    const createForm = document.getElementById('createAuctionForm');
    const createVehicleForm = document.getElementById('createVehicleForm');

    // Default state: hide everything
    toolbar.style.display = 'none';
    itemsContainer.style.display = 'none';
    createForm.style.display = 'none';
    createVehicleForm.style.display = 'none';

    if (category === 'create') {
        createForm.style.display = 'block';
        renderInventorySelect();
    } else if (category === 'create-vehicle') {
        createVehicleForm.style.display = 'block';
        renderVehicleSelect();
    } else {
        toolbar.style.display = 'flex';
        itemsContainer.style.display = 'block';
        renderListings();
    }

    closeDetailsPanel();
}

function switchView(view) {
    currentView = view;

    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    renderListings();
}

function renderListings() {
    const grid = document.getElementById('itemsGrid');
    const emptyState = document.getElementById('emptyState');

    let listings = getFilteredListings();

    if (listings.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    if (currentView === 'grid') {
        grid.style.display = 'grid';
        grid.className = 'items-grid active';
        grid.innerHTML = listings.map(listing => renderGridItem(listing)).join('');
    } else {
        grid.style.display = 'flex';
        grid.className = 'items-list active';
        grid.innerHTML = listings.map(listing => renderListItem(listing)).join('');
    }
}

function renderGridItem(listing) {
    return `
        <div class="item-card" data-id="${listing.id}" data-rarity="${listing.rarity}" onclick="showItemDetails(${listing.id})">
            <div class="item-frame">
                <img src="../item_Image_template.png" class="item-template" alt="Frame">
                <img src="../${listing.itemImage}" class="item-image" alt="${listing.itemLabel}">
                ${listing.quantity > 1 ? `<div class="item-stack-count">x${listing.quantity}</div>` : ''}
            </div>
            <div class="item-info">
                <div class="item-name" data-rarity="${listing.rarity}">${listing.itemLabel}</div>
                <div class="item-price">$${listing.price.toLocaleString()}</div>
            </div>
        </div>
    `;
}

function renderListItem(listing) {
    return `
        <div class="list-item" data-id="${listing.id}" data-rarity="${listing.rarity}" onclick="showItemDetails(${listing.id})">
            <div class="list-item-frame">
                <img src="../item_Image_template.png" class="item-template" alt="Frame">
                <img src="../${listing.itemImage}" class="item-image" alt="${listing.itemLabel}">
                ${listing.quantity > 1 ? `<div class="item-stack-count">x${listing.quantity}</div>` : ''}
            </div>
            <div class="list-item-details">
                <div class="list-item-name" data-rarity="${listing.rarity}">${listing.itemLabel}</div>
                <div class="list-item-meta">
                    <div class="list-item-seller">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        ${listing.sellerName}
                    </div>
                </div>
            </div>
            <div class="list-item-pricing">
                <div class="list-item-price">$${listing.price.toLocaleString()}</div>
            </div>
        </div>
    `;
}

function getFilteredListings() {
    let listings;

    // Select listing source
    if (currentCategory === 'my-listings') {
        listings = myListings;
    } else if (currentCategory === 'all') {
        listings = allListings;
    } else {
        listings = allListings.filter(l => l.category === currentCategory);
    }

    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        listings = listings.filter(l =>
            l.itemLabel.toLowerCase().includes(searchTerm) ||
            l.itemName.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    const sortBy = document.getElementById('sortSelect').value;
    listings = sortListings([...listings], sortBy);

    return listings;
}

function sortListings(listings, sortBy) {
    switch (sortBy) {
        case 'price-asc':
            return listings.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return listings.sort((a, b) => b.price - a.price);
        case 'name':
            return listings.sort((a, b) => a.itemLabel.localeCompare(b.itemLabel));
        default:
            return listings;
    }
}

function renderInventorySelect() {
    const select = document.getElementById('auctionItem');

    if (playerInventory.length === 0) {
        select.innerHTML = '<option value="">No items in inventory</option>';
        return;
    }

    select.innerHTML = '<option value="">Choose an item from your inventory...</option>' +
        playerInventory.map(item => `
            <option value="${item.name}" data-max="${item.quantity}" data-image="${item.image}" data-rarity="${item.rarity}">
                ${item.label} (${item.quantity} available)
            </option>
        `).join('');
}

function showItemDetails(listingId) {
    selectedListing = findListingById(listingId);
    if (!selectedListing) return;

    const panel = document.getElementById('detailsPanel');
    panel.classList.add('active');

    // Update item display
    document.getElementById('detailsItemImage').src = `../${selectedListing.itemImage}`;
    document.getElementById('detailsStackCount').textContent = `x${selectedListing.quantity}`;
    document.getElementById('detailsStackCount').style.display = selectedListing.quantity > 1 ? 'block' : 'none';

    // Update item info
    document.getElementById('detailsItemName').textContent = selectedListing.itemLabel;
    document.getElementById('detailsItemName').style.color = getRarityColor(selectedListing.rarity);

    const rarityBadge = document.getElementById('detailsRarity');
    rarityBadge.textContent = selectedListing.rarity.charAt(0).toUpperCase() + selectedListing.rarity.slice(1);
    rarityBadge.style.background = getRarityColor(selectedListing.rarity);

    document.getElementById('detailsCategory').textContent = selectedListing.category.charAt(0).toUpperCase() + selectedListing.category.slice(1);

    // Update seller info
    document.getElementById('detailsSeller').textContent = selectedListing.sellerName;

    // Update pricing
    document.getElementById('detailsCurrentBid').textContent = `$${selectedListing.price.toLocaleString()}`;

    // Initialize quantity selector
    const quantityInput = document.getElementById('purchaseQuantity');
    quantityInput.value = 1;
    quantityInput.max = selectedListing.quantity;
    document.getElementById('availableQty').textContent = `${selectedListing.quantity} available`;
    updateTotalPrice();
    updateQuantityButtons();

    // Update buy button
    const buyBtn = document.getElementById('buyoutBtn');
    const quantityControls = document.querySelector('.quantity-controls');

    buyBtn.style.display = 'flex';
    buyBtn.className = 'btn-buyout'; // Reset class

    if (selectedListing.isOwner) {
        quantityControls.style.display = 'none';
        buyBtn.classList.add('btn-danger');
        buyBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Remove Listing
        `;
    } else {
        quantityControls.style.display = 'flex';
        buyBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Buy Now
        `;
    }
}

function closeDetailsPanel() {
    document.getElementById('detailsPanel').classList.remove('active');
    selectedListing = null;
}

function updateTotalPrice() {
    if (!selectedListing) return;

    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
    const total = selectedListing.price * quantity;
    document.getElementById('totalPrice').textContent = `Total: $${total.toLocaleString()}`;
}

function updateQuantityButtons() {
    const quantityInput = document.getElementById('purchaseQuantity');
    const currentQty = parseInt(quantityInput.value) || 1;
    const maxQty = parseInt(quantityInput.max) || 1;

    document.getElementById('decreaseQty').disabled = currentQty <= 1;
    document.getElementById('increaseQty').disabled = currentQty >= maxQty;
}

function increaseQuantity() {
    const quantityInput = document.getElementById('purchaseQuantity');
    const currentQty = parseInt(quantityInput.value) || 1;
    const maxQty = parseInt(quantityInput.max) || 1;

    if (currentQty < maxQty) {
        quantityInput.value = currentQty + 1;
        updateTotalPrice();
        updateQuantityButtons();
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('purchaseQuantity');
    const currentQty = parseInt(quantityInput.value) || 1;

    if (currentQty > 1) {
        quantityInput.value = currentQty - 1;
        updateTotalPrice();
        updateQuantityButtons();
    }
}

function onQuantityInputChange() {
    const quantityInput = document.getElementById('purchaseQuantity');
    let value = parseInt(quantityInput.value) || 1;
    const maxQty = parseInt(quantityInput.max) || 1;

    // Clamp value between 1 and max
    value = Math.max(1, Math.min(value, maxQty));
    quantityInput.value = value;

    updateTotalPrice();
    updateQuantityButtons();
}

function buyItem() {
    if (!selectedListing) return;

    if (selectedListing.isOwner) {
        removeListing(selectedListing.id);
        return;
    }

    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
    const totalPrice = selectedListing.price * quantity;

    if (totalPrice > playerBalance) {
        alert('Insufficient funds');
        return;
    }

    document.getElementById('modalBuyoutItem').textContent = `${selectedListing.itemLabel} x${quantity}`;
    document.getElementById('modalBuyoutAmount').textContent = `$${totalPrice.toLocaleString()}`;
    document.getElementById('buyoutModal').classList.add('active');
}

function confirmPurchase() {
    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
    const totalPrice = selectedListing.price * quantity;

    sendData('purchaseItem', {
        listingId: selectedListing.id,
        quantity: quantity,
        amount: totalPrice
    });

    // Mock Logic for Browser Testing
    if (playerBalance >= totalPrice) {
        // Deduct balance
        playerBalance -= totalPrice;
        updateBalance(playerBalance);

        // Update listing
        selectedListing.quantity -= quantity;
        if (selectedListing.quantity <= 0) {
            allListings = allListings.filter(l => l.id !== selectedListing.id);
            myListings = myListings.filter(l => l.id !== selectedListing.id);
        }

        // Add to inventory
        const existingItem = playerInventory.find(i => i.name === selectedListing.itemName);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            playerInventory.push({
                name: selectedListing.itemName,
                label: selectedListing.itemLabel,
                image: selectedListing.itemImage,
                quantity: quantity,
                rarity: selectedListing.rarity,
                category: selectedListing.category
            });
        }
        updateInventory(playerInventory);
        renderListings();
        console.log(`Mock purchase successful: ${quantity}x ${selectedListing.itemLabel}`);
    }

    document.getElementById('buyoutModal').classList.remove('active');
    closeDetailsPanel();
}

function createListing() {
    const itemSelect = document.getElementById('auctionItem');
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const itemName = itemSelect.value;
    const quantity = parseInt(document.getElementById('auctionQuantity').value);
    const price = parseInt(document.getElementById('auctionStartBid').value);

    if (!itemName) {
        alert('Please select an item');
        return;
    }

    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }

    if (!price || price < 1) {
        alert('Please enter a valid price');
        return;
    }

    const maxQuantity = parseInt(selectedOption.dataset.max);
    if (quantity > maxQuantity) {
        alert(`You only have ${maxQuantity} of this item`);
        return;
    }

    sendData('createListing', {
        itemName: itemName,
        quantity: quantity,
        price: price
    });

    // Mock Logic for Browser Testing
    const invItem = playerInventory.find(i => i.name === itemName);
    if (invItem) {
        const newItem = {
            id: Date.now(),
            itemName: itemName,
            itemLabel: invItem.label,
            itemImage: invItem.image,
            quantity: quantity,
            rarity: invItem.rarity || 'common',
            category: invItem.category || 'misc',
            price: price,
            sellerName: 'You',
            sellerIdentifier: 'license:you',
            isOwner: true
        };

        allListings.unshift(newItem);
        myListings.unshift(newItem);

        // Reduce inventory
        invItem.quantity -= quantity;
        if (invItem.quantity <= 0) {
            playerInventory = playerInventory.filter(i => i.name !== itemName);
        }
        updateInventory(playerInventory);
        renderListings();
        console.log(`Mock listing created: ${quantity}x ${invItem.label} for $${price}`);
    }

    // Reset form
    document.getElementById('auctionItem').value = '';
    document.getElementById('auctionQuantity').value = '1';
    document.getElementById('auctionStartBid').value = '';

    // Switch to My Listings to show new item
    switchCategory('my-listings');
}

function removeListing(id) {
    const listing = findListingById(id);
    if (!listing) return;

    listingIdToRemove = id;
    document.getElementById('modalRemoveItemName').textContent = listing.itemLabel;
    document.getElementById('removeModal').classList.add('active');
}

function confirmRemove() {
    if (!listingIdToRemove) return;

    const id = listingIdToRemove;
    const listing = findListingById(id);

    if (listing) {
        // Send NUI callback
        sendData('removeListing', { id: id });

        // Mock Logic for Browser Testing
        // Return item to inventory
        const existingItem = playerInventory.find(i => i.name === listing.itemName);
        if (existingItem) {
            existingItem.quantity += listing.quantity;
        } else {
            playerInventory.push({
                name: listing.itemName,
                label: listing.itemLabel,
                image: listing.itemImage,
                quantity: listing.quantity,
                rarity: listing.rarity,
                category: listing.category
            });
        }

        // Remove from listings
        allListings = allListings.filter(l => l.id !== id);
        myListings = myListings.filter(l => l.id !== id);

        updateInventory(playerInventory);
        renderListings();
        console.log(`Listing removed: ${listing.itemLabel}`);
    }

    document.getElementById('removeModal').classList.remove('active');
    closeDetailsPanel();
    listingIdToRemove = null;
}

// ===== Helper Functions =====
function findListingById(id) {
    return allListings.find(l => l.id === id) ||
        myListings.find(l => l.id === id);
}

function getRarityColor(rarity) {
    const colors = {
        common: '#9d9d9d',
        uncommon: '#1eff00',
        rare: '#0070dd',
        epic: '#a335ee',
        legendary: '#ff8000'
    };
    return colors[rarity] || colors.common;
}

// Simulation
function toggleSimulation() {
    isSimulationActive = !isSimulationActive;
    const btn = document.getElementById('simulateBtn');

    if (isSimulationActive) {
        btn.classList.add('active');
        // Add a new listing every 2-5 seconds
        generateRandomListing();
        simulationInterval = setInterval(() => {
            generateRandomListing();
        }, Math.random() * 3000 + 2000);
    } else {
        btn.classList.remove('active');
        clearInterval(simulationInterval);
    }
}

function generateRandomListing() {
    const itemKeys = Object.keys(CONFIG.items);
    const vehicles = CONFIG.vehicles;
    let item, isVehicle = false;

    if (Math.random() > 0.2) { // 80% chance item
        const key = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        const configItem = CONFIG.items[key];
        item = {
            name: key,
            label: configItem.label,
            image: configItem.image,
            rarity: configItem.rarity,
            category: configItem.category
        };
    } else { // 20% chance vehicle
        const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        isVehicle = true;
        item = {
            name: vehicle.model,
            label: vehicle.label,
            image: vehicle.image,
            rarity: vehicle.rarity,
            category: 'vehicles'
        };
    }

    const price = Math.floor(Math.random() * 5000) + 100; // Simplified pricing for simulation

    const listing = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        itemName: item.name,
        itemLabel: item.label,
        itemImage: item.image,
        quantity: isVehicle ? 1 : Math.floor(Math.random() * 5) + 1,
        rarity: item.rarity,
        category: item.category,
        price: price,
        sellerName: CONFIG.sellers[Math.floor(Math.random() * CONFIG.sellers.length)],
        sellerIdentifier: 'license:system',
        isOwner: false
    };

    allListings.unshift(listing);

    if (currentCategory === 'all' || currentCategory === item.category) {
        renderListings();

        // Flash the toolbar to indicate activity
        const toolbar = document.getElementById('toolbar');
        toolbar.style.borderBottomColor = 'var(--success)';
        setTimeout(() => {
            toolbar.style.borderBottomColor = '';
        }, 300);
    }
}

// ===== F12 Console Testing Commands =====
window.addTestItem = function (itemName, quantity = 1) {
    const itemData = CONFIG.items[itemName];
    if (!itemData) {
        console.error('Unknown item:', itemName);
        console.log('Available items:', Object.keys(CONFIG.items));
        return;
    }

    const existingItem = playerInventory.find(i => i.name === itemName);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        playerInventory.push({
            name: itemName,
            label: itemData.label,
            image: itemData.image,
            quantity: quantity,
            rarity: itemData.rarity,
            category: itemData.category
        });
    }

    renderInventorySelect();
    console.log(`Added ${quantity}x ${itemData.label} to inventory`);
};

window.clearInventory = function () {
    playerInventory = [];
    renderInventorySelect();
    console.log('Inventory cleared');
};

window.setBalance = function (amount) {
    updateBalance(amount);
    console.log(`Balance set to $${amount.toLocaleString()}`);
};

window.addTestListings = function (count = 10) {
    const itemKeys = Object.keys(CONFIG.items);
    const vehicles = CONFIG.vehicles;
    const sellers = CONFIG.sellers;

    const getPriceForItem = (rarity, isVehicle) => {
        const basePrices = {
            common: isVehicle ? 10000 : 1000,
            uncommon: isVehicle ? 25000 : 5000,
            rare: isVehicle ? 50000 : 10000,
            epic: isVehicle ? 100000 : 15000,
            legendary: isVehicle ? 200000 : 30000
        };

        const basePrice = basePrices[rarity] || basePrices.common;
        // Random variance of ±30%
        const variance = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        return Math.floor(basePrice * variance);
    };

    for (let i = 0; i < count; i++) {
        let item, isVehicle = false;

        if (Math.random() > 0.3) { // 70% chance item
            const key = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            const configItem = CONFIG.items[key];
            item = {
                name: key,
                label: configItem.label,
                image: configItem.image,
                rarity: configItem.rarity,
                category: configItem.category
            };
        } else { // 30% chance vehicle
            const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
            isVehicle = true;
            item = {
                name: vehicle.model,
                label: vehicle.label,
                image: vehicle.image,
                rarity: vehicle.rarity,
                category: 'vehicles'
            };
        }

        const price = getPriceForItem(item.rarity, isVehicle);

        allListings.push({
            id: Date.now() + i,
            itemName: item.name,
            itemLabel: item.label,
            itemImage: item.image,
            quantity: isVehicle ? 1 : Math.floor(Math.random() * 5) + 1,
            rarity: item.rarity,
            category: item.category,
            price: price,
            sellerName: sellers[Math.floor(Math.random() * sellers.length)],
            sellerIdentifier: 'license:test',
            isOwner: false
        });
    }

    renderListings();
    console.log(`Added ${count} test listings`);
};

document.addEventListener('DOMContentLoaded', () => {
    // Close buttons
    document.getElementById('closeBtn').addEventListener('click', closeMarketplace);
    document.getElementById('closeDetailsBtn').addEventListener('click', closeDetailsPanel);

    // Category navigation
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchCategory(btn.dataset.category);
        });
    });

    // Search and sort
    document.getElementById('searchInput').addEventListener('input', renderListings);
    document.getElementById('sortSelect').addEventListener('change', renderListings);

    // View toggle
    document.getElementById('gridViewBtn').addEventListener('click', () => switchView('grid'));
    document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));

    document.getElementById('simulateBtn').addEventListener('click', toggleSimulation);

    // Quantity selector
    document.getElementById('increaseQty').addEventListener('click', increaseQuantity);
    document.getElementById('decreaseQty').addEventListener('click', decreaseQuantity);
    document.getElementById('purchaseQuantity').addEventListener('input', onQuantityInputChange);

    // Buy button
    document.getElementById('buyoutBtn').addEventListener('click', buyItem);

    // Modals
    document.getElementById('cancelBuyoutBtn').addEventListener('click', () => {
        document.getElementById('buyoutModal').classList.remove('active');
    });
    document.getElementById('confirmBuyoutBtn').addEventListener('click', confirmPurchase);

    // Remove Modal
    document.getElementById('cancelRemoveBtn').addEventListener('click', () => {
        document.getElementById('removeModal').classList.remove('active');
        listingIdToRemove = null;
    });
    document.getElementById('confirmRemoveBtn').addEventListener('click', confirmRemove);

    // Create listing form
    document.getElementById('createAuctionBtn').addEventListener('click', createListing);
    document.getElementById('cancelCreateBtn').addEventListener('click', () => {
        switchCategory('all');
    });

    document.getElementById('createAuctionBtn').addEventListener('click', () => {
        console.log('Create item listing');
        switchCategory('all');
    });

    // Vehicle Listing Form
    document.getElementById('cancelVehicleBtn').addEventListener('click', () => {
        switchCategory('all');
    });

    document.getElementById('createVehicleListingBtn').addEventListener('click', () => {
        const vehiclePlate = document.getElementById('vehicleSelect').value;
        const price = document.getElementById('vehiclePrice').value;

        if (!vehiclePlate || !price) {
            console.log('Missing vehicle or price');
            return;
        }

        console.log(`Listing vehicle ${vehiclePlate} for $${price}`);

        const vehicle = playerVehicles.find(v => v.plate === vehiclePlate);
        if (vehicle) {
            // Add to listings
            allListings.unshift({
                id: Date.now(),
                itemName: vehicle.model,
                itemLabel: vehicle.label,
                itemImage: vehicle.image,
                quantity: 1,
                rarity: vehicle.rarity,
                category: 'vehicles',
                price: parseInt(price),
                sellerName: 'You',
                sellerIdentifier: 'license:you', // Should match player identifier
                isOwner: true
            });

            // Remove from player vehicles (mock)
            playerVehicles = playerVehicles.filter(v => v.plate !== vehiclePlate);

            renderListings();
            switchCategory('all');
        }
    });

    // Mock Data Generators for Testing
    window.addTestVehicles = function () {
        playerVehicles = JSON.parse(JSON.stringify(CONFIG.vehicles)); // Deep copy
        console.log('Added test vehicles to garage');
    };
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const buyoutModal = document.getElementById('buyoutModal');
            const detailsPanel = document.getElementById('detailsPanel');

            if (buyoutModal.classList.contains('active')) {
                buyoutModal.classList.remove('active');
            } else if (detailsPanel.classList.contains('active')) {
                closeDetailsPanel();
            } else {
                closeMarketplace();
            }
        }
    });

    // Dev Tools
    const devAddItemsBtn = document.getElementById('devAddItemsBtn');
    if (devAddItemsBtn) {
        devAddItemsBtn.addEventListener('click', () => {
            addTestItem('weapon_ceramicpistol', 2);
            addTestItem('armor', 2);
            addTestItem('coke_brick', 5);
            addTestItem('drum_attachment', 2);
            alert('Test items added!');
        });
    }

    const devAddVehiclesBtn = document.getElementById('devAddVehiclesBtn');
    if (devAddVehiclesBtn) {
        devAddVehiclesBtn.addEventListener('click', () => {
            addTestVehicles();
            alert('Test vehicles added!');
        });
    }

    const devSetBalanceBtn = document.getElementById('devSetBalanceBtn');
    if (devSetBalanceBtn) {
        devSetBalanceBtn.addEventListener('click', () => {
            setBalance(1000000);
            alert('Balance set to $1,000,000');
        });
    }

    const devClearInvBtn = document.getElementById('devClearInvBtn');
    if (devClearInvBtn) {
        devClearInvBtn.addEventListener('click', () => {
            clearInventory();
            alert('Inventory cleared!');
        });
    }

    const devPopulateBtn = document.getElementById('devPopulateBtn');
    if (devPopulateBtn) {
        devPopulateBtn.addEventListener('click', () => {
            addTestListings(20);
            alert('Listings populated with 20 items!');
        });
    }

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Console welcome message
    console.log('%c🛒 Marketplace Testing Commands', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
    console.log('%caddTestItem(name, quantity)', 'color: #10b981; font-weight: bold;', '- Add items to inventory');
    console.log('%csetBalance(amount)', 'color: #10b981; font-weight: bold;', '- Set player balance');
    console.log('%caddTestListings(count)', 'color: #10b981; font-weight: bold;', '- Generate test listings');
    console.log('%caddTestVehicles()', 'color: #10b981; font-weight: bold;', '- Add test vehicles to garage');
    console.log('%cclearInventory()', 'color: #10b981; font-weight: bold;', '- Clear all inventory items');
    console.log('\nAvailable items: weapon_ceramicpistol, armor, coke_brick, crack_baggy, drum_attachment, boostingtablet, adder, banshee, bullet, cheetah, entityxf, infernus, vacca, voltic');
});
