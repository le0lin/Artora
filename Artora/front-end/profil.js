document.addEventListener('DOMContentLoaded', async function() {
    // API base URL
    const API_BASE_URL = 'http://localhost:5000';

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize elements
    const profileImg = document.getElementById('profileImg');
    const sidebarProfileImg = document.getElementById('sidebarProfileImg');
    const userFullName = document.getElementById('userFullName');
    const userEmail = document.getElementById('userEmail');
    const sidebarUserName = document.querySelector('.user-name');
    const profileName = document.getElementById('profileName');
    const profileSurname = document.getElementById('profileSurname');
    const profileEmail = document.getElementById('profileEmail');
    const uploadedCount = document.getElementById('uploadedCount');
    const purchasedCount = document.getElementById('purchasedCount');
    const favoritesCount = document.getElementById('favoritesCount');
    const forSaleImages = document.getElementById('forSaleImages');
    const purchasedImages = document.getElementById('purchasedImages');
    const favoriteImages = document.getElementById('favoriteImages');

    // Load user profile
    async function loadUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                    return;
                }
                throw new Error('Failed to load profile');
            }

            const userData = await response.json();
            
            // Update profile information
            userFullName.textContent = `${userData.name} ${userData.surname}`;
            userEmail.textContent = userData.email;
            sidebarUserName.textContent = `${userData.name} ${userData.surname}`;
            profileName.value = userData.name;
            profileSurname.value = userData.surname;
            profileEmail.value = userData.email;

            // Update profile photos
            if (userData.profilePhoto) {
                profileImg.src = `${API_BASE_URL}/uploads/${userData.profilePhoto}`;
                sidebarProfileImg.src = `${API_BASE_URL}/uploads/${userData.profilePhoto}`;
            } else {
                profileImg.src = 'img/default-profile.png';
                sidebarProfileImg.src = 'img/default-profile.png';
            }
        } catch (error) {
            console.error('Profile load error:', error);
            showMessage('error', 'Profil bilgileri yüklenirken bir hata oluştu');
        }
    }

    // Load user statistics
    async function loadUserStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load stats');

            const stats = await response.json();
            
            uploadedCount.textContent = stats.forSaleCount || 0;
            purchasedCount.textContent = stats.purchasedCount || 0;
            favoritesCount.textContent = stats.favoritesCount || 0;
        } catch (error) {
            console.error('Stats load error:', error);
            showMessage('error', 'İstatistikler yüklenirken bir hata oluştu');
        }
    }

    // Load user images
    async function loadUserImages() {
        try {
            // Show loading states
            forSaleImages.innerHTML = createLoadingState();
            purchasedImages.innerHTML = createLoadingState();
            favoriteImages.innerHTML = createLoadingState();

            const [forSaleResponse, purchasedResponse, favoriteResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/user/products`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/user/purchases`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/user/favorites`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!forSaleResponse.ok || !purchasedResponse.ok || !favoriteResponse.ok) {
                throw new Error('Failed to load images');
            }

            const [forSaleData, purchasedData, favoritesData] = await Promise.all([
                forSaleResponse.json(),
                purchasedResponse.json(),
                favoriteResponse.json()
            ]);

            // Display for sale images
            forSaleImages.innerHTML = forSaleData.length ? 
                forSaleData.map(image => createImageCard(image, 'sale')).join('') :
                createEmptyState('Henüz satışta resminiz bulunmuyor', 'Yeni resim eklemek için "Yeni Resim Ekle" butonunu kullanın');

            // Display purchased images
            purchasedImages.innerHTML = purchasedData.length ?
                purchasedData.map(image => createImageCard(image, 'purchased')).join('') :
                createEmptyState('Henüz satın aldığınız resim bulunmuyor', 'Resim Galerisini ziyaret ederek resim satın alabilirsiniz');

            // Display favorite images
            favoriteImages.innerHTML = favoritesData.length ?
                favoritesData.map(image => createImageCard(image, 'favorite')).join('') :
                createEmptyState('Henüz favori resminiz bulunmuyor', 'Resim Galerisinden beğendiğiniz resimleri favorilerinize ekleyebilirsiniz');

        } catch (error) {
            console.error('Images load error:', error);
            showMessage('error', 'Resimler yüklenirken bir hata oluştu');
            
            // Show error states
            forSaleImages.innerHTML = createErrorState('Resimler yüklenirken bir hata oluştu');
            purchasedImages.innerHTML = createErrorState('Resimler yüklenirken bir hata oluştu');
            favoriteImages.innerHTML = createErrorState('Resimler yüklenirken bir hata oluştu');
        }
    }

    // Create loading state
    function createLoadingState() {
        return `
            <div class="loading-state">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <p>Resimler yükleniyor...</p>
            </div>
        `;
    }

    // Create error state
    function createErrorState(message) {
        return `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h4>Hata</h4>
                <p>${message}</p>
                <button onclick="loadUserImages()" class="btn btn-primary">
                    <i class="fas fa-sync"></i> Tekrar Dene
                </button>
            </div>
        `;
    }

    // Create image card
    function createImageCard(image, type) {
        const imageUrl = image.imageUrl || `${API_BASE_URL}/uploads/${image.filename}`;
        return `
            <div class="image-card">
                <div class="image-preview">
                    <img src="${imageUrl}" alt="${image.title}" loading="lazy">
                    <div class="image-overlay">
                        <div class="image-actions">
                            ${getImageActions(image, type)}
                        </div>
                    </div>
                </div>
                <div class="image-info">
                    <h5 class="image-title">${image.title}</h5>
                    <div class="image-price">₺${image.price.toFixed(2)}</div>
                    <div class="image-stats">
                        <span><i class="fas fa-eye"></i> ${image.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${image.likes || 0}</span>
                        <span><i class="fas fa-download"></i> ${image.downloads || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Get image actions based on type
    function getImageActions(image, type) {
        switch (type) {
            case 'sale':
                return `
                    <button onclick="editImage('${image._id}')" class="btn-action btn-edit">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button onclick="deleteImage('${image._id}')" class="btn-action btn-delete">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                `;
            case 'purchased':
                return `
                    <button onclick="downloadImage('${image._id}')" class="btn-action btn-download">
                        <i class="fas fa-download"></i> İndir
                    </button>
                `;
            case 'favorite':
                return `
                    <button onclick="viewImage('${image._id}')" class="btn-action btn-view">
                        <i class="fas fa-eye"></i> Görüntüle
                    </button>
                    <button onclick="removeFavorite('${image._id}')" class="btn-action btn-remove">
                        <i class="fas fa-heart-broken"></i> Favorilerden Çıkar
                    </button>
                `;
            default:
                return '';
        }
    }

    // Create empty state
    function createEmptyState(title, message) {
        return `
            <div class="empty-state">
                <i class="fas fa-image"></i>
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
    }

    // Show message
    function showMessage(type, message) {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
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
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Image actions
    window.editImage = async function(imageId) {
        window.location.href = `urunekle.html?edit=${imageId}`;
    };

    window.deleteImage = async function(imageId) {
        if (!confirm('Bu resmi silmek istediğinizden emin misiniz?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete image');

            loadUserImages();
            loadUserStats();
            showMessage('success', 'Resim başarıyla silindi');
        } catch (error) {
            console.error('Image delete error:', error);
            showMessage('error', 'Resim silinirken bir hata oluştu');
        }
    };

    window.downloadImage = async function(imageId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/images/${imageId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to download image');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'image.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showMessage('success', 'Resim indirme başladı');
        } catch (error) {
            console.error('Image download error:', error);
            showMessage('error', 'Resim indirilirken bir hata oluştu');
        }
    };

    window.viewImage = async function(imageId) {
        window.location.href = `resim_galeri.html?view=${imageId}`;
    };

    window.removeFavorite = async function(imageId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/favorites/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to remove from favorites');

            loadUserImages();
            loadUserStats();
            showMessage('success', 'Resim favorilerden kaldırıldı');
        } catch (error) {
            console.error('Remove favorite error:', error);
            showMessage('error', 'Resim favorilerden kaldırılırken bir hata oluştu');
        }
    };

    // Event Listeners
    document.getElementById('photoInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile/photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload photo');

            const result = await response.json();
            profileImg.src = `${API_BASE_URL}/uploads/${result.filename}`;
            sidebarProfileImg.src = `${API_BASE_URL}/uploads/${result.filename}`;
            showMessage('success', 'Profil fotoğrafı başarıyla güncellendi');
        } catch (error) {
            console.error('Photo upload error:', error);
            showMessage('error', 'Fotoğraf yüklenirken bir hata oluştu');
        }
    });

    document.getElementById('removePhotoBtn').addEventListener('click', async () => {
        if (!confirm('Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile/photo`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to remove photo');

            profileImg.src = 'img/default-profile.png';
            sidebarProfileImg.src = 'img/default-profile.png';
            showMessage('success', 'Profil fotoğrafı kaldırıldı');
        } catch (error) {
            console.error('Photo remove error:', error);
            showMessage('error', 'Fotoğraf kaldırılırken bir hata oluştu');
        }
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: profileName.value,
            surname: profileSurname.value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update profile');

            userFullName.textContent = `${formData.name} ${formData.surname}`;
            sidebarUserName.textContent = `${formData.name} ${formData.surname}`;
            showMessage('success', 'Profil bilgileri güncellendi');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
        } catch (error) {
            console.error('Profile update error:', error);
            showMessage('error', 'Profil güncellenirken bir hata oluştu');
        }
    });

    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showMessage('error', 'Yeni şifreler eşleşmiyor');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showMessage('error', 'Mevcut şifre yanlış');
                    return;
                }
                throw new Error('Failed to change password');
            }

            showMessage('success', 'Şifreniz başarıyla değiştirildi');
            document.getElementById('changePasswordForm').reset();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
        } catch (error) {
            console.error('Password change error:', error);
            showMessage('error', 'Şifre değiştirilirken bir hata oluştu');
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    });

    // Initialize
    loadUserProfile();
    loadUserStats();
    loadUserImages();
});

// Profilim uyarısı
const alert = document.getElementById('profilimAlert');
if(alert) {
    alert.classList.remove('d-none');
}
// Kullanıcı adını göster (index.html ile aynı şekilde)
const userNameElem = document.querySelector('.user-name');
let user = null;
try {
    user = JSON.parse(localStorage.getItem('user'));
} catch {}
if(user && user.firstName && user.lastName) {
    userNameElem.textContent = user.firstName + ' ' + user.lastName;
} else if(user && user.fullName) {
    userNameElem.textContent = user.fullName;
} else if(user && user.username) {
    userNameElem.textContent = user.username;
} else {
    userNameElem.textContent = 'Kullanıcı';
}