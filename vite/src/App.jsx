import { useEffect, useMemo, useState } from 'react'
import './App.css'

const categories = ['All', 'Home', 'Accessories', 'Lighting', 'Furniture']
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const productsPerPage = 4
const freeShippingAmount = 100
const fallbackProductImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 740"><rect width="600" height="740" fill="#e8e6dc"/><path d="M0 540h600v200H0z" fill="#dedbd1"/><text x="300" y="365" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#687265">forma.</text></svg>')}`

function readStoredArray(key, isValid) {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.every(isValid) ? parsed : []
  } catch (storageError) {
    console.error(`Could not restore ${key} from browser storage.`, storageError)
    return []
  }
}

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => readStoredArray(
    'forma-cart',
    (item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0,
  ))
  const [favorites, setFavorites] = useState(() => readStoredArray('forma-favorites', Number.isInteger))
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [maxPrice, setMaxPrice] = useState('650')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [customer, setCustomer] = useState({ customerName: '', email: '', address: '' })
  const [detailQuantity, setDetailQuantity] = useState(1)
  const [route, setRoute] = useState(() => window.location.pathname)
  const [page, setPage] = useState(() => Math.max(1, Math.floor(Number(new URLSearchParams(window.location.search).get('page')) || 1)))

  useEffect(() => {
    function syncLocation() {
      setRoute(window.location.pathname)
      setPage(Math.max(1, Math.floor(Number(new URLSearchParams(window.location.search).get('page')) || 1)))
    }
    window.addEventListener('popstate', syncLocation)
    return () => window.removeEventListener('popstate', syncLocation)
  }, [])

  useEffect(() => {
    fetch('/api/products')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load products from the store.')
        return response.json()
      })
      .then(setProducts)
      .catch((loadError) => setError(`${loadError.message} Check that the Spring Boot API and MySQL are running.`))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('forma-cart', JSON.stringify(cart))
    } catch (storageError) {
      console.error('Could not save the shopping bag in browser storage.', storageError)
    }
  }, [cart])

  useEffect(() => {
    try {
      window.localStorage.setItem('forma-favorites', JSON.stringify(favorites))
    } catch (storageError) {
      console.error('Could not save favorites in browser storage.', storageError)
    }
  }, [favorites])

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category
    const matchesSearch = `${product.name} ${product.description} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesPrice = product.price <= Number(maxPrice)
    const matchesStock = !inStockOnly || product.stock > 0
    const matchesFavorites = route !== '/wishlist' || favorites.includes(product.id)
    return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesFavorites
  }), [products, category, search, maxPrice, inStockOnly, route, favorites])
  const visibleProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    if (sortBy === 'price-low') sorted.sort((first, second) => first.price - second.price)
    if (sortBy === 'price-high') sorted.sort((first, second) => second.price - first.price)
    if (sortBy === 'name') sorted.sort((first, second) => first.name.localeCompare(second.name))
    if (sortBy === 'stock') sorted.sort((first, second) => second.stock - first.stock)
    return sorted
  }, [filteredProducts, sortBy])
  const pageCount = Math.ceil(visibleProducts.length / productsPerPage)
  const currentPage = Math.min(page, Math.max(pageCount, 1))
  const pageProducts = visibleProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
  const hasActiveFilters = category !== 'All' || search !== '' || maxPrice !== '650' || inStockOnly || sortBy !== 'featured'
  const productId = route.match(/^\/products\/(\d+)\/?$/)?.[1]
  const selectedProduct = productId ? products.find((product) => product.id === Number(productId)) : null
  const relatedProducts = selectedProduct
    ? products.filter((product) => product.id !== selectedProduct.id && product.category === selectedProduct.category).slice(0, 4)
    : []

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const shippingRemaining = Math.max(0, freeShippingAmount - subtotal)

  function navigate(path) {
    window.history.pushState({}, '', path)
    setRoute(window.location.pathname)
    setDetailQuantity(1)
    setPage(Math.max(1, Math.floor(Number(new URLSearchParams(window.location.search).get('page')) || 1)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToPage(nextPage) {
    const next = Math.min(Math.max(nextPage, 1), Math.max(pageCount, 1))
    const query = next === 1 ? '' : `?page=${next}`
    const targetRoute = route === '/wishlist' ? '/wishlist' : '/'
    window.history.pushState({}, '', `${targetRoute}${query}${targetRoute === '/' ? '#shop' : ''}`)
    setRoute(targetRoute)
    setPage(next)
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  function resetCollection() {
    setCategory('All')
    setSearch('')
    window.history.pushState({}, '', '/#shop')
    setRoute('/')
    setPage(1)
    window.setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  function toggleFavorite(product) {
    const isFavorite = favorites.includes(product.id)
    setFavorites((saved) => isFavorite
      ? saved.filter((id) => id !== product.id)
      : [...saved, product.id])
    setNotice(isFavorite ? 'Removed from your saved pieces' : `${product.name} saved for later`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  function resetFilters() {
    setCategory('All')
    setSearch('')
    setMaxPrice('650')
    setInStockOnly(false)
    setSortBy('featured')
    setPage(1)
    const targetRoute = route === '/wishlist' ? '/wishlist' : '/'
    window.history.replaceState({}, '', targetRoute === '/' ? '/#shop' : targetRoute)
  }

  function addToCart(product) {
    const existing = cart.find((item) => item.id === product.id)
    if (existing && existing.quantity >= product.stock) {
      setNotice(`Only ${product.stock} available`)
      window.setTimeout(() => setNotice(''), 2200)
      return
    }
    setCart((items) => {
      const found = items.find((item) => item.id === product.id)
      return found
        ? items.map((item) => item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item)
        : [...items, { ...product, quantity: 1 }]
    })
    setNotice(`${product.name} added to your bag`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  function changeQuantity(productId, amount) {
    setCart((items) => items
      .map((item) => item.id === productId
        ? { ...item, quantity: Math.min(item.quantity + amount, item.stock) }
        : item)
      .filter((item) => item.quantity > 0))
  }

  function addProductQuantity(product, quantity) {
    const existing = cart.find((item) => item.id === product.id)
    if ((existing?.quantity || 0) + quantity > product.stock) {
      setNotice(`Only ${product.stock} available`)
      window.setTimeout(() => setNotice(''), 2200)
      return
    }
    setCart((items) => {
      const found = items.find((item) => item.id === product.id)
      return found
        ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...items, { ...product, quantity }]
    })
    setNotice(`${product.name} added to your bag`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  function renderShopFilters() {
    return (
      <div className="shop-filters">
        <span className="results-count">{visibleProducts.length} products</span>
        <label className="sort-control">Sort
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1) }}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
            <option value="stock">In stock first</option>
          </select>
        </label>
        <label className="price-filter">Up to {money.format(Number(maxPrice))}
          <input aria-label="Maximum price" type="range" min="25" max="650" step="25" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1) }} />
        </label>
        <label className="stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => { setInStockOnly(event.target.checked); setPage(1) }} /> In stock</label>
        {hasActiveFilters && <button className="clear-filters" type="button" onClick={resetFilters}>Clear filters</button>}
      </div>
    )
  }

  function renderProductCard(product, index) {
    const isFavorite = favorites.includes(product.id)
    return (
      <article className="product-card" key={product.id}>
        <div className={`product-image product-tone-${index % 4}`}>
          <a className="product-link-image" href={`/products/${product.id}`} onClick={(event) => { event.preventDefault(); navigate(`/products/${product.id}`) }} aria-label={`View ${product.name}`}>
            <img src={product.imageUrl} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackProductImage }} />
          </a>
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <button className={isFavorite ? 'favorite-button saved' : 'favorite-button'} type="button" onClick={() => toggleFavorite(product)} aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Save ${product.name} to favorites`} aria-pressed={isFavorite}>
            {isFavorite ? '♥' : '♡'}
          </button>
          <button className="quick-add" type="button" onClick={() => addToCart(product)} disabled={product.stock < 1}>
            {product.stock < 1 ? 'Sold out' : 'Add to bag'} <span>＋</span>
          </button>
        </div>
        <div className="product-info">
          <div><h3><a href={`/products/${product.id}`} onClick={(event) => { event.preventDefault(); navigate(`/products/${product.id}`) }}>{product.name}</a></h3><p>{product.category}</p></div>
          <span>{money.format(product.price)}</span>
        </div>
      </article>
    )
  }

  async function placeOrder(event) {
    event.preventDefault()
    setPlacingOrder(true)
    setError('')
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customer,
          items: cart.map(({ id, quantity }) => ({ productId: id, quantity })),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'We could not place your order.')
      setNotice(`Order #${result.id} confirmed — thank you!`)
      setCart([])
      setCheckoutOpen(false)
      setCartOpen(false)
      const refreshed = await fetch('/api/products')
      if (refreshed.ok) setProducts(await refreshed.json())
    } catch (orderError) {
      setError(orderError.message)
    } finally {
      setPlacingOrder(false)
      window.setTimeout(() => setNotice(''), 4500)
    }
  }

  return (
    <div className="store">
      <div className="announcement">A little something extra — complimentary shipping on orders over $100</div>
      <header className="site-header">
        <a className="wordmark" href="/#shop" onClick={(event) => { event.preventDefault(); resetCollection() }} aria-label="Forma home">forma<span>.</span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="/#shop" onClick={(event) => { event.preventDefault(); resetCollection() }}>Shop all</a>
          <a href="/#shop" onClick={(event) => { event.preventDefault(); setCategory('Home'); setPage(1); window.history.pushState({}, '', '/#shop'); setRoute('/'); window.setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 0) }}>Objects</a>
          <a href="#story">Our story</a>
        </nav>
        <div className="header-actions">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search products" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); if (route !== '/' && route !== '/wishlist') setRoute('/'); window.history.replaceState({}, '', route === '/wishlist' ? '/wishlist' : '/#shop') }} placeholder="Search" />
          </label>
          <button className={route === '/wishlist' ? 'saved-button active' : 'saved-button'} type="button" onClick={() => navigate('/wishlist')} aria-label={`View saved pieces, ${favorites.length} saved`} title="Saved pieces">♡ <span>{favorites.length}</span></button>
          <button className="bag-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${itemCount} items`}>
            Bag <span>{itemCount}</span>
          </button>
        </div>
      </header>

      <main>
        {route === '/wishlist' ? (
          <section className="shop-section wishlist-section" id="shop">
            <div className="section-heading">
              <div><p className="eyebrow">Kept close</p><h2>Your saved pieces</h2></div>
              <span className="product-total">{favorites.length} saved pieces</span>
            </div>
            <div className="shop-toolbar">
              <div className="category-list" aria-label="Filter saved pieces by category">
                {categories.map((name) => (
                  <button className={category === name ? 'category active' : 'category'} key={name} type="button" onClick={() => { setCategory(name); setPage(1); window.history.replaceState({}, '', '/wishlist') }}>{name}</button>
                ))}
              </div>
              {renderShopFilters()}
            </div>
            {loading && <p className="state-message">Finding your saved pieces…</p>}
            {error && <p className="state-message error-message">{error}</p>}
            {!loading && !error && visibleProducts.length === 0 && (
              <div className="empty-wishlist">
                <p className="empty-wishlist-mark">♡</p>
                <h2>{favorites.length === 0 ? 'A little room for a favorite.' : 'No saved pieces in this selection.'}</h2>
                <p>Tap the heart on anything you love. We’ll keep it here for you.</p>
                <button className="button button-dark" type="button" onClick={resetCollection}>Explore the collection <span>→</span></button>
              </div>
            )}
            {visibleProducts.length > 0 && <div className="product-grid">{pageProducts.map(renderProductCard)}</div>}
            {pageCount > 1 && (
              <nav className="pagination" aria-label="Saved piece pages">
                <button className="page-arrow" type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">←</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                  <button className={number === currentPage ? 'page-number active' : 'page-number'} key={number} type="button" onClick={() => goToPage(number)} aria-current={number === currentPage ? 'page' : undefined}>{String(number).padStart(2, '0')}</button>
                ))}
                <button className="page-arrow" type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page">→</button>
              </nav>
            )}
          </section>
        ) : productId ? (
          loading ? <p className="state-message">Finding the good things…</p> : selectedProduct ? (
            <>
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                <a href="/#shop" onClick={(event) => { event.preventDefault(); resetCollection() }}>Shop all</a><span>/</span><span>{selectedProduct.category}</span><span>/</span><span>{selectedProduct.name}</span>
              </nav>
              <section className="detail-layout">
                <div className="detail-image">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                  {selectedProduct.badge && <span className="product-badge">{selectedProduct.badge}</span>}
                </div>
                <div className="detail-copy">
                  <p className="eyebrow">{selectedProduct.category}</p>
                  <h1>{selectedProduct.name}</h1>
                  <p className="detail-price">{money.format(selectedProduct.price)}</p>
                  <div className="detail-rule" />
                  <p className="detail-description">{selectedProduct.description}</p>
                  <p className="stock-note">{selectedProduct.stock > 0 ? 'In stock — ready for a new home' : 'Currently sold out'}</p>
                  <div className="detail-purchase">
                    <div className="detail-quantity" aria-label="Select quantity">
                      <button type="button" onClick={() => setDetailQuantity((quantity) => Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
                      <span>{detailQuantity}</span>
                      <button type="button" onClick={() => setDetailQuantity((quantity) => Math.min(selectedProduct.stock, quantity + 1))} disabled={detailQuantity >= selectedProduct.stock} aria-label="Increase quantity">＋</button>
                    </div>
                    <button className="button button-dark detail-add" type="button" disabled={selectedProduct.stock < 1} onClick={() => addProductQuantity(selectedProduct, detailQuantity)}>
                      {selectedProduct.stock < 1 ? 'Sold out' : 'Add to bag'} <span>＋</span>
                    </button>
                    <button className={favorites.includes(selectedProduct.id) ? 'detail-save saved' : 'detail-save'} type="button" onClick={() => toggleFavorite(selectedProduct)} aria-label={favorites.includes(selectedProduct.id) ? 'Remove from saved pieces' : 'Save this piece'} aria-pressed={favorites.includes(selectedProduct.id)}>{favorites.includes(selectedProduct.id) ? '♥' : '♡'}</button>
                  </div>
                  <div className="detail-perks"><p><span>↗</span> Complimentary shipping over $100</p><p><span>↗</span> Considered, recyclable packaging</p><p><span>↗</span> Thoughtfully made to last</p></div>
                </div>
              </section>
              {relatedProducts.length > 0 && (
                <section className="related-section">
                  <div className="section-heading"><div><p className="eyebrow">A little more to love</p><h2>Pairs well with</h2></div></div>
                  <div className="product-grid">{relatedProducts.map((product, index) => (
                    <article className="product-card" key={product.id}>
                      <div className={`product-image product-tone-${index % 4}`}>
                        <a className="product-link-image" href={`/products/${product.id}`} onClick={(event) => { event.preventDefault(); navigate(`/products/${product.id}`) }} aria-label={`View ${product.name}`}><img src={product.imageUrl} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackProductImage }} /></a>
                        <button className="quick-add" type="button" onClick={() => addToCart(product)} disabled={product.stock < 1}>{product.stock < 1 ? 'Sold out' : 'Add to bag'} <span>＋</span></button>
                      </div>
                      <div className="product-info"><div><h3><a href={`/products/${product.id}`} onClick={(event) => { event.preventDefault(); navigate(`/products/${product.id}`) }}>{product.name}</a></h3><p>{product.category}</p></div><span>{money.format(product.price)}</span></div>
                    </article>
                  ))}</div>
                </section>
              )}
            </>
          ) : (
            <section className="not-found"><p className="eyebrow">A little detour</p><h1>That piece isn't here.</h1><p>It may have moved on to a new home.</p><button className="button button-dark" type="button" onClick={resetCollection}>Back to the collection <span>→</span></button></section>
          )
        ) : (
          <>
        <section className="hero" id="story">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=85"
            alt="A sunlit, thoughtfully furnished modern living room"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">A calmer kind of home</p>
            <h1>Make room<br />for good things.</h1>
            <p>Considered pieces for the everyday. Made to be lived in, and loved for a long time.</p>
            <a className="button button-light" href="#shop">Explore the collection <span>↗</span></a>
          </div>
          <span className="hero-index">01 — 04</span>
        </section>

        <section className="intro">
          <p className="eyebrow">Less, but better</p>
          <h2>Good design isn't loud.<br />It just feels right.</h2>
          <p>Useful, beautiful things that make your everyday a little more yours.</p>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The collection</p>
              <h2>Objects to keep close</h2>
            </div>
            <span className="product-total">{products.length} considered pieces</span>
          </div>
          <div className="shop-toolbar">
            <div className="category-list" aria-label="Filter by category">
              {categories.map((name) => (
                <button className={category === name ? 'category active' : 'category'} key={name} onClick={() => { setCategory(name); setPage(1); window.history.replaceState({}, '', '/#shop') }} type="button">
                  {name}
                </button>
              ))}
            </div>
            {renderShopFilters()}
          </div>

          {loading && <p className="state-message">Finding the good things…</p>}
          {error && !checkoutOpen && <p className="state-message error-message">{error}</p>}
          {!loading && !error && visibleProducts.length === 0 && <p className="state-message">No pieces found. Try another search.</p>}
          {visibleProducts.length > 0 && <div className="product-grid">{pageProducts.map(renderProductCard)}</div>}
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button className="page-arrow" type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">←</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button className={number === currentPage ? 'page-number active' : 'page-number'} key={number} type="button" onClick={() => goToPage(number)} aria-current={number === currentPage ? 'page' : undefined}>{String(number).padStart(2, '0')}</button>
              ))}
              <button className="page-arrow" type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page">→</button>
            </nav>
          )}
        </section>

        <section className="promise">
          <p className="eyebrow">The forma feeling</p>
          <div className="promise-grid">
            <article><span>01</span><h3>Made to last</h3><p>Thoughtful materials, honest craftsmanship, no shortcuts.</p></article>
            <article><span>02</span><h3>Easy by nature</h3><p>Useful pieces that settle in and make themselves at home.</p></article>
            <article><span>03</span><h3>A lighter footprint</h3><p>Less waste, considered packaging, and better choices at every step.</p></article>
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <a className="wordmark" href="/#shop" onClick={(event) => { event.preventDefault(); resetCollection() }}>forma<span>.</span></a>
        <p>Everyday, thoughtfully.</p>
        <span>© 2026 Forma Studio</span>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}

      {cartOpen && (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="cart-panel" aria-label="Shopping bag">
            <div className="panel-heading"><div><p className="eyebrow">Your selection</p><h2>Your bag <span>({itemCount})</span></h2></div><button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button></div>
            {cart.length === 0 ? <div className="empty-cart"><p>Your bag is taking a little breather.</p><button className="button button-dark" type="button" onClick={() => setCartOpen(false)}>Find something lovely</button></div> : <>
              <div className="cart-items">{cart.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img src={item.imageUrl} alt="" />
                  <div className="cart-item-copy"><h3>{item.name}</h3><p>{money.format(item.price)}</p><div className="quantity"><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} disabled={item.quantity >= item.stock} aria-label={`Add one ${item.name}`}>＋</button></div></div>
                  <strong>{money.format(item.price * item.quantity)}</strong>
                </article>
              ))}</div>
              <div className="cart-summary">
                {shippingRemaining > 0
                  ? <p className="shipping-message">You’re {money.format(shippingRemaining)} away from complimentary shipping.</p>
                  : <p className="shipping-message shipping-earned">You’ve unlocked complimentary shipping.</p>}
                <div className="shipping-meter" role="progressbar" aria-label="Progress toward complimentary shipping" aria-valuemin="0" aria-valuemax={freeShippingAmount} aria-valuenow={Math.min(subtotal, freeShippingAmount)}><span style={{ width: `${Math.min(subtotal / freeShippingAmount * 100, 100)}%` }} /></div>
                <p><span>Subtotal</span><strong>{money.format(subtotal)}</strong></p><small>Shipping calculated at checkout.</small><button className="button button-dark checkout-button" type="button" onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}>Continue to checkout <span>→</span></button>
              </div>
            </>}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setCheckoutOpen(false)}>
          <section className="checkout-panel" aria-label="Checkout">
            <div className="panel-heading"><div><p className="eyebrow">Almost yours</p><h2>Delivery details</h2></div><button className="close-button" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button></div>
            <p className="checkout-note">This demo places an order in the store. Payment is not collected.</p>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <form className="checkout-form" onSubmit={placeOrder}>
              <label>Full name<input required value={customer.customerName} onChange={(event) => setCustomer({ ...customer, customerName: event.target.value })} /></label>
              <label>Email address<input required type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} /></label>
              <label>Delivery address<textarea required rows="3" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} /></label>
              <div className="checkout-total"><span>Order total</span><strong>{money.format(subtotal)}</strong></div>
              <button className="button button-dark checkout-button" type="submit" disabled={placingOrder}>{placingOrder ? 'Placing your order…' : 'Place demo order'} <span>→</span></button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
