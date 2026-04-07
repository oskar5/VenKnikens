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
                    <div class="product-card" data-id="${prod.id}">
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
                    renderProducts(cat, sub);
                }
            });
        }

        renderProducts('Категорії', null);
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

        document.getElementById('dyn-breadcrumb').textContent = product.title;
        document.getElementById('dyn-title').textContent = product.title;
        document.getElementById('dyn-sku').textContent = 'Артикул: ' + (product.sku || '');
        document.getElementById('dyn-price').textContent = product.price + ' грн.';
        document.getElementById('dyn-old-price').textContent = product.oldPrice ? (product.oldPrice + ' грн.') : '';
        document.getElementById('dyn-desc').innerText = product.description.replace(/\\n/g, '\n') || '';

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
                const headImg = product.colors && product.colors[0] ? product.colors[0].image : (product.images ? product.images[0] : '');
                const headName = product.variantColor || (product.colors && product.colors[0] ? product.colors[0].name : 'Варіант');
                colorHead.innerHTML = `<img src="${headImg}" alt="${headName}" class="color-thumb-sm"><span>${headName}</span>`;
            }
            if (mainImg) {
                mainImg.src = product.colors && product.colors[0] ? product.colors[0].image : (product.images ? product.images[0] : '');
            }
            
            let colorHtml = '';
            
            // Add internal colors (variants within the same product)
            if (product.colors) {
                product.colors.forEach((c, idx) => {
                    colorHtml += `
                        <li class="color-option" data-color="${c.name}" data-img="${c.image}">
                            <img src="${c.image}" alt="${c.name}" class="color-thumb-sm">
                            <span>${c.name}</span>
                        </li>
                    `;
                    allImages.push(c.image);
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
            for (const [key, value] of Object.entries(product.specs)) {
                specsHtml += `<div class="m-spec-row"><span class="m-spec-label">${key}</span><span class="m-spec-value">${value}</span></div>`;
            }
        }
        if (specsList) specsList.innerHTML = specsHtml;
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
                    window.addToCart({ title, price, image, qty });
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
                
                cart.push({ title, price, image, qty: 1 });
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
            
            html += `<div class="checkout-summary-item" style="font-weight:700; margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                        <span>Разом:</span>
                        <span>${total} грн.</span>
                    </div>`;
            
            if (summaryList) summaryList.innerHTML = html;
            checkoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeCheckoutModal = () => {
            checkoutModal.classList.remove('active');
            document.body.style.overflow = '';
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
            const orderData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                items: window.getCart(),
                total: document.querySelector('.cart-total span:last-child')?.textContent || '0 грн.'
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

    initReviewSlider();
    initDynamicCatalog();
    initDynamicProductPage();
    initProductPages();
    initShoppingCart();
    initCheckout();

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
