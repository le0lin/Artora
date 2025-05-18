// satin_aldiklarim.js
// Satın alınan ürünleri getir ve ekrana bas

document.addEventListener('DOMContentLoaded', async function() {
    // Giriş kontrolü: Eğer token yoksa kullanıcıyı ana sayfaya yönlendir
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    const purchasesContainer = document.getElementById('purchasesContainer');
    const backendUrl = "http://localhost:5000";
    try {
        const res = await fetch('http://localhost:5000/api/user/purchases', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const orders = await res.json();
        if (!Array.isArray(orders) || orders.length === 0) {
            purchasesContainer.innerHTML = '<div class="alert alert-info text-center">Henüz hiç resim satın almadınız.</div>';
            return;
        }
        purchasesContainer.innerHTML = '';
        // Her siparişteki ürünleri sırayla göster
        orders.forEach(order => {
            if (!order.items || order.items.length === 0) return;
            order.items.forEach(item => {
                const product = item.product;
                if (!product) return;
                purchasesContainer.innerHTML += `
                    <div class="col-md-4 col-lg-3">
                        <div class="card bg-dark text-light h-100 shadow-sm">
                            <img src="${backendUrl + product.imageUrl}" class="card-img-top" alt="${product.title}">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${product.title}</h5>
                                <p class="card-text mb-2">${product.description || ''}</p>
                                <div class="mt-auto">
                                    <button class="btn btn-success w-100" onclick="downloadProduct('${product._id}')">
                                        <i class="fas fa-download me-2"></i>Resmi İndir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
    } catch (err) {
        purchasesContainer.innerHTML = '<div class="alert alert-danger text-center">Satın aldıklarınız yüklenirken bir hata oluştu.</div>';
    }
});

// Güvenli indirme fonksiyonu (token ile fetch)
function downloadProduct(productId) {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/products/${productId}/download`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => {
        if (!response.ok) throw new Error('İndirme yetkiniz yok veya dosya bulunamadı.');
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'resim.jpg';
        if (disposition && disposition.indexOf('filename=') !== -1) {
            filename = disposition.split('filename=')[1].replace(/\"/g, '').trim();
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
