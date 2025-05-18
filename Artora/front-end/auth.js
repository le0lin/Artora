// Kullanıcı oturum durumunu kontrol et ve menüyü güncelle
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userDropdown = document.getElementById('userDropdown');
    const loginSection = document.getElementById('loginSection');
    const uploadButton = document.getElementById('uploadButton');
    const loginPrompt = document.getElementById('loginPrompt');

    if (!userDropdown || !loginSection) return;

    if (token) {
        try {
            const response = await fetch('http://localhost:5000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token geçersiz');
            }

            const user = await response.json();
            updateUI(user);
        } catch (error) {
            console.error('Oturum kontrolü hatası:', error);
            resetAuthUI();
        }
    } else {
        resetAuthUI();
    }
}

// UI'ı güncelle
function updateUI(user) {
    const userDropdown = document.getElementById('userDropdown');
    const loginSection = document.getElementById('loginSection');
    const uploadButton = document.getElementById('uploadButton');
    const loginPrompt = document.getElementById('loginPrompt');
    const userNameElement = userDropdown.querySelector('.user-name');

    if (userNameElement) {
        userNameElement.textContent = `${user.name} ${user.surname}`;
    }

    updateProfilePhoto(user.profilePhoto);

    userDropdown.style.display = 'block';
    loginSection.style.display = 'none';

    if (uploadButton && loginPrompt) {
        uploadButton.style.display = 'inline-block';
        loginPrompt.style.display = 'none';
    }

    // Profil sayfasındaysa profil bilgilerini güncelle
    if (window.location.pathname.includes('profil.html')) {
        updateProfileInfo(user);
        loadUserImages();
    }
}

// UI'ı sıfırla
function resetAuthUI() {
    const userDropdown = document.getElementById('userDropdown');
    const loginSection = document.getElementById('loginSection');
    const uploadButton = document.getElementById('uploadButton');
    const loginPrompt = document.getElementById('loginPrompt');

    localStorage.removeItem('token');

    if (userDropdown) userDropdown.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';
    if (uploadButton) uploadButton.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
}

// Kayıt ol
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    
    const name = document.getElementById('registerName').value;
    const surname = document.getElementById('registerSurname').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const terms = document.getElementById('terms').checked;

    if (!terms) {
        showToast('error', 'Lütfen kullanım koşullarını kabul edin');
        return;
    }

    if (password !== confirmPassword) {
        showToast('error', 'Şifreler eşleşmiyor');
        return;
    }

    if (checkPasswordStrength(password) < 2) {
        showToast('error', 'Lütfen daha güçlü bir şifre seçin');
        return;
    }

    // Submit butonunu devre dışı bırak ve loading göster
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Kayıt yapılıyor...';

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                surname,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Kayıt işlemi başarısız oldu');
        }

        localStorage.setItem('token', data.token);
        showToast('success', 'Kayıt başarılı!');
        
        // Modal'ı kapat
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) {
            authModal.hide();
        }

        // Formu temizle ve validasyon sınıfını kaldır
        form.reset();
        form.classList.remove('was-validated');
        
        // UI'ı güncelle
        checkAuthStatus();
    } catch (error) {
        console.error('Kayıt hatası:', error);
        showToast('error', error.message);
    } finally {
        // Submit butonunu eski haline getir
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Loading göstergesi
let loadingModalInstance = null;

function showLoading(message = 'Yükleniyor...') {
    let loadingModal = document.getElementById('loadingModal');
    
    if (!loadingModal) {
        loadingModal = document.createElement('div');
        loadingModal.id = 'loadingModal';
        loadingModal.className = 'modal fade';
        loadingModal.setAttribute('data-bs-backdrop', 'static');
        loadingModal.setAttribute('data-bs-keyboard', 'false');
        loadingModal.setAttribute('tabindex', '-1');
        
        loadingModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light">
                    <div class="modal-body text-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Yükleniyor...</span>
                        </div>
                        <p class="loading-text mb-0">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingModal);
    } else {
        const loadingText = loadingModal.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
    
    if (!loadingModalInstance) {
        loadingModalInstance = new bootstrap.Modal(loadingModal, {
            backdrop: 'static',
            keyboard: false
        });
    }
    loadingModalInstance.show();
}

function hideLoading() {
    if (loadingModalInstance) {
        loadingModalInstance.hide();
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            loadingModal.addEventListener('hidden.bs.modal', () => {
                loadingModal.remove();
                loadingModalInstance = null;
            }, { once: true });
        }
    }
}

