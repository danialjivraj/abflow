import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import googleIcon from "../assets/google-icon.png";

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Login Error:", err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          <img src={googleIcon} alt="Google Icon" className="google-icon" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
