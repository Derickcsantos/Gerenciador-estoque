import { Dashboard } from "@/components/Dashboard";
import { UserProvider } from "@/context/UserContext";

const Index = () => {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
};

export default Index;
