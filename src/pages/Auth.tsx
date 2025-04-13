
import { useState } from "react";
import { LoginForm } from "@/components/Auth/LoginForm";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { useUserStore } from "@/store/userStore";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useUserStore();
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
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
