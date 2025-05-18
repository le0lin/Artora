// Sepet içeriğini yükle
async function loadCart() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Sepeti görüntülemek için giriş yapmanız gerekmektedir.', 'warning');
            return;
        }

        showLoading('Sepet yükleniyor...');
        const response = await fetch('http://localhost:5000/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sepet yüklenirken bir hata oluştu');
        }

        const cart = await response.json();
        console.log('Sepet API yanıtı:', cart);
        hideLoading();

        const cartItemsContainer = document.getElementById('cartItems');
        const totalItemsElement = document.getElementById('totalItems');
        const totalPriceElement = document.getElementById('totalPrice');
        const modalTotalPrice = document.getElementById('modalTotalPrice');
        const checkoutBtn = document.getElementById('checkoutBtn');

        // Sepet boş veya items dizisi yoksa
        if (!cart || !cart.items || cart.items.length === 0) {
            displayEmptyCart(cartItemsContainer, totalItemsElement, totalPriceElement, modalTotalPrice, checkoutBtn);
            return;
        }

        // Sepette ürün varsa ödeme butonunu etkinleştir
        enableCheckoutButton(checkoutBtn);

        let totalPrice = 0;
        cartItemsContainer.innerHTML = '';
        const backendUrl = "http://localhost:5000";
        cart.items.forEach(function(item) {
            if (!item || !item.product) return;
            var product = item.product;
            totalPrice += product.price * (item.quantity || 1);
            cartItemsContainer.innerHTML += `
                <div class="cart-item d-flex align-items-center gap-3 mb-3">
                    <div class="cart-item-image">
                        <img src="${backendUrl + product.imageUrl}" alt="${product.title}" class="rounded" style="width:80px;height:80px;object-fit:cover;">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="mb-0">${product.title}</h5>
                            <button class="btn btn-link text-danger remove-item" data-id="${product._id}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <p class="mb-1 text-muted small">
                                    <i class="fas fa-tag me-1"></i>${product.category || 'Genel'}
                                </p>
                                <span class="seller-name">${product.sellerId && product.sellerId.name ? product.sellerId.name : ''} ${product.sellerId && product.sellerId.surname ? product.sellerId.surname : ''}</span>
                            </div>
                            <div class="text-end">
                                <div class="price mb-2">₺${product.price.toLocaleString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        updateTotalPrice(totalPrice, totalItemsElement, totalPriceElement, modalTotalPrice);
        attachRemoveEventListeners();

    } catch (error) {
        console.error('Sepet yükleme hatası:', error);
        hideLoading();
        showMessage('Sepet yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
    }
}

function displayEmptyCart(container, totalItems, totalPrice, modalPrice, checkoutBtn) {
    container.innerHTML = `
        <div class="empty-cart-container text-center p-5">
            <i class="fas fa-shopping-cart fa-4x mb-4" style="color: #ffffff; opacity: 0.5;"></i>
            <h3 class="cart-title mb-4">Sepetiniz Boş</h3>
            <p class="cart-summary-text mb-4">Resim galerisinden beğendiğiniz eserleri sepetinize ekleyebilirsiniz.</p>
            <a href="resim_galeri.html" class="btn btn-checkout">
                <i class="fas fa-images me-2"></i>Resim Galerisine Git
            </a>
        </div>
    `;
    totalItems.textContent = '0';
    totalPrice.textContent = '₺0.00';
    modalPrice.textContent = '₺0.00';
    
    checkoutBtn.disabled = true;
    checkoutBtn.setAttribute('data-bs-toggle', 'tooltip');
    checkoutBtn.setAttribute('data-bs-placement', 'top');
    checkoutBtn.setAttribute('title', 'Ödeme yapmak için sepetinizde en az bir ürün olmalıdır');
    
    new bootstrap.Tooltip(checkoutBtn);
    checkoutBtn.removeAttribute('data-bs-toggle');
    checkoutBtn.removeAttribute('data-bs-target');
}

function enableCheckoutButton(checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.setAttribute('data-bs-toggle', 'modal');
    checkoutBtn.setAttribute('data-bs-target', '#checkoutModal');
    checkoutBtn.removeAttribute('title');
    
    const tooltip = bootstrap.Tooltip.getInstance(checkoutBtn);
    if (tooltip) {
        tooltip.dispose();
    }
}

function createCartItemElement(product) {
    // Satıcı adı ve avatarı için güvenli erişim
    let sellerName = '';
    let sellerInitials = '';
    if (product.sellerId) {
        if (typeof product.sellerId === 'object') {
            sellerName = (product.sellerId.name || '') + ' ' + (product.sellerId.surname || '');
            sellerInitials = getInitials(sellerName);
        } else {
            sellerName = product.sellerId;
            sellerInitials = getInitials(sellerName);
        }
    } else {
        sellerName = 'Bilinmiyor';
        sellerInitials = '??';
    }

    return `
        <div class="cart-item" data-id="${product._id}">
            <div class="d-flex align-items-center gap-3">
                <div class="cart-item-image">
                    <img src="${product.imageUrl}" alt="${product.title}" class="rounded">
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="mb-0">${product.title}</h5>
                        <button class="btn btn-link text-danger remove-item" data-id="${product._id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="mb-1 text-muted small">
                                <i class="fas fa-tag me-1"></i>${product.category || 'Genel'}
                            </p>
                            <div class="seller-info d-flex align-items-center gap-2">
                                <div class="seller-avatar" title="${sellerName}">
                                    ${sellerInitials}
                                </div>
                                <span class="seller-name">${sellerName}</span>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="price mb-2">₺${product.price.toLocaleString('tr-TR')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateTotalPrice(totalPrice, totalItems, totalPriceElement, modalTotalPrice) {
    const itemCount = document.querySelectorAll('.cart-item').length;
    totalItems.textContent = itemCount.toString();
    totalPriceElement.textContent = `₺${totalPrice.toLocaleString('tr-TR')}`;
    modalTotalPrice.textContent = `₺${totalPrice.toLocaleString('tr-TR')}`;
}

function attachRemoveEventListeners() {
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.currentTarget.dataset.id;
            await removeFromCart(productId);
        });
    });
}

