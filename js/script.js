/**
 * IMK Site Interactivity Controller v1.2
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- 0. Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
        
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        });
    }

    // --- 1. General Navigation ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // If it's a simple hash (e.g. #catalog on the same page)
            if (href.startsWith('#') && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            header.style.background = 'rgba(41, 54, 74, 0.98)';
        } else {
            header.style.boxShadow = 'none';
            header.style.background = 'var(--header-bg)';
        }
    });

    // --- 1.5 Hero Slideshow ---
    const initHeroSlideshow = () => {
        const slides = document.querySelectorAll('.hero-slide-bg');
        const dots = document.querySelectorAll('.hero-dot');
        let currentSlide = 0;
        let slideInterval;

        if (!slides.length) return;

        const showSlide = (index) => {
            slides[currentSlide].classList.remove('active');
            if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
            
            currentSlide = index;
            
            slides[currentSlide].classList.add('active');
            if (dots[currentSlide]) dots[currentSlide].classList.add('active');
        };

        const nextSlide = () => {
            let nextIndex = (currentSlide + 1) % slides.length;
            showSlide(nextIndex);
        };

        const startSlideshow = () => {
            slideInterval = setInterval(nextSlide, 5000);
        };

        const stopSlideshow = () => {
            clearInterval(slideInterval);
        };

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                stopSlideshow();
                showSlide(idx);
                startSlideshow();
            });
        });

        startSlideshow();
    };
    initHeroSlideshow();

    // --- 2. Review Slider (Homepage) ---
    const initReviewSlider = () => {
        const slides = document.querySelectorAll('.slide');
        const thumbs = document.querySelectorAll('.thumb');
        const prevBtn = document.getElementById('prev-review');
        const nextBtn = document.getElementById('next-review');
        let currentIndex = 0;

        if (!slides.length) return;

        const showSlide = (index) => {
            slides[currentIndex].classList.remove('active');
            thumbs[currentIndex].classList.remove('active');
            currentIndex = (index + slides.length) % slides.length;
            slides[currentIndex].classList.add('active');
            thumbs[currentIndex].classList.add('active');
        };

        nextBtn?.addEventListener('click', () => showSlide(currentIndex + 1));
        prevBtn?.addEventListener('click', () => showSlide(currentIndex - 1));
        thumbs.forEach((thumb, idx) => {
            thumb.addEventListener('click', () => showSlide(idx));
        });
    };

    // --- 2.5 Dynamic Catalog ---
    const initDynamicCatalog = (customData) => {
        const catalogGrid = document.getElementById('dyn-catalog-grid');
        const catalogTabs = document.getElementById('dyn-catalog-tabs');
        const subTabsContainer = document.getElementById('dyn-subcatalog-tabs');
        
        const dataToUse = customData || (typeof productsData !== 'undefined' ? productsData : []);
        if (!catalogGrid || !dataToUse.length) return;

        // Categories logic
        let categories = new Set();
        let subcatsByCat = {};
        
        dataToUse.forEach(p => {
            if (p.category) {
                categories.add(p.category);
                if (!subcatsByCat[p.category]) subcatsByCat[p.category] = new Set();
                if (p.subcategory) subcatsByCat[p.category].add(p.subcategory);
            }
        });

        const renderProducts = (filterCat, filterSubCat) => {
            if (filterCat === 'Категорії') {
                let html = '';
                categories.forEach(cat => {
                    const firstProd = dataToUse.find(p => p.category === cat && !p.hidden);
                    let mainImg = '';
                    if (firstProd) {
                        if (firstProd.colors && firstProd.colors.length > 0) mainImg = firstProd.colors[0].image;
                        else if (firstProd.images && firstProd.images.length > 0) mainImg = firstProd.images[0];
                    }

                    html += `
                        <div class="product-card category-card" data-cat="${cat}" style="cursor: pointer; transition: transform 0.3s ease;">
                            <div class="product-img-wrapper" style="aspect-ratio: 1; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center;">
                                <img src="${mainImg}" alt="${cat}" class="product-img" style="object-fit: contain; width: 100%; height: 100%;" loading="lazy">
                            </div>
                            <div class="product-info" style="text-align: center; padding: 20px;">
                                <h3 class="product-title" style="margin-bottom: 8px; font-size: 1.25rem;">${cat}</h3>
                                <p class="product-desc" style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">Перейти до категорії &rarr;</p>
                            </div>
                        </div>
                    `;
                });
                catalogGrid.innerHTML = html || '<p style="text-align:center; width: 100%; color:#64748b;">Немає категорій</p>';

                document.querySelectorAll('.category-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const targetCat = card.getAttribute('data-cat');
                        const tab = Array.from(catalogTabs.querySelectorAll('.tab')).find(t => t.getAttribute('data-cat') === targetCat);
                        if (tab) {
                            tab.click();
                            catalogTabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    });
                });
                return;
            }

            let filtered = dataToUse.filter(p => p.hidden !== true);
            if (filterCat !== 'Категорії') {
                filtered = filtered.filter(p => p.category === filterCat);
                if (filterSubCat && filterSubCat !== 'Всі') {
                    filtered = filtered.filter(p => p.subcategory === filterSubCat);
                }
            }

            let html = '';
            filtered.forEach(prod => {
                let mainImg = prod.images && prod.images[0] ? prod.images[0] : '';
                if (prod.colors && prod.colors.length > 0) mainImg = prod.colors[0].image;

                html += `
                    <div class="product-card" data-id="${prod.id}" data-delivery='${JSON.stringify(prod.delivery || {})}'>
                        <div class="product-img-wrapper" onclick="window.location.href='product.html?id=${encodeURIComponent(prod.id)}'">
                            ${prod.badgeText ? '<span class="sale-badge">' + prod.badgeText + '</span>' : ''}
                            <img src="${mainImg}" alt="${prod.title}" class="product-img" loading="lazy">
                        </div>
                        <div class="product-info">
                            <h3 class="product-title" onclick="window.location.href='product.html?id=${encodeURIComponent(prod.id)}'">${prod.title}</h3>
                            <span class="product-availability">${prod.availability || '&nbsp;'}</span>
                            <div class="product-pricing">
                                <span class="current-price">${prod.price} грн.</span>
                                ${prod.oldPrice ? '<span class="old-price">' + prod.oldPrice + ' грн.</span>' : ''}
                            </div>
                            <div class="product-actions">
                                <a href="product.html?id=${encodeURIComponent(prod.id)}" class="btn-sm btn-primary-sm">Детальніше</a>
                                <a href="#" class="btn-sm btn-outline-sm">В кошик</a>
                            </div>
                        </div>
                    </div>
                `;
            });
            catalogGrid.innerHTML = html || '<p style="text-align:center; width: 100%; color:#64748b;">Немає товарів в цій категорії</p>';
        };

        const updateUrlHash = (cat, sub) => {
            if (!cat || cat === 'Категорії') {
                window.history.replaceState(null, null, '#catalog');
                return;
            }
            let hash = `#catalog?cat=${encodeURIComponent(cat)}`;
            if (sub && sub !== 'Всі') hash += `&sub=${encodeURIComponent(sub)}`;
            window.history.replaceState(null, null, hash);
        };

        const resetToCategories = () => {
            if (catalogTabs) {
                catalogTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                const homeTab = Array.from(catalogTabs.querySelectorAll('.tab')).find(t => t.getAttribute('data-cat') === 'Категорії');
                if (homeTab) homeTab.classList.add('active');
            }
            if (subTabsContainer) {
                subTabsContainer.style.display = 'none';
                subTabsContainer.innerHTML = '';
            }
            updateUrlHash('Категорії', null);
            renderProducts('Категорії', null);
            
            const catalogSection = document.getElementById('catalog');
            if (catalogSection) {
                setTimeout(() => catalogSection.scrollIntoView({ behavior: 'smooth' }), 50);
            }
        };

        const applyFilterFromHash = () => {
            const hash = window.location.hash;
            if (hash === '#catalog' || hash === '') {
                resetToCategories();
                return true;
            }
            if (!hash.startsWith('#catalog?')) return false;
            
            const params = new URLSearchParams(hash.split('?')[1]);
            const cat = params.get('cat');
            const sub = params.get('sub');
            
            if (cat) {
                const tab = Array.from(catalogTabs.querySelectorAll('.tab')).find(t => t.getAttribute('data-cat') === cat);
                if (tab) {
                    tab.click();
                    // Scroll to catalog section
                    const catalogSection = document.getElementById('catalog');
                    if (catalogSection) {
                        setTimeout(() => catalogSection.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                    if (sub) {
                        setTimeout(() => {
                            const subTab = Array.from(subTabsContainer.querySelectorAll('span')).find(s => s.getAttribute('data-sub') === sub);
                            if (subTab) subTab.click();
                        }, 50);
                    }
                    return true;
                }
            }
            return false;
        };

        // Render Tabs
        if (catalogTabs) {
            let tabsHtml = `<span class="tab active" data-cat="Категорії">Категорії</span>`;
            categories.forEach(cat => {
                tabsHtml += `<span class="tab" data-cat="${cat}">${cat}</span>`;
            });
            catalogTabs.innerHTML = tabsHtml;

            // Click listener for tabs
            catalogTabs.addEventListener('click', (e) => {
                if(e.target.classList.contains('tab')) {
                    catalogTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    const cat = e.target.getAttribute('data-cat');
                    updateUrlHash(cat, null);
                    
                    if (cat !== 'Категорії' && subcatsByCat[cat] && subcatsByCat[cat].size > 0) {
                        let subHtml = `<span class="btn-sm btn-outline-sm active-sub" data-sub="Всі" style="cursor:pointer; background:#29364a; color:#fff;">Всі</span>`;
                        subcatsByCat[cat].forEach(sub => {
                            subHtml += `<span class="btn-sm btn-outline-sm" data-sub="${sub}" style="cursor:pointer;">${sub}</span>`;
                        });
                        subTabsContainer.innerHTML = subHtml;
                        subTabsContainer.style.display = 'flex';
                    } else {
                        subTabsContainer.style.display = 'none';
                        subTabsContainer.innerHTML = '';
                    }

                    renderProducts(cat, null);
                }
            });

            // Subtabs clicks
            subTabsContainer.addEventListener('click', (e) => {
                if(e.target.tagName === 'SPAN') {
                    subTabsContainer.querySelectorAll('span').forEach(t => {
                        t.style.background = 'transparent';
                        t.style.color = '#29364a';
                        t.classList.remove('active-sub');
                    });
                    e.target.style.background = '#29364a';
                    e.target.style.color = '#fff';
                    e.target.classList.add('active-sub');

                    const cat = catalogTabs.querySelector('.active').getAttribute('data-cat');
                    const sub = e.target.getAttribute('data-sub');
                    updateUrlHash(cat, sub);
                    renderProducts(cat, sub);
                }
            });
        }

        if (!applyFilterFromHash()) {
            renderProducts('Категорії', null);
        }

        window.addEventListener('hashchange', applyFilterFromHash);

        // Global interceptor for navigation links
        document.querySelectorAll('a[href="#catalog"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                resetToCategories();
            });
        });
    };

    // --- 2.6 Dynamic Product Page ---
    const initDynamicProductPage = (customData) => {
        const container = document.getElementById('product-container');
        const dataToUse = customData || (typeof productsData !== 'undefined' ? productsData : []);
        if (!container || !dataToUse.length) return;

        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        const notFound = document.getElementById('product-not-found');
        const product = dataToUse.find(p => p.id === productId);
        
        if (!product || product.hidden === true) {
            // ONLY show "Not Found" if we actually have custom data (meaning dynamic fetch finished)
            if (customData && notFound) {
                notFound.querySelector('h2').textContent = product?.hidden ? 'Товар тимчасово недоступний' : 'Товар не знайдено';
                notFound.querySelector('p').textContent = product?.hidden ? 'Вибачте, цей товар зараз прихований або знятий з продажу.' : 'Схоже, такої сторінки не існує або її було видалено.';
                notFound.style.display = 'block';
                container.style.display = 'none';
            }
            // If it's the first static call, just keep it hidden/waiting
            return;
        }

        if (notFound) notFound.style.display = 'none';
        container.style.display = 'block';
        document.title = `${product.title} | VenKnikens`;
        // Store delivery info globally so addToCart can pick it up
        window.__currentProductDelivery = product.delivery || null;

        // Dynamic canonical for SEO — each product gets its own URL
        const canonicalUrl = `https://venknikens.vercel.app/product.html?id=${encodeURIComponent(product.id)}`;
        let canonicalTag = document.querySelector('link[rel="canonical"]');
        if (!canonicalTag) {
            canonicalTag = document.createElement('link');
            canonicalTag.rel = 'canonical';
            document.head.appendChild(canonicalTag);
        }
        canonicalTag.href = canonicalUrl;

        // Update og:url for social sharing
        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) { ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); document.head.appendChild(ogUrl); }
        ogUrl.setAttribute('content', canonicalUrl);

        // Update og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
        ogTitle.setAttribute('content', `${product.title} | VenKnikens`);

        // Breadcrumbs Logic
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            let bHtml = `<li><a href="index.html">Головна</a></li>`;
            if (product.category) {
                bHtml += `<li><a href="index.html#catalog?cat=${encodeURIComponent(product.category)}">${product.category}</a></li>`;
                if (product.subcategory) {
                    bHtml += `<li><a href="index.html#catalog?cat=${encodeURIComponent(product.category)}&sub=${encodeURIComponent(product.subcategory)}">${product.subcategory}</a></li>`;
                }
            } else {
                bHtml += `<li><a href="index.html#catalog">Категорії</a></li>`;
            }
            bHtml += `<li class="current" id="dyn-breadcrumb">${product.title}</li>`;
            breadcrumbs.innerHTML = bHtml;
        }
        document.getElementById('dyn-title').textContent = product.title;
        document.getElementById('dyn-sku').textContent = 'Артикул: ' + (product.sku || '');
        document.getElementById('dyn-price').textContent = product.price + ' грн.';
        document.getElementById('dyn-old-price').textContent = product.oldPrice ? (product.oldPrice + ' грн.') : '';
        document.getElementById('dyn-desc').innerText = product.description.replace(/\\n/g, '\n') || '';

        const updateAvailabilityUI = (isAvailable) => {
            const availEl = document.getElementById('dyn-avail');
            const orderBtn = document.querySelector('.order-btn');
            if (availEl) {
                if (isAvailable) {
                    availEl.innerHTML = '<span class="iconify" data-icon="material-symbols:check-circle"></span> В наявності';
                    availEl.className = 'm-product-availability in-stock';
                } else {
                    availEl.innerHTML = '<span class="iconify" data-icon="material-symbols:cancel"></span> Немає в наявності';
                    availEl.className = 'm-product-availability out-of-stock';
                }
            }
            if (orderBtn) {
                orderBtn.disabled = !isAvailable;
                orderBtn.textContent = isAvailable ? 'ЗАМОВИТИ' : 'НЕМАЄ В НАЯВНОСТІ';
            }
        };

        const badgeEl = document.getElementById('dyn-badge');
        if (badgeEl) {
            if (product.badgeText) {
                badgeEl.textContent = product.badgeText;
                badgeEl.style.display = 'flex';
            } else {
                badgeEl.style.display = 'none';
            }
        }

        // Images & Colors logic
        const thumbsContainer = document.getElementById('dyn-thumbs');
        const mainImg = document.getElementById('main-product-img');
        const colorGroup = document.getElementById('dyn-colors');
        
        // --- Linked Variants Logic (for separate products) ---
        let variants = [];
        if (product.groupId) {
            variants = dataToUse.filter(p => p.groupId === product.groupId && p.id !== product.id && !p.hidden);
        }

        let allImages = [];
        
        if ((product.colors && product.colors.length > 0) || variants.length > 0) {
            // New format with colors or variants
            if (colorGroup) colorGroup.style.display = 'block';
            
            const colorHead = document.getElementById('color-select-head');
            const colorList = colorGroup ? colorGroup.querySelector('.color-options-list') : null;
            
            // Set initial state
            if (colorHead) {
                const firstColor = product.colors && product.colors[0] ? product.colors[0] : null;
                const headImg = firstColor ? firstColor.image : (product.images ? product.images[0] : '');
                const headName = product.variantColor || (firstColor ? firstColor.name : 'Варіант');
                colorHead.innerHTML = `<img src="${headImg}" alt="${headName}" class="color-thumb-sm"><span>${headName}</span>`;
                
                // Set initial availability
                updateAvailabilityUI(firstColor ? (firstColor.available !== false) : true);
            }
            if (mainImg) {
                mainImg.src = product.colors && product.colors[0] ? product.colors[0].image : (product.images ? product.images[0] : '');
            }
            
            let colorHtml = '';
            
            // Add internal colors (variants within the same product)
            if (product.colors) {
                product.colors.forEach((c, idx) => {
                    if (c.name) {
                        const isAvail = c.available !== false;
                        colorHtml += `
                            <li class="color-option" data-color="${c.name}" data-img="${c.image}" data-avail="${isAvail}">
                                <img src="${c.image}" alt="${c.name}" class="color-thumb-sm">
                                <span>${c.name} ${isAvail ? '' : '<small style="color:#ef4444; margin-left:5px;">(немає)</small>'}</span>
                            </li>
                        `;
                    }
                    if (c.image) allImages.push(c.image);
                });
            }

            // Add external variants (linked products via groupId)
            variants.forEach(v => {
                const vImg = v.colors && v.colors[0] ? v.colors[0].image : (v.images ? v.images[0] : '');
                const vName = v.variantColor || (v.colors && v.colors[0] ? v.colors[0].name : 'Інший колір');
                colorHtml += `
                    <li class="color-option variant-redirect" data-url="product.html?id=${encodeURIComponent(v.id)}">
                        <img src="${vImg}" alt="${vName}" class="color-thumb-sm">
                        <span>${vName}</span>
                    </li>
                `;
            });

            if (colorList) colorList.innerHTML = colorHtml;
            if (colorGroup) {
                colorGroup.style.display = colorHtml ? 'block' : 'none';
            }
            
            
        } else {
            // Old format without colors, just images array
            if (colorGroup) colorGroup.style.display = 'none';
            if (product.images && product.images.length > 0) {
                allImages = product.images;
                if (mainImg) mainImg.src = allImages[0];
            }
        }
        
        let thumbsHtml = '';
        allImages.forEach((img, idx) => {
            thumbsHtml += `
                <div class="modal-thumb ${idx === 0 ? 'active' : ''}" data-img="${img}">
                    <img src="${img}" alt="Thumb ${idx + 1}" loading="lazy">
                </div>
            `;
        });
        if (thumbsContainer) thumbsContainer.innerHTML = thumbsHtml;

        // Specs
        const specsList = document.getElementById('dyn-specs-list');
        let specsHtml = '';
        if (product.specs) {
            if (Array.isArray(product.specs)) {
                product.specs.forEach(s => {
                    if (s.key && s.val) {
                        specsHtml += `<div class="m-spec-row"><span class="m-spec-label">${s.key}</span><span class="m-spec-value">${s.val}</span></div>`;
                    }
                });
            } else {
                for (const [key, value] of Object.entries(product.specs)) {
                    specsHtml += `<div class="m-spec-row"><span class="m-spec-label">${key}</span><span class="m-spec-value">${value}</span></div>`;
                }
            }
        }
        if (specsList) {
            specsList.innerHTML = specsHtml;
            const specsContainer = specsList.closest('.m-specs');
            if (specsContainer) {
                specsContainer.style.display = specsHtml.trim() ? 'block' : 'none';
            }
        }
    };

    // --- 3. Product Page Controllers ---
    const initProductPages = () => {
        const updateMainImage = (thumb) => {
            if (!thumb) return;
            const imgUrl = thumb.getAttribute('data-img');
            const mainImg = document.getElementById('main-product-img');
            if (mainImg) {
                mainImg.src = imgUrl;
                document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            }
        };

        const navigateGallery = (direction) => {
            const thumbs = Array.from(document.querySelectorAll('.modal-thumb'));
            const activeIndex = thumbs.findIndex(t => t.classList.contains('active'));
            if (activeIndex === -1) return;
            let nextIndex = activeIndex + direction;
            if (nextIndex >= thumbs.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = thumbs.length - 1;
            updateMainImage(thumbs[nextIndex]);
        };

        // Lightbox Logic
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const openLightbox = () => {
            const mainImg = document.getElementById('main-product-img');
            if (mainImg && lightbox) {
                lightboxImg.src = mainImg.src;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
        const closeLightbox = () => {
            if (lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        document.addEventListener('click', (e) => {
            // Thumbnail Click
            const thumb = e.target.closest('.modal-thumb');
            if (thumb) updateMainImage(thumb);

            // Arrow Clicks
            if (e.target.closest('#gallery-prev')) navigateGallery(-1);
            if (e.target.closest('#gallery-next')) navigateGallery(1);
            if (e.target.closest('#lightbox-prev')) {
                navigateGallery(-1);
                const mainImg = document.getElementById('main-product-img');
                if (mainImg) lightboxImg.src = mainImg.src;
            }
            if (e.target.closest('#lightbox-next')) {
                navigateGallery(1);
                const mainImg = document.getElementById('main-product-img');
                if (mainImg) lightboxImg.src = mainImg.src;
            }

            // Lightbox Open/Close
            if (e.target.closest('#main-product-img')) openLightbox();
            if (e.target.closest('#lightbox-close') || (e.target === lightbox)) closeLightbox();

            // Quantity Control
            const qtyBtn = e.target.closest('.qty-btn');
            if (qtyBtn) {
                const input = qtyBtn.parentElement.querySelector('.qty-input');
                if (input) {
                    if (qtyBtn.classList.contains('plus')) input.value = parseInt(input.value) + 1;
                    if (qtyBtn.classList.contains('minus') && input.value > 1) input.value = parseInt(input.value) - 1;
                }
            }

            // Add to Cart Logic
            const orderBtn = e.target.closest('.order-btn');
            if (orderBtn && !orderBtn.classList.contains('added')) {
                // Add to Global Cart
                if (window.addToCart) {
                    const title = document.querySelector('.m-product-title')?.textContent.trim() || 'Товар';
                    const price = document.querySelector('.m-current-price')?.textContent || '0 грн.';
                    const image = document.getElementById('main-product-img')?.src || '';
                    const qtyInput = document.querySelector('.qty-input');
                    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
                    // Grab delivery info from data attribute set by initDynamicProductPage
                    const delivery = window.__currentProductDelivery || null;
                    window.addToCart({ title, price, image, qty, delivery });
                }
            }

            // Accordion Toggle
            const accordionHeader = e.target.closest('.accordion-header');
            if (accordionHeader) {
                accordionHeader.parentElement.classList.toggle('active');
            }

            // Color Selector Toggle
            const colorHead = e.target.closest('#color-select-head');
            if (colorHead) {
                colorHead.classList.toggle('active');
            } else if (!e.target.closest('.color-options-list')) {
                // Close if clicked outside, but not on high options list
                document.querySelectorAll('.m-color-select').forEach(el => el.classList.remove('active'));
            }

            // Color Option Select
            const colorOption = e.target.closest('.color-option');
            if (colorOption) {
                const newColor = colorOption.getAttribute('data-color');
                const newImg = colorOption.getAttribute('data-img');
                const isAvail = colorOption.getAttribute('data-avail') !== 'false';
                
                // Update availability UI
                const availEl = document.getElementById('dyn-avail');
                const orderBtn = document.querySelector('.order-btn');
                if (availEl) {
                    if (isAvail) {
                        availEl.innerHTML = '<span class="iconify" data-icon="material-symbols:check-circle"></span> В наявності';
                        availEl.className = 'm-product-availability in-stock';
                    } else {
                        availEl.innerHTML = '<span class="iconify" data-icon="material-symbols:cancel"></span> Немає в наявності';
                        availEl.className = 'm-product-availability out-of-stock';
                    }
                }
                if (orderBtn) {
                    orderBtn.disabled = !isAvail;
                    orderBtn.textContent = isAvail ? 'ЗАМОВИТИ' : 'НЕМАЄ В НАЯВНОСТІ';
                }
                
                // Update dropdown header text/icon
                const head = document.getElementById('color-select-head');
                if (head) {
                    head.querySelector('span').textContent = newColor;
                    head.querySelector('img').src = newImg;
                    head.classList.remove('active');
                }
                
                // Update main large image
                const mainImg = document.getElementById('main-product-img');
                if (mainImg) mainImg.src = newImg;
                
                // Update active thumbnail in left gallery
                document.querySelectorAll('.modal-thumb').forEach(t => {
                    if (t.getAttribute('data-img') === newImg) {
                        document.querySelectorAll('.modal-thumb').forEach(x => x.classList.remove('active'));
                        t.classList.add('active');
                    }
                });
            }

            // Grouped Variant Redirect
            const variantOption = e.target.closest('.variant-redirect');
            if (variantOption) {
                const url = variantOption.getAttribute('data-url');
                if (url) window.location.href = url;
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!lightbox?.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') {
                navigateGallery(-1);
                const mainImg = document.getElementById('main-product-img');
                if (mainImg) lightboxImg.src = mainImg.src;
            }
            if (e.key === 'ArrowRight') {
                navigateGallery(1);
                const mainImg = document.getElementById('main-product-img');
                if (mainImg) lightboxImg.src = mainImg.src;
            }
            if (e.key === 'Escape') closeLightbox();
        });
    };

    // --- 4. Shopping Cart System ---
    const initShoppingCart = () => {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalPrice = document.getElementById('cart-total-price');
        
        let cart = JSON.parse(localStorage.getItem('imk_cart')) || [];
        
        const saveCart = () => {
            localStorage.setItem('imk_cart', JSON.stringify(cart));
            updateCartUI();
        };

        const updateCartUI = () => {
            document.querySelectorAll('.cart-count').forEach(el => {
                el.textContent = cart.length;
                if(cart.length > 0) el.classList.add('visible');
                else el.classList.remove('visible');
            });

            // Synchronize 'Add to Cart' buttons visually based on cart data
            const cartTitles = cart.map(item => item.title.trim());
            
            // 1. Catalog buttons
            document.querySelectorAll('.btn-outline-sm').forEach(btn => {
                if (btn.closest('.product-actions')) {
                    const card = btn.closest('.product-card');
                    if (card) {
                        const title = card.querySelector('.product-title').textContent.trim();
                        if (cartTitles.includes(title)) {
                            btn.innerHTML = '<span class="iconify" data-icon="material-symbols:check"></span> В кошику';
                            btn.style.pointerEvents = 'none';
                            btn.style.backgroundColor = '#f0fdf4';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.innerHTML = 'В кошик';
                            btn.style.pointerEvents = '';
                            btn.style.backgroundColor = '';
                            btn.style.borderColor = '';
                        }
                    }
                }
            });

            // 2. Detail page buttons
            const orderBtn = document.querySelector('.order-btn');
            if (orderBtn) {
                const mTitle = document.querySelector('.m-product-title');
                if (mTitle) {
                    if (cartTitles.includes(mTitle.textContent.trim())) {
                        orderBtn.innerHTML = '<span class="iconify" data-icon="material-symbols:check" style="margin-right: 6px; font-size: 18px; vertical-align: text-bottom;"></span>В кошику';
                        orderBtn.classList.add('added');
                        orderBtn.style.backgroundColor = '#4caf50';
                        orderBtn.style.borderColor = '#4caf50';
                        orderBtn.style.color = '#ffffff';
                    } else {
                        orderBtn.innerHTML = 'ЗАМОВИТИ';
                        orderBtn.classList.remove('added');
                        orderBtn.style.backgroundColor = '';
                        orderBtn.style.borderColor = '';
                        orderBtn.style.color = '';
                    }
                }
            }

            if (!cartItemsContainer) return;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<div class="cart-empty-msg">Ваш кошик порожній</div>';
                cartTotalPrice.textContent = '0 грн.';
                return;
            }

            let html = '';
            let total = 0;
            
            cart.forEach((item, index) => {
                total += parseInt(item.price.replace(/[^\d]/g, '')) * (item.qty || 1);
                html += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.title}</div>
                            <div class="cart-item-price">${item.price} ${item.qty > 1 ? 'x '+item.qty : ''}</div>
                            <button class="cart-remove-btn" data-index="${index}">Видалити</button>
                        </div>
                    </div>
                `;
            });

            cartItemsContainer.innerHTML = html;
            cartTotalPrice.textContent = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' грн.';
            
            document.querySelectorAll('.cart-remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.getAttribute('data-index'));
                    cart.splice(idx, 1);
                    saveCart();
                });
            });
        };

        const toggleCart = (show) => {
            if(!cartSidebar || !cartOverlay) return;
            if(show) {
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        document.addEventListener('click', (e) => {
            if (e.target.closest('#cart-toggle') || e.target.closest('.cart-btn')) toggleCart(true);
            if (e.target.closest('#close-cart') || e.target.closest('#cart-overlay')) toggleCart(false);
            
            // Checkout button in cart sidebar
            if (e.target.closest('.checkout-btn') || e.target.closest('#open-checkout-from-cart')) {
                e.preventDefault();
                if (cart.length === 0) {
                    alert('Ваш кошик порожній!');
                    return;
                }
                toggleCart(false);
                window.openCheckoutModal();
            }

            // "В кошик" button on catalog items
            const outlineBtn = e.target.closest('.btn-outline-sm');
            if(outlineBtn && outlineBtn.closest('.product-card') && outlineBtn.textContent.trim() === 'В кошик') {
                e.preventDefault();
                const card = outlineBtn.closest('.product-card');
                const title = card.querySelector('.product-title').textContent.trim();
                const priceElem = card.querySelector('.current-price');
                const price = priceElem ? priceElem.textContent : '0 грн.';
                const image = card.querySelector('.product-img').src;
                let delivery = null;
                try { delivery = JSON.parse(card.getAttribute('data-delivery') || 'null'); } catch(e) {}
                
                cart.push({ title, price, image, qty: 1, delivery });
                saveCart();
                toggleCart(true);
            }
        });

        window.getCart = () => cart;
        window.clearCart = () => {
            cart = [];
            saveCart();
        };

        window.addToCart = (item) => {
            cart.push(item);
            saveCart();
            toggleCart(true);
        };

        updateCartUI();
    };

    // --- 5. Checkout System ---
    const initCheckout = () => {
        const checkoutModal = document.getElementById('checkout-modal');
        const closeCheckout = document.getElementById('close-checkout');
        const checkoutForm = document.getElementById('checkout-form');
        const summaryList = document.getElementById('order-summary-list');
        
        if (!checkoutModal) return;

        let selectedSettlementRef = null;
        let selectedCityName = '';
        let cachedWarehouses = [];
        let cachedCargoWarehouses = [];

        // Delivery type radio selection handler
        const deliveryFields = {
            'np':         ['checkout-city-group', 'checkout-np-branch-group'],
            'np_cargo':   ['checkout-city-group', 'checkout-np-cargo-group'],
            'np_courier': ['checkout-city-group', 'checkout-np-courier-group'],
            'ukrpost':    ['checkout-city-group', 'checkout-ukrpost-group'],
        };

        const showDeliveryFields = (type) => {
            // Hide all delivery field groups
            ['checkout-city-group','checkout-np-branch-group','checkout-np-cargo-group',
             'checkout-np-courier-group','checkout-ukrpost-group'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = 'none';
                    el.querySelectorAll('input').forEach(i => i.required = false);
                }
            });
            if (!type) return;
            const groups = deliveryFields[type] || [];
            groups.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = 'block';
                    el.querySelectorAll('input').forEach(i => i.required = true);
                }
            });

            // If city is already chosen, preload branch list
            if (selectedSettlementRef || selectedCityName) {
                if (type === 'np') preloadWarehouses(false);
                if (type === 'np_cargo') preloadWarehouses(true);
            }
        };

        checkoutModal.addEventListener('change', (e) => {
            if (e.target.name === 'delivery_type') {
                showDeliveryFields(e.target.value);
            }
        });

        // --- Nova Poshta API Helpers ---
        const searchNPSettlements = async (query) => {
            try {
                const resp = await fetch(`/api/delivery/settlements?query=${encodeURIComponent(query)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.success && data.addresses) return data.addresses;
                }
            } catch (e) {}

            try {
                const resp = await fetch('https://api.novaposhta.ua/v2.0/json/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        modelName: 'Address',
                        calledMethod: 'searchSettlements',
                        methodProperties: { CityName: query, Limit: '15' }
                    })
                });
                const data = await resp.json();
                return (data.data && data.data[0] && data.data[0].Addresses) || [];
            } catch (e) {
                return [];
            }
        };

        const fetchNPWarehouses = async (settlementRef, cityName, isCargoOnly) => {
            try {
                const resp = await fetch(`/api/delivery/warehouses?settlementRef=${encodeURIComponent(settlementRef || '')}&cityName=${encodeURIComponent(cityName || '')}&cargoOnly=${isCargoOnly ? 'true' : 'false'}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.success && data.warehouses) return data.warehouses;
                }
            } catch (e) {}

            try {
                const methodProperties = { Limit: '250' };
                if (settlementRef) methodProperties.SettlementRef = settlementRef;
                else if (cityName) methodProperties.CityName = cityName;
                if (isCargoOnly) methodProperties.TypeOfWarehouseRef = '9a68df70-0267-42a8-bb5c-37f427e36ee4';

                const resp = await fetch('https://api.novaposhta.ua/v2.0/json/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        modelName: 'AddressGeneral',
                        calledMethod: 'getWarehouses',
                        methodProperties
                    })
                });
                const data = await resp.json();
                return (data.data || []).map(w => ({
                    number: w.Number,
                    description: w.Description,
                    ref: w.Ref,
                    type: w.TypeOfWarehouse,
                    shortAddress: w.ShortAddress
                }));
            } catch (e) {
                return [];
            }
        };

        const preloadWarehouses = async (isCargoOnly) => {
            if (isCargoOnly && cachedCargoWarehouses.length === 0) {
                cachedCargoWarehouses = await fetchNPWarehouses(selectedSettlementRef, selectedCityName, true);
            } else if (!isCargoOnly && cachedWarehouses.length === 0) {
                cachedWarehouses = await fetchNPWarehouses(selectedSettlementRef, selectedCityName, false);
            }
        };

        // --- Autocomplete 1: City Search ---
        const cityInput = document.getElementById('order-city');
        const citySuggestions = document.getElementById('order-city-suggestions');
        let cityDebounceTimer;

        if (cityInput && citySuggestions) {
            cityInput.addEventListener('input', () => {
                clearTimeout(cityDebounceTimer);
                const query = cityInput.value.trim();
                if (query.length < 2) {
                    citySuggestions.classList.remove('active');
                    citySuggestions.innerHTML = '';
                    return;
                }

                citySuggestions.innerHTML = '<div class="autocomplete-loading">Пошук населеного пункту...</div>';
                citySuggestions.classList.add('active');

                cityDebounceTimer = setTimeout(async () => {
                    const list = await searchNPSettlements(query);
                    if (!list || list.length === 0) {
                        citySuggestions.innerHTML = '<div class="autocomplete-empty">Населений пункт не знайдено</div>';
                        return;
                    }

                    citySuggestions.innerHTML = list.map(item => `
                        <div class="autocomplete-item" data-ref="${item.Ref || ''}" data-name="${item.MainDescription || ''}" data-present="${item.Present || ''}">
                            <strong>${item.MainDescription}</strong>
                            <div class="autocomplete-item-sub">${item.Present}</div>
                        </div>
                    `).join('');
                }, 250);
            });

            citySuggestions.addEventListener('click', async (e) => {
                const item = e.target.closest('.autocomplete-item');
                if (!item) return;

                const mainName = item.getAttribute('data-name');
                const presentName = item.getAttribute('data-present');
                selectedSettlementRef = item.getAttribute('data-ref');
                selectedCityName = mainName;

                cityInput.value = presentName || mainName;
                citySuggestions.classList.remove('active');
                citySuggestions.innerHTML = '';

                // Reset cached branches for new city
                cachedWarehouses = [];
                cachedCargoWarehouses = [];

                // Clear branch inputs
                const npBranchInput = document.getElementById('order-np-branch');
                const npCargoInput = document.getElementById('order-np-cargo');
                if (npBranchInput) npBranchInput.value = '';
                if (npCargoInput) npCargoInput.value = '';

                // Automatically prefetch and focus branch input
                const currentType = checkoutForm.querySelector('input[name="delivery_type"]:checked')?.value;
                if (currentType === 'np' && npBranchInput) {
                    npBranchInput.focus();
                } else if (currentType === 'np_cargo' && npCargoInput) {
                    npCargoInput.focus();
                }
            });
        }

        // --- Autocomplete 2: Branch Search ---
        const setupBranchAutocomplete = (inputId, dropdownId, isCargoOnly) => {
            const input = document.getElementById(inputId);
            const dropdown = document.getElementById(dropdownId);
            if (!input || !dropdown) return;

            const renderBranches = (list) => {
                if (!list || list.length === 0) {
                    dropdown.innerHTML = '<div class="autocomplete-empty">Відділень не знайдено</div>';
                    return;
                }

                dropdown.innerHTML = list.slice(0, 100).map(w => `
                    <div class="autocomplete-item" data-desc="${w.description}">
                        <strong>Відділення №${w.number}</strong>
                        <div class="autocomplete-item-sub">${w.description}</div>
                    </div>
                `).join('');
            };

            const showBranches = async () => {
                const cityVal = cityInput?.value.trim();
                if (!selectedSettlementRef && !selectedCityName) {
                    if (cityVal) {
                        selectedCityName = cityVal;
                    } else {
                        dropdown.innerHTML = '<div class="autocomplete-empty">⚠️ Спочатку введіть та оберіть населений пункт вище</div>';
                        dropdown.classList.add('active');
                        return;
                    }
                }

                dropdown.innerHTML = '<div class="autocomplete-loading">Завантаження списку відділень...</div>';
                dropdown.classList.add('active');

                let cache = isCargoOnly ? cachedCargoWarehouses : cachedWarehouses;
                if (!cache || cache.length === 0) {
                    cache = await fetchNPWarehouses(selectedSettlementRef, selectedCityName, isCargoOnly);
                    if (isCargoOnly) cachedCargoWarehouses = cache;
                    else cachedWarehouses = cache;
                }

                const filterVal = input.value.trim().toLowerCase();
                let filtered = cache;
                if (filterVal) {
                    filtered = cache.filter(w => 
                        w.description.toLowerCase().includes(filterVal) || 
                        String(w.number).toLowerCase().includes(filterVal)
                    );
                }

                renderBranches(filtered);
            };

            input.addEventListener('focus', showBranches);
            input.addEventListener('input', async () => {
                dropdown.classList.add('active');
                let cache = isCargoOnly ? cachedCargoWarehouses : cachedWarehouses;
                if (!cache || cache.length === 0) {
                    await showBranches();
                    return;
                }
                const filterVal = input.value.trim().toLowerCase();
                const filtered = cache.filter(w => 
                    w.description.toLowerCase().includes(filterVal) || 
                    String(w.number).toLowerCase().includes(filterVal)
                );
                renderBranches(filtered);
            });

            dropdown.addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-item');
                if (!item) return;
                input.value = item.getAttribute('data-desc');
                dropdown.classList.remove('active');
            });
        };

        setupBranchAutocomplete('order-np-branch', 'order-np-branch-suggestions', false);
        setupBranchAutocomplete('order-np-cargo', 'order-np-cargo-suggestions', true);

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-wrapper')) {
                document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('active'));
            }
        });

        window.openCheckoutModal = () => {
            const cart = window.getCart ? window.getCart() : [];
            let html = '';
            let total = 0;
            
            cart.forEach(item => {
                const itemPrice = parseInt(item.price.toString().replace(/[^\d]/g, ''));
                total += itemPrice * (item.qty || 1);
                html += `
                    <div class="checkout-summary-item">
                        <span>${item.title} ${item.qty > 1 ? 'x'+item.qty : ''}</span>
                        <span>${item.price}</span>
                    </div>
                `;
            });
            
            html += `<div class="checkout-summary-item total-item">
                        <span>Разом:</span>
                        <span>${total} грн.</span>
                    </div>`;
            
            if (summaryList) summaryList.innerHTML = html;

            // --- Build delivery options from cart items ---
            const deliverySection = document.getElementById('checkout-delivery-section');
            const deliveryOptionsContainer = document.getElementById('checkout-delivery-options');
            if (deliverySection && deliveryOptionsContainer) {
                const getProductDelivery = (item) => {
                    if (item.delivery) return item.delivery;
                    if (typeof productsData !== 'undefined' && Array.isArray(productsData)) {
                        const found = productsData.find(p => p.title === item.title || p.id === item.id);
                        if (found && found.delivery) return found.delivery;
                    }
                    return null;
                };

                // Check if an item is ONLY cargo (cargo enabled, standard disabled)
                const isOnlyCargo = (d) => {
                    if (!d) return false;
                    // If cargo is on, but standard is OFF -> only cargo!
                    if (d.np_cargo === true && !d.np) return true;
                    if (d.cargo_only === true) return true;
                    return false;
                };

                // If ANY item in cart requires ONLY cargo branch
                const hasOnlyCargoItem = cart.some(item => isOnlyCargo(getProductDelivery(item)));

                // Check if courier is available (default enabled)
                const hasCourier = cart.every(item => {
                    const d = getProductDelivery(item);
                    if (!d) return true;
                    return d.np_courier !== false;
                });

                // Ukrposhta is shown ONLY if enabled for this product
                const hasUkrpost = cart.length > 0 && cart.every(item => {
                    const d = getProductDelivery(item);
                    return d && d.ukrpost === true;
                });

                const options = [];

                // 1. Nova Poshta branch:
                // Якщо товар відмічено Стандартне відділення або Стандартне+Грузове -> показувати загальне «📦 Нова Пошта».
                // Якщо ТІЛЬКИ грузове (стандартне вимкнено) -> показувати «🏭 Нова Пошта — тільки вантажні відділення».
                if (hasOnlyCargoItem) {
                    options.push({ key: 'np_cargo', label: '🏭 Нова Пошта — тільки вантажні відділення' });
                } else {
                    options.push({ key: 'np', label: '📦 Нова Пошта' });
                }

                // 2. Courier
                if (hasCourier) {
                    options.push({ key: 'np_courier', label: '🚗 Нова Пошта — Курʼєрська доставка' });
                }

                // 3. Ukrposhta (only if product supports it)
                if (hasUkrpost) {
                    options.push({ key: 'ukrpost', label: '🇺🇦 Укрпошта' });
                }

                deliverySection.style.display = 'block';
                deliveryOptionsContainer.innerHTML = options.map((opt, idx) => `
                    <label>
                        <input type="radio" name="delivery_type" value="${opt.key}" ${idx === 0 ? 'checked' : ''} style="accent-color:var(--accent-blue,#2563eb); width:16px; height:16px;">
                        ${opt.label}
                    </label>
                `).join('');

                showDeliveryFields(options[0].key);
            }

            checkoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeCheckoutModal = () => {
            checkoutModal.classList.remove('active');
            document.body.style.overflow = '';
            document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('active'));
        };

        closeCheckout?.addEventListener('click', closeCheckoutModal);
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) closeCheckoutModal();
        });

        checkoutForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'ВІДПРАВЛЯЄМО...';

            const formData = new FormData(checkoutForm);
            const deliveryType = formData.get('delivery_type') || checkoutForm.querySelector('input[name="delivery_type"]:checked')?.value || 'np';
            const deliveryLabels = {
                np:         'Нова Пошта (відділення)',
                np_cargo:   'Нова Пошта (тільки вантажні відділення)',
                np_courier: 'Нова Пошта (курʼєрська доставка)',
                ukrpost:    'Укрпошта (відділення)'
            };

            const cityVal = document.getElementById('order-city')?.value.trim() || formData.get('city') || '';
            const npBranchVal = document.getElementById('order-np-branch')?.value.trim() || formData.get('np_branch') || '';
            const npCargoVal = document.getElementById('order-np-cargo')?.value.trim() || formData.get('np_cargo_branch') || '';
            const courierAddressVal = document.getElementById('order-np-courier-address')?.value.trim() || formData.get('np_courier_address') || '';
            const ukrpostVal = document.getElementById('order-ukrpost-branch')?.value.trim() || formData.get('ukrpost_branch') || '';

            const branchVal = deliveryType === 'np_cargo' ? npCargoVal : (deliveryType === 'ukrpost' ? ukrpostVal : npBranchVal);

            const orderData = {
                name: formData.get('name') || document.getElementById('order-name')?.value.trim(),
                phone: formData.get('phone') || document.getElementById('order-phone')?.value.trim(),
                delivery: {
                    type: deliveryType,
                    label: deliveryLabels[deliveryType] || deliveryType,
                    city: cityVal,
                    branch: branchVal || npBranchVal || npCargoVal || ukrpostVal || '',
                    courier_address: courierAddressVal || ''
                },
                items: window.getCart(),
                total: document.querySelector('#order-summary-list .total-item span:last-child')?.textContent || 
                       document.querySelector('.cart-total span:last-child')?.textContent || '0 грн.'
            };

            try {
                const resp = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                
                const res = await resp.json();
                if (res.success) {
                    window.showSuccessModal();
                    window.clearCart();
                    closeCheckoutModal();
                    checkoutForm.reset();
                    showDeliveryFields(null);
                } else {
                    alert('Помилка при оформленні: ' + res.error);
                }
            } catch (err) {
                console.error(err);
                alert('Сталася помилка при відправці. Спробуйте пізніше.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    };

    // --- 6. UI Helpers ---
    window.showSuccessModal = () => {
        // 1. Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'success-modal-overlay';
        overlay.id = 'dynamic-success-modal';
        
        overlay.innerHTML = `
            <div class="success-modal-card">
                <div class="success-icon-box">
                    <span class="iconify" data-icon="material-symbols:check-circle-rounded" data-width="60"></span>
                </div>
                <h2>Дякуємо за замовлення!</h2>
                <p>Ваше замовлення успішно прийнято. Ми зв'яжемося з вами найближчим часом для уточнення деталей.</p>
                <button class="success-close-btn">Зрозуміло</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 2. Trigger animation
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // 3. Close logic
        const closeBtn = overlay.querySelector('.success-close-btn');
        const close = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 400);
        };
        
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) close();
        });
    };

    // --- 8. Back to Top Button ---
    const initBackToTop = () => {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.innerHTML = '<span class="iconify" data-icon="material-symbols:arrow-upward-rounded" data-width="24"></span>';
        btn.title = 'Вгору';
        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) btn.classList.add('visible');
            else btn.classList.remove('visible');
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    initReviewSlider();
    initDynamicCatalog();
    initDynamicProductPage();
    initProductPages();
    initShoppingCart();
    initCheckout();
    initBackToTop();

    // --- 7. Load Dynamic Data ---
    (async () => {
        try {
            const resp = await fetch('/api/products');
            const res = await resp.json();
            if (res.success && res.products && res.products.length > 0) {
                console.log('✅ Loaded fresh data from Supabase');
                // Re-initialize with new data
                initDynamicCatalog(res.products);
                initDynamicProductPage(res.products);
                
                // Also update cart UI since prices/titles might have changed
                if (window.updateCartUI) window.updateCartUI();
            }
        } catch (e) {
            console.error('❌ Failed to fetch dynamic data:', e);
        }
    })();
});
