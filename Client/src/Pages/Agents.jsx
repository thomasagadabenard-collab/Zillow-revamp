import { useState } from "react";
import "../css/Agents.css";
import RealEstateFooter from "../Components/Common/RealEstateFooter";

const agents = [
  {
    id: 1,
    name: "James Anderson",
    role: "Senior Property Consultant",
    location: "Beverly Hills, Los Angeles",
    speciality: "Luxury Homes",
    phone: "+1 202 555 0101",
    initials: "JA",
    color: "blue",
  },
  {
    id: 2,
    name: "Emily Carter",
    role: "Real Estate Advisor",
    location: "Manhattan, New York",
    speciality: "Residential Properties",
    phone: "+1 202 555 0102",
    initials: "EC",
    color: "purple",
  },
  {
    id: 3,
    name: "Michael Thompson",
    role: "Property Investment Consultant",
    location: "Miami, Florida",
    speciality: "Property Investment",
    phone: "+1 202 555 0103",
    initials: "MT",
    color: "orange",
  },
  {
    id: 4,
    name: "Sophia Mitchell",
    role: "Real Estate Consultant",
    location: "Austin, Texas",
    speciality: "Apartments",
    phone: "+1 202 555 0104",
    initials: "SM",
    color: "green",
  },
];

export default function Agents() {
  const [search, setSearch] = useState("");

  const filteredAgents = agents.filter((agent) => {
    const searchText = search.toLowerCase();

    return (
      agent.name.toLowerCase().includes(searchText) ||
      agent.location.toLowerCase().includes(searchText) ||
      agent.speciality.toLowerCase().includes(searchText)
    );
  });

  return (
    <main className="agents-page">
      <section className="agents-hero">
        <div className="agents-hero__content">
          <span>THE PEOPLE BEHIND YOUR NEXT MOVE</span>
          <h1>Meet our real estate professionals.</h1>
          <p>
            Find knowledgeable property professionals who can help
            guide you through your real estate journey.
          </p>
        </div>
      </section>

      <section className="agents-intro">
        <div>
          <span className="agents-section-label">
            OUR PROFESSIONAL NETWORK
          </span>
          <h2>Find the right agent for your needs</h2>
          <p>
            Whether you're buying a home or exploring an investment,
            connect with a professional who understands your market.
          </p>
        </div>

        <div className="agents-search">
          <label htmlFor="agent-search">Search agents</label>
          <input
            id="agent-search"
            type="search"
            placeholder="Search by name, location or speciality..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="agents-directory">
        <div className="agents-directory__heading">
          <h2>Our agents</h2>
          <span>{filteredAgents.length} agents</span>
        </div>

        {filteredAgents.length > 0 ? (
          <div className="agents-grid">
            {filteredAgents.map((agent) => (
              <article className="agent-card" key={agent.id}>
                <div className={`agent-avatar agent-avatar--${agent.color}`}>
                  {agent.initials}
                </div>

                <span className="agent-speciality">
                  {agent.speciality}
                </span>

                <h3>{agent.name}</h3>
                <p className="agent-role">{agent.role}</p>

                <div className="agent-location">
                  <span>⌖</span>
                  {agent.location}
                </div>

                <a
                  className="agent-contact"
                  href={`https://wa.me/${agent.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact Agent
                  <span>→</span>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="agents-empty">
            <h3>No agents found</h3>
            <p>Try searching with a different name or location.</p>
          </div>
        )}
      </section>

      <section className="agents-cta">
        <div>
          <span>WORK WITH ZILLOWELITE</span>
          <h2>Are you a real estate professional?</h2>
          <p>
            Interested in joining our professional network?
            Get in touch with our team.
          </p>
        </div>

        <a href="mailto:info@zillowelite.com">
          Contact Our Team
        </a>
      </section>
      <RealEstateFooter />
    </main>
  );
}
