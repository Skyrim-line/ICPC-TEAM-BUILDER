// /app/layout.jsx
import "./globals.css";
import { AuthProvider } from "./context/authcontext";
// import { RoleProvider } from "./context/rolecontext";
import { ProgressProvider } from "./context/progresscontext";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* <RoleProvider> */}
          <ProgressProvider>{children}</ProgressProvider>
          {/* </RoleProvider> */}
        </AuthProvider>
      </body>
    </html>
  );
}
