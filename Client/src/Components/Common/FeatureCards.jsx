import "../../css/FeatureCards.css";
import { Link } from 'react-router-dom';
import invest from "../../assets/HomeInvest.png";
import finance from '../../assets/HomeFinance.png';
import HomeSearch from '../../assets/HomeSearch.png';

const features = [
  {
    image: HomeSearch,
    imageAlt: "Illustration of a house with keys",
    title: "Find Your Perfect Home",
    description:
      "Explore a wide range of properties and find a place that truly feels like home. From search to closing, we make the entire buying process simple, smooth, and stress-free.",
    button: "Explore Homes",
  },
  {
    image: finance,
    imageAlt: "Illustration of mortgage financing for a home",
    title: "Finance Your Next Home",
    description:
      "Turn your dream of homeownership into reality with flexible mortgage solutions. Get access to competitive rates, simple applications, and guidance every step of the way.",
    button: "Explore Loan Options",
  },
  {
    image: invest,
    imageAlt: "Illustration of real estate investment and growth",
    title: "Invest in Real Estate",
    description:
      "Build wealth through real estate investments. Access expertly managed portfolios where your capital is diversified across construction, rental income, and land banking opportunities.",
    button: "Explore Opportunities",
  },
];

export default function FeatureCards() {
  return (
    <section className="feature-cards" aria-label="Real estate services">
      {features.map((feature) => (
        <article className="feature-card" key={feature.title}>
          <img
            className="feature-card__image"
            src={feature.image}
            alt={feature.imageAlt}
          />
          <h2 className="feature-card__title">{feature.title}</h2>
          <p className="feature-card__description">{feature.description}</p>
          <Link className="feature-card__button" to="/dashboard">
            {feature.button}
          </Link>
        </article>
      ))}
    </section>
  );
}
