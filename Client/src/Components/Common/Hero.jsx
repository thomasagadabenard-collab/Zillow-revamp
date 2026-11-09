import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import '../../css/Hero.css';
import { Link } from 'react-router-dom';

const placeholderBackground =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2200&q=80";

export default function Hero({ onSignIn }) {
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .from(".hero__eyebrow", { y: 18, opacity: 0, duration: 0.7 })
        .from(".hero__title-line", { y: 42, opacity: 0, duration: 0.8, stagger: 0.12 }, "-=0.35")
        .from(".hero__description", { y: 22, opacity: 0, duration: 0.7 }, "-=0.42")
        .from(".hero__actions", { y: 20, opacity: 0, duration: 0.65 }, "-=0.38");

      gsap.to(".hero__background", {
        scale: 1.06,
        duration: 14,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }, heroRef);

    return () => context.revert();
  }, []);

  return (
    <main className="hero" ref={heroRef}>
      <div
        className="hero__background"
        style={{ backgroundImage: `url(${placeholderBackground})` }}
        aria-hidden="true"
      />
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__eyebrow">DISCOVER · FINANCE · OWN</p>

        <h1 className="hero__title" aria-label="Find Your Perfect Home to Own">
          <span className="hero__title-line">Find Your Perfect</span>
          <span className="hero__title-line">Home to Own</span>
        </h1>

        <p className="hero__description">
          Your All-in-One Real Estate Gateway.
          Buy your dream home, secure financing, or grow wealth through top-tier property investments.
        </p>

        <div className="hero__actions">
          <Link className="hero__primary-button" to="/dashboard">
            Browse Properties
          </Link>
          <button className="hero__secondary-button" type="button" onClick={onSignIn}>
            Sign In
          </button>
        </div>
      </div>
    </main>
  );
}
