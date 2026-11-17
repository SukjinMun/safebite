import PropTypes from "prop-types";
import "./SiteFooter.css";

function SiteFooter({ showFdaLink = false }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer__inner">
        <p>© {year} SafeBite</p>

        <nav aria-label="Footer">
          <a
            href="https://github.com/saniaanwar/safebite"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>

          {showFdaLink && (
            <a
              href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="FDA recalls, market withdrawals, and safety alerts"
            >
              FDA Recalls
            </a>
          )}

          <a href="#top">Back to top</a>
        </nav>
      </div>
    </footer>
  );
}

SiteFooter.propTypes = {
  showFdaLink: PropTypes.bool,
};

export default SiteFooter;
