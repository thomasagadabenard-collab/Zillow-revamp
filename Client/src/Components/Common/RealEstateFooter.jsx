import logo from '../../assets/zillowelite-logo-house.png'
import "../../css/RealEstateFooter.css";

const footerLinks = [
  "News",
  "Research",
  "Careers",
  "Applicant Privacy Notice",
  "Help",
  "Advertise",
  "Fair Housing Guide",
  "Terms of use",
  "Privacy Notice",
  "Ad Choices",
  "Cookie Preference",
  "Learn",
  "AI",
];

export default function RealEstateFooter() {
  return (
    <footer className="real-estate-footer">
      <div className="real-estate-footer__contact">
        <strong>Contact</strong>
        <a href="mailto:support@site.com">
          <span className="real-estate-footer__mail-icon" aria-hidden="true">✉</span>
          support@ZillowElite.com
        </a>
      </div>

      <p className="real-estate-footer__recommendations">
        Recommendations are based on your location and search activity, such as the homes you’ve viewed and saved and the filters you’ve used. We use this information to bring similar homes to your attention, so you don’t miss out.
      </p>

      <nav className="real-estate-footer__nav" aria-label="Footer links">
        {footerLinks.map((link) => (
          <a href="#" key={link}>{link}</a>
        ))}
      </nav>

      <div className="real-estate-footer__legal">
        <p>
          Zillow Elite is committed to ensuring digital accessibility for individuals with disabilities. We are continuously working to improve the accessibility of our web experience for everyone, and we welcome feedback and accommodation requests. If you wish to report an issue or seek an accommodation, please let us know.
        </p>

        <p className="real-estate-footer__disclosure-heading">
          Affiliated Business Arrangement Disclosure
        </p>

        <p>
          Zillow Elite, Inc. holds real estate brokerage licenses in multiple states. Zillow Elite (Canada), Inc. holds real estate brokerage licenses in multiple provinces. All mortgage lending products and information provided by Zillow Elite Home Loans, NMLS #00287. NMLS Consumer Access
          <br />
          Licensed Mortgage Banker, N.Y.S. Department of Financial Services
          <br />
          261 Michelson Drive, Suite 1201, Irvine, CA 92612 | Equal Housing Lender | Licensing Information
          <br />
          § 412-H New York Standard Operating Procedures
          <br />
          § New York Fair Housing Notice
          <br />
          TREC: Information about brokerage services, Consumer protection notice
          <br />
          California DRE #1512344
          <br />
          Contact Zillow Elite, Inc. Brokerage
        </p>

        <p>
          For listings in Canada, the trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by the Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.
        </p>
      </div>

      <button className="real-estate-footer__language" type="button" aria-label="Language: English">
        <span className="real-estate-footer__flag" aria-hidden="true"><i /></span>
        <span>EN</span>
        <span className="real-estate-footer__chevron" aria-hidden="true" />
      </button>

      <div className="footer-logo">
        <img src={logo} alt="Company logo" />
      </div>

      <p className="copyright">© 2026. All rights reserved.</p>

    </footer>
  );
}
