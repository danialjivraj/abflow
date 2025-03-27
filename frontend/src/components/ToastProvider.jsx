import { useEffect } from "react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastProvider = ({ darkMode }) => {
  useEffect(() => {
    const containers = document.querySelectorAll(".Toastify");
    containers.forEach(container => {
      container.setAttribute("data-theme", darkMode ? "dark" : "light");
    });
  }, [darkMode]);

  return (
    <ToastContainer
      position="top-center"
      autoClose={2000}
      theme={darkMode ? "dark" : "light"}
      transition={Slide}
      hideProgressBar={true}
      pauseOnHover={false}
    />
  );
};

export default ToastProvider;