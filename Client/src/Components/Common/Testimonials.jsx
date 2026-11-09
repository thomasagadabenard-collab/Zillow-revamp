import "../../css/Testimonials.css";

const testimonials = [
  {
    quote:
      "Zillow Elite made buying our dream home so easy. The photo download feature was a game-changer — we could review everything easily before scheduling tours.",
    initials: "SM",
    name: "Sarah M.",
    location: "Austin, TX",
  },
  {
    quote:
      "I knew my budget and preferred location. Zillow Elite helped me find the right options without endless scrolling. The search filters saved me hours of browsing.",
    initials: "JT",
    name: "James T.",
    location: "New York, NY",
  },
  {
    quote:
      "Relocated from Chicago and bought our beachside retreat entirely through Zillow Elite. Verified listings gave us real peace of mind. Closed in 28 days!",
    initials: "ER",
    name: "Elena R.",
    location: "Miami, FL",
  },
];

function TestimonialCard({ quote, initials, name, location }) {
  return (
    <article className="testimonial-card">
      <div className="testimonial-card__stars" aria-label="5 out of 5 stars">
        <span aria-hidden="true">★★★★★</span>
      </div>
      <blockquote className="testimonial-card__quote">“{quote}”</blockquote>
      <div className="testimonial-card__author">
        <div className="testimonial-card__avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="testimonial-card__identity">
          <div className="testimonial-card__name">{name}</div>
          <div className="testimonial-card__location">{location}</div>
        </div>
      </div>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <header className="testimonials__header">
        <div className="testimonials__eyebrow">SUCCESS STORIES</div>
        <h2 className="testimonials__title" id="testimonials-title">
          Trusted by Homeowners Nationwide
        </h2>
        <p className="testimonials__subtitle">
          Testimonials from people who found their perfect home with Zillow Elite
        </p>
      </header>
      <div className="testimonials__grid">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.initials} {...testimonial} />
        ))}
      </div>
    </section>
  );
}
