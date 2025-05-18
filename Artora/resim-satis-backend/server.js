const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Cart, Order } = require('./database');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const JWT_SECRET = 'gizliAnahtar'; // Güvenlik için .env dosyasına taşıyın

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Sadece resim dosyaları yüklenebilir'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Token doğrulama middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Geçersiz token' });
    }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Kullanıcı bulunamadı' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Şifre yanlış' });
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Giriş işlemi başarısız oldu' });
    }
});

// Kullanıcı profilini döndüren endpoint (token ile erişim)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            name: user.name,
            surname: user.surname,
            email: user.email,
            profilePhoto: user.profilePhoto || null
        });
    } catch (error) {
        res.status(500).json({ error: 'Profil bilgisi alınamadı' });
    }
});

// Kullanıcının satın aldığı ürünleri getir
app.get('/api/user/purchases', authenticateToken, async (req, res) => {
    try {
        // Kullanıcının siparişlerini bul ve ürünleri populate et
        const orders = await require('./database').Order.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product');
        res.json(orders);
    } catch (error) {
        console.error('Satın alınanlar getirilemedi:', error);
        res.status(500).json({ message: 'Satın aldıklarınız yüklenemedi' });
    }
});

// Order Routes
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Sepet boş' });
        }

        // Sadece geçerli ürünleri al
        const validItems = cart.items.filter(item => item.product);
        if (validItems.length === 0) {
            return res.status(400).json({ message: 'Sepetinizde geçerli ürün yok.' });
        }

        const orderItems = validItems.map(item => ({
            product: item.product._id,
            quantity: item.quantity || 1, // fallback: quantity yoksa 1
            price: item.product.price
        }));

        const totalAmount = validItems.reduce((total, item) => {
            return total + (item.product.price * (item.quantity || 1));
        }, 0);

        const order = await Order.create({
            userId: req.user._id,
            items: orderItems,
            totalAmount
        });

        // Sepeti temizle (VersionError hatası için updateOne ile)
        await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } });

        res.json({ message: 'Sipariş başarıyla oluşturuldu', order });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: 'Sipariş oluşturulamadı' });
    }
});

// Ürünleri listeleyen endpoint (galeri için) - sellerId ile kullanıcı bilgisi de dön
app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || '-createdAt';
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Number.MAX_SAFE_INTEGER;
        const filter = {
            price: { $gte: minPrice, $lte: maxPrice }
        };
        // Kategori veya arama gibi ek filtreler eklenebilir
        const products = await require('./database').Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('sellerId', 'name surname email profilePhoto');
        // fullName alanı ve seller nesnesi frontend için ekleniyor
        const productsWithSeller = products.map(product => {
            let seller = null;
            if (product.sellerId) {
                seller = {
                    _id: product.sellerId._id ? product.sellerId._id.toString() : undefined,
                    name: product.sellerId.name,
                    surname: product.sellerId.surname,
                    email: product.sellerId.email,
                    profilePhoto: product.sellerId.profilePhoto || null,
                    fullName: ((product.sellerId.name || '') + ' ' + (product.sellerId.surname || '')).trim(),
                    rating: product.sellerId.rating || 0 // rating yoksa 0
                };
            }
            // Hem sellerId hem seller alanı ile dön
            return {
                ...product.toObject(),
                sellerId: seller, // eski kodla uyum için
                seller // yeni kodla uyum için
            };
        });
        res.json(productsWithSeller);
    } catch (error) {
        console.error('Ürün listeleme hatası:', error);
        res.status(500).json({ message: 'Ürünler yüklenemedi' });
    }
});

// Resim yükleme endpointi
app.post('/api/products/upload', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price, licenses } = req.body;
        if (!title || !description || !price) {
            return res.status(400).json({ message: 'Başlık, açıklama ve fiyat zorunludur' });
        }

        const product = await require('./database').Product.create({
            title,
            description,
            price: parseFloat(price),
            imageUrl: `/uploads/${req.file.filename}`,
            sellerId: req.user._id,
            licenses: {
                personal: licenses && licenses.personal === 'true',
                commercial: licenses && licenses.commercial === 'true'
            }
        });

        res.status(201).json({ message: 'Ürün başarıyla yüklendi', product });
    } catch (error) {
        console.error('Resim yükleme hatası:', error);
        res.status(500).json({ message: 'Resim yüklenirken bir hata oluştu' });
    }
});

// Sepete ürün ekle
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ message: 'Ürün ID gerekli' });
        }
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }
        // Ürün zaten sepette mi?
        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({ product: productId, quantity: 1 });
        }
        await cart.save();
        res.json({ message: 'Ürün sepete eklendi' });
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        res.status(500).json({ message: 'Ürün sepete eklenemedi' });
    }
});

// Sepeti getir
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
        res.json(cart || { items: [] });
    } catch (error) {
        res.status(500).json({ message: 'Sepet getirilemedi' });
    }
});

// Ürün indirme endpointi
app.get('/api/products/:id/download', authenticateToken, async (req, res) => {
    try {
        const product = await require('./database').Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        // Satın almış mı kontrolü (isteğe bağlı, güvenlik için önerilir)
        // const order = await Order.findOne({ userId: req.user._id, 'items.product': product._id });
        // if (!order) {
        //     return res.status(403).json({ message: 'Bu ürünü indirme yetkiniz yok' });
        // }

        const filePath = path.join(__dirname, product.imageUrl);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Dosya bulunamadı' });
        }

        res.download(filePath, `${product.title || 'resim'}.jpg`);
    } catch (error) {
        console.error('İndirme hatası:', error);
        res.status(500).json({ message: 'Dosya indirilemedi' });
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
