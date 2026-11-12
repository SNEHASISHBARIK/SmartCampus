import { Link } from "react-router-dom";
import { FiCompass } from "react-icons/fi";

const CampusLife = () => {
  return (
    <div className="public-subpage-container">
      <div className="public-page-header">
        <div className="public-page-badge">Campus Life</div>
        <h1 className="public-page-title">Campus Life</h1>
        <p className="public-page-subtitle"></p>
      </div>

      <div className="public-blank-canvas">
        <div className="public-blank-icon">
          <FiCompass size={28} />
        </div>
        <h2 className="public-blank-title">Campus Life Page</h2>
        <p className="public-blank-note"></p>
        <Link to="/login" className="btn-get-started">
          <span>Login to Portal</span>
        </Link>
      </div>
    </div>
  );
};

export default CampusLife;
