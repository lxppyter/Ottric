# Ottric Canlıya Alma (Deployment) Rehberi

Bu rehber, Ottric platformunu (NestJS Backend + Next.js Frontend + PostgreSQL Veritabanı) canlı bir sunucuya (Production) kurmak için gereken adımları içerir.

## 1. Sistem Gereksinimleri
Bu proje modern bir JavaScript yığını (Node.js) ve Veritabanı kullanır. Başlangıç (MVP) için önerilen sunucu özellikleri şunlardır:

### Önerilen Donanım (MVP / Beta)
*   **İşlemci (CPU)**: En az 2 vCPU çekirdeği.
*   **RAM**: En az 4 GB RAM. (Build işlemleri ve veritabanı performansı için 2GB altı önerilmez).
*   **Depolama (Disk)**: 50 GB SSD veya NVMe.
*   **İşletim Sistemi**: Ubuntu 22.04 LTS (Linux).

*Not: DigitalOcean (Droplet), Hetzner (Cloud) veya AWS (EC2 t3.medium) tercih edilebilir.*

---

## 2. Sunucu Hazırlığı (İlk Kurulum)
Sunucunuza SSH ile bağlandıktan sonra aşağıdaki komutları sırasıyla çalıştırın:

```bash
# 1. Paketleri güncelleyin
sudo apt update && sudo apt upgrade -y

# 2. Node.js (v20) kurun
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PostgreSQL Veritabanını kurun
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. PM2 (Uygulamayı ayakta tutan yönetici) kurun
sudo npm install -g pm2
```

## 3. Veritabanı Ayarları
Veritabanı kullanıcısını ve gerekli izinleri oluşturun:

```bash
sudo -u postgres psql
```

Aşağıdaki SQL komutlarını yapıştırın (Şifreyi kendinize göre belirleyin):
```sql
CREATE DATABASE ottric_db;
CREATE USER ottric_user WITH ENCRYPTED PASSWORD 'GUCLU_BIR_SIFRE_BELIRLEYIN';
GRANT ALL PRIVILEGES ON DATABASE ottric_db TO ottric_user;
\q
```

## 4. Backend (API) Kurulumu
1. **Projeyi Çekin**: `git clone <github-adresiniz>`
2. **Bağımlılıkları Yükleyin**:
   ```bash
   cd ottric
   npm install
   ```
3. **Ortam Değişkenleri (.env)**:
   Sunucuda `.env` dosyası oluşturun (`nano .env`) ve içini doldurun:
   ```env
   DATABASE_URL="postgresql://ottric_user:GUCLU_BIR_SIFRE_BELIRLEYIN@localhost:5432/ottric_db?schema=public"
   JWT_SECRET="COK_UZUN_RASTGELE_BIR_STRING_YAZIN"
   PORT=3001
   ```
4. **Veritabanı Tablolarını Oluşturun**:
   ```bash
   npx prisma migrate deploy
   ```
5. **Başlatın (PM2 ile)**:
   ```bash
   npm run build
   pm2 start dist/main.js --name "ottric-api"
   ```

## 5. Frontend (Arayüz) Kurulumu
1. **Klasöre Gidin**:
   ```bash
   cd client
   npm install
   ```
2. **Ortam Değişkenleri**:
   `.env.production` dosyası oluşturun:
   ```env
   NEXT_PUBLIC_API_URL="https://api.ottric.com"
   ```
3. **Derleyin (Build)**:
   ```bash
   npm run build
   ```
4. **Başlatın**:
   ```bash
   pm2 start npm --name "ottric-web" -- start
   ```

## 6. Alan Adı Bağlantısı (Nginx & SSL)
Domain adresinizi (örn. ottric.com) sunucuya yönlendirmek için Nginx kullanılır.

1. **Nginx Kurun**: `sudo apt install nginx`
2. **Ayar Dosyası Yapılandırın**: `/etc/nginx/sites-available/ottric`
   ```nginx
   # Frontend (ottric.com) -> localhost:3000
   server {
       server_name ottric.com;
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   
   # Backend (api.ottric.com) -> localhost:3001
   server {
       server_name api.ottric.com;
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. **Aktif Edin**: `sudo ln -s /etc/nginx/sites-available/ottric /etc/nginx/sites-enabled/`
4. **Nginx'i Yeniden Başlatın**: `sudo systemctl restart nginx`
5. **HTTPS (Güvenlik Sertifikası)**: `sudo apt install python3-certbot-nginx` ardından `sudo certbot --nginx` komutuyla ücretsiz SSL kurun.

---
**Tebrikler!** Projeniz artık canlı yayında. 🚀