async function removeFromCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('İşlem yapmak için giriş yapmanız gerekmektedir.', 'warning');
            return;
        }

        const cartItem = document.querySelector(`.cart-item[data-id="${productId}"]`);
        if (!cartItem) {
            console.error('Silinecek ürün bulunamadı:', productId);
            return;
        }

        showLoading('Ürün kaldırılıyor...');
        const response = await fetch(`http://localhost:5000/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ürün sepetten kaldırılamadı');
        }

        // Önce UI'dan ürünü kaldır
        cartItem.remove();

        // Sepeti yeniden yükle
        await loadCart();
        showMessage('Ürün sepetten kaldırıldı', 'success');
    } catch (error) {
        console.error('Sepetten ürün kaldırma hatası:', error);
        showMessage('Ürün sepetten kaldırılırken bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
    } finally {
        hideLoading();
    }
}

// Ürün indirme fonksiyonu (token ile fetch)
function downloadProduct(productId) {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/products/${productId}/download`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => {
        if (!response.ok) throw new Error('İndirme yetkiniz yok veya dosya bulunamadı.');
        // Dosya adını response header'dan almaya çalış
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'resim.jpg';
        if (disposition && disposition.indexOf('filename=') !== -1) {
            filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
        }
        return response.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(err => alert(err.message));
}

// Satıcı baş harflerini al
function getInitials(fullName) {
    return fullName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Loading gösterme/gizleme fonksiyonları
function showLoading(message = 'Yükleniyor...') {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-overlay';
    loadingEl.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
    `;
    document.body.appendChild(loadingEl);
}

function hideLoading() {
    const loadingEl = document.querySelector('.loading-overlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

// Sepeti temizle
async function clearCart() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('İşlem yapmak için giriş yapmanız gerekmektedir.', 'warning');
            return;
        }

        showLoading('Sepet temizleniyor...');
        const response = await fetch('http://localhost:5000/api/cart/clear', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sepet temizlenemedi');
        }

        // Sepeti yeniden yükle
        await loadCart();
        showMessage('Sepetiniz başarıyla temizlendi.', 'success');
    } catch (error) {
        console.error('Sepet temizlenirken hata:', error);
        showMessage('Sepet temizlenirken bir hata oluştu.', 'error');
    } finally {
        hideLoading();
    }
}

// Kart numarası formatla
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    input.value = value;
}

// Son kullanma tarihi formatla
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    input.value = value;
}

// Kullanıcıya mesaj göstermek için basit bir fonksiyon (toast veya alert)
function showMessage(message, type = 'info') {
    // Bootstrap toast varsa kullan, yoksa alert
    if (window.bootstrap) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0 position-fixed bottom-0 end-0 m-3`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', () => { toast.remove(); });
    } else {
        alert(message);
    }
}

// Translations object tanımı
const translations = {
    tr: {
        emptyCart: "Sepetinizde ürün bulunmamaktadır.",
        continueShopping: "Alışverişe Devam Et",
        seller: "Satıcı",
        remove: "Kaldır",
        category_digitalArt: "Dijital Sanat",
        category_photography: "Fotoğraf",
        category_illustration: "İllüstrasyon",
        category_painting: "Resim",
        category_vector: "Vektör",
        subtotal: "Ara Toplam",
        total: "Toplam",
        proceedToCheckout: "Ödemeye Geç",
        removeItem: "Ürünü Kaldır",
        selectCategory: "Kategori Seçin"
    },
    en: {
        emptyCart: "Your cart is empty.",
        continueShopping: "Continue Shopping",
        seller: "Seller",
        remove: "Remove",
        category_digitalArt: "Digital Art",
        category_photography: "Photography",
        category_illustration: "Illustration",
        category_painting: "Painting",
        category_vector: "Vector",
        subtotal: "Subtotal",
        total: "Total",
        proceedToCheckout: "Proceed to Checkout",
        removeItem: "Remove Item",
        selectCategory: "Select Category"
    }
};

// Event Listeners for Theme and Language
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme and language
    initializeThemeAndLanguage();
    
    // Get all necessary elements
    const elements = {
        paymentForm: document.getElementById('paymentForm'),
        cardNumber: document.getElementById('cardNumber'),
        expiryDate: document.getElementById('expiryDate'),
        cvv: document.getElementById('cvv'),
        themeSwitcher: document.getElementById('theme-switcher'),
        langSwitcher: document.getElementById('lang-switcher'),
        clearCartBtn: document.getElementById('clearCartBtn')
    };

    // Add event listeners only if elements exist
    if (elements.cardNumber) {
        elements.cardNumber.addEventListener('input', () => formatCardNumber(elements.cardNumber));
    }

    if (elements.expiryDate) {
        elements.expiryDate.addEventListener('input', () => formatExpiryDate(elements.expiryDate));
    }

    if (elements.paymentForm) {
        elements.paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    if (elements.themeSwitcher) {
        elements.themeSwitcher.addEventListener('click', handleThemeSwitch);
    }

    if (elements.langSwitcher) {
        elements.langSwitcher.addEventListener('click', handleLanguageSwitch);
    }

    // Clear cart button event listener
    if (elements.clearCartBtn) {
        elements.clearCartBtn.addEventListener('click', async () => {
            if (confirm('Sepetinizi temizlemek istediğinize emin misiniz?')) {
                await clearCart();
            }
        });
    }

    // Load cart only if we're on the cart page
    const cartItemsContainer = document.getElementById('cartItems');
    if (cartItemsContainer) {
        loadCart();
    }
});

