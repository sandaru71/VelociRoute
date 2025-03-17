// import { createContext, useState, useContext } from 'react';
// import { router } from 'expo-router';

// const AuthContext = createContext({});

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const signIn = async (email, password) => {
//     try {
//       setLoading(true);
//       // TODO: Implement actual authentication logic here
//       setUser({ email });
//       router.replace('/(app)/(tabs)/');
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signOut = () => {
//     setUser(null);
//     router.replace('/(auth)/login');
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }
