import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md mt-16">
        <div className="mb-16 flex justify-center">
          <img 
            src="/logo.png" 
            alt="ResourceHub Logo" 
            className="h-32 w-auto object-contain transform scale-[2.5]" 
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
