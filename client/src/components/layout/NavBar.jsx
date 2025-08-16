

import { Link } from 'react-router-dom';
import logo from "../../assets/images/plainb-logo.svg";

import UserStore from '../../store/UserStore.js';
import UserSubmitButton from '../user/UserSubmitButton.jsx';

function NavBar() {
  const { isLogin, UserLogoutRequest } = UserStore();

  const onLogout = async () => {
    await UserLogoutRequest();
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      {/* Top info bar */}
      <div className="container-fluid text-white p-2 bg-success">
        <div className="container">
          <div className="row justify-content-around">
            <div className="col-md-6">
              <span>
                <span className="f-12">
                  <i className="bi bi-envelope"></i> Support@WaterPlane.com{" "}
                </span>
                <span className="f-12 mx-2">
                  <i className="bi bi-telephone"></i> 01887905213{" "}
                </span>
              </span>
            </div>
            <div className="col-md-6">
              <span className="float-end">
                {/* WhatsApp link */}
                <a
                  href="https://wa.me/8801887905213"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bodySmal mx-2 text-white"
                >
                  <i className="bi bi-whatsapp"></i>
                </a>
                {/* YouTube link */}
                <a
                  href="https://www.youtube.com/@TechStudyCell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bodySmal mx-2 text-white"
                >
                  <i className="bi bi-youtube"></i>
                </a>
                {/* Facebook link */}
                <a
                  href="https://www.facebook.com/profile.php?id=61577731617761"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bodySmal text-white"
                >
                  <i className="bi bi-facebook"></i>
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="navbar sticky-top bg-white navbar-expand-lg navbar-light py-3">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img className="img-fluid" src={logo} alt="Logo" width="96px" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nav06"
            aria-controls="nav06"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="nav06">
            <ul className="navbar-nav mt-3 mt-lg-0 mb-3 mb-lg-0 ms-lg-3">
              <span className="nav-item me-4">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </span>
            </ul>
          </div>

          <div className="d-lg-flex">
            {/* Analysis Icon */}
            {isLogin() ? (
              <Link
                to="/analysis"
                type="button"
                className="btn ms-2 btn-light position-relative"
              >
                <i className="bi text-dark bi-graph-up"></i>
              </Link>
            ) : (
              <Link
                to="/login"
                type="button"
                className="btn ms-2 btn-light position-relative"
              >
                <i className="bi text-dark bi-graph-up"></i>
              </Link>
            )}

            {/* Tracking Icon */}
            {isLogin() ? (
              <Link
                to="/alarms"
                type="button"
                className="btn ms-2 btn-light d-flex"
              >
                <i class="bi bi-calendar2-minus"></i>
              </Link>
            ) : (
              <Link
                to="/login"
                type="button"
                className="btn ms-2 btn-light d-flex"
              >
              <i class="bi bi-calendar2-minus"></i>
              </Link>
            )}

            {/* Profile */}
            <Link
              type="button"
              className="btn ms-3 btn-success d-flex"
              to="/profile"
            >
              Profile
            </Link>

            {/* Login / Logout */}
            {isLogin() ? (
              <UserSubmitButton
                onClick={onLogout}
                text="Logout"
                className="btn ms-3 btn-success d-flex"
              />
            ) : (
              <Link
                type="button"
                className="btn ms-3 btn-success d-flex"
                to="/login"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;
