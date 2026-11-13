import React, { useEffect, useMemo, useState } from 'react';
import { categories, posts } from './data.js';

function Header({ onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="header">
      <div className="shell header-inner">
        <a className="brand" href="#" onClick={() => setMenuOpen(false)}><span className="brand-mark">✳</span><span>The Good Edit</span></a>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
        <nav className={menuOpen ? 'nav open' : 'nav'}>
          <a href="#guides" onClick={() => setMenuOpen(false)}>Buying guides</a>
          <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <button className="search-btn" onClick={onSearch} aria-label="Search">⌕</button>
      </div>
    </header>
  );
}

function PostCard({ post, onOpen }) {
  return (
    <article className="post-card" onClick={() => onOpen(post)} tabIndex="0" onKeyDown={e => e.key === 'Enter' && onOpen(post)}>
      <img src={post.image} alt="" loading="lazy" />
      <div className="post-meta">{post.tag}<span>·</span>{post.read}</div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <button className="read-link" onClick={() => onOpen(post)}>Read the guide ↗</button>
    </article>
  );
}

export default function App() {
  const [activePost, setActivePost] = useState(null);
  const [allPosts, setAllPosts] = useState(posts);
  useEffect(() => { fetch('/api/articles').then(r => r.ok ? r.json() : null).then(data => { if (data?.articles?.length) setAllPosts(data.articles); }).catch(() => {}); }, []);
  useEffect(() => { fetch('/api/track', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({type:'page_view',path:window.location.pathname}) }).catch(() => {}); }, []);
  useEffect(() => { if (activePost) fetch('/api/track', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({type:'page_view',path:'/articles/'+activePost.slug,slug:activePost.slug}) }).catch(() => {}); }, [activePost]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const filteredPosts = useMemo(() => allPosts.filter(post => {
    const matchesCategory = category === 'all' || categories.find(c => c.name === post.category)?.slug === category;
    const text = [post.title, post.excerpt, post.category].join(' ').toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [allPosts, category, query]);

  const openPost = post => {
    setActivePost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header onSearch={() => { setSearchOpen(!searchOpen); setActivePost(null); }} />
      {searchOpen && <div className="search-panel shell">
        <input autoFocus placeholder="Search practical guides..." value={query} onChange={e => { setQuery(e.target.value); setActivePost(null); }} />
        <button onClick={() => { setQuery(''); setSearchOpen(false); }}>Close</button>
      </div>}

      {activePost ? (
        <main className="shell article">
          <button className="back" onClick={() => setActivePost(null)}>← Back to all guides</button>
          <div className="article-head">
            <span className="eyebrow">{activePost.category} · {activePost.tag}</span>
            <h1>{activePost.title}</h1>
            <p>{activePost.excerpt}</p>
            <small>November 2026 &nbsp;·&nbsp; {activePost.read}</small>
          </div>
          <img className="article-cover" src={activePost.image} alt="" />
          <div className="article-body">
            <p className="lead">{activePost.intro}</p>
            {activePost.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
            {activePost.products?.length > 0 && <section className="article-products"><h2>Products in this guide</h2>{activePost.products.map(product => <div className="article-product" key={product.id || product.name}>{product.image && <img src={product.image} alt={product.name}/>}<div><h3>{product.name}</h3>{product.price && <strong>{product.price}</strong>}<p>{product.description}</p><a href={product.affiliateUrl} target="_blank" rel="sponsored nofollow noopener" onClick={() => fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'affiliate_click',path:'/articles/'+activePost.slug,slug:activePost.slug,product:product.name})}).catch(()=>{})}>Check price on Amazon ↗</a></div></div>)}</section>}
            <div className="note"><strong>Editorial note</strong><p>This guide is for general information. Check current product details, compatibility, pricing and seller terms before making a purchase.</p></div>
            <p className="disclosure">As an Amazon Associate I earn from qualifying purchases. This site may contain affiliate links. If you buy through them, we may earn a commission at no extra cost to you.</p>
          </div>
        </main>
      ) : (
        <main>
          <section className="hero shell">
            <div className="hero-copy">
              <span className="eyebrow pill">✦ &nbsp; THE THOUGHTFUL SHOPPING EDIT</span>
              <h1>Find your next<br /><em>good thing.</em></h1>
              <p>Less scrolling. Better decisions. Thoughtful guides to useful products for everyday life.</p>
              <div className="hero-actions"><a className="button dark" href="#guides">Explore the guides →</a><a className="simple-link" href="#about">Get to know us ↗</a></div>
              <div className="hero-note"><i /> Independent guides for more considered shopping</div>
            </div>
            <div className="hero-art">
              <img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85" alt="Thoughtfully arranged lifestyle objects" />
              <div className="sticker">THE GOOD<br /><b>finds.</b><small>EDITED WITH CARE</small></div>
              <div className="image-caption">EVERYDAY DISCOVERIES <span>Curated, not crowded.</span></div>
            </div>
          </section>

          <section id="categories" className="categories section">
            <div className="shell">
              <div className="section-head"><div><span className="eyebrow">BROWSE BY INTEREST</span><h2>A little something for<br />every corner of life.</h2></div><p>Practical picks and helpful advice, organized around the things you use every day.</p></div>
              <div className="category-grid">
                {categories.map(item => <button key={item.slug} className={category === item.slug ? 'category active' : 'category'} onClick={() => { setCategory(item.slug); document.getElementById('guides').scrollIntoView({ behavior: 'smooth' }); }}>
                  <span>{item.icon}</span><div><strong>{item.name}</strong><small>{item.desc}</small></div><b>↗</b>
                </button>)}
              </div>
            </div>
          </section>

          <section id="guides" className="section shell">
            <div className="section-head"><div><span className="eyebrow">THE LATEST EDIT</span><h2>{category === 'all' ? 'Ideas worth your time.' : categories.find(c => c.slug === category)?.name}</h2></div><button className="simple-link" onClick={() => setCategory('all')}>View all guides ↗</button></div>
            {query && <p className="results">Search results for “{query}”</p>}
            <div className="post-grid">{filteredPosts.map(post => <PostCard key={post.slug} post={post} onOpen={openPost} />)}</div>
            {filteredPosts.length === 0 && <div className="empty">No guides found. Try another search or browse all categories.</div>}
          </section>

          <section className="manifesto"><div className="shell manifesto-inner"><span className="manifesto-icon">▤</span><div><span className="eyebrow">OUR POINT OF VIEW</span><h2>Good shopping starts<br />with <em>good information.</em></h2></div><p>We make the details easier to understand, so you can spend less time comparing tabs and more time choosing what genuinely works for you.</p></div></section>
          <section id="about" className="about section shell"><div><span className="eyebrow">A NOTE FROM THE EDIT</span><h2>Thoughtful finds.<br /><em>Zero noise.</em></h2></div><p>The Good Edit is an independent product discovery publication. We create practical guides to help readers make more informed everyday buying decisions. We aim to explain what matters, what to compare and what to consider before purchasing.</p></section>
        </main>
      )}

      <footer className="footer">
        <div className="shell footer-top">
          <div><a className="brand" href="#"><span className="brand-mark">✳</span><span>The Good Edit</span></a><p>Less scrolling. Better decisions. Thoughtful guides for everyday life.</p></div>
          <div><b>Explore</b><a href="#guides">Buying guides</a><a href="#categories">Categories</a></div>
          <div><b>Information</b><a href="#about">About us</a><a href="#disclosure">Affiliate disclosure</a><a href="#privacy">Privacy policy</a><a href="mailto:hello@example.com">Contact</a></div>
        </div>
        <div className="shell footer-bottom"><span>© 2026 The Good Edit. All rights reserved.</span><span>As an Amazon Associate I earn from qualifying purchases.</span></div>
      </footer>
      <div id="disclosure" className="legal shell"><h2>Affiliate disclosure</h2><p>As an Amazon Associate I earn from qualifying purchases. Some links may be affiliate links, which means we may earn a commission if you purchase through them, at no additional cost to you. Our editorial content is intended to help readers make informed decisions.</p><h2 id="privacy">Privacy</h2><p>This starter site does not currently collect personal information or use analytics cookies. Update this notice before adding forms, analytics or other tracking technologies.</p></div>
    </>
  );
}