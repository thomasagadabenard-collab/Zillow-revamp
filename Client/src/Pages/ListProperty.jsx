import { useState } from "react";
import { api } from "../api.js";
import "../css/ListProperty.css";
import RealEstateFooter from "../Components/Common/RealEstateFooter";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  title: "",
  propertyType: "",
  city: "",
  address: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  kitchens: "1",
  description: "",
};

export default function ListProperty() {
  const [form, setForm] = useState(initialForm);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function handleMediaChange(event) {
    const chosen = Array.from(event.target.files || []);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'];
    if (chosen.length > 8) { setError('You can add at most eight photos or videos.'); event.target.value = ''; return; }
    if (chosen.some((file) => !allowed.includes(file.type) || (file.type.startsWith('image/') && file.size > 1.5 * 1024 * 1024) || (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024))) {
      setError('Use JPG, PNG, WEBP, AVIF photos up to 1.5 MB, or MP4/WebM videos up to 50 MB.'); event.target.value = ''; return;
    }
    setError(''); setMediaFiles(chosen); event.target.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!mediaFiles.length) { setError('Add at least one property photo or video.'); return; }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    mediaFiles.forEach((file) => body.append('media', file));
    setSubmitting(true);
    try {
      await api('/api/inquiries', { method: 'POST', body });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  function handleReset() {
    setForm(initialForm);
    setMediaFiles([]);
    setSubmitted(false);
    setError('');
  }

  return (
    <main className="list-property-page">
      {/* HERO */}
      <section className="list-property-hero">
        <div className="list-property-hero__content">
          <span>SELL WITH ZILLOWELITE</span>
          <h1>Put your property in front of the right buyers.</h1>
          <p>
            List your property with ZillowElite and connect with
            people searching for their next home or investment.
          </p>

          <a href="#listing-form">Start Your Listing</a>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="list-property-intro">
        <span className="list-property-label">PROPERTY LISTING</span>
        <h2>Tell us about your property</h2>
        <p>
          Complete the form below with accurate property details.
          Our team can review your submission before it is published.
        </p>
      </section>

      {/* SUCCESS MESSAGE */}
      {submitted && (
        <section className="listing-success" role="status">
          <div className="listing-success__icon">✓</div>
          <div>
            <h2>Listing details received!</h2>
            <p>
              Your property details and media were sent to the Zillow Elite team for review. We will contact you using the information you provided.
            </p>
            <button type="button" onClick={handleReset}>
              Submit another property
            </button>
          </div>
        </section>
      )}

      {/* LISTING FORM */}
      {!submitted && (
        <section id="listing-form" className="list-property-form-section">
          <form className="list-property-form" onSubmit={handleSubmit}>
            {error && <p className="listing-form-error" role="alert">{error}</p>}
            {/* CONTACT INFORMATION */}
            <div className="listing-form-heading">
              <span>01</span>
              <div>
                <h2>Your contact information</h2>
                <p>Let us know how to reach you.</p>
              </div>
            </div>

            <div className="listing-form-grid">
              <div className="listing-field">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="listing-field">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="listing-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="listing-form-divider" />

            {/* PROPERTY INFORMATION */}
            <div className="listing-form-heading">
              <span>02</span>
              <div>
                <h2>Property information</h2>
                <p>Provide the main details of the property.</p>
              </div>
            </div>

            <div className="listing-form-grid">
              <div className="listing-field listing-field--full">
                <label htmlFor="title">Property Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Modern 4 Bedroom Family Home"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="listing-field">
                <label htmlFor="propertyType">Property Type *</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={form.propertyType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select property type</option>
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Land">Land</option>
                  <option value="Commercial">Commercial Property</option>
                </select>
              </div>

              <div className="listing-field">
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a city</option>
                  <option value="Los Angeles">Los Angeles, CA</option>
                  <option value="New York">New York, NY</option>
                  <option value="Miami">Miami, FL</option>
                  <option value="Austin">Austin, TX</option>
                  <option value="Chicago">Chicago, IL</option>
                  <option value="Phoenix">Phoenix, AZ</option>
                  <option value="Houston">Houston, TX</option>
                  <option value="Dallas">Dallas, TX</option>
                  <option value="Atlanta">Atlanta, GA</option>
                  <option value="Seattle">Seattle, WA</option>
                </select>
              </div>

              <div className="listing-field listing-field--full">
                <label htmlFor="address">Street Address *</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter the property's street address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="listing-field">
                <label htmlFor="price">Asking Price (USD) *</label>
                <div className="listing-price-input">
                  <span>$</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="1"
                    step="1000"
                    placeholder="500000"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="listing-field">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  placeholder="e.g. 4"
                  value={form.bedrooms}
                  onChange={handleChange}
                />
              </div>

              <div className="listing-field">
                <label htmlFor="bathrooms">Bathrooms</label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  placeholder="e.g. 3"
                  value={form.bathrooms}
                  onChange={handleChange}
                />
              </div>

              <div className="listing-field">
                <label htmlFor="kitchens">Kitchens</label>
                <input id="kitchens" name="kitchens" type="number" min="0" max="100" value={form.kitchens} onChange={handleChange} />
              </div>

              <div className="listing-field listing-field--full">
                <label htmlFor="description">Property Description *</label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  placeholder="Describe the property, its features, condition and nearby amenities..."
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="listing-form-divider" />

            {/* PROPERTY MEDIA */}
            <div className="listing-form-heading">
              <span>03</span>
              <div>
                <h2>Property photographs and video</h2>
                <p>Add up to eight photos or videos to show buyers your property.</p>
              </div>
            </div>

            <div className="listing-upload">
              <label htmlFor="propertyMedia">
                <span className="listing-upload-icon">↑</span>
                <strong>
                  {mediaFiles.length ? `${mediaFiles.length} file(s) selected` : "Choose property photos or videos"}
                </strong>
                <span>
                  {mediaFiles.length ? mediaFiles.map((file) => file.name).join(', ') : "Select up to 8 JPEG/PNG/WEBP/AVIF photos or MP4/WebM videos"}
                </span>
                <input
                  id="propertyMedia"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  multiple
                  onChange={handleMediaChange}
                />
              </label>
            </div>

            <p className="listing-form-note">
              Photos must be 1.5 MB or smaller each. Videos must be MP4 or WebM and 50 MB or smaller each. Submitted files are stored with the property request.
            </p>

            <div className="listing-submit-area">
              <p>
                By submitting, you confirm that the information provided
                is accurate and that you are authorised to list this property.
              </p>

              <button type="submit" className="listing-submit-button" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Property Details'}
                <span>→</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* BOTTOM INFORMATION */}
      <section className="list-property-benefits">
        <div>
          <span className="list-property-label">WHY LIST WITH US?</span>
          <h2>A simpler way to showcase your property.</h2>
        </div>

        <div className="list-property-benefits-grid">
          <article>
            <span>01</span>
            <h3>Reach more buyers</h3>
            <p>
              Present your property to people actively exploring
              real estate opportunities.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Showcase your property</h3>
            <p>
              Share important details, features and photographs
              to help buyers understand your listing.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Get connected</h3>
            <p>
              Make it easier for interested buyers to take the next step
              and contact you.
            </p>
          </article>
        </div>
      </section>
      <RealEstateFooter />
    </main>
  );
}
