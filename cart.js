/**
 * Shopping Cart Logic
 */

const CART_STORAGE_KEY = 'quickmetro_bites_cart';

let cart = [];

// Load cart from local storage on init
function initCart() {
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (storedCart) {
    cart = JSON.parse(storedCart);
  }
  updateCartUI();
}

function addToCart(id, name, price, image) {
  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: id,
      name: name,
      price: parseFloat(price),
      image: image || 'assets/images/logo.png', // Default image if none provided
      quantity: 1
    });
  }
  saveCart();
  updateCartUI();
  // Optional: Show a toast notification
  alert(`${name} added to cart!`);
}
//const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

// addToCartButtons.addEventListener('click', function() {
//   const id = this.getAttribute('data-id');
//  alert('Add to cart button clicked for ID:', id);
// });


// Helper for menu.html list items
function addToCartFromElement(btnElement) {
  try {
    console.log('Add to cart button clicked:', btnElement);
    // Structure: <li>Name <span class="price">Price</span> <button>...</button></li>
    const li = btnElement.parentElement;
    if (!li) throw new Error('Parent element not found');

    const priceSpan = li.querySelector('.price');
    if (!priceSpan) throw new Error('Price span not found');

    // Extract price
    const priceText = priceSpan.innerText.replace(/[₹\/-]/g, '').trim();
    let price = parseFloat(priceText);
    if (isNaN(price)) price = 0;

    // Extract name: Clone the LI, remove price span and button, then get text
    const clone = li.cloneNode(true);
    const priceNode = clone.querySelector('.price');
    const btnNode = clone.querySelector('button');
    if (priceNode) priceNode.remove();
    if (btnNode) btnNode.remove();

    // Clean up any other remaining spans if they are just wrappers
    let name = clone.textContent.trim();

    // Remove trailing/leading special chars if any from bad HTML
    name = name.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9)]+$/g, '');

    // Fallback if name is empty
    if (!name) name = "Item";

    // Generate a simple ID
    const id = 'menu_' + name.replace(/\s+/g, '_').toLowerCase();

    addToCart(id, name, price, null);

    // Animation feedback
    const originalText = btnElement.innerText;
    btnElement.innerText = '✓';
    setTimeout(() => btnElement.innerText = originalText, 1000);
  } catch (error) {
    console.error(error);
    alert('Error adding to cart: ' + error.message);
  }
}


function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function updateQuantity(id, change) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      saveCart();
      updateCartUI();
    }
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function calculateTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// UI Functions

function updateCartUI() {
  const cartCountElements = document.querySelectorAll('.cart-count');
  const cartTotal = calculateTotal();
  const totalCount = cart.reduce((count, item) => item.quantity ? count + item.quantity : count, 0);

  cartCountElements.forEach(el => el.textContent = totalCount);

  // If we have a cart modal open, re-render it
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalElement = document.getElementById('cart-total-price');

  if (cartItemsContainer && cartTotalElement) {
    renderCartItems(cartItemsContainer);
    cartTotalElement.textContent = `₹${cartTotal.toFixed(2)}`;
  }
}

function renderCartItems(container) {
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-cart" style="text-align:center; padding:20px;">Your cart is empty.</p>';
    return;
  }

  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.classList.add('cart-item');
    itemEl.innerHTML = `
      <div class="cart-item-details" style="flex-grow:1;">
        <h4 style="margin:0; font-size:16px;">${item.name}</h4>
        <p style="margin:0; color: #666;">₹${item.price} x ${item.quantity}</p>
      </div>
      <div class="cart-item-actions">
        <button onclick="updateQuantity('${item.id}', -1)">-</button>
        <span style="margin: 0 5px;">${item.quantity}</span>
        <button onclick="updateQuantity('${item.id}', 1)">+</button>
        <button onclick="removeFromCart('${item.id}')" class="remove-btn" style="color:red; background:none; font-size:18px;">&times;</button>
      </div>
    `;
    container.appendChild(itemEl);
  });
}

function toggleCartModal() {
  const modal = document.getElementById('cart-modal');
  modal.classList.toggle('active');
  if (modal.classList.contains('active')) {
    updateCartUI(); // Refresh UI when opening
  }
}

// QR Code Generation
function generatePaymentQR() {
  const total = calculateTotal();
  if (total <= 0) {
    alert("Cart is empty!");
    return;
  }

  const upiId = '7017625900@pthdfc'; // Replace with user's actual UPI ID if available
  const name = 'QuickMetroBITES';
  // Standard UPI URL format
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${total}&cu=INR`;

  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = ''; // Clear previous

  // Using qrcode.js library (assumed to be loaded)
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: upiUrl,
      width: 128,
      height: 128
    });

    document.getElementById('checkout-section').style.display = 'none';
    const paymentSection = document.getElementById('payment-section');
    paymentSection.style.display = 'block';

    // Ensure we don't duplicate the complete button if run multiple times
    let completeBtn = document.getElementById('complete-order-btn');
    if (!completeBtn) {
      completeBtn = document.createElement('button');
      completeBtn.id = 'complete-order-btn';
      completeBtn.className = 'btn btn-hover';
      completeBtn.style.marginTop = '10px';
      completeBtn.style.width = '100%';
      completeBtn.innerText = 'Complete Order';
      completeBtn.onclick = completeOrder;
      paymentSection.appendChild(completeBtn);
    }

  } else {
    alert('QR Code library not loaded. Please check internet connection.');
  }
}

function completeOrder() {
  if (cart.length === 0) return;

  const order = {
    id: 'ORD-' + Date.now(),
    date: new Date().toISOString(),
    items: [...cart],
    total: calculateTotal()
  };

  // Save to separate local storage for order history
  const historyKey = 'quickmetro_bites_orders';
  let orderHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
  orderHistory.push(order);
  localStorage.setItem(historyKey, JSON.stringify(orderHistory));

  // Clear current cart
  cart = [];
  saveCart();
  updateCartUI();

  // Show success and reset UI
  alert('Order Placed Successfully! Thank you.');

  // Reset Modal
  document.getElementById('checkout-section').style.display = 'block';
  document.getElementById('payment-section').style.display = 'none';
  toggleCartModal();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initCart);
