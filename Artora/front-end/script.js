document.addEventListener("DOMContentLoaded", () => {
    const mobileToggle = document.querySelector(".mobile-toggle");
    const sidebar = document.querySelector(".sidebar");
    const uploadButton = document.getElementById('uploadButton');
    const loginPrompt = document.getElementById('loginPrompt');

    // Mobile menu toggle
    if (mobileToggle) {
        mobileToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    // Set active menu item
    function setActiveMenuItem() {
        const currentPath = window.location.pathname;
        document.querySelectorAll(".nav-link").forEach(link => {
            const href = link.getAttribute("href");
            if (href && currentPath.endsWith(href)) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    // Upload button click handler
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = 'urunekle.html';
            } else {
                const authModal = new bootstrap.Modal(document.getElementById('authModal'));
                authModal.show();
            }
        });
    }

    // Sayfa yüklendiğinde active menü
    setActiveMenuItem();
    
    // Filtreleme olaylarını dinle
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter || searchInput || sortFilter) {
        loadProducts();
    }

    // Kullanıcı bilgilerini göster/gizle
    const checkUserAuth = () => {
        const token = localStorage.getItem('token');
        const userDropdown = document.getElementById('userDropdown');
        const loginSection = document.getElementById('loginSection');
        
        if (token && userDropdown && loginSection) {
            userDropdown.style.display = 'block';
            loginSection.style.display = 'none';
        } else if (userDropdown && loginSection) {
            userDropdown.style.display = 'none';
            loginSection.style.display = 'block';
        }
    };
    
    // Sayfa yüklendiğinde kullanıcı durumunu kontrol et
    checkUserAuth();

    // Sidebar'da Satın Aldıklarım linkini sadece giriş yapan kullanıcılar görebilsin
    const satinAldiklarimLink = document.getElementById('satinAldiklarimLink');
    function toggleSatinAldiklarimLink() {
        const token = localStorage.getItem('token');
        if (satinAldiklarimLink) {
            if (token) {
                satinAldiklarimLink.classList.remove('d-none');
            } else {
                satinAldiklarimLink.classList.add('d-none');
            }
        }
    }
    toggleSatinAldiklarimLink();
    window.addEventListener('storage', toggleSatinAldiklarimLink);

    let debounceTimeout;

    function applyFilters() {
        const filters = {
            category: categoryFilter ? categoryFilter.value : '',
            search: searchInput ? searchInput.value : '',
            sort: sortFilter ? sortFilter.value : ''
        };
        loadProducts(filters);
    }

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(applyFilters, 300);
        });
    }
});

// Ürünleri yükle ve görüntüle
async function loadProducts(filters = {}) {
    try {
        let url = 'http://localhost:5000/api/products';
        const params = new URLSearchParams();
        
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.sort) params.append('sort', filters.sort);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const products = await response.json();
        
        const gallery = document.getElementById('productGallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        if (!Array.isArray(products)) {
            console.error('Ürünler dizi formatında değil:', products);
            return;
        }
        
        products.forEach(product => {
            if (!product) return;
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.imageUrl || ''}" alt="${product.title || 'Ürün'}" class="product-image" onerror="this.src='img/placeholder.jpg'">
                <div class="product-info">
                    <h3 class="product-title">${product.title || 'İsimsiz Ürün'}</h3>
                    <p class="product-seller">
                        <i class="fas fa-user me-1"></i>
                        ${product.sellerId ? `${product.sellerId.name || ''} ${product.sellerId.surname || ''}` : 'Bilinmiyor'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="product-price">₺${product.price || 0}</span>
                        <button class="btn btn-primary btn-sm" onclick="addToCart('${product._id}')">
                            <i class="fas fa-shopping-cart me-1"></i>
                            Sepete Ekle
                        </button>
                    </div>
                    <div class="product-tags">
                        ${Array.isArray(product.tags) ? product.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : ''}
                    </div>
                </div>
            `;
            gallery.appendChild(card);
        });
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
    }
}

// Sepete ürün ekle
async function addToCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            const authModal = new bootstrap.Modal(document.getElementById('authModal'));
            authModal.show();
            return;
        }

        // Önce sepeti kontrol et
        const cartResponse = await fetch('http://localhost:5000/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const cart = await cartResponse.json();

        // Ürün zaten sepette mi kontrol et
        if (cart.items && cart.items.some(item => item.product._id === productId)) {
            alert('Bu ürün zaten sepetinizde bulunuyor!');
            return;
        }

        const response = await fetch('http://localhost:5000/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                quantity: 1
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Ürün sepete eklendi!');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        alert(error.message);
    }
}

// Hatalı tekrar tanımlama ve currentTheme hatasını düzelt
let currentTheme = localStorage.getItem('theme') || 'dark';

function updateThemeUI() {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    if (currentTheme === 'dark') {
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.setAttribute('data-i18n', 'lightTheme');
    } else {
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeText) themeText.setAttribute('data-i18n', 'darkTheme');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateThemeUI();
});

window.changeTheme = (theme) => {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    updateThemeUI();
};

// profilimBtn tekrar tanımlanmasın diye kontrol ekle
if (typeof window._profilimBtnListenerAdded === 'undefined') {
    const profilimBtn = document.getElementById('profilimBtn');
    const profilimAlert = document.getElementById('profilimAlert');
    if (profilimBtn && profilimAlert) {
        profilimBtn.addEventListener('click', function(e) {
            e.preventDefault();
            profilimAlert.classList.remove('d-none');
            setTimeout(() => {
                profilimAlert.classList.add('d-none');
            }, 3500);
        });
        window._profilimBtnListenerAdded = true;
    }
}
