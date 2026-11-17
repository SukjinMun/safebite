import { Link } from "react-router-dom";
import "./RecallsAbout.css";

function RecallsAbout() {
  return (
    <section className="recalls-about" aria-labelledby="recalls-about-title">
      <h2 id="recalls-about-title">Food recalls &amp; grocery list</h2>

      <p className="recalls-about__intro">
        Check whether groceries you have bought have been recalled. Browse
        recalls by category, search for a product or brand, and build a grocery
        list that flags any items matching a recall.
      </p>

      <ul className="recalls-about__features">
        <li>
          <h3>Browse and search</h3>
          <p>
            Filter recalls across ten grocery categories, or search by product
            or brand. Recalls are listed by category, then alphabetically.
          </p>
        </li>

        <li>
          <h3>Understand the risk</h3>
          <p>
            Class I recalls are the most serious and could cause serious health
            problems. Class II may cause temporary problems, and Class III is
            unlikely to cause harm.
          </p>
        </li>

        <li>
          <h3>Check your groceries</h3>
          <p>
            Sign in to create your own grocery list. Items that match a recall
            are flagged so you know what to throw away or return.
          </p>
        </li>
      </ul>

      <div className="recalls-about__data" id="recalls-data">
        <h3>About the recall data</h3>
        <p>
          Recall records were generated with a custom seed script and follow the
          structure of real FDA recall notices, including classification,
          status, lot codes, and distribution. The products, brands, and
          companies are fictional.
        </p>

        <p>
          For official recalls, visit the{" "}
          <a
            href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
            target="_blank"
            rel="noopener noreferrer"
          >
            FDA recalls, market withdrawals, and safety alerts page
          </a>
          .
        </p>
      </div>

      <div className="recalls-about__actions">
        <p className="recalls-about__credit">
          Food recalls and grocery list by Sania Anwar.
        </p>

        <Link to="/recalls" className="recalls-about__link">
          Explore food recalls
        </Link>
      </div>
    </section>
  );
}

RecallsAbout.propTypes = {};

export default RecallsAbout;
