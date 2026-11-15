import "./RestaurantFooter.css";

function RestaurantFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="restaurant-footer" aria-label="Restaurant page footer">
      <div className="restaurant-footer__inner">
        <p>© {year} SafeBite</p>

        <nav aria-label="Restaurant footer">
          <a
            href="https://github.com/saniaanwar/safebite"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>

          <a
            href="https://data.boston.gov/dataset/food-establishment-inspections"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Boston ISD food establishment inspections dataset"
          >
            Boston ISD
          </a>

          <a href="#main-content">Back to top</a>
        </nav>
      </div>
    </footer>
  );
}

RestaurantFooter.propTypes = {};

export default RestaurantFooter;