// Giriş yap
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Submit butonunu devre dışı bırak ve loading göster
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Giriş yapılıyor...';

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Giriş işlemi başarısız oldu');
        }

        localStorage.setItem('token', data.token);
        showToast('success', 'Giriş başarılı!');
        
        // Modal'ı kapat
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) {
            authModal.hide();
        }

        // Formu temizle
        e.target.reset();
        
        // UI'ı güncelle
        checkAuthStatus();
    } catch (error) {
        console.error('Giriş hatası:', error);
        showToast('error', error.message);
    } finally {
        // Submit butonunu eski haline getir
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Çıkış yap
function handleLogout() {
    resetAuthUI();
    showToast('info', 'Çıkış yapıldı');
}

// Şifre gücü kontrolü
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Uzunluk kontrolü
    if (password.length >= 8) strength++;
    
    // Büyük harf kontrolü
    if (/[A-Z]/.test(password)) strength++;
    
    // Küçük harf kontrolü
    if (/[a-z]/.test(password)) strength++;
    
    // Sayı kontrolü
    if (/[0-9]/.test(password)) strength++;
    
    // Özel karakter kontrolü
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// Şifre gücü göstergesini güncelle
function updateStrengthIndicator(strength) {
    const strengthIndicator = document.getElementById('passwordStrength');
    if (!strengthIndicator) return;

    const strengthTexts = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
    const strengthColors = ['#ff4444', '#ffbb33', '#ffeb3b', '#00C851', '#007E33'];
    
    strengthIndicator.textContent = strengthTexts[strength - 1] || 'Şifre Girin';
    strengthIndicator.style.color = strengthColors[strength - 1] || '#666';
}

// Toast mesajı göster
function showToast(type, message) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Toast container oluştur
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

// Form event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Bootstrap form validasyonunu aktifleştir
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Giriş formu
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Kayıt formu
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Şifre gücü göstergesi
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => {
                const strength = checkPasswordStrength(e.target.value);
                updateStrengthIndicator(strength);
            });
        }

        // Şifre eşleşme kontrolü
        const confirmPassword = document.getElementById('registerConfirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                const password = document.getElementById('registerPassword').value;
                if (confirmPassword.value !== password) {
                    confirmPassword.setCustomValidity('Şifreler eşleşmiyor');
                } else {
                    confirmPassword.setCustomValidity('');
                }
            });
        }
    }

    // Çıkış butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sayfa yüklendiğinde oturum durumunu kontrol et
    checkAuthStatus();
});

// Profil bilgilerini güncelle
function updateProfileInfo(user) {
    // Ana profil bilgileri
    const userFullName = document.getElementById('userFullName');
    const userEmail = document.getElementById('userEmail');
    if (userFullName) userFullName.textContent = `${user.name} ${user.surname}`;
    if (userEmail) userEmail.textContent = user.email;

    // Form alanları
    const profileName = document.getElementById('profileName');
    const profileSurname = document.getElementById('profileSurname');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');

    if (profileName) profileName.value = user.name;
    if (profileSurname) profileSurname.value = user.surname;
    if (profileEmail) profileEmail.value = user.email;
    if (profilePhone) profilePhone.value = user.phone || '';

    // Profil fotoğrafı
    updateProfilePhoto(user.profilePhoto);
}

