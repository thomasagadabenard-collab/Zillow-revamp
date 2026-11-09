import { useEffect, useState } from "react";
import "../../css/PropertyDetails.css";

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PropertyDetails({ property, onClose, onBuy, buying = false }) {
  const images = property.media?.length
    ? property.media
    : (property.images || []).map((item) => typeof item === 'string' ? { url: item, mediaType: 'IMAGE' } : item);
  if (!images.length && property.image) images.push({ url: property.image, mediaType: 'IMAGE' });

  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();

      if (images.length && event.key === "ArrowRight") {
        setActiveImage((current) => (current + 1) % images.length);
      }

      if (images.length && event.key === "ArrowLeft") {
        setActiveImage(
          (current) => (current - 1 + images.length) % images.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  function showPreviousImage() {
    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function showNextImage() {
    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div
      className="property-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="property-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-details-title"
      >
        <button
          type="button"
          className="property-modal-close"
          onClick={onClose}
          aria-label="Close property details"
        >
          ×
        </button>

        {/* IMAGE GALLERY */}
        <div className="property-gallery">
          <div className="property-main-image">
            {images.length > 0 ? (
              images[activeImage]?.mediaType === 'VIDEO'
                ? <video src={images[activeImage].url} controls playsInline preload="metadata" aria-label={`${property.title} video ${activeImage + 1}`} />
                : <img src={images[activeImage]?.url} alt={`${property.title} - photo ${activeImage + 1}`} />
            ) : (
              <div className="property-image-placeholder">
                No property image available
              </div>
            )}

            {property.featured && (
              <span className="property-gallery-featured">Featured</span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="property-gallery-arrow property-gallery-arrow--left"
                  onClick={showPreviousImage}
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="property-gallery-arrow property-gallery-arrow--right"
                  onClick={showNextImage}
                  aria-label="Next image"
                >
                  ›
                </button>

                <span className="property-image-counter">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="property-thumbnails">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`property-thumbnail ${
                    activeImage === index
                      ? "property-thumbnail--active"
                      : ""
                  }`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View property image ${index + 1}`}
                  aria-pressed={activeImage === index}
                >
                  {image.mediaType === 'VIDEO' ? <video src={image.url} muted preload="metadata" aria-hidden="true" /> : <img src={image.url} alt="" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PROPERTY INFORMATION */}
        <div className="property-details-content">
          <div className="property-details-heading">
            <div>
              <span className="property-details-type">{property.type}</span>
              <h2 id="property-details-title">{property.title}</h2>

              <p className="property-details-location">
                <span aria-hidden="true">⌖</span>
                {property.location}
              </p>
            </div>

            <div className="property-details-price">
              <span>Asking Price</span>
              <strong>{formatPrice(property.price, property.currency || 'USD')}</strong>
            </div>
          </div>

          {/* QUICK FACTS */}
          <div className="property-quick-facts">
            <div>
              <span className="property-fact-icon">🛏</span>
              <strong>{property.bedrooms ?? "—"}</strong>
              <span>Bedrooms</span>
            </div>

            <div>
              <span className="property-fact-icon">🛁</span>
              <strong>{property.bathrooms ?? "—"}</strong>
              <span>Bathrooms</span>
            </div>

            <div>
              <span className="property-fact-icon">⌂</span>
              <strong>{property.kitchens ?? "—"}</strong>
              <span>Kitchens</span>
            </div>

            <div>
              <span className="property-fact-icon">⌂</span>
              <strong>{property.area || "—"}</strong>
              <span>Property Size</span>
            </div>

            <div>
              <span className="property-fact-icon">▦</span>
              <strong>{property.yearBuilt || "—"}</strong>
              <span>Year Built</span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="property-details-section">
            <h3>About this property</h3>
            <p>
              {property.description ||
                "Contact our team for more information about this property."}
            </p>
          </div>

          {/* FEATURES */}
          {property.features?.length > 0 && (
            <div className="property-details-section">
              <h3>Property features</h3>

              <div className="property-features-list">
                {property.features.map((feature, index) => (
                  <div key={`${feature}-${index}`}>
                    <span>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PURCHASE AREA */}
          <div className="property-purchase-area">
            <div>
              <span>Interested in this property?</span>
              <p>Checkout is priced in USD and settled in BTC.</p>
            </div>

            <button
              type="button"
              className="property-buy-button"
              disabled={buying}
              onClick={() => onBuy(property)}
            >
              {buying ? 'Opening BTC invoice…' : 'Buy with BTC'}
              <span>→</span>
            </button>
          </div>

          <p className="property-details-disclaimer">
            Property information and images should be verified before
            making a purchase. Prices are displayed in US dollars.
          </p>
        </div>
      </section>
    </div>
  );
}
