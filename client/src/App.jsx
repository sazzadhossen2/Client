
// import {BrowserRouter, Route, Routes} from "react-router-dom"

// import LoginPage from "./pages/LoginPage"
// import OtpPage from "./pages/OtpPage"
// import ProfileScreen from "./pages/ProfileScreen"

// import InvoicePage from "./pages/InvoicePage"

// import AlarmsAndAlertsPage from "./pages/AlarmsAndAlertsPage"
// import WaterLevelDashboardPage from "./pages/WaterLevelDashboardPage"
// import WaterAnalyticsPage from "./pages/WaterAnalyticsPage"
// function App() {


//   return <BrowserRouter>
//   <Routes>
//     <Route path="/" element={<WaterLevelDashboardPage />} />
//     {/* <Route path="/by-brand/:id" element={<ProductByBrand />} /> */}
//     <Route path="/login" element={<LoginPage />} />
//     <Route path="/otp" element={<OtpPage />} />
//     <Route path="/profile" element={<ProfileScreen />} />
//     {/* <Route path="/product-details/:id" element={<ProductDetailsPage />} /> */}
//     <Route path="/analysis" element={<AlarmsAndAlertsPage />} />
//     <Route path="/payment" element={<InvoicePage/>}/>
//     <Route path="/alarms" element={<WaterAnalyticsPage/>} />
    
//   </Routes>
//   </BrowserRouter>
// }

// export default App


// src/App.js
import React from "react";
import { auth } from "../src/firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

function App() {
  const provider = new GoogleAuthProvider();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User Info:", result.user);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    console.log("User Logged Out");
  };

  return (
    <div>
      <h1>Firebase React Example</h1>
      <button onClick={handleLogin}>Login with Google</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default App;