// Profil fotoğrafını güncelle
function updateProfilePhoto(photoUrl = null) {
    const profileImg = document.getElementById('profileImg');
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    
    // Get user name for default avatar
    let userName = '';
    const userFullNameElement = document.querySelector('#userFullName');
    const userNameElement = document.querySelector('.user-name');
    
    if (userFullNameElement && userFullNameElement.textContent) {
        userName = userFullNameElement.textContent;
    } else if (userNameElement && userNameElement.textContent) {
        userName = userNameElement.textContent;
    } else {
        userName = 'User';
    }
    
    // Clean up username for UI Avatars
    userName = userName.trim().replace(/\s+/g, '+');
    
    // Generate default avatar URL with Artora's purple color
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${userName}&background=7952B3&color=fff&size=150`;
    
    // Update profile image
    if (profileImg) {
        profileImg.src = photoUrl || defaultAvatarUrl;
        profileImg.onerror = function() {
            this.src = defaultAvatarUrl;
        };
    }
    
    // Update sidebar avatar
    if (sidebarAvatar) {
        const avatarHtml = photoUrl 
            ? `<img src="${photoUrl}" alt="Profil" class="user-avatar" onerror="this.src='${defaultAvatarUrl}'">` 
            : `<img src="${defaultAvatarUrl}" alt="Profil" class="user-avatar">`;
        sidebarAvatar.innerHTML = avatarHtml;
    }
}

// Kullanıcı resimlerini yükle
async function loadUserImages() {
    try {
        showLoading('Resimler yükleniyor...');
        
        // Get images for sale
        const forSaleResponse = await fetch('http://localhost:5000/api/user/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        // Get purchased images
        const purchasedResponse = await fetch('http://localhost:5000/api/user/purchases', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!forSaleResponse.ok || !purchasedResponse.ok) {
            throw new Error('Resimler yüklenirken hata oluştu');
        }

        const forSaleData = await forSaleResponse.json();
        const purchasedData = await purchasedResponse.json();

        // İstatistikleri güncelle
        updateStats(forSaleData.length, purchasedData.length);

        // Resimleri göster
        displayImages('forSaleImages', forSaleData);
        displayImages('purchasedImages', purchasedData);
    } catch (error) {
        console.error('Resim yükleme hatası:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// İstatistikleri güncelle
function updateStats(uploadedCount = 0, purchasedCount = 0) {
    const uploadedCountElement = document.getElementById('uploadedCount');
    const purchasedCountElement = document.getElementById('purchasedCount');
    
    if (uploadedCountElement) uploadedCountElement.textContent = uploadedCount;
    if (purchasedCountElement) purchasedCountElement.textContent = purchasedCount;
}

// Resimleri görüntüle
function displayImages(containerId, images) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (images.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <p>Henüz resim yok</p>
                ${containerId === 'forSaleImages' ? 
                    '<a href="urunekle.html" class="btn btn-primary">Yeni Resim Ekle</a>' : 
                    '<a href="resim_galeri.html" class="btn btn-primary">Resim Galerisine Git</a>'}
            </div>
        `;
        return;
    }

    const imageGrid = document.createElement('div');
    imageGrid.className = 'image-grid';

    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${image.imageUrl}" alt="${image.title}" loading="lazy">
                ${containerId === 'forSaleImages' ? `
                    <div class="image-overlay">
                        <button class="btn btn-sm btn-light me-2" onclick="editImage('${image._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteImage('${image._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="image-info">
                <h5 class="image-title">${image.title}</h5>
                <p class="image-price">${image.price} ₺</p>
                <div class="image-actions">
                    ${containerId === 'forSaleImages' ? `
                        <button class="btn-action btn-edit" onclick="editImage('${image._id}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteImage('${image._id}')">
                            <i class="fas fa-trash"></i> Kaldır
                        </button>
                    ` : `
                        <button class="btn-action btn-download" onclick="downloadImage('${image._id}')">
                            <i class="fas fa-download"></i> İndir
                        </button>
                    `}
                </div>
            </div>
        `;
        imageGrid.appendChild(card);
    });

    container.appendChild(imageGrid);
}