// Ödeme formu submit işlemi
const paymentForm = document.getElementById('paymentForm');
if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!paymentForm.checkValidity()) {
            paymentForm.classList.add('was-validated');
            return;
        }
        // Sepetteki ürünleri backend'e sipariş olarak gönder
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const data = await response.json();
            if (response.ok && data.order && data.order.items && data.order.items.length > 0) {
                // Her ürün için indirme butonu oluştur
                let downloadLinks = '';
                for (const item of data.order.items) {
                    downloadLinks += `<button class="btn btn-success my-2" onclick="downloadProduct('${item.product}')">Resmi İndir</button><br/>`;
                }
                // Başarı modalında indirme linklerini göster
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                document.querySelector('#successModal .modal-body').innerHTML = `
                    <i class="fas fa-check-circle fa-4x text-success mb-4"></i>
                    <h4 class="mb-3">Ödeme Başarılı!</h4>
                    <p class="mb-4">Siparişiniz başarıyla tamamlandı. Teşekkür ederiz!</p>
                    ${downloadLinks}
                    <button type="button" class="btn btn-primary mt-2" onclick="window.location.href='satin_aldiklarim.html'">
                        Satın Aldıklarım'a Git
                    </button>
                `;
                successModal.show();
                // Checkout modalı kapat
                const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
                if (checkoutModal) checkoutModal.hide();
            } else {
                alert(data.message || 'Sipariş tamamlanamadı.');
            }
        } catch (err) {
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    });
}

