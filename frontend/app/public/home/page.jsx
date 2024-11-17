"use client";

import React from "react";
import { Typography, Button } from "antd";
import Image from "next/image";
import UNSW from "../img/UNSW.jpg";
import userGuide from "../img/User Guide - Home Page.png";
import UNSW2 from "../img/PIC-2.jpg";
import "./home.css";
import Navbar from "./components/Navbar/navbar";
import Footer from "./components/Footer/footer";
import Link from "next/link";

const { Title } = Typography;

const Home = () => {
  return (
    <div>
      <Navbar />
      {/* First part - login and register */}
      <div className="welcome-container">
        {/* Left Side - Text Content */}
        <div className="welcome-left-container">
          <div className="container">Welcome!</div>
          <Title level={2} style={{ color: "white" }}>
            To Our ICPC Team Builder System
          </Title>

          <Link href="/public/login">
            <Button className="login-button">Sign In</Button>
          </Link>
          <Link href="/public/register">
            <Button className="register-button">Sign Up</Button>
          </Link>
        </div>
        {/* right Side - Image */}
        <Image src={UNSW} alt="Image Container" className="welcome-image" />
      </div>

      {/* Second part - User guide */}
      <div className="User-guide-container" id="help">
        <div className="user-guide-title-container">
          <Title level={1} style={{ color: "black" }}>
            Here is a quick guide to get you started building your team
          </Title>
        </div>
        <div className="user-guide-image-container">
          <Image src={userGuide} alt="User Guide Image" />
        </div>
        <Link href="/public/register">
          <Button className="register-now-button">Register now →</Button>
        </Link>
      </div>

      {/* Third part - About ICPC，white background */}
      <div className="about-icpc-container" id="about">
        <Image src={UNSW2} alt="Work Together Image" className="icpc-image" />
        <div className="about-icpc-text-container">
          <div className="about-icpc-heading-container">
            <h1 className="container-2">About ICPC</h1>
          </div>
          <p className="about-icpc-text">
            The International Collegiate Programming Contest is an algorithmic
            programming contest for college students. Teams of three,
            representing their university, work to solve the most real-world
            problems, fostering collaboration, creativity, innovation, and the
            ability to perform under pressure. Through training and competition,
            teams challenge each other to raise the bar on the possible. Quite
            simply, it is the oldest, largest, and most prestigious programming
            contest in the world.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
