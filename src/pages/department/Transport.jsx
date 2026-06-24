import Header from "../../components/department/Header";
import HeroSection from "../../components/department/HeroSection";
import AboutSection from "../../components/department/AboutSection";
import RolesResponsibilities from "../../components/department/RolesResponsibilities";
import ServicesOffered from "../../components/department/ServicesOffered";
import ActsRegulations from "../../components/department/ActsRegulations";
import DTOOffice from "../../components/department/DTOOffice";
import Footer from "../../components/Website/Footer";


const Transport = () => {
  return (
    <>
      <Header />
      <HeroSection />
      <AboutSection />
      <RolesResponsibilities />
      <ServicesOffered />

      <div className="grid gap-8 px-6 py-16 mx-auto max-w-7xl lg:grid-cols-2">
        <ActsRegulations />
        <DTOOffice />
      </div>

      <Footer />
    </>
  );
};

export default Transport;