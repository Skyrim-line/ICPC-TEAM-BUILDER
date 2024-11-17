import React from "react";
import "/node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./navbar.css";
import Logo from "../img/Logo.png";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="navbar-custom">
      <div>
        <Image src={Logo} alt="ICPC-icon" width={175} height={175} />
      </div>
      <ul className="nav">
        <li className="nav-item">
          <a className="nav-link active" aria-current="page" href="#">
            <Link href="/public/home">
              <span style={{ fontSize: "22px", color: "white" }}>Home</span>
            </Link>
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">
            <Link href="https://icpc.global/">
              <span style={{ fontSize: "22px", color: "white" }}>ICPC</span>
            </Link>
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#about">
            <span style={{ fontSize: "22px", color: "white" }}>About</span>
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#help">
            <span style={{ fontSize: "22px", color: "white" }}>Help</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
