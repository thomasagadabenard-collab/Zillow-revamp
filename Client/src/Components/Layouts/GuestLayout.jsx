import Hero from '../Common/Hero';
import StatsStrip from '../Common/StatsStrip';
import FeatureCards from '../Common/FeatureCards';
import Testimonials from '../Common/Testimonials';
import RealEstateFooter from '../Common/RealEstateFooter';

const GuestLayout = ({ onSignIn }) => {
  return (
    <div>
      <Hero onSignIn={onSignIn} />
      <StatsStrip />
      <FeatureCards />
      <Testimonials />
      <RealEstateFooter />
    </div>
  );
};

export default GuestLayout;