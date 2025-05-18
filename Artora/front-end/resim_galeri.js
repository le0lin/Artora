// Theme Management
function initializeTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Event Listeners for Theme
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadImages();
    
    // Kullanıcı giriş durumunu kontrol et
    const token = localStorage.getItem('token');
    const uploadButton = document.getElementById('uploadButton');
    const loginPrompt = document.getElementById('loginPrompt');

    if (token) {
        if (uploadButton) {
            uploadButton.style.display = 'block';
            // Resim yükleme butonuna tıklama olayı
            uploadButton.addEventListener('click', () => {
                window.location.href = 'urunekle.html';
            });
        }
        if (loginPrompt) loginPrompt.style.display = 'none';
    } else {
        if (uploadButton) uploadButton.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
    }

    // Theme switcher
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update theme icon
            const themeIcon = themeSwitcher.querySelector('i');
            themeIcon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        });
    }

    // Filtre değişikliklerini dinle
});

const backendUrl = "http://localhost:5000";

// Update the displayImages function to include seller information
function displayImages(images) {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = '';

    if (images.length === 0) {
        gallery.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x mb-3"></i>
                <h3>Sonuç Bulunamadı</h3>
                <p>Filtreleri değiştirerek tekrar deneyin.</p>
            </div>
        `;
        return;
    }

    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Satıcı bilgilerini al
        const sellerName = image.seller.fullName;
        const sellerAvatar = image.seller.profilePhoto;
        const initials = sellerName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        // Giriş yapan kullanıcının ID'sini al
        const currentUserId = localStorage.getItem('userId');
        const isSeller = currentUserId === image.seller._id;

        card.innerHTML = `
            <div class="product-image-container" style="cursor: pointer;">
                <img src="${backendUrl + image.imageUrl}" alt="${image.title}" class="product-image">
                <div class="product-overlay">
                    <i class="fas fa-search-plus"></i>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${image.title}</h3>
                <div class="product-seller">
                    <div class="seller-avatar" title="${sellerName}">
                        ${sellerAvatar ? 
                            `<img src="${sellerAvatar}" alt="${sellerName}">` : 
                            initials}
                    </div>
                    <div class="seller-info">
                        <span class="seller-name">${sellerName}</span>
                        <span class="seller-rating">
                            <i class="fas fa-star text-warning"></i>
                            ${(image.seller.rating || 0).toFixed(1)}
                        </span>
                    </div>
                    ${isSeller ? '<span class="badge bg-primary ms-2">Sizin İlanınız</span>' : ''}
                </div>
                <div class="product-details">
                    <span class="product-category">${image.category}</span>
                    <span class="product-price">₺${image.price.toLocaleString('tr-TR')}</span>
                </div>
                <div class="product-actions">
                    <button class="action-btn btn-details" data-id="${image._id}">
                        <i class="fas fa-eye"></i>
                        <span>Detaylar</span>
                    </button>
                    ${!isSeller ? `
                    <button class="action-btn btn-cart" data-id="${image._id}">
                        <i class="fas fa-cart-plus"></i>
                        <span>Sepete Ekle</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        gallery.appendChild(card);

        // Event listener'ları ekle
        attachCardEventListeners(card, image);
    });
}

// Kart event listener'larını ekle
function attachCardEventListeners(card, image) {
    // Resme tıklama
    const imageContainer = card.querySelector('.product-image-container');
    imageContainer.addEventListener('click', () => {
        showImageDetails(image);
    });

    // Detay butonu
    const detailsBtn = card.querySelector('.btn-details');
    if (detailsBtn) {
        detailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImageDetails(image);
        });
    }

    // Sepete ekle butonu
    const cartBtn = card.querySelector('.btn-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await addToCart(image._id);
        });
    }
}

// Resim satın alma fonksiyonu
async function purchaseImage(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Satın alma işlemi için giriş yapmanız gerekmektedir.');
            return;
        }

        const response = await fetch(`http://localhost:5000/api/purchase/${productId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Resim başarıyla satın alındı!');
            // Sayfayı yenile
            location.reload();
        } else {
            alert(data.message || 'Satın alma işlemi sırasında bir hata oluştu.');
        }
    } catch (error) {
        console.error('Satın alma hatası:', error);
        alert('Satın alma işlemi sırasında bir hata oluştu.');
    }
}

