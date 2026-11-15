import { useEffect, useRef } from "react";
import RestaurantAbout from "./inspections/RestaurantAbout.jsx";
import "./About.css";

function About() {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="about-page">
      <header className="about-page__header">
        <h1 ref={headingRef} tabIndex={-1}>
          About SafeBite
        </h1>
      </header>

      <RestaurantAbout />
    </main>
  );
}

About.propTypes = {};

export default About;
