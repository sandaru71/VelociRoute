import { getFirebaseApp } from "./firebase";
import {getAuth} from "firebase/auth";
import{
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  
} from "firebase/auth";
import {child,getDatabase} from "firebase/database";
import { AsyncStorage } from "@react-native-async-storage/async-storage";

export const SignUp = (email,password)=>{
  return async (dispatch)=>{
    const app = getFirebaseApp();
    const auth = getAuth(app);

    try{
      const result = await createUserWithEmailAndPassword (
        auth,
        email,
        password,
      );

      const {uid , ststTokenManager} =  result.user;
      const{accessToken,expirationTime}= ststTokenManager
      const expiryDate = new Date(expirationTime);

      const createUser = async(email,)

    }catch(error){

    }

  
}
}