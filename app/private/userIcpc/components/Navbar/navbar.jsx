import React from "react";
import "/node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./navbar.css";
import SPCA from "../img/SPCA.png";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="navbar-custom">
      <div>
        <Image src={SPCA} alt="ICPC-icon" className="icpc-logo" />
      </div>
      <ul className="nav">
        <li className="nav-item">
          <a className="nav-link active" aria-current="page" href="#">
            Home
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">
            News
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">
            Contact Us
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">
            Disabled
          </a>
        </li>
      </ul>
      <div className="button-style">
        <Link href="/public/login">
          <button className="btn btn-primary">Sign In</button>
        </Link>
        <Link href="/public/register">
          <button className="btn btn-secondary">Sign Up</button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
