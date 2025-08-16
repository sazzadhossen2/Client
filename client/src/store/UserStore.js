import axios from 'axios';
import { create } from 'zustand';
import Cookies from 'js-cookie';
import { getEmail, setEmail } from "../utility/utility.js";
 const UserStore = create((set)=>({

  isLogin:()=>{
    return !! Cookies.get("token");
  },
  
isFormSubmit:false,
LoginFormData:{email:""},
LoginFormOnChange:(name,value)=>{
  set((state)=>({
LoginFormData:{
      ...state.LoginFormData,
    [name]:value
}
  }))
},

UserOTPRequest:async(email)=>{
  set({isFormSubmit:true});
  let res =await axios.get(`/api/v1/UserOTP/${email}`);
  setEmail(email);
  set({isFormSubmit:false});
  return res.data["status"]=== "Success";
},


OTPFormData:{otp:""},
OTPFormONChange:(name,value)=>{
  set((state)=>(
    {
      OTPFormData:{...state.OTPFormData,[name]:value}
    }
  ))
},

VerifyLoginRequest:async(otp)=>{
  set({isFormSubmit:true});
  let email =getEmail();
  let res =await axios.get(`/api/v1/VerifyLogin/${email}/${otp}`);
  set({isFormSubmit:false});
  return res.data["status"]=== "Success";
},

UserLogoutRequest:async()=>{
  set({isFormSubmit:true});
  let res =await axios.get(`/api/v1/UserLogout`);

  set({isFormSubmit:false});
  return res.data["status"]=== "success";
}
 }));

 export default UserStore;