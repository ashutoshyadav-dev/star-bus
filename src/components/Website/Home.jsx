import Hero from "../Website/Hero";
import Services from "./Services";
import Fleet from "./Fleet";
import HowItWorks from "./HowItWorks";
import Gallery from "./Gallery";
import FAQ from "./FAQ";
import NoticePopup from "./NoticePopup";
import { useEffect } from "react";

function Home() {
  useEffect(() => {
    document.title = "Home | APSTS Portal";
  }, []);
  return (
    <>
      <NoticePopup />
      <Hero />
      <Services />
      <Fleet />
      <HowItWorks />
      <Gallery />   
      <FAQ />
      

    
    </>
  );
}

export default Home;