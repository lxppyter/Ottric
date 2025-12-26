# TODO

## FAZ 1 — Ürün Değeri (Risk → Karar → Aksiyon)

### 0) Temel: Veri Kaynakları + Eşleme Doğruluğu (Foundation)

- [x] Duplicate/alias advisory birleştirme (CVE ↔ GHSA ↔ OSV)
- [x] PURL / CPE normalizasyonu ve eşleme hatalarını azaltma
- [x] SBOM doğrulama (format, zorunlu alanlar, tutarlılık; CycloneDX/SPDX)
- [x] Sonuç deterministikliği: aynı SBOM → aynı bulgu seti (cache + versiyonlu kaynak snapshot)

### 1) Gürültüyü Azaltma + Önceliklendirme
- [x] Context scoring:
  - İnternet-facing mi?
  - Prod / staging / dev ayrımı
  - Privileged container / root / capability’ler
  - Secret erişimi / IAM rolü / erişim kapsamı
- [x] Risk skoru formülü + açıklanabilirlik (neden bu skor?)
- [x] “Actionable” filtreler: sadece fix’i olanlar / exploit sinyali olanlar / prod’dakiler vb.

### 2) Reachability / Exploitability (Gerçekten Ulaşılabilir mi?)
- [x] Call graph / symbol analysis (statik) - *Regex/Import analizi yapıldı*
- [ ] Runtime trace / instrumentation (opsiyonel agent)
- [ ] Test coverage sinyali (CI entegrasyonu ile)
- [x] Sonuç modelleme: “exploitable / not exploitable / unknown” + kanıt linkleri - *VEX (Direct/Transitive) entegrasyonu tamamlandı*

### 3) VEX (Operasyonel Süreç) — Karar Yönetimi
- [x] Gerekçe şablonları + kanıt ekleme (log/config/PR/link)
- [x] Audit trail: kim, ne zaman, hangi gerekçeyle karar verdi
- [x] Expiry / re-validation: “not affected” kararları X gün sonra tekrar gözden geçirme
- [x] CycloneDX VEX export (+ internal JSON) ve versiyonlama

### 4) Remediation / Fix Automation (Aksiyon Alma)
- [x] Fix version önerisi (“şu versiyona yükselt”)
- [x] Upgrade path analizi (minor/major risk, breaking change)
- [x] CI/CD Integration (GitHub Issues & PRs):
  - [x] **Secure Storage**: Encrypt GitHub Tokens.
  - [x] **Product Entity**: Add repo/manifest/token columns.
  - [x] **GithubService**: Issue & PR Logic (Manifest Fetch -> Edit -> PR).
  - [x] **Frontend**: Settings Tab & Action Buttons.
  - [x] **Test**: Verified with Mock Mode (`scripts/test-github-mock.ts`).
- [x] “No fix” durumunda policy bazlı öneriler (RCE, SQLi, XSS mitigation plans)

### 4.5) User Interface Polish (Kullanıcı Deneyimi)
- [x] **Dashboard UI/UX**:
  - [x] Projects Layout: Full width & Responsive Grid (XL/2XL).
  - [x] Overview Page: Fixed viewport (No outer scroll).
  - [x] Notification System: Removed Bell/Personal Nots (Simplified to Logs/Webhooks).

### 5) Supply Chain Riskleri (İleri Seviye Tehditler)
- [x] Typosquatting / paket ismi benzerlik uyarısı
  - [x] **Test**: Verified logic with Levenshtein distance.
- [x] Malicious package sinyalleri (heuristics + allow/deny list)
- [x] Maintainer / ownership değişimi analizi (Deprioritized/Manual for now)
- [x] SBOM provenance doğrulama (Pipeline imzası, SLSA)

### 6) Policy & Compliance (Kurumsal Denetim)
- [x] Policy engine (Örn: CVSS > 7 && Prod yasak)
  - [x] **Verified**: Score & Grade (A-F) based on Critical/High risks.
- [x] Exception/waiver (istisna) akışı (Covered by VEX & "Not Affected" mechanism)
- [x] Evidence pack (Denetim paketi export) (Covered by Portal > Audit Pack / Report PDF)

## FAZ 2 — SaaS Ürünleşme (Ticari Özellikler)

### 1) Hesap ve Takım Yönetimi
- [ ] Audit Logs UI (Kim ne yaptı?)
- [ ] Hesap ayarları / Şifre değiştirme
- [ ] Kotalar ve Limitler (UI göstergeleri)

### 2) Ödeme ve Abonelik
- [ ] Planlar & Pricing
- [ ] Stripe / LemonSqueezy entegrasyonu
- [ ] Mail servisi (Transactional)
