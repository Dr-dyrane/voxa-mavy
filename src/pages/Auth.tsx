
import { useState, useEffect } from "react";
import { LoginForm } from "@/components/Auth/LoginForm";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };
  
  useEffect(() => {
    // This effect will run whenever isAuthenticated changes
    if (isAuthenticated && !isLoading) {
      console.log("Auth page: User is authenticated, redirecting to /chat");
      navigate("/chat", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // This provides an immediate redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    console.log("Auth page: Immediate redirect to /chat");
    return <Navigate to="/chat" replace />;
  }
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="z-10 w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleForm={toggleForm} />
        ) : (
          <RegisterForm onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
}