// Global payment submit handler
function handlePaymentSubmit(e) {
    e.preventDefault();
    const paymentForm = e.target;
    if (!paymentForm.checkValidity()) {
        paymentForm.classList.add('was-validated');
        return;
    }
    // Sepetteki ürünleri backend'e sipariş olarak gönder
    (async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const data = await response.json();
            if (response.ok && data.order && data.order.items && data.order.items.length > 0) {
                let downloadLinks = '';
                for (const item of data.order.items) {
                    downloadLinks += `<button class=\"btn btn-success my-2\" onclick=\"downloadProduct('${item.product}')\">Resmi İndir</button><br/>`;
                }
                // Başarı modalında indirme linklerini göster
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                document.querySelector('#successModal .modal-body').innerHTML = `
                    <i class=\"fas fa-check-circle fa-4x text-success mb-4\"></i>
                    <h4 class=\"mb-3\">Ödeme Başarılı!</h4>
                    <p class=\"mb-4\">Siparişiniz başarıyla tamamlandı. Teşekkür ederiz!</p>
                    ${downloadLinks}
                    <button type=\"button\" class=\"btn btn-primary mt-2\" onclick=\"window.location.href='satin_aldiklarim.html'\">Satın Aldıklarım'a Git</button>
                `;
                successModal.show();
                const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
                if (checkoutModal) checkoutModal.hide();
            } else {
                alert(data.message || 'Sipariş tamamlanamadı.');
            }
        } catch (err) {
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    })();
}

// Theme ve dil ayarlarını başlat
function initializeThemeAndLanguage() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const currentLang = localStorage.getItem('language') || 'tr';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('lang', currentLang);
    updateTranslations();
}

// Tema değiştirme işlemi
function handleThemeSwitch() {
    const currentTheme = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Dil değiştirme işlemi
function handleLanguageSwitch() {
    const currentLang = localStorage.getItem('language') === 'tr' ? 'en' : 'tr';
    localStorage.setItem('language', currentLang);
    document.documentElement.setAttribute('lang', currentLang);
    updateTranslations();
}

// Çevirileri güncelle
function updateTranslations() {
    const lang = localStorage.getItem('language') || 'tr';
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        el.textContent = translations[lang][key] || key;
    });
}

// Çeviri ve tema ayarlarını başlat
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeAndLanguage();
    const themeSwitcher = document.getElementById('theme-switcher');
    const langSwitcher = document.getElementById('lang-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme);
            document.documentElement.setAttribute('data-theme', currentTheme);
        });
    }
    if (langSwitcher) {
        langSwitcher.addEventListener('click', () => {
            const currentLang = localStorage.getItem('language') === 'tr' ? 'en' : 'tr';
            localStorage.setItem('language', currentLang);
            document.documentElement.setAttribute('lang', currentLang);
            updateTranslations();
        });
    }
    updateTranslations();
});