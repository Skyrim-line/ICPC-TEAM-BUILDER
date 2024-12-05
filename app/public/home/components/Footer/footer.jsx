import "./footer.css";
import Image from "next/image";
import Logo from "../img/Logo.png";
import { Button } from "antd";
import Link from "next/link";

const Footer = () => {
  return (
    <div className="footer">
      <div className="content">
        <div className="info">
          <div className="logo-description">
            <Image src={Logo} alt="ICPC" width={175} height={175} />
          </div>
          <div className="product">
            <p className="product-text common-text">Product</p>
            <p className="product-text-2 common-text">Overview</p>
            <p className="product-text-2 common-text">Customer Service</p>
            <p className="product-text-2 common-text">Join Team</p>
          </div>

          <div className="resources">
            <p className="product-text common-text">Resources</p>
            <p className="product-text-2 common-text">Blog</p>
            <p className="product-text-2 common-text">Guides & Tutorials</p>
            <p className="product-text-2 common-text">Help Center</p>
          </div>

          <div className="company">
            <p className="product-text common-text">Company</p>
            <p className="product-text-2 common-text">About Us</p>
            <p className="product-text-2 common-text">Contact Us</p>
            <p className="product-text-2 common-text">Careers</p>
          </div>

          <div className="try-button">
            <h5 className="product-text" style={{ fontSize: 25 }}>
              Join A Team Today{" "}
            </h5>
            <p className="try-text">
              Join a team now use our latest AI-Match tools
            </p>
            <Link href="/public/register">
              <Button type="primary">Register Now</Button>
            </Link>
          </div>
          <div className="line"></div>
        </div>

        <div className="btm">
          <div className="Terms">
            <p className="terms-text">Terms of Service</p>
            <p className="terms-text">Privacy Policy</p>
            <p className="terms-text">Security</p>
            <p className="terms-text">@2024 ICPC Team Builder </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