// Ürün detaylarını göster
function showImageDetails(product) {
    // Modalı oluştur veya seç
    let modalEl = document.getElementById('imageModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.className = 'modal fade';
        modalEl.id = 'imageModal';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }
    // Modal içeriğini doldur
    modalEl.querySelector('.modal-content').innerHTML = `
        <div class="modal-header border-0">
            <h5 class="modal-title">${product.title}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body text-center">
            <img src="${backendUrl + product.imageUrl}" alt="${product.title}" class="img-fluid rounded mb-3" style="max-height:350px;">
            <div class="mb-2 text-muted">${product.category ? product.category : 'Genel'} | ₺${product.price.toLocaleString('tr-TR')}</div>
            <div class="mb-2">${product.description || 'Açıklama bulunmuyor.'}</div>
            <div class="mb-2"><b>Satıcı:</b> ${(product.seller && (product.seller.fullName || product.seller.name)) || 'Bilinmiyor'}</div>
        </div>
    `;
    // Bootstrap modalı aç
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Resim önizleme modalını göster
function showImagePreview(image) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImg = modal.querySelector('#previewImage');
    const modalTitle = modal.querySelector('#previewTitle');
    const modalDescription = modal.querySelector('#previewDescription');
    const modalPrice = modal.querySelector('#previewPrice');
    const modalCategory = modal.querySelector('#previewCategory');
    const addToCartBtn = modal.querySelector('#addToCartBtn');

    modalImg.src = image.imageUrl;
    modalTitle.textContent = image.title;
    modalDescription.textContent = image.description || 'Açıklama bulunmuyor';
    modalPrice.textContent = `₺${image.price.toLocaleString('tr-TR')}`;
    modalCategory.textContent = image.category || 'Genel';

    // Bootstrap modal'ı göster
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    // Sepete ekle butonu için event listener
    addToCartBtn.onclick = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('error', 'Sepete eklemek için giriş yapmanız gerekmektedir.');
                return;
            }

            showLoading('Sepete ekleniyor...');
            const response = await fetch('http://localhost:5000/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: image._id })
            });

            const data = await response.json();
            hideLoading();

            if (response.ok) {
                showToast('success', 'Ürün sepete eklendi!');
                bootstrapModal.hide();
            } else {
                showToast('error', data.message || 'Ürün sepete eklenirken bir hata oluştu.');
            }
        } catch (error) {
            hideLoading();
            console.error('Sepete ekleme hatası:', error);
            showToast('error', 'Ürün sepete eklenirken bir hata oluştu.');
        }
    };
}

// Resimleri yükle
async function loadImages(page = 1, filters = {}) {
    showLoading();
    try {
        // Filtreleri URL parametrelerine dönüştür
        const params = new URLSearchParams({
            page,
            limit: 12,
            ...filters
        });

        // API isteği için headers hazırla
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/api/products?${params}`, {
            headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Resimler yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        
        // Backend'den gelen veriyi kontrol et
        if (!Array.isArray(data)) {
            console.error('Beklenmeyen veri formatı:', data);
            throw new Error('Sunucudan beklenmeyen veri formatı alındı');
        }

        // Resimleri göster
        displayImages(data);
        
        // Şimdilik sayfalama devre dışı, backend pagination eklendiğinde aktif edilecek
        // setupPagination(data.totalPages, page);
        hideLoading();
    } catch (error) {
        console.error('Resim yükleme hatası:', error);
        showToast('error', error.message || 'Resimler yüklenirken bir hata oluştu');
        hideLoading();
    }
}

// Sayfalama
function setupPagination(totalPages, currentPage) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    // Önceki sayfa butonu
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = `
        <button class="page-link" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadImages(currentPage - 1, getFilters());
        }
    });
    pagination.appendChild(prevButton);

    // Sayfa numaraları
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `
            <button class="page-link">${i}</button>
        `;
        pageItem.addEventListener('click', () => {
            if (i !== currentPage) {
                loadImages(i, getFilters());
            }
        });
        pagination.appendChild(pageItem);
    }

    // Sonraki sayfa butonu
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = `
        <button class="page-link" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadImages(currentPage + 1, getFilters());
        }
    });
    pagination.appendChild(nextButton);
}

// getFilters fonksiyonunu sadeleştiriyoruz (kategori filtresi kaldırıldı)
function getFilters() {
    const filters = {};
    // Fiyat aralığı filtresi
    const minPrice = document.getElementById('minPrice')?.value;
    const maxPrice = document.getElementById('maxPrice')?.value;
    if (minPrice) filters.minPrice = minPrice;
    if (maxPrice) filters.maxPrice = maxPrice;
    // Sıralama
    const sort = document.getElementById('sortFilter')?.value;
    if (sort) filters.sort = sort;
    return filters;
}

// Sepete ekle
async function addToCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('warning', 'Sepete eklemek için giriş yapmanız gerekmektedir.');
            return;
        }

        showLoading('Ürün sepete ekleniyor...');
        const response = await fetch('http://localhost:5000/api/cart/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('success', 'Ürün sepete eklendi');
            localStorage.setItem('cartJustUpdated', '1');
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1000);
        } else {
            throw new Error(data.message || 'Ürün sepete eklenemedi');
        }
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        showToast('error', error.message || 'Ürün sepete eklenirken bir hata oluştu');
    } finally {
        hideLoading();
    }
}

// Toast mesajı göster
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Loading göster/gizle
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50';
    loading.style.zIndex = '9999';
    loading.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Yükleniyor...</span></div>';
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
}

// Event listener'ları ekle
function attachImageEventListeners() {
    // Detay butonları için event listener
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`http://localhost:5000/api/products/${productId}`);
                const image = await response.json();
                showImageDetails(image);
            } catch (error) {
                console.error('Ürün detayları alınırken hata:', error);
                alert('Ürün detayları alınamadı.');
            }
        });
    });

    // Sepete ekle butonları için event listener
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-id');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Sepete eklemek için giriş yapmanız gerekmektedir.');
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
                    alert(data.message || 'Ürün sepete eklenirken bir hata oluştu.');
                }
            } catch (error) {
                console.error('Sepete ekleme hatası:', error);
                alert('Ürün sepete eklenirken bir hata oluştu.');
            }
        });
    });

    // Profilim butonuna tıklanınca uyarı göster, yönlendirmeyi engelle
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
    }
}