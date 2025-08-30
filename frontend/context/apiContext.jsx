import { createContext, useState } from "react";

// Create Context
export const ApiContext = createContext();

// Create Provider
export const ApiProvider = ({ children }) => {
  const [api, setApi] = useState("http://localhost:3000/api"); // shared state

  return (
    <ApiContext.Provider value={{ api, setApi }}>
      {children}
    </ApiContext.Provider>
  );
};