// Resim düzenleme fonksiyonu
async function editImage(imageId) {
    try {
        showLoading('Resim bilgileri yükleniyor...');
        
        // Resim bilgilerini getir
        const response = await fetch(`http://localhost:5000/api/products/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Resim bilgileri alınamadı');
        }

        const image = await response.json();

        // Düzenleme modalını oluştur ve göster
        const modalHtml = `
            <div class="modal fade" id="editImageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Resmi Düzenle</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editImageForm">
                                <div class="mb-3">
                                    <label class="form-label">Resim Başlığı</label>
                                    <input type="text" class="form-control" id="editTitle" value="${image.title || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Açıklama</label>
                                    <textarea class="form-control" id="editDescription" rows="3">${image.description || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Fiyat (₺)</label>
                                    <input type="number" class="form-control" id="editPrice" value="${image.price || 0}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Kategoriler</label>
                                    <input type="text" class="form-control" id="editCategories" value="${image.category || ''}" placeholder="Kategorileri virgülle ayırın">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Etiketler</label>
                                    <input type="text" class="form-control" id="editTags" value="${(image.tags || []).join(', ')}" placeholder="Etiketleri virgülle ayırın">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                            <button type="button" class="btn btn-primary" onclick="saveImageEdit('${imageId}')">Kaydet</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Varsa eski modalı kaldır
        const oldModal = document.getElementById('editImageModal');
        if (oldModal) {
            oldModal.remove();
        }

        // Yeni modalı ekle ve göster
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editImageModal'));
        modal.show();

    } catch (error) {
        console.error('Düzenleme hatası:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// Resim düzenleme kaydetme fonksiyonu
async function saveImageEdit(imageId) {
    try {
        showLoading('Değişiklikler kaydediliyor...');

        const formData = {
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            price: parseFloat(document.getElementById('editPrice').value),
            category: document.getElementById('editCategories').value,
            tags: document.getElementById('editTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        const response = await fetch(`http://localhost:5000/api/products/${imageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Değişiklikler kaydedilemedi');
        }

        // Modalı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('editImageModal'));
        modal.hide();

        // Resimleri yeniden yükle
        await loadUserImages();

        alert('Değişiklikler başarıyla kaydedildi!');
    } catch (error) {
        console.error('Kaydetme hatası:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// Profil bilgilerini güncelle
async function updateProfile(e) {
    e.preventDefault();
    
    try {
        showLoading('Profil güncelleniyor...');
        
        const formData = {
            name: document.getElementById('profileName').value,
            surname: document.getElementById('profileSurname').value
        };

        const response = await fetch('http://localhost:5000/api/user/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Profil güncellenirken bir hata oluştu');

        // UI'ı güncelle
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = `${formData.name} ${formData.surname}`;
        }

        const userFullName = document.getElementById('userFullName');
        if (userFullName) {
            userFullName.textContent = `${formData.name} ${formData.surname}`;
        }

        alert('Profil başarıyla güncellendi!');
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// Profil fotoğrafı yükleme ve kaldırma işlemleri
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('photoInput');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadProfilePhoto(file);
            }
        });
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', removeProfilePhoto);
    }
});

// Profil fotoğrafı yükleme fonksiyonu
async function uploadProfilePhoto(file) {
    try {
        showLoading('Fotoğraf yükleniyor...');
        
        // Dosya tipi kontrolü
        if (!file.type.startsWith('image/')) {
            hideLoading();
            alert('Lütfen geçerli bir resim dosyası seçin.');
            return;
        }

        // Dosya boyutu kontrolü (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            hideLoading();
            alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch('http://localhost:5000/api/user/profile-photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Fotoğraf yüklenemedi');
        }

        const data = await response.json();
        updateProfilePhoto(data.photoUrl);
        hideLoading();
        alert('Profil fotoğrafı başarıyla güncellendi.');
    } catch (error) {
        console.error('Profil fotoğrafı yükleme hatası:', error);
        hideLoading();
        alert('Profil fotoğrafı yüklenirken bir hata oluştu.');
    }
}

// Token alma fonksiyonu
function getToken() {
    return localStorage.getItem('token');
}

// Profil fotoğrafı kaldırma fonksiyonu
async function removeProfilePhoto() {
    try {
        showLoading('Fotoğraf kaldırılıyor...');

        const response = await fetch('http://localhost:5000/api/user/profile-photo', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Fotoğraf kaldırılamadı');
        }

        updateProfilePhoto(null); // Varsayılan avatar'a dön
        hideLoading();
        alert('Profil fotoğrafı başarıyla kaldırıldı.');
    } catch (error) {
        console.error('Profil fotoğrafı kaldırma hatası:', error);
        hideLoading();
        alert('Profil fotoğrafı kaldırılırken bir hata oluştu.');
    }
}

// Şifre değiştirme
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Şifre validasyonu
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Yeni şifreler eşleşmiyor!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Yeni şifre en az 6 karakter olmalıdır!');
        return;
    }

    try {
        showLoading('Şifre değiştiriliyor...');
        const response = await fetch('http://localhost:5000/api/user/change-password', {
            method: 'PUT',
                    headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ 
                currentPassword,
                newPassword
                    })
                });

                const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Şifre değiştirme işlemi başarısız oldu');

        // Şifre değiştirme başarılı
        alert('Şifreniz başarıyla değiştirildi!');
        
        // Modalı kapat ve formu temizle
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        if (modal) {
            modal.hide();
        }
        document.getElementById('changePasswordForm').reset();

    } catch (error) {
        console.error('Şifre değiştirme hatası:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// Resim silme
async function deleteImage(imageId) {
    if (!confirm('Bu resmi satıştan kaldırmak istediğinize emin misiniz?')) return;

    try {
        showLoading('Resim kaldırılıyor...');
        const response = await fetch(`http://localhost:5000/api/products/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Resim kaldırılamadı');

        // Reload images
        await loadUserImages();
    } catch (error) {
        console.error('Resim silme hatası:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Resim indirme
async function downloadImage(imageId) {
    try {
        showLoading('Resim indiriliyor...');
        const response = await fetch(`http://localhost:5000/api/products/${imageId}/download`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Resim indirilemiyor');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image-${imageId}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
            } catch (error) {
        console.error('Resim indirme hatası:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Favorileri yükle
async function loadFavorites() {
    try {
        showLoading('Favoriler yükleniyor...');
        
        const response = await fetch('http://localhost:5000/api/user/favorites', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Favoriler yüklenemedi');
        }

        const favorites = await response.json();
        
        // Favori sayısını güncelle
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            favoritesCount.textContent = favorites.length || '0';
        }

        // Favori resimleri göster
        const favoritesContainer = document.getElementById('favoritesContainer');
        if (favoritesContainer) {
            displayImages('favoritesContainer', favorites);
        }

        return favorites;
    } catch (error) {
        console.error('Favoriler yüklenirken hata:', error);
        // Hata durumunda favori sayısını 0 olarak göster
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            favoritesCount.textContent = '0';
        }
    } finally {
        hideLoading();
    }
}

// Password visibility toggle
document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Update user info in UI
function updateUserInfo(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = `${user.name} ${user.surname}`;
    }
    
    if (userAvatarElement) {
        if (user.profilePhoto) {
            userAvatarElement.src = user.profilePhoto;
        } else {
            // Kullanıcının baş harflerini avatar olarak kullan
            const initials = `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase();
            userAvatarElement.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%237952B3"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="16" font-family="Arial">${initials}</text></svg>`;
        }
    }
}

// Alert gösterme fonksiyonu
function showCustomAlert(title, message, type = 'info', duration = 3000) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertContainer.style.zIndex = '9999';
    
    alertContainer.innerHTML = `
        <strong>${title}</strong><br>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertContainer);
        bsAlert.close();
    }, duration);
} 