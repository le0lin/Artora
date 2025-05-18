// Sayfa yüklendiğinde authentication kontrolü
(function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
})();

// Authentication Check
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Theme and Language Management
function initializeThemeAndLanguage() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const currentLang = localStorage.getItem('language') || 'tr';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('lang', currentLang);
    
    updateTranslations();
}

function updateTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    const currentLang = localStorage.getItem('language') || 'tr';
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            if (element.tagName === 'INPUT' && element.getAttribute('type') === 'text') {
                element.placeholder = translations[currentLang][key];
            } else {
                element.textContent = translations[currentLang][key];
            }
        }
    });

    // Update dynamic content
    updateProductFormTranslations();
}

function updateProductFormTranslations() {
    const currentLang = localStorage.getItem('language') || 'tr';
    
    // Update form labels
    document.querySelectorAll('label[data-i18n]').forEach(label => {
        const key = label.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            label.textContent = translations[currentLang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('input[data-i18n-placeholder], textarea[data-i18n-placeholder]').forEach(input => {
        const key = input.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            input.placeholder = translations[currentLang][key];
        }
    });

    // Update select options
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        const selectedValue = categorySelect.value;
        categorySelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = translations[currentLang].selectCategory || 'Kategori Seçin';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        categorySelect.appendChild(defaultOption);
        
        // Add all categories (including painting)
        const categories = ['digital', 'photography', 'illustration', 'painting', 'vector'];
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = translations[currentLang][`category_${category}`] || category;
            categorySelect.appendChild(option);
        });
        
        // Seçili değeri koru
        categorySelect.value = selectedValue;
    }

    // Update buttons
    document.querySelectorAll('button[data-i18n]').forEach(button => {
        const key = button.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            button.textContent = translations[currentLang][key];
        }
    });
}

// Event Listeners for Theme and Language
document.addEventListener('DOMContentLoaded', () => {
    // Önce authentication kontrolü yap
    if (!checkAuth()) return;

    initializeThemeAndLanguage();
    
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
    
    // Language switcher
    const langSwitcher = document.getElementById('lang-switcher');
    if (langSwitcher) {
        langSwitcher.addEventListener('click', () => {
            const currentLang = document.documentElement.getAttribute('lang');
            const newLang = currentLang === 'tr' ? 'en' : 'tr';
            
            document.documentElement.setAttribute('lang', newLang);
            localStorage.setItem('language', newLang);
            
            updateTranslations();
            
            // Update language text
            langSwitcher.textContent = newLang.toUpperCase();
        });
    }
});

// Update form submission messages
function showSuccessMessage(message) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const successMessage = document.createElement('div');
    successMessage.className = 'alert alert-success';
    successMessage.textContent = translations[currentLang][message] || message;
    document.querySelector('.form-container').prepend(successMessage);
    setTimeout(() => successMessage.remove(), 3000);
}

function showErrorMessage(error) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const errorMessage = document.createElement('div');
    errorMessage.className = 'alert alert-danger';
    errorMessage.textContent = translations[currentLang][error] || error;
    document.querySelector('.form-container').prepend(errorMessage);
    setTimeout(() => errorMessage.remove(), 3000);
}

// Update preview functionality
function updatePreviewText() {
    const currentLang = localStorage.getItem('language') || 'tr';
    const previewText = document.querySelector('.preview-text');
    if (previewText) {
        previewText.textContent = translations[currentLang].dragAndDrop;
    }
}

// Tema yönetimi
function initializeTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Toast mesajı göster
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.style.zIndex = '9999';
    
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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Tema ayarla
    initializeTheme();

    // Form elementlerini seç
    const uploadForm = document.getElementById('uploadForm');
    const imageInput = document.getElementById('imageInput');
    const dropZone = document.getElementById('dropZone');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');

    if (!uploadForm || !imageInput || !dropZone || !imagePreview || !previewImage) {
        console.error('Gerekli form elementleri bulunamadı!');
        return;
    }

    // Resim seçme ve önizleme
    function handleImageSelect(file) {
        // Dosya tipi kontrolü
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Lütfen geçerli bir resim dosyası seçin');
            return;
        }

        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'Resim boyutu 5MB\'dan küçük olmalıdır');
            return;
        }

        // Resmi önizle
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
            dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Input'a dosyayı ata
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
    }

    // Drag & Drop olayları
    dropZone.addEventListener('click', () => imageInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0d6efd';
        dropZone.style.background = 'rgba(13, 110, 253, 0.1)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#6c757d';
        dropZone.style.background = 'rgba(108, 117, 125, 0.1)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#6c757d';
        dropZone.style.background = 'rgba(108, 117, 125, 0.1)';
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleImageSelect(file);
        }
    });

    // Dosya seçme olayı
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageSelect(file);
        }
    });

    // Form gönderimi
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Lütfen önce giriş yapın');
            return;
        }

        // Form verilerini al
        const formData = new FormData();
        const imageFile = imageInput.files[0];
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        const priceInput = document.getElementById('price');
        const personalLicenseInput = document.getElementById('personalLicense');
        const commercialLicenseInput = document.getElementById('commercialLicense');

        if (!titleInput || !descriptionInput || !priceInput || !personalLicenseInput || !commercialLicenseInput) {
            showToast('error', 'Formda eksik alan(lar) var. Lütfen sayfayı yenileyin.');
            return;
        }

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const price = priceInput.value;
        const personalLicense = personalLicenseInput.checked;
        const commercialLicense = commercialLicenseInput.checked;

        // Validasyon
        if (!imageFile) {
            showToast('error', 'Lütfen bir resim seçin');
            return;
        }
        if (!title) {
            showToast('error', 'Lütfen bir başlık girin');
            return;
        }
        if (!description) {
            showToast('error', 'Lütfen bir açıklama girin');
            return;
        }
        if (!price || price <= 0) {
            showToast('error', 'Lütfen geçerli bir fiyat girin');
            return;
        }

        // Form verilerini hazırla
        formData.append('image', imageFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('licenses[personal]', personalLicense);
        formData.append('licenses[commercial]', commercialLicense);

        // Submit butonunu devre dışı bırak
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';

        try {
            showLoading();
            
            // API isteği
            const response = await fetch('http://localhost:5000/api/products/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Resim yüklenirken bir hata oluştu');
            }

            showToast('success', 'Resim başarıyla yüklendi');
            setTimeout(() => {
                window.location.href = 'resim_galeri.html';
            }, 1000);

        } catch (error) {
            console.error('Yükleme hatası:', error);
            showToast('error', error.message);
        } finally {
            hideLoading();
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
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